import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

function SpikeGraph({ timeline, threshold }) {
  if (!timeline || timeline.length === 0) return null;

  const width = 800;
  const height = 150;
  const maxScore = Math.max(...timeline.map(t => t.score), threshold * 2);

  return (
    <div className="neuromorphic-panel">
      <h2>Spike Timeline Graph</h2>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ background: "#0f172a", borderRadius: "10px" }}>
        {timeline.map((point, i) => {
          const x = (i / timeline.length) * width;
          const barHeight = (point.score / maxScore) * (height - 20);
          const y = height - barHeight;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={Math.max(2, width / timeline.length - 1)}
              height={barHeight}
              fill={point.spike ? "#ef4444" : "#38bdf8"}
              opacity={0.8}
            />
          );
        })}
        <line
          x1={0} y1={height - (threshold / maxScore) * (height - 20)}
          x2={width} y2={height - (threshold / maxScore) * (height - 20)}
          stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5,5"
        />
      </svg>
      <div style={{ display: "flex", gap: "20px", marginTop: "10px", justifyContent: "center", fontSize: "0.85rem" }}>
        <span style={{ color: "#38bdf8" }}>Normal Frame</span>
        <span style={{ color: "#ef4444" }}>Spike Detected</span>
        <span style={{ color: "#22c55e" }}>Threshold Line</span>
      </div>
    </div>
  );
}

function ThreatIndicator({ level }) {
  const colors = {
    LOW: "#22c55e",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
    CRITICAL: "#dc2626"
  };
  const color = colors[level] || "#22c55e";

  return (
    <div className="neuromorphic-panel" style={{ textAlign: "center" }}>
      <h2>Threat Level</h2>
      <div style={{
        fontSize: "3rem",
        fontWeight: "bold",
        color: color,
        padding: "20px",
        border: `3px solid ${color}`,
        borderRadius: "15px",
        margin: "20px auto",
        maxWidth: "300px",
        boxShadow: `0 0 30px ${color}55`
      }}>
        {level}
      </div>
    </div>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [liveStatus, setLiveStatus] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  const analyzeVideo = async () => {
    if (!file) { alert("Please Select a Video"); return; }
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/analyze", formData);
      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Backend Error");
    }
    setLoading(false);
  };

  const startLiveCamera = () => {
    if (socketRef.current) { alert("Camera pehle se chal raha hai!"); return; }
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/events");
    socketRef.current = socket;
    socket.onopen = () => {
      setLiveMode(true);
      setLiveStatus("Connecting to camera...");
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "connecting") { setLiveStatus(data.message); return; }
      if (data.error) { alert("Camera Error: " + data.error); return; }
      setLiveStatus("LIVE CAMERA ACTIVE");
      setResult(data);
    };
    socket.onerror = () => {
      alert("WebSocket Error - Backend chal raha hai kya?");
      socketRef.current = null;
      setLiveMode(false);
    };
    socket.onclose = () => {
      socketRef.current = null;
      setLiveMode(false);
      setLiveStatus("");
    };
  };

  const stopLiveCamera = () => {
    if (socketRef.current) { socketRef.current.close(); socketRef.current = null; }
    setLiveMode(false);
    setLiveStatus("");
  };

  return (
    <div className="app">
      <div className="header">
        <h1>ED-SSS</h1>
        <h3>Event Driven Smart Surveillance System</h3>
      </div>

      <div className="upload-section">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={analyzeVideo}>Analyze Video</button>
        <button onClick={startLiveCamera} disabled={liveMode}>
          {liveMode ? "Camera Running..." : "Start Live Camera"}
        </button>
        <button onClick={stopLiveCamera} disabled={!liveMode}>Stop Camera</button>
      </div>

      {liveMode && (
        <div style={{ textAlign: "center", color: "#22c55e", marginBottom: "20px", fontWeight: "bold", fontSize: "1.2rem" }}>
          {liveStatus}
        </div>
      )}

      {loading && <h2 className="loading">Analyzing Video...</h2>}

      {result && (
        <>
          {result.threat_level && <ThreatIndicator level={result.threat_level} />}

          <div className="cards">
            <div className="card"><h2>{result.frames_processed || 0}</h2><p>Frames Received</p></div>
            <div className="card"><h2>{result.events_detected || 0}</h2><p>Events Detected</p></div>
            <div className="card"><h2>{result.spikes_generated || 0}</h2><p>Spikes Generated</p></div>
            <div className="card"><h2>{result.energy_saved || 0}%</h2><p>Energy Saved</p></div>
          </div>

          {result.spike_timeline && (
            <SpikeGraph timeline={result.spike_timeline} threshold={result.adaptive_threshold || 10} />
          )}

          <div className="neuromorphic-panel">
            <h2>Spike Burst Detection</h2>
            <div className="status-grid">
              <div>Spike Bursts Found: <span>{result.spike_bursts || 0}</span></div>
              <div>Adaptive Threshold: <span>{result.adaptive_threshold || 10}</span></div>
              <div>Processing Reduction: <span>{result.reduction_percent || 0}%</span></div>
              <div>Burst Frames: <span>{result.burst_frames?.join(", ") || "None"}</span></div>
            </div>
          </div>

          <div className="neuromorphic-panel">
            <h2>Dynamic Power Scaling</h2>
            <div className="status-grid">
              <div>Power Mode: <span>{result.power_mode || "—"}</span></div>
              <div>ED-SSS Power Usage: <span>{result.power_usage_percent || 0}%</span></div>
              <div>Traditional CCTV: <span style={{ color: "#ef4444" }}>100%</span></div>
              <div>Power Saved: <span>{result.power_saved_percent || 0}%</span></div>
            </div>
          </div>

          <div className="neuromorphic-panel">
            <h2>Neuromorphic Memory Layer</h2>
            <div className="status-grid">
              <div>Videos Analyzed: <span>{result.videos_analyzed || 0}</span></div>
              <div>Learned Baseline: <span>{result.learned_baseline || 0}</span></div>
              <div>Memory Updated: <span>{result.memory_updated ? "YES" : "NO"}</span></div>
              <div>Adaptive Learning: <span>ACTIVE</span></div>
            </div>
          </div>

          <div className="neuromorphic-panel">
            <h2>Neuromorphic Processing Status</h2>
            <div className="status-grid">
              <div>Event Stream: <span>{liveMode ? "ACTIVE" : "OFFLINE"}</span></div>
              <div>Spike Encoder: <span>{liveMode ? "ACTIVE" : "OFFLINE"}</span></div>
              <div>Async Pipeline: <span>{liveMode ? "ACTIVE" : "OFFLINE"}</span></div>
              <div>Low Power Mode: <span>{liveMode ? "ACTIVE" : "OFFLINE"}</span></div>
            </div>
          </div>

          <div className="comparison">
            <div className="box">
              <h2>Traditional CCTV</h2>
              <h1>{result.frames_processed || 0}</h1>
              <p>Frames Processed</p>
            </div>
            <div className="vs">VS</div>
            <div className="box">
              <h2>ED-SSS</h2>
              <h1>{result.events_detected || 0}</h1>
              <p>Meaningful Events</p>
            </div>
          </div>

          <div className="reduction">
            Processing Reduction: <span>{result.reduction_percent || 0}%</span>
          </div>

          {result.heatmap_url && (
            <div className="neuromorphic-panel">
              <h2>Event Heatmap</h2>
              <img
                src={result.heatmap_url + "?t=" + new Date().getTime()}
                alt="Heatmap"
                className="heatmap-image"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
