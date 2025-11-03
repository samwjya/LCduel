import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

// Default code templates for each language
const CODE_TEMPLATES = {
  python: `class Solution:
    def solve(self, *args):
        # Your code here
        # args will contain all the inputs
        # For two-sum: args = (target, nums)
        # For substring: args = (s,)
        pass

if __name__ == "__main__":
    import sys
    import json
    
    lines = [line.strip() for line in sys.stdin if line.strip()]
    
    # Parse all inputs (skip first line if it's metadata)
    inputs = []
    for line in lines:
        try:
            inputs.append(json.loads(line))
        except json.JSONDecodeError:
            inputs.append(line)
    
    s = Solution()
    result = s.solve(*inputs)
    print(json.dumps(result))`,
  
  javascript: `// Your JavaScript solution here`,
  cpp: `// Your C++ solution here`,
  java: `// Your Java solution here`,
};

function App() {
  // --- User & Connection State ---
  const [username, setUsername] = useState("");
  const [ws, setWs] = useState(null);
  const [status, setStatus] = useState("Not connected");
  const [opponent, setOpponent] = useState("");

  // --- Problem State ---
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(CODE_TEMPLATES.python);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // --- Timer State ---
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  // Timer countdown
  useEffect(() => {
    if (!problem) return; // Only run timer when problem is loaded

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [problem]);

  // Auto-submit when time runs out
  const handleTimeUp = async () => {
    if (!opponent) return;
    
    try {
      await fetch("http://127.0.0.1:8000/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, opponent }),
      });
      alert("⏰ Time's up! Submitting automatically...");
    } catch (error) {
      console.error("Failed to auto-submit:", error);
    }
  };

  // --- WebSocket Connection ---
  const connect = () => {
    if (!username.trim()) {
      return alert("Please enter a username first!");
    }

    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${username}`);

    socket.onopen = () => {
      setStatus("✅ Connected! Click 'Join Duel' to find an opponent.");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "status":
          setStatus(data.message);
          break;

        case "problem":
          setProblem(data);
          setOpponent(data.opponent);
          setStatus(`🎯 Match found! Opponent: ${data.opponent}`);
          setTimeLeft(600); // Reset timer
          break;

        case "result":
          alert(data.message);
          // Reset state after duel ends
          setProblem(null);
          setOpponent("");
          setOutput("");
          setCode(CODE_TEMPLATES[language]);
          break;

        default:
          console.log("Unknown message type:", data);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("❌ Connection error");
    };

    socket.onclose = () => {
      setStatus("❌ Disconnected");
      setWs(null);
    };

    setWs(socket);
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      setWs(null);
      setStatus("Disconnected");
    }
  };

  // --- Join Queue ---
  const joinQueue = () => {
    if (!ws) {
      return alert("Please connect first!");
    }
    ws.send("join");
    setStatus("⏳ Searching for opponent...");
  };

  // --- Run Code ---
  const handleRun = async () => {
    if (!problem) {
      return alert("No problem loaded yet!");
    }

    setIsRunning(true);
    setOutput("Running...");

    const payload = {
      slug: problem.slug,
      code: code,
      language: language,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.error) {
        setOutput(`❌ Error: ${data.error}`);
      } else if (data.all_passed) {
        setOutput("✅ All test cases passed! You can click 'Finish' when ready.");
      } else {
        const resultText = data.results
          .map((r, i) => {
            const lines = [
              `Test Case #${i + 1}`,
              `Input: ${r.input}`,
              `Expected: ${r.expected}`,
              `Output: ${r.output || "null"}`,
              `Status: ${r.status}`,
              `Passed: ${r.passed ? "✅" : "❌"}`,
            ];
            
            if (r.error) {
              lines.push(`Error: ${r.error}`);
            }
            
            return lines.join("\n");
          })
          .join("\n\n" + "=".repeat(50) + "\n\n");
        
        setOutput(resultText);
      }
    } catch (error) {
      console.error("Run error:", error);
      setOutput("⚠️ Failed to connect to backend. Is the server running?");
    } finally {
      setIsRunning(false);
    }
  };

  // --- Finish Duel ---
  const handleFinish = () => {
    if (!ws || !opponent) {
      return alert("You're not in a duel yet!");
    }

    ws.send(`finish:${opponent}`);
    alert("✅ Marked as finished! Waiting for opponent...");
  };

  // --- Language Change ---
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(CODE_TEMPLATES[newLang]);
  };

  // --- Format Time ---
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>⚔️ LeetCode Duel</h1>
      </header>

      {/* Connection Panel */}
      <div style={styles.connectionPanel}>
        <input
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={ws !== null}
          style={styles.input}
        />
        {!ws ? (
          <button onClick={connect} style={styles.button}>
            Connect
          </button>
        ) : (
          <button onClick={disconnect} style={styles.buttonDanger}>
            Disconnect
          </button>
        )}
        <button onClick={joinQueue} disabled={!ws || problem !== null} style={styles.button}>
          Join Duel
        </button>
      </div>

      <p style={styles.status}>{status}</p>

      {/* Timer */}
      {problem && (
        <div style={styles.timer}>
          <span>⏱️ Time Left: </span>
          <strong style={{ color: timeLeft < 60 ? "#ff4444" : "#4CAF50" }}>
            {formatTime(timeLeft)}
          </strong>
        </div>
      )}

      {/* Problem Display */}
      {problem && (
        <div style={styles.problemCard}>
          <h2>{problem.title}</h2>
          <div style={styles.problemMeta}>
            <span style={styles.badge}>
              {problem.difficulty}
            </span>
            <span style={styles.tags}>
              {Array.isArray(problem.tags) ? problem.tags.join(", ") : problem.tags}
            </span>
          </div>
          {problem.link && (
            <a href={problem.link} target="_blank" rel="noreferrer" style={styles.link}>
              📄 View on LeetCode
            </a>
          )}
          <div
            style={styles.description}
            dangerouslySetInnerHTML={{ __html: problem.description || "" }}
          />
        </div>
      )}

      {/* Code Editor */}
      {problem && (
        <div style={styles.editorSection}>
          <div style={styles.editorControls}>
            <div>
              <label style={styles.label}>Language: </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={styles.select}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            <div>
              <button
                onClick={handleRun}
                disabled={isRunning}
                style={styles.buttonPrimary}
              >
                {isRunning ? "⏳ Running..." : "▶️ Run"}
              </button>
              <button onClick={handleFinish} style={styles.buttonSuccess}>
                ✓ Finish
              </button>
            </div>
          </div>

          <Editor
            height="450px"
            language={language}
            value={code}
            onChange={(value) => setCode(value)}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              automaticLayout: true,
            }}
          />

          {/* Output Panel */}
          {output && (
            <div style={styles.outputPanel}>
              <strong>📋 Output:</strong>
              <pre style={styles.outputText}>{output}</pre>
            </div>
          )}
        </div>
      )}

      {/* Instructions (when no problem loaded) */}
      {!problem && ws && (
        <div style={styles.instructions}>
          <h3>🎮 How to Play</h3>
          <ol>
            <li>Click "Join Duel" to find an opponent</li>
            <li>Solve the problem faster than your opponent</li>
            <li>Click "Run" to test your code</li>
            <li>Click "Finish" when you're done</li>
            <li>First to finish with all tests passing wins!</li>
          </ol>
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
    color: "#333",
  },
  connectionPanel: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  input: {
    padding: "0.6rem",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "14px",
    flex: "1",
    minWidth: "200px",
  },
  button: {
    padding: "0.6rem 1.2rem",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2196F3",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  buttonPrimary: {
    padding: "0.6rem 1.2rem",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2196F3",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    marginRight: "0.5rem",
  },
  buttonSuccess: {
    padding: "0.6rem 1.2rem",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#28a745",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  buttonDanger: {
    padding: "0.6rem 1.2rem",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#dc3545",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  status: {
    fontWeight: "600",
    padding: "0.8rem",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "1px solid #ddd",
    marginBottom: "1rem",
  },
  timer: {
    fontSize: "1.2rem",
    padding: "0.8rem",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "2px solid #4CAF50",
    marginBottom: "1rem",
    textAlign: "center",
  },
  problemCard: {
    marginTop: "1.5rem",
    padding: "1.5rem",
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  problemMeta: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    marginTop: "0.5rem",
    marginBottom: "1rem",
  },
  badge: {
    padding: "0.3rem 0.8rem",
    backgroundColor: "#ff9800",
    color: "white",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
  },
  tags: {
    color: "#666",
    fontSize: "14px",
  },
  link: {
    color: "#2196F3",
    textDecoration: "none",
    fontSize: "14px",
  },
  description: {
    marginTop: "1rem",
    lineHeight: "1.6",
  },
  editorSection: {
    marginTop: "2rem",
  },
  editorControls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.8rem",
    padding: "0.8rem",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "1px solid #ddd",
  },
  label: {
    marginRight: "0.5rem",
    fontWeight: "500",
  },
  select: {
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #ddd",
  },
  outputPanel: {
    marginTop: "1rem",
    padding: "1rem",
    backgroundColor: "#1e1e1e",
    color: "#dcdcdc",
    borderRadius: "8px",
    maxHeight: "300px",
    overflow: "auto",
  },
  outputText: {
    marginTop: "0.5rem",
    whiteSpace: "pre-wrap",
    fontSize: "13px",
    lineHeight: "1.5",
  },
  instructions: {
    marginTop: "2rem",
    padding: "1.5rem",
    backgroundColor: "white",
    borderRadius: "10px",
    border: "1px solid #ddd",
  },
};

export default App;
