"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface Opportunity {
  id: string;
  title: string;
  employerName: string;
  location: string;
  type: string;
  match?: number;
  skills: string[] | string;
  matchedSkills?: string[];
  createdAt?: {
    toDate: () => Date;
  };
  [key: string]: any;
}

export default function DashboardPage() {
  const { saved, toggleSave } = useSavedOpportunities();
  const { userProfile, loading: authLoading, role } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const isProfileComplete =
    userProfile &&
    userProfile.education &&
    userProfile.skills &&
    userProfile.interests &&
    userProfile.careerGoals;

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (authLoading || role === "employer") {
        if (!authLoading) setLoading(false);
        return;
      }
      if (!userProfile) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "opportunities"),
          where("status", "==", "Active")
        );
        const opportunitiesSnapshot = await getDocs(q);
        const opportunitiesData = opportunitiesSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Opportunity)
        );

        const userSkills: Set<string> = new Set(
          (userProfile.skills || "")
            .split(",")
            .map((s: string) => s.trim().toLowerCase())
        );

        let recommendedOpportunities: any[] = [];

        if (userSkills.size > 0) {
          recommendedOpportunities = opportunitiesData
            .map((opp) => {
              const requiredSkills: Set<string> = new Set(
                typeof opp.skills === "string"
                  ? opp.skills
                      .split(",")
                      .map((s: string) => s.trim().toLowerCase())
                  : (opp.skills || []).map((s: unknown) =>
                      String(s).toLowerCase()
                    )
              );
              const commonSkills = Array.from(userSkills).filter(
                (skill: string) => requiredSkills.has(skill)
              );
              const matchPercentage =
                requiredSkills.size > 0
                  ? Math.round(
                      (commonSkills.length / requiredSkills.size) * 100
                    )
                  : 0;

              const originalSkillsArray =
                typeof opp.skills === "string"
                  ? opp.skills.split(",").map((s) => s.trim())
                  : opp.skills || [];

              return {
                ...opp,
                skills: originalSkillsArray,
                match: matchPercentage,
                matchedSkills: commonSkills.map((s) => {
                  const originalSkill = originalSkillsArray.find(
                    (os) => os.toLowerCase() === s
                  );
                  return originalSkill || s;
                }),
              };
            })
            .filter((opp) => opp.match && opp.match > 0)
            .sort((a, b) => b.match! - a.match!);
        }

        if (recommendedOpportunities.length > 0) {
          setOpportunities(recommendedOpportunities.slice(0, 6));
        } else {
          // Fallback: Show the 6 most recent job postings if no matches are found
          const recentOpps = opportunitiesData
            .sort(
              (a, b) =>
                (b.createdAt?.toDate()?.getTime() || 0) -
                (a.createdAt?.toDate()?.getTime() || 0)
            )
            .slice(0, 6)
            .map((opp) => ({ ...opp, match: 0, matchedSkills: [] })); // Add default match info
          setOpportunities(recentOpps);
        }
      } catch (error) {
        console.error("Error fetching opportunities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, [userProfile, authLoading, role]);

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
        <p className="text-muted-foreground">
          Personalized recommendations and recent opportunities.
        </p>
      </div>

      {!isProfileComplete && role === "employee" && !authLoading && (
        <Card className="mb-6 bg-secondary/50 border-primary/20">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Fill out your profile for more personalized results and better
              opportunity matches.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/profile">
                <Edit className="mr-2 h-4 w-4" />
                Complete Profile
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {loading || authLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : opportunities.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-10">
              <h3 className="text-lg font-semibold">
                No opportunities available right now.
              </h3>
              <p>Please check back later for new job postings.</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/opportunities">Browse All Opportunities</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opp) => {
            const isSaved = saved.some((savedOpp) => savedOpp.id === opp.id);
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
                        className={cn(
                          "w-5 h-5",
                          isSaved && "fill-primary text-primary"
                        )}
                      />
                      <span className="sr-only">Save opportunity</span>
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
                        {opp.match && opp.match > 0
                          ? "Because you're skilled in:"
                          : "Required skills for this role:"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {opp.matchedSkills && opp.matchedSkills.length > 0 ? (
                          opp.matchedSkills.map((skill, index) => (
                            <Badge
                              key={`${skill}-${index}`}
                              variant="default"
                              className="bg-primary/10 border-primary text-primary font-medium"
                            >
                              {skill}
                            </Badge>
                          ))
                        ) : opp.skills && typeof opp.skills !== "string" ? (
                          (opp.skills as string[])
                            .slice(0, 5)
                            .map((skill, index) => (
                              <Badge
                                key={`${skill}-${index}`}
                                variant="outline"
                              >
                                {skill}
                              </Badge>
                            ))
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No specific skills listed.
                          </p>
                        )}
                        {opp.skills &&
                          typeof opp.skills !== "string" &&
                          (opp.skills as string[]).length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(opp.skills as string[]).length - 5} more
                            </Badge>
                          )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="text-sm font-semibold text-primary">
                    {opp.match && opp.match > 0 && `${opp.match}% Match`}
                  </div>
                  <Button asChild>
                    <Link href={`/opportunities/${opp.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
