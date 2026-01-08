"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

// ============================================
// ANIMATED BACKGROUNDS FOR CARDS
// ============================================

export function TypingAnimation() {
  const [text, setText] = useState("");
  const fullText = "Senior Developer...";
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setText(fullText.slice(0, i));
        i++;
      } else {
        i = 0;
        setText("");
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-white/10 rounded-lg p-4 w-full max-w-[180px]">
        <div className="h-2 w-16 bg-white/20 rounded mb-3" />
        <div className="flex items-center">
          <span className="text-white/80 text-sm font-mono">{text}</span>
          <motion.span
            className="w-0.5 h-4 bg-white ml-0.5"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
}

export function PulsingMic() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative">
        <motion.div
          className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div
            className="w-8 h-8 rounded-full bg-white/40"
            animate={{ scale: [1, 0.8, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </motion.div>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-white/30"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkillBars() {
  const [progress, setProgress] = useState([30, 60, 85]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress([
        Math.random() * 40 + 20,
        Math.random() * 40 + 40,
        Math.random() * 30 + 70,
      ]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-center h-full gap-3 px-4">
      {progress.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                i === 0 ? "bg-red-400" : i === 1 ? "bg-yellow-400" : "bg-green-400"
              )}
              animate={{ width: `${p}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MoneyCounter() {
  const [amount, setAmount] = useState(85000);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAmount(Math.floor(Math.random() * 50000) + 80000);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.span
        key={amount}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-bold text-white"
      >
        ${amount.toLocaleString()}
      </motion.span>
      <span className="text-sm text-white/50 mt-1">Avg. Salary</span>
    </div>
  );
}

export function LinkedInPulse() {
  const [connections, setConnections] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setConnections(prev => {
        if (prev >= 500) return 0;
        return prev + Math.floor(Math.random() * 50) + 10;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        className="text-4xl font-bold text-white"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.3 }}
        key={connections}
      >
        +{connections}
      </motion.div>
      <span className="text-sm text-white/50 mt-1">Profile Views</span>
    </div>
  );
}

export function EmailTyping() {
  const lines = ["Dear Hiring Manager,", "Thank you for...", "Best regards"];
  const [currentLine, setCurrentLine] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine(prev => (prev + 1) % lines.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-center h-full px-4 gap-2">
      {lines.map((line, i) => (
        <motion.div
          key={i}
          className={cn(
            "h-2 rounded bg-white/20",
            i <= currentLine ? "bg-white/40" : ""
          )}
          style={{ width: `${60 + i * 15}%` }}
          animate={{ opacity: i <= currentLine ? 1 : 0.3 }}
        />
      ))}
    </div>
  );
}

export function MatchScore() {
  const [score, setScore] = useState(75);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setScore(Math.floor(Math.random() * 30) + 70);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
            fill="none"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="35"
            stroke="white"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={220}
            animate={{ strokeDashoffset: 220 - (220 * score) / 100 }}
            transition={{ duration: 0.8 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            key={score}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-xl font-bold text-white"
          >
            {score}%
          </motion.span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// BENTO CARD
// ============================================

type BentoCardProps = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  animation: React.ReactNode;
  className?: string;
  gradient: string;
};

export function BentoCard({
  title,
  description,
  href,
  icon: Icon,
  animation,
  className,
  gradient,
}: BentoCardProps) {
  return (
    <Link href={href}>
      <motion.div
        className={cn(
          "relative rounded-2xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col overflow-hidden cursor-pointer group",
          className
        )}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.02, borderColor: "rgba(113, 113, 122, 0.5)" }}
        transition={{ duration: 0.3 }}
      >
        {/* Gradient overlay on hover */}
        <motion.div
          className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity", gradient)}
        />
        
        {/* Animation area */}
        <div className="flex-1 relative z-10 min-h-[120px]">
          {animation}
        </div>
        
        {/* Content */}
        <div className="mt-4 relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-5 h-5 text-white/80" />
            <h3 className="font-medium text-lg text-white">{title}</h3>
          </div>
          <p className="text-sm text-zinc-400">{description}</p>
        </div>
      </motion.div>
    </Link>
  );
}

// ============================================
// BENTO GRID
// ============================================

type BentoGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[280px]",
      className
    )}>
      {children}
    </div>
  );
}

export {
  BentoCard as default,
};
