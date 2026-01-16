import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
const colors = ["#FF6B35", "#F7C59F", "#FFD700", "#22C55E", "#3B82F6", "#A855F7", "#EC4899"];
export const Confetti = ({ isActive, duration = 3000 }) => {
    const [pieces, setPieces] = useState([]);
    useEffect(() => {
        if (isActive) {
            const newPieces = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                color: colors[Math.floor(Math.random() * colors.length)],
                delay: Math.random() * 0.5,
                rotation: Math.random() * 360,
                size: Math.random() * 8 + 4,
            }));
            setPieces(newPieces);
            const timer = setTimeout(() => setPieces([]), duration);
            return () => clearTimeout(timer);
        }
    }, [isActive, duration]);
    return (<AnimatePresence>
      {pieces.length > 0 && (<div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {pieces.map((piece) => (<motion.div key={piece.id} initial={{
                    x: `${piece.x}vw`,
                    y: -20,
                    rotate: 0,
                    opacity: 1,
                }} animate={{
                    y: "110vh",
                    rotate: piece.rotation + 720,
                    opacity: [1, 1, 0],
                }} exit={{ opacity: 0 }} transition={{
                    duration: 3 + Math.random() * 2,
                    delay: piece.delay,
                    ease: "easeOut",
                }} style={{
                    position: "absolute",
                    width: piece.size,
                    height: piece.size * 0.6,
                    backgroundColor: piece.color,
                    borderRadius: "2px",
                }}/>))}
        </div>)}
    </AnimatePresence>);
};
