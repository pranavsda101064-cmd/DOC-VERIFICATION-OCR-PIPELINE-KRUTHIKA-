"use client";
import { useState, useRef } from "react";
import { Upload, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onUpload: (file: File) => void;
  loading?: boolean;
}

export function DocumentUploader({ onUpload, loading }: Props) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file) return;
    setFilename(file.name);
    setFileSize((file.size / 1024).toFixed(1) + " KB");
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
    onUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{ position: "relative" }}>
      <motion.div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
        whileHover={!loading ? { scale: 1.01, borderColor: "var(--brand-primary)" } : undefined}
        whileTap={!loading ? { scale: 0.99 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        animate={dragging ? { scale: 1.02, borderColor: "var(--brand-primary)" } : { scale: 1 }}
        style={{
          position: "relative",
          overflow: "hidden",
          border: dragging
            ? "2px dashed var(--brand-primary)"
            : "2px dashed var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "36px 24px",
          textAlign: "center",
          cursor: loading ? "wait" : "pointer",
          background: dragging ? "var(--brand-primary-04)" : "var(--glass-bg)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "background 0.2s var(--ease-out)",
          minHeight: 200,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 14,
        }}
      >
        <input
          ref={inputRef} type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          style={{ display: "none" }}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "var(--brand-primary-08)",
                border: "1px solid var(--brand-primary-20)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Loader2 size={24} color="var(--brand-primary)" className="animate-spin" />
              </div>
              <div>
                <div style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 600 }}>
                  Analyzing document...
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 3 }}>
                  Running 13-layer forensic pipeline
                </div>
              </div>
            </motion.div>
          ) : preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
            >
              <div style={{
                padding: 4,
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-md)",
              }}>
                <img src={preview} alt="preview" style={{
                  maxHeight: 140, maxWidth: 280,
                  borderRadius: "var(--radius-sm)", objectFit: "contain",
                }} />
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 10px", borderRadius: "var(--radius-sm)",
                background: "var(--risk-low-bg)", border: "1px solid var(--risk-low-border)",
                color: "var(--risk-low)", fontSize: 12, fontWeight: 500
              }}>
                <CheckCircle2 size={13} />
                <span>{filename} ({fileSize}) — click to change</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
            >
              <motion.div
                animate={dragging ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                style={{
                  width: 56, height: 56, borderRadius: "var(--radius-lg)",
                  background: "var(--brand-primary-06)",
                  border: "1px solid var(--brand-primary-15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Upload size={24} color="var(--brand-primary)" />
              </motion.div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                  Drag and drop a document here
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  or <span style={{ color: "var(--brand-accent)", fontWeight: 500 }}>browse from device</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {["JPEG", "PNG", "PDF", "UP TO 20 MB"].map(badge => (
                  <span key={badge} style={{
                    fontSize: 10, fontWeight: 600, padding: "3px 7px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-surface)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-subtle)"
                  }}>
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
