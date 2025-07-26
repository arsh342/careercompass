
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { addDoc, collection, doc, getDoc, increment, serverTimestamp, updateDoc } from "firebase/firestore"; 
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  employmentHistory: z.string().optional(),
  references: z.string().optional(),
  portfolioLink: z.string().url().optional().or(z.literal('')),
  linkedinLink: z.string().url().optional().or(z.literal('')),
  resume: z.any().optional(),
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
  const { user, userProfile, loading: authLoading } = useAuth();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = params;

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      coverLetter: '',
      employmentHistory: '',
      references: '',
      portfolioLink: '',
      linkedinLink: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
        form.reset({
            ...form.getValues(),
            employmentHistory: userProfile.employmentHistory || '',
            references: userProfile.references || '',
            portfolioLink: userProfile.portfolioLink || '',
            linkedinLink: userProfile.linkedinLink || '',
        });
    }
  }, [userProfile, form]);

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
    if (!user || !userProfile) {
      toast({ title: "Authentication Error", description: "You must be logged in to apply.", variant: "destructive" });
      return;
    }
    
    try {
        let resumeUrl = userProfile.resumeLink || '';
        const resumeFile = values.resume?.[0];

        if (resumeFile) {
            const storageRef = ref(storage, `resumes/${user.uid}/${id}/${resumeFile.name}`);
            const uploadResult = await uploadBytes(storageRef, resumeFile);
            resumeUrl = await getDownloadURL(uploadResult.ref);
        }

      await addDoc(collection(db, "applications"), {
        opportunityId: id,
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        coverLetter: values.coverLetter,
        employmentHistory: values.employmentHistory,
        references: values.references,
        portfolioLink: values.portfolioLink,
        linkedinLink: values.linkedinLink,
        resumeLink: resumeUrl,
        education: userProfile.education,
        skills: userProfile.skills,
        interests: userProfile.interests,
        careerGoals: userProfile.careerGoals,
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
  
  const resumeRef = form.register("resume");

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
            <CardDescription>Submit your application to {opportunity?.employerName}. Your profile information has been pre-filled.</CardDescription>
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
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Supporting Information</CardTitle>
                            <CardDescription>Please review and update your information below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                            control={form.control}
                            name="employmentHistory"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Employment History</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="List your previous roles, companies, and key achievements." {...field} rows={6}/>
                                </FormControl>
                                <FormDescription>Use bullet points for clarity.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                             <FormField
                            control={form.control}
                            name="references"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>References</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Provide contact information for your professional references." {...field} rows={4}/>
                                </FormControl>
                                <FormDescription>e.g., Name, Title, Company, Email, Phone.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                             <FormField
                                control={form.control}
                                name="portfolioLink"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Portfolio Link (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://your-portfolio.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="linkedinLink"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>LinkedIn Profile (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://linkedin.com/in/your-profile" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="resume"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Resume/CV</FormLabel>
                                    <FormControl>
                                        <Input type="file" {...resumeRef} />
                                    </FormControl>
                                    <FormDescription>
                                        {userProfile?.resumeLink ? (
                                            <>
                                            A resume is already saved to your profile. Uploading a new one will override it for this application only.
                                            <Button variant="link" asChild className="p-1 h-auto">
                                                <Link href={userProfile.resumeLink} target="_blank" rel="noopener noreferrer">View Saved Resume</Link>
                                            </Button>
                                            </>
                                        ) : "Upload your resume or CV."}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

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
