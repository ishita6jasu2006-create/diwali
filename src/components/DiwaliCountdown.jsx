
import { useState, useEffect } from "react";
import "./DiwaliCountdown.css";

// Diwali 2026: Nov 8, 17:54 IST  (UTC+5:30 → UTC 12:24)
const DIWALI_IST = new Date("2026-11-08T17:54:00+05:30");

function pad(n) {
  return String(n).padStart(2, "0");
}

function getCountdown() {
  const now = new Date();
  const diff = DIWALI_IST - now;

  if (diff <= 0) return null; // Diwali has arrived / passed

  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function DiwaliCountdown() {
  const [time, setTime] = useState(getCountdown());

  useEffect(() => {
    const id = setInterval(() => setTime(getCountdown()), 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: "Days",    value: time ? pad(time.days)    : "00" },
    { label: "Hours",   value: time ? pad(time.hours)   : "00" },
    { label: "Minutes", value: time ? pad(time.minutes) : "00" },
    { label: "Seconds", value: time ? pad(time.seconds) : "00" },
  ];

  return (
    <div className="countdown-wrapper">
      <p className="countdown-eyebrow">✦ DIWALI COUNTDOWN ✦</p>

      {time ? (
        <>
          <div className="countdown-grid">
            {units.map(({ label, value }) => (
              <div key={label} className="countdown-block">
                <span className="countdown-number">{value}</span>
                <span className="countdown-label">{label}</span>
              </div>
            ))}
          </div>

          <p className="countdown-date">
            🪔 &nbsp;8 November 2026 &nbsp;•&nbsp; 5:54 PM &nbsp;
            <span className="countdown-tz">IST</span>
          </p>
        </>
      ) : (
        <p className="countdown-arrived">
          🎆 Happy Diwali! The Festival of Lights is here! 🎆
        </p>
      )}
    </div>
  );
}

export default DiwaliCountdown;
