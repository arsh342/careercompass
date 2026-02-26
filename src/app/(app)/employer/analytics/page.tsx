"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Briefcase,
  Users,
  CheckCircle,
  BarChart,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart as RechartsBarChart,
  Pie,
  PieChart as RechartsPieChart,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";

interface Posting {
  id: string;
  title: string;
  status: string;
  applicants: number;
  createdAt: Timestamp;
}

interface Application {
  id: string;
  opportunityId: string;
  opportunityTitle?: string;
  status: string;
  submittedAt: Timestamp;
  createdAt?: Timestamp;
}

interface TopPosting {
  title: string;
  applicants: number;
  interviews: number;
  hired: number;
  conversionRate: number;
}

const FUNNEL_COLORS = [
  "#6366f1", // Applied - indigo
  "#8b5cf6", // Screening - violet
  "#3b82f6", // Interview - blue
  "#10b981", // Offer - emerald
  "#059669", // Hired - green
];

const chartConfigBar = {
  applicants: {
    label: "Applicants",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const chartConfigPie = {
  active: {
    label: "Active",
    color: "hsl(var(--chart-1))",
  },
  archived: {
    label: "Archived",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const chartConfigLine = {
  applications: {
    label: "Applications",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalPostings: 0,
    totalApplicants: 0,
    activeJobs: 0,
    avgApplicants: 0,
  });
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [lineChartData, setLineChartData] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [avgTimeToHire, setAvgTimeToHire] = useState<number>(0);
  const [topPostings, setTopPostings] = useState<TopPosting[]>([]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAnalyticsData();
    }
  }, [user, authLoading]);

  const fetchAnalyticsData = async () => {
    if (user) {
      setLoading(true);
      try {
        // Fetch Postings
        const postingsQuery = query(
          collection(db, "opportunities"),
          where("employerId", "==", user.uid)
        );
        const postingsSnapshot = await getDocs(postingsQuery);
        const postingsData: Posting[] = postingsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Posting)
        );

        // --- Calculate Stats ---
        const totalPostings = postingsData.length;
        const totalApplicants = postingsData.reduce(
          (acc, curr) => acc + (curr.applicants || 0),
          0
        );
        const activeJobs = postingsData.filter(
          (p) => p.status === "Active"
        ).length;
        const avgApplicants =
          totalPostings > 0
            ? parseFloat((totalApplicants / totalPostings).toFixed(1))
            : 0;
        setStats({ totalPostings, totalApplicants, activeJobs, avgApplicants });

        // --- Bar Chart Data ---
        const sortedPostings = [...postingsData].sort(
          (a, b) =>
            b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
        );
        const recentPostingsForBarChart = sortedPostings
          .slice(0, 7)
          .map((p) => ({
            title:
              p.title.length > 20 ? `${p.title.substring(0, 20)}...` : p.title,
            applicants: p.applicants || 0,
          }))
          .reverse();
        setBarChartData(recentPostingsForBarChart);

        // --- Pie Chart Data ---
        const archivedJobs = totalPostings - activeJobs;
        setPieChartData([
          { name: "Active", value: activeJobs, fill: "var(--color-active)" },
          {
            name: "Archived",
            value: archivedJobs,
            fill: "var(--color-archived)",
          },
        ]);

        // --- Line Chart Data ---
        const opportunityIds = postingsData.map((p) => p.id);
        if (opportunityIds.length > 0) {
          const thirtyDaysAgo = subDays(new Date(), 30);
          const applicationsQuery = query(
            collection(db, "applications"),
            where("opportunityId", "in", opportunityIds),
            where("submittedAt", ">=", thirtyDaysAgo)
          );
          const applicationsSnapshot = await getDocs(applicationsQuery);
          const applicationsData: Application[] = applicationsSnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as Application)
          );

          const dailyCounts: { [key: string]: number } = {};
          for (let i = 0; i < 30; i++) {
            const day = format(subDays(new Date(), i), "MMM d");
            dailyCounts[day] = 0;
          }
          applicationsData.forEach((app) => {
            const day = format(app.submittedAt.toDate(), "MMM d");
            if (dailyCounts[day] !== undefined) {
              dailyCounts[day]++;
            }
          });

          const formattedLineData = Object.entries(dailyCounts)
            .map(([date, applications]) => ({ date, applications }))
            .reverse();
          setLineChartData(formattedLineData);
        } else {
          setLineChartData([]);
        }

        // --- Fetch ALL applications for funnel + time-to-hire ---
        const allAppsQuery = query(
          collection(db, "applications"),
          where("opportunityId", "in", opportunityIds.length > 0 ? opportunityIds.slice(0, 10) : ["__none__"])
        );
        const allAppsSnap = await getDocs(allAppsQuery);
        const allApps: Application[] = allAppsSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Application)
        );

        // Conversion Funnel
        const statusCounts = {
          Applied: 0,
          Screening: 0,
          Interview: 0,
          Offer: 0,
          Hired: 0,
        };
        allApps.forEach((app) => {
          const s = app.status;
          if (s === "Pending" || s === "Submitted") statusCounts.Applied++;
          else if (s === "Screening") { statusCounts.Applied++; statusCounts.Screening++; }
          else if (s === "Interview") { statusCounts.Applied++; statusCounts.Screening++; statusCounts.Interview++; }
          else if (s === "Offer") { statusCounts.Applied++; statusCounts.Screening++; statusCounts.Interview++; statusCounts.Offer++; }
          else if (s === "Hired" || s === "Approved") { statusCounts.Applied++; statusCounts.Screening++; statusCounts.Interview++; statusCounts.Offer++; statusCounts.Hired++; }
          else { statusCounts.Applied++; }
        });
        setFunnelData(
          Object.entries(statusCounts).map(([stage, count], i) => ({
            stage,
            count,
            fill: FUNNEL_COLORS[i],
          }))
        );

        // Time to Hire
        const hiredApps = allApps.filter((a) => a.status === "Hired" || a.status === "Approved");
        if (hiredApps.length > 0) {
          const totalDays = hiredApps.reduce((sum, app) => {
            const submitted = app.submittedAt?.toDate?.() || new Date();
            const diffDays = Math.max(1, Math.floor((Date.now() - submitted.getTime()) / (1000 * 60 * 60 * 24)));
            return sum + diffDays;
          }, 0);
          setAvgTimeToHire(Math.round(totalDays / hiredApps.length));
        }

        // Top Performing Postings
        const postingAppMap: Record<string, Application[]> = {};
        allApps.forEach((app) => {
          if (!postingAppMap[app.opportunityId]) postingAppMap[app.opportunityId] = [];
          postingAppMap[app.opportunityId].push(app);
        });
        const topPostingsData: TopPosting[] = postingsData
          .map((p) => {
            const apps = postingAppMap[p.id] || [];
            const interviews = apps.filter((a) => ["Interview", "Offer", "Hired", "Approved"].includes(a.status)).length;
            const hired = apps.filter((a) => a.status === "Hired" || a.status === "Approved").length;
            return {
              title: p.title,
              applicants: apps.length,
              interviews,
              hired,
              conversionRate: apps.length > 0 ? Math.round((hired / apps.length) * 100) : 0,
            };
          })
          .sort((a, b) => b.applicants - a.applicants)
          .slice(0, 5);
        setTopPostings(topPostingsData);

      } catch (error) {
        console.error("Error fetching analytics data:", error);
        toast({
          title: "Error",
          description: "Could not fetch analytics data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Key metrics and insights about your job postings.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Postings
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPostings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Applicants
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalApplicants}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Jobs
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeJobs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Applicants / Job
                </CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgApplicants}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Applicants per Posting</CardTitle>
                <CardDescription>
                  Number of applicants for your 7 most recent jobs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {barChartData.length > 0 ? (
                  <ChartContainer
                    config={chartConfigBar}
                    className="min-h-[300px] w-full"
                  >
                    <RechartsBarChart accessibilityLayer data={barChartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="title"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar
                        dataKey="applicants"
                        fill="var(--color-applicants)"
                        radius={8}
                      />
                    </RechartsBarChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center py-20 text-muted-foreground">
                    <BarChart className="h-12 w-12 mx-auto mb-4" />
                    <p>No data to display. Post a job to see stats.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Job Status Distribution</CardTitle>
                <CardDescription>
                  A breakdown of your active vs. archived jobs.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {stats.totalPostings > 0 ? (
                  <ChartContainer
                    config={chartConfigPie}
                    className="min-h-[300px] w-full"
                  >
                    <RechartsPieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fill}
                            stroke={entry.fill}
                          />
                        ))}
                      </Pie>
                      <Legend
                        content={() => (
                          <p className="text-sm mt-4 text-center">{`Total Postings: ${stats.totalPostings}`}</p>
                        )}
                      />
                    </RechartsPieChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center py-20 text-muted-foreground">
                    <PieIcon className="h-12 w-12 mx-auto mb-4" />
                    <p>No data to display. Post a job to see stats.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
              <CardDescription>
                Total applications received over the last 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lineChartData.length > 0 ? (
                <ChartContainer
                  config={chartConfigLine}
                  className="min-h-[300px] w-full"
                >
                  <RechartsLineChart data={lineChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Line
                      dataKey="applications"
                      type="monotone"
                      stroke="var(--color-applications)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </RechartsLineChart>
                </ChartContainer>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <LineIcon className="h-12 w-12 mx-auto mb-4" />
                  <p>No application data found for the last 30 days.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* NEW: Conversion Funnel + Time to Hire */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Hiring Funnel</CardTitle>
                <CardDescription>Candidate progression through hiring stages</CardDescription>
              </CardHeader>
              <CardContent>
                {funnelData.length > 0 && funnelData[0].count > 0 ? (
                  <div className="space-y-3">
                    {funnelData.map((stage, i) => {
                      const maxCount = funnelData[0].count || 1;
                      const pct = Math.round((stage.count / maxCount) * 100);
                      return (
                        <div key={stage.stage} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-20 shrink-0">{stage.stage}</span>
                          <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                            <div
                              className="h-full rounded-full flex items-center px-3 transition-all duration-500"
                              style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: stage.fill }}
                            >
                              <span className="text-xs font-medium text-white">{stage.count}</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No applications yet to build the funnel.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Time to Hire</CardTitle>
                <CardDescription>Average days from application to hire</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="text-5xl font-bold text-primary">{avgTimeToHire || "—"}</div>
                <p className="text-sm text-muted-foreground mt-2">days average</p>
              </CardContent>
            </Card>
          </div>

          {/* NEW: Top Performing Postings */}
          {topPostings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Postings</CardTitle>
                <CardDescription>Ranked by applicant volume and conversion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">Job Title</th>
                        <th className="text-center py-3 font-medium">Applicants</th>
                        <th className="text-center py-3 font-medium">Interviews</th>
                        <th className="text-center py-3 font-medium">Hired</th>
                        <th className="text-center py-3 font-medium">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPostings.map((posting, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-3 font-medium">{posting.title}</td>
                          <td className="text-center py-3">{posting.applicants}</td>
                          <td className="text-center py-3">{posting.interviews}</td>
                          <td className="text-center py-3">{posting.hired}</td>
                          <td className="text-center py-3">
                            <Badge variant={posting.conversionRate >= 20 ? "default" : "secondary"} className="rounded-full">
                              {posting.conversionRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
