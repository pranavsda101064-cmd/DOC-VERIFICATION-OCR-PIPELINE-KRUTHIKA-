"use client";
import { CheckCircle2, Loader2, XCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  "File Validation",
  "Image Preprocessing",
  "OCR Extraction",
  "Document Classification",
  "Structured Field Extraction",
  "Template Layout Analysis",
  "QR / Barcode Verification",
  "Pattern & Temporal Checks",
  "Cross-Field Consistency",
  "Forensic Tamper Detection",
  "Metadata & EXIF Forensics",
  "ML Anomaly Classification",
  "Multi-Signal Risk Fusion",
];

interface Props {
  steps: { step: string; status: string; detail?: string }[];
  currentStep?: number;
  complete?: boolean;
  riskScore?: number;
  riskLabel?: string;
}

const stepVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 25, delay: i * 0.03 },
  }),
};

export function AnalysisStepper({ steps, currentStep, complete, riskScore, riskLabel }: Props) {
  const getStatus = (idx: number) => {
    if (steps && steps[idx]) return steps[idx].status;
    if (currentStep === undefined) return "pending";
    if (idx < currentStep) return "complete";
    if (idx === currentStep) return "running";
    return "pending";
  };

  const completedCount = steps ? steps.filter(s => s.status === "complete").length : (complete ? STEPS.length : (currentStep || 0));
  const progressPct = Math.round((completedCount / STEPS.length) * 100);

  const riskColors = {
    LOW:    { bg: "rgba(45,138,86,0.08)", border: "rgba(45,138,86,0.25)", text: "#2D8A56" },
    MEDIUM: { bg: "rgba(198,122,26,0.08)", border: "rgba(198,122,26,0.25)", text: "#C67A1A" },
    HIGH:   { bg: "rgba(196,59,59,0.08)", border: "rgba(196,59,59,0.25)", text: "#C43B3B" },
  };
  const riskKey = (riskLabel?.toUpperCase() || "LOW") as keyof typeof riskColors;
  const activeColor = riskColors[riskKey] || riskColors.LOW;

  return (
    <div className="glass-card" style={{ padding: "20px 18px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", letterSpacing: "0.3px" }}>
            EVALUATION PIPELINE
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            13 Forensic Layers
          </div>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 8px", borderRadius: "var(--radius-sm)",
          background: "var(--brand-primary-08)",
          color: "var(--brand-primary)", fontSize: 11, fontWeight: 700
        }}>
          <span className="font-mono">{progressPct}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 4, borderRadius: 2, background: "var(--border-subtle)", overflow: "hidden", marginBottom: 16 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          style={{
            height: "100%",
            background: "var(--brand-primary)",
          }}
        />
      </div>

      {/* Steps with connecting line */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
        {/* Connecting line */}
        <div style={{
          position: "absolute",
          left: 17,
          top: 16,
          bottom: 16,
          width: 2,
          background: "var(--border-subtle)",
          borderRadius: 1,
          zIndex: 0,
        }} />
        <div style={{
          position: "absolute",
          left: 17,
          top: 16,
          width: 2,
          height: `${Math.min(100, (completedCount / STEPS.length) * 100)}%`,
          background: "var(--brand-primary)",
          borderRadius: 1,
          zIndex: 1,
          transition: "height 0.4s ease",
        }} />

        {STEPS.map((stepLabel, i) => {
          const status = getStatus(i);
          const detail = steps?.[i]?.detail;
          const isCurrent = status === "running";
          const isDone = status === "complete";
          const isFailed = status === "failed";

          return (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={stepVariants}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "5px 10px", borderRadius: "var(--radius-sm)",
                background: isCurrent ? "var(--brand-primary-06)" : "transparent",
                transition: "background 0.2s ease",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isDone ? (
                    <CheckCircle2 size={15} color="var(--risk-low)" />
                  ) : isCurrent ? (
                    <Loader2 size={15} color="var(--brand-primary)" className="animate-spin" />
                  ) : isFailed ? (
                    <XCircle size={15} color="var(--risk-high)" />
                  ) : (
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: "1.5px solid var(--border)",
                      background: "var(--bg-surface)",
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize: 12.5,
                  color: isDone ? "var(--text-primary)" : isCurrent ? "var(--brand-primary)" : isFailed ? "var(--risk-high)" : "var(--text-muted)",
                  fontWeight: isCurrent ? 600 : isDone ? 500 : 400,
                }}>
                  {stepLabel}
                </span>
              </div>
              {detail && isDone && (
                <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  {detail}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Completion Callout */}
      {complete && riskScore !== undefined && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            marginTop: 16, padding: "14px",
            background: activeColor.bg,
            border: `1px solid ${activeColor.border}`,
            borderRadius: "var(--radius-md)", textAlign: "center",
          }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: activeColor.text, fontWeight: 700, fontSize: 13, letterSpacing: "0.3px"
          }}>
            <ShieldCheck size={15} />
            PIPELINE EVALUATED
          </div>
          <div style={{
            color: "var(--text-primary)", fontSize: 13, fontWeight: 700, marginTop: 4,
            fontFamily: "'JetBrains Mono', monospace", fontFeatureSettings: '"tnum"'
          }}>
            {riskLabel} RISK · {riskScore}/100
          </div>
        </motion.div>
      )}
    </div>
  );
}
