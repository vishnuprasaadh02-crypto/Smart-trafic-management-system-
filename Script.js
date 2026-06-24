import { useState, useEffect, useRef, useCallback } from "react";

// ── Design tokens ──────────────────────────────────────────────────────────
// Palette: deep asphalt background, neon signal greens/reds, amber accents
// Typography: JetBrains Mono for data (feels like a real control room), Inter for UI
// Signature: animated "pulse ring" on the active green signal, like a real traffic camera feed

const ROADS = ["North", "South", "East", "West"];

const ROAD_ANGLES = { North: 270, South: 90, East: 0, West: 180 };

const ROAD_COLORS = {
  green: "#00FF87",
  red: "#FF3B3B",
  amber: "#FFB800",
  dim: "#1E2830",
};

const initialDensity = () => ({
  North: Math.floor(Math.random() * 35) + 5,
  South: Math.floor(Math.random() * 35) + 5,
  East: Math.floor(Math.random() * 35) + 5,
  West: Math.floor(Math.random() * 35) + 5,
});

function computeGreen(density) {
  return ROADS.reduce((a, b) => (density[a] >= density[b] ? a : b));
}

function computeDuration(count) {
  return Math.min(60, Math.max(15, count * 2));
}

function TrafficLight({ isGreen, pulse }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {/* Red */}
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: isGreen ? "#3a1010" : ROAD_COLORS.red,
        boxShadow: isGreen ? "none" : `0 0 12px ${ROAD_COLORS.red}`,
        transition: "all 0.4s"
      }} />
      {/* Amber */}
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "#2a2200",
        transition: "all 0.4s"
      }} />
      {/* Green */}
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: isGreen ? ROAD_COLORS.green : "#0a2010",
        boxShadow: isGreen ? `0 0 18px ${ROAD_COLORS.green}` : "none",
        transition: "all 0.4s",
        position: "relative"
      }}>
        {isGreen && pulse && (
          <div style={{
            position: "absolute", inset: -6,
            borderRadius: "50%",
            border: `2px solid ${ROAD_COLORS.green}`,
            animation: "pulse-ring 1.2s ease-out infinite",
            opacity: 0.6
          }} />
        )}
      </div>
    </div>
  );
}

function RoadCard({ road, count, isGreen, onChange, emergencyActive }) {
  const angle = ROAD_ANGLES[road];
  const pct = Math.min(100, (count / 60) * 100);
  const barColor = isGreen ? ROAD_COLORS.green : count > 40 ? ROAD_COLORS.red : "#3a4a5a";

  return (
    <div style={{
      background: isGreen ? "rgba(0,255,135,0.05)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${isGreen ? ROAD_COLORS.green : "#2a3a4a"}`,
      borderRadius: 14,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      transition: "all 0.4s",
      boxShadow: isGreen ? `0 0 24px rgba(0,255,135,0.12)` : "none",
      position: "relative",
      overflow: "hidden"
    }}>
      {emergencyActive && (
        <div style={{
          position: "absolute", top: 0, right: 0,
          background: "#FFB800", color: "#000",
          fontSize: 10, fontWeight: 700, fontFamily: "Inter, sans-serif",
          padding: "3px 8px", borderRadius: "0 14px 0 8px",
          letterSpacing: 1
        }}>🚨 PRIORITY</div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{
            fontFamily: "Inter, sans-serif", fontWeight: 700,
            fontSize: 15, color: isGreen ? ROAD_COLORS.green : "#c0cdd8",
            letterSpacing: 0.5
          }}>{road}</div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 26,
            fontWeight: 700, color: "#fff", lineHeight: 1.1, marginTop: 2
          }}>{count}
            <span style={{ fontSize: 12, color: "#6b7f8e", marginLeft: 4, fontWeight: 400 }}>veh</span>
          </div>
        </div>
        <TrafficLight isGreen={isGreen} pulse={true} />
      </div>

      {/* Density bar */}
      <div style={{ background: "#1a2530", borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: barColor,
          borderRadius: 4,
          transition: "width 0.6s ease, background 0.4s",
          boxShadow: isGreen ? `0 0 8px ${ROAD_COLORS.green}` : "none"
        }} />
      </div>

      {/* Slider */}
      <input
        type="range" min={0} max={60} value={count}
        onChange={e => onChange(road, Number(e.target.value))}
        style={{ width: "100%", accentColor: isGreen ? ROAD_COLORS.green : "#3a6a8a", cursor: "pointer" }}
      />

      <div style={{
        fontFamily: "Inter, sans-serif", fontSize: 11,
        color: isGreen ? ROAD_COLORS.green : "#4a6070",
        textTransform: "uppercase", letterSpacing: 1, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 6
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: isGreen ? ROAD_COLORS.green : ROAD_COLORS.red,
          display: "inline-block",
          boxShadow: isGreen ? `0 0 6px ${ROAD_COLORS.green}` : "none"
        }} />
        {isGreen ? `GREEN — ${computeDuration(count)}s` : "RED — WAITING"}
      </div>
    </div>
  );
}

function Intersection({ greenRoad, density }) {
  const roadStyle = (road) => ({
    position: "absolute",
    background: greenRoad === road
      ? `linear-gradient(${ROAD_ANGLES[road]}deg, transparent 40%, rgba(0,255,135,0.15) 100%)`
      : "rgba(255,255,255,0.02)",
    transition: "background 0.5s",
  });

  return (
    <div style={{
      position: "relative", width: 160, height: 160,
      margin: "0 auto"
    }}>
      {/* Road lanes */}
      {/* North */}
      <div style={{
        ...roadStyle("North"),
        top: 0, left: "50%", transform: "translateX(-50%)",
        width: 44, height: 58, borderRadius: "8px 8px 0 0"
      }} />
      {/* South */}
      <div style={{
        ...roadStyle("South"),
        bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: 44, height: 58, borderRadius: "0 0 8px 8px"
      }} />
      {/* East */}
      <div style={{
        ...roadStyle("East"),
        right: 0, top: "50%", transform: "translateY(-50%)",
        width: 58, height: 44, borderRadius: "0 8px 8px 0"
      }} />
      {/* West */}
      <div style={{
        ...roadStyle("West"),
        left: 0, top: "50%", transform: "translateY(-50%)",
        width: 58, height: 44, borderRadius: "8px 0 0 8px"
      }} />

      {/* Center box */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 68, height: 68,
        background: "#0d1820",
        border: `2px solid #1e2f3d`,
        borderRadius: 8,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 2
      }}>
        <div style={{ fontSize: 22 }}>🚦</div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, color: ROAD_COLORS.green, letterSpacing: 0.5
        }}>{greenRoad?.toUpperCase().slice(0,1) || "--"}</div>
      </div>

      {/* Direction labels */}
      {ROADS.map(r => {
        const positions = {
          North: { top: 4, left: "50%", transform: "translateX(-50%)" },
          South: { bottom: 4, left: "50%", transform: "translateX(-50%)" },
          East: { right: 4, top: "50%", transform: "translateY(-50%)" },
          West: { left: 4, top: "50%", transform: "translateY(-50%)" },
        };
        return (
          <div key={r} style={{
            position: "absolute", ...positions[r],
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, fontWeight: 700,
            color: greenRoad === r ? ROAD_COLORS.green : "#3a5060",
            transition: "color 0.4s"
          }}>{density[r]}</div>
        );
      })}
    </div>
  );
}

function TimerRing({ duration, timeLeft }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = circ * (timeLeft / duration);

  return (
    <svg width={90} height={90} viewBox="0 0 90 90">
      <circle cx={45} cy={45} r={r} fill="none" stroke="#1a2a36" strokeWidth={6} />
      <circle
        cx={45} cy={45} r={r} fill="none"
        stroke={ROAD_COLORS.green} strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={0}
        transform="rotate(-90 45 45)"
        style={{ transition: "stroke-dasharray 0.9s linear" }}
      />
      <text x={45} y={49} textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize={17} fontWeight={700} fill="#fff">{timeLeft}s</text>
    </svg>
  );
}

export default function SmartTrafficSystem() {
  const [density, setDensity] = useState(initialDensity);
  const [greenRoad, setGreenRoad] = useState(null);
  const [duration, setDuration] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30);
  const [running, setRunning] = useState(false);
  const [emergency, setEmergency] = useState(null); // road name or null
  const [log, setLog] = useState([]);
  const timerRef = useRef(null);

  const addLog = useCallback((msg) => {
    setLog(prev => [{ msg, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 11)]);
  }, []);

  const applySignal = useCallback((d, emg) => {
    let chosen;
    if (emg) {
      chosen = emg;
      addLog(`🚨 Emergency override → ${emg} PRIORITY`);
    } else {
      chosen = computeGreen(d);
      addLog(`✅ GREEN → ${chosen} (${d[chosen]} vehicles)`);
    }
    const dur = computeDuration(d[chosen]);
    setGreenRoad(chosen);
    setDuration(dur);
    setTimeLeft(dur);
  }, [addLog]);

  // Countdown
  useEffect(() => {
    if (!running) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // auto-rotate: slightly randomise density
          setDensity(prev => {
            const next = {};
            ROADS.forEach(r => {
              next[r] = Math.max(0, prev[r] + Math.floor(Math.random() * 14) - 5);
            });
            applySignal(next, null);
            return next;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, applySignal]);

  const handleStart = () => {
    if (!running) {
      applySignal(density, emergency);
      setRunning(true);
    } else {
      setRunning(false);
      addLog("⏸ Simulation paused");
    }
  };

  const handleSlider = (road, val) => {
    setDensity(prev => {
      const next = { ...prev, [road]: val };
      if (running) applySignal(next, emergency);
      return next;
    });
  };

  const triggerEmergency = (road) => {
    if (emergency === road) {
      setEmergency(null);
      addLog(`✅ Emergency cleared on ${road}`);
      if (running) applySignal(density, null);
    } else {
      setEmergency(road);
      addLog(`🚨 Ambulance on ${road}!`);
      if (running) applySignal(density, road);
    }
  };

  const totalVehicles = ROADS.reduce((s, r) => s + density[r], 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080f14; }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d1820; }
        ::-webkit-scrollbar-thumb { background: #2a3a4a; border-radius: 4px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#080f14",
        padding: "28px 20px 40px",
        fontFamily: "Inter, sans-serif",
        color: "#fff"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(0,255,135,0.08)",
            border: "1px solid rgba(0,255,135,0.2)",
            borderRadius: 40, padding: "6px 18px", marginBottom: 14
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: ROAD_COLORS.green, boxShadow: `0 0 8px ${ROAD_COLORS.green}`, display: "inline-block" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: ROAD_COLORS.green, letterSpacing: 2 }}>
              {running ? "SYSTEM ONLINE" : "STANDBY"}
            </span>
          </div>
          <h1 style={{
            fontFamily: "Inter, sans-serif", fontWeight: 700,
            fontSize: "clamp(22px, 5vw, 32px)", letterSpacing: -0.5,
            background: `linear-gradient(135deg, #fff 30%, ${ROAD_COLORS.green})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>Smart Traffic Management</h1>
          <p style={{ color: "#4a6070", fontSize: 13, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            AI-driven signal control · Mayiladuthurai City Grid
          </p>
        </div>

        {/* Stats bar */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10, marginBottom: 24, maxWidth: 560, margin: "0 auto 24px"
        }}>
          {[
            { label: "Total Vehicles", value: totalVehicles },
            { label: "Active Green", value: greenRoad || "—" },
            { label: "Green Duration", value: running ? `${timeLeft}s` : "—" }
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid #1e2f3d",
              borderRadius: 10, padding: "12px 14px", textAlign: "center"
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: ROAD_COLORS.green }}>{value}</div>
              <div style={{ fontSize: 10, color: "#4a6070", marginTop: 3, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Main layout */}
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Intersection + Timer */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 32,
            background: "rgba(255,255,255,0.02)", border: "1px solid #1a2a36",
            borderRadius: 16, padding: "24px 20px"
          }}>
            <Intersection greenRoad={greenRoad} density={density} />
            <div style={{ textAlign: "center" }}>
              <TimerRing duration={duration} timeLeft={timeLeft} />
              <div style={{ fontSize: 11, color: "#4a6070", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                {running ? "COUNTDOWN" : "PAUSED"}
              </div>
            </div>
          </div>

          {/* Road cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {ROADS.map(road => (
              <RoadCard
                key={road}
                road={road}
                count={density[road]}
                isGreen={greenRoad === road}
                onChange={handleSlider}
                emergencyActive={emergency === road}
              />
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={handleStart} style={{
              flex: 1, minWidth: 120,
              background: running ? "#1a2a36" : ROAD_COLORS.green,
              color: running ? "#c0cdd8" : "#000",
              border: "none", borderRadius: 10,
              padding: "13px 20px", fontWeight: 700, fontSize: 14,
              fontFamily: "Inter, sans-serif", cursor: "pointer",
              transition: "all 0.3s",
              boxShadow: running ? "none" : `0 0 20px rgba(0,255,135,0.3)`
            }}>
              {running ? "⏸ Pause" : "▶ Start Simulation"}
            </button>

            <button onClick={() => {
              const d = initialDensity();
              setDensity(d);
              if (running) applySignal(d, emergency);
              addLog("🔄 Sensor data refreshed");
            }} style={{
              flex: 1, minWidth: 120,
              background: "rgba(255,255,255,0.04)", color: "#c0cdd8",
              border: "1px solid #2a3a4a", borderRadius: 10,
              padding: "13px 20px", fontWeight: 600, fontSize: 14,
              fontFamily: "Inter, sans-serif", cursor: "pointer"
            }}>
              🔄 Random Sensors
            </button>
          </div>

          {/* Emergency panel */}
          <div style={{
            background: "rgba(255,184,0,0.04)", border: "1px solid rgba(255,184,0,0.2)",
            borderRadius: 14, padding: "16px 18px"
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ROAD_COLORS.amber, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
              🚨 Emergency Vehicle Override
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ROADS.map(r => (
                <button key={r} onClick={() => triggerEmergency(r)} style={{
                  background: emergency === r ? ROAD_COLORS.amber : "rgba(255,184,0,0.08)",
                  color: emergency === r ? "#000" : ROAD_COLORS.amber,
                  border: `1px solid ${emergency === r ? ROAD_COLORS.amber : "rgba(255,184,0,0.3)"}`,
                  borderRadius: 8, padding: "7px 14px",
                  fontWeight: 700, fontSize: 12,
                  fontFamily: "Inter, sans-serif", cursor: "pointer",
                  transition: "all 0.3s"
                }}>
                  {r} {emergency === r ? "✕" : "🚑"}
                </button>
              ))}
            </div>
          </div>

          {/* Activity log */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid #1a2a36",
            borderRadius: 14, padding: "16px 18px"
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#3a5060", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
              System Log
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
              {log.length === 0 && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#2a3a4a" }}>
                  Press Start to begin simulation...
                </div>
              )}
              {log.map((entry, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                  color: i === 0 ? "#c0cdd8" : "#3a5060",
                  transition: "color 0.5s"
                }}>
                  <span>{entry.msg}</span>
                  <span style={{ color: "#2a3a4a", fontSize: 10 }}>{entry.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
