"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Users,
  UserSearch,
  Loader2,
  Send,
  Check,
  X,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  findAndRankCandidates,
  FindAndRankCandidatesOutput,
} from "@/ai/flows/find-and-rank-candidates";
import { ComprehensiveATSScorer } from "@/lib/comprehensiveAtsScorer";
import { sendApplicationStatusEmail } from "@/ai/flows/send-application-status-email";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

type PotentialCandidate = FindAndRankCandidatesOutput["candidates"][0];

interface Applicant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  photoURL?: string;
  submittedAt: {
    toDate: () => Date;
  };
  status: string;
  coverLetter: string;
  employmentHistory: string;
  references: string;
  portfolioLink: string;
  linkedinLink: string;
  education: string;
  skills: string;
  employability?:
    | "open_to_work"
    | "employed"
    | "freelancer"
    | "looking_for_new_job"
    | "student"
    | "other";
  [key: string]: any;
}

interface Opportunity {
  title: string;
  employerName: string;
  description?: string;
  rolesAndResponsibilities?: string;
  skills?: string;
  education?: string;
  experience?: string;
}

export default function ApplicantsPage() {
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const { user } = useAuth();
  const [potentialCandidates, setPotentialCandidates] = useState<
    PotentialCandidate[]
  >([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

  const [applicantStatusFilter, setApplicantStatusFilter] = useState("All");
  const [matchPercentageFilter, setMatchPercentageFilter] = useState([0]);

  useEffect(() => {
    if (!id || !user) return;

    const fetchPageData = async () => {
      setLoading(true);
      try {
        // Fetch opportunity details
        const oppDocRef = doc(db, "opportunities", id as string);
        const oppDocSnap = await getDoc(oppDocRef);
        if (oppDocSnap.exists()) {
          setOpportunity(oppDocSnap.data() as Opportunity);
        }

        // Fetch actual applicants first
        const applicantsQuery = query(
          collection(db, "applications"),
          where("opportunityId", "==", id),
          orderBy("submittedAt", "desc")
        );
        const applicantsSnapshot = await getDocs(applicantsQuery);
        const applicantsData = applicantsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Applicant)
        );
        setApplicants(applicantsData);
        const applicantUserIds = new Set(applicantsData.map((a) => a.userId));

        // Fetch potential candidates
        const { candidates } = await findAndRankCandidates({
          employerId: user.uid,
        });

        // Filter out potential candidates who have already applied
        setPotentialCandidates(candidates); // Do not filter out invited or applied
      } catch (error) {
        console.error("Error fetching page data:", error);
        toast({
          title: "Error",
          description: "Could not fetch candidate and applicant data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [id, user, toast]);

  const filteredApplicants = useMemo(() => {
    if (applicantStatusFilter === "All") return applicants;
    return applicants.filter((app) => app.status === applicantStatusFilter);
  }, [applicants, applicantStatusFilter]);

  const filteredPotentialCandidates = useMemo(() => {
    return potentialCandidates.filter(
      (c) => c.matchPercentage >= matchPercentageFilter[0]
    );
  }, [potentialCandidates, matchPercentageFilter]);

  const handleNotify = () => {
    // This is where you would trigger a backend function to send emails.
    // For now, we'll just show a toast notification as a simulation.
    toast({
      title: "Notifications Simulated",
      description: `If configured, emails would be sent to ${filteredPotentialCandidates.length} candidates.`,
    });
  };

  const handleDismissPotential = (uid: string) => {
    setPotentialCandidates((prev) => prev.filter((c) => c.uid !== uid));
    toast({
      title: "Candidate Dismissed",
      description: "The potential candidate has been removed from this list.",
    });
  };

  const handleInvitePotential = async (uid: string) => {
    // Find candidate details
    const candidate = potentialCandidates.find((c) => c.uid === uid);
    if (!candidate || !opportunity || !id || !uid) {
      toast({
        title: "Error",
        description: "Missing candidate, opportunity, or ID.",
        variant: "destructive",
      });
      return;
    }

    // 1. Send real invite email
    try {
      await sendApplicationStatusEmail({
        to: candidate.email,
        subject: `Invitation to apply for ${opportunity.title}`,
        body: `
                    <p>Hello ${candidate.displayName},</p>
                    <p>You are invited to apply for the <strong>${opportunity.title}</strong> position at <strong>${opportunity.employerName}</strong>.</p>
                    <p>Your skills and experience make you a great fit for this role. Click below to view and apply:</p>
                    <p><a href="${window.location.origin}/opportunities/${id}">View Opportunity</a></p>
                    <p>Best regards,<br/>${opportunity.employerName} Team</p>
                `,
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to send invite email.",
        variant: "destructive",
      });
      return;
    }

    // 2. Update backend: add or update application with status 'Invited' using setDoc (merge: true)
    try {
      const appRef = doc(db, "applications", `${id}_${uid}`);
      await setDoc(
        appRef,
        {
          opportunityId: id,
          userId: uid,
          status: "Invited",
          invitedAt: new Date(),
        },
        { merge: true }
      );
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update invite status.",
        variant: "destructive",
      });
      return;
    }

    // 3. Update UI: set status to 'invited' for this candidate
    setPotentialCandidates((prev) =>
      prev.map((c) =>
        c.uid === uid ? { ...c, applicationStatus: "invited" } : c
      )
    );
    toast({
      title: "Invitation Sent",
      description: "A real invitation email has been sent to the candidate.",
    });
  };

  const handleUpdateStatus = async (
    applicant: Applicant,
    status: "Approved" | "Rejected"
  ) => {
    try {
      const appRef = doc(db, "applications", applicant.id);
      await updateDoc(appRef, { status });
      setApplicants((prev) =>
        prev.map((app) => (app.id === applicant.id ? { ...app, status } : app))
      );
      toast({
        title: `Application ${status}`,
        description: `The candidate has been notified of their application status.`,
      });

      // Send email notification
      if (opportunity) {
        const subject = `Update on your application for ${opportunity.title}`;
        const body = `
                    <p>Hello ${applicant.userName},</p>
                    <p>This is an update regarding your application for the <strong>${
                      opportunity.title
                    }</strong> position at <strong>${
          opportunity.employerName
        }</strong>.</p>
                    <p>Your application has been <strong>${status}</strong>.</p>
                    ${
                      status === "Approved"
                        ? "<p>Congratulations! We will be in touch shortly with the next steps.</p>"
                        : "<p>Thank you for your interest. We encourage you to apply for other openings in the future.</p>"
                    }
                    <p>Best regards,</p>
                    <p>The ${opportunity.employerName} Team</p>
                `;

        await sendApplicationStatusEmail({
          to: applicant.userEmail,
          subject: subject,
          body: body,
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Could not update the application status.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("") || "";

  // ATS Score Checker for this applicant
  const renderApplicationDetail = (applicant: Applicant) => {
    // Compose resume text from applicant fields
    const resumeText = [
      applicant.education,
      applicant.skills,
      applicant.employmentHistory,
      applicant.coverLetter,
      applicant.references,
    ]
      .filter(Boolean)
      .join(" ");
    // Compose job description from opportunity fields
    const jobDesc = [
      opportunity?.title,
      opportunity?.description,
      opportunity?.rolesAndResponsibilities,
      opportunity?.skills,
      opportunity?.education,
      opportunity?.experience,
    ]
      .filter(Boolean)
      .join(" ");

    let atsResult = null;
    if (resumeText && jobDesc) {
      try {
        const scorer = new ComprehensiveATSScorer();
        atsResult = scorer.calculateComprehensiveScore(resumeText, jobDesc);
      } catch (e) {
        // ignore
      }
    }

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-1">Cover Letter</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {applicant.coverLetter}
          </p>
        </div>
        {applicant.employability && (
          <div>
            <Badge variant="outline" className="mb-2">
              {(() => {
                switch (applicant.employability) {
                  case "open_to_work":
                    return "Open to Work";
                  case "employed":
                    return "Employed";
                  case "freelancer":
                    return "Freelancer";
                  case "looking_for_new_job":
                    return "Looking for New Job";
                  case "student":
                    return "Student";
                  case "other":
                    return "Other";
                  default:
                    return applicant.employability;
                }
              })()}
            </Badge>
          </div>
        )}
        <Separator />
        <div>
          <h4 className="font-semibold text-sm mb-1">Skills</h4>
          <div className="flex flex-wrap gap-1">
            {(applicant.skills || "").split(",").map(
              (skill, i) =>
                skill && (
                  <Badge key={i} variant="secondary">
                    {skill.trim()}
                  </Badge>
                )
            )}
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold text-sm mb-1">Employment History</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {applicant.employmentHistory || "Not provided"}
          </p>
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold text-sm mb-1">References</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {applicant.references || "Not provided"}
          </p>
        </div>
        {(applicant.portfolioLink || applicant.linkedinLink) && <Separator />}
        {applicant.portfolioLink && (
          <div>
            <h4 className="font-semibold text-sm mb-1">Portfolio</h4>
            <Link
              href={applicant.portfolioLink}
              target="_blank"
              className="text-sm text-primary hover:underline break-all"
            >
              {applicant.portfolioLink}
            </Link>
          </div>
        )}
        {applicant.linkedinLink && (
          <div>
            <h4 className="font-semibold text-sm mb-1">LinkedIn Profile</h4>
            <Link
              href={applicant.linkedinLink}
              target="_blank"
              className="text-sm text-primary hover:underline break-all"
            >
              {applicant.linkedinLink}
            </Link>
          </div>
        )}
        <Separator />
        {/* ATS Score Checker Section */}
        <div>
          <h4 className="font-semibold text-sm mb-1">ATS Score Checker</h4>
          {!resumeText || !jobDesc ? (
            <div className="text-xs text-muted-foreground">
              Not enough data to compute ATS score.
            </div>
          ) : atsResult ? (
            <div className="text-xs">
              <div className="mb-1">
                <b>ATS Score:</b>{" "}
                <span className="text-primary font-semibold">
                  {atsResult.overallScore}%
                </span>{" "}
                <span className="ml-2 text-muted-foreground">
                  ({atsResult.confidenceLevel} match)
                </span>
              </div>
              <div className="mb-1">
                <b>Category Breakdown:</b>
                <ul className="ml-2">
                  {Object.entries(atsResult.categoryScores).map(
                    ([cat, val]) => (
                      <li key={cat}>
                        {cat}: {Math.round(val as number)}%
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div className="mb-1 text-green-700">
                <b>Matched:</b>
                <ul className="ml-2">
                  {Object.entries(atsResult.matched).map(([cat, arr]) =>
                    Array.isArray(arr) && arr.length > 0 ? (
                      <li key={cat}>
                        {cat}: {arr.slice(0, 8).join(", ")}
                        {arr.length > 8 ? "..." : ""}
                      </li>
                    ) : null
                  )}
                </ul>
              </div>
              <div className="mb-1 text-red-700">
                <b>Missing:</b>
                <ul className="ml-2">
                  {Object.entries(atsResult.missing).map(([cat, arr]) =>
                    Array.isArray(arr) && arr.length > 0 ? (
                      <li key={cat}>
                        {cat}: {arr.slice(0, 8).join(", ")}
                        {arr.length > 8 ? "..." : ""}
                      </li>
                    ) : null
                  )}
                </ul>
              </div>
              <div className="mb-1 text-muted-foreground">
                <b>Suggestions:</b>
                <ul className="ml-2">
                  {atsResult.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Could not compute ATS score.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/employer/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle>Top-Ranked Candidates</CardTitle>
                <CardDescription>
                  Users with skills matching your active opportunities.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleNotify}
                disabled={filteredPotentialCandidates.length === 0}
              >
                <Send className="mr-2 h-4 w-4" />
                Notify All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2">
              <Label htmlFor="match-slider">
                Minimum Match: {matchPercentageFilter[0]}%
              </Label>
              <Slider
                id="match-slider"
                min={0}
                max={100}
                step={10}
                value={matchPercentageFilter}
                onValueChange={setMatchPercentageFilter}
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPotentialCandidates.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <UserSearch className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No new matches found</h3>
                <p>
                  No top-ranked candidates match your criteria, or they have
                  already applied.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPotentialCandidates.map((candidate) => (
                  <div
                    key={candidate.uid}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                  >
                    <Link
                      href={`/users/${candidate.uid}`}
                      className="flex items-center gap-4 flex-1"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={candidate.photoURL}
                          alt={candidate.displayName}
                          data-ai-hint="profile avatar"
                        />
                        <AvatarFallback>
                          {getInitials(candidate.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">
                            {candidate.displayName}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-primary border-primary/50"
                          >
                            {candidate.matchPercentage}%
                          </Badge>
                        </div>
                        {/* Show which job this candidate is matched for */}
                        {opportunity?.title && (
                          <span className="inline-block text-xs bg-muted px-2 py-0.5 rounded mb-1 mt-1 text-muted-foreground">
                            Matched for: <span className="font-medium text-primary">{opportunity.title}</span>
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {candidate.justification}
                        </p>
                      </div>
                    </Link>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          candidate.applicationStatus === "invited" ||
                          candidate.applicationStatus === "applied"
                        }
                        onClick={() => handleInvitePotential(candidate.uid)}
                      >
                        {candidate.applicationStatus === "invited"
                          ? "Invited"
                          : candidate.applicationStatus === "applied"
                          ? "Already Applied"
                          : "Invite"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismissPotential(candidate.uid)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Applicants</CardTitle>
            <CardDescription>
              People who have applied for this posting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select
                value={applicantStatusFilter}
                onValueChange={setApplicantStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredApplicants.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No applicants yet</h3>
                <p>Check back later to see who has applied for this role.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredApplicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                  >
                    <Link
                      href={`/users/${applicant.userId}`}
                      className="flex items-center gap-4 flex-1"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={applicant.photoURL}
                          alt={applicant.userName}
                          data-ai-hint="profile avatar"
                        />
                        <AvatarFallback>
                          {getInitials(applicant.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">
                            {applicant.userName}
                          </p>
                          <Badge
                            variant={
                              applicant.status === "Approved"
                                ? "secondary"
                                : applicant.status === "Rejected"
                                ? "destructive"
                                : "outline"
                            }
                            className="capitalize"
                          >
                            {applicant.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Applied on{" "}
                          {format(applicant.submittedAt.toDate(), "PPP")}
                        </p>
                      </div>
                    </Link>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                            <DialogDescription>
                              Submitted by {applicant.userName} for the{" "}
                              {opportunity?.title} position.
                            </DialogDescription>
                          </DialogHeader>
                          {renderApplicationDetail(applicant)}
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-green-600 hover:text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() =>
                          handleUpdateStatus(applicant, "Approved")
                        }
                        disabled={
                          applicant.status === "Approved" ||
                          applicant.status === "Rejected"
                        }
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-red-600 hover:text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() =>
                          handleUpdateStatus(applicant, "Rejected")
                        }
                        disabled={
                          applicant.status === "Approved" ||
                          applicant.status === "Rejected"
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
