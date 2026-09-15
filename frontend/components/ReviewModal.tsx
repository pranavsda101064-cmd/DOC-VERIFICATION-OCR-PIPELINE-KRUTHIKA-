"use client";
import { useState } from "react";
import { submitReview } from "@/lib/api";
import { CheckCircle, XCircle, HelpCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  analysisId: string;
  documentId?: string;
  riskScore: number;
  riskLabel: string;
  onClose: () => void;
  onComplete?: (decision: string) => void;
  onSubmitted?: (decision: string) => void;
}

export function ReviewModal({ analysisId, documentId, riskScore, riskLabel, onClose, onComplete, onSubmitted }: Props) {
  const [decision, setDecision] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const labelColor = riskLabel === "HIGH" ? "var(--risk-high)" : riskLabel === "MEDIUM" ? "var(--risk-medium)" : "var(--risk-low)";

  const DECISIONS = [
    { id: "approve",      label: "APPROVE",         icon: CheckCircle,  color: "var(--risk-low)", bg: "rgba(45,138,86,0.08)" },
    { id: "reject",       label: "REJECT",           icon: XCircle,      color: "var(--risk-high)", bg: "rgba(196,59,59,0.08)" },
    { id: "request_info", label: "REQUEST INFO",     icon: HelpCircle,   color: "var(--risk-medium)", bg: "rgba(198,122,26,0.08)" },
  ];

  const handleSubmit = async () => {
    if (!decision) return;
    setLoading(true);
    try {
      await submitReview(analysisId, decision, notes);
      onComplete?.(decision);
      onSubmitted?.(decision);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(40, 48, 43, 0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ width: 460, padding: 28 }}
        >
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Human Review
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Analysis ID: <span className="font-mono" style={{ color: "var(--brand-primary)" }}>{analysisId}</span>
              {" · "}<span style={{ color: labelColor, fontWeight: 600 }}>
                {riskLabel} RISK {riskScore}/100
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 8, fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Decision
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {DECISIONS.map(d => {
              const Icon = d.icon;
              const active = decision === d.id;
              return (
                <motion.button
                  key={d.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDecision(d.id)}
                  style={{
                    flex: 1, padding: "10px 8px",
                    border: `1.5px solid ${active ? d.color : "var(--border)"}`,
                    borderRadius: "var(--radius-md)",
                    background: active ? d.bg : "var(--glass-bg)",
                    color: active ? d.color : "var(--text-muted)",
                    cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 4, fontSize: 10,
                    fontWeight: 700, letterSpacing: "0.5px",
                  }}
                >
                  <Icon size={18} />
                  {d.label}
                </motion.button>
              );
            })}
          </div>

          <div style={{ marginBottom: 8, fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Notes (optional)
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add review notes..."
            style={{
              width: "100%", minHeight: 80, padding: "10px 12px",
              background: "var(--bg-surface-alt)", border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: 13,
              resize: "vertical", outline: "none",
              boxSizing: "border-box", fontFamily: "inherit",
            }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <motion.button
              className="btn-secondary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              style={{ fontSize: 13 }}
            >
              Cancel
            </motion.button>
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!decision || loading}
              style={{ fontSize: 13, opacity: !decision ? 0.5 : 1 }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Submit Review"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
