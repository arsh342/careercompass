
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Heart } from "lucide-react";
import Link from "next/link";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function SavedOpportunitiesPage() {
  const { saved, setSaved, toggleSave } = useSavedOpportunities();
  const { userProfile, role } = useAuth();
  
  useEffect(() => {
    if (role === 'employer') return;
    // Filter out any saved opportunities that are no longer active
    const activeSaved = saved.filter(opp => opp.status !== 'Archived');
    if (activeSaved.length !== saved.length) {
      setSaved(activeSaved);
    }
  }, [saved, setSaved, role]);

  const calculateMatch = (opportunity: any) => {
      if (!userProfile?.skills || role === 'employer') return 0;
      const userSkills = new Set((userProfile.skills || '').split(',').map(s => s.trim().toLowerCase()));
      const requiredSkills = new Set(typeof opportunity.skills === 'string' ? opportunity.skills.split(',').map(s => s.trim().toLowerCase()) : (opportunity.skills || []).map((s: string) => String(s).toLowerCase()));
      if (requiredSkills.size === 0) return 0;
      
      const commonSkills = [...userSkills].filter(skill => requiredSkills.has(skill));
      return Math.round((commonSkills.length / requiredSkills.size) * 100);
  }


  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Saved Opportunities</h1>
        <p className="text-muted-foreground">Your saved jobs and opportunities for future reference.</p>
      </div>

      {saved.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-20">
              <Briefcase className="h-12 w-12 mb-4" />
              <h2 className="text-xl font-semibold">No Saved Opportunities</h2>
              <p>You haven't saved any opportunities yet. Start browsing to find ones you love!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {saved.map((opp) => {
            const skillsArray = typeof opp.skills === 'string' ? opp.skills.split(',').map(s => s.trim()) : (opp.skills || []);
            const matchPercentage = calculateMatch(opp);
            return (
                <Card key={opp.id} className="flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge variant={opp.type === 'Internship' ? 'default' : 'secondary'} className="mb-2">{opp.type}</Badge>
                            <CardTitle className="text-lg">{opp.title}</CardTitle>
                            <CardDescription>{opp.employerName} - {opp.location}</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => toggleSave(opp)}>
                            <Heart className={cn("w-5 h-5", "fill-primary text-primary")} />
                            <span className="sr-only">Unsave opportunity</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground mb-4">Top skills:</p>
                    <div className="flex flex-wrap gap-2">
                        {skillsArray.map((skill, index) => (
                            <Badge key={`${skill}-${index}`} variant="outline">{skill}</Badge>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <div className="text-sm font-semibold text-primary">{matchPercentage > 0 && `${matchPercentage}% Match`}</div>
                        <Button asChild><Link href={`/opportunities/${opp.id}`}>View Details</Link></Button>
                </CardFooter>
                </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
