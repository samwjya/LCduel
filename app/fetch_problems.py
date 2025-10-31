import requests

from app.database import SessionLocal, Problem

def populate_problems():
    db = SessionLocal()

    url = "https://alfa-leetcode-api.onrender.com/"
    response = requests.get(url)
    
    if response.status_code != 200:
        print("Failed to fetch problems from API")
        return
    
    data = response.json()
    print(f"Fetched {len(data)} problems")

    for p in data:
        existing = db.query(Problem).filter(Problem.slug == p["titleSlug"]).first()
        if existing:
            continue

        problem = Problem(
            title=p["title"],
            difficulty=p["difficulty"],
            slug=p["titleSlug"],
            tags=",".join(p["topicTags"]) if p["topicTags"] else ""
        )
        db.add(problem)

    db.commit()
    db.close()
    print("Problems added successfully!")

if __name__ == "__main__":
    populate_problems()