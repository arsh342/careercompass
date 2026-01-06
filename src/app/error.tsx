"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";
import { Button } from "@/components/ui/button";
import { Home, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Colorful Gradient Background */}
      <AnimatedGradientBackground 
        Breathing={true}
        startingGap={100}
        gradientColors={[
          "#0A0A0A",
          "#FF6B6B",
          "#FF80AB",
          "#FF6D00",
          "#FFD600",
          "#FF4757",
          "#C44569"
        ]}
        gradientStops={[35, 50, 60, 70, 80, 90, 100]}
        animationSpeed={0.02}
        breathingRange={5}
        topOffset={20}
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        {/* Animated Cat */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-40 h-40 md:w-52 md:h-52 mb-4"
        >
          <DotLottieReact
            src="https://lottie.host/8cf4ba71-e5fb-44f3-8134-178c4d389417/0CCsdcgNIP.json"
            loop
            autoplay
          />
        </motion.div>

        {/* Large Status Code */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          className="mb-4"
        >
          <h1 className="text-[8rem] md:text-[10rem] lg:text-[12rem] font-black text-white leading-none select-none drop-shadow-2xl">
            500
          </h1>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-lg md:text-xl text-gray-300 max-w-lg mb-10">
            Something went wrong. Please try again or contact support if the problem persists.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
          className="flex gap-4"
        >
          <Button
            variant="outline"
            size="lg"
            className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
            onClick={reset}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
