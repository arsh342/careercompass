'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Building, User, Mail, Briefcase, Star, Lightbulb, Target, Phone, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'employee' | 'employer';
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  supportEmail?: string;
  companyName?: string;
  companyOverview?: string;
  education?: string;
  skills?: string;
  interests?: string;
  careerGoals?: string;
  employmentHistory?: string;
  [key: string]: any;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          toast({ title: 'Error', description: 'User not found.', variant: 'destructive' });
          router.push('/dashboard');
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch user profile.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, toast, router]);

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('') || '';

  const renderSection = (title: string, content: string | undefined, icon: React.ElementType) => {
    if (!content) return null;
    const Icon = icon;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground whitespace-pre-wrap">{content}</p>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto text-center py-20">
        <h1 className="text-2xl font-bold">User not found</h1>
        <Button variant="link" asChild className="mt-4" onClick={() => router.back()}>
            Go Back
        </Button>
      </div>
    );
  }

  const displayName = profile.role === 'employer' ? profile.companyName : `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardContent className="pt-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex flex-col items-center md:w-1/4">
                <Avatar className="h-32 w-32 mb-4 border-4 border-primary/20">
                    <AvatarImage src={profile.photoURL} alt={displayName} data-ai-hint="profile avatar" />
                    <AvatarFallback className="text-4xl">{getInitials(displayName || '')}</AvatarFallback>
                </Avatar>
                <h1 className="text-2xl font-bold text-center">{displayName}</h1>
                 <Badge variant="secondary" className="mt-2 capitalize">{profile.role}</Badge>
                <div className="flex flex-col gap-2 text-muted-foreground mt-4 text-sm">
                   <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${profile.email}`} className="hover:underline">{profile.email}</a>
                   </div>
                   {profile.contactNumber && (
                     <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{profile.contactNumber}</span>
                     </div>
                   )}
                    {profile.supportEmail && (
                        <div className="flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            <a href={`mailto:${profile.supportEmail}`} className="hover:underline">{profile.supportEmail}</a>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full md:w-3/4">
                {profile.role === 'employer' ? (
                   <>
                     <CardHeader className="p-0 mb-6">
                       <CardTitle>About {profile.displayName}</CardTitle>
                     </CardHeader>
                     {renderSection('Company Overview', profile.companyOverview, Building)}
                   </>
                ) : (
                    <>
                     <CardHeader className="p-0 mb-6">
                       <CardTitle>Professional Profile</CardTitle>
                     </CardHeader>
                     {renderSection('Career Goals', profile.careerGoals, Target)}
                     <Separator className="my-6"/>
                     {renderSection('Education', profile.education, Briefcase)}
                     <Separator className="my-6"/>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                           <Star className="h-5 w-5 text-primary" />
                           <h3 className="text-lg font-semibold">Skills</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(profile.skills || '').split(',').map(skill => (
                            <Badge key={skill.trim()} variant="outline">{skill.trim()}</Badge>
                          ))}
                        </div>
                      </div>
                     <Separator className="my-6"/>
                     {renderSection('Interests', profile.interests, Lightbulb)}
                     <Separator className="my-6"/>
                     {renderSection('Employment History', profile.employmentHistory, Briefcase)}
                    </>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
