'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const postingSchema = z.object({
  title: z.string().min(1, 'Job title is required.'),
  location: z.string().min(1, 'Location is required.'),
  type: z.enum(['Internship', 'Volunteer', 'Full-time', 'Part-time'], { required_error: 'Please select a job type.'}),
  description: z.string().min(50, 'Description must be at least 50 characters.'),
});

type PostingFormValues = z.infer<typeof postingSchema>;

export default function NewPostingPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<PostingFormValues>({
    resolver: zodResolver(postingSchema),
    defaultValues: {
      title: '',
      location: '',
      description: '',
    },
  });

  const onSubmit = (values: PostingFormValues) => {
    console.log(values);
    toast({
      title: 'Posting Created',
      description: 'Your new job posting is now live.',
    });
    router.push('/employer/dashboard');
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Posting</h1>
        <p className="text-muted-foreground">Fill out the details below to post a new opportunity.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Software Engineer" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
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
                    </div>
                    <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Job Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            </SelectContent>
                        </Select>
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
                            <Textarea placeholder="Describe the role, responsibilities, and requirements..." {...field} rows={8} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="flex justify-end gap-2">
                         <Button variant="outline" asChild>
                            <Link href="/employer/dashboard">Cancel</Link>
                         </Button>
                        <Button type="submit">Create Posting</Button>
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
