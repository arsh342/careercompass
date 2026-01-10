"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillsInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SkillsInput({
  value = "",
  onChange,
  placeholder = "Type skills and press comma or enter...",
  className,
  disabled = false,
}: SkillsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse skills from comma-separated string
  const skills = value
    ? value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      const newSkills = [...skills, trimmedSkill];
      onChange?.(newSkills.join(", "));
    }
    setInputValue("");
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkills = skills.filter((skill) => skill !== skillToRemove);
    onChange?.(newSkills.join(", "));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Check for comma
    if (newValue.includes(",")) {
      const parts = newValue.split(",");
      const skillToAdd = parts[0].trim();
      if (skillToAdd) {
        addSkill(skillToAdd);
      }
      // Keep any remaining text after the comma
      setInputValue(parts.slice(1).join(","));
    } else {
      setInputValue(newValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (inputValue.trim()) {
        addSkill(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && skills.length > 0) {
      // Remove last skill if backspace is pressed on empty input
      removeSkill(skills[skills.length - 1]);
    }
  };

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addSkill(inputValue);
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        "min-h-[2.5rem] w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onClick={focusInput}
    >
      <div className="flex flex-wrap gap-1 items-center">
        {skills.map((skill, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {skill}
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSkill(skill);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        ))}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            placeholder={skills.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground"
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
