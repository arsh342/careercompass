"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Briefcase,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LumaSpin } from "@/components/ui/luma-spin";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Kanban, type CardType, type ColumnType } from "@/components/ui/kanban";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDoc,
  orderBy,
} from "firebase/firestore";

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { saved, toggleSave, loading: savedLoading } = useSavedOpportunities();
  const { toast } = useToast();
  const router = useRouter();

  const [manualCards, setManualCards] = useState<CardType[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [cardToWithdraw, setCardToWithdraw] = useState<CardType | null>(null);

  // New application form state
  const [newApp, setNewApp] = useState({
    jobTitle: "",
    company: "",
    location: "",
    salary: "",
    jobUrl: "",
  });

  // Load manual applications from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const applicationsRef = collection(db, "users", user.uid, "applications");
    
    const unsubscribe = onSnapshot(applicationsRef, (snapshot) => {
      const apps: CardType[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        apps.push({
          id: doc.id,
          title: data.title || data.jobTitle || "Unknown Job",
          company: data.company || "Unknown Company",
          location: data.location,
          column: data.column || data.status || "saved",
          jobUrl: data.jobUrl,
          salary: data.salary,
          isManual: true,
        } as CardType);
      });
      setManualCards(apps);
    }, (error) => {
      console.error("Error loading manual applications:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Load applied jobs from applications collection
  useEffect(() => {
    if (!user) return;

    const fetchAppliedJobs = async () => {
      try {
        const q = query(
          collection(db, "applications"),
          where("userId", "==", user.uid),
          orderBy("submittedAt", "desc")
        );
        const snapshot = await getDocs(q);
        
        const applied: CardType[] = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            let opportunityDetails: { title: string; employerName: string; location: string; employerId?: string } = { 
              title: "Unknown Job", 
              employerName: "Unknown Company", 
              location: "" 
            };
            
            // Fetch opportunity details
            if (data.opportunityId) {
              const oppRef = doc(db, "opportunities", data.opportunityId);
              const oppSnap = await getDoc(oppRef);
              if (oppSnap.exists()) {
                const oppData = oppSnap.data();
                opportunityDetails = {
                  title: oppData.title || "Unknown Job",
                  employerName: oppData.employerName || "Unknown Company",
                  location: oppData.location || "",
                  employerId: oppData.employerId,
                };
              }
            }

            // Map application status to column
            let column: ColumnType = "applied";
            const status = data.status?.toLowerCase();
            if (status === "interview" || status === "under review") column = "interview";
            else if (status === "hired" || status === "accepted" || status === "approved") column = "offer";
            else if (status === "rejected") column = "rejected";

            return {
              id: docSnap.id,
              title: opportunityDetails.title,
              company: opportunityDetails.employerName,
              location: opportunityDetails.location,
              column,
              opportunityId: data.opportunityId,
              isApplied: true,
              // For chat functionality
              applicationId: docSnap.id,
              employerId: opportunityDetails.employerId,
              employerName: opportunityDetails.employerName,
              status: data.status,
            } as CardType;
          })
        );
        
        setAppliedJobs(applied);
        setLoading(false);
      } catch (error) {
        console.error("Error loading applied jobs:", error);
        setLoading(false);
      }
    };

    fetchAppliedJobs();
  }, [user]);

  // Convert saved opportunities to cards
  const savedCards: CardType[] = saved.map((opp) => ({
    id: `saved_${opp.id}`,
    title: opp.title || "Unknown Job",
    company: opp.employerName || opp.company || "Unknown Company",
    location: opp.location,
    column: "saved" as ColumnType,
    opportunityId: opp.id,
    isSaved: true,
  }));

  // Merge all cards (deduplicate by opportunityId)
  // Jobs that are both saved AND applied will only appear in Applied column
  const allCards = [...manualCards];
  
  // Add applied jobs (avoid duplicates)
  appliedJobs.forEach((job) => {
    if (!allCards.find(c => c.id === job.id || (job.opportunityId && c.opportunityId === job.opportunityId))) {
      allCards.push(job);
    }
  });
  
  // Add saved cards (only if not already applied)
  savedCards.forEach((savedCard) => {
    const opportunityId = savedCard.opportunityId;
    if (!allCards.find(c => c.opportunityId === opportunityId)) {
      allCards.push(savedCard);
    }
  });

  // Save manual card to Firestore
  const saveCardToFirestore = useCallback(async (card: CardType) => {
    if (!user) return;
    
    const cardRef = doc(db, "users", user.uid, "applications", card.id);
    await setDoc(cardRef, {
      title: card.title,
      company: card.company,
      location: card.location || null,
      column: card.column,
      jobUrl: card.jobUrl || null,
      salary: card.salary || null,
      updatedAt: new Date(),
    }, { merge: true });
  }, [user]);

  // Delete manual card from Firestore
  const deleteCardFromFirestore = useCallback(async (cardId: string) => {
    if (!user) return;
    
    const cardRef = doc(db, "users", user.uid, "applications", cardId);
    await deleteDoc(cardRef);
  }, [user]);

  // Withdraw application
  const withdrawApplication = async (card: CardType) => {
    if (!user || !card.isApplied) return;
    
    try {
      await deleteDoc(doc(db, "applications", card.id));
      setAppliedJobs(prev => prev.filter(j => j.id !== card.id));
      toast({ title: "Application withdrawn" });
    } catch (error) {
      console.error("Error withdrawing:", error);
      toast({ title: "Failed to withdraw application", variant: "destructive" });
    }
  };

  // Unsave opportunity
  const unsaveOpportunity = (card: CardType) => {
    if (!card.isSaved || !card.opportunityId) return;
    
    const opportunity = saved.find(s => s.id === card.opportunityId);
    if (opportunity) {
      toggleSave(opportunity);
      toast({ title: "Removed from saved" });
    }
  };

  // Handle cards change - sync to Firestore
  const handleSetCards = useCallback(async (newCards: CardType[] | ((prev: CardType[]) => CardType[])) => {
    const updatedCards = typeof newCards === 'function' ? newCards(allCards) : newCards;
    
    // Find deleted cards
    const deletedCards = allCards.filter(
      oldCard => !updatedCards.find(newCard => newCard.id === oldCard.id)
    );
    
    // Handle deletions
    for (const card of deletedCards) {
      if (card.isManual) {
        await deleteCardFromFirestore(card.id);
      } else if (card.isApplied) {
        setCardToWithdraw(card);
        setWithdrawDialogOpen(true);
        return; // Don't proceed with deletion until confirmed
      } else if (card.isSaved) {
        unsaveOpportunity(card);
      }
    }

    // Find changed manual cards
    const changedManualCards = updatedCards.filter(newCard => {
      if (!newCard.isManual && !newCard.id.startsWith('manual_')) return false;
      const oldCard = manualCards.find(c => c.id === newCard.id);
      if (!oldCard) return true;
      return oldCard.column !== newCard.column;
    });

    // Update manual cards state
    setManualCards(prev => {
      const updated = [...prev];
      changedManualCards.forEach(changed => {
        const idx = updated.findIndex(c => c.id === changed.id);
        if (idx >= 0) {
          updated[idx] = changed;
        }
      });
      return updated;
    });

    // Sync manual cards to Firestore
    try {
      for (const card of changedManualCards) {
        await saveCardToFirestore(card);
      }
    } catch (error) {
      console.error("Error syncing to Firestore:", error);
      toast({ title: "Failed to save changes", variant: "destructive" });
    }
  }, [allCards, manualCards, saveCardToFirestore, deleteCardFromFirestore, toast, saved, toggleSave]);

  const handleAddApplication = async () => {
    if (!user || !newApp.jobTitle.trim() || !newApp.company.trim()) {
      toast({ title: "Please fill in job title and company", variant: "destructive" });
      return;
    }

    const newCard: CardType = {
      id: `manual_${crypto.randomUUID()}`,
      title: newApp.jobTitle,
      company: newApp.company,
      location: newApp.location || undefined,
      salary: newApp.salary || undefined,
      jobUrl: newApp.jobUrl || undefined,
      column: "saved" as ColumnType,
      isManual: true,
    };

    try {
      await saveCardToFirestore(newCard);
      setNewApp({ jobTitle: "", company: "", location: "", salary: "", jobUrl: "" });
      setIsAddDialogOpen(false);
      toast({ title: "Application added!" });
    } catch (error) {
      console.error("Error adding application:", error);
      toast({ title: "Failed to add application", variant: "destructive" });
    }
  };

  // Filter cards based on search
  const filteredCards = searchQuery
    ? allCards.filter(
        (card) =>
          card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.company.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allCards;

  // Calculate stats
  const stats = {
    total: allCards.length,
    saved: allCards.filter((c) => c.column === "saved").length,
    applied: allCards.filter((c) => c.column === "applied").length,
    interview: allCards.filter((c) => c.column === "interview").length,
    offer: allCards.filter((c) => c.column === "offer").length,
    rejected: allCards.filter((c) => c.column === "rejected").length,
  };

  if (authLoading || loading || savedLoading) {
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
    <div className="h-full flex flex-col bg-background -m-4 md:-m-6">
      {/* Withdraw Confirmation Dialog */}
      <AlertDialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <AlertDialogContent className="bg-card border-border rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Withdraw Application?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to withdraw your application for {cardToWithdraw?.title} at {cardToWithdraw?.company}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 rounded-full"
              onClick={() => {
                if (cardToWithdraw) {
                  withdrawApplication(cardToWithdraw);
                }
                setWithdrawDialogOpen(false);
                setCardToWithdraw(null);
              }}
            >
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/20 rounded-lg">
                <Briefcase className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Application Tracker</h1>
                <p className="text-sm text-muted-foreground">
                  {stats.total} total • {stats.applied} applied • {stats.interview} interviews • {stats.offer} offers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs..."
                  className="pl-9 w-64 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-violet-600 hover:bg-violet-700 rounded-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Application
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Add New Application</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Track a new job application
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Job Title *</Label>
                      <Input
                        value={newApp.jobTitle}
                        onChange={(e) => setNewApp({ ...newApp, jobTitle: e.target.value })}
                        placeholder="Software Engineer"
                        className="bg-muted border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Company *</Label>
                      <Input
                        value={newApp.company}
                        onChange={(e) => setNewApp({ ...newApp, company: e.target.value })}
                        placeholder="Google"
                        className="bg-muted border-border text-foreground"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Location</Label>
                        <Input
                          value={newApp.location}
                          onChange={(e) => setNewApp({ ...newApp, location: e.target.value })}
                          placeholder="San Francisco, CA"
                          className="bg-muted border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Salary</Label>
                        <Input
                          value={newApp.salary}
                          onChange={(e) => setNewApp({ ...newApp, salary: e.target.value })}
                          placeholder="$120k - $150k"
                          className="bg-muted border-border text-foreground"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Job URL</Label>
                      <Input
                        value={newApp.jobUrl}
                        onChange={(e) => setNewApp({ ...newApp, jobUrl: e.target.value })}
                        placeholder="https://..."
                        className="bg-muted border-border text-foreground"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border text-foreground rounded-full">
                      Cancel
                    </Button>
                    <Button onClick={handleAddApplication} className="bg-violet-600 hover:bg-violet-700 rounded-full">
                      Add Application
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-auto">
        <Kanban 
          cards={filteredCards} 
          setCards={handleSetCards}
          className="min-h-full"
          onChat={(card) => {
            // Navigate to chat room with employer
            if (card.employerId && card.opportunityId && card.applicationId) {
              const params = new URLSearchParams({
                userId: card.employerId,
                userName: card.employerName || card.company,
                opportunityId: card.opportunityId,
                opportunityTitle: card.title,
                applicationId: card.applicationId,
              });
              router.push(`/chat/new?${params.toString()}`);
            } else {
              toast({ 
                title: "Cannot start chat", 
                description: "Missing employer information for this application.",
                variant: "destructive"
              });
            }
          }}
        />
      </div>
    </div>
  );
}
