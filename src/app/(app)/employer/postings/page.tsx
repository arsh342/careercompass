
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from "next/link";
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, Loader2, Edit, Trash2, Users, Archive, ArchiveRestore } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface Posting {
    id: string;
    title: string;
    status: string;
    applicants: number;
    createdAt: {
        toDate: () => Date;
    };
}

export default function EmployerPostingsPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [postings, setPostings] = useState<Posting[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');

    const fetchPostings = async () => {
        if (user) {
            try {
                const q = query(
                    collection(db, "opportunities"), 
                    where("employerId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );
                const querySnapshot = await getDocs(q);
                
                // Get opportunity IDs to fetch application counts
                const opportunityIds = querySnapshot.docs.map((d) => d.id);

                // Fetch all applications for these opportunities
                const applicantCounts: Record<string, number> = {};
                
                if (opportunityIds.length > 0) {
                    // Batch queries for 'in' limitation (max 10)
                    for (let i = 0; i < opportunityIds.length; i += 10) {
                        const batch = opportunityIds.slice(i, i + 10);
                        const applicationsQuery = query(
                            collection(db, "applications"),
                            where("opportunityId", "in", batch)
                        );
                        const applicationsSnapshot = await getDocs(applicationsQuery);
                        applicationsSnapshot.forEach((appDoc) => {
                            const oppId = appDoc.data().opportunityId;
                            applicantCounts[oppId] = (applicantCounts[oppId] || 0) + 1;
                        });
                    }
                }

                const postingsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    applicants: applicantCounts[doc.id] || 0, // Use actual count
                } as Posting));
                setPostings(postingsData);
            } catch (error) {
                console.error("Error fetching postings:", error);
                toast({
                    title: "Error",
                    description: "Could not fetch postings.",
                    variant: "destructive"
                });
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!authLoading) {
            fetchPostings();
        }
    }, [user, authLoading]);
    
    const filteredPostings = useMemo(() => {
        if (statusFilter === 'All') return postings;
        return postings.filter(p => p.status === statusFilter);
    }, [postings, statusFilter]);

    const handleUpdateStatus = async (postingId: string, status: 'Archived' | 'Active') => {
        try {
            const postingRef = doc(db, "opportunities", postingId);
            await updateDoc(postingRef, { status });
            toast({
                title: `Posting ${status === 'Active' ? 'Restored' : 'Archived'}`,
                description: `The job posting has been successfully ${status === 'Active' ? 'restored' : 'archived'}.`
            });
            fetchPostings();
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
            fetchPostings();
        } catch (error) {
            console.error(`Error deleting posting ${postingId}:`, error);
            toast({
                title: "Error",
                description: "Could not delete the posting.",
                variant: "destructive"
            });
        }
    }


  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Postings</h1>
          <p className="text-muted-foreground">Manage your job postings and view applicants.</p>
        </div>
        <Button asChild>
          <Link href="/employer/postings/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Posting
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
             <CardTitle>Your Postings</CardTitle>
             <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
            </Select>
          </div>
           <CardDescription>A list of all job opportunities you have posted.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : filteredPostings.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">
                <p>No postings match the current filter.</p>
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
                {filteredPostings.map((posting) => (
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
        </CardContent>
      </Card>
    </div>
  );
}

    