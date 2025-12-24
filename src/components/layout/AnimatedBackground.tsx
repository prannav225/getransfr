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
    <div className="fixed top-0 left-0 w-full h-[100dvh] z-0 overflow-hidden pointer-events-none bg-background">
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
          {isRetro && [...Array(15)].map((_, i) => (
            <motion.div
              key={`retro-${i}`}
              initial={{ x: Math.random() * windowDimensions.width, y: Math.random() * windowDimensions.height }}
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.2, 1] }}
              transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, ease: "linear" }}
              className="absolute w-1 h-1 bg-amber-400/30 rounded-full"
              style={{ transform: 'translateZ(0)' }}
            />
          ))}

          {/* CYBERPUNK: Data Stream Particles */}
          {isCyberpunk && [...Array(8)].map((_, i) => (
            <motion.div
              key={`cyber-${i}`}
              initial={{ x: -100, y: Math.random() * windowDimensions.height, opacity: 0 }}
              animate={{ x: windowDimensions.width + 100, opacity: [0, 0.6, 0] }}
              transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, ease: "linear", delay: i * 0.8 }}
              className="absolute h-px w-16 bg-cyan-400/30 shadow-[0_0_5px_rgba(34,211,238,0.3)]"
              style={{ transform: 'translateZ(0)' }}
            />
          ))}

          {/* GLASS: Prismatic Frost & Floating Bokeh */}
          {isGlass && (
            <>
              {/* Dynamic Bokeh Blobs */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`glass-bokeh-${i}`}
                  initial={{ x: Math.random() * windowDimensions.width, y: Math.random() * windowDimensions.height }}
                  animate={{ 
                    y: [null, -100], 
                    opacity: [0, 0.15, 0],
                  }}
                  transition={{ duration: 15 + Math.random() * 15, repeat: Infinity, ease: "easeInOut", delay: i * 1 }}
                  className={`absolute blur-[80px] rounded-full ${
                    i % 3 === 0 ? 'bg-blue-400/10 w-64 h-64' : 
                    i % 3 === 1 ? 'bg-indigo-400/10 w-80 h-80' : 
                    'bg-cyan-300/10 w-56 h-56'
                  }`}
                  style={{ transform: 'translateZ(0)' }}
                />
              ))}

              {/* Refractive Glass Shards */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`glass-shard-${i}`}
                  initial={{ 
                    x: Math.random() * windowDimensions.width, 
                    y: Math.random() * windowDimensions.height,
                    rotate: Math.random() * 360,
                    opacity: 0 
                  }}
                  animate={{ 
                    opacity: [0, 0.05, 0]
                  }}
                  transition={{ duration: 25 + Math.random() * 20, repeat: Infinity, ease: "linear" }}
                  className="absolute w-32 h-64 bg-gradient-to-tr from-white/5 to-transparent backdrop-blur-[1px] border-l border-white/5"
                  style={{ transform: 'translateZ(0)' }}
                />
              ))}
            </>
          )}

          {/* LIGHT Mode: Floating Pastel Clouds & Prismatic Bokeh */}
          {isLight && (
            <>
              {[...Array(2)].map((_, i) => (
                <motion.div
                  key={`light-cloud-${i}`}
                  animate={{ 
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                  }}
                  transition={{ duration: 25 + i * 5, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute w-[500px] h-[500px] blur-[80px] rounded-full ${
                    i % 2 === 0 ? 'bg-primary/10' : 'bg-blue-500/10'
                  }`}
                  style={{ 
                    top: `${10 + i * 40}%`, 
                    left: `${-5 + i * 30}%`,
                    transform: 'translateZ(0)'
                  }}
                />
              ))}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`light-sparkle-${i}`}
                  initial={{ x: Math.random() * windowDimensions.width, y: Math.random() * windowDimensions.height }}
                  animate={{ 
                    y: [null, -150], 
                    opacity: [0, 0.4, 0],
                  }}
                  transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
                  className={`absolute w-32 h-32 blur-[40px] rounded-full ${
                    i % 4 === 0 ? 'bg-blue-400/30' : 
                    i % 4 === 1 ? 'bg-indigo-400/30' : 
                    i % 4 === 2 ? 'bg-sky-400/30' : 'bg-primary/20'
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
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-0 w-full h-full bg-indigo-500/5 blur-[120px]"
                style={{ transform: 'translateZ(0)' }}
              />
              {/* Enhanced Cosmic Dust Particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`dark-dust-${i}`}
                  initial={{ x: Math.random() * windowDimensions.width, y: Math.random() * windowDimensions.height, opacity: 0 }}
                  animate={{ 
                    y: [null, -100], 
                    opacity: [0, 0.4, 0],
                  }}
                  transition={{ duration: 15 + Math.random() * 10, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                  className="absolute w-1 h-1 bg-blue-300/20 rounded-full shadow-[0_0_5px_rgba(147,197,253,0.2)]"
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
