import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

const opportunities = [
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

export default function DashboardPage() {
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
        <p className="text-muted-foreground">Personalized recommendations based on your profile.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opp) => (
          <Card key={opp.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                    <Badge variant={opp.type === 'Internship' ? 'default' : 'secondary'} className="mb-2">{opp.type}</Badge>
                    <CardTitle className="text-lg">{opp.title}</CardTitle>
                    <CardDescription>{opp.company} - {opp.location}</CardDescription>
                  </div>
                   <Button variant="ghost" size="icon" className="shrink-0">
                      <Heart className="w-5 h-5" />
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
                <Button>View Details</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
