"use client";

const DEMOS = [
  { src: "/demo/authentic.jpg",       label: "Authentic",        risk: "LOW",    color: "var(--risk-low)" },
  { src: "/demo/text_tampered.jpg",   label: "Text Tampered",    risk: "HIGH",   color: "var(--risk-high)" },
  { src: "/demo/photo_tampered.jpg",  label: "Photo Swap",       risk: "HIGH",   color: "var(--risk-high)" },
  { src: "/demo/qr_mismatch.jpg",     label: "QR Forgery",       risk: "HIGH",   color: "var(--risk-high)" },
  { src: "/demo/low_quality.jpg",     label: "Low Quality",      risk: "MEDIUM", color: "var(--risk-medium)" },
  { src: "/demo/layout_tampered.jpg", label: "Layout Shift",     risk: "MEDIUM", color: "var(--risk-medium)" },
  { src: "/demo/inconsistent.jpg",    label: "Inconsistency",    risk: "HIGH",   color: "var(--risk-high)" },
  { src: "/demo/anomaly.jpg",         label: "ML Anomaly",       risk: "HIGH",   color: "var(--risk-high)" },
];

export function Carousel() {
  const items = [...DEMOS, ...DEMOS];

  return (
    <section style={{ overflow: "hidden", padding: "0 0 8px 0" }}>
      <div className="carousel-track">
        {items.map((item, i) => (
          <div key={i} className="carousel-card">
            <img src={item.src} alt={item.label} loading="lazy" />
            <div style={{ padding: "12px 14px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: "2px 7px", borderRadius: "var(--radius-sm)",
                  background: `${item.color}12`, color: item.color,
                  letterSpacing: "0.03em",
                }}>
                  {item.risk}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
                Synthetic demo document
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
