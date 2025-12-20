import { motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import { useEffect, useState } from 'react'; // Import useEffect and useState for client-side window access

export const AnimatedBackground = () => {
  const { theme } = useTheme();
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const isCyberpunk = theme === 'cyberpunk';
  const isGlass = theme === 'glass';
  const isRetro = theme === 'retro';
  const isLight = theme === 'light' || (theme === 'system' && !isDark);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-background">
      {/* 1. Base Mesh / Gradient Layer */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${
        isRetro ? 'opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,176,0,0.1)_0%,transparent_70%)]' : 
        isCyberpunk ? 'opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.08)_0%,transparent_60%)]' : 
        'opacity-40 bg-subtle-mesh'
      }`} />
      
      {/* 2. Primary Atmospheric Logic */}
      {windowDimensions.width > 0 && (
        <div className="absolute inset-0">
          
          {/* RETRO: Starfield */}
          {isRetro && [...Array(40)].map((_, i) => (
            <motion.div
              key={`retro-${i}`}
              initial={{ x: Math.random() * windowDimensions.width, y: Math.random() * windowDimensions.height }}
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1], y: [null, (Math.random() - 0.5) * 30] }}
              transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "linear" }}
              className="absolute w-1 h-1 bg-amber-400/40 rounded-full will-change-[transform,opacity]"
              style={{ transform: 'translateZ(0)' }}
            />
          ))}

          {/* CYBERPUNK: Data Stream Particles */}
          {isCyberpunk && [...Array(15)].map((_, i) => (
            <motion.div
              key={`cyber-${i}`}
              initial={{ x: -100, y: Math.random() * windowDimensions.height, opacity: 0 }}
              animate={{ x: windowDimensions.width + 100, opacity: [0, 0.8, 0] }}
              transition={{ duration: 4 + Math.random() * 6, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
              className="absolute h-px w-20 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.4)] will-change-[transform,opacity]"
              style={{ transform: 'translateZ(0)' }}
            />
          ))}

          {/* GLASS: Prismatic Frost & Floating Bokeh */}
          {isGlass && (
            <>
              {/* Dynamic Bokeh Blobs */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={`glass-bokeh-${i}`}
                  initial={{ x: Math.random() * windowDimensions.width, y: Math.random() * windowDimensions.height }}
                  animate={{ 
                    y: [null, -150], 
                    x: [null, (Math.random() - 0.5) * 100],
                    opacity: [0, 0.25, 0],
                    scale: [1, 1.5, 1]
                  }}
                  transition={{ duration: 12 + Math.random() * 12, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                  className={`absolute blur-[100px] rounded-full will-change-[transform,opacity] ${
                    i % 3 === 0 ? 'bg-blue-400/20 w-80 h-80' : 
                    i % 3 === 1 ? 'bg-indigo-400/15 w-96 h-96' : 
                    'bg-cyan-300/15 w-72 h-72'
                  }`}
                  style={{ transform: 'translateZ(0)' }}
                />
              ))}

              {/* Refractive Glass Shards */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`glass-shard-${i}`}
                  initial={{ 
                    x: Math.random() * windowDimensions.width, 
                    y: Math.random() * windowDimensions.height,
                    rotate: Math.random() * 360,
                    opacity: 0 
                  }}
                  animate={{ 
                    y: [null, (Math.random() - 0.5) * 100],
                    rotate: [null, Math.random() * 360],
                    opacity: [0, 0.1, 0]
                  }}
                  transition={{ duration: 20 + Math.random() * 20, repeat: Infinity, ease: "linear" }}
                  className="absolute w-40 h-80 bg-gradient-to-tr from-white/5 to-transparent backdrop-blur-[2px] border-l border-white/10 will-change-[transform,opacity]"
                  style={{ transform: 'translateZ(0)' }}
                />
              ))}
            </>
          )}

          {/* LIGHT Mode: Floating Pastel Clouds & Prismatic Bokeh */}
          {isLight && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`light-cloud-${i}`}
                  animate={{ 
                    x: [0, 100, 0],
                    y: [0, -60, 0],
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 0.9, 0.7]
                  }}
                  transition={{ duration: 18 + i * 4, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute w-[600px] h-[600px] blur-[70px] rounded-full transition-colors will-change-[transform,opacity] ${
                    i % 2 === 0 ? 'bg-primary/25' : 'bg-blue-500/20'
                  }`}
                  style={{ 
                    top: `${5 + i * 30}%`, 
                    left: `${-10 + i * 25}%`,
                    transform: 'translateZ(0)'
                  }}
                />
              ))}
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={`light-sparkle-${i}`}
                  initial={{ x: Math.random() * windowDimensions.width, y: Math.random() * windowDimensions.height }}
                  animate={{ 
                    y: [null, -180], 
                    x: [null, (Math.random() - 0.5) * 80],
                    opacity: [0, 0.7, 0],
                    scale: [0.8, 1.3, 0.8]
                  }}
                  transition={{ duration: 8 + Math.random() * 8, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                  className={`absolute w-36 h-36 blur-[40px] rounded-full will-change-[transform,opacity] ${
                    i % 4 === 0 ? 'bg-blue-400/50' : 
                    i % 4 === 1 ? 'bg-indigo-400/50' : 
                    i % 4 === 2 ? 'bg-sky-400/50' : 'bg-primary/40'
                  }`}
                  style={{ transform: 'translateZ(0)' }}
                />
              ))}
            </>
          )}

          {/* DARK theme: Deep Space Aurora & Cosmic Dust */}
          {isDark && (
            <>
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  x: [0, 80, 0],
                  y: [0, 40, 0],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-5%] left-[-5%] w-[900px] h-[900px] bg-indigo-500/20 blur-[110px] rounded-full will-change-[transform,opacity]"
                style={{ transform: 'translateZ(0)' }}
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  x: [0, -80, 0],
                  y: [0, 80, 0],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[-5%] right-[-5%] w-[800px] h-[800px] bg-primary/20 blur-[110px] rounded-full will-change-[transform,opacity]"
                style={{ transform: 'translateZ(0)' }}
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.1, 0.25, 0.1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
                className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-400/15 blur-[120px] rounded-full will-change-[transform,opacity]"
                style={{ transform: 'translateZ(0)' }}
              />

              {/* Enhanced Cosmic Dust Particles */}
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={`dark-dust-${i}`}
                  initial={{ x: Math.random() * windowDimensions.width, y: Math.random() * windowDimensions.height, opacity: 0 }}
                  animate={{ 
                    y: [null, -150], 
                    x: [null, (Math.random() - 0.5) * 50],
                    opacity: [0, 0.6, 0],
                    scale: [0.6, 1.4, 0.6]
                  }}
                  transition={{ duration: 12 + Math.random() * 10, repeat: Infinity, ease: "linear", delay: i * 0.4 }}
                  className="absolute w-1.5 h-1.5 bg-blue-300/40 blur-[0.4px] rounded-full shadow-[0_0_8px_rgba(147,197,253,0.3)] will-change-[transform,opacity]"
                  style={{ transform: 'translateZ(0)' }}
                />
              ))}
            </>
          )}

        </div>
      )}
      
      {/* 3. Surface Textures (Grids, Scanlines) */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${
        isRetro ? 'bg-[radial-gradient(rgba(255,176,0,0.15)_1px,transparent_1px)] [background-size:30px_30px] opacity-20' : 
        isCyberpunk ? 'bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-20' :
        'bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]'
      }`} />

      {/* 4. Special Effects Overlays */}
      {isGlass && (
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      )}

      {isRetro && (
        <motion.div 
          animate={{ opacity: [0.01, 0.04, 0.01] }}
          transition={{ duration: 0.1, repeat: Infinity }}
          className="absolute inset-0 bg-amber-500/5 pointer-events-none z-[110]"
        />
      )}
    </div>
  );
};
