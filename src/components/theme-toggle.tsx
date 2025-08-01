"use client";

import * as React from "react";
import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [showText, setShowText] = React.useState(false);

  const cycleTheme = () => {
    let nextTheme: string;
    if (theme === "light") {
      nextTheme = "dark";
    } else if (theme === "dark") {
      nextTheme = "system";
    } else {
      nextTheme = "light";
    }

    setTheme(nextTheme);
    setShowText(true);

    // Hide text after 2 seconds
    setTimeout(() => {
      setShowText(false);
    }, 2000);
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-[1.2rem] w-[1.2rem]" />;
      case "dark":
        return <Moon className="h-[1.2rem] w-[1.2rem]" />;
      case "system":
        return <SunMoon className="h-[1.2rem] w-[1.2rem]" />;
      default:
        return <SunMoon className="h-[1.2rem] w-[1.2rem]" />;
    }
  };

  const getThemeText = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
      default:
        return "System";
    }
  };

  return (
    <Button
      variant="ghost"
      size={showText ? "default" : "icon"}
      onClick={cycleTheme}
      className="transition-all duration-200"
    >
      <div className="flex items-center gap-2">
        {getIcon()}
        {showText && (
          <span className="text-sm font-medium animate-in fade-in-0 duration-200">
            {getThemeText()}
          </span>
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
