import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Ghost, MessageCircle } from "lucide-react";
import TypingAinmation from "./Typing Animation";

const InteractiveEmptyState = () => {
  const [isClient, setIsClient] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(mouseY, springConfig);
  const rotateY = useSpring(mouseX, springConfig);

  useEffect(() => {
    setIsClient(true);

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const rotateXValue = (clientY / window.innerHeight - 0.5) * 20;
      const rotateYValue = (clientX / window.innerWidth - 0.5) * 20;

      mouseX.set(rotateYValue);
      mouseY.set(rotateXValue);
    };

    const handleOrientation = (e) => {
      if (e.gamma && e.beta) {
        mouseX.set(e.gamma / 2);
        mouseY.set(e.beta / 2);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [mouseX, mouseY]);

  if (!isClient) return null;

  return (
    <div className="flex-1 flex items-center justify-center p-6 mt-8">
      <motion.div
        className="relative w-full max-w-lg mx-auto"
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          transformPerspective: 1000,
        }}
      >
        <div className="bg-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
          {/* Floating ghost */}
          <motion.div
            className="absolute"
            animate={{
              y: [0, -15, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              right: "15%",
              top: "20%",
            }}
          >
            <Ghost className="w-8 h-8 md:w-12 md:h-12 text-indigo-400 opacity-80" />
          </motion.div>

          {/* Message bubble */}
          <motion.div
            className="absolute"
            animate={{
              y: [0, 10, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            style={{
              left: "15%",
              top: "25%",
            }}
          >
            <MessageCircle className="w-6 h-6 md:w-10 md:h-10 text-pink-400 opacity-80" />
          </motion.div>

          {/* Content */}
          <div className="text-center max-w-xs mx-auto mt-12 mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3">
              You haven't shared any secrets
            </h2>
            <p className="text-gray-500 text-xs md:text-sm italic">
              We're better at keeping secrets than your best friend!🤫
            </p>
            <p className="text-gray-400 text-xs mt-3">
              <TypingAinmation />
            </p>
          </div>

          {/* Bottom decorative elements */}
          <div className="flex justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InteractiveEmptyState;
