"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Heart, MapPin } from "lucide-react";
import Link from "next/link";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { LumaSpin } from "@/components/ui/luma-spin";

// Gradient backgrounds for avatars
const AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500',
  'bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500',
  'bg-gradient-to-br from-pink-400 via-rose-400 to-red-400',
  'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500',
  'bg-gradient-to-br from-amber-400 via-orange-400 to-red-400',
  'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400',
  'bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-400',
  'bg-gradient-to-br from-slate-500 via-gray-600 to-zinc-700',
];

// Get consistent gradient based on identifier
const getGradient = (identifier: string) => {
  if (!identifier) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

export default function SavedOpportunitiesPage() {
  const { saved, toggleSave, loading } = useSavedOpportunities();
  const { userProfile, role } = useAuth();

  const calculateMatch = (opportunity: any) => {
    if (!userProfile?.skills || role === "employer") return 0;
    const userSkills = new Set(
      (userProfile.skills || "")
        .split(",")
        .map((s: string) => s.trim().toLowerCase())
    );
    const requiredSkills = new Set(
      typeof opportunity.skills === "string"
        ? opportunity.skills
            .split(",")
            .map((s: string) => s.trim().toLowerCase())
        : (opportunity.skills || []).map((s: unknown) =>
            String(s).toLowerCase()
          )
    );
    if (requiredSkills.size === 0) return 0;

    const commonSkills = [...userSkills].filter((skill) =>
      requiredSkills.has(skill)
    );
    return Math.round((commonSkills.length / requiredSkills.size) * 100);
  };

  // Show loading spinner while data is being fetched
  if (loading || (!userProfile && role !== "employer")) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[60vh]">
        <LumaSpin />
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Saved Opportunities
        </h1>
        <p className="text-sm text-muted-foreground">
          {saved.length} saved {saved.length === 1 ? 'opportunity' : 'opportunities'}
        </p>
      </div>

      {saved.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-20">
              <Briefcase className="h-12 w-12 mb-4" />
              <h2 className="text-xl font-semibold">No Saved Opportunities</h2>
              <p>
                You haven't saved any opportunities yet. Start browsing to find
                ones you love!
              </p>
              <Link href="/opportunities">
                <Button className="mt-4 rounded-full">Browse Opportunities</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
            <div className="col-span-4">Job Title</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-1">Match</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {saved.map((opp) => {
              const matchPercentage = calculateMatch(opp);

              return (
                <div
                  key={opp.id}
                  className="group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/30 transition-colors items-center"
                >
                  {/* Job Title & Company */}
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex-shrink-0",
                      getGradient(opp.id || opp.employerName)
                    )} />
                    <div className="min-w-0">
                      <Link 
                        href={`/opportunities/${opp.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {opp.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {opp.employerName}
                      </p>
                    </div>
                  </div>

                  {/* Role Badges */}
                  <div className="md:col-span-3 flex flex-wrap gap-1.5">
                    {opp.type && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs rounded-full",
                          opp.type === "Full-time" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                          opp.type === "Part-time" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                          opp.type === "Internship" && "bg-purple-500/10 text-purple-600 border-purple-500/20",
                          opp.type === "Contract" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                          opp.type === "Volunteer" && "bg-pink-500/10 text-pink-600 border-pink-500/20"
                        )}
                      >
                        {opp.type}
                      </Badge>
                    )}
                    {opp.experience && (
                      <Badge variant="outline" className="text-xs rounded-full">
                        {opp.experience}
                      </Badge>
                    )}
                    {opp.workMode && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs rounded-full",
                          opp.workMode === "Remote" && "bg-green-500/10 text-green-600 border-green-500/20",
                          opp.workMode === "Hybrid" && "bg-orange-500/10 text-orange-600 border-orange-500/20"
                        )}
                      >
                        {opp.workMode}
                      </Badge>
                    )}
                  </div>

                  {/* Location */}
                  <div className="md:col-span-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">{opp.location || 'Remote'}</span>
                  </div>

                  {/* Match */}
                  <div className="md:col-span-1">
                    {matchPercentage > 0 ? (
                      <Badge className="text-xs rounded-full bg-primary/10 text-primary border-primary/20">
                        {matchPercentage}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full h-8 w-8 p-0 bg-red-500/10 border-red-500/20 text-red-500"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSave(opp);
                      }}
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="rounded-full bg-primary hover:bg-primary/90"
                    >
                      <Link href={`/opportunities/${opp.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
