"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Loader2,
  Users,
  Kanban,
  GripVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Video,
  Star,
  Send,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

const PIPELINE_STAGES = [
  { id: "Submitted", label: "Applied", color: "bg-slate-500", icon: Send },
  { id: "Screening", label: "Screening", color: "bg-blue-500", icon: Search },
  { id: "Interview", label: "Interview", color: "bg-amber-500", icon: Video },
  { id: "Offer", label: "Offer", color: "bg-purple-500", icon: Star },
  { id: "Hired", label: "Hired", color: "bg-emerald-500", icon: CheckCircle2 },
  { id: "Rejected", label: "Rejected", color: "bg-red-500", icon: XCircle },
] as const;

type StageId = (typeof PIPELINE_STAGES)[number]["id"];

interface PipelineApplicant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  photoURL?: string;
  submittedAt: { toDate: () => Date } | Date;
  status: string;
  skills: string;
  education: string;
}

// ============================================
// KANBAN CARD
// ============================================

function ApplicantCard({
  applicant,
  onDragStart,
}: {
  applicant: PipelineApplicant;
  onDragStart: (e: React.DragEvent, applicant: PipelineApplicant) => void;
}) {
  const submittedDate =
    typeof (applicant.submittedAt as any)?.toDate === "function"
      ? (applicant.submittedAt as any).toDate()
      : new Date(applicant.submittedAt as any);

  const skillList = applicant.skills
    ? applicant.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, applicant)}
      className="bg-card border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all hover:shadow-md group"
    >
      <div className="flex items-start gap-2.5">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Avatar className="h-6 w-6">
              <AvatarImage src={applicant.photoURL} />
              <AvatarFallback className="text-[10px]">
                {applicant.userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium truncate">{applicant.userName}</p>
          </div>
          {skillList.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {skillList.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 rounded-full"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {format(submittedDate, "MMM d, yyyy")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// KANBAN COLUMN
// ============================================

function PipelineColumn({
  stage,
  applicants,
  onDragStart,
  onDrop,
  isDragOver,
  onDragOver,
  onDragLeave,
}: {
  stage: (typeof PIPELINE_STAGES)[number];
  applicants: PipelineApplicant[];
  onDragStart: (e: React.DragEvent, applicant: PipelineApplicant) => void;
  onDrop: (e: React.DragEvent, stageId: StageId) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
}) {
  const Icon = stage.icon;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border/50 bg-muted/30 min-w-[260px] w-[260px] shrink-0 md:w-auto md:min-w-0 md:shrink transition-colors",
        isDragOver && "border-primary/50 bg-primary/5"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border/30">
        <div className={cn("p-1 rounded-md", stage.color + "/10")}>
          <Icon className={cn("h-3.5 w-3.5", stage.color.replace("bg-", "text-"))} />
        </div>
        <span className="text-sm font-medium">{stage.label}</span>
        <Badge
          variant="secondary"
          className="ml-auto text-[10px] px-1.5 py-0 rounded-full"
        >
          {applicants.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {applicants.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Drop applicants here
          </div>
        ) : (
          applicants.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function PipelinePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const postingId = params.id as string;

  const [applicants, setApplicants] = useState<PipelineApplicant[]>([]);
  const [opportunity, setOpportunity] = useState<{ title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedApplicant, setDraggedApplicant] = useState<PipelineApplicant | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageId | null>(null);

  // Fetch applicants and opportunity
  useEffect(() => {
    if (!postingId || !user?.uid) return;

    const fetchData = async () => {
      try {
        // Fetch opportunity
        const oppDoc = await getDoc(doc(db, "opportunities", postingId));
        if (oppDoc.exists()) {
          setOpportunity({ title: oppDoc.data().title });
        }

        // Fetch applicants
        const appsQuery = query(
          collection(db, "applications"),
          where("opportunityId", "==", postingId)
        );
        const snapshot = await getDocs(appsQuery);
        const apps: PipelineApplicant[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as any;
        setApplicants(apps);
      } catch (err) {
        console.error("Error fetching pipeline data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postingId, user?.uid]);

  // Group applicants by stage
  const groupedApplicants = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = applicants.filter((a) => {
        // Map legacy statuses
        if (stage.id === "Submitted") {
          return a.status === "Submitted" || a.status === "Pending" || !a.status;
        }
        if (stage.id === "Hired") {
          return a.status === "Hired" || a.status === "Approved";
        }
        return a.status === stage.id;
      });
      return acc;
    },
    {} as Record<StageId, PipelineApplicant[]>
  );

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, applicant: PipelineApplicant) => {
      setDraggedApplicant(applicant);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", applicant.id);
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStage: StageId) => {
      e.preventDefault();
      setDragOverStage(null);

      if (!draggedApplicant || draggedApplicant.status === targetStage) {
        setDraggedApplicant(null);
        return;
      }

      const applicantId = draggedApplicant.id;
      const previousStatus = draggedApplicant.status;

      // Optimistic update
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === applicantId ? { ...a, status: targetStage } : a
        )
      );

      try {
        // Update Firestore
        const appRef = doc(db, "applications", applicantId);
        await updateDoc(appRef, {
          status: targetStage,
          updatedAt: Timestamp.now(),
        });

        // Send notification to applicant
        createNotification({
          userId: draggedApplicant.userId,
          type: "application_update",
          title: `Application ${targetStage}`,
          message: `Your application for ${opportunity?.title || "a position"} has been moved to ${targetStage}.`,
          link: "/applications",
          actorId: user?.uid,
        });

        toast({
          title: "Status Updated",
          description: `${draggedApplicant.userName} moved to ${targetStage}.`,
        });
      } catch (err) {
        // Revert on error
        setApplicants((prev) =>
          prev.map((a) =>
            a.id === applicantId ? { ...a, status: previousStatus } : a
          )
        );
        toast({
          title: "Error",
          description: "Failed to update status. Please try again.",
          variant: "destructive",
        });
      }

      setDraggedApplicant(null);
    },
    [draggedApplicant, opportunity, user?.uid, toast]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen -m-4 md:-m-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/employer/postings/${postingId}/applicants`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Kanban className="h-5 w-5 text-primary" />
              Hiring Pipeline
            </h1>
            {opportunity && (
              <p className="text-sm text-muted-foreground">{opportunity.title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full">
            <Users className="h-3 w-3 mr-1" />
            {applicants.length} total
          </Badge>
          <Link href={`/employer/postings/${postingId}/applicants`}>
            <Button variant="outline" size="sm" className="rounded-full text-xs">
              List View
            </Button>
          </Link>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 md:grid md:grid-cols-6">
        {PIPELINE_STAGES.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            applicants={groupedApplicants[stage.id] || []}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            isDragOver={dragOverStage === stage.id}
            onDragOver={(e) => {
              handleDragOver(e);
              setDragOverStage(stage.id);
            }}
            onDragLeave={() => setDragOverStage(null)}
          />
        ))}
      </div>
    </div>
  );
}
