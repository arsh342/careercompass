
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Opportunity {
  id: string;
  title: string;
  employerName: string;
  location: string;
  type: string;
  match: number;
  skills: string[] | string;
  matchedSkills?: string[];
  [key: string]: any;
}

export default function DashboardPage() {
  const { saved, toggleSave } = useSavedOpportunities();
  const { userProfile, loading: authLoading } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
    const fetchOpportunities = async () => {
      if (authLoading) return;
      if (!userProfile) {
        setLoading(false);
        return;
      }
      
      try {
        const opportunitiesSnapshot = await getDocs(collection(db, "opportunities"));
        const opportunitiesData = opportunitiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Opportunity));
        
        const userSkills = new Set((userProfile.skills || '').split(',').map(s => s.trim().toLowerCase()));

        if (userSkills.size === 0) {
            setOpportunities([]);
            setLoading(false);
            return;
        }

        const matchedOpportunities = opportunitiesData.map(opp => {
            const requiredSkills = new Set(typeof opp.skills === 'string' ? opp.skills.split(',').map(s => s.trim().toLowerCase()) : (opp.skills || []).map(s => String(s).toLowerCase()));
            const commonSkills = [...userSkills].filter(skill => requiredSkills.has(skill));
            const matchPercentage = requiredSkills.size > 0 
                ? Math.round((commonSkills.length / requiredSkills.size) * 100)
                : 0;
            
            const originalSkillsArray = typeof opp.skills === 'string' ? opp.skills.split(',').map(s => s.trim()) : (opp.skills || []);

            return {
                ...opp,
                skills: originalSkillsArray,
                match: matchPercentage,
                matchedSkills: commonSkills.map(s => {
                    const originalSkill = originalSkillsArray.find(os => os.toLowerCase() === s);
                    return originalSkill || s;
                }),
            };
        }).filter(opp => opp.match > 0)
          .sort((a, b) => b.match - a.match)
          .slice(0, 6);

        setOpportunities(matchedOpportunities);

      } catch (error) {
        console.error("Error fetching opportunities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, [userProfile, authLoading]);
  
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
        <p className="text-muted-foreground">Personalized recommendations based on your profile.</p>
      </div>

      {loading || authLoading ? (
        <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : opportunities.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-10">
                <h3 className="text-lg font-semibold">No recommendations yet.</h3>
              <p>Complete your profile to see matched opportunities.</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/profile">Complete Your Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opp) => {
            const isSaved = saved.some(savedOpp => savedOpp.id === opp.id);
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
                          <Heart className={cn("w-5 h-5", isSaved && "fill-primary text-primary")} />
                          <span className="sr-only">Save opportunity</span>
                        </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                   <p className="text-sm text-muted-foreground mb-4">Based on your skills in:</p>
                    <div className="flex flex-wrap gap-2">
                        {Array.isArray(opp.matchedSkills) && opp.matchedSkills.length > 0 ? (
                           opp.matchedSkills.map((skill, index) => (
                            <Badge key={`${skill}-${index}`} variant="outline">{skill}</Badge>
                           ))
                        ) : (
                           <p className="text-xs text-muted-foreground">No matching skills from profile.</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <div className="text-sm font-semibold text-primary">{opp.match > 0 && `${opp.match}% Match`}</div>
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
