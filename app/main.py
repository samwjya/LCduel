from fastapi import FastAPI, WebSocket
from app import matchmaker
from app.models import JoinRequest
from app import problems
from app.websocket.endpoint import websocket_endpoints
import requests
from fastapi.middleware.cors import CORSMiddleware

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

@app.post("/run")
def run_code(req: dict):
    url = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true"
    payload = {
        "source_code": req["code"],
        "language_id": req["language_id"],
        "stdin": req.get("stdin", "")
    }
    res = requests.post(url, json=payload)
    return res.json()
