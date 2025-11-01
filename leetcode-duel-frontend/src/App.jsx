import { useState } from "react";
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

  // const languageMap = {
  //   python: 71,
  //   javascript: 63,
  //   java: 62,
  //   cpp: 54,
  // };

  // --- connect to websocket
  const connect = () => {
    if (!username) return alert("Enter a username first!");
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${username}`);

    socket.onopen = () => setStatus("✅ Connected! Click 'Join Duel'.");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "status") setStatus(data.message);
      if (data.type === "problem") {
        setProblem(data);
        setStatus("🎯 Match found!");
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

