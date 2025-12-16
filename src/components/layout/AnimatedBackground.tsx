import { motion } from 'framer-motion';

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-subtle-mesh opacity-40 dark:opacity-20" />
      
      {/* Animated Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, 50, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full mix-blend-screen"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          x: [0, -50, 0],
          y: [0, 100, 0],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
        }}
        className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-accent/20 blur-[100px] rounded-full mix-blend-screen"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 50, 0],
          y: [0, -50, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
        }}
        className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen"
      />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
  );
};
