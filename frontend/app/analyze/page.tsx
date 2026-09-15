"use client";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { DocumentUploader } from "@/components/DocumentUploader";
import { AnalysisStepper } from "@/components/AnalysisStepper";
import { RiskGauge } from "@/components/RiskGauge";
import { FindingsList } from "@/components/FindingsList";
import { OcrFieldsPanel } from "@/components/OcrFieldsPanel";
import { ReviewModal } from "@/components/ReviewModal";
import { uploadDocument, pollAnalysis, runDemo, getDemoDocuments, fetchJSON } from "@/lib/api";
import {
  ScanLine, ShieldCheck, Shield, RefreshCw,
  FileText, CheckCircle2, AlertTriangle, Eye, ArrowRight, Layers, XCircle,
  Camera, Cpu, Fingerprint, FileCheck
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getLegitimacyVerdict(score: number, label: string, findings: any[] = [], result: any) {
  const criticalFindings = findings.filter((f: any) => f.severity === "CRITICAL" || f.severity === "HIGH");

  if (score <= 30) {
    return {
      status: "LEGITIMATE",
      badgeText: "LEGITIMATE",
      badgeColor: "var(--risk-low)",
      bgColor: "var(--risk-low-bg)",
      borderColor: "var(--risk-low-border)",
      title: "Verified Authentic Document",
      statement: "This document passed all forensic screening checks. Geometry aligns with official templates, OCR confidence is high, and pixel compression shows no signs of tampering.",
    };
  } else if (score <= 65) {
    const reasons = criticalFindings.length > 0
      ? criticalFindings.map((f: any) => f.title || f.finding_type).slice(0, 2).join(" and ")
      : "minor layout shifts and reduced OCR confidence";
    return {
      status: "INCONCLUSIVE",
      badgeText: "REVIEW REQUIRED",
      badgeColor: "var(--risk-medium)",
      bgColor: "var(--risk-medium-bg)",
      borderColor: "var(--risk-medium-border)",
      title: "Suspicious Document",
      statement: `Cannot confirm legitimacy due to ${reasons}. Manual inspection advised.`,
    };
  } else {
    let mainReason = "critical forensic anomalies detected";
    if (criticalFindings.length > 0) {
      mainReason = criticalFindings[0].title || criticalFindings[0].description || "unauthorized digital modifications";
    } else if (result?.tamper_score > 0.3) {
      mainReason = "ELA detected digital photo or text tampering";
    } else if (result?.qr_status === "mismatch") {
      mainReason = "QR code payload contradicts printed text fields";
    }
    return {
      status: "FRAUDULENT",
      badgeText: "FORGERY DETECTED",
      badgeColor: "var(--risk-high)",
      bgColor: "var(--risk-high-bg)",
      borderColor: "var(--risk-high-border)",
      title: "Document is Not Legitimate",
      statement: `Screening failed: ${mainReason}. Clear indicators of digital tampering detected.`,
    };
  }
}

function RiskSignalBar({ signal, raw_score, weight, contribution }: any) {
  const pct = Math.min(100, Math.max(0, Math.round(raw_score)));
  const color = pct > 65 ? "var(--risk-high)" : pct > 35 ? "var(--risk-medium)" : "var(--risk-low)";

  return (
    <div style={{
      padding: "10px 14px", background: "var(--bg-surface-alt)",
      borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)",
      marginBottom: 8
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span className="text-body" style={{ fontWeight: 500 }}>
          {signal.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="text-caption">{(weight * 100).toFixed(0)}%</span>
          <span className="font-mono text-caption" style={{
            fontWeight: 600, color,
            padding: "1px 5px", borderRadius: "var(--radius-sm)",
            background: `color-mix(in srgb, ${color} 10%, transparent)`,
          }}>
            +{contribution.toFixed(1)}
          </span>
        </div>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "var(--border-subtle)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color, borderRadius: 3,
          transition: "width 0.8s var(--ease-out)",
        }} />
      </div>
    </div>
  );
}

function AnalyzeInner() {
  const params = useSearchParams();
  const isDemo = params.get("demo") === "true";
  const resultId = params.get("result");

  const [phase, setPhase]       = useState<"idle"|"uploading"|"polling"|"done"|"error">("idle");
  const [result, setResult]     = useState<any>(null);
  const [error, setError]       = useState<string | null>(null);
  const [demoDocs, setDemoDocs] = useState<any[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [reviewDone, setReviewDone] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"findings"|"forensics"|"ocr"|"signals"|"details">("findings");
  const [selectedBbox, setSelectedBbox] = useState<number[] | null>(null);

  useEffect(() => {
    getDemoDocuments().then(d => setDemoDocs(d.demo_documents || [])).catch(() => {});
    if (resultId) {
      fetchJSON(`/api/analysis/${resultId}`).then(data => {
        setResult(data); setPhase("done");
      }).catch(() => {});
    }
  }, [resultId]);

  const handleUpload = async (file: File) => {
    setPhase("uploading"); setError(null); setResult(null);
    try {
      const { analysis_id } = await uploadDocument(file);
      setPhase("polling");
      const data = await pollAnalysis(analysis_id);
      setResult(data); setPhase("done");
    } catch (e: any) {
      setError(e.message); setPhase("error");
    }
  };

  const handleDemo = async (docName: string) => {
    setPhase("uploading"); setError(null); setResult(null);
    try {
      const data = await runDemo(docName);
      setResult({ ...(data.result || data), analysis_id: data.analysis_id, document_id: data.document_id, original_filename: data.original_filename }); setPhase("done");
    } catch (e: any) {
      setError(e.message); setPhase("error");
    }
  };

  const riskLabel = result?.risk_label || "LOW";
  const riskScore = result?.risk_score ?? 0;
  const labelColor = riskLabel === "HIGH" ? "var(--risk-high)" : riskLabel === "MEDIUM" ? "var(--risk-medium)" : "var(--risk-low)";
  const originalImageUrl = result?.original_filename ? `${API}/uploads/${result.original_filename}` : null;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)"
      }}>
        <div>
          <h1 className="text-section" style={{ marginBottom: 2 }}>Document Analyzer</h1>
          <p className="text-caption">Upload a government identity scan or run a test scenario</p>
        </div>
        {phase === "done" && (
          <button onClick={() => { setPhase("idle"); setResult(null); setSelectedBbox(null); }} className="btn-secondary" style={{ fontSize: 12 }}>
            <RefreshCw size={13} /> New Analysis
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="analyze-grid" style={{ display: "grid", gridTemplateColumns: phase === "done" ? "320px 1fr" : "1fr 1fr", gap: 20 }}>

        {/* Left: Upload or Stepper */}
        <div>
          <div className="glass-card" style={{ padding: 18, marginBottom: 16 }}>
            <div className="text-caption" style={{
              fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 12,
              display: "flex", alignItems: "center", gap: 6
            }}>
              <FileText size={14} color="var(--brand-primary)" />
              Upload
            </div>
            <DocumentUploader onUpload={handleUpload} loading={phase === "uploading" || phase === "polling"} />
          </div>

          {(phase === "polling" || phase === "done") && (
            <div style={{ marginBottom: 16 }}>
              <AnalysisStepper
                steps={result?.analysis_steps || []}
                complete={phase === "done"}
                riskScore={riskScore}
                riskLabel={riskLabel}
              />
            </div>
          )}

          {error && (
            <div style={{
              background: "var(--risk-high-bg)", border: "1px solid var(--risk-high-border)",
              borderRadius: "var(--radius-md)", padding: "14px 16px", color: "var(--risk-high)",
              display: "flex", alignItems: "center", gap: 8
            }}>
              <AlertTriangle size={16} />
              <div>
                <div className="text-body" style={{ fontWeight: 600 }}>Analysis Error</div>
                <div className="text-caption" style={{ marginTop: 2, color: "var(--text-secondary)" }}>{error}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Demo or Results */}
        {phase !== "done" ? (
          <div>
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div className="text-body" style={{ fontWeight: 600 }}>Test Scenarios</div>
                  <div className="text-caption" style={{ marginTop: 2 }}>Click a preset to test the forensic pipeline</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 7px",
                  borderRadius: "var(--radius-sm)", background: "rgba(217, 91, 26, 0.08)",
                  color: "var(--brand-accent)",
                }}>
                  Instant
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {demoDocs.map((doc: any) => {
                  const rColors: Record<string, { badge: string; text: string; bg: string }> = {
                    LOW:    { badge: "var(--risk-low-bg)", text: "var(--risk-low)", bg: "rgba(45,138,86,0.02)" },
                    MEDIUM: { badge: "var(--risk-medium-bg)", text: "var(--risk-medium)", bg: "rgba(198,122,26,0.02)" },
                    HIGH:   { badge: "var(--risk-high-bg)", text: "var(--risk-high)", bg: "rgba(196,59,59,0.02)" },
                  };
                  const rc = rColors[doc.expected_risk] || rColors.MEDIUM;

                  return (
                    <div
                      key={doc.name}
                      onClick={() => handleDemo(doc.name)}
                      className="glass-card glass-card-interactive"
                      style={{ padding: "12px 14px", background: rc.bg, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 100 }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <span className="text-body" style={{ fontWeight: 600 }}>{doc.label}</span>
                          <span className="font-mono" style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 6px",
                            borderRadius: "var(--radius-sm)", background: rc.badge, color: rc.text,
                          }}>
                            {doc.expected_risk} ~{doc.expected_score}
                          </span>
                        </div>
                        <div className="text-caption" style={{ lineHeight: 1.4 }}>{doc.description}</div>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 3,
                        color: "var(--brand-primary)", fontSize: 11, fontWeight: 600, marginTop: 8
                      }}>
                        <span>Run</span><ArrowRight size={11} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Risk Summary Strip */}
            <div className="glass-card" style={{ padding: 18, marginBottom: 16, border: `1px solid color-mix(in srgb, ${labelColor} 20%, transparent)` }}>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <RiskGauge score={riskScore} label={riskLabel} size={160} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <h2 className="text-section">{result.document_type || "Identity Document"}</h2>
                    {result.matched_template && (
                      <span className="font-mono text-caption" style={{
                        padding: "2px 8px", borderRadius: "var(--radius-sm)",
                        background: "var(--brand-primary-06)", color: "var(--brand-primary)", fontWeight: 600
                      }}>
                        {result.matched_template}
                      </span>
                    )}
                  </div>
                  <div className="text-caption" style={{ marginBottom: 8 }}>
                    {result.classification_confidence
                      ? `${(result.classification_confidence * 100).toFixed(0)}% classification confidence`
                      : "Document classified"}
                    {result.processing_time_seconds
                      ? ` · ${result.processing_time_seconds}s`
                      : ""}
                  </div>

                  {/* Quick Stats — 2 rows */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                    {[
                      { label: "Template", value: result.template_similarity ? `${(result.template_similarity * 100).toFixed(0)}%` : "—" },
                      { label: "OCR", value: result.ocr_avg_confidence ? `${(result.ocr_avg_confidence * 100).toFixed(0)}%` : "—" },
                      { label: "QR", value: result.qr_status ? result.qr_status.toUpperCase() : "—", color: result.qr_status === "decoded" ? "var(--risk-low)" : "var(--risk-medium)" },
                    ].map((stat, i) => (
                      <div key={i} style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--bg-surface-alt)", border: "1px solid var(--border-subtle)" }}>
                        <div className="text-caption" style={{ fontWeight: 600, textTransform: "uppercase", fontSize: 10 }}>{stat.label}</div>
                        <div className="font-mono text-body" style={{ fontWeight: 600, color: stat.color || "var(--text-primary)" }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Extended Stats Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "Quality", value: result.quality_score != null ? `${result.quality_score.toFixed(0)}/100` : "—" },
                      { label: "Tamper", value: result.tamper_score != null ? `${(result.tamper_score * 100).toFixed(0)}%` : "—", color: (result.tamper_score || 0) > 0.35 ? "var(--risk-high)" : "var(--risk-low)" },
                      { label: "Anomaly", value: result.anomaly_label === "ANOMALY_DETECTED" ? "FLAGGED" : (result.anomaly_label || "NORMAL"), color: result.anomaly_label === "ANOMALY_DETECTED" ? "var(--risk-high)" : "var(--risk-low)" },
                    ].map((stat, i) => (
                      <div key={i} style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--bg-surface-alt)", border: "1px solid var(--border-subtle)" }}>
                        <div className="text-caption" style={{ fontWeight: 600, textTransform: "uppercase", fontSize: 10 }}>{stat.label}</div>
                        <div className="font-mono text-body" style={{ fontWeight: 600, color: stat.color || "var(--text-primary)" }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Verdict */}
                  {(() => {
                    const verdict = getLegitimacyVerdict(riskScore, riskLabel, result?.findings || [], result);
                    return (
                      <div style={{
                        padding: "10px 14px", borderRadius: "var(--radius-md)",
                        background: verdict.bgColor, border: `1px solid ${verdict.borderColor}`,
                        display: "flex", alignItems: "flex-start", gap: 10
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: "var(--radius-sm)",
                          background: `color-mix(in srgb, ${verdict.badgeColor} 15%, transparent)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, marginTop: 1
                        }}>
                          {verdict.status === "LEGITIMATE" && <CheckCircle2 size={14} color={verdict.badgeColor} />}
                          {verdict.status === "INCONCLUSIVE" && <AlertTriangle size={14} color={verdict.badgeColor} />}
                          {verdict.status === "FRAUDULENT" && <XCircle size={14} color={verdict.badgeColor} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                            <span className="text-body" style={{ fontWeight: 600 }}>{verdict.title}</span>
                            <span className="font-mono" style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-sm)",
                              background: `color-mix(in srgb, ${verdict.badgeColor} 15%, transparent)`, color: verdict.badgeColor,
                            }}>
                              {verdict.badgeText}
                            </span>
                          </div>
                          <p className="text-caption" style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.45 }}>
                            {verdict.statement}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    {(riskLabel === "MEDIUM" || riskLabel === "HIGH") && !reviewDone ? (
                      <button className="btn-primary" onClick={() => setShowReview(true)} style={{ fontSize: 12 }}>
                        <Shield size={14} /> Officer Review
                      </button>
                    ) : reviewDone ? (
                      <div style={{
                        padding: "7px 12px", borderRadius: "var(--radius-sm)",
                        background: "var(--risk-low-bg)", border: "1px solid var(--risk-low-border)",
                        color: "var(--risk-low)", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5
                      }}>
                        <CheckCircle2 size={14} /> {reviewDone.toUpperCase().replace(/_/g, " ")}
                      </div>
                    ) : (
                      <div style={{
                        padding: "7px 12px", borderRadius: "var(--radius-sm)",
                        background: "var(--risk-low-bg)", border: "1px solid var(--risk-low-border)",
                        color: "var(--risk-low)", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5
                      }}>
                        <CheckCircle2 size={14} /> Automated Clearance
                      </div>
                    )}
                    <Link href={`/compare?idA=${result.analysis_id}`} style={{ textDecoration: "none" }}>
                      <button className="btn-secondary" style={{ fontSize: 12 }}>Compare</button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="chart-tabs" style={{ marginBottom: 14, display: "inline-flex", flexWrap: "wrap" }}>
              {[
                { id: "findings", label: `Findings (${result.findings?.length || 0})`, icon: AlertTriangle },
                { id: "forensics", label: "Heatmap", icon: Eye },
                { id: "signals", label: "Signals", icon: Layers },
                { id: "ocr", label: `Fields (${result.ocr_fields?.length || 0})`, icon: FileText },
                { id: "details", label: "Details", icon: Cpu },
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    className="chart-tab"
                    data-active={active}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{ position: "relative" }}
                  >
                    {active && (
                      <motion.span
                        layoutId="analyze-tab-pill"
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
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="glass-card" style={{ padding: 18 }}>
              {activeTab === "findings" && <FindingsList findings={result.findings || []} />}

              {activeTab === "signals" && (
                <div>
                  <div className="text-caption" style={{ marginBottom: 12 }}>Multi-signal risk fusion breakdown</div>
                  {(result.risk_breakdown || []).map((rb: any, i: number) => (
                    <RiskSignalBar key={i} signal={rb.signal} raw_score={rb.raw_score} weight={rb.weight} contribution={rb.contribution} />
                  ))}

                  {/* Additional signal cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                    {result.metadata_anomaly_score != null && (
                      <div style={{ padding: "10px 14px", background: "var(--bg-surface-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Metadata Anomaly</div>
                        <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: result.metadata_anomaly_score > 0.3 ? "var(--risk-high)" : "var(--risk-low)" }}>
                          {(result.metadata_anomaly_score * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                    {result.anomaly_score != null && (
                      <div style={{ padding: "10px 14px", background: "var(--bg-surface-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>ML Anomaly Score</div>
                        <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: result.anomaly_label === "ANOMALY_DETECTED" ? "var(--risk-high)" : "var(--risk-low)" }}>
                          {(result.anomaly_score * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "forensics" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div className="text-caption" style={{ fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Original Scan</div>
                    {originalImageUrl ? (
                      <div style={{ position: "relative" }}>
                        <img
                          src={originalImageUrl}
                          alt="Original Document"
                          style={{
                            width: "100%", height: 220, objectFit: "contain",
                            borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)",
                            background: "var(--bg-surface-alt)",
                          }}
                        />
                        {selectedBbox && (
                          <div style={{
                            position: "absolute",
                            left: `${(selectedBbox[0] / 1000) * 100}%`,
                            top: `${(selectedBbox[1] / 1000) * 100}%`,
                            width: `${((selectedBbox[2] - selectedBbox[0]) / 1000) * 100}%`,
                            height: `${((selectedBbox[3] - selectedBbox[1]) / 1000) * 100}%`,
                            border: "2px solid var(--brand-accent)",
                            borderRadius: 4,
                            background: "rgba(217, 91, 26, 0.1)",
                            pointerEvents: "none",
                          }} />
                        )}
                      </div>
                    ) : (
                      <div style={{
                        height: 220, background: "var(--bg-surface-alt)", borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span className="text-caption">Original scan not available</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-caption" style={{ fontWeight: 600, textTransform: "uppercase", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                      <span>ELA Heatmap</span>
                      <span style={{ color: "var(--risk-high)" }}>Compression</span>
                    </div>
                    {result.forensic_heatmap_path ? (
                      <img
                        src={`${API}/uploads/${result.forensic_heatmap_path?.split(/[\\/]/).pop()}`}
                        alt="Forensic Heatmap"
                        style={{
                          width: "100%", height: 220, objectFit: "cover",
                          borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)",
                        }}
                      />
                    ) : (
                      <div style={{
                        height: 220, background: "var(--bg-surface-alt)", borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span className="text-caption">No heatmap generated</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "ocr" && (
                <div>
                  <div className="text-caption" style={{ marginBottom: 10 }}>Extracted structured fields — click a field to highlight on image</div>
                  <OcrFieldsPanel
                    fields={result.ocr_fields || []}
                    onFieldClick={(bbox) => setSelectedBbox(bbox)}
                  />
                </div>
              )}

              {activeTab === "details" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="text-caption" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Full Analysis Details
                  </div>

                  {/* Document Info */}
                  <DetailSection title="Document Classification" icon={FileCheck}>
                    <DetailRow label="Document Type" value={result.document_type || "—"} />
                    <DetailRow label="Matched Template" value={result.matched_template || "—"} mono />
                    <DetailRow label="Classification Confidence" value={result.classification_confidence ? `${(result.classification_confidence * 100).toFixed(1)}%` : "—"} />
                  </DetailSection>

                  {/* Quality */}
                  <DetailSection title="Image Quality" icon={Camera}>
                    <DetailRow label="Overall Score" value={result.quality_score != null ? `${result.quality_score.toFixed(1)}/100` : "—"} />
                    {result.quality_details && (
                      <>
                        <DetailRow label="Blur Score" value={result.quality_details.blur_score != null ? `${result.quality_details.blur_score.toFixed(1)}` : "—"} />
                        <DetailRow label="Exposure" value={result.quality_details.exposure_score != null ? `${result.quality_details.exposure_score.toFixed(1)}` : "—"} />
                        <DetailRow label="Resolution" value={result.quality_details.resolution_score != null ? `${result.quality_details.resolution_score.toFixed(1)}` : "—"} />
                        <DetailRow label="Skew Angle" value={result.quality_details.skew_angle != null ? `${result.quality_details.skew_angle.toFixed(1)}°` : "—"} />
                        <DetailRow label="Noise Level" value={result.quality_details.noise_level != null ? `${result.quality_details.noise_level.toFixed(3)}` : "—"} />
                        <DetailRow label="Acceptable" value={result.quality_details.is_acceptable ? "Yes" : "No"} />
                      </>
                    )}
                  </DetailSection>

                  {/* OCR */}
                  <DetailSection title="OCR Engine" icon={ScanLine}>
                    <DetailRow label="Engine" value={result.ocr_engine || result.ocr_status || "—"} mono />
                    <DetailRow label="Avg Confidence" value={result.ocr_avg_confidence ? `${(result.ocr_avg_confidence * 100).toFixed(1)}%` : "—"} />
                  </DetailSection>

                  {/* Tamper */}
                  <DetailSection title="Tamper Analysis" icon={Fingerprint}>
                    <DetailRow label="Composite Score" value={result.tamper_score != null ? `${(result.tamper_score * 100).toFixed(1)}%` : "—"} color={(result.tamper_score || 0) > 0.35 ? "var(--risk-high)" : "var(--risk-low)"} />
                    {result.tamper_details?.signals && (
                      <>
                        <DetailRow label="ELA (JPEG Block)" value={result.tamper_details.signals.jpeg_block_inconsistency != null ? `${(result.tamper_details.signals.jpeg_block_inconsistency * 100).toFixed(1)}%` : "—"} />
                        <DetailRow label="Noise Inconsistency" value={result.tamper_details.signals.noise_inconsistency != null ? `${(result.tamper_details.signals.noise_inconsistency * 100).toFixed(1)}%` : "—"} />
                        <DetailRow label="Edge Irregularity" value={result.tamper_details.signals.edge_irregularity != null ? `${(result.tamper_details.signals.edge_irregularity * 100).toFixed(1)}%` : "—"} />
                        <DetailRow label="Active Signals" value={String(result.tamper_details.signals.active_signal_count ?? "—")} />
                      </>
                    )}
                    {result.tamper_details?.suspicious_regions?.length > 0 && (
                      <DetailRow label="Suspicious Regions" value={String(result.tamper_details.suspicious_regions.length)} />
                    )}
                  </DetailSection>

                  {/* Anomaly */}
                  <DetailSection title="ML Anomaly Detection" icon={Cpu}>
                    <DetailRow label="Label" value={result.anomaly_label || "—"} color={result.anomaly_label === "ANOMALY_DETECTED" ? "var(--risk-high)" : "var(--risk-low)"} />
                    <DetailRow label="Score" value={result.anomaly_score != null ? `${(result.anomaly_score * 100).toFixed(1)}%` : "—"} />
                  </DetailSection>

                  {/* Metadata */}
                  <DetailSection title="Metadata Forensics" icon={FileText}>
                    <DetailRow label="Anomaly Score" value={result.metadata_anomaly_score != null ? `${(result.metadata_anomaly_score * 100).toFixed(1)}%` : "—"} />
                    {result.metadata_details && (
                      <>
                        {result.metadata_details.software && <DetailRow label="Software Detected" value={result.metadata_details.software} />}
                        {result.metadata_details.has_exif !== undefined && <DetailRow label="EXIF Present" value={result.metadata_details.has_exif ? "Yes" : "No"} />}
                        {result.metadata_details.format_info && <DetailRow label="Format" value={result.metadata_details.format_info} />}
                      </>
                    )}
                  </DetailSection>

                  {/* Consistency */}
                  {result.consistency_details && (
                    <DetailSection title="Cross-Field Consistency" icon={ShieldCheck}>
                      {result.consistency_details.inconsistencies != null && (
                        <DetailRow label="Inconsistencies" value={String(result.consistency_details.inconsistencies)} />
                      )}
                      {result.consistency_details.critical_count != null && (
                        <DetailRow label="Critical" value={String(result.consistency_details.critical_count)} color={result.consistency_details.critical_count > 0 ? "var(--risk-high)" : "var(--risk-low)"} />
                      )}
                    </DetailSection>
                  )}

                  {/* Layout */}
                  {result.layout_details && (
                    <DetailSection title="Template Layout" icon={Layers}>
                      {result.layout_details.shifted_regions != null && <DetailRow label="Shifted Regions" value={String(result.layout_details.shifted_regions)} />}
                      {result.layout_details.missing_regions != null && <DetailRow label="Missing Regions" value={String(result.layout_details.missing_regions)} />}
                    </DetailSection>
                  )}

                  {/* QR */}
                  {result.qr_details && (
                    <DetailSection title="QR Analysis" icon={ScanLine}>
                      <DetailRow label="Status" value={result.qr_status || "—"} />
                      {result.qr_details.format && <DetailRow label="Format" value={result.qr_details.format} />}
                      {result.qr_details.payload_summary && <DetailRow label="Payload" value={result.qr_details.payload_summary} />}
                    </DetailSection>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReview && (
        <ReviewModal
          analysisId={result.analysis_id}
          documentId={result.document_id}
          riskScore={riskScore}
          riskLabel={riskLabel}
          onClose={() => setShowReview(false)}
          onSubmitted={(decision: string) => { setReviewDone(decision); setShowReview(false); }}
        />
      )}
    </div>
  );
}

/* ── Detail Helpers ────────────────────────────────────────────────────── */

function DetailSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div style={{
      padding: "12px 14px", background: "var(--bg-surface-alt)",
      borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)"
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
        color: "var(--brand-primary)", marginBottom: 8,
        display: "flex", alignItems: "center", gap: 6
      }}>
        <Icon size={13} /> {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
      <span className="text-caption" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className={mono ? "font-mono" : ""} style={{ fontSize: 12, fontWeight: 500, color: color || "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--text-muted)", textAlign: "center" }}>Loading analyzer...</div>}>
      <AnalyzeInner />
    </Suspense>
  );
}
