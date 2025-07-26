
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function SavedOpportunitiesPage() {
  const savedOpportunities: any[] = []; // In a real app, fetch this from user data

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Saved Opportunities</h1>
        <p className="text-muted-foreground">Your saved jobs and opportunities for future reference.</p>
      </div>

      {savedOpportunities.length === 0 ? (
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
          {/* Map over saved opportunities here */}
        </div>
      )}
    </div>
  );
}
