from fastapi import FastAPI, WebSocket, Request
from pydantic import BaseModel
from app import matchmaker
from app.models import JoinRequest
from app import problems
from app.websocket.endpoint import websocket_endpoints
import requests
from fastapi.middleware.cors import CORSMiddleware
from app.database import SessionLocal, Problem
import subprocess
import tempfile
import os 
import json
from datetime import datetime
import httpx
from dotenv import load_dotenv
import base64
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI(title="LeetCode Duel")
load_dotenv()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    print("="*50)
    print("[VALIDATION ERROR]")
    print(f"Errors: {exc.errors()}")
    print(f"Request body: {body.decode()}")
    print("="*50)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )



@app.get("/")
def home():
    return {"message": "Welcome to LeetCode Duel!"}

@app.post("/join")
def join_queue(req: JoinRequest):
    matchmaking = matchmaker.add_player(req.username)
    print(req.username)
    if matchmaking:
        return {"status": "matched", "players": matchmaking}
    return {"status": "waiting"}

@app.get("/problem")
def get_problems():
    return problems.get_problem_for_match()

@app.websocket("/ws/{username}")
async def websocket_route(websocket: WebSocket, username: str):
    await websocket_endpoints(websocket, username)


class RunRequest(BaseModel):
    slug: str
    code: str
    language: str | None = "python"

#---------------------------------------------------------
# api to handle submission
RAPIDAPI_HOST = "judge0-ce.p.rapidapi.com"
RAPIDAPI_URL = f"https://{RAPIDAPI_HOST}/submissions"
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

import httpx
import base64
import json

@app.post("/run")
async def run_code(req: RunRequest):
    problem_slug = req.slug
    code = req.code
    language = req.language

    db = SessionLocal()
    problem = db.query(Problem).filter(Problem.slug == problem_slug).first()
    db.close()

    if not problem:
        return {"error": "problem not found"}
    
    # Language ID mapping for Judge0
    language_ids = {
        "python": 71,  # Python 3
        "javascript": 63,  # Node.js
        "cpp": 54,  # C++ (GCC 9.2.0)
        "java": 62,  # Java
        "c": 50,  # C (GCC 9.2.0)
    }
    
    language_id = language_ids.get(language, 71)  # Default to Python
    
    results = []

    async with httpx.AsyncClient() as client:
        for idx, case in enumerate(problem.testcases):
            input_data = case["input"].strip()
            expected_output = case["expected_output"].strip()

            # Don't modify user code - they handle everything
            user_code = code

            # DON'T use base64 encoding - use plain text
            submission_payload = {
                "language_id": language_id,
                "source_code": user_code,  # Plain text
                "stdin": input_data,  # Plain text
                "redirect_stderr_to_stdout": False,
            }

            headers = {
                "Content-Type": "application/json",
                "X-RapidAPI-Key": RAPIDAPI_KEY,
                "X-RapidAPI-Host": RAPIDAPI_HOST,
            }

            # Create submission WITHOUT base64_encoded parameter
            try:
                response = await client.post(
                    f"{RAPIDAPI_URL}?base64_encoded=false&wait=true",  # ← Changed to false
                    json=submission_payload,
                    headers=headers,
                    timeout=30.0
                )

                if response.status_code != 200 and response.status_code != 201:
                    results.append({
                        "input": input_data,
                        "expected": expected_output,
                        "output": None,
                        "passed": False,
                        "error": f"Submission failed with status {response.status_code}",
                        "status": "Submission Error"
                    })
                    continue

                result = response.json()
                
                # NO base64 decoding needed - Judge0 returns plain text
                stdout = (result.get("stdout") or "").strip()
                stderr = (result.get("stderr") or "").strip()
                compile_output = (result.get("compile_output") or "").strip()
                
                # Check status
                status_id = result.get("status", {}).get("id")
                status_desc = result.get("status", {}).get("description", "Unknown")
                
                # Status IDs: 3 = Accepted
                execution_success = status_id == 3
                
                # Parse output for comparison
                actual_output = stdout
                
                # Try to parse both as JSON for comparison
                try:
                    expected_parsed = json.loads(expected_output)
                    actual_parsed = json.loads(actual_output)
                    passed = expected_parsed == actual_parsed
                except (json.JSONDecodeError, ValueError):
                    # Fall back to string comparison
                    passed = actual_output == expected_output

                # Only mark as passed if execution succeeded AND output matches
                passed = execution_success and passed

                error_message = None
                if not execution_success:
                    error_message = stderr or compile_output or status_desc
                elif not passed:
                    error_message = "Output mismatch"

                results.append({
                    "input": input_data,
                    "expected": expected_output,
                    "output": actual_output,
                    "passed": passed,
                    "error": error_message,
                    "status": status_desc,
                })

            except httpx.TimeoutException:
                results.append({
                    "input": input_data,
                    "expected": expected_output,
                    "output": None,
                    "passed": False,
                    "error": "Execution timeout",
                    "status": "Timeout",
                })
            except Exception as e:
                results.append({
                    "input": input_data,
                    "expected": expected_output,
                    "output": None,
                    "passed": False,
                    "error": str(e),
                    "status": "Error",
                })

    all_passed = all(r["passed"] for r in results)
    return {"all_passed": all_passed, "results": results}




#-----------------------------------------------------------------------------------------
#helper func
async def finalize_duel(duel_key):
    # This will run automatically after both finish OR timer ends
    p1, p2 = duel_key
    print(f"Finalizing duel between {p1} and {p2}")

    # TODO: Check their test results
    # TODO: Call AI judge if both passed
    # TODO: Broadcast result via WebSocket

    print("Duel finished!")

@app.post("/finish")
async def finish_duel(payload: dict):
    username = payload.get("username")
    opponent = payload.get("opponent")

    if not username or not opponent:
        return {"error": "Missing username or opponent"}

    duel_key = tuple(sorted([username, opponent]))
    duel = duel_states.setdefault(duel_key, {"finished": set(), "start": datetime.utcnow(), "duration": 600})

    duel["finished"].add(username)

    # If both finished, trigger evaluation
    if len(duel["finished"]) == 2:
        await finalize_duel(duel_key)

    return {"message": f"{username} marked as finished"}
    

    






