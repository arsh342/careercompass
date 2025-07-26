
'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { collection, query, where, getDocs, orderBy, doc, updateDoc, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, Loader2, Briefcase, Users, CheckCircle, Trash2, Edit, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface Posting {
    id: string;
    title: string;
    status: string;
    applicants: number;
    createdAt: {
        toDate: () => Date;
    };
}

// Mock data for applicants
const mockApplicants = [
    { name: 'John Doe', position: 'Software Engineer Intern', match: 92, avatar: 'https://placehold.co/40x40.png' },
    { name: 'Jane Smith', position: 'Product Manager', match: 88, avatar: 'https://placehold.co/40x40.png' },
    { name: 'Peter Jones', position: 'UX/UI Designer', match: 85, avatar: 'https://placehold.co/40x40.png' },
    { name: 'Emily White', position: 'Data Analyst', match: 95, avatar: 'https://placehold.co/40x40.png' },
];

export default function EmployerDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [postings, setPostings] = useState<Posting[]>([]);
    const [stats, setStats] = useState({ totalPostings: 0, totalApplicants: 0, activeJobs: 0 });
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        if (user) {
            try {
                const postingsQuery = query(
                    collection(db, "opportunities"), 
                    where("employerId", "==", user.uid)
                );
                
                const querySnapshot = await getDocs(postingsQuery);
                
                let totalApplicants = 0;
                let activeJobs = 0;
                const postingsData = querySnapshot.docs.map(doc => {
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

                setPostings(postingsData.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()));
                setStats({
                    totalPostings: querySnapshot.size,
                    totalApplicants,
                    activeJobs,
                });

            } catch (error) {
                console.error("Error fetching postings:", error);
                 toast({
                    title: "Error",
                    description: "Could not fetch dashboard data.",
                    variant: "destructive",
                });
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!authLoading) {
            fetchDashboardData();
        }
    }, [user, authLoading]);

    const handleArchive = async (postingId: string) => {
        try {
            const postingRef = doc(db, "opportunities", postingId);
            await updateDoc(postingRef, {
                status: "Archived"
            });
            toast({
                title: "Posting Archived",
                description: "The job posting has been successfully archived."
            });
            // Refetch data to update UI
            fetchDashboardData();
        } catch (error) {
            console.error("Error archiving posting:", error);
            toast({
                title: "Error",
                description: "Could not archive the posting.",
                variant: "destructive"
            });
        }
    }


  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employer Dashboard</h1>
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
                 <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Postings</CardTitle>
                            <CardDescription>A list of all job opportunities you have posted.</CardDescription>
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
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                     <Trash2 className="mr-2 h-4 w-4" />Archive
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will archive the job posting. Applicants will no longer be able to see it.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleArchive(posting.id)} className="bg-destructive hover:bg-destructive/90">Archive</AlertDialogAction>
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Applicants</CardTitle>
                            <CardDescription>Top candidates who recently applied.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                                {mockApplicants.map((applicant, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={applicant.avatar} alt={applicant.name} data-ai-hint="profile avatar" />
                                            <AvatarFallback>{applicant.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-1 flex-1">
                                            <p className="text-sm font-medium leading-none">{applicant.name}</p>
                                            <p className="text-sm text-muted-foreground">{applicant.position}</p>
                                        </div>
                                        <div className="text-sm font-semibold">{applicant.match}% Match</div>
                                    </div>
                                ))}
                           </div>
                           {mockApplicants.length === 0 && (
                             <div className="text-center text-muted-foreground py-10">
                                <p>No recent applicants.</p>
                             </div>
                           )}
                        </CardContent>
                    </Card>
                 </div>
            </div>
        )}
    </div>
  );
}
