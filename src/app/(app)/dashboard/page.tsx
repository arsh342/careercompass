
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  match: number;
  skills: string[];
  [key: string]: any;
}

export default function DashboardPage() {
  const { saved, toggleSave } = useSavedOpportunities();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const q = query(
            collection(db, "opportunities"), 
            orderBy("createdAt", "desc"),
            limit(6)
        );
        const querySnapshot = await getDocs(q);
        const opportunitiesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Opportunity));
        
        const opportunitiesWithMockData = opportunitiesData.map(opp => ({
            ...opp,
            match: Math.floor(Math.random() * (98 - 75 + 1) + 75),
            skills: opp.skills || ["React", "Node.js", "TypeScript"]
        }))
        setOpportunities(opportunitiesWithMockData);
      } catch (error) => {
        console.error("Error fetching opportunities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, []);
  
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
        <p className="text-muted-foreground">Personalized recommendations based on your profile.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : opportunities.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-10">
              <p>No opportunities found.</p>
              <Button variant="link" asChild>
                <Link href="/opportunities">Browse opportunities</Link>
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
                        <CardDescription>{opp.company} - {opp.location}</CardDescription>
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
                        {opp.skills.map(skill => (
                            <Badge key={skill} variant="outline">{skill}</Badge>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <div className="text-sm font-semibold text-primary">{opp.match}% Match</div>
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
