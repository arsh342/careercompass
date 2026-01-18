"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Mail, MapPin, Briefcase, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileCardProps {
  userId: string
  name: string
  title?: string
  avatarUrl?: string
  location?: string
  email?: string
  skills?: string[]
  role?: "employer" | "employee"
  company?: string
  education?: string
  onClose?: () => void
}

export function ProfileCard({
  userId,
  name,
  title,
  avatarUrl,
  location,
  email,
  skills = [],
  role = "employee",
  company,
  education,
  onClose,
}: ProfileCardProps) {
  const displaySkills = skills.slice(0, 4)
  const remainingSkills = skills.length - 4

  return (
    <div className="w-80 bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
      {/* Header with gradient background */}
      <div className="relative h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="absolute -bottom-8 left-4">
          <Avatar className="h-16 w-16 border-4 border-card shadow-lg">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-bold">
              {name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profile content */}
      <div className="pt-10 px-4 pb-4">
        {/* Name and title */}
        <Link 
          href={`/users/${userId}`}
          className="font-semibold text-lg text-foreground hover:text-primary transition-colors block"
        >
          {name}
        </Link>
        <p className="text-sm text-muted-foreground mt-0.5">
          {title || (role === "employer" ? "Employer" : "Job Seeker")}
        </p>

        {/* Info items */}
        <div className="mt-3 space-y-1.5">
          {company && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" />
              <span>{company}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{location}</span>
            </div>
          )}
          {education && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{education}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {displaySkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {displaySkills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
              >
                {skill}
              </span>
            ))}
            {remainingSkills > 0 && (
              <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                +{remainingSkills} more
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          <Button asChild size="sm" className="flex-1 rounded-full">
            <Link href={`/users/${userId}`}>View Profile</Link>
          </Button>
          {email && (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <a href={`mailto:${email}`}>
                <Mail className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
