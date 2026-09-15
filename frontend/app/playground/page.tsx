"use client";
import { useState, useEffect, useCallback } from "react";
import { getDemoDocuments, runDemo } from "@/lib/api";
import { ScanLine, Shield, FileWarning, Fingerprint, QrCode, Loader2, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const PRESET_ICONS: Record<string, any> = {
  authentic: Shield,
  text_tampered: FileWarning,
  photo_tampered: Fingerprint,
  qr_mismatch: QrCode,
  low_quality: AlertTriangle,
  inconsistent: FileWarning,
  layout_tampered: FileWarning,
  anomaly: XCircle,
};

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  LOW:    { bg: "var(--risk-low-bg)",    text: "var(--risk-low)",    border: "var(--risk-low-border)" },
  MEDIUM: { bg: "var(--risk-medium-bg)", text: "var(--risk-medium)", border: "var(--risk-medium-border)" },
  HIGH:   { bg: "var(--risk-high-bg)",   text: "var(--risk-high)",   border: "var(--risk-high-border)" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20, delay: i * 0.08 },
  }),
};

export default function PlaygroundPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getDemoDocuments().then(d => setDocs(d.demo_documents || [])).catch(() => {});
  }, []);

  const handleRun = useCallback(async (docName: string) => {
    setRunning(docName);
    setErrors(prev => { const n = { ...prev }; delete n[docName]; return n; });
    try {
      const data = await runDemo(docName);
      setResults(prev => ({ ...prev, [docName]: data.result || data }));
    } catch (e: any) {
      setErrors(prev => ({ ...prev, [docName]: e.message }));
    } finally {
      setRunning(null);
    }
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ maxWidth: 600 }}
      >
        <div style={{
          fontSize: 12, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.06em", color: "var(--brand-accent)", marginBottom: 8,
        }}>
          Simulation Lab
        </div>
        <h1 style={{
          fontSize: "clamp(26px, 3.5vw, 36px)",
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
          marginBottom: 12,
        }}>
          Quick Test Presets
        </h1>
        <p style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}>
          Run pre-configured document simulations against the screening pipeline. Each preset exercises a different fraud detection vector.
        </p>
      </motion.section>

      {/* Preset Grid */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {docs.map((doc: any, i: number) => {
          const Icon = PRESET_ICONS[doc.name] || ScanLine;
          const isRunning = running === doc.name;
          const result = results[doc.name];
          const error = errors[doc.name];
          const rc = RISK_COLORS[doc.expected_risk] || RISK_COLORS.MEDIUM;

          return (
            <motion.div
              key={doc.name}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="glass-card"
                style={{
                  padding: "22px 24px",
                  cursor: isRunning ? "default" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  opacity: isRunning ? 0.8 : 1,
                }}
                onClick={() => !isRunning && !result && handleRun(doc.name)}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36,
                      borderRadius: "var(--radius-md)",
                      background: `${rc.text}10`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={18} color={rc.text} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
                        {doc.label}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: "2px 7px", borderRadius: "var(--radius-sm)",
                        background: `${rc.text}12`, color: rc.text,
                        letterSpacing: "0.03em",
                      }}>
                        {doc.expected_risk} ~{doc.expected_score}
                      </span>
                    </div>
                  </div>

                  {/* Status indicator */}
                  {isRunning && (
                    <Loader2 size={16} className="animate-spin" color="var(--brand-accent)" />
                  )}
                  {!isRunning && result && (
                    <CheckCircle2 size={16} color="var(--risk-low)" />
                  )}
                  {!isRunning && !result && !error && (
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: "3px 10px", borderRadius: "var(--radius-sm)",
                      background: `${rc.text}10`, color: rc.text,
                    }}>
                      {doc.available !== false ? "Run" : "Unavailable"}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
                  {doc.description}
                </p>

                {/* Inline Result */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{
                        padding: "12px 14px", borderRadius: "var(--radius-md)",
                        background: RISK_COLORS[result.risk_label]?.bg || "var(--bg-surface-alt)",
                        border: `1px solid ${RISK_COLORS[result.risk_label]?.border || "var(--border-subtle)"}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: RISK_COLORS[result.risk_label]?.text || "var(--text-primary)" }}>
                              {result.risk_score}
                            </span>
                            <span className="font-mono" style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-sm)",
                              background: RISK_COLORS[result.risk_label]?.text + "15",
                              color: RISK_COLORS[result.risk_label]?.text,
                            }}>
                              {result.risk_label}
                            </span>
                          </div>
                          <span className="text-caption" style={{ fontWeight: 500 }}>
                            {result.document_type || "Identity Document"}
                          </span>
                        </div>

                        {/* Quick stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                          <div style={{ padding: "4px 6px", borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.04)" }}>
                            <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Template</div>
                            <div className="font-mono" style={{ fontSize: 12, fontWeight: 600 }}>
                              {result.template_similarity ? `${(result.template_similarity * 100).toFixed(0)}%` : "—"}
                            </div>
                          </div>
                          <div style={{ padding: "4px 6px", borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.04)" }}>
                            <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>OCR</div>
                            <div className="font-mono" style={{ fontSize: 12, fontWeight: 600 }}>
                              {result.ocr_avg_confidence ? `${(result.ocr_avg_confidence * 100).toFixed(0)}%` : "—"}
                            </div>
                          </div>
                          <div style={{ padding: "4px 6px", borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.04)" }}>
                            <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>QR</div>
                            <div className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: result.qr_status === "decoded" ? "var(--risk-low)" : "var(--text-primary)" }}>
                              {result.qr_status ? result.qr_status.toUpperCase() : "—"}
                            </div>
                          </div>
                        </div>

                        {/* Findings count */}
                        {result.findings && result.findings.length > 0 && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                            {result.findings.length} finding{result.findings.length !== 1 ? "s" : ""} detected
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 6 }}>
                          <Link href={`/analyze?result=${result.analysis_id || ""}`} style={{ textDecoration: "none" }}>
                            <button
                              className="btn-secondary"
                              style={{ fontSize: 11, padding: "5px 10px" }}
                              onClick={e => e.stopPropagation()}
                            >
                              View Full Analysis <ArrowRight size={11} />
                            </button>
                          </Link>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: 11, padding: "5px 10px" }}
                            onClick={(e) => { e.stopPropagation(); setResults(prev => { const n = { ...prev }; delete n[doc.name]; return n; }); }}
                          >
                            Re-run
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                {error && (
                  <div style={{
                    padding: "8px 10px", borderRadius: "var(--radius-sm)",
                    background: "var(--risk-high-bg)", border: "1px solid var(--risk-high-border)",
                    color: "var(--risk-high)", fontSize: 12,
                  }}>
                    {error}
                  </div>
                )}

                {/* Footer — only show when no result yet */}
                {!result && !isRunning && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingTop: 12, borderTop: "1px solid var(--border-subtle)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <ScanLine size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Run screening simulation
                      </span>
                    </div>
                    <ArrowRight size={14} color={rc.text} />
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </section>

      {/* Info strip */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
        className="glass-card"
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "var(--brand-accent)",
          flexShrink: 0,
        }} />
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
          Each preset routes through the full 13-step pipeline: ELA analysis, QR decryption, OCR extraction, font grid matching, and ML anomaly scoring. Results appear inline after processing.
        </p>
      </motion.section>
    </div>
  );
}
