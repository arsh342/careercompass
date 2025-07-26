'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { cn } from "@/lib/utils";

const opportunities: any[] = [
  {
    id: 1,
    title: "Software Engineering Intern",
    company: "Innovatech Solutions",
    location: "Remote",
    type: "Internship",
    match: 95,
    skills: ["React", "Node.js", "TypeScript"],
  },
  {
    id: 2,
    title: "Product Design Volunteer",
    company: "Creative Minds Foundation",
    location: "New York, NY",
    type: "Volunteer",
    match: 88,
    skills: ["Figma", "UI/UX", "User Research"],
  },
  {
    id: 3,
    title: "Data Science Intern",
    company: "DataDriven Inc.",
    location: "San Francisco, CA",
    type: "Internship",
    match: 82,
    skills: ["Python", "Pandas", "SQL"],
  },
   {
    id: 4,
    title: "Marketing & Comms Intern",
    company: "Growth Co.",
    location: "Remote",
    type: "Internship",
    match: 76,
    skills: ["Social Media", "Content Creation", "SEO"],
  },
];

export default function OpportunitiesPage() {
  const { saved, toggleSave } = useSavedOpportunities();
  
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Browse Opportunities</h1>
        <p className="text-muted-foreground">Find your next great opportunity.</p>
      </div>

       {opportunities.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-10">
              <p>No opportunities available at the moment. Please check back later.</p>
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
                    <p className="text-sm text-muted-foreground mb-4">Top skills:</p>
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
