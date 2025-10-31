import random
import requests
from app.database import SessionLocal, Problem

def get_problem_for_match():
    db = SessionLocal()

    #get all problems
    problems = db.query(Problem).all()
    if not problems:
        db.close()
        return {"error": "No problems found in database"}

    chosen = random.choice(problems)
    db.close()

    url = f"https://alfa-leetcode-api.onrender.com/select?titleSlug={chosen.slug}"
    print(f"Fetching: {url}") 

    try:
        res = requests.get(url, timeout=10)
        data = res.json()

        if res.status_code == 200:
            return {
                "title": data.get("questionTitle", chosen.title),
                "difficulty": data.get("difficulty", chosen.difficulty),
                "tags": [tag["name"] for tag in data.get("topicTags", [])],
                "description": data.get("question", "No description available"),
                "link": data.get("link", f"https://leetcode.com/problems/{chosen.slug}/")
            }
        else:
            return {"error": f"API error {res.status_code}", "details": data}

    except Exception as e:
        return {"error": str(e)}