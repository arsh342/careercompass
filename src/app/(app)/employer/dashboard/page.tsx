'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Posting {
    id: string;
    title: string;
    status: string;
    applicants: number;
    createdAt: {
        toDate: () => Date;
    };
}

export default function EmployerDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [postings, setPostings] = useState<Posting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPostings = async () => {
            if (user) {
                try {
                    const q = query(
                        collection(db, "opportunities"), 
                        where("employerId", "==", user.uid),
                        orderBy("createdAt", "desc")
                    );
                    const querySnapshot = await getDocs(q);
                    const postingsData = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Posting));
                    setPostings(postingsData);
                } catch (error) {
                    console.error("Error fetching postings:", error);
                }
            }
            setLoading(false);
        };

        if (!authLoading) {
            fetchPostings();
        }
    }, [user, authLoading]);


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

      <Card>
        <CardHeader>
          <CardTitle>Your Postings</CardTitle>
          <CardDescription>A list of all job opportunities you have posted.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : postings.length === 0 ? (
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
                {postings.map((posting) => (
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
                          <DropdownMenuItem>View Applicants</DropdownMenuItem>
                          <DropdownMenuItem>Edit Posting</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
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
