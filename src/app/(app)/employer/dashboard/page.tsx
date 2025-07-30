
'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { findAndRankCandidates, FindAndRankCandidatesOutput } from '@/ai/flows/find-and-rank-candidates';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, Loader2, Briefcase, Users, CheckCircle, Trash2, Edit, Eye, UserSearch, ArchiveRestore, Archive, BarChart } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface Posting {
    id: string;
    title: string;
    status: string;
    applicants: number;
    createdAt: {
        toDate: () => Date;
    };
}

type RankedCandidate = FindAndRankCandidatesOutput['candidates'][0];


export default function EmployerDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [postings, setPostings] = useState<Posting[]>([]);
    const [stats, setStats] = useState({ totalPostings: 0, totalApplicants: 0, activeJobs: 0 });
    const [loading, setLoading] = useState(true);
    const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);

    const chartConfig = {
      applicants: {
        label: "Applicants",
        color: "hsl(var(--primary))",
      },
    } satisfies ChartConfig

    const fetchDashboardData = async () => {
        if (user) {
            setLoading(true);
            try {
                // Fetch Postings and Stats
                const postingsQuery = query(
                    collection(db, "opportunities"), 
                    where("employerId", "==", user.uid)
                );
                
                const postingsSnapshot = await getDocs(postingsQuery);
                
                let totalApplicants = 0;
                let activeJobs = 0;

                const postingsData = postingsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    totalApplicants += data.applicants || 0;
                    if (data.status === 'Active') {
                        activeJobs++;
                    }
                    return {
                        id: doc.id,
                        ...data
                    } as Posting;
                });
                
                const sortedPostings = postingsData.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
                setPostings(sortedPostings);

                const chartPostings = sortedPostings.slice(0, 5).map(p => ({
                    title: p.title.length > 15 ? `${p.title.substring(0, 15)}...` : p.title,
                    applicants: p.applicants
                })).reverse();
                setChartData(chartPostings);


                setStats({
                    totalPostings: postingsSnapshot.size,
                    totalApplicants,
                    activeJobs,
                });
                
            } catch (error) {
                console.error("Error fetching postings data:", error);
                 toast({
                    title: "Error",
                    description: "Could not fetch job postings.",
                    variant: "destructive",
                });
            } finally {
               setLoading(false);
            }
        }
    };
    
    const fetchRankedCandidates = async () => {
        if (user) {
            setLoadingCandidates(true);
             try {
                const { candidates } = await findAndRankCandidates({ employerId: user.uid });
                setCandidates(candidates.slice(0,5));
            } catch (error) {
                 console.error("Error fetching ranked candidates:", error);
                 toast({
                    title: "Candidate Search Error",
                    description: "Could not fetch potential candidates.",
                    variant: "destructive",
                });
            } finally {
                setLoadingCandidates(false);
            }
        }
    }


    useEffect(() => {
        if (!authLoading && user) {
            fetchDashboardData();
            fetchRankedCandidates();
        }
    }, [user, authLoading]);

    const handleUpdateStatus = async (postingId: string, status: 'Archived' | 'Active') => {
        try {
            const postingRef = doc(db, "opportunities", postingId);
            await updateDoc(postingRef, { status });
            toast({
                title: `Posting ${status === 'Active' ? 'Restored' : 'Archived'}`,
                description: `The job posting has been successfully ${status === 'Active' ? 'restored' : 'archived'}.`
            });
            fetchDashboardData();
        } catch (error) {
            console.error(`Error updating status for posting ${postingId}:`, error);
            toast({
                title: "Error",
                description: "Could not update the posting status.",
                variant: "destructive"
            });
        }
    }

    const handleDelete = async (postingId: string) => {
         try {
            const postingRef = doc(db, "opportunities", postingId);
            await deleteDoc(postingRef);
            toast({
                title: "Posting Deleted",
                description: "The job posting has been permanently deleted."
            });
            fetchDashboardData();
        } catch (error) {
            console.error(`Error deleting posting ${postingId}:`, error);
            toast({
                title: "Error",
                description: "Could not delete the posting.",
                variant: "destructive"
            });
        }
    }
    
    const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('') || '';


  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
          <p className="text-muted-foreground">Manage your job postings and applicants.</p>
        </div>
        <Button asChild>
          <Link href="/employer/postings/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Posting
          </Link>
        </Button>
      </div>

       {loading ? (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <div className="grid gap-6">
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Postings</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalPostings}</div>
                            <p className="text-xs text-muted-foreground">All job opportunities you have created.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalApplicants}</div>
                            <p className="text-xs text-muted-foreground">Across all your job postings.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeJobs}</div>
                            <p className="text-xs text-muted-foreground">Jobs currently accepting applications.</p>
                        </CardContent>
                    </Card>
                </div>
                 <div className="grid gap-6 md:grid-cols-5">
                    <Card className="md:col-span-3">
                        <CardHeader>
                            <CardTitle>Recent Postings</CardTitle>
                            <CardDescription>Your 5 most recently created job opportunities.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        {postings.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>You haven't posted any jobs yet.</p>
                                <Button variant="link" asChild className="mt-2">
                                    <Link href="/employer/postings/new">
                                        Post your first job
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Applicants</TableHead>
                                <TableHead className="text-right">Posted On</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {postings.slice(0, 5).map((posting) => (
                                <TableRow key={posting.id}>
                                    <TableCell className="font-medium">{posting.title}</TableCell>
                                    <TableCell>
                                    <Badge variant={posting.status === "Active" ? "secondary" : "outline"} className={posting.status === "Active" ? "text-green-600 border-green-200 bg-green-50" : ""}>
                                        {posting.status}
                                    </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{posting.applicants}</TableCell>
                                    <TableCell className="text-right">{format(posting.createdAt.toDate(), 'PPP')}</TableCell>
                                    <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                         <DropdownMenuItem asChild>
                                            <Link href={`/employer/postings/${posting.id}/applicants`}><Users className="mr-2 h-4 w-4" />View Applicants</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/employer/postings/${posting.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit Posting</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                         {posting.status === 'Archived' ? (
                                            <DropdownMenuItem onClick={() => handleUpdateStatus(posting.id, 'Active')}>
                                                <ArchiveRestore className="mr-2 h-4 w-4" />Unarchive
                                            </DropdownMenuItem>
                                         ) : (
                                            <DropdownMenuItem onClick={() => handleUpdateStatus(posting.id, 'Archived')}>
                                               <Archive className="mr-2 h-4 w-4" />Archive
                                            </DropdownMenuItem>
                                         )}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                     <Trash2 className="mr-2 h-4 w-4" />Delete
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete this job posting and all related data.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(posting.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                            </Table>
                        )}
                         {postings.length > 5 && (
                            <div className="mt-4 text-center">
                                <Button variant="link" asChild>
                                    <Link href="/employer/postings">View All Postings</Link>
                                </Button>
                            </div>
                        )}
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Top-Ranked Candidates</CardTitle>
                            <CardDescription>Top candidates based on your active postings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {loadingCandidates ? (
                               <div className="flex justify-center items-center py-10">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                               </div>
                           ): candidates.length > 0 ? (
                            <div className="space-y-4">
                                {candidates.map((candidate) => (
                                    <div key={candidate.uid} className="flex items-start gap-4">
                                         <Link href={`/users/${candidate.uid}`} className="flex items-start gap-4 w-full">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={candidate.photoURL} alt={candidate.displayName} data-ai-hint="profile avatar" />
                                                <AvatarFallback>{getInitials(candidate.displayName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-1 flex-1">
                                                <p className="text-sm font-medium leading-none">{candidate.displayName}</p>
                                                <p className="text-xs text-muted-foreground">{candidate.justification}</p>
                                            </div>
                                            <div className="text-sm font-semibold text-primary">{candidate.matchPercentage}%</div>
                                        </Link>
                                    </div>
                                ))}
                           </div>
                           ) : (
                             <div className="text-center text-muted-foreground py-10">
                                <UserSearch className="h-12 w-12 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold">No candidates found</h3>
                                <p>Post a job to find matched candidates.</p>
                             </div>
                           )}
                        </CardContent>
                    </Card>
                 </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Applicants per Posting</CardTitle>
                        <CardDescription>
                            A look at how many applicants your 5 most recent job postings have received.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {chartData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <RechartsBarChart accessibilityLayer data={chartData}>
                                <XAxis
                                    dataKey="title"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="applicants" fill="var(--color-applicants)" radius={4} />
                            </RechartsBarChart>
                        </ChartContainer>
                        ) : (
                             <div className="text-center py-20 text-muted-foreground">
                                <BarChart className="h-12 w-12 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold">No data to display</h3>
                                <p>Post a job and receive applicants to see analytics.</p>
                             </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}

    

    