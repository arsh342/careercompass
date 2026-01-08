"use client";

import * as React from "react";

interface AILoaderProps {
  size?: number;
  text?: string;
  className?: string;
}

export const AILoader: React.FC<AILoaderProps> = ({ 
  size = 180, 
  text = "Generating",
  className = ""
}) => {
  const letters = text.split("");

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className="relative flex items-center justify-center font-inter select-none"
        style={{ width: size, height: size }}
      >
        {letters.map((letter, index) => (
          <span
            key={index}
            className="inline-block text-primary dark:text-primary opacity-60 text-xl font-semibold"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              animation: "loaderLetter 3s infinite"
            }}
          >
            {letter}
          </span>
        ))}

        <div
          className="absolute inset-0 rounded-full"
          style={{ animation: "loaderCircle 5s linear infinite" }}
        />
      </div>

      <style jsx>{`
        @keyframes loaderCircle {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 6px 12px 0 hsl(var(--primary) / 0.4) inset,
              0 12px 18px 0 hsl(var(--primary) / 0.3) inset,
              0 36px 36px 0 hsl(var(--primary) / 0.2) inset,
              0 0 3px 1.2px hsl(var(--primary) / 0.3),
              0 0 6px 1.8px hsl(var(--primary) / 0.2);
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 6px 12px 0 hsl(var(--primary) / 0.5) inset,
              0 12px 6px 0 hsl(var(--primary) / 0.4) inset,
              0 24px 36px 0 hsl(var(--primary) / 0.3) inset,
              0 0 3px 1.2px hsl(var(--primary) / 0.3),
              0 0 6px 1.8px hsl(var(--primary) / 0.2);
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 6px 12px 0 hsl(var(--primary) / 0.4) inset,
              0 12px 18px 0 hsl(var(--primary) / 0.3) inset,
              0 36px 36px 0 hsl(var(--primary) / 0.2) inset,
              0 0 3px 1.2px hsl(var(--primary) / 0.3),
              0 0 6px 1.8px hsl(var(--primary) / 0.2);
          }
        }

        @keyframes loaderLetter {
          0%,
          100% {
            opacity: 0.4;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
            transform: scale(1.15);
          }
          40% {
            opacity: 0.7;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Inline version for use within cards/containers (not fullscreen)
export const AILoaderInline: React.FC<AILoaderProps> = ({ 
  size = 120, 
  text = "Generating" 
}) => {
  const letters = text.split("");

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className="relative flex items-center justify-center font-inter select-none"
        style={{ width: size, height: size }}
      >
        {letters.map((letter, index) => (
          <span
            key={index}
            className="inline-block text-primary opacity-40"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              animation: "loaderLetterInline 3s infinite"
            }}
          >
            {letter}
          </span>
        ))}

        <div
          className="absolute inset-0 rounded-full"
          style={{ animation: "loaderCircleInline 5s linear infinite" }}
        />
      </div>

      <style jsx>{`
        @keyframes loaderCircleInline {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 4px 8px 0 hsl(var(--primary) / 0.3) inset,
              0 8px 12px 0 hsl(var(--primary) / 0.2) inset,
              0 24px 24px 0 hsl(var(--primary) / 0.1) inset,
              0 0 2px 1px hsl(var(--primary) / 0.2);
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 4px 8px 0 hsl(var(--primary) / 0.4) inset,
              0 8px 4px 0 hsl(var(--primary) / 0.3) inset,
              0 16px 24px 0 hsl(var(--primary) / 0.2) inset,
              0 0 2px 1px hsl(var(--primary) / 0.2);
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 4px 8px 0 hsl(var(--primary) / 0.3) inset,
              0 8px 12px 0 hsl(var(--primary) / 0.2) inset,
              0 24px 24px 0 hsl(var(--primary) / 0.1) inset,
              0 0 2px 1px hsl(var(--primary) / 0.2);
          }
        }

        @keyframes loaderLetterInline {
          0%,
          100% {
            opacity: 0.4;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
            transform: scale(1.15);
          }
          40% {
            opacity: 0.7;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AILoader;
