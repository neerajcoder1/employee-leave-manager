import React from "react";
import AnimatedNumber from "./AnimatedNumber";

const CARD_ACCENTS = {
  annual: {
    color: "hsl(263.4, 70%, 60%)",
    glow: "hsla(263.4, 70%, 50.4%, 0.15)",
    border: "hsla(263.4, 70%, 50.4%, 0.25)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  sick: {
    color: "hsl(142.1, 70.6%, 48%)",
    glow: "hsla(142.1, 70.6%, 45.3%, 0.12)",
    border: "hsla(142.1, 70.6%, 45.3%, 0.25)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  maternity: {
    color: "hsl(346.8, 77.2%, 58%)",
    glow: "hsla(346.8, 77.2%, 49.8%, 0.12)",
    border: "hsla(346.8, 77.2%, 49.8%, 0.25)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
};

const LeaveBalanceCard = ({ type, availableDays, totalDays, usedDays }) => {
  const key = type.toLowerCase();
  const accent = CARD_ACCENTS[key] || CARD_ACCENTS.annual;
  const pct = totalDays > 0 ? Math.min((availableDays / totalDays) * 100, 100) : 0;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${accent.border}`,
        borderRadius: "14px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 12px 32px -8px ${accent.glow}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: "-30px", right: "-30px",
        width: "100px", height: "100px", borderRadius: "50%",
        background: accent.glow, filter: "blur(30px)", pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{
            fontSize: "0.72rem", fontWeight: "600", textTransform: "uppercase",
            letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.25rem",
          }}>
            {type} Leave
          </div>
          <div style={{ fontSize: "2.4rem", fontWeight: "800", letterSpacing: "-0.04em", lineHeight: 1, color: "var(--text-primary)" }}>
            <AnimatedNumber value={availableDays} />
            <span style={{ fontSize: "1rem", fontWeight: "500", color: "var(--text-secondary)", marginLeft: "4px" }}>
              / {totalDays}
            </span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            days remaining
          </div>
        </div>
        <div style={{
          width: "42px", height: "42px", borderRadius: "10px",
          background: accent.glow, border: `1px solid ${accent.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent.color, flexShrink: 0,
        }}>
          {accent.icon}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{
          height: "6px", background: "var(--bg-app)", borderRadius: "99px", overflow: "hidden",
        }}>
          <div style={{
            width: `${pct}%`, height: "100%", background: accent.color,
            borderRadius: "99px", transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
          }} />
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: "0.4rem",
          fontSize: "0.72rem", color: "var(--text-muted)",
        }}>
          <span>Used: {usedDays} days</span>
          <span style={{ color: accent.color, fontWeight: "600" }}>{Math.round(pct)}% left</span>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalanceCard;
