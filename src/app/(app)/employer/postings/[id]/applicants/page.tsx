
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, UserSearch, Loader2, Send, Check, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { findMatchingCandidates, FindMatchingCandidatesOutput } from '@/ai/flows/find-matching-candidates';
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

type PotentialCandidate = FindMatchingCandidatesOutput['candidates'][0];

interface Applicant {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    photoURL?: string;
    submittedAt: {
        toDate: () => Date;
    };
    status: string;
    [key: string]: any;
}


export default function ApplicantsPage() {
    const params = useParams();
    const { id } = params;
    const { toast } = useToast();
    const [potentialCandidates, setPotentialCandidates] = useState<PotentialCandidate[]>([]);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        if (!id) return;

        const fetchPageData = async () => {
            setLoading(true);
            try {
                // Fetch potential candidates
                const { candidates } = await findMatchingCandidates({ opportunityId: id as string });
                
                // Fetch actual applicants
                const applicantsQuery = query(
                    collection(db, "applications"),
                    where("opportunityId", "==", id),
                    orderBy("submittedAt", "desc")
                );
                const applicantsSnapshot = await getDocs(applicantsQuery);
                const applicantsData = applicantsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Applicant));
                
                // Filter out potential candidates who have already applied
                const applicantUserIds = new Set(applicantsData.map(a => a.userId));
                setPotentialCandidates(candidates.filter(c => !applicantUserIds.has(c.uid)));
                setApplicants(applicantsData);

            } catch (error) {
                console.error("Error fetching page data:", error);
                toast({
                    title: "Error",
                    description: "Could not fetch candidate and applicant data.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPageData();
    }, [id, toast]);

    const handleNotify = () => {
        // This is where you would trigger a backend function to send emails.
        // For now, we'll just show a toast notification as a simulation.
        toast({
            title: "Notifications Simulated",
            description: `If configured, emails would be sent to ${potentialCandidates.length} candidates.`
        })
    }
    
    const handleDismissPotential = (uid: string) => {
        setPotentialCandidates(prev => prev.filter(c => c.uid !== uid));
        toast({ title: "Candidate Dismissed", description: "The potential candidate has been removed from this list."});
    }

    const handleInvitePotential = (uid: string) => {
        setPotentialCandidates(prev => prev.filter(c => c.uid !== uid));
        toast({ title: "Invitation Sent (Simulated)", description: "An invitation to apply has been sent to the candidate."});
    }

    const handleUpdateStatus = async (applicationId: string, status: 'Approved' | 'Rejected') => {
        try {
            const appRef = doc(db, 'applications', applicationId);
            await updateDoc(appRef, { status });
            setApplicants(prev => 
                prev.map(app => app.id === applicationId ? { ...app, status } : app)
            );
            toast({
                title: `Application ${status}`,
                description: `The candidate has been notified of their application status.`
            });
        } catch (error) {
            console.error("Error updating status:", error);
            toast({ title: "Error", description: "Could not update the application status.", variant: "destructive" });
        }
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
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Potential Candidates</CardTitle>
                                <CardDescription>
                                    Users with skills matching this opportunity.
                                </CardDescription>
                            </div>
                             <Button size="sm" onClick={handleNotify} disabled={potentialCandidates.length === 0}>
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
                        ) : potentialCandidates.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <UserSearch className="h-12 w-12 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold">No new matches found</h3>
                                <p>No potential candidates match this role, or they have already applied.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {potentialCandidates.map((candidate) => (
                                    <div key={candidate.uid} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                                        <Link href={`/users/${candidate.uid}`} className="flex items-center gap-4 flex-1">
                                            <Avatar className="h-10 w-10">
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
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleInvitePotential(candidate.uid)}>Invite</Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleDismissPotential(candidate.uid)}>Dismiss</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Applicants</CardTitle>
                        <CardDescription>
                            People who have applied for this posting.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loading ? (
                             <div className="flex justify-center items-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                             </div>
                        ) : applicants.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold">No applicants yet</h3>
                                <p>Check back later to see who has applied for this role.</p>
                            </div>
                        ) : (
                             <div className="space-y-2">
                                {applicants.map((applicant) => (
                                    <div key={applicant.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                                        <Link href={`/users/${applicant.userId}`} className="flex items-center gap-4 flex-1">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={applicant.photoURL} alt={applicant.userName} data-ai-hint="profile avatar" />
                                                <AvatarFallback>{getInitials(applicant.userName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium leading-none">{applicant.userName}</p>
                                                    <Badge variant={applicant.status === 'Approved' ? 'secondary' : applicant.status === 'Rejected' ? 'destructive' : 'outline'} className="capitalize">{applicant.status}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Applied on {format(applicant.submittedAt.toDate(), 'PPP')}
                                                </p>
                                            </div>
                                        </Link>
                                         <div className="flex gap-2">
                                            <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleUpdateStatus(applicant.id, 'Approved')}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleUpdateStatus(applicant.id, 'Rejected')}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
