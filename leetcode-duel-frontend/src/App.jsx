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

const languageMap = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54
};

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

  const joinQueue = () => {
    if (!ws) return alert("Connect first!");
    ws.send("join");
  };

  const handleRun = async () => {
  if (!problem) return alert("No problem loaded yet!");

  const payload = {
    code,
    language_id: languageMap[language],
    stdin: "",
  };

  try {
    const res = await fetch('http://127.0.0.1:8000/run', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Judge0 Result:", data);

    if (data.stdout) {
      alert(`✅ Output:\n${data.stdout}`);
    } else if (data.stderr) {
      alert(`❌ Error:\n${data.stderr}`);
    } else {
      alert(`⚠️ ${data.status?.description || "No output"}`);
    }
  } catch (error) {
    console.error(error);
    alert("Failed to connect to backend.");
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
            <strong>Tags:</strong> {problem.tags.join(", ")}
          </p>
          <a href={problem.link} target="_blank" rel="noreferrer">
            View on LeetCode
          </a>
          <div
            style={{ marginTop: "1rem" }}
            dangerouslySetInnerHTML={{ __html: problem.description }}
          />
        </div>
      )}

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
        </div>
      )}
    </div>
  );
}

export default App;
