
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { addDoc, collection, doc, getDoc, increment, serverTimestamp, updateDoc } from "firebase/firestore"; 
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

const applicationSchema = z.object({
  coverLetter: z.string().min(10, 'Please provide a brief cover letter.'),
  // We can add resume upload later
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

interface Opportunity {
  title: string;
  employerName: string;
}

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = params;

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      coverLetter: '',
    },
  });

  useEffect(() => {
    const fetchOpportunity = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'opportunities', id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setOpportunity(docSnap.data() as Opportunity);
        } else {
          toast({ title: "Error", description: "Opportunity not found.", variant: "destructive" });
          router.push('/opportunities');
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch opportunity details.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
        fetchOpportunity();
    }
  }, [id, router, toast, authLoading]);

  const onSubmit = async (values: ApplicationFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to apply.", variant: "destructive" });
      return;
    }
    
    try {
      await addDoc(collection(db, "applications"), {
        opportunityId: id,
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        coverLetter: values.coverLetter,
        status: 'Submitted',
        submittedAt: serverTimestamp(),
      });

      // Increment applicant count on the opportunity
      const opportunityRef = doc(db, "opportunities", id as string);
      await updateDoc(opportunityRef, {
        applicants: increment(1)
      });

      toast({
        title: 'Application Submitted',
        description: 'Your application has been sent successfully.',
      });
      router.push(`/opportunities/${id}`);
    } catch (error) {
       toast({
        title: 'Error',
        description: 'There was an error submitting your application.',
        variant: 'destructive',
      });
    }
  };

  if (loading || authLoading) {
    return (
        <div className="container mx-auto flex justify-center items-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild>
            <Link href={`/opportunities/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Opportunity
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Apply for {opportunity?.title}</CardTitle>
            <CardDescription>Submit your application to {opportunity?.employerName}.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <Input value={user?.displayName || ''} disabled />
                        </FormItem>
                         <FormItem>
                            <FormLabel>Email</FormLabel>
                            <Input value={user?.email || ''} disabled />
                        </FormItem>
                    </div>

                    <FormItem>
                        <FormLabel>Resume</FormLabel>
                        <Input type="file" disabled />
                        <FormDescription>Resume upload functionality is not yet implemented.</FormDescription>
                    </FormItem>

                    <FormField
                      control={form.control}
                      name="coverLetter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cover Letter</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Tell us why you're a great fit for this role..." {...field} rows={8} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" asChild>
                            <Link href={`/opportunities/${id}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Application'}
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
