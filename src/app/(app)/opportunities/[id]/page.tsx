'use client';

import { useState, useTransition } from 'react';
import { analyzeOpportunityDescription } from '@/ai/flows/analyze-opportunity-description';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bot, Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';

const opportunity = {
  id: 1,
  title: 'Software Engineering Intern',
  company: 'Innovatech Solutions',
  location: 'Remote',
  type: 'Internship',
  description: `Innovatech Solutions is seeking a motivated Software Engineering Intern to join our dynamic team. In this role, you will work on our flagship product, contributing to both front-end and back-end development. Key responsibilities include developing new features with React and TypeScript, writing and maintaining APIs with Node.js, and collaborating with our design team to implement user-friendly interfaces. The ideal candidate has a solid understanding of web development principles, experience with modern JavaScript frameworks, and a passion for creating high-quality software. Experience with databases like PostgreSQL is a plus.`
};

type Analysis = {
  skills: string[];
  fitAnalysis: string;
} | null;

export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [analysis, setAnalysis] = useState<Analysis>(null);

  const onAnalyze = () => {
    startTransition(async () => {
      try {
        const result = await analyzeOpportunityDescription({ description: opportunity.description });
        setAnalysis(result);
        toast({
          title: "Analysis Complete",
          description: "AI analysis of the opportunity is ready."
        });
      } catch (error) {
        console.error("Analysis failed:", error);
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the opportunity at this time.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild>
            <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Opportunities
            </Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <Badge variant={opportunity.type === 'Internship' ? 'default' : 'secondary'} className="w-fit mb-2">{opportunity.type}</Badge>
                    <CardTitle className="text-2xl">{opportunity.title}</CardTitle>
                    <CardDescription>{opportunity.company} - {opportunity.location}</CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold mb-2">Job Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.description}</p>
                </CardContent>
                <CardFooter className="gap-2">
                    <Button className="w-full" size="lg">Apply Now</Button>
                    <Button variant="outline" size="lg">
                        <Heart className="mr-2 h-4 w-4" /> Save
                    </Button>
                </CardFooter>
            </Card>
        </div>
        <div className="md:col-span-1">
             <Card className="sticky top-20">
                <CardHeader>
                    <CardTitle>AI Opportunity Analysis</CardTitle>
                    <CardDescription>See how this opportunity aligns with you.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isPending ? (
                       <div className="flex items-center justify-center p-8">
                           <Loader2 className="h-8 w-8 animate-spin text-primary" />
                       </div>
                    ) : analysis ? (
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Required Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.skills.map(skill => (
                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                    ))}
                                </div>
                            </div>
                            <Separator />
                             <div>
                                <h4 className="font-semibold text-sm mb-2">Fit Analysis</h4>
                                <p className="text-sm text-muted-foreground">{analysis.fitAnalysis}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-sm text-muted-foreground p-8">
                            <p>Click the button below to get an AI-powered analysis of this job description.</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={onAnalyze} disabled={isPending} className="w-full">
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Bot className="mr-2 h-4 w-4" />
                        )}
                        {analysis ? 'Re-analyze' : 'Analyze Opportunity'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
