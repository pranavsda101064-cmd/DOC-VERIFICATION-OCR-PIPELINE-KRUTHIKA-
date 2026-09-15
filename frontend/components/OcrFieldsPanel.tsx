"use client";
import { useState } from "react";
import { Copy, Check, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OcrField {
  field_name: string;
  value?: string;
  confidence?: number;
  bbox?: number[];
}

interface Props {
  fields: OcrField[];
  onFieldClick?: (bbox: number[]) => void;
}

export function OcrFieldsPanel({ fields, onFieldClick }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleClick = (f: OcrField) => {
    setSelected(f.field_name === selected ? null : f.field_name);
    if (f.bbox && onFieldClick) onFieldClick(f.bbox);
  };

  const handleCopy = (e: React.MouseEvent, val: string, name: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(val);
    setCopiedField(name);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const confColor = (c?: number) => {
    if (!c) return "var(--text-muted)";
    if (c >= 0.85) return "var(--risk-low)";
    if (c >= 0.65) return "var(--risk-medium)";
    return "var(--risk-high)";
  };

  const formatLabel = (s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const activeFields = fields.filter(f => f.value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <AnimatePresence>
        {activeFields.map((f, i) => {
          const isSelected = selected === f.field_name;
          const conf = f.confidence ?? 0.85;
          const color = confColor(conf);

          return (
            <motion.div
              key={f.field_name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: i * 0.02 }}
              onClick={() => handleClick(f)}
              whileHover={{ backgroundColor: isSelected ? undefined : "var(--brand-primary-03)" }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 12px", borderRadius: "var(--radius-sm)",
                background: isSelected ? "var(--brand-primary-06)" : "transparent",
                border: isSelected
                  ? "1px solid var(--brand-primary-20)"
                  : "1px solid transparent",
                cursor: f.bbox ? "pointer" : "default",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                <div style={{ width: 110, flexShrink: 0 }}>
                  <div style={{
                    fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.3px"
                  }}>
                    {formatLabel(f.field_name)}
                  </div>
                </div>

                <div style={{
                  fontSize: 13, color: "var(--text-primary)", fontWeight: 500,
                  fontFamily: f.field_name.includes("id") || f.field_name.includes("dob") || f.field_name.includes("date")
                    ? "'JetBrains Mono', monospace" : "inherit",
                  fontFeatureSettings: '"tnum"',
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  marginRight: 8
                }}>
                  {f.value || "—"}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Confidence */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 6px", borderRadius: "var(--radius-sm)",
                  background: "var(--bg-surface-alt)",
                  border: `1px solid ${color}25`,
                }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: color }} />
                  <span className="font-mono" style={{ fontSize: 10, fontWeight: 600, color }}>
                    {(conf * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Copy */}
                {f.value && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleCopy(e, f.value!, f.field_name)}
                    title="Copy value"
                    style={{
                      background: "transparent", border: "none", cursor: "pointer",
                      color: copiedField === f.field_name ? "var(--risk-low)" : "var(--text-muted)",
                      padding: 3, borderRadius: 3, display: "flex", alignItems: "center"
                    }}
                  >
                    {copiedField === f.field_name ? <Check size={12} /> : <Copy size={12} />}
                  </motion.button>
                )}

                {/* Bbox indicator */}
                {f.bbox && (
                  <div title="Coordinates available" style={{ color: "var(--brand-primary)" }}>
                    <Target size={13} />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {activeFields.length === 0 && (
        <div style={{
          color: "var(--text-muted)", fontSize: 12, padding: "20px", textAlign: "center",
          background: "var(--bg-surface-alt)", borderRadius: "var(--radius-sm)"
        }}>
          No structured fields parsed from this document.
        </div>
      )}
    </div>
  );
}
