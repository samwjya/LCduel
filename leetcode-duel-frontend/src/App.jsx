import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

function App() {
  const [username, setUsername] = useState("");
  const [ws, setWs] = useState(null);
  const [status, setStatus] = useState("");
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(
    "# Type your solution here\n\nclass Solution:\n    def solve(self):\n        pass"
  );
  const [output, setOutput] = useState("");
  const [opponent, setOpponent] = useState(""); //ill this after pairing
  const [timeLeft, setTimeLeft] = useState(600); // 10-minute duel timer

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // auto submit when time hits 0
  useEffect(() => {
    if (timeLeft === 0) {
      fetch("http://127.0.0.1:8000/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, opponent }),
      });
      alert("⏰ Time’s up! Submitting automatically...");
    }
  }, [timeLeft, username, opponent]);

  // --- connect to websocket
  const connect = () => {
    if (!username) return alert("Enter a username first!");
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${username}`);

    socket.onopen = () => setStatus("✅ Connected! Click 'Join Duel'.");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "status") {
        setStatus(data.message);
      }
      if (data.type === "problem") {
        setProblem(data);
        setOpponent(data.opponent); 
        setStatus(`🎯 Match found! Opponent: ${data.opponent}`);
      }
      if (data.type === "result") {
        alert(data.message);
      }
    };
    socket.onclose = () => setStatus("❌ Disconnected");
    setWs(socket);
  };

  // --- join queue for duel
  const joinQueue = () => {
    if (!ws) return alert("Connect first!");
    ws.send("join");
  };

  // --- run code (connect to FastAPI backend)
  const handleRun = async () => {
    if (!problem) return alert("No problem loaded yet!");

    const payload = {
      slug: problem.slug || "two-sum", // fallback for local testing
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
      console.log("Backend Result:", data);

      if (data.error) {
        setOutput(`❌ Error: ${data.error}`);
      } else if (data.all_passed) {
        setOutput("🎉 All test cases passed!");
      } else {
        const resultText = data.results
          .map(
            (r, i) =>
              `#${i + 1}\nInput: ${r.input}\nExpected: ${r.expected}\nOutput: ${r.output}\nPassed: ${r.passed ? "✅" : "❌"}`
          )
          .join("\n\n");
        setOutput(resultText);
      }
    } catch (error) {
      console.error(error);
      setOutput("⚠️ Failed to connect to backend.");
    }
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "2rem",
        maxWidth: "1000px",
        margin: "auto",
      }}
    >
      <h1>⚔️ LeetCode Duel</h1>

      {/* --- connection controls --- */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: "0.5rem", marginRight: "0.5rem" }}
        />
        <button onClick={connect} style={{ marginRight: "0.5rem" }}>
          Connect
        </button>
        <button onClick={joinQueue} disabled={!ws}>
          Join Duel
        </button>
      </div>

      <p style={{ fontWeight: "bold" }}>{status}</p>
      {/* --- problem info --- */}
      {problem && (
        <p>
          ⏱ Time left:{" "}
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </p>
      )}
      {problem && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "10px",
          }}
        >
          <h2>{problem.title}</h2>
          <p>
            <strong>Difficulty:</strong> {problem.difficulty}
          </p>
          <p>
            <strong>Tags:</strong>{" "}
            {Array.isArray(problem.tags)
              ? problem.tags.join(", ")
              : problem.tags}
          </p>
          {problem.link && (
            <a href={problem.link} target="_blank" rel="noreferrer">
              View on LeetCode
            </a>
          )}
          <div
            style={{ marginTop: "1rem" }}
            dangerouslySetInnerHTML={{
              __html: problem.description || "",
            }}
          />
        </div>
      )}

      {/* --- editor + run --- */}
      {problem && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ marginRight: "1rem" }}>Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>
            <button onClick={handleRun} style={{ marginLeft: "1rem" }}>
              ▶ Run
            </button>
          </div>

            <button
            onClick={() => {
              if (!ws || !opponent) return alert("You’re not in a duel yet!");
              ws.send(`finish:${opponent}`);
              alert("✅ You’ve marked yourself as finished — waiting for opponent...");
            }}
            style={{
              marginLeft: "0.5rem",
              background: "#28a745",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "6px",
            }}
          >
          Finish
        </button>


          <Editor
            height="400px"
            language={language}
            value={code}
            onChange={(value) => setCode(value)}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
            }}
          />

          {/* --- output panel --- */}
          {output && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                background: "#1e1e1e",
                color: "#dcdcdc",
                borderRadius: "8px",
                whiteSpace: "pre-wrap",
              }}
            >
              <strong>Output:</strong>
              <pre>{output}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
