"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
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
import { Loader2, Edit } from "lucide-react";
import { OpportunityCard } from "@/components/ui/opportunity-card";
import { PricingSection } from "@/components/ui/pricing-section";

// CareerCompass Pricing Plans
const PAYMENT_FREQUENCIES = ["monthly", "yearly"];

const JOB_SEEKER_TIERS = [
  {
    name: "Free",
    price: {
      monthly: "Free",
      yearly: "Free",
    },
    description: "Get started with job hunting",
    features: [
      "Browse all job listings",
      "5 applications per month",
      "Save up to 10 opportunities",
      "Basic profile",
      "Email notifications",
    ],
    cta: "Current Plan",
  },
  {
    name: "Pro",
    price: {
      monthly: 9.99,
      yearly: 6.99,
    },
    description: "For serious job seekers",
    features: [
      "Unlimited applications",
      "Unlimited saved jobs",
      "Profile boost & visibility",
      "Application analytics",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Premium",
    price: {
      monthly: 19.99,
      yearly: 14.99,
    },
    description: "Maximum career advantage",
    features: [
      "Everything in Pro",
      "AI resume review",
      "Skill gap analysis",
      "Salary insights",
      "1:1 career coaching",
    ],
    cta: "Go Premium",
    highlighted: true,
  },
];

interface Opportunity {
  id: string;
  title: string;
  employerName: string;
  location: string;
  type: string;
  match?: number;
  skills: string[] | string;
  matchedSkills?: string[];
  description?: string;
  compensationAndBenefits?: string;
  experience?: string;
  workingHours?: string;
  education?: string;
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
          const recentOpps = opportunitiesData
            .sort(
              (a, b) =>
                (b.createdAt?.toDate()?.getTime() || 0) -
                (a.createdAt?.toDate()?.getTime() || 0)
            )
            .slice(0, 6)
            .map((opp) => ({ ...opp, match: 0, matchedSkills: [] }));
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
              <OpportunityCard
                key={opp.id}
                id={opp.id}
                title={opp.title}
                employerName={opp.employerName}
                location={opp.location}
                type={opp.type}
                description={opp.description}
                skills={opp.skills}
                matchedSkills={opp.matchedSkills}
                match={opp.match}
                compensationAndBenefits={opp.compensationAndBenefits}
                experience={opp.experience}
                workingHours={opp.workingHours}
                education={opp.education}
                createdAt={opp.createdAt}
                isSaved={isSaved}
                onToggleSave={() => toggleSave(opp)}
              />
            );
          })}
        </div>
      )}

      {/* Pricing Section */}
      {role === "employee" && !authLoading && (
        <div className="mt-12 border-t pt-8">
          <PricingSection
            title="Upgrade Your Job Search"
            subtitle="Get more applications, better visibility, and career coaching with our premium plans"
            frequencies={PAYMENT_FREQUENCIES}
            tiers={JOB_SEEKER_TIERS}
          />
        </div>
      )}
    </div>
  );
}
