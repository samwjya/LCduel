from fastapi import WebSocket, WebSocketDisconnect
from app.websocket.manager import ConnectionManager
from app import matchmaker, problems
import json

manager = ConnectionManager()

async def websocket_endpoints(websocket: WebSocket, username: str):
    await manager.connect(username, websocket)

    try:
        while True:
            data = await websocket.receive_text()

            if data == "join":
                match = matchmaker.add_player(username)
                if match:
                    manager.matches.append(match)
                    problem = problems.get_problem_for_match()

                    # Send structured JSON to both players
                    await manager.broadcast(match, json.dumps({
                        "type": "problem",
                        "title": problem["title"],
                        "difficulty": problem["difficulty"],
                        "tags": problem["tags"],
                        "description": problem["description"],
                        "link": problem["link"]
                    }))
                else:
                    await manager.send_to_user(username, json.dumps({
                        "type": "status",
                        "message": "Waiting for opponent..."
                    }))

            else:
                # Echo message back for testing
                await manager.send_to_user(username, json.dumps({
                    "type": "echo",
                    "message": f"You said: {data}"
                }))

    except WebSocketDisconnect:
        manager.disconnect(username)