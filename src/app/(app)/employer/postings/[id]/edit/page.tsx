
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { db, auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const postingSchema = z.object({
  title: z.string().min(1, 'Job title is required.'),
  companyOverview: z.string().min(50, 'Company overview must be at least 50 characters.'),
  description: z.string().min(50, 'Job description must be at least 50 characters.'),
  location: z.string().min(1, 'Location is required.'),
  rolesAndResponsibilities: z.string().min(50, 'Please list the roles and responsibilities.'),
  skills: z.string().min(1, 'Please list required skills.'),
  education: z.string().min(1, 'Education requirements are required.'),
  experience: z.string().min(1, 'Experience requirements are required.'),
  preferredQualifications: z.string().optional(),
  compensationAndBenefits: z.string().min(1, 'Compensation and benefits are required.'),
  applicationInstructions: z.string().min(1, 'Application instructions are required.'),
  legalStatement: z.string().min(1, 'Equal opportunity statement is required.'),
  type: z.enum(['Internship', 'Volunteer', 'Full-time', 'Part-time', 'Contract'], { required_error: 'Please select a job type.'}),
  workingHours: z.string().optional(),
  travelRequirements: z.string().optional(),
});

type PostingFormValues = z.infer<typeof postingSchema>;

export default function EditPostingPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const { id } = params;

  const form = useForm<PostingFormValues>({
    resolver: zodResolver(postingSchema),
    defaultValues: {},
  });

   useEffect(() => {
    const fetchPosting = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'opportunities', id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as PostingFormValues;
          form.reset(data);
        } else {
          toast({ title: "Error", description: "Posting not found.", variant: "destructive" });
          router.push('/employer/dashboard');
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch posting details.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchPosting();
  }, [id, form, router, toast]);

  const onSubmit = async (values: PostingFormValues) => {
    if (!auth.currentUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to update a posting.",
        variant: "destructive"
      });
      return;
    }
    try {
        const postingRef = doc(db, "opportunities", id as string);
        await updateDoc(postingRef, {
            ...values,
            updatedAt: serverTimestamp(),
        });

      toast({
        title: 'Posting Updated',
        description: 'Your job posting has been successfully updated.',
      });
      router.push('/employer/dashboard');
    } catch (error) {
       toast({
        title: 'Error',
        description: 'There was an error updating the posting.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
        <div className="container mx-auto flex justify-center items-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Posting</h1>
        <p className="text-muted-foreground">Update the details below for your job opportunity.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Software Engineer Intern" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="companyOverview"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Overview</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Briefly describe your company, its mission, values, and culture." {...field} rows={4}/>
                          </FormControl>
                           <FormDescription>A brief introduction to your company.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Job Description</FormLabel>
                          <FormControl>
                              <Textarea placeholder="A concise overview of the role’s main purpose, including key responsibilities, tasks, and objectives." {...field} rows={6} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., San Francisco, CA or Remote" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Job Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a job type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Internship">Internship</SelectItem>
                                    <SelectItem value="Volunteer">Volunteer</SelectItem>
                                    <SelectItem value="Full-time">Full-time</SelectItem>
                                    <SelectItem value="Part-time">Part-time</SelectItem>
                                    <SelectItem value="Contract">Contract</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <FormField
                      control={form.control}
                      name="rolesAndResponsibilities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Roles and Responsibilities</FormLabel>
                          <FormControl>
                            <Textarea placeholder="List the primary duties and expectations for the position..." {...field} rows={6} />
                          </FormControl>
                           <FormDescription>Use bullet points for clarity.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Card>
                      <CardHeader>
                        <CardTitle>Qualifications & Requirements</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="skills"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Skills</FormLabel>
                              <FormControl>
                                <Textarea placeholder="List hard and soft skills required for the role." {...field} />
                              </FormControl>
                              <FormDescription>Comma-separated skills (e.g., React, Communication, SQL).</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="education"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Education</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Bachelor's degree in Computer Science or equivalent" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="experience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Experience</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 2+ years of experience in a similar role" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <FormField
                      control={form.control}
                      name="preferredQualifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Qualifications (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="List any 'nice-to-have' skills or experience." {...field} rows={4}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="compensationAndBenefits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compensation and Benefits</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the salary range, health benefits, perks, career growth opportunities..." {...field} rows={4}/>
                          </FormControl>
                          <FormDescription>Providing a salary range is legally required in some locations.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="applicationInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application Instructions</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Explain how applicants should apply, what materials are required (resume, cover letter, etc.), and any deadlines." {...field} rows={4}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                     <FormField
                      control={form.control}
                      name="legalStatement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equal Opportunity and Legal Statements</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Include your company's EEO statement here." {...field} rows={3}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Card>
                       <CardHeader>
                          <CardTitle>Other Details</CardTitle>
                          <CardDescription>Provide any additional relevant information.</CardDescription>
                      </CardHeader>
                       <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <FormField
                            control={form.control}
                            name="workingHours"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Working Hours (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 9am - 5pm EST, Flexible" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="travelRequirements"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Travel Requirements (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Up to 10% domestic travel" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                       </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2 pt-4">
                         <Button variant="outline" asChild>
                            <Link href="/employer/dashboard">Cancel</Link>
                         </Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting ? 'Updating...' : 'Update Posting'}
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
