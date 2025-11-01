from fastapi import FastAPI, WebSocket
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

app = FastAPI(title="LeetCode Duel")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    
    with tempfile.TemporaryDirectory() as tmpdir:
        filepath = os.path.join(tmpdir, "solution.py")

        with open(filepath, "w") as f:
            f.write(code)

            results = []
        for case in problem.testcases:
            input_data = case["input"]
            expected_output = case["expected_output"].strip()

            try:
                result = subprocess.run(
                    ["python", filepath],
                    input=input_data.encode(),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=3,
                )
                output = result.stdout.decode().strip()

                results.append({
                    "input": input_data.strip(),
                    "expected": expected_output,
                    "output": output,
                    "passed": output == expected_output,
                    "error": result.stderr.decode() if result.stderr else None
                })
            except subprocess.TimeoutExpired:
                results.append({
                    "input": input_data.strip(),
                    "expected": expected_output,
                    "output": None,
                    "passed": False,
                    "error": "Time limit exceeded"
                })

    all_passed = all(r["passed"] for r in results)
    return {"all_passed": all_passed, "results": results}
    

    






