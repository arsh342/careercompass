"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Search,
  Briefcase,
  MapPin,
  Users,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { LumaSpin } from "@/components/ui/luma-spin";

interface Employer {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  company?: string;
  bio?: string;
  location?: string;
  industry?: string;
  openPositions?: number;
}

const CARD_GRADIENTS = [
  "from-blue-500/10 to-indigo-500/10",
  "from-violet-500/10 to-purple-500/10",
  "from-pink-500/10 to-rose-500/10",
  "from-emerald-500/10 to-teal-500/10",
  "from-amber-500/10 to-orange-500/10",
  "from-cyan-500/10 to-sky-500/10",
];

function getGradient(identifier: string) {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length];
}

export default function EmployersPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchEmployers = async () => {
      try {
        // Fetch all employer users
        const q = query(
          collection(db, "users"),
          where("role", "==", "employer")
        );
        const snapshot = await getDocs(q);
        const employerData: Employer[] = snapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as Employer[];
        setEmployers(employerData);

        // Fetch active opportunity counts per employer
        const oppsQuery = query(
          collection(db, "opportunities"),
          where("status", "==", "Active")
        );
        const oppsSnapshot = await getDocs(oppsQuery);
        const counts: Record<string, number> = {};
        oppsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const empId = data.employerId || data.uid;
          if (empId) {
            counts[empId] = (counts[empId] || 0) + 1;
          }
        });
        setOpenCounts(counts);
      } catch (error) {
        console.error("Error fetching employers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployers();
  }, []);

  const filteredEmployers = useMemo(() => {
    if (!searchQuery.trim()) return employers;
    const q = searchQuery.toLowerCase();
    return employers.filter(
      (emp) =>
        emp.displayName?.toLowerCase().includes(q) ||
        emp.company?.toLowerCase().includes(q) ||
        emp.industry?.toLowerCase().includes(q) ||
        emp.location?.toLowerCase().includes(q)
    );
  }, [employers, searchQuery]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[60vh]">
        <LumaSpin />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Browse Employers
          </h1>
        </div>
        <p className="text-muted-foreground">
          Discover companies and see their open positions.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by company, industry, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-full"
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        {filteredEmployers.length} employer{filteredEmployers.length !== 1 ? "s" : ""} found
      </p>

      {/* Grid */}
      {filteredEmployers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "No employers match your search."
                : "No employers found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployers.map((employer) => {
            const gradient = getGradient(employer.uid);
            const positionCount = openCounts[employer.uid] || 0;

            return (
              <Card
                key={employer.uid}
                className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
              >
                {/* Gradient header band */}
                <div
                  className={`h-20 bg-gradient-to-r ${gradient} relative`}
                >
                  <Avatar className="absolute -bottom-6 left-6 h-14 w-14 border-4 border-background shadow-md">
                    <AvatarImage src={employer.photoURL} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                      {(employer.company || employer.displayName || "E")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <CardHeader className="pt-10 pb-3">
                  <CardTitle className="text-lg">
                    {employer.company || employer.displayName}
                  </CardTitle>
                  {employer.industry && (
                    <Badge variant="secondary" className="w-fit">
                      {employer.industry}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {employer.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {employer.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {employer.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {employer.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {positionCount} open position{positionCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="pt-2">
                    <Link href={`/company/${employer.uid}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        View Profile
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
