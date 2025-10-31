from app.database import SessionLocal, Problem

def seed_problems():
    db = SessionLocal()

    problems = [
    Problem(title="Two Sum", slug="two-sum", difficulty="Easy", tags="Array"),
    Problem(title="Valid Parentheses", slug="valid-parentheses", difficulty="Easy", tags="Stack"),
    Problem(title="Merge Two Sorted Lists", slug="merge-two-sorted-lists", difficulty="Easy", tags="Linked List"),
    Problem(title="Maximum Subarray", slug="maximum-subarray", difficulty="Easy", tags="Dynamic Programming"),
    Problem(title="Best Time to Buy and Sell Stock", slug="best-time-to-buy-and-sell-stock", difficulty="Easy", tags="Greedy"),

    Problem(title="Add Two Numbers", slug="add-two-numbers", difficulty="Medium", tags="Linked List"),
    Problem(title="Longest Substring Without Repeating Characters", slug="longest-substring-without-repeating-characters", difficulty="Medium", tags="Hash Map"),
    Problem(title="Container With Most Water", slug="container-with-most-water", difficulty="Medium", tags="Two Pointers"),
    Problem(title="Group Anagrams", slug="group-anagrams", difficulty="Medium", tags="Hash Map"),
    Problem(title="3Sum", slug="3sum", difficulty="Medium", tags="Two Pointers"),
    ]

    for p in problems:
        existing = db.query(Problem).filter(Problem.slug == p.slug).first()
        if not existing:
            db.add(p)

    db.commit()
    db.close()
    print("samples problems added successfully!")

if __name__ == "__main__":
    seed_problems()