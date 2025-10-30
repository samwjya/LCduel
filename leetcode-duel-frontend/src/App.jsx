import { useState } from "react";

function App() {
  const [username, setUsername] = useState("");
  const [ws, setWs] = useState(null);
  const [status, setStatus] = useState("");
  const [problem, setProblem] = useState(null);

  const connect = () => {
    if (!username) return alert("Enter a username first!");
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${username}`);

    socket.onopen = () => {
      setStatus("✅ Connected! Click 'Join Duel' to find opponent.");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 Received:", data);

      if (data.type === "status") setStatus(data.message);
      if (data.type === "problem") {
        setStatus("🎯 Match Found!");
        setProblem(data);
      }
    };

    socket.onclose = () => {
      setStatus("❌ Disconnected");
    };

    setWs(socket);
  };

  const joinQueue = () => {
    if (!ws) return alert("Connect first!");
    ws.send("join");
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "2rem",
        maxWidth: "800px",
        margin: "auto",
      }}
    >
      <h1>⚔️ LeetCode Duel</h1>
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

      <p style={{ marginTop: "1rem", fontWeight: "bold" }}>{status}</p>

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
    </div>
  );
}

export default App;
