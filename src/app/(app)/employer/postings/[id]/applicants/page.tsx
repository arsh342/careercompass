
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ApplicantsPage() {
    const params = useParams();
    const { id } = params;

    return (
        <div className="container mx-auto">
             <div className="mb-6">
                <Button variant="ghost" asChild>
                    <Link href="/employer/postings">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Postings
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Applicants</CardTitle>
                    <CardDescription>
                        Showing applicants for posting ID: {id}
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
        </div>
    )
}
