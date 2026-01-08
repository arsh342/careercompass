"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Heart } from "lucide-react";
import Link from "next/link";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { LumaSpin } from "@/components/ui/luma-spin";

export default function SavedOpportunitiesPage() {
  const { saved, setSaved, toggleSave, loading } = useSavedOpportunities();
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
        <h1 className="text-3xl font-bold tracking-tight">
          Saved Opportunities
        </h1>
        <p className="text-muted-foreground">
          Your saved jobs and opportunities for future reference.
        </p>
      </div>

      {saved.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-20">
              <Briefcase className="h-12 w-12 mb-4" />
              <h2 className="text-xl font-semibold">No Saved Opportunities</h2>
              <p>
                You haven't saved any opportunities yet. Start browsing to find
                ones you love!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {saved.map((opp) => {
            const skillsArray =
              typeof opp.skills === "string"
                ? opp.skills.split(",").map((s) => s.trim())
                : opp.skills || [];
            const matchPercentage = calculateMatch(opp);
            return (
              <Card key={opp.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge
                        variant={
                          opp.type === "Internship" ? "default" : "secondary"
                        }
                        className="mb-2"
                      >
                        {opp.type}
                      </Badge>
                      <CardTitle className="text-lg">{opp.title}</CardTitle>
                      <CardDescription>
                        {opp.employerName} - {opp.location}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => toggleSave(opp)}
                    >
                      <Heart
                        className={cn("w-5 h-5", "fill-primary text-primary")}
                      />
                      <span className="sr-only">Unsave opportunity</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  {/* Job Description Overview */}
                  {opp.description && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {opp.description.length > 150
                          ? `${opp.description.substring(0, 150)}...`
                          : opp.description}
                      </p>
                    </div>
                  )}

                  {/* Attractive Info Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Compensation & Benefits */}
                    {opp.compensationAndBenefits && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">
                            Compensation
                          </span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 line-clamp-2">
                          {opp.compensationAndBenefits.length > 60
                            ? `${opp.compensationAndBenefits.substring(
                                0,
                                60
                              )}...`
                            : opp.compensationAndBenefits}
                        </p>
                      </div>
                    )}

                    {/* Experience Level */}
                    {opp.experience && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            Experience
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 line-clamp-2">
                          {opp.experience.length > 60
                            ? `${opp.experience.substring(0, 60)}...`
                            : opp.experience}
                        </p>
                      </div>
                    )}

                    {/* Working Hours */}
                    {opp.workingHours && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                            Schedule
                          </span>
                        </div>
                        <p className="text-xs text-purple-600 dark:text-purple-400 line-clamp-2">
                          {opp.workingHours.length > 60
                            ? `${opp.workingHours.substring(0, 60)}...`
                            : opp.workingHours}
                        </p>
                      </div>
                    )}

                    {/* Education Requirements */}
                    {opp.education && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                            Education
                          </span>
                        </div>
                        <p className="text-xs text-orange-600 dark:text-orange-400 line-clamp-2">
                          {opp.education.length > 60
                            ? `${opp.education.substring(0, 60)}...`
                            : opp.education}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Skills Section */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Required skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {skillsArray
                          .slice(0, 5)
                          .map((skill: string, index: number) => (
                            <Badge key={`${skill}-${index}`} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        {skillsArray.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{skillsArray.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="text-sm font-semibold text-primary">
                    {matchPercentage > 0 && `${matchPercentage}% Match`}
                  </div>
                  <Link href={`/opportunities/${opp.id}`}>
                    <InteractiveHoverButton text="View Details" className="w-auto px-4" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
