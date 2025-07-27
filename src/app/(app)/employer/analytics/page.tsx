
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Briefcase, Users, CheckCircle, BarChart, PieChart as PieIcon, LineChart as LineIcon } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from "recharts"


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
    submittedAt: Timestamp;
}

const chartConfigBar = {
  applicants: {
    label: "Applicants",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const chartConfigPie = {
  active: {
    label: "Active",
    color: "hsl(var(--chart-1))",
  },
  archived: {
    label: "Archived",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

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

    const [stats, setStats] = useState({ totalPostings: 0, totalApplicants: 0, activeJobs: 0, avgApplicants: 0 });
    const [barChartData, setBarChartData] = useState<any[]>([]);
    const [pieChartData, setPieChartData] = useState<any[]>([]);
    const [lineChartData, setLineChartData] = useState<any[]>([]);


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
                const postingsData: Posting[] = postingsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Posting));

                // --- Calculate Stats ---
                const totalPostings = postingsData.length;
                const totalApplicants = postingsData.reduce((acc, curr) => acc + (curr.applicants || 0), 0);
                const activeJobs = postingsData.filter(p => p.status === 'Active').length;
                const avgApplicants = totalPostings > 0 ? parseFloat((totalApplicants / totalPostings).toFixed(1)) : 0;
                setStats({ totalPostings, totalApplicants, activeJobs, avgApplicants });
                
                // --- Bar Chart Data ---
                const sortedPostings = [...postingsData].sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
                const recentPostingsForBarChart = sortedPostings.slice(0, 7).map(p => ({
                    title: p.title.length > 20 ? `${p.title.substring(0, 20)}...` : p.title,
                    applicants: p.applicants || 0
                })).reverse();
                setBarChartData(recentPostingsForBarChart);
                
                // --- Pie Chart Data ---
                const archivedJobs = totalPostings - activeJobs;
                setPieChartData([
                    { name: 'Active', value: activeJobs, fill: 'var(--color-active)' },
                    { name: 'Archived', value: archivedJobs, fill: 'var(--color-archived)' }
                ]);
                
                // --- Line Chart Data ---
                const opportunityIds = postingsData.map(p => p.id);
                if (opportunityIds.length > 0) {
                    const thirtyDaysAgo = subDays(new Date(), 30);
                    const applicationsQuery = query(
                        collection(db, "applications"),
                        where("opportunityId", "in", opportunityIds),
                        where("submittedAt", ">=", thirtyDaysAgo)
                    );
                    const applicationsSnapshot = await getDocs(applicationsQuery);
                    const applicationsData: Application[] = applicationsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Application));

                    const dailyCounts: { [key: string]: number } = {};
                    for (let i = 0; i < 30; i++) {
                        const day = format(subDays(new Date(), i), 'MMM d');
                        dailyCounts[day] = 0;
                    }
                    applicationsData.forEach(app => {
                        const day = format(app.submittedAt.toDate(), 'MMM d');
                        if (dailyCounts[day] !== undefined) {
                            dailyCounts[day]++;
                        }
                    });
                    
                    const formattedLineData = Object.entries(dailyCounts).map(([date, applications]) => ({ date, applications })).reverse();
                    setLineChartData(formattedLineData);
                } else {
                     setLineChartData([]);
                }


            } catch (error) {
                console.error("Error fetching analytics data:", error);
                 toast({ title: "Error", description: "Could not fetch analytics data.", variant: "destructive" });
            } finally {
               setLoading(false);
            }
        }
    };


  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Key metrics and insights about your job postings.</p>
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
                            <CardTitle className="text-sm font-medium">Total Postings</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalPostings}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalApplicants}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeJobs}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Applicants / Job</CardTitle>
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
                            <CardDescription>Number of applicants for your 7 most recent jobs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {barChartData.length > 0 ? (
                                <ChartContainer config={chartConfigBar} className="min-h-[300px] w-full">
                                    <RechartsBarChart accessibilityLayer data={barChartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="title" tickLine={false} tickMargin={10} axisLine={false} />
                                        <YAxis />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                        <Bar dataKey="applicants" fill="var(--color-applicants)" radius={8} />
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
                            <CardDescription>A breakdown of your active vs. archived jobs.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                            {stats.totalPostings > 0 ? (
                                <ChartContainer config={chartConfigPie} className="min-h-[300px] w-full">
                                    <RechartsPieChart>
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                        <Pie data={pieChartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                           {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Legend content={<p className="text-sm mt-4 text-center">{`Total Postings: ${stats.totalPostings}`}></p>}/>
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
                        <CardDescription>Total applications received over the last 30 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {lineChartData.length > 0 ? (
                            <ChartContainer config={chartConfigLine} className="min-h-[300px] w-full">
                                <RechartsLineChart data={lineChartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <Line dataKey="applications" type="monotone" stroke="var(--color-applications)" strokeWidth={2} dot={false} />
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

            </div>
        )}
    </div>
  );
}
