
"use client";

'use client';

import { useState, useTransition, useEffect, useRef } from 'react';

import { ComprehensiveATSScorer } from '@/lib/comprehensiveAtsScorer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseResume } from '@/ai/flows/parse-resume';





import { analyzeOpportunityDescription } from '@/ai/flows/analyze-opportunity-description';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bot, Heart, Loader2, Building, Briefcase, BookOpen, Star, FileText, Clock, Plane, Info, Award } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSavedOpportunities } from '@/context/SavedOpportunitiesContext';
import { cn } from '@/lib/utils';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';

interface Opportunity {
  id: string;
  title: string;
  employerId: string;
  employerName: string;
  employerPhotoURL?: string;
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
  // ATS Score Checker hooks must be inside the component
  const [atsResumeText, setAtsResumeText] = useState('');
  const [atsResumeFile, setAtsResumeFile] = useState<File|null>(null);
  const [atsSuggestions, setAtsSuggestions] = useState<string>('');
  const [atsScore, setAtsScore] = useState<number|null>(null);
  const [atsConfidence, setAtsConfidence] = useState<'High'|'Medium'|'Low'|null>(null);
  const [atsCategoryScores, setAtsCategoryScores] = useState<any>(null);
  const [atsMatched, setAtsMatched] = useState<any>(null);
  const [atsMissing, setAtsMissing] = useState<any>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);




  // ATS Score calculation with AI resume parsing and advanced scoring
  const handleAtsScore = async () => {
    setAtsLoading(true);
    setAtsSuggestions('');
    setAtsConfidence(null);
    setAtsCategoryScores(null);
    setAtsMatched(null);
    setAtsMissing(null);
    let resumeText = atsResumeText;
    if (atsResumeFile) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const fileText = e.target?.result as string;
          let parsedText = fileText;
          try {
            const parsed = await parseResume({ resumeDataUri: fileText });
            parsedText = [parsed.education, parsed.skills, parsed.interests, parsed.careerGoals, parsed.employmentHistory]
              .filter(Boolean)
              .join(' ');
          } catch {}
          scoreAndSuggest(parsedText);
        };
        reader.readAsText(atsResumeFile);
        return;
      } catch (err) {
        setAtsLoading(false);
        setAtsSuggestions('Could not read resume file.');
        return;
      }
    } else {
      scoreAndSuggest(resumeText);
    }
  };

  function scoreAndSuggest(resumeText: string) {
    if (!resumeText.trim() || !jobDesc.trim()) {
      setAtsScore(null);
      setAtsSuggestions('');
      setAtsConfidence(null);
      setAtsCategoryScores(null);
      setAtsMatched(null);
      setAtsMissing(null);
      setAtsLoading(false);
      return;
    }
    const scorer = new ComprehensiveATSScorer();
    const result = scorer.calculateComprehensiveScore(resumeText, jobDesc);
    setAtsScore(result.overallScore);
    setAtsConfidence(result.confidenceLevel);
    setAtsCategoryScores(result.categoryScores);
    setAtsMatched(result.matched);
    setAtsMissing(result.missing);
    setAtsSuggestions(result.suggestions.join('\n'));
    setAtsLoading(false);
  }
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [analysis, setAnalysis] = useState<Analysis>(null);
  const { saved, toggleSave } = useSavedOpportunities();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const [hasApplied, setHasApplied] = useState(false);


  // Compose job description from opportunity fields using state
  const [jobDesc, setJobDesc] = useState('');
  useEffect(() => {
    if (opportunity) {
      setJobDesc([
        opportunity.title,
        opportunity.description,
        opportunity.rolesAndResponsibilities,
        opportunity.skills,
        opportunity.education,
        opportunity.experience
      ].filter(Boolean).join(' '));
    } else {
      setJobDesc('');
    }
  }, [opportunity]);

  useEffect(() => {
    if (!id || !user) return;

    const checkApplicationStatus = async () => {
        const q = query(
            collection(db, "applications"),
            where("userId", "==", user.uid),
            where("opportunityId", "==", id)
        );
        const querySnapshot = await getDocs(q);
        setHasApplied(!querySnapshot.empty);
    }

    const fetchOpportunity = async () => {
      setLoading(true);
      try {
        const oppDocRef = doc(db, 'opportunities', id as string);
        const oppDocSnap = await getDoc(oppDocRef);

        if (oppDocSnap.exists()) {
           setOpportunity({
            id: oppDocSnap.id,
            ...oppDocSnap.data(),
          } as Opportunity);

        } else {
          toast({ title: "Error", description: "Opportunity not found.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error fetching details:", error)
        toast({ title: "Error", description: "Failed to fetch opportunity details.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunity();
    checkApplicationStatus();
  }, [id, toast, user]);
  
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

  if (loading || authLoading) {
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
      <div key={title}>
        <div className="flex items-center gap-2 mb-2">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap break-words">{content}</div>
      </div>
    );
  };
  
  const skillsArray = typeof opportunity.skills === 'string' ? opportunity.skills.split(',').map(s => s.trim()) : [];
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('') : '';

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
                    <div className="flex items-center gap-4 pt-2">
                       <Link href={`/users/${opportunity.employerId}`}>
                        <Avatar>
                            <AvatarImage src={opportunity.employerPhotoURL} alt={opportunity.employerName} data-ai-hint="company logo" />
                            <AvatarFallback>{getInitials(opportunity.employerName)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className='flex flex-col'>
                         <CardDescription className="text-base font-medium text-foreground">
                            <Link href={`/users/${opportunity.employerId}`}>{opportunity.employerName}</Link>
                         </CardDescription>
                         <CardDescription className="text-base">{opportunity.location}</CardDescription>
                      </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {renderSection("Company Overview", opportunity.companyOverview, Building)}
                  <Separator/>
                  {renderSection("Job Description", opportunity.description, FileText)}
                  <Separator/>
                  {renderSection("Roles and Responsibilities", opportunity.rolesAndResponsibilities, Briefcase)}
                  <Separator/>
                  <div key="qualifications">
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
                              {skillsArray.map((skill, index) => (
                                  <Badge key={`${skill}-${index}`} variant="secondary">{skill}</Badge>
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
                    <Button asChild className="w-full" size="lg" disabled={hasApplied}>
                      {hasApplied ? <span>Applied</span> : <Link href={`/opportunities/${opportunity.id}/apply`}>Apply Now</Link>}
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => opportunity && toggleSave(opportunity)}>
                        <Heart className={cn("mr-2 h-4 w-4", isSaved && "fill-primary text-primary")} /> {isSaved ? 'Saved' : 'Save'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
        <div className="md:col-span-1 space-y-8">
            <Card>
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
                                    {analysis.skills.map((skill, index) => (
                                        <Badge key={`${skill}-${index}`} variant="secondary">{skill}</Badge>
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

            {/* ATS Score Checker Section */}
            <Card className="sticky top-20">
                <CardHeader>
                    <CardTitle>ATS Score Checker</CardTitle>
                    <CardDescription>
                        Check how well your resume matches this job. Upload your resume or paste your resume text to get an ATS (Applicant Tracking System) score.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <Input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            ref={fileInputRef}
                            onChange={e => {
                                const file = e.target.files?.[0] || null;
                                setAtsResumeFile(file);
                                setAtsResumeText('');
                            }}
                        />
                        <Textarea
                            placeholder="Or paste your resume text here..."
                            rows={5}
                            value={atsResumeText}
                            onChange={e => setAtsResumeText(e.target.value)}
                        />
                        <Button onClick={handleAtsScore} disabled={atsLoading || (!atsResumeText && !atsResumeFile)}>
                            {atsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Check ATS Score
                        </Button>
                        {atsScore !== null && (
                            <div className="text-center mt-2">
                                <span className="font-semibold">ATS Score: </span>
                                <span className="text-primary text-lg">{atsScore}%</span>
                                {atsConfidence && (
                                    <span className="ml-2 text-xs text-muted-foreground">({atsConfidence} match)</span>
                                )}
                            </div>
                        )}
                        {atsCategoryScores && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                <b>Category Breakdown:</b>
                                <ul className="ml-2">
                                    {Object.entries(atsCategoryScores).map(([cat, val]) => (
                                        <li key={cat}>{cat}: {Math.round(val as number)}%</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {atsMatched && (
                            <div className="mt-2 text-xs text-green-700">
                                <b>Matched:</b>
                                <ul className="ml-2">
                                    {Object.entries(atsMatched).map(([cat, arr]) =>
                                        Array.isArray(arr) && arr.length > 0 ? (
                                            <li key={cat}>{cat}: {arr.slice(0, 8).join(', ')}{arr.length > 8 ? '...' : ''}</li>
                                        ) : null
                                    )}
                                </ul>
                            </div>
                        )}
                        {atsMissing && (
                            <div className="mt-2 text-xs text-red-700">
                                <b>Missing:</b>
                                <ul className="ml-2">
                                    {Object.entries(atsMissing).map(([cat, arr]) =>
                                        Array.isArray(arr) && arr.length > 0 ? (
                                            <li key={cat}>{cat}: {arr.slice(0, 8).join(', ')}{arr.length > 8 ? '...' : ''}</li>
                                        ) : null
                                    )}
                                </ul>
                            </div>
                        )}
                        {atsSuggestions && (
                            <div className="text-left text-sm text-muted-foreground mt-2 whitespace-pre-line">
                                <div><b>Suggestions:</b></div>
                                <div dangerouslySetInnerHTML={{ __html: atsSuggestions.replace(/\n/g, '<br/>') }} />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    