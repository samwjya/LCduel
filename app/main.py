from fastapi import FastAPI, WebSocket
from app import matchmaker
from app.models import JoinRequest
from app import problems
from app.websocket.endpoint import websocket_endpoints

app = FastAPI(title="LeetCode Duel")

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
