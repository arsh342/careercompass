"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Users,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface CompanyProfile {
  uid: string;
  displayName: string;
  companyName?: string;
  companyOverview?: string;
  photoURL?: string;
  contactNumber?: string;
  supportEmail?: string;
  websiteLink?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  founded?: string;
  benefits?: string[];
  culture?: string;
}

interface CompanyOpportunity {
  id: string;
  title: string;
  type: string;
  location: string;
  skills: string | string[];
  createdAt: any;
  status: string;
}

export default function CompanyPage() {
  const params = useParams();
  const companyId = params.id as string;
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [opportunities, setOpportunities] = useState<CompanyOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetchCompanyData = async () => {
      try {
        // Fetch company profile
        const userDoc = await getDoc(doc(db, "users", companyId));
        if (userDoc.exists()) {
          setProfile({ uid: userDoc.id, ...userDoc.data() } as CompanyProfile);
        }

        // Fetch open positions
        const oppsQuery = query(
          collection(db, "opportunities"),
          where("employerId", "==", companyId)
        );
        const oppsSnapshot = await getDocs(oppsQuery);
        const opps: CompanyOpportunity[] = oppsSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as any;
        setOpportunities(opps);
      } catch (err) {
        console.error("Error fetching company data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <Building2 className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Company not found</p>
        <Link href="/employers">
          <Button variant="link">Browse employers</Button>
        </Link>
      </div>
    );
  }

  const companyName = profile.companyName || profile.displayName || "Company";
  const activePositions = opportunities.filter(
    (o) => o.status !== "closed" && o.status !== "Closed"
  );

  return (
    <div className="min-h-screen -m-4 md:-m-6">
      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
        {/* Abstract pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="absolute top-4 left-4">
          <Link href="/employers">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6">
        {/* Company Header */}
        <motion.div
          className="relative -mt-16 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
            <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
              <AvatarImage src={profile.photoURL} />
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {companyName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {companyName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                {profile.industry && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {profile.industry}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.location}
                  </span>
                )}
                {profile.companySize && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {profile.companySize} employees
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary" className="rounded-full">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {activePositions.length} open position
                  {activePositions.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {profile.companyOverview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="rounded-3xl border-border/50">
                  <CardContent className="pt-6">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      About
                    </h2>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {profile.companyOverview}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Culture */}
            {profile.culture && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="rounded-3xl border-border/50">
                  <CardContent className="pt-6">
                    <h2 className="text-lg font-semibold mb-3">Our Culture</h2>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {profile.culture}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Open Positions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="rounded-3xl border-border/50">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Open Positions ({activePositions.length})
                  </h2>
                  {activePositions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No open positions at this time.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activePositions.map((opp) => {
                        const skillList =
                          typeof opp.skills === "string"
                            ? opp.skills
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : opp.skills || [];
                        const postedDate = opp.createdAt?.toDate
                          ? opp.createdAt.toDate()
                          : new Date(opp.createdAt);

                        return (
                          <Link
                            key={opp.id}
                            href={`/opportunities/${opp.id}`}
                            className="block"
                          >
                            <div className="p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all group">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                                    {opp.title}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                    {opp.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {opp.location}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDistanceToNow(postedDate, {
                                        addSuffix: true,
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] rounded-full shrink-0"
                                >
                                  {opp.type}
                                </Badge>
                              </div>
                              {skillList.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {skillList.slice(0, 4).map((skill) => (
                                    <Badge
                                      key={typeof skill === "string" ? skill : String(skill)}
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0 rounded-full"
                                    >
                                      {typeof skill === "string" ? skill : String(skill)}
                                    </Badge>
                                  ))}
                                  {skillList.length > 4 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0 rounded-full"
                                    >
                                      +{skillList.length - 4} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Sidebar (1/3) */}
          <div className="space-y-4">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="rounded-3xl border-border/50">
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold text-sm">Contact</h3>
                  {profile.supportEmail && (
                    <a
                      href={`mailto:${profile.supportEmail}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Mail className="h-4 w-4 text-primary" />
                      {profile.supportEmail}
                    </a>
                  )}
                  {profile.contactNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary" />
                      {profile.contactNumber}
                    </div>
                  )}
                  {profile.websiteLink && (
                    <a
                      href={profile.websiteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Globe className="h-4 w-4 text-primary" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {!profile.supportEmail &&
                    !profile.contactNumber &&
                    !profile.websiteLink && (
                      <p className="text-sm text-muted-foreground">
                        No contact info available.
                      </p>
                    )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Benefits */}
            {profile.benefits && profile.benefits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="rounded-3xl border-border/50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-sm mb-3">Benefits & Perks</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.benefits.map((benefit) => (
                        <Badge
                          key={benefit}
                          variant="secondary"
                          className="rounded-full text-xs"
                        >
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="rounded-3xl border-border/50">
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold text-sm">Company Info</h3>
                  {profile.founded && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Founded</span>
                      <span className="font-medium">{profile.founded}</span>
                    </div>
                  )}
                  {profile.companySize && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-medium">{profile.companySize}</span>
                    </div>
                  )}
                  {profile.industry && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Industry</span>
                      <span className="font-medium">{profile.industry}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Open roles</span>
                    <span className="font-medium">{activePositions.length}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
