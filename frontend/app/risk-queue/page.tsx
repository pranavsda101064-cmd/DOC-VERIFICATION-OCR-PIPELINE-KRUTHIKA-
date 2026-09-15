"use client";
import { useEffect, useState } from "react";
import { getRiskQueue } from "@/lib/api";
import { ReviewModal } from "@/components/ReviewModal";
import { AlertTriangle, RefreshCw, Eye, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20, delay: i * 0.05 },
  }),
};

const rowFade = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 25, delay: i * 0.03 },
  }),
};

export default function RiskQueuePage() {
  const [queue, setQueue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL"|"HIGH"|"MEDIUM"|"LOW">("ALL");
  const [search, setSearch] = useState("");
  const [selectedReview, setSelectedReview] = useState<any | null>(null);

  const load = () => {
    setLoading(true);
    getRiskQueue().then(d => { setQueue(d); setLoading(false); })
                  .catch(() => setLoading(false));
  };
  useEffect(load, []);

  const high = queue?.high || [];
  const medium = queue?.medium || [];
  const low = queue?.low || [];

  let items = filter === "HIGH" ? high
            : filter === "MEDIUM" ? medium
            : filter === "LOW" ? low
            : [...high, ...medium, ...low];

  if (search.trim()) {
    items = items.filter((item: any) =>
      (item.document_type || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.analysis_id || "").toLowerCase().includes(search.toLowerCase())
    );
  }

  const total = high.length + medium.length + low.length;

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
          <h1 className="text-section" style={{ marginBottom: 2 }}>Risk Queue</h1>
          <p className="text-caption">Flagged documents pending manual review ({total} total)</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={load}
          className="btn-secondary"
          style={{ fontSize: 12 }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </motion.button>
      </motion.div>

      {/* Summary Cards */}
      <div className="risk-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        {[
          { label: "Total", value: total, color: "var(--text-primary)" },
          { label: "High", value: high.length, color: "var(--risk-high)" },
          { label: "Medium", value: medium.length, color: "var(--risk-medium)" },
          { label: "Low", value: low.length, color: "var(--risk-low)" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            whileHover={{ y: -2, scale: 1.02 }}
            className="glass-card"
            style={{ padding: "14px 16px" }}
          >
            <div className="text-caption" style={{ fontWeight: 600, textTransform: "uppercase", color: card.color }}>{card.label}</div>
            <div className="font-mono text-kpi" style={{ fontSize: 24, marginTop: 4, color: card.color }}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="glass-card"
        style={{ padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "ALL", label: `All (${total})` },
            { id: "HIGH", label: `High (${high.length})` },
            { id: "MEDIUM", label: `Medium (${medium.length})` },
            { id: "LOW", label: `Low (${low.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className="chart-tab"
              data-active={filter === tab.id}
              style={{ position: "relative" }}
            >
              {filter === tab.id && (
                <motion.span
                  layoutId="risk-filter-pill"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-surface)",
                    boxShadow: "var(--shadow-sm)",
                    zIndex: 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span style={{ position: "relative", zIndex: 1 }}>{tab.label}</span>
            </button>
          ))}
        </div>
        <div style={{ position: "relative", minWidth: 240 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search analysis ID..."
            style={{
              width: "100%", padding: "7px 10px 7px 30px",
              background: "var(--bg-surface-alt)", border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: 13, outline: "none"
            }}
          />
        </div>
      </motion.div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "160px 1fr 80px 120px 120px",
          padding: "10px 18px", background: "var(--bg-surface-alt)",
          borderBottom: "1px solid var(--border-subtle)",
          fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em"
        }}>
          <div>ID</div>
          <div>Document</div>
          <div>Score</div>
          <div>Risk</div>
          <div style={{ textAlign: "right" }}>Actions</div>
        </div>

        {items.map((item: any, i: number) => {
          const isHigh = item.risk_label === "HIGH";
          const color = isHigh ? "var(--risk-high)" : item.risk_label === "MEDIUM" ? "var(--risk-medium)" : "var(--risk-low)";

          return (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={rowFade}
              whileHover={{ backgroundColor: isHigh ? "rgba(196, 59, 59, 0.04)" : "var(--brand-primary-03)" }}
              style={{
                display: "grid", gridTemplateColumns: "160px 1fr 80px 120px 120px",
                alignItems: "center",
                padding: "12px 18px",
                borderBottom: "1px solid var(--border-subtle)",
                cursor: "default",
              }}
            >
              <div className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                {item.analysis_id}
              </div>
              <div>
                <div className="text-body" style={{ fontWeight: 500 }}>{item.document_type || "Identity Document"}</div>
                <div className="text-caption" style={{ marginTop: 1 }}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Today"}
                </div>
              </div>
              <div className="font-mono" style={{ fontSize: 15, fontWeight: 700, color }}>
                {item.risk_score}
              </div>
              <div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-sm)",
                  background: `color-mix(in srgb, ${color} 10%, transparent)`, color,
                }}>
                  {item.risk_label}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedReview(item)}
                  className="btn-primary"
                  style={{ fontSize: 12, padding: "5px 10px" }}
                >
                  Review
                </motion.button>
                <Link href={`/analyze?result=${item.analysis_id}`} style={{ textDecoration: "none" }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: "5px 8px" }}
                  >
                    <Eye size={12} />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          );
        })}

        {items.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            {loading ? "Loading..." : "No documents matching filter."}
          </div>
        )}
      </div>

      {selectedReview && (
        <ReviewModal
          analysisId={selectedReview.analysis_id}
          documentId={selectedReview.document_id}
          riskScore={selectedReview.risk_score}
          riskLabel={selectedReview.risk_label}
          onClose={() => setSelectedReview(null)}
          onSubmitted={() => { setSelectedReview(null); load(); }}
        />
      )}
    </div>
  );
}
