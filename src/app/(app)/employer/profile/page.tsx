'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  contactNumber: z.string().optional(),
  supportEmail: z.string().email().optional().or(z.literal('')),
  companyOverview: z.string().min(1, 'Company overview is required.'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EmployerProfilePage() {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      companyName: '',
      contactNumber: '',
      supportEmail: '',
      companyOverview: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
        form.reset({
            companyName: userProfile.companyName || userProfile.displayName || '',
            contactNumber: userProfile.contactNumber || '',
            supportEmail: userProfile.supportEmail || '',
            companyOverview: userProfile.companyOverview || '',
        })
    }
  }, [userProfile, form]);
  

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }
    try {
        if(user.displayName !== values.companyName) {
            await updateProfile(user, { displayName: values.companyName });
        }

        await setDoc(doc(db, "users", user.uid), {
            ...userProfile,
            ...values,
            displayName: values.companyName,
        }, { merge: true });

        toast({
            title: 'Profile Updated',
            description: 'Your company profile has been saved successfully.',
        });
    } catch (error) {
        toast({
            title: 'Error',
            description: 'There was an error updating your profile.',
            variant: 'destructive',
        });
    }
  };


   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.uid);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      
      await updateProfile(user, { photoURL: url });
      await setDoc(doc(db, "users", user.uid), { photoURL: url }, { merge: true });

      toast({
        title: 'Profile Picture Updated',
        description: 'Your new picture has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: 'Failed to upload profile picture.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };


  if (authLoading) {
    return (
        <div className="container mx-auto flex justify-center items-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };


  return (
    <div className="container mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-muted-foreground">Manage your company's public information.</p>
      </div>
       
        <Card>
            <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>This information will be displayed on your job postings.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                         <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={user?.photoURL || ''} alt="Company logo" data-ai-hint="company logo" />
                                    <AvatarFallback className="text-3xl">
                                        {user?.displayName ? getInitials(user.displayName) : 'C'}
                                    </AvatarFallback>
                                </Avatar>
                                <Button 
                                    size="icon" 
                                    className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    type="button"
                                    >
                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                                    <span className="sr-only">Edit company logo</span>
                                </Button>
                                <Input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={handleFileChange}
                                    accept="image/png, image/jpeg"
                                />
                            </div>
                            <div className="flex-1">
                                <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your Company LLC" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                        </div>

                         <FormField
                            control={form.control}
                            name="contactNumber"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Number (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="(123) 456-7890" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="supportEmail"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Support Email (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="support@yourcompany.com" {...field} />
                                </FormControl>
                                <FormDescription>A public email for support inquiries.</FormDescription>
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
                                <Textarea placeholder="Describe your company, its mission, values, and culture." {...field} rows={6}/>
                            </FormControl>
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
  );
}
