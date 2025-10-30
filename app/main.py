from fastapi import FastAPI

app = FastAPI(title="LeetCode Duel")

@app.get("/")
def home():
    return {"message": "Welcome to LeetCode Duel!"}