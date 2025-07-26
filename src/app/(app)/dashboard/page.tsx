import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import Link from 'next/link';

const opportunities: any[] = [
  // Data will be fetched from a database in a real application
];

export default function DashboardPage() {
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
        <p className="text-muted-foreground">Personalized recommendations based on your profile.</p>
      </div>

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>No opportunities found.</p>
              <Button variant="link" asChild>
                <Link href="/opportunities">Browse opportunities</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
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
                  <Button asChild><Link href={`/opportunities/${opp.id}`}>View Details</Link></Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
