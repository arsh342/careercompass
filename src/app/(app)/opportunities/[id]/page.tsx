
'use client';

import { useState, useTransition, useEffect } from 'react';
import { analyzeOpportunityDescription } from '@/ai/flows/analyze-opportunity-description';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bot, Heart, Loader2, Building, Briefcase, BookOpen, Star, FileText, Clock, Plane, Info, University, Award } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSavedOpportunities } from '@/context/SavedOpportunitiesContext';
import { cn } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Opportunity {
  id: string;
  title: string;
  employerName: string;
  location: string;
  type: string;
  companyOverview: string;
  description: string;
  rolesAndResponsibilities: string;
  skills: string;
  education: string;
  experience: string;
  preferredQualifications?: string;
  compensationAndBenefits: string;
  applicationInstructions: string;
  legalStatement: string;
  workingHours?: string;
  travelRequirements?: string;
  [key: string]: any;
}

type Analysis = {
  skills: string[];
  fitAnalysis: string;
} | null;

export default function OpportunityDetailPage() {
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [analysis, setAnalysis] = useState<Analysis>(null);
  const { saved, toggleSave } = useSavedOpportunities();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOpportunity = async () => {
      try {
        const docRef = doc(db, 'opportunities', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOpportunity({ id: docSnap.id, ...docSnap.data() } as Opportunity);
        } else {
          toast({ title: "Error", description: "Opportunity not found.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch opportunity details.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunity();
  }, [id, toast]);
  
  const isSaved = opportunity ? saved.some(savedOpp => savedOpp.id === opportunity.id) : false;

  const onAnalyze = () => {
    if (!opportunity) return;
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

  if (loading) {
    return (
        <div className="container mx-auto flex justify-center items-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  if (!opportunity) {
     return (
        <div className="container mx-auto text-center py-20">
            <h1 className="text-2xl font-bold">Opportunity not found</h1>
            <p className="text-muted-foreground">The opportunity you are looking for does not exist.</p>
             <Button variant="link" asChild className="mt-4">
                <Link href="/opportunities">Back to Opportunities</Link>
             </Button>
        </div>
    )
  }

  const renderSection = (title: string, content: string | undefined, icon: React.ElementType) => {
    if (!content) return null;
    const Icon = icon;
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap break-words">{content}</div>
      </div>
    );
  };
  
  const skillsArray = typeof opportunity.skills === 'string' ? opportunity.skills.split(',').map(s => s.trim()) : [];

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild>
            <Link href="/opportunities">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Opportunities
            </Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <Badge variant={opportunity.type === 'Internship' ? 'default' : 'secondary'} className="w-fit mb-2">{opportunity.type}</Badge>
                    <CardTitle className="text-3xl font-bold">{opportunity.title}</CardTitle>
                    <CardDescription className="text-base">{opportunity.employerName} - {opportunity.location}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {renderSection("Company Overview", opportunity.companyOverview, Building)}
                  <Separator/>
                  {renderSection("Job Description", opportunity.description, FileText)}
                  <Separator/>
                  {renderSection("Roles and Responsibilities", opportunity.rolesAndResponsibilities, Briefcase)}
                  <Separator/>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Qualifications</h3>
                    </div>
                     <div className="prose prose-sm max-w-none text-muted-foreground space-y-4 whitespace-pre-wrap break-words">
                        <div>
                          <h4 className="font-semibold text-sm mb-1 text-foreground">Experience</h4>
                          <p>{opportunity.experience}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1 text-foreground">Education</h4>
                          <p>{opportunity.education}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2 text-foreground">Required Skills</h4>
                          <div className="flex flex-wrap gap-2">
                              {skillsArray.map(skill => (
                                  <Badge key={skill} variant="secondary">{skill}</Badge>
                              ))}
                          </div>
                        </div>
                     </div>
                  </div>
                  <Separator/>
                  {renderSection("Preferred Qualifications", opportunity.preferredQualifications, Star)}
                  <Separator/>
                  {renderSection("Compensation and Benefits", opportunity.compensationAndBenefits, Star)}
                   <Separator/>
                  {renderSection("Application Instructions", opportunity.applicationInstructions, BookOpen)}
                  <Separator/>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderSection("Working Hours", opportunity.workingHours, Clock)}
                        {renderSection("Travel Requirements", opportunity.travelRequirements, Plane)}
                   </div>
                   <Separator/>
                   {renderSection("Equal Opportunity Statement", opportunity.legalStatement, Info)}
                </CardContent>
                <CardFooter className="gap-2">
                    <Button className="w-full" size="lg">Apply Now</Button>
                    <Button variant="outline" size="lg" onClick={() => opportunity && toggleSave(opportunity)}>
                        <Heart className={cn("mr-2 h-4 w-4", isSaved && "fill-primary text-primary")} /> {isSaved ? 'Saved' : 'Save'}
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
