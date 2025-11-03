from fastapi import WebSocket, WebSocketDisconnect
from app.websocket.manager import ConnectionManager
from app import matchmaker, problems
import json
import asyncio
from datetime import datetime

manager = ConnectionManager()
active_duels = {}
waiting_user = None


# ---------------------------
#  HELPER: end duel after 10 minutes
# ---------------------------
async def end_duel_after_time(duel_key):
    await asyncio.sleep(active_duels[duel_key]["duration"])
    await finalize_duel(duel_key)


async def finalize_duel(duel_key):
    duel = active_duels.get(duel_key)
    if not duel:
        return

    player1, player2 = duel_key
    if duel["finished"]:
        winner = list(duel["finished"])[0] if len(duel["finished"]) == 1 else "draw"
    else:
        winner = "none"

    await manager.broadcast(list(duel_key), json.dumps({
        "type": "result",
        "winner": winner,
        "message": f"Duel ended! Winner: {winner}"
    }))

    print(f"[DUEL ENDED] {duel_key} winner: {winner}")
    del active_duels[duel_key]


# ---------------------------
#  MAIN WEBSOCKET ENDPOINT
# ---------------------------
async def websocket_endpoints(websocket: WebSocket, username: str):
    global waiting_user

    await manager.connect(username, websocket)
    print(f"{username} connected")

    try:
        while True:
            data = await websocket.receive_text()

            if data == "join":
                # if no one waiting yet, store this player
                if waiting_user is None:
                    waiting_user = username
                    await manager.send_to_user(username, json.dumps({
                        "type": "status",
                        "message": "⏳ Waiting for opponent..."
                    }))
                else:
                    # found an opponent
                    opponent = waiting_user
                    waiting_user = None

                    # get a random problem
                    problem = problems.get_problem_for_match()

                    duel_key = tuple(sorted([username, opponent]))
                    active_duels[duel_key] = {
                        "start": datetime.utcnow(),
                        "duration": 600,  # 10 minutes
                        "finished": set()
                    }

                    asyncio.create_task(end_duel_after_time(duel_key))

                    # Send same problem to both players
                    await manager.send_to_user(username, json.dumps({
                        "type": "problem",
                        "opponent": opponent,
                        **problem
                    }))
                    await manager.send_to_user(opponent, json.dumps({
                        "type": "problem",
                        "opponent": username,
                        **problem
                    }))

                    print(f"[MATCHED] {username} vs {opponent}")

            elif data.startswith("finish:"):
                opponent = data.split(":")[1]
                duel_key = tuple(sorted([username, opponent]))

                if duel_key in active_duels:
                    active_duels[duel_key]["finished"].add(username)

                    # if both finished early, finalize now
                    if len(active_duels[duel_key]["finished"]) == 2:
                        await finalize_duel(duel_key)

            else:
                await manager.send_to_user(username, json.dumps({
                    "type": "echo",
                    "message": f"You said: {data}"
                }))

    except WebSocketDisconnect:
        manager.disconnect(username)
        print(f"{username} disconnected")
