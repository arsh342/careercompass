"use client"

import { useState, useEffect, useRef, ReactNode } from "react"
import { ProfileCard } from "@/components/ui/profile-card"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

interface UserProfile {
  displayName?: string
  photoURL?: string
  headline?: string
  location?: string
  email?: string
  skills?: string
  role?: "employer" | "employee"
  company?: string
  education?: string
}

interface HoverProfileCardProps {
  userId: string
  children: ReactNode
  userName?: string
  userPhoto?: string
  userRole?: "employer" | "employee"
}

export function HoverProfileCard({
  userId,
  children,
  userName,
  userPhoto,
  userRole,
}: HoverProfileCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch user profile on hover
  useEffect(() => {
    if (isHovered && !profile && !loading) {
      setLoading(true)
      const fetchProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile)
          }
        } catch (error) {
          console.error("Error fetching profile:", error)
        } finally {
          setLoading(false)
        }
      }
      fetchProfile()
    }
  }, [isHovered, userId, profile, loading])

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    setIsHovered(true)
    // Delay showing the card
    timeoutRef.current = setTimeout(() => {
      setShowCard(true)
    }, 500)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    // Delay hiding the card
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false)
      setShowCard(false)
    }, 300)
  }

  // Parse skills string into array
  const skillsArray = profile?.skills
    ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {showCard && (
        <div 
          className="absolute z-50 left-0 top-full mt-2 animate-in fade-in-0 zoom-in-95 duration-200"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <ProfileCard
            userId={userId}
            name={profile?.displayName || userName || "User"}
            title={profile?.headline}
            avatarUrl={profile?.photoURL || userPhoto}
            location={profile?.location}
            email={profile?.email}
            skills={skillsArray}
            role={profile?.role || userRole}
            company={profile?.company}
            education={profile?.education}
          />
        </div>
      )}
    </div>
  )
}
