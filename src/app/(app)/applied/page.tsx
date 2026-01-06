
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Briefcase } from "lucide-react";
import Link from "next/link";
import { format } from 'date-fns';
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

interface Application {
  id: string;
  opportunityId: string;
  status: string;
  submittedAt: {
    toDate: () => Date;
  };
  opportunityDetails?: {
    title: string;
    employerName: string;
    location: string;
  }
}

export default function AppliedPage() {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    };

    const fetchApplications = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "applications"),
          where("userId", "==", user.uid),
          orderBy("submittedAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const applicationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Application));

        // Fetch opportunity details for each application
        const applicationsWithDetails = await Promise.all(
          applicationsData.map(async (app) => {
            const oppDocRef = doc(db, 'opportunities', app.opportunityId);
            const oppDocSnap = await getDoc(oppDocRef);
            if (oppDocSnap.exists()) {
              app.opportunityDetails = oppDocSnap.data() as Application['opportunityDetails'];
            }
            return app;
          })
        );
        
        setApplications(applicationsWithDetails);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user, authLoading]);
  
  const getStatusVariant = (status: string) => {
      switch (status.toLowerCase()) {
          case 'submitted':
              return 'secondary';
          case 'under review':
              return 'default';
          case 'rejected':
              return 'destructive';
          case 'hired':
              return 'default'; // Success variant would be ideal here
          default:
              return 'outline';
      }
  }


  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Applications</h1>
        <p className="text-muted-foreground">Track the status of your job applications.</p>
      </div>

       {loading || authLoading ? (
         <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
       ) : applications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-20">
               <Briefcase className="h-12 w-12 mb-4" />
               <h2 className="text-xl font-semibold">No Applications Yet</h2>
              <p>You haven't applied to any opportunities yet. Start browsing to find your next role!</p>
               <Button asChild variant="link" className="mt-2">
                    <Link href="/opportunities">Browse Opportunities</Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
            {applications.map((app) => (
                <Card key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <CardHeader>
                        <CardTitle>{app.opportunityDetails?.title || 'Opportunity Title'}</CardTitle>
                        <CardDescription>{app.opportunityDetails?.employerName} - {app.opportunityDetails?.location}</CardDescription>
                         <p className="text-xs text-muted-foreground pt-2">
                           Applied on {format(app.submittedAt.toDate(), 'PPP')}
                        </p>
                    </CardHeader>
                    <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 md:p-6">
                        <Badge variant={getStatusVariant(app.status)}>{app.status}</Badge>
                        <Link href={`/opportunities/${app.opportunityId}`}>
                            <InteractiveHoverButton text="View Posting" className="w-auto px-4" />
                        </Link>
                    </CardFooter>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}

