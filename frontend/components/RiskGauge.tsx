"use client";
import React, { useId, useEffect, useState } from "react";

interface Props {
  score: number;
  label: string;
  size?: number;
}

const COLORS = {
  LOW:    { stroke: "#2D8A56", text: "#2D8A56", bg: "rgba(45,138,86,0.08)", border: "rgba(45,138,86,0.25)" },
  MEDIUM: { stroke: "#C67A1A", text: "#C67A1A", bg: "rgba(198,122,26,0.08)", border: "rgba(198,122,26,0.25)" },
  HIGH:   { stroke: "#C43B3B", text: "#C43B3B", bg: "rgba(196,59,59,0.08)", border: "rgba(196,59,59,0.25)" },
};

function useAnimatedNumber(target: number, duration = 800) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = current;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return current;
}

export function RiskGauge({ score, label, size = 180 }: Props) {
  const filterId = useId().replace(/:/g, "");
  const normalizedLabel = (label?.toUpperCase() in COLORS) ? label.toUpperCase() : "LOW";
  const colors = COLORS[normalizedLabel as keyof typeof COLORS];
  const displayScore = useAnimatedNumber(score);

  const strokeWidth = 12;
  const R = size / 2 - strokeWidth;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const circumference = Math.PI * R;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const strokeDash = pct * circumference;

  const glowId = `glow-${filterId}`;

  return (
    <div style={{
      position: "relative", width: size, height: size / 2 + 50,
      display: "flex", flexDirection: "column", alignItems: "center"
    }}>
      <svg width={size} height={size / 2 + 20} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`gauge-grad-${filterId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.6" />
            <stop offset="100%" stopColor={colors.stroke} stopOpacity="1" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor={colors.stroke} floodOpacity="0.3" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <path
          d={`M ${strokeWidth} ${cy} A ${R} ${R} 0 0 1 ${size - strokeWidth} ${cy}`}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value Arc with glow */}
        <path
          d={`M ${strokeWidth} ${cy} A ${R} ${R} 0 0 1 ${size - strokeWidth} ${cy}`}
          fill="none"
          stroke={`url(#gauge-grad-${filterId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          filter={`url(#${glowId})`}
          style={{
            transition: "stroke-dasharray 1s var(--ease-out)",
          }}
        />

        {/* Score */}
        <text
          x={cx} y={cy - 10}
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize={size * 0.24}
          fontWeight={700}
          fontFamily="'JetBrains Mono', monospace"
          fontFeatureSettings='"tnum"'
          letterSpacing="-1px"
        >
          {displayScore}
        </text>
        <text
          x={cx} y={cy + 14}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize={11}
          fontWeight={500}
          fontFamily="Inter, sans-serif"
          letterSpacing="0.5px"
        >
          RISK INDEX / 100
        </text>
      </svg>

      {/* Status Pill */}
      <div style={{
        marginTop: 6,
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 12px", borderRadius: "var(--radius-sm)",
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          backgroundColor: colors.stroke,
          boxShadow: `0 0 6px ${colors.stroke}`,
        }} />
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.5px",
          color: colors.text, textTransform: "uppercase"
        }}>
          {label} RISK
        </span>
      </div>
    </div>
  );
}
