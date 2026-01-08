"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Target,
  Trophy,
  Flame,
  Calendar,
  Send,
  MessageSquare,
  Gift,
  Clock,
  User,
  FileText,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { LumaSpin } from "@/components/ui/luma-spin";
import Link from "next/link";
import {
  ACHIEVEMENTS,
  UserStats,
  UserStreak,
  UserAchievement,
  getRarityColor,
  type Achievement,
} from "@/types/gamification-types";
import { Application } from "@/types/application-types";

// Icon map
const ICON_MAP: Record<string, React.ElementType> = {
  User, FileText, Send, Target, Flame, Rocket, Calendar, MessageSquare, Trophy, Gift,
};

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [streak, setStreak] = useState<UserStreak>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: new Date(),
    streakProtected: false,
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState<UserAchievement[]>([]);

  // Load data from localStorage
  useEffect(() => {
    if (user) {
      // Load applications
      const savedApps = localStorage.getItem(`applications_${user.uid}`);
      if (savedApps) {
        try {
          const parsed = JSON.parse(savedApps);
          setApplications(parsed.map((app: Application) => ({
            ...app,
            savedAt: new Date(app.savedAt),
            appliedAt: app.appliedAt ? new Date(app.appliedAt) : undefined,
            lastUpdated: new Date(app.lastUpdated),
          })));
        } catch (e) {
          console.error("Failed to parse applications", e);
        }
      }

      // Load streak
      const savedStreak = localStorage.getItem(`streak_${user.uid}`);
      if (savedStreak) {
        try {
          const parsed = JSON.parse(savedStreak);
          setStreak({
            ...parsed,
            lastActiveDate: new Date(parsed.lastActiveDate),
          });
        } catch (e) {
          console.error("Failed to parse streak", e);
        }
      }

      // Load achievements
      const savedAchievements = localStorage.getItem(`achievements_${user.uid}`);
      if (savedAchievements) {
        try {
          setUnlockedAchievements(JSON.parse(savedAchievements));
        } catch (e) {
          console.error("Failed to parse achievements", e);
        }
      }

      // Update streak on visit
      updateStreak();
    }
  }, [user]);

  const updateStreak = () => {
    if (!user) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActive = new Date(streak.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    let newStreak = { ...streak };
    
    if (diffDays === 0) {
      // Same day, no change
    } else if (diffDays === 1) {
      // Consecutive day
      newStreak.currentStreak += 1;
      newStreak.longestStreak = Math.max(newStreak.longestStreak, newStreak.currentStreak);
    } else if (diffDays === 2 && streak.streakProtected) {
      // Used streak protection
      newStreak.streakProtected = false;
    } else {
      // Streak broken
      newStreak.currentStreak = 1;
    }
    
    newStreak.lastActiveDate = today;
    setStreak(newStreak);
    localStorage.setItem(`streak_${user.uid}`, JSON.stringify(newStreak));
  };

  // Calculate stats
  const stats: UserStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const applied = applications.filter(a => a.status !== 'saved');
    const interviews = applications.filter(a => a.status === 'interview');
    const offers = applications.filter(a => a.status === 'offer');
    const responses = applications.filter(a => ['screening', 'interview', 'offer', 'rejected'].includes(a.status));

    return {
      totalApplications: applied.length,
      applicationsThisWeek: applied.filter(a => a.appliedAt && new Date(a.appliedAt) > weekAgo).length,
      applicationsThisMonth: applied.filter(a => a.appliedAt && new Date(a.appliedAt) > monthAgo).length,
      totalInterviews: interviews.length,
      interviewsScheduled: interviews.filter(a => a.interviews.some(i => new Date(i.scheduledAt) > now)).length,
      offersReceived: offers.length,
      responseRate: applied.length > 0 ? Math.round((responses.length / applied.length) * 100) : 0,
      averageTimeToResponse: 7, // Placeholder
      savedJobs: applications.filter(a => a.status === 'saved').length,
      aiToolsUsed: 0,
      resumesCreated: 0,
      coverLettersGenerated: 0,
    };
  }, [applications]);

  // Check for new achievements
  useEffect(() => {
    if (!user) return;

    const newUnlocked: UserAchievement[] = [...unlockedAchievements];
    let changed = false;

    ACHIEVEMENTS.forEach(achievement => {
      if (unlockedAchievements.find(ua => ua.achievementId === achievement.id)) return;

      let progress = 0;
      let unlocked = false;

      switch (achievement.requirement.metric) {
        case 'totalApplications':
          progress = (stats.totalApplications / achievement.requirement.target) * 100;
          unlocked = stats.totalApplications >= achievement.requirement.target;
          break;
        case 'totalInterviews':
          progress = (stats.totalInterviews / achievement.requirement.target) * 100;
          unlocked = stats.totalInterviews >= achievement.requirement.target;
          break;
        case 'offersReceived':
          progress = (stats.offersReceived / achievement.requirement.target) * 100;
          unlocked = stats.offersReceived >= achievement.requirement.target;
          break;
        case 'currentStreak':
          progress = (streak.currentStreak / achievement.requirement.target) * 100;
          unlocked = streak.currentStreak >= achievement.requirement.target;
          break;
      }

      if (unlocked) {
        newUnlocked.push({
          achievementId: achievement.id,
          unlockedAt: new Date(),
          progress: 100,
        });
        changed = true;
      }
    });

    if (changed) {
      setUnlockedAchievements(newUnlocked);
      localStorage.setItem(`achievements_${user.uid}`, JSON.stringify(newUnlocked));
    }
  }, [stats, streak, user, unlockedAchievements]);

  const totalPoints = useMemo(() => {
    return unlockedAchievements.reduce((sum, ua) => {
      const achievement = ACHIEVEMENTS.find(a => a.id === ua.achievementId);
      return sum + (achievement?.points || 0);
    }, 0);
  }, [unlockedAchievements]);

  if (authLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
        <LumaSpin />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Login Required</h1>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Analytics & Achievements</h1>
            <p className="text-muted-foreground">Track your job search progress</p>
          </div>
        </div>
      </div>

      {/* Streak & Points Banner */}
      <Card className="mb-6 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Flame className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{streak.currentStreak}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Trophy className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                  <p className="text-sm text-muted-foreground">Points</p>
                </div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Target className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</p>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Longest Streak</p>
              <p className="text-lg font-semibold">{streak.longestStreak} days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Send className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalApplications}</p>
                    <p className="text-xs text-muted-foreground">Applications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalInterviews}</p>
                    <p className="text-xs text-muted-foreground">Interviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Gift className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.offersReceived}</p>
                    <p className="text-xs text-muted-foreground">Offers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.responseRate}%</p>
                    <p className="text-xs text-muted-foreground">Response Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Applications</span>
                    <span className="font-medium">{stats.applicationsThisWeek}</span>
                  </div>
                  <Progress value={Math.min((stats.applicationsThisWeek / 10) * 100, 100)} />
                  <p className="text-xs text-muted-foreground">
                    Goal: 10 applications/week
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Applications</span>
                    <span className="font-medium">{stats.applicationsThisMonth}</span>
                  </div>
                  <Progress value={Math.min((stats.applicationsThisMonth / 40) * 100, 100)} />
                  <p className="text-xs text-muted-foreground">
                    Goal: 40 applications/month
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Continue Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" asChild className="justify-start">
                  <Link href="/applications">
                    <Send className="h-4 w-4 mr-2" />
                    Track Applications
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start">
                  <Link href="/ai-tools/interview-prep">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Practice Interview
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start">
                  <Link href="/ai-tools/resume-builder">
                    <FileText className="h-4 w-4 mr-2" />
                    Update Resume
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start">
                  <Link href="/opportunities">
                    <Target className="h-4 w-4 mr-2" />
                    Find Jobs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {/* Unlocked Achievements */}
          {unlockedAchievements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Unlocked ({unlockedAchievements.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unlockedAchievements.map((ua) => {
                  const achievement = ACHIEVEMENTS.find(a => a.id === ua.achievementId);
                  if (!achievement) return null;
                  const Icon = ICON_MAP[achievement.icon] || Trophy;
                  
                  return (
                    <Card key={ua.achievementId} className="border-primary/50 bg-primary/5">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getRarityColor(achievement.rarity)}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{achievement.name}</h4>
                              <Badge variant="secondary" className="text-xs">
                                +{achievement.points}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Locked Achievements */}
          <div>
            <h3 className="text-lg font-semibold mb-4">In Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ACHIEVEMENTS.filter(a => !unlockedAchievements.find(ua => ua.achievementId === a.id)).map((achievement) => {
                const Icon = ICON_MAP[achievement.icon] || Trophy;
                let progress = 0;
                let current = 0;

                switch (achievement.requirement.metric) {
                  case 'totalApplications':
                    current = stats.totalApplications;
                    progress = Math.min((current / achievement.requirement.target) * 100, 100);
                    break;
                  case 'totalInterviews':
                    current = stats.totalInterviews;
                    progress = Math.min((current / achievement.requirement.target) * 100, 100);
                    break;
                  case 'currentStreak':
                    current = streak.currentStreak;
                    progress = Math.min((current / achievement.requirement.target) * 100, 100);
                    break;
                }

                return (
                  <Card key={achievement.id} className="opacity-75">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{achievement.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {achievement.rarity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          <div className="mt-2">
                            <Progress value={progress} className="h-1.5" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {current}/{achievement.requirement.target}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
