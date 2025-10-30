from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.matches: List[List[str]] = []

    async def connect(self, username: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[username] = websocket
        print(f"{username} connected")

    def disconnect(self, username: str):
        if username in self.active_connections:
            self.active_connections.pop(username)
            print(f"{username} disconnected")

    async def send_to_user(self, username: str, message: str):
        if username in self.active_connections:
            await self.active_connections[username].send_text(message)

    async def broadcast(self, users: List[str], message: str):
        for user in users:
            if user in self.active_connections:
                await self.active_connections[user].send_text(message)
