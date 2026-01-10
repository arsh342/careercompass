"use client";

import { Button } from "@/components/ui/button";
import {
  FileText,
  Mail,
  Sparkles,
  Crown,
  Linkedin,
  Mic,
  TrendingUp,
  DollarSign,
  MailPlus,
  Globe,
  Lock,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";

// ============================================
// ANIMATIONS
// ============================================

function TypeTester() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setScale((prev) => (prev === 1 ? 1.3 : 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full">
      <motion.span
        className="font-serif text-6xl md:text-8xl text-white font-medium"
        animate={{ scale }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        Aa
      </motion.span>
    </div>
  );
}

function LayoutAnimation() {
  const [layout, setLayout] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLayout((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const layouts = ["grid-cols-2", "grid-cols-3", "grid-cols-1"];

  return (
    <div className="h-full flex items-center justify-center">
      <motion.div
        className={`grid ${layouts[layout]} gap-1.5 w-full max-w-[140px]`}
        layout
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="bg-white/20 rounded-md h-5 w-full"
            layout
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </motion.div>
    </div>
  );
}

function SpeedIndicator() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoading(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="h-10 flex items-center justify-center overflow-hidden relative w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              className="h-8 w-24 bg-white/10 rounded"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ) : (
            <motion.span
              key="text"
              initial={{ y: 20, opacity: 0, filter: "blur(5px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              className="text-3xl md:text-4xl font-sans font-medium text-white"
            >
              100ms
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span className="text-sm text-gray-400">Load Time</span>
      <div className="w-full max-w-[120px] h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: loading ? "30%" : "100%" }}
          transition={{ type: "spring", stiffness: 100, damping: 15, mass: 1 }}
        />
      </div>
    </div>
  );
}

function SecurityBadge() {
  const [shields, setShields] = useState([
    { id: 1, active: false },
    { id: 2, active: false },
    { id: 3, active: false }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShields(prev => {
        const nextIndex = prev.findIndex(s => !s.active);
        if (nextIndex === -1) {
          return prev.map((s) => ({ ...s, active: false }));
        }
        return prev.map((s, i) => i === nextIndex ? { ...s, active: true } : s);
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full gap-2">
      {shields.map((shield) => (
        <motion.div
          key={shield.id}
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            shield.active ? 'bg-white/20' : 'bg-white/5'
          }`}
          animate={{ scale: shield.active ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Lock className={`w-5 h-5 ${shield.active ? 'text-white' : 'text-gray-600'}`} />
        </motion.div>
      ))}
    </div>
  );
}

function GlobalNetwork() {
  const pulses = [0, 1, 2, 3, 4];

  return (
    <div className="flex items-center justify-center h-full relative">
      <Globe className="w-16 h-16 text-white/80 z-10" />
      {pulses.map((pulse) => (
        <motion.div
          key={pulse}
          className="absolute w-16 h-16 border-2 border-white/30 rounded-full"
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: pulse * 0.8,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}

function MobileAnimation() {
  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Smartphone className="w-16 h-16 text-white" />
      </motion.div>
    </div>
  );
}

function PulsingMic() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative">
        <motion.div
          className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Mic className="w-8 h-8 text-green-400" />
        </motion.div>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-green-400/30"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
          />
        ))}
      </div>
    </div>
  );
}

function MoneyCounter() {
  const [amount, setAmount] = useState(95000);
  
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
        className="text-4xl font-bold text-emerald-400"
      >
        ${amount.toLocaleString()}
      </motion.span>
      <span className="text-sm text-white/50 mt-2">Market Rate</span>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function AIToolsPage() {
  const { userProfile } = useAuth();
  const userPlan = userProfile?.plan || "free";
  const isPremium = ["pro", "premium"].includes(userPlan);

  return (
    <div className="min-h-screen bg-background -m-4 md:-m-6 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.p
          className="text-gray-400 text-sm uppercase tracking-widest mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Career LaunchPad
        </motion.p>
        <motion.h1 
          className="text-3xl md:text-4xl font-bold mb-2 text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Launch Your Dream Career
        </motion.h1>
        <motion.p 
          className="text-muted-foreground mb-10 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          AI-powered tools to help you stand out and land your dream job.
        </motion.p>

        {/* Bento Grid - 6 columns */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
          
          {/* 1. Resume Builder - Tall (2x2) */}
          <motion.div
            className="md:col-span-2 md:row-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col hover:border-zinc-700 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
          >
            <Link href="/ai-tools/resume-builder" className="flex flex-col h-full">
              <div className="flex-1">
                <TypeTester />
              </div>
              <div className="mt-4">
                <h3 className="text-xl text-white font-medium flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Resume Builder
                </h3>
                <p className="text-gray-400 text-sm mt-1">Create an ATS-optimized, professional resume.</p>
              </div>
            </Link>
          </motion.div>

          {/* 2. Cover Letter - Standard (2x1) */}
          <motion.div
            className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col hover:border-zinc-700 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 0.98 }}
          >
            <Link href="/ai-tools/cover-letter" className="flex flex-col h-full">
              <div className="flex-1">
                <LayoutAnimation />
              </div>
              <div className="mt-4">
                <h3 className="text-xl text-white font-medium flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Cover Letter
                </h3>
                <p className="text-gray-400 text-sm mt-1">Generate compelling cover letters.</p>
              </div>
            </Link>
          </motion.div>

          {/* 3. LinkedIn - Tall (2x2) */}
          <motion.div
            className="md:col-span-2 md:row-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col hover:border-zinc-700 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <Link href="/ai-tools/linkedin" className="flex flex-col h-full">
              <div className="flex-1 flex items-center justify-center">
                <GlobalNetwork />
              </div>
              <div className="mt-auto">
                <h3 className="text-xl text-white flex items-center gap-2 font-medium">
                  <Linkedin className="w-5 h-5 text-[#0077B5]" />
                  LinkedIn Optimizer
                </h3>
                <p className="text-gray-400 text-sm mt-1">Get noticed by recruiters worldwide.</p>
              </div>
            </Link>
          </motion.div>

          {/* 4. Interview Prep - Standard (2x1) */}
          <motion.div
            className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col hover:border-zinc-700 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 0.98 }}
          >
            <Link href="/ai-tools/interview-prep" className="flex flex-col h-full">
              <div className="flex-1">
                <SpeedIndicator />
              </div>
              <div className="mt-4">
                <h3 className="text-xl text-white font-medium flex items-center gap-2">
                  <Mic className="w-5 h-5 text-green-400" />
                  Interview Prep
                </h3>
                <p className="text-gray-400 text-sm mt-1">Practice with AI feedback.</p>
              </div>
            </Link>
          </motion.div>

          {/* 5. Skill Gap - Standard (2x1) */}
          <motion.div
            className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col hover:border-zinc-700 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 0.98 }}
          >
            <Link href="/ai-tools/skill-gap" className="flex flex-col h-full">
              <div className="flex-1">
                <SecurityBadge />
              </div>
              <div className="mt-4">
                <h3 className="text-xl text-white flex items-center gap-2 font-medium">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  Skill Gap Analyzer
                </h3>
                <p className="text-gray-400 text-sm mt-1">Identify missing skills and get learning recommendations.</p>
              </div>
            </Link>
          </motion.div>

          {/* 6. Salary - Standard (2x1) */}
          <motion.div
            className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col hover:border-zinc-700 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 0.98 }}
          >
            <Link href="/ai-tools/salary" className="flex flex-col h-full">
              <div className="flex-1">
                <MoneyCounter />
              </div>
              <div className="mt-4">
                <h3 className="text-xl text-white font-medium flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Salary Negotiator
                </h3>
                <p className="text-gray-400 text-sm mt-1">Get data-driven salary insights and negotiation scripts.</p>
              </div>
            </Link>
          </motion.div>

          {/* 7. Email Templates - Standard (2x1) */}
          <motion.div
            className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col hover:border-zinc-700 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 0.98 }}
          >
            <Link href="/ai-tools/email-templates" className="flex flex-col h-full">
              <div className="flex-1">
                <MobileAnimation />
              </div>
              <div className="mt-4">
                <h3 className="text-xl text-white font-medium flex items-center gap-2">
                  <MailPlus className="w-5 h-5 text-rose-400" />
                  Email Templates
                </h3>
                <p className="text-gray-400 text-sm mt-1">Professional follow-up emails.</p>
              </div>
            </Link>
          </motion.div>

        </div>

        {/* CTA for Free Users */}
        {!isPremium && (
          <motion.div 
            className="mt-12 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-violet-500/10 border border-violet-500/20 rounded-2xl p-8 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Crown className="h-12 w-12 mx-auto mb-4 text-amber-400" />
            <h2 className="text-2xl font-bold mb-2 text-white">Unlock Premium Features</h2>
            <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
              Upgrade for unlimited access to all AI tools and priority processing.
            </p>
            <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700">
              <Link href="/pricing">
                <Sparkles className="mr-2 h-4 w-4" />
                View Pricing
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
