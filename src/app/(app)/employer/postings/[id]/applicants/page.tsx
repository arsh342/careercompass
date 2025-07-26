
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, UserSearch, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { findMatchingCandidates, FindMatchingCandidatesOutput } from '@/ai/flows/find-matching-candidates';
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Candidate = FindMatchingCandidatesOutput['candidates'][0];

export default function ApplicantsPage() {
    const params = useParams();
    const { id } = params;
    const { toast } = useToast();
    const [matchingCandidates, setMatchingCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        if (!id) return;

        const fetchMatches = async () => {
            setLoading(true);
            try {
                const { candidates } = await findMatchingCandidates({ opportunityId: id as string });
                setMatchingCandidates(candidates);
            } catch (error) {
                console.error("Error finding matching candidates:", error);
                toast({
                    title: "Error",
                    description: "Could not fetch potential candidates.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [id, toast]);

    const handleNotify = () => {
        // This is where you would trigger a backend function to send emails.
        // For now, we'll just show a toast notification as a simulation.
        toast({
            title: "Notifications Simulated",
            description: `If configured, emails would be sent to ${matchingCandidates.length} candidates.`
        })
    }
    
    const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('') || '';

    return (
        <div className="container mx-auto">
             <div className="mb-6">
                <Button variant="ghost" asChild>
                    <Link href="/employer/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Applicants</CardTitle>
                        <CardDescription>
                            People who have applied for this posting.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-20 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">No applicants yet</h3>
                            <p>Check back later to see who has applied for this role.</p>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Potential Candidates</CardTitle>
                                <CardDescription>
                                    Users with skills matching this opportunity.
                                </CardDescription>
                            </div>
                            <Button size="sm" onClick={handleNotify} disabled={matchingCandidates.length === 0}>
                                <Send className="mr-2 h-4 w-4" />
                                Notify All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="flex justify-center items-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                             </div>
                        ) : matchingCandidates.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <UserSearch className="h-12 w-12 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold">No matches found</h3>
                                <p>No candidates currently match the required skills for this posting.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {matchingCandidates.map((candidate) => (
                                    <Link key={candidate.uid} href={`/users/${candidate.uid}`} className="flex items-center gap-4 p-2 rounded-md hover:bg-accent">
                                        <Avatar className="h-10 w-10">
                                            {/* Assuming candidates have a photoURL, otherwise fallback */}
                                            <AvatarImage src={(candidate as any).photoURL} alt={candidate.displayName} data-ai-hint="profile avatar" />
                                            <AvatarFallback>{getInitials(candidate.displayName)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium leading-none">{candidate.displayName}</p>
                                             <div className="flex flex-wrap gap-1 mt-1">
                                                {candidate.matchingSkills.map(skill => (
                                                    <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
