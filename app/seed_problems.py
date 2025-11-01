from app.database import SessionLocal, Problem

def seed_problems():
    db = SessionLocal()

    problems = [
        Problem(
            title="Two Sum",
            slug="two-sum",
            difficulty="Easy",
            tags="Array",
            testcases=[
                {"input": "4\n9\n[2,7,11,15]\n", "expected_output": "[0,1]\n"},
                {"input": "3\n6\n[3,2,4]\n", "expected_output": "[1,2]\n"}
            ]
        ),
        Problem(
            title="Valid Parentheses",
            slug="valid-parentheses",
            difficulty="Easy",
            tags="Stack",
            testcases=[
                {"input": "()\n", "expected_output": "True\n"},
                {"input": "([)]\n", "expected_output": "False\n"},
                {"input": "{[]}\n", "expected_output": "True\n"}
            ]
        ),
        Problem(
            title="Merge Two Sorted Lists",
            slug="merge-two-sorted-lists",
            difficulty="Easy",
            tags="Linked List",
            testcases=[
                {"input": "[1,2,4]\n[1,3,4]\n", "expected_output": "[1,1,2,3,4,4]\n"},
                {"input": "[]\n[]\n", "expected_output": "[]\n"}
            ]
        ),
        Problem(
            title="Maximum Subarray",
            slug="maximum-subarray",
            difficulty="Easy",
            tags="Dynamic Programming",
            testcases=[
                {"input": "[-2,1,-3,4,-1,2,1,-5,4]\n", "expected_output": "6\n"},
                {"input": "[1]\n", "expected_output": "1\n"}
            ]
        ),
        Problem(
            title="Best Time to Buy and Sell Stock",
            slug="best-time-to-buy-and-sell-stock",
            difficulty="Easy",
            tags="Greedy",
            testcases=[
                {"input": "[7,1,5,3,6,4]\n", "expected_output": "5\n"},
                {"input": "[7,6,4,3,1]\n", "expected_output": "0\n"}
            ]
        ),
        Problem(
            title="Add Two Numbers",
            slug="add-two-numbers",
            difficulty="Medium",
            tags="Linked List",
            testcases=[
                {"input": "[2,4,3]\n[5,6,4]\n", "expected_output": "[7,0,8]\n"},
                {"input": "[0]\n[0]\n", "expected_output": "[0]\n"}
            ]
        ),
        Problem(
            title="Longest Substring Without Repeating Characters",
            slug="longest-substring-without-repeating-characters",
            difficulty="Medium",
            tags="Hash Map",
            testcases=[
                {"input": "abcabcbb\n", "expected_output": "3\n"},
                {"input": "bbbbb\n", "expected_output": "1\n"}
            ]
        ),
        Problem(
            title="Container With Most Water",
            slug="container-with-most-water",
            difficulty="Medium",
            tags="Two Pointers",
            testcases=[
                {"input": "[1,8,6,2,5,4,8,3,7]\n", "expected_output": "49\n"},
                {"input": "[1,1]\n", "expected_output": "1\n"}
            ]
        ),
        Problem(
            title="Group Anagrams",
            slug="group-anagrams",
            difficulty="Medium",
            tags="Hash Map",
            testcases=[
                {"input": '["eat","tea","tan","ate","nat","bat"]\n',
                 "expected_output": '[["bat"],["nat","tan"],["ate","eat","tea"]]\n'}
            ]
        ),
        Problem(
            title="3Sum",
            slug="3sum",
            difficulty="Medium",
            tags="Two Pointers",
            testcases=[
                {"input": "[-1,0,1,2,-1,-4]\n", "expected_output": "[[-1,-1,2],[-1,0,1]]\n"},
                {"input": "[0,0,0,0]\n", "expected_output": "[[0,0,0]]\n"}
            ]
        )
    ]

    for p in problems:
        existing = db.query(Problem).filter(Problem.slug == p.slug).first()
        if not existing:
            db.add(p)

    db.commit()
    db.close()
    print("Success")

if __name__ == "__main__":
    seed_problems()
