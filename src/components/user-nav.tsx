'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Settings, LogOut, Crown, Sparkles } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from './ui/skeleton';

// Gradient backgrounds for avatars - inspired by modern gradient avatars
const AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500',
  'bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500',
  'bg-gradient-to-br from-pink-400 via-rose-400 to-red-400',
  'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500',
  'bg-gradient-to-br from-amber-400 via-orange-400 to-red-400',
  'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400',
  'bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-400',
  'bg-gradient-to-br from-slate-500 via-gray-600 to-zinc-700',
];

// Plan display info
const PLAN_INFO: Record<string, { label: string; color: string; icon: typeof Crown }> = {
  free: { label: 'Free', color: 'text-muted-foreground', icon: User },
  pro: { label: 'Pro', color: 'text-blue-500', icon: Sparkles },
  premium: { label: 'Premium', color: 'text-amber-500', icon: Crown },
  starter: { label: 'Starter', color: 'text-emerald-500', icon: Sparkles },
  business: { label: 'Business', color: 'text-purple-500', icon: Crown },
};

// Get consistent gradient based on user email/id
const getGradient = (identifier: string) => {
  if (!identifier) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

export function UserNav() {
  const { user, userProfile, loading, role } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <Skeleton className="h-9 w-24 rounded-full" />;
  }
  
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    )
  }

  const gradientClass = getGradient(user.uid || user.email || "");
  const hasPhoto = !!user.photoURL;
  
  // Get user's current plan from profile or default to free
  const currentPlan = userProfile?.plan || 'free';
  const planInfo = PLAN_INFO[currentPlan] || PLAN_INFO.free;
  const PlanIcon = planInfo.icon;

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            className="rounded-full py-0 ps-0 h-10 bg-background hover:bg-accent/50 border-2 "
          >
            <div className="me-1 flex aspect-square h-full p-1">
              <Avatar className="h-full w-full">
                {hasPhoto ? (
                  <AvatarImage src={user.photoURL || ''} alt={`@${user.displayName}`} />
                ) : null}
                <AvatarFallback className={gradientClass} />
              </Avatar>
            </div>
            <span className={`flex items-center gap-1 pr-3 ${planInfo.color}`}>
              {planInfo.label}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <PopoverHeader>
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                {hasPhoto ? (
                  <AvatarImage src={user.photoURL || ''} alt={`@${user.displayName}`} />
                ) : null}
                <AvatarFallback className={gradientClass} />
              </Avatar>
              <div className="flex-1 min-w-0">
                <PopoverTitle className="truncate">{user.displayName || 'User'}</PopoverTitle>
                <PopoverDescription className="text-xs truncate">{user.email}</PopoverDescription>
              </div>
            </div>
          </PopoverHeader>
          <PopoverBody className="space-y-1 px-2 py-1">
            <Button variant="ghost" className="w-full justify-start" size="sm" asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                View Profile
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" size="sm" asChild>
              <Link href="/pricing">
                <Crown className="mr-2 h-4 w-4 text-amber-500" />
                {currentPlan === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
              </Link>
            </Button>
            {role === 'employer' && (
              <Button variant="ghost" className="w-full justify-start" size="sm" asChild>
                <Link href="/employer/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            )}
          </PopoverBody>
          <PopoverFooter>
            <Button 
              variant="outline" 
              className="w-full bg-transparent" 
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    </div>
  );
}

