"use client";
import { useEffect, useState, useCallback } from "react";
import { getAnalytics } from "@/lib/api";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { motion } from "framer-motion";

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--glass-bg-heavy)",
    backdropFilter: "blur(12px)",
    border: "1px solid var(--glass-border)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-primary)",
    fontSize: 12,
    boxShadow: "var(--shadow-lg)",
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20, delay: i * 0.06 },
  }),
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  const loadData = useCallback(() => {
    getAnalytics().then(setData).catch(() => {});
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

  if (!data) return (
    <div style={{ color: "var(--text-muted)", padding: "80px 20px", textAlign: "center" }}>
      Loading analytics...
    </div>
  );

  const pieData = [
    { name: "Low Risk",    value: data.low_risk_count,    color: "var(--risk-low)" },
    { name: "Medium Risk", value: data.medium_risk_count, color: "var(--risk-medium)" },
    { name: "High Risk",   value: data.high_risk_count,   color: "var(--risk-high)" },
  ];

  const hasPieData = (data.low_risk_count || 0) + (data.medium_risk_count || 0) + (data.high_risk_count || 0) > 0;

  const anomData = Object.entries(data.anomaly_breakdown || {}).map(
    ([k, v]) => ({ name: k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), value: v as number })
  );

  const trendData = [...(data.recent_trend || [])].reverse().map((item: any, idx: number) => ({
    index: idx + 1,
    date: item.date,
    score: item.risk_score,
    label: item.risk_label
  }));

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
          <h1 className="text-section" style={{ marginBottom: 2 }}>Analytics</h1>
          <p className="text-caption">Document fraud vectors and anomaly cluster rates</p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          ["TOTAL", data.total_documents, "var(--text-primary)", "All time"],
          ["LOW", `${data.low_risk_count}`, "var(--risk-low)", `${data.low_risk_pct}%`],
          ["MEDIUM", `${data.medium_risk_count}`, "var(--risk-medium)", `${data.medium_risk_pct}%`],
          ["HIGH", `${data.high_risk_count}`, "var(--risk-high)", `${data.high_risk_pct}%`],
          ["MEAN SCORE", data.average_risk_score, "var(--brand-primary)", "Average"],
        ].map(([l, v, c, sub], i) => (
          <motion.div
            key={l as string}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            whileHover={{ y: -2, scale: 1.02 }}
            className="glass-card"
            style={{ padding: "14px 16px" }}
          >
            <div className="text-caption" style={{ fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {l}
            </div>
            <div className="font-mono text-kpi" style={{ fontSize: 24, marginTop: 4, color: c as string }}>
              {v}
            </div>
            <div className="text-caption" style={{ marginTop: 3 }}>{sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16, marginBottom: 16 }}>
        {/* Pie */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="glass-card"
          style={{ padding: 20 }}
        >
          <div className="text-caption" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 14 }}>
            Risk Ratio
          </div>
          {hasPieData ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  outerRadius={85} innerRadius={50}
                  dataKey="value" paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(((percent as number | undefined) ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: 13 }}>
              No documents analyzed yet.
            </div>
          )}
        </motion.div>

        {/* Bar */}
        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="glass-card"
          style={{ padding: 20 }}
        >
          <div className="text-caption" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 14 }}>
            Threat Frequencies
          </div>
          {anomData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={anomData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} width={130} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="var(--brand-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: 13 }}>
              No threat vectors detected yet.
            </div>
          )}
        </motion.div>
      </div>

      {/* Trend */}
      {trendData.length > 0 && (
        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="glass-card"
          style={{ padding: 20 }}
        >
          <div className="text-caption" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 14 }}>
            Risk Trend
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="index" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" domain={[0, 100]} fontSize={11} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="score" stroke="var(--brand-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
