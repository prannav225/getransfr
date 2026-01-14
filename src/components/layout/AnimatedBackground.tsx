import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";

export const AnimatedBackground = () => {
  const { theme } = useTheme();
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const isLight = !isDark;

  return (
    <div className="fixed top-0 left-0 w-full h-[100dvh] z-0 overflow-hidden pointer-events-none bg-background">
      {/* 1. Base Mesh / Gradient Layer */}
      <div className="absolute inset-0 transition-opacity duration-1000 opacity-30 bg-subtle-mesh" />

      {/* 2. Primary Atmospheric Logic */}
      {windowDimensions.width > 0 && (
        <div className="absolute inset-0">
          {/* LIGHT Mode: Floating Pastel Clouds & Prismatic Bokeh */}
          {isLight && (
            <>
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={`light-cloud-${i}`}
                  animate={{
                    x: [0, i % 2 === 0 ? 100 : -100, 0],
                    y: [0, i % 2 === 0 ? -60 : 60, 0],
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    duration: 15 + i * 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`absolute w-[700px] h-[700px] blur-[120px] rounded-full opacity-60 ${
                    i % 4 === 0
                      ? "bg-primary/30"
                      : i % 4 === 1
                      ? "bg-blue-400/30"
                      : i % 4 === 2
                      ? "bg-purple-300/30"
                      : "bg-pink-200/30"
                  }`}
                  style={{
                    top: `${-20 + i * 35}%`,
                    left: `${-20 + (i % 2) * 70}%`,
                    transform: "translateZ(0)",
                  }}
                />
              ))}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`light-sparkle-${i}`}
                  initial={{
                    x: Math.random() * windowDimensions.width,
                    y: Math.random() * windowDimensions.height,
                  }}
                  animate={{
                    y: [null, -250],
                    opacity: [0, 0.7, 0],
                  }}
                  transition={{
                    duration: 12 + Math.random() * 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.5,
                  }}
                  className={`absolute w-40 h-40 blur-[50px] rounded-full ${
                    i % 4 === 0
                      ? "bg-blue-300/50"
                      : i % 4 === 1
                      ? "bg-purple-200/50"
                      : i % 4 === 2
                      ? "bg-sky-200/50"
                      : "bg-primary/40"
                  }`}
                  style={{ transform: "translateZ(0)" }}
                />
              ))}
            </>
          )}

          {/* DARK theme: Deep Space Aurora & Cosmic Dust */}
          {isDark && (
            <>
              <motion.div
                animate={{ opacity: [0.1, 0.25, 0.1] }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-[150px]"
                style={{ transform: "translateZ(0)" }}
              />
              {/* Enhanced Cosmic Dust Particles */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={`dark-dust-${i}`}
                  initial={{
                    x: Math.random() * windowDimensions.width,
                    y: Math.random() * windowDimensions.height,
                    opacity: 0,
                  }}
                  animate={{
                    y: [null, -150],
                    opacity: [0, 0.6, 0],
                  }}
                  transition={{
                    duration: 10 + Math.random() * 10,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.4,
                  }}
                  className="absolute w-1 h-1 bg-primary/30 rounded-full shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                  style={{ transform: "translateZ(0)" }}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* 3. Surface Textures */}
      <div className="absolute inset-0 transition-opacity duration-1000 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-30 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
  );
};
