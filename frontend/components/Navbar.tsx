"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ScanLine, ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const NAV = [
  { href: "/",           label: "Overview" },
  { href: "/analyze",    label: "Analyze", badge: "AI" },
  { href: "/documents",  label: "Documents" },
  { href: "/risk-queue", label: "Risk Queue", badge: "Live" },
  { href: "/analytics",  label: "Analytics" },
  { href: "/compare",    label: "Compare" },
  { href: "/playground", label: "Playground" },
  { href: "/settings",   label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      width: "100%",
    }}>
      <div
        className="navbar-glass"
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 32,
          padding: "14px 40px",
          borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/logo/logo.png"
            alt="Abhaya"
            style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span style={{
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "0.06em",
                color: "var(--text-primary)",
                fontFamily: "'Inter', sans-serif",
              }}>
                ABHAYA
              </span>
              <span style={{
                fontWeight: 700,
                fontSize: 17,
                color: "var(--brand-accent)",
              }}>
                .
              </span>
            </div>
            <span className="navbar-tagline" style={{
              fontSize: 9.5,
              color: "var(--text-muted)",
              letterSpacing: "0.02em",
              lineHeight: 1,
              marginTop: -1,
            }}>
              Where Authenticity Meets Intelligence.
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="navbar-desktop" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          margin: "0 auto",
        }}>
          {NAV.map(({ href, label, badge }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <motion.span
                  style={{
                    position: "relative",
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--brand-primary)" : "var(--text-muted)",
                    padding: "6px 2px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    cursor: "pointer",
                  }}
                  whileHover={{ color: active ? undefined : "var(--text-primary)" }}
                  transition={{ duration: 0.15 }}
                >
                  {label}
                  {badge && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "1px 5px",
                      borderRadius: "var(--radius-sm)",
                      background: badge === "Live" ? "rgba(217, 91, 26, 0.1)" : "var(--brand-primary-10)",
                      color: badge === "Live" ? "var(--brand-accent)" : "var(--brand-primary)",
                    }}>
                      {badge}
                    </span>
                  )}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 2,
                        borderRadius: 1,
                        background: "var(--brand-accent)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA + Mobile Hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="navbar-desktop">
            <Link href="/analyze" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 4px 20px rgba(217, 91, 26, 0.3)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  fontSize: 13,
                  padding: "9px 18px",
                  background: "var(--brand-accent)",
                  color: "var(--text-inverse)",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.2s var(--ease-out)",
                  boxShadow: "0 2px 12px rgba(217, 91, 26, 0.2)",
                }}
              >
                <ScanLine size={14} />
                <span>Screen</span>
                <ArrowRight size={13} />
              </motion.button>
            </Link>
          </div>

          <motion.button
            className="navbar-hamburger"
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: "none",
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: 8,
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="navbar-mobile-overlay"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 99,
              background: "var(--glass-bg-heavy)",
              backdropFilter: "var(--glass-blur)",
              WebkitBackdropFilter: "var(--glass-blur)",
              borderBottom: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-lg)",
              padding: "8px 20px 16px",
              display: "none",
            }}
          >
            {NAV.map(({ href, label, badge }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: active ? "var(--brand-primary-06)" : "transparent",
                      color: active ? "var(--brand-primary)" : "var(--text-primary)",
                      fontWeight: active ? 600 : 500,
                      fontSize: 14,
                    }}
                  >
                    <span>{label}</span>
                    {badge && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: badge === "Live" ? "rgba(217, 91, 26, 0.1)" : "var(--brand-primary-10)",
                        color: badge === "Live" ? "var(--brand-accent)" : "var(--brand-primary)",
                      }}>
                        {badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
              <Link href="/analyze" onClick={() => setMobileOpen(false)} style={{ textDecoration: "none" }}>
                <button
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    borderRadius: "var(--radius-md)",
                    fontWeight: 600,
                    fontSize: 13,
                    padding: "10px 18px",
                    background: "var(--brand-accent)",
                    color: "var(--text-inverse)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <ScanLine size={14} />
                  <span>Screen Document</span>
                  <ArrowRight size={13} />
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
