
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateProfileSummary } from '@/ai/flows/generate-profile-summary';
import { Bot, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  education: z.string().min(1, 'Education is required.'),
  skills: z.string().min(1, 'Skills are required.'),
  interests: z.string().min(1, 'Interests are required.'),
  careerGoals: z.string().min(1, 'Career goals are required.'),
  employmentHistory: z.string().optional(),
  references: z.string().optional(),
  portfolioLink: z.string().url().optional().or(z.literal('')),
  linkedinLink: z.string().url().optional().or(z.literal('')),
  resume: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState('');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      education: '',
      skills: '',
      interests: '',
      careerGoals: '',
      employmentHistory: '',
      references: '',
      portfolioLink: '',
      linkedinLink: '',
    },
  });

  useState(() => {
    if (userProfile) {
        form.reset({
            ...userProfile
        })
    }
  }, [userProfile, form]);
  
  const resumeRef = form.register("resume");

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }
    try {
        let resumeUrl = userProfile?.resumeLink || '';
        const resumeFile = values.resume?.[0];

        if (resumeFile) {
            const formData = new FormData();
            formData.append('file', resumeFile);
            formData.append('userId', user.uid);
            formData.append('fileName', resumeFile.name);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('File upload failed');
            }
            const data = await response.json();
            resumeUrl = data.url;
        }

        await setDoc(doc(db, "users", user.uid), {
            ...values,
            resumeLink: resumeUrl,
        }, { merge: true });

        toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
        });
    } catch (error) {
        toast({
        title: 'Error',
        description: 'There was an error updating your profile.',
        variant: 'destructive',
        });
    }
  };

  const onGenerateSummary = () => {
    const values = form.getValues();
    const result = profileSchema.safeParse(values);
    if (!result.success) {
        const firstErrorField = Object.keys(result.error.format())[0] as keyof ProfileFormValues;

        if (firstErrorField) {
            form.trigger(firstErrorField);
        }
        
        toast({
            title: "Incomplete Profile",
            description: "Please fill out all required fields before generating a summary.",
            variant: "destructive",
        })
        return;
    }
    
    startTransition(async () => {
        const { summary } = await generateProfileSummary({
            education: values.education,
            skills: values.skills,
            interests: values.interests,
            careerGoals: values.careerGoals,
        });
        setSummary(summary);
        toast({
            title: "Summary Generated",
            description: "Your AI-powered profile summary is ready."
        })
    });
  };

  if (authLoading) {
    return (
        <div className="container mx-auto flex justify-center items-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and career preferences.</p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>This information will be used to match you with opportunities and pre-fill applications.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                            control={form.control}
                            name="education"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Education</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., B.S. in Computer Science..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="skills"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Skills</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., React, Python, Project Management..." {...field} />
                                </FormControl>
                                 <FormDescription>Comma-separated skills.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="interests"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Interests</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., UI/UX Design, Open Source, Volunteering..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="careerGoals"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Career Goals</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., Secure a full-time role in software engineering..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
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
                                            Replace your currently saved resume.
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
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Saving...' : 'Save Profile'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-1">
             <Card className="sticky top-20">
                <CardHeader>
                    <CardTitle>AI Profile Summary</CardTitle>
                    <CardDescription>Generate a compelling summary of your profile.</CardDescription>
                </CardHeader>
                <CardContent>
                    {summary && !isPending && (
                        <div className="prose prose-sm max-w-none text-card-foreground">
                            <p>{summary}</p>
                        </div>
                    )}
                    {isPending && (
                       <div className="flex items-center justify-center p-8">
                           <Loader2 className="h-8 w-8 animate-spin text-primary" />
                       </div>
                    )}
                    {!summary && !isPending && (
                        <div className="text-center text-sm text-muted-foreground p-8">
                            <p>Click the button below to generate your AI summary.</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={onGenerateSummary} disabled={isPending} className="w-full">
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Bot className="mr-2 h-4 w-4" />
                        )}
                        {summary ? 'Regenerate Summary' : 'Generate Summary'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
