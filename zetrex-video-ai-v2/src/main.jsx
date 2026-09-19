import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [p, setP] = useState("");
  const [ratio, setR] = useState("16:9");
  const [duration, setD] = useState("5");
  const [status, setS] = useState("");
  const [err, setE] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!status || !window.__predictionId) return;
    const id = window.__predictionId;
    const timer = setInterval(async () => {
      try {
        const r = await fetch(`/.netlify/functions/status?id=${encodeURIComponent(id)}`);
        const x = await r.json();
        if (!r.ok) throw Error(x.error || "Status check failed.");

        if (x.status === "succeeded") {
          clearInterval(timer);
          setBusy(false);
          setS("Video ready");
          setVideoUrl(x.videoUrl || "");
          window.__predictionId = "";
        } else if (["failed", "canceled"].includes(x.status)) {
          clearInterval(timer);
          setBusy(false);
          setS("Failed");
          setE(x.error || "Video generation failed.");
          window.__predictionId = "";
        } else {
          setS(`Generating… ${x.status}`);
        }
      } catch (e) {
        clearInterval(timer);
        setBusy(false);
        setS("Failed");
        setE(e.message);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [status]);

  async function gen() {
    setE("");
    setVideoUrl("");
    if (!p.trim()) return setE("Enter a video prompt first.");

    setBusy(true);
    setS("Starting video generation…");

    try {
      const r = await fetch("/.netlify/functions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, ratio, duration: Number(duration) })
      });
      const x = await r.json();
      if (!r.ok) throw Error(x.error || "Generation failed.");

      window.__predictionId = x.predictionId;
      setS("Generating… starting");
    } catch (e) {
      setBusy(false);
      setS("Failed");
      setE(e.message);
    }
  }

  return (
    <div className="app">
      <header><b>ZETREX<span>AI</span></b><small>VIDEO GENERATOR</small></header>
      <main>
        <div className="hero">
          <i>✦ AI VIDEO STUDIO</i>
          <h1>Turn your ideas into<br/><em>cinematic videos.</em></h1>
          <p>Generate AI videos from simple text prompts.</p>
        </div>

        <section>
          <label>Describe your video</label>
          <textarea value={p} onChange={e => setP(e.target.value)}
            placeholder="A cinematic drone shot flying over a futuristic city at sunset..."/>

          <div className="row">
            <div>
              <label>Aspect ratio</label>
              <select value={ratio} onChange={e => setR(e.target.value)}>
                <option>16:9</option><option>9:16</option><option>1:1</option>
              </select>
            </div>
            <div>
              <label>Duration</label>
              <select value={duration} onChange={e => setD(e.target.value)}>
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
              </select>
            </div>
          </div>

          <button onClick={gen} disabled={busy}>
            {busy ? "Generating…" : "Generate Video →"}
          </button>

          {status && <div className="status">● {status}</div>}
          {err && <div className="error">{err}</div>}

          {videoUrl && (
            <div className="result">
              <video src={videoUrl} controls playsInline />
              <a href={videoUrl} target="_blank" rel="noreferrer" download>
                Download Video
              </a>
            </div>
          )}
        </section>
      </main>
      <footer>© 2026 Zetrex Technologies</footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
