from typing import List, Optional

queue: List[str] = []
matches: List[List[str]] = []
def add_player(username: str) -> Optional[List[str]]:
    if username in queue:
        return None
    
    if queue:
        opponent = queue.pop(0)
        match = [username, opponent]
        matches.append(match)
        return match
    else:
        queue.append(username)
        return None
    
    
    
