"use client";

import * as React from "react";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Heart,
  MapPin,
  Clock,
  GraduationCap,
  DollarSign,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

export interface OpportunityCardProps {
  id: string;
  title: string;
  employerName: string;
  location: string;
  type: string;
  description?: string;
  skills: string[] | string;
  matchedSkills?: string[];
  match?: number;
  compensationAndBenefits?: string;
  experience?: string;
  workingHours?: string;
  education?: string;
  createdAt?: {
    toDate: () => Date;
  };
  isSaved?: boolean;
  onToggleSave?: () => void;
  isBoosted?: boolean;
  className?: string;
}

const OpportunityCard = React.forwardRef<HTMLDivElement, OpportunityCardProps>(
  (
    {
      id,
      title,
      employerName,
      location,
      type,
      description,
      skills,
      matchedSkills,
      match,
      compensationAndBenefits,
      experience,
      workingHours,
      education,
      createdAt,
      isSaved,
      onToggleSave,
      isBoosted,
      className,
    },
    ref
  ) => {
    // Process skills into array
    const skillsArray =
      typeof skills === "string"
        ? skills.split(",").map((s) => s.trim())
        : skills || [];

    // Format date
    const formatDate = (date?: { toDate: () => Date }) => {
      if (!date) return null;
      const d = date.toDate();
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    // Animation variants for Framer Motion
    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" as const },
      },
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "w-full rounded-3xl border bg-card p-5 text-card-foreground shadow-sm font-sans flex flex-col",
          isBoosted
            ? "border-amber-300 dark:border-amber-700 ring-1 ring-amber-200/50 dark:ring-amber-800/50"
            : "border-border",
          className
        )}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={type === "Internship" ? "default" : "secondary"}
                className="shrink-0"
              >
                {type}
              </Badge>
              {isBoosted && (
                <Badge className="shrink-0 bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700 gap-1">
                  <Zap className="h-3 w-3" />
                  Promoted
                </Badge>
              )}
              {match && match > 0 && (
                <Badge
                  variant="outline"
                  className="border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300 shrink-0"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {match}% Match
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{employerName}</span>
              <span className="shrink-0">•</span>
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>
          {onToggleSave && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 -mt-1 -mr-2"
              onClick={onToggleSave}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-colors",
                  isSaved && "fill-primary text-primary"
                )}
              />
              <span className="sr-only">Save opportunity</span>
            </Button>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {compensationAndBenefits && (
            <div className="bg-green-50 dark:bg-green-900/20 p-2.5 rounded-3xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-1.5 mb-0.5">
                <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  Pay
                </span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 line-clamp-1">
                {compensationAndBenefits}
              </p>
            </div>
          )}

          {experience && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-3xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Briefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Experience
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 line-clamp-1">
                {experience}
              </p>
            </div>
          )}

          {workingHours && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-3xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Schedule
                </span>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 line-clamp-1">
                {workingHours}
              </p>
            </div>
          )}

          {education && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded-3xl border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-1.5 mb-0.5">
                <GraduationCap className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                  Education
                </span>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 line-clamp-1">
                {education}
              </p>
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="mt-4 flex-grow">
          <p className="text-xs text-muted-foreground mb-2">
            {matchedSkills && matchedSkills.length > 0
              ? "Your matching skills:"
              : "Required skills:"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills && matchedSkills.length > 0
              ? matchedSkills.slice(0, 4).map((skill, index) => (
                  <Badge
                    key={`${skill}-${index}`}
                    variant="default"
                    className="bg-primary/10 border-primary text-primary text-xs"
                  >
                    {skill}
                  </Badge>
                ))
              : skillsArray.slice(0, 4).map((skill, index) => (
                  <Badge
                    key={`${skill}-${index}`}
                    variant="outline"
                    className="text-xs"
                  >
                    {skill}
                  </Badge>
                ))}
            {skillsArray.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{skillsArray.length - 4}
              </Badge>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          {createdAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{formatDate(createdAt)}</span>
            </div>
          )}
          <Link href={`/opportunities/${id}`}>
            <InteractiveHoverButton text="View Details" className="w-auto px-4" />
          </Link>
        </div>
      </motion.div>
    );
  }
);

OpportunityCard.displayName = "OpportunityCard";

export { OpportunityCard };
