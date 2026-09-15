"use client";
import { useEffect, useState } from "react";
import { getDocuments } from "@/lib/api";
import { FileText, Eye, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const rowFade = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 25, delay: i * 0.03 },
  }),
};

export default function DocumentsPage() {
  const [docs, setDocs]     = useState<any[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = (p: number) => {
    setLoading(true);
    getDocuments(p).then(d => {
      setDocs(d.documents || []); setTotal(d.total || 0); setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const filteredDocs = search.trim()
    ? docs.filter((d: any) =>
        (d.original_filename || "").toLowerCase().includes(search.toLowerCase()) ||
        (d.document_type || "").toLowerCase().includes(search.toLowerCase()) ||
        (d.analysis_id || "").toLowerCase().includes(search.toLowerCase())
      )
    : docs;

  const totalPages = Math.max(1, Math.ceil(total / 20));

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
          <h1 className="text-section" style={{ marginBottom: 2 }}>Documents</h1>
          <p className="text-caption">All screened documents ({total} total)</p>
        </div>
        <div style={{ position: "relative", minWidth: 260 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            style={{
              width: "100%", padding: "7px 10px 7px 30px",
              background: "var(--bg-surface-alt)", border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: 13, outline: "none"
            }}
          />
        </div>
      </motion.div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: "hidden", marginBottom: 16 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "220px 1fr 100px 80px 100px 90px",
          padding: "10px 18px", background: "var(--bg-surface-alt)",
          borderBottom: "1px solid var(--border-subtle)",
          fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em"
        }}>
          <div>Filename</div>
          <div>Type & ID</div>
          <div>Risk</div>
          <div>Score</div>
          <div>Status</div>
          <div style={{ textAlign: "right" }}>View</div>
        </div>

        {loading ? (
          <div style={{ padding: "50px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Loading documents...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div style={{ padding: "50px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No documents found.
          </div>
        ) : (
          filteredDocs.map((doc: any, i: number) => {
            const color = doc.risk_label === "HIGH" ? "var(--risk-high)" : doc.risk_label === "MEDIUM" ? "var(--risk-medium)" : "var(--risk-low)";

            return (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={rowFade}
                whileHover={{ backgroundColor: "var(--brand-primary-03)" }}
                style={{
                  display: "grid", gridTemplateColumns: "220px 1fr 100px 80px 100px 90px",
                  alignItems: "center",
                  padding: "12px 18px",
                  borderBottom: "1px solid var(--border-subtle)",
                  cursor: "default",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "var(--radius-sm)",
                    background: "var(--bg-surface-alt)", border: "1px solid var(--border-subtle)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <FileText size={13} color="var(--brand-primary)" />
                  </div>
                  <span className="text-body" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.original_filename}
                  </span>
                </div>

                <div>
                  <div className="text-body" style={{ fontWeight: 500 }}>{doc.document_type || "Identity Document"}</div>
                  <div className="font-mono text-caption" style={{ marginTop: 1 }}>
                    {doc.analysis_id || doc.id.slice(0, 12)}
                  </div>
                </div>

                <div>
                  {doc.risk_label ? (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-sm)",
                      background: `color-mix(in srgb, ${color} 10%, transparent)`, color,
                    }}>
                      {doc.risk_label}
                    </span>
                  ) : (
                    <span className="text-caption">N/A</span>
                  )}
                </div>

                <div className="font-mono" style={{ fontSize: 15, fontWeight: 700, color }}>
                  {doc.risk_score ?? "—"}
                </div>

                <div>
                  <span style={{
                    fontSize: 12, fontWeight: 500,
                    color: doc.review_status === "verified" ? "var(--risk-low)" : doc.review_status === "flagged_fraud" ? "var(--risk-high)" : "var(--text-muted)",
                    textTransform: "capitalize"
                  }}>
                    {doc.review_status || "Pending"}
                  </span>
                </div>

                <div style={{ textAlign: "right" }}>
                  {doc.analysis_id && (
                    <Link href={`/analyze?result=${doc.analysis_id}`} style={{ textDecoration: "none" }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: "5px 10px" }}
                      >
                        <Eye size={12} /> View
                      </motion.button>
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="text-caption">
            Page {page} of {totalPages} ({total} documents)
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary"
              style={{ padding: "5px 10px", fontSize: 12 }}
            >
              <ChevronLeft size={13} /> Prev
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary"
              style={{ padding: "5px 10px", fontSize: 12 }}
            >
              Next <ChevronRight size={13} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
