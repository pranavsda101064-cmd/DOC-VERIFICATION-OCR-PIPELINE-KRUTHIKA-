"use client";
import { useEffect, useState, useCallback } from "react";
import { getAnalytics, getRiskQueue, getHealth } from "@/lib/api";
import {
  AlertTriangle, FileCheck, TrendingUp, ArrowRight,
  ScanLine
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import { Carousel } from "@/components/Carousel";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", mass: 0.8, stiffness: 200, damping: 20, delay: i * 0.08 },
  }),
};

function StatCard({ label, value, sub, trend, color }: {
  label: string; value: any; sub?: string; trend?: string; color: string;
}) {
  return (
    <motion.div
      className="bento-card"
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ padding: "18px 20px" }}
    >
      <div style={{
        fontSize: 12, color: "var(--text-muted)", fontWeight: 500,
        letterSpacing: "0.03em", textTransform: "uppercase", marginBottom: 10
      }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div className="text-kpi">{value}</div>
        {trend && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px",
            borderRadius: "var(--radius-sm)",
            background: "var(--risk-low-bg)", color: "var(--risk-low)",
          }}>
            {trend}
          </span>
        )}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          {sub}
        </div>
      )}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
        background: color, opacity: 0.3
      }} />
    </motion.div>
  );
}

function ChartTabBtn({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      className="chart-tab"
      data-active={active}
      onClick={onClick}
      style={{ position: "relative" }}
    >
      {active && (
        <motion.span
          layoutId="chart-pill"
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
      <span style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
        {icon}
        {label}
      </span>
    </button>
  );
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [queue, setQueue]         = useState<any>(null);
  const [health, setHealth]       = useState<any>(null);
  const [chartTab, setChartTab]   = useState<"risk" | "threat">("risk");

  const loadData = useCallback(() => {
    getAnalytics().then(setAnalytics).catch(() => {});
    getRiskQueue().then(setQueue).catch(() => {});
    getHealth().then(setHealth).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();

    const onVisible = () => { if (document.visibilityState === "visible") loadData(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", loadData);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", loadData);
    };
  }, [loadData]);

  const totalPie = (analytics?.low_risk_count || 0) + (analytics?.medium_risk_count || 0) + (analytics?.high_risk_count || 0);
  const hasData = totalPie > 0;

  const PIE_DATA = hasData ? [
    { name: "Low Risk",    value: analytics.low_risk_count,    color: "var(--risk-low)" },
    { name: "Medium Risk", value: analytics.medium_risk_count, color: "var(--risk-medium)" },
    { name: "High Risk",   value: analytics.high_risk_count,   color: "var(--risk-high)" },
  ] : [
    { name: "Low Risk",    value: 0, color: "var(--risk-low)" },
    { name: "Medium Risk", value: 0, color: "var(--risk-medium)" },
    { name: "High Risk",   value: 0, color: "var(--risk-high)" },
  ];

  const anomData = analytics?.anomaly_breakdown && Object.keys(analytics.anomaly_breakdown).length > 0
    ? Object.entries(analytics.anomaly_breakdown).map(
        ([k, v]) => ({ name: k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), value: v as number })
      )
    : [];

  const pendingReview = (queue?.high?.length || 0) + (queue?.medium?.length || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", mass: 0.8, stiffness: 200, damping: 20 }}
        style={{
          position: "relative",
          padding: "24px 0 8px 0",
          maxWidth: 680,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h1 style={{
          fontSize: "clamp(28px, 4vw, 42px)",
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
          marginBottom: 12,
        }}>
          Document Fraud Screening
        </h1>
        <p style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          maxWidth: 480,
          margin: "0 auto 24px auto",
        }}>
          Verify the authenticity of government-issued identity documents using multi-signal forensic analysis.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/analyze" style={{ textDecoration: "none" }}>
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.03, boxShadow: "0 4px 20px var(--brand-primary-25)" }}
              whileTap={{ scale: 0.97 }}
              style={{ padding: "10px 22px", fontSize: 13.5 }}
            >
              <ScanLine size={15} />
              <span>Screen Document</span>
              <ArrowRight size={13} />
            </motion.button>
          </Link>
          <Link href="/risk-queue" style={{ textDecoration: "none" }}>
            <motion.button
              className="btn-secondary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{ padding: "10px 20px", fontSize: 13.5 }}
            >
              <AlertTriangle size={14} color="var(--risk-medium)" />
              <span>Risk Queue</span>
              {pendingReview > 0 && (
                <span style={{
                  background: "var(--risk-medium-bg)", color: "var(--risk-medium)",
                  fontSize: 11, fontWeight: 700, padding: "1px 6px",
                  borderRadius: "var(--radius-sm)", marginLeft: 2
                }}>
                  {pendingReview}
                </span>
              )}
            </motion.button>
          </Link>
        </div>
      </motion.section>

      {/* Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", mass: 0.8, stiffness: 200, damping: 20, delay: 0.1 }}
      >
        <Carousel />
      </motion.div>

      {/* Stats Strip — Real Data Only */}
      <motion.section
        custom={2}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={fadeUp}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}
      >
        <StatCard
          label="Total Screened"
          value={analytics?.total_documents ?? 0}
          sub="Documents evaluated"
          color="var(--brand-primary)"
        />
        <StatCard
          label="High Risk"
          value={analytics?.high_risk_count ?? 0}
          sub="Tampering & forgeries blocked"
          color="var(--risk-high)"
        />
        <StatCard
          label="Pending Review"
          value={pendingReview}
          sub="Officer triage queue"
          color="var(--risk-medium)"
        />
        <StatCard
          label="Mean Risk Score"
          value={analytics?.average_risk_score ?? "—"}
          sub="Normalized 0–100"
          color="var(--risk-low)"
        />
      </motion.section>

      {/* Demo Verdicts */}
      <motion.section
        custom={3}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={fadeUp}
      >
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          marginBottom: 16
        }}>
          <div>
            <div style={{
              fontSize: 12, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.06em", color: "var(--brand-accent)", marginBottom: 4
            }}>
              Explainable AI
            </div>
            <h2 className="text-section">Reasoned Legitimacy Verdicts</h2>
          </div>
          <Link href="/analyze" style={{ textDecoration: "none" }}>
            <motion.button
              className="btn-secondary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{ fontSize: 12, padding: "7px 14px" }}
            >
              Test Live <ArrowRight size={12} />
            </motion.button>
          </Link>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16
        }}>
          {/* Legitimate */}
          <motion.div
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glass-card"
            style={{
              padding: "18px",
              display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{
                  background: "var(--risk-low-bg)", color: "var(--risk-low)",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
                  padding: "3px 10px", borderRadius: "var(--radius-sm)",
                }}>
                  CONFIRMED LEGITIMATE
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--risk-low)", fontFamily: "'JetBrains Mono', monospace", fontFeatureSettings: '"tnum"' }}>
                  Risk: 08/100
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>
                Aadhaar e-Identity Card #8821
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
                Verified authentic. Digital QR signature decrypted successfully; payload matches OCR extracted name and DOB.
              </p>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
              paddingTop: 10, borderTop: "1px solid var(--border-subtle)", fontSize: 12
            }}>
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>QR Crypt</div>
                <div style={{ fontWeight: 600, color: "var(--risk-low)" }}>Valid Match</div>
              </div>
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>ELA Tamper</div>
                <div style={{ fontWeight: 600, color: "var(--risk-low)" }}>0.0% Splice</div>
              </div>
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>Font Grid</div>
                <div style={{ fontWeight: 600, color: "var(--risk-low)" }}>Standard</div>
              </div>
            </div>
          </motion.div>

          {/* Tampered */}
          <motion.div
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glass-card"
            style={{
              padding: "18px",
              display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{
                  background: "var(--risk-high-bg)", color: "var(--risk-high)",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
                  padding: "3px 10px", borderRadius: "var(--radius-sm)",
                }}>
                  TAMPERED
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--risk-high)", fontFamily: "'JetBrains Mono', monospace", fontFeatureSettings: '"tnum"' }}>
                  Risk: 88/100
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>
                Modified Certificate #4419
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
                High-energy pixel variance detected across name and date coordinates via ELA.
              </p>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
              paddingTop: 10, borderTop: "1px solid var(--border-subtle)", fontSize: 12
            }}>
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>QR Crypt</div>
                <div style={{ fontWeight: 600, color: "var(--risk-high)" }}>Mismatch</div>
              </div>
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>ELA Tamper</div>
                <div style={{ fontWeight: 600, color: "var(--risk-high)" }}>High Energy</div>
              </div>
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>Font Grid</div>
                <div style={{ fontWeight: 600, color: "var(--risk-high)" }}>Shifted</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Charts — Tabbed */}
      <motion.section
        custom={4}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={fadeUp}
        className="bento-card"
        style={{ padding: 20 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div className="text-body" style={{ fontWeight: 600 }}>Analytics Overview</div>
            <div className="text-caption" style={{ marginTop: 2 }}>Screening telemetry and threat intelligence</div>
          </div>
          <div className="chart-tabs">
            <ChartTabBtn
              active={chartTab === "risk"}
              onClick={() => setChartTab("risk")}
              icon={<FileCheck size={13} />}
              label="Risk Distribution"
            />
            <ChartTabBtn
              active={chartTab === "threat"}
              onClick={() => setChartTab("threat")}
              icon={<TrendingUp size={13} />}
              label="Threat Vectors"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {chartTab === "risk" ? (
            <motion.div
              key="risk"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {hasData ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={PIE_DATA}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={90}
                        dataKey="value" paddingAngle={4}
                        isAnimationActive={false}
                      >
                        {PIE_DATA.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--glass-bg-heavy)",
                          backdropFilter: "blur(12px)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: "var(--radius-md)",
                          fontSize: 12,
                          color: "var(--text-primary)",
                          boxShadow: "var(--shadow-lg)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 10 }}>
                    {PIE_DATA.map((d, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: d.color }} />
                        <span style={{ color: "var(--text-muted)" }}>{d.name}:</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: 13 }}>
                  No documents analyzed yet. Run a demo or upload a document to see risk distribution.
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="threat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {anomData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={anomData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} width={140} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--glass-bg-heavy)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius-md)",
                        fontSize: 12,
                        color: "var(--text-primary)",
                        boxShadow: "var(--shadow-lg)",
                      }}
                    />
                    <Bar dataKey="value" fill="var(--brand-primary)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: 13 }}>
                  No threat vectors detected yet. Analyze documents to populate threat frequencies.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

    </div>
  );
}
