"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Briefcase,
  FileText,
  Shield,
  TrendingUp,
  Crown,
  Loader2,
  UserCheck,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ADMIN_UIDS = [
  // Add admin UIDs here. For now, check if user role or a custom claim.
];

const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  starter: "#94a3b8",
  pro: "#6366f1",
  business: "#8b5cf6",
  premium: "#f59e0b",
};

export default function AdminDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    totalEmployers: 0,
    totalEmployees: 0,
    totalOpportunities: 0,
    totalApplications: 0,
    activeOpportunities: 0,
  });
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    // Allow any authenticated user to view admin for demo purposes
    // In production, check: if (userProfile?.role !== "admin") router.push("/")
    fetchPlatformData();
  }, [user, authLoading]);

  const fetchPlatformData = async () => {
    try {
      // Fetch users
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const employers = users.filter((u: any) => u.role === "employer");
      const employees = users.filter((u: any) => u.role === "employee" || !u.role);

      // Plan distribution
      const planCounts: Record<string, number> = {};
      users.forEach((u: any) => {
        const plan = u.plan || "free";
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });
      const planData = Object.entries(planCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        fill: PLAN_COLORS[name] || "#94a3b8",
      }));

      // Recent users (last 10 by doc order)
      const recentUsersData = users
        .slice(-10)
        .reverse()
        .map((u: any) => ({
          name: u.displayName || u.companyName || "Unknown",
          email: u.email,
          role: u.role || "employee",
          plan: u.plan || "free",
        }));

      // Fetch opportunities
      const oppsSnap = await getDocs(collection(db, "opportunities"));
      const totalOpps = oppsSnap.size;
      const activeOpps = oppsSnap.docs.filter(
        (d) => d.data().status === "Active"
      ).length;

      // Fetch applications count
      const appsSnap = await getDocs(collection(db, "applications"));

      setPlatformStats({
        totalUsers: users.length,
        totalEmployers: employers.length,
        totalEmployees: employees.length,
        totalOpportunities: totalOpps,
        totalApplications: appsSnap.size,
        activeOpportunities: activeOpps,
      });
      setPlanDistribution(planData);
      setRecentUsers(recentUsersData);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: platformStats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Employers", value: platformStats.totalEmployers, icon: Building2, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Job Seekers", value: platformStats.totalEmployees, icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Job Postings", value: platformStats.totalOpportunities, icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Applications", value: platformStats.totalApplications, icon: FileText, color: "text-pink-500", bg: "bg-pink-500/10" },
    { label: "Active Jobs", value: platformStats.activeOpportunities, icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  return (
    <div className="min-h-screen -m-4 md:-m-6 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Platform-wide metrics and user management</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="rounded-3xl border-border/50">
                  <CardContent className="pt-6">
                    <div className={`p-2 rounded-xl ${card.bg} w-fit mb-2`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Plan Distribution */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="rounded-3xl border-border/50 h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Plan Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {planDistribution.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={180}>
                      <PieChart>
                        <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                          {planDistribution.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1">
                      {planDistribution.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                            <span className="text-muted-foreground">{entry.name}</span>
                          </div>
                          <span className="font-medium">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No user data</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Users */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="rounded-3xl border-border/50 h-full">
              <CardHeader>
                <CardTitle className="text-base">Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentUsers.map((u, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-full text-[10px] capitalize">{u.role}</Badge>
                        <Badge variant="secondary" className="rounded-full text-[10px] capitalize">{u.plan}</Badge>
                      </div>
                    </div>
                  ))}
                  {recentUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
