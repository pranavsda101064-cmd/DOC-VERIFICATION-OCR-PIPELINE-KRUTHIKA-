import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { SplashScreen } from "@/components/SplashScreen";

export const metadata: Metadata = {
  title: "Abhaya — AI Document Screening | SIH 2026",
  description: "Multi-Layer AI Document Intelligence and Risk Screening System. Signal fusion engine for document authenticity screening.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SplashScreen />
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <Navbar />
          <main style={{
            flex: 1,
            width: "100%",
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "32px 24px 80px 24px",
          }}>
            {children}
          </main>

          <footer
            className="navbar-glass"
            style={{
              borderTop: "1px solid var(--glass-border)",
              padding: "36px 24px",
              marginTop: "auto",
              borderRadius: 0,
            }}
          >
            <div style={{
              maxWidth: 1240,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src="/logo/logo.png"
                  alt="Abhaya"
                  style={{ width: 30, height: 30, objectFit: "contain" }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.06em", color: "var(--text-primary)", fontFamily: "'Inter', sans-serif" }}>
                    ABHAYA<span style={{ color: "var(--brand-accent)" }}>.</span>
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.01em" }}>
                    Where Authenticity Meets Intelligence.
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
                  Multi-Layer Forensic Screening &amp; Verification Protocol
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 12, color: "var(--text-muted)" }}>
                <span>SIH 2026 Official</span>
                <span style={{ opacity: 0.3 }}>|</span>
                <span>Forensic Protocol Active</span>
                <span style={{ opacity: 0.3 }}>|</span>
                <span>Verification Engine v2.4</span>
              </div>
            </div>

            <div style={{
              maxWidth: 1240,
              margin: "18px auto 0 auto",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 11.5,
              color: "var(--text-muted)"
            }}>
              <div>
                Built by <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Laxsmi Shree</span>
              </div>
              <div>
                © 2026 Abhaya AI Document Screening. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
