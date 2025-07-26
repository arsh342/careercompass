'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState('');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    // Mock data for demonstration
    defaultValues: {
      education: 'B.S. in Computer Science, University of Technology (2020-2024)',
      skills: 'JavaScript, React, Node.js, Python, SQL, Figma',
      interests: 'Open-source projects, UI/UX design, mobile development',
      careerGoals: 'To become a full-stack developer at a mission-driven tech company.',
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    console.log(values);
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been saved successfully.',
    });
  };

  const onGenerateSummary = () => {
    const values = form.getValues();
    const result = profileSchema.safeParse(values);
    if (!result.success) {
        form.trigger(); // show validation errors
        toast({
            title: "Incomplete Profile",
            description: "Please fill out all fields before generating a summary.",
            variant: "destructive",
        })
        return;
    }
    
    startTransition(async () => {
        const { summary } = await generateProfileSummary(values);
        setSummary(summary);
        toast({
            title: "Summary Generated",
            description: "Your AI-powered profile summary is ready."
        })
    });
  };

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
                    <CardDescription>This information will be used to match you with opportunities.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            <Button type="submit">Save Profile</Button>
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
