"use client";
import { useState } from "react";
import {
  ChevronDown, AlertCircle, AlertTriangle, Info,
  Terminal, HelpCircle, ArrowRight, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Finding {
  source: string;
  finding_type: string;
  severity: string;
  score?: number;
  confidence?: number;
  description: string;
  evidence?: Record<string, any>;
  rule_id?: string;
}

interface Props {
  findings: Finding[];
}

const SEV_CONFIG = {
  CRITICAL: {
    color: "var(--risk-high)",
    bg: "rgba(196, 59, 59, 0.04)",
    border: "rgba(196, 59, 59, 0.2)",
    badgeBg: "rgba(196, 59, 59, 0.08)",
    label: "CRITICAL",
    icon: ShieldAlert,
    action: "Reject or mandate in-person physical biometric check.",
  },
  HIGH: {
    color: "#B85C1A",
    bg: "rgba(184, 92, 26, 0.04)",
    border: "rgba(184, 92, 26, 0.2)",
    badgeBg: "rgba(184, 92, 26, 0.08)",
    label: "HIGH RISK",
    icon: AlertCircle,
    action: "Flagged for manual investigation by a screening officer.",
  },
  MEDIUM: {
    color: "var(--risk-medium)",
    bg: "rgba(198, 122, 26, 0.04)",
    border: "rgba(198, 122, 26, 0.2)",
    badgeBg: "rgba(198, 122, 26, 0.08)",
    label: "REVIEW",
    icon: AlertTriangle,
    action: "Quick manual check recommended.",
  },
  LOW: {
    color: "var(--text-muted)",
    bg: "rgba(138, 154, 157, 0.04)",
    border: "rgba(138, 154, 157, 0.15)",
    badgeBg: "rgba(138, 154, 157, 0.06)",
    label: "INFO",
    icon: Info,
    action: "Informational only; does not block verification.",
  },
};

const SOURCE_LABELS: Record<string, string> = {
  tamper_detector: "Error Level Analysis (ELA) & Noise Forensics",
  preprocessor: "Image Quality Analyzer",
  pattern_validator: "Pattern & Format Validator",
  consistency_checker: "Cross-Field Consistency Engine",
  layout_analyzer: "Template Layout Analyzer",
  qr_analyzer: "Cryptographic QR Verifier",
  ocr_engine: "OCR Text Recognition",
  metadata_extractor: "EXIF & Metadata Scanner",
  anomaly_detector: "AI Anomaly Classifier",
};

function getHumanExplanation(f: Finding): { title: string; explanation: string; simpleEvidence: { label: string; value: string }[] } {
  const type = (f.finding_type || "").toLowerCase();
  const desc = f.description || "";
  const ev = f.evidence || {};
  const source = SOURCE_LABELS[f.source] || f.source?.replace(/_/g, " ") || "Analysis Engine";
  const scorePct = f.score !== undefined ? `${(f.score * 100).toFixed(0)}%` : null;
  const confPct = f.confidence !== undefined ? `${(f.confidence * 100).toFixed(0)}%` : null;

  // Build title from finding_type
  let title = type
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());

  // Build explanation from actual description
  let explanation = desc || "This document signal deviated from the baseline validation rules.";

  // Build evidence cards from actual evidence JSON
  const simpleEvidence: { label: string; value: string }[] = [];

  // Always show detector
  simpleEvidence.push({ label: "Detected By", value: source });

  // Show score if available
  if (scorePct) {
    simpleEvidence.push({ label: "Risk Score", value: scorePct });
  }

  // Show confidence if available
  if (confPct) {
    simpleEvidence.push({ label: "Confidence", value: confPct });
  }

  // Extract type-specific evidence fields
  if (ev.region) simpleEvidence.push({ label: "Affected Area", value: ev.region });
  if (ev.bbox) simpleEvidence.push({ label: "Location", value: `[${ev.bbox.join(", ")}]` });
  if (ev.software) simpleEvidence.push({ label: "Software Found", value: ev.software });
  if (ev.variance_disparity) simpleEvidence.push({ label: "Variance Disparity", value: ev.variance_disparity });
  if (ev.displaced_fields) simpleEvidence.push({ label: "Displaced Fields", value: ev.displaced_fields.join(", ") });
  if (ev.blur_score !== undefined) simpleEvidence.push({ label: "Blur Score", value: String(ev.blur_score) });
  if (ev.resolution) simpleEvidence.push({ label: "Resolution", value: ev.resolution });
  if (ev.original_dob && ev.tampered_dob) {
    simpleEvidence.push({ label: "Original DOB", value: ev.original_dob });
    simpleEvidence.push({ label: "Tampered DOB", value: ev.tampered_dob });
  }
  if (ev.ocr_id && ev.qr_id) {
    simpleEvidence.push({ label: "OCR ID", value: ev.ocr_id });
    simpleEvidence.push({ label: "QR ID", value: ev.qr_id });
  }
  if (ev.anomaly_vectors) simpleEvidence.push({ label: "Anomaly Vectors", value: ev.anomaly_vectors.join(", ") });

  // Override title with more specific ones based on type
  if (type.includes("ml_anomaly") || type.includes("anomaly") || type.includes("isolation")) {
    title = "Document Layout Differs From Standard Template";
  } else if (type.includes("qr")) {
    title = "QR Code Does Not Match Printed Information";
  } else if (type.includes("splice") || type.includes("tamper") || type.includes("ela")) {
    title = "Signs of Digital Editing or Photo Splicing";
  } else if (type.includes("mismatch") || type.includes("inconsistenc") || type.includes("cross_field")) {
    title = "Data Field Discrepancy";
  } else if (type.includes("software") || type.includes("metadata") || type.includes("exif")) {
    title = "Photo Editing Software Footprint";
  } else if (type.includes("shifted") || type.includes("layout")) {
    title = "Document Layout Shift Detected";
  } else if (type.includes("quality") || type.includes("resolution") || type.includes("blur")) {
    title = "Image Quality Below Threshold";
  } else if (type.includes("pattern") || type.includes("format") || type.includes("dob")) {
    title = "Format or Pattern Violation";
  } else if (type.includes("name")) {
    title = "Name Field Anomaly";
  }

  return { title, explanation, simpleEvidence };
}

function FindingRow({ f }: { f: Finding }) {
  const [open, setOpen] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);
  const cfg = SEV_CONFIG[f.severity?.toUpperCase() as keyof typeof SEV_CONFIG] || SEV_CONFIG.LOW;
  const Icon = cfg.icon;
  const human = getHumanExplanation(f);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        border: `1px solid ${cfg.border}`,
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        background: "var(--glass-bg)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        marginBottom: 10,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: cfg.badgeBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={14} color={cfg.color} />
        </div>

        <span style={{
          fontSize: 10.5, fontWeight: 700, color: cfg.color,
          letterSpacing: "0.05em",
          padding: "2px 8px", borderRadius: "var(--radius-sm)",
          background: cfg.badgeBg,
        }}>
          {cfg.label}
        </span>

        <span style={{
          flex: 1, fontSize: 13.5, color: "var(--text-primary)", fontWeight: 600,
        }}>
          {human.title}
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <ChevronDown size={16} color="var(--text-muted)" />
        </motion.span>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "0 18px 18px 18px",
              borderTop: `1px solid ${cfg.border}`,
            }}>
              {/* Explanation */}
              <div style={{
                background: "var(--bg-surface-alt)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                marginTop: 12,
                marginBottom: 12,
              }}>
                <div style={{
                  fontSize: 10.5, fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.06em", color: "var(--text-muted)",
                  marginBottom: 5, display: "flex", alignItems: "center", gap: 5
                }}>
                  <HelpCircle size={12} color="var(--brand-primary)" />
                  What this means
                </div>
                <p style={{
                  fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0,
                }}>
                  {human.explanation}
                </p>
              </div>

              {/* Evidence */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 8, marginBottom: 12
              }}>
                {human.simpleEvidence.map((item, idx) => (
                  <div key={idx} style={{
                    background: "var(--bg-surface-alt)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                  }}>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 2 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action */}
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                fontSize: 12, color: "var(--text-secondary)",
                background: "var(--brand-primary-04)",
                border: "1px solid var(--brand-primary-15)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px", marginBottom: 10
              }}>
                <ArrowRight size={13} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                <span><strong>Suggested:</strong> {cfg.action}</span>
              </div>

              {/* Raw JSON Toggle */}
              {f.evidence && Object.keys(f.evidence).length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => setShowRawJson(!showRawJson)}
                    style={{
                      background: "transparent", border: "none",
                      color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 4, padding: 0
                    }}
                  >
                    <Terminal size={10} />
                    <span>{showRawJson ? "Hide" : "Show"} technical details</span>
                  </button>

                  <AnimatePresence>
                    {showRawJson && (
                      <motion.pre
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        style={{
                          background: "var(--bg-surface-alt)",
                          borderRadius: "var(--radius-sm)",
                          padding: "8px 12px", fontSize: 10.5,
                          color: "var(--brand-primary)",
                          fontFamily: "'JetBrains Mono', monospace",
                          border: "1px solid var(--border-subtle)",
                          overflowX: "auto", marginTop: 6, lineHeight: 1.4,
                        }}
                      >
                        {JSON.stringify(f.evidence, null, 2)}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FindingsList({ findings }: Props) {
  const sorted = [...findings].sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (order[a.severity?.toUpperCase() as keyof typeof order] ?? 4) -
           (order[b.severity?.toUpperCase() as keyof typeof order] ?? 4);
  });

  const critical = sorted.filter(f => f.severity?.toUpperCase() === "CRITICAL").length;
  const high     = sorted.filter(f => f.severity?.toUpperCase() === "HIGH").length;
  const medium   = sorted.filter(f => f.severity?.toUpperCase() === "MEDIUM").length;

  if (!findings.length) {
    return (
      <div style={{
        textAlign: "center", padding: "32px 20px",
        background: "var(--risk-low-bg)",
        border: "1px solid var(--risk-low-border)",
        borderRadius: "var(--radius-lg)",
        color: "var(--risk-low)", fontSize: 13, fontWeight: 500
      }}>
        No anomalies identified. Document signals match baseline.
      </div>
    );
  }

  return (
    <div>
      {/* Summary pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {critical > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: "var(--risk-high)",
            padding: "3px 10px", borderRadius: "var(--radius-sm)",
            background: "var(--risk-high-bg)", border: "1px solid var(--risk-high-border)",
            display: "inline-flex", alignItems: "center", gap: 5
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--risk-high)" }} />
            {critical} Critical
          </span>
        )}
        {high > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#B85C1A",
            padding: "3px 10px", borderRadius: "var(--radius-sm)",
            background: "rgba(184, 92, 26, 0.08)", border: "1px solid rgba(184, 92, 26, 0.2)",
            display: "inline-flex", alignItems: "center", gap: 5
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#B85C1A" }} />
            {high} High
          </span>
        )}
        {medium > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: "var(--risk-medium)",
            padding: "3px 10px", borderRadius: "var(--radius-sm)",
            background: "var(--risk-medium-bg)", border: "1px solid var(--risk-medium-border)",
            display: "inline-flex", alignItems: "center", gap: 5
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--risk-medium)" }} />
            {medium} Review
          </span>
        )}
      </div>

      {sorted.map((f, i) => <FindingRow key={i} f={f} />)}
    </div>
  );
}
