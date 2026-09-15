"use client";
import { useState, useEffect } from "react";
import { compareAnalyses, getDocuments } from "@/lib/api";
import { ArrowRightLeft, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20, delay: i * 0.06 },
  }),
};

export default function ComparePage() {
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string|null>(null);

  useEffect(() => {
    getDocuments(1).then(d => setRecentDocs(d.documents || [])).catch(() => {});
  }, []);

  const handleCompare = async () => {
    if (!idA || !idB) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await compareAnalyses(idA.trim(), idB.trim());
      setResult(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)"
        }}
      >
        <div>
          <h1 className="text-section" style={{ marginBottom: 2 }}>Compare</h1>
          <p className="text-caption">Cross-compare two analysis reports side-by-side</p>
        </div>
      </motion.div>

      {/* Input Card */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="glass-card"
        style={{ padding: 22, marginBottom: 20 }}
      >
        <div className="compare-input-grid" style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", gap: 14, alignItems: "center" }}>
          <div>
            <label className="text-caption" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
              Analysis A
            </label>
            <input
              value={idA} onChange={e => setIdA(e.target.value)}
              placeholder="e.g. ANA-5A58DC3C"
              className="font-mono"
              style={{
                width: "100%", padding: "10px 12px",
                background: "var(--bg-surface-alt)", border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: 13, outline: "none"
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", marginTop: "18px" }}>
            <ArrowRightLeft size={15} />
          </div>
          <div>
            <label className="text-caption" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
              Analysis B
            </label>
            <input
              value={idB} onChange={e => setIdB(e.target.value)}
              placeholder="e.g. ANA-3DC61E67"
              className="font-mono"
              style={{
                width: "100%", padding: "10px 12px",
                background: "var(--bg-surface-alt)", border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: 13, outline: "none"
              }}
            />
          </div>
        </div>

        {recentDocs.length >= 2 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
            <div className="text-caption" style={{ fontWeight: 600, marginBottom: 6 }}>Quick select from recent</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {recentDocs.slice(0, 4).map((doc, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!idA) setIdA(doc.analysis_id || doc.id);
                    else if (!idB) setIdB(doc.analysis_id || doc.id);
                    else { setIdA(doc.analysis_id || doc.id); setIdB(""); }
                  }}
                  style={{
                    padding: "3px 8px", borderRadius: "var(--radius-sm)",
                    background: "var(--bg-surface-alt)", border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)", fontSize: 12, cursor: "pointer"
                  }}
                >
                  <span className="font-mono">{doc.analysis_id || doc.id.slice(0, 8)}</span>
                  <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>({doc.risk_label || "DOC"})</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary"
            onClick={handleCompare}
            disabled={!idA || !idB || loading}
            style={{ opacity: (!idA || !idB) ? 0.5 : 1 }}
          >
            {loading ? "Comparing..." : "Compare"}
          </motion.button>
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: "var(--radius-sm)",
            background: "var(--risk-high-bg)", border: "1px solid var(--risk-high-border)",
            color: "var(--risk-high)", fontSize: 13, display: "flex", alignItems: "center", gap: 6
          }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="glass-card"
            style={{ overflow: "hidden" }}
          >
            <div style={{
              display: "grid", gridTemplateColumns: "180px 1fr 1fr 80px",
              padding: "10px 18px", background: "var(--bg-surface-alt)",
              borderBottom: "1px solid var(--border-subtle)",
              fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em"
            }}>
              <div>Field</div>
              <div className="font-mono" style={{ color: "var(--brand-primary)" }}>{result.analysis_a}</div>
              <div className="font-mono" style={{ color: "var(--brand-accent)" }}>{result.analysis_b}</div>
              <div style={{ textAlign: "center" }}>Match</div>
            </div>

            {result.comparison.map((row: any, i: number) => {
              const match = row.match;
              const isMismatch = match === false;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25, delay: i * 0.03 }}
                  style={{
                    display: "grid", gridTemplateColumns: "180px 1fr 1fr 80px",
                    alignItems: "center",
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border-subtle)",
                    background: isMismatch ? "rgba(196, 59, 59, 0.02)" : "transparent",
                  }}
                >
                  <div className="text-body" style={{ color: "var(--text-secondary)", fontWeight: 500, textTransform: "capitalize" }}>
                    {(row.field as string).replace(/_/g, " ")}
                  </div>
                  <div className="font-mono" style={{ fontSize: 13, color: "var(--text-primary)" }}>
                    {String(row.value_a ?? "—")}
                  </div>
                  <div className="font-mono" style={{
                    fontSize: 13, fontWeight: isMismatch ? 600 : 400,
                    color: isMismatch ? "var(--risk-high)" : "var(--text-primary)",
                  }}>
                    {String(row.value_b ?? "—")}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    {match === true ? (
                      <span style={{
                        padding: "2px 7px", borderRadius: "var(--radius-sm)",
                        background: "var(--risk-low-bg)", border: "1px solid var(--risk-low-border)",
                        color: "var(--risk-low)", fontSize: 10, fontWeight: 700
                      }}>
                        MATCH
                      </span>
                    ) : match === false ? (
                      <span style={{
                        padding: "2px 7px", borderRadius: "var(--radius-sm)",
                        background: "var(--risk-high-bg)", border: "1px solid var(--risk-high-border)",
                        color: "var(--risk-high)", fontSize: 10, fontWeight: 700
                      }}>
                        DIFF
                      </span>
                    ) : (
                      <span className="text-caption">—</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
