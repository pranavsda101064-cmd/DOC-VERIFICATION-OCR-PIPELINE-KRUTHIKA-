"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "techtides" | "brand" | "loading" | "exit" | "done";

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("techtides");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase("brand"), 800));
    timers.push(setTimeout(() => setPhase("loading"), 1300));
    timers.push(setTimeout(() => setPhase("exit"), 1800));
    timers.push(setTimeout(() => setPhase("done"), 2000));

    return () => timers.forEach(clearTimeout);
  }, []);

  if (phase === "done") return null;

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background:
              "radial-gradient(ellipse 80% 50% at 20% 10%, rgba(237, 232, 216, 0.6) 0%, transparent 60%), " +
              "radial-gradient(ellipse 60% 40% at 80% 30%, rgba(209, 200, 176, 0.4) 0%, transparent 55%), " +
              "linear-gradient(180deg, #EDE8D8 0%, #F7F3E8 40%, #FDFDFB 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {/* TECHTIDES */}
          <AnimatePresence mode="wait">
            {phase === "techtides" && (
              <motion.div
                key="techtides"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(48px, 8vw, 80px)",
                  letterSpacing: "-0.04em",
                  color: "var(--text-primary)",
                  textAlign: "center",
                  lineHeight: 1,
                }}
              >
                TECHTIDES
              </motion.div>
            )}

            {(phase === "brand" || phase === "loading" || phase === "exit") && (
              <motion.div
                key="abhaya"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(32px, 5vw, 42px)",
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 2,
                }}>
                  ABHAYA
                  <span style={{ color: "var(--brand-accent)", fontSize: "1.2em" }}>.</span>
                </div>

                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: "var(--text-muted)",
                  letterSpacing: "0.03em",
                  marginTop: 2,
                }}>
                  Where Authenticity Meets Intelligence.
                </div>

                {/* Loading bar */}
                {phase === "loading" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    style={{
                      marginTop: 16,
                      width: 120,
                      height: 2,
                      borderRadius: 1,
                      background: "var(--border-subtle)",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      style={{
                        height: "100%",
                        background: "var(--brand-primary)",
                        borderRadius: 1,
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
