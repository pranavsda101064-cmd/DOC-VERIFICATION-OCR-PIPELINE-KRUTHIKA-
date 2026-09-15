"use client";
import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";
import {
  Settings, CheckCircle2, Sliders, ShieldCheck, Cpu,
  Database, Activity, RefreshCw, Key, Save, Server, Layers, Zap
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20, delay: i * 0.06 },
  }),
};

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeModelMode, setActiveModelMode] = useState<"heuristic" | "gemini">("heuristic");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [weights, setWeights] = useState({
    visualTamper: 25,
    templateLayout: 15,
    crossField: 15,
    mlAnomaly: 15,
    ocrAnomalies: 10,
    patternViolations: 10,
    metadataAnomalies: 5,
    imageQuality: 5,
  });

  const loadHealth = () => {
    setIsRefreshing(true);
    getHealth()
      .then(setHealth)
      .catch(() => {})
      .finally(() => setTimeout(() => setIsRefreshing(false), 500));
  };

  useEffect(() => { loadHealth(); }, []);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 24, flexWrap: "wrap", gap: 14
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h1 className="text-section">Settings</h1>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: "var(--radius-sm)",
              background: "var(--risk-low-bg)", color: "var(--risk-low)",
              border: "1px solid var(--risk-low-border)"
            }}>
              v2.4.0
            </span>
          </div>
          <p className="text-caption">System health, signal calibration, and pipeline configuration</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={loadHealth}
            disabled={isRefreshing}
            className="btn-secondary"
            style={{ fontSize: 12 }}
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Testing..." : "Health Check"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="btn-primary"
            style={{ fontSize: 12 }}
          >
            <Save size={13} />
            {savedSuccess ? "Saved!" : "Save"}
          </motion.button>
        </div>
      </motion.div>

      {/* Health Telemetry */}
      <div style={{ marginBottom: 24 }}>
        <div className="text-caption" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Activity size={13} color="var(--brand-primary)" /> System Health
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[
            { name: "FastAPI Gateway", detail: "127.0.0.1:8000", status: "HEALTHY", color: "var(--risk-low)", icon: Server },
            { name: "SQLite Database", detail: "WAL Mode", status: health?.db_connected ? "CONNECTED" : "OFFLINE", color: health?.db_connected ? "var(--risk-low)" : "var(--risk-high)", icon: Database },
            { name: "Isolation Forest", detail: "13-Feature Vector", status: health?.ml_model_loaded ? "ONLINE" : "PENDING", color: health?.ml_model_loaded ? "var(--risk-low)" : "var(--risk-medium)", icon: Cpu },
            { name: "OCR Engine", detail: health?.ocr_engine || "Tesseract", status: "READY", color: "var(--risk-low)", icon: Layers },
          ].map((svc, i) => (
            <motion.div
              key={svc.name}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="glass-card"
              style={{ padding: "14px 16px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <svc.icon size={16} color="var(--brand-primary)" />
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: "var(--radius-sm)",
                  background: `color-mix(in srgb, ${svc.color} 10%, transparent)`, color: svc.color,
                }}>
                  {svc.status}
                </span>
              </div>
              <div className="text-body" style={{ fontWeight: 600, marginBottom: 1 }}>{svc.name}</div>
              <div className="font-mono text-caption">{svc.detail}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="settings-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
        {/* Signal Calibration */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="glass-card"
          style={{ padding: 22 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div className="text-body" style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                <Sliders size={16} color="var(--brand-primary)" /> Signal Weights
              </div>
              <div className="text-caption" style={{ marginTop: 2 }}>Risk model coefficients</div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "3px 8px", borderRadius: "var(--radius-sm)",
              background: totalWeight === 100 ? "var(--risk-low-bg)" : "var(--risk-high-bg)",
              fontSize: 12, fontWeight: 600,
              color: totalWeight === 100 ? "var(--risk-low)" : "var(--risk-high)"
            }}>
              Σ {totalWeight}% {totalWeight === 100 ? "OK" : "!= 100"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { id: "visualTamper", label: "Visual Tamper (ELA)", val: weights.visualTamper, color: "var(--brand-primary)" },
              { id: "templateLayout", label: "Template Layout", val: weights.templateLayout, color: "var(--brand-primary)" },
              { id: "crossField", label: "Cross-Field QR/OCR", val: weights.crossField, color: "var(--brand-primary)" },
              { id: "mlAnomaly", label: "ML Anomaly", val: weights.mlAnomaly, color: "var(--brand-primary)" },
              { id: "ocrAnomalies", label: "OCR Confidence", val: weights.ocrAnomalies, color: "var(--text-muted)" },
              { id: "patternViolations", label: "Pattern Checks", val: weights.patternViolations, color: "var(--text-muted)" },
              { id: "metadataAnomalies", label: "Metadata/EXIF", val: weights.metadataAnomalies, color: "var(--text-muted)" },
              { id: "imageQuality", label: "Image Quality", val: weights.imageQuality, color: "var(--text-muted)" },
            ].map((s) => (
              <div key={s.id} style={{
                background: "var(--bg-surface-alt)", padding: "8px 12px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span className="text-body" style={{ fontWeight: 500 }}>{s.label}</span>
                  <span className="font-mono" style={{
                    fontSize: 12, fontWeight: 600,
                    padding: "1px 6px", borderRadius: "var(--radius-sm)",
                    background: `color-mix(in srgb, ${s.color} 10%, transparent)`, color: s.color,
                  }}>
                    {s.val}%
                  </span>
                </div>
                <div style={{ width: "100%", height: 4, background: "var(--border-subtle)", borderRadius: 2, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.val * 3.5}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    style={{ height: "100%", background: s.color, borderRadius: 2, maxWidth: "100%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Thresholds */}
          <motion.div
            custom={5}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="glass-card"
            style={{ padding: 22 }}
          >
            <div className="text-body" style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
              <ShieldCheck size={16} color="var(--risk-low)" /> Risk Thresholds
            </div>
            <p className="text-caption" style={{ marginBottom: 14 }}>Screening action guidelines</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { range: "0 – 30", level: "Low Risk", color: "var(--risk-low)", action: "Fast-Track", desc: "No critical discrepancies detected." },
                { range: "31 – 65", level: "Medium Risk", color: "var(--risk-medium)", action: "Manual Review", desc: "Minor variance or unverified signature." },
                { range: "66 – 100", level: "High Risk", color: "var(--risk-high)", action: "Escalation", desc: "Spliced tampering or fake QR payload." }
              ].map((b) => (
                <div key={b.range} style={{
                  padding: "10px 12px", borderRadius: "var(--radius-sm)",
                  background: `color-mix(in srgb, ${b.color} 5%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${b.color} 15%, transparent)`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: b.color }} />
                      <span className="text-body" style={{ fontWeight: 600, color: b.color }}>{b.level}</span>
                      <span className="font-mono text-caption">[{b.range}]</span>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: "var(--radius-sm)",
                      background: "var(--bg-surface)", color: b.color,
                    }}>
                      {b.action}
                    </span>
                  </div>
                  <div className="text-caption" style={{ color: "var(--text-secondary)" }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Gemini Gateway */}
          <motion.div
            custom={6}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="glass-card"
            style={{ padding: 22 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="text-body" style={{ fontWeight: 600 }}>Gemini Vision Gateway</div>
              <div style={{
                display: "flex", padding: 2, borderRadius: "var(--radius-sm)",
                background: "var(--bg-surface-alt)", border: "1px solid var(--border-subtle)"
              }}>
                <button
                  onClick={() => setActiveModelMode("heuristic")}
                  style={{
                    padding: "3px 8px", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 600,
                    background: activeModelMode === "heuristic" ? "var(--bg-surface)" : "transparent",
                    color: activeModelMode === "heuristic" ? "var(--text-primary)" : "var(--text-muted)",
                    border: "none", cursor: "pointer"
                  }}
                >
                  Offline
                </button>
                <button
                  onClick={() => setActiveModelMode("gemini")}
                  style={{
                    padding: "3px 8px", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 600,
                    background: activeModelMode === "gemini" ? "var(--brand-accent)" : "transparent",
                    color: activeModelMode === "gemini" ? "#fff" : "var(--text-muted)",
                    border: "none", cursor: "pointer"
                  }}
                >
                  Gemini Pro
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 10px", borderRadius: "var(--radius-sm)", background: "var(--bg-surface-alt)",
                border: "1px solid var(--border-subtle)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Key size={12} color="var(--brand-primary)" />
                  <span className="text-caption" style={{ color: "var(--text-secondary)" }}>API Token</span>
                </div>
                <span className="font-mono text-caption">
                  AIzaSy••••••••••••7f8K
                </span>
              </div>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 10px", borderRadius: "var(--radius-sm)", background: "var(--bg-surface-alt)",
                border: "1px solid var(--border-subtle)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={12} color="var(--risk-low)" />
                  <span className="text-caption" style={{ color: "var(--text-secondary)" }}>Privacy</span>
                </div>
                <span style={{ color: "var(--risk-low)", fontWeight: 600, fontSize: 11 }}>Zero-Retention</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
