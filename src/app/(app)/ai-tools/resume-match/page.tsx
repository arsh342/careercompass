"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { postAiJson } from "@/lib/ai-api-client";
import type {
  ResumeMatchAnalysisOutput,
  SavedJobDescription,
} from "@/lib/ai-tool-contracts";
import { useRateLimit, AI_RATE_LIMITS, formatTimeUntilReset } from "@/hooks/useRateLimit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LumaSpin } from "@/components/ui/luma-spin";
import { AILoader } from "@/components/ui/ai-loader";
import {
  ChevronRight,
  FileUp,
  Save,
  Sparkles,
  Target,
  ScanSearch,
  FileText,
  Upload,
  Download,
  Trash2,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  RefreshCcw,
} from "lucide-react";

interface PdfLine {
  id: string;
  pageNumber: number;
  text: string;
  editedText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

interface PdfPageModel {
  pageNumber: number;
  width: number;
  height: number;
  imageDataUrl: string;
  lines: PdfLine[];
}

type EditableSections = {
  summary: string;
  skills: string;
  experience: string;
  education: string;
};

async function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read the selected file."));
    reader.readAsDataURL(file);
  });
}

function groupPdfItemsIntoLines(items: Array<Record<string, unknown>>) {
  const sorted = items
    .filter((item) => typeof item.str === "string" && item.str.trim().length > 0)
    .sort((a, b) => {
      const ay = Number(a.top || 0);
      const by = Number(b.top || 0);
      if (Math.abs(ay - by) > 3) {
        return ay - by;
      }
      return Number(a.x || 0) - Number(b.x || 0);
    });

  const lines: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
  }> = [];

  for (const item of sorted) {
    const text = String(item.str || "").trim();
    const x = Number(item.x || 0);
    const y = Number(item.top || 0);
    const width = Number(item.width || 0);
    const height = Number(item.height || 0);
    const fontSize = Number(item.fontSize || height || 12);

    const current = lines[lines.length - 1];
    if (current && Math.abs(current.y - y) < 4) {
      const gap = x - (current.x + current.width);
      current.text += gap > 10 ? ` ${text}` : text;
      current.width = Math.max(current.width, x + width - current.x);
      current.height = Math.max(current.height, height);
      current.fontSize = Math.max(current.fontSize, fontSize);
      continue;
    }

    lines.push({
      text,
      x,
      y,
      width,
      height,
      fontSize,
    });
  }

  return lines;
}

export default function ResumeMatchPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const isPremium = userProfile?.plan === "premium" || userProfile?.plan === "pro";
  const rateLimit = useRateLimit("resumeMatch", AI_RATE_LIMITS.resumeMatch, isPremium);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [savedDescriptions, setSavedDescriptions] = useState<SavedJobDescription[]>([]);
  const [selectedSavedDescriptionId, setSelectedSavedDescriptionId] = useState<string>("");
  const [result, setResult] = useState<ResumeMatchAnalysisOutput | null>(null);
  const [editableSections, setEditableSections] = useState<EditableSections | null>(null);
  const [pdfPages, setPdfPages] = useState<PdfPageModel[]>([]);
  const [selectedPageNumber, setSelectedPageNumber] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const selectedPage = useMemo(
    () => pdfPages.find((page) => page.pageNumber === selectedPageNumber) || null,
    [pdfPages, selectedPageNumber]
  );

  const canPreserveLayout = resumeFile?.type === "application/pdf" && pdfPages.length > 0;

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadSavedDescriptions() {
      try {
        const response = await fetch("/api/ai/saved-job-descriptions");
        const data = (await response.json()) as { items?: SavedJobDescription[] };
        if (!cancelled && Array.isArray(data.items)) {
          setSavedDescriptions(data.items);
        }
      } catch (error) {
        console.error("Failed to load saved job descriptions:", error);
      }
    }

    loadSavedDescriptions();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!result) return;
    setEditableSections({
      summary: result.parsedResume.careerGoals || "",
      skills: result.parsedResume.skills || "",
      experience: result.parsedResume.employmentHistory || "",
      education: result.parsedResume.education || "",
    });
  }, [result]);

  const handleSelectSavedDescription = (savedId: string) => {
    setSelectedSavedDescriptionId(savedId);
    const saved = savedDescriptions.find((item) => item.id === savedId);
    if (!saved) return;
    setJobTitle(saved.title);
    setJobDescriptionText(saved.text);
    setJobDescriptionFile(null);
  };

  const preparePdfResume = async (file: File) => {
    setIsPreparingPdf(true);
    try {
      const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      const data = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data });
      const pdf = await loadingTask.promise;
      const nextPages: PdfPageModel[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.7 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Unable to render the uploaded PDF.");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({ canvasContext: context, viewport }).promise;
        const textContent = await page.getTextContent();
        const items = (textContent.items as Array<Record<string, unknown>>).map((item, index) => {
          const transform = pdfjs.Util.transform(viewport.transform, item.transform as number[]);
          const x = transform[4];
          const y = transform[5];
          const fontSize = Math.max(10, Math.hypot(transform[2], transform[3]));
          const width = Number(item.width || 0) * viewport.scale;
          const height = Math.max(fontSize, Number(item.height || fontSize));

          return {
            ...item,
            index,
            x,
            top: y - height,
            width,
            height,
            fontSize,
          };
        });

        const lines = groupPdfItemsIntoLines(items).map((line, index) => ({
          id: `p${pageNumber}_l${index}`,
          pageNumber,
          text: line.text,
          editedText: line.text,
          x: line.x,
          y: line.y,
          width: line.width,
          height: line.height,
          fontSize: line.fontSize,
        }));

        nextPages.push({
          pageNumber,
          width: canvas.width,
          height: canvas.height,
          imageDataUrl: canvas.toDataURL("image/png"),
          lines,
        });
      }

      setPdfPages(nextPages);
      setSelectedPageNumber(1);
    } catch (error) {
      console.error("Failed to prepare PDF resume:", error);
      setPdfPages([]);
      toast({
        title: "PDF preview unavailable",
        description:
          "The resume can still be analyzed, but layout-preserving PDF export is unavailable for this file.",
        variant: "destructive",
      });
    } finally {
      setIsPreparingPdf(false);
    }
  };

  const handleResumeFileChange = async (file: File | null) => {
    setResumeFile(file);
    setResult(null);
    setEditableSections(null);
    if (!file) {
      setPdfPages([]);
      return;
    }

    if (file.type === "application/pdf") {
      await preparePdfResume(file);
      return;
    }

    setPdfPages([]);
  };

  const handleSaveDescription = async () => {
    if (!jobDescriptionText.trim() && !jobDescriptionFile) {
      toast({
        title: "Nothing to save",
        description: "Paste a job description or upload a file first.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDescription(true);
    try {
      const payload: Record<string, string> = {
        title: jobTitle.trim(),
        text: jobDescriptionText.trim(),
      };

      if (jobDescriptionFile) {
        payload.fileName = jobDescriptionFile.name;
        if (!jobDescriptionText.trim()) {
          payload.documentDataUri = await fileToDataUri(jobDescriptionFile);
        }
      }

      const response = await fetch("/api/ai/saved-job-descriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Failed to save.");
      }

      const reload = await fetch("/api/ai/saved-job-descriptions");
      const list = (await reload.json()) as { items?: SavedJobDescription[] };
      setSavedDescriptions(Array.isArray(list.items) ? list.items : []);
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not save the job description.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleDeleteDescription = async (id: string) => {
    try {
      const response = await fetch("/api/ai/saved-job-descriptions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Delete failed.");
      }

      const next = savedDescriptions.filter((item) => item.id !== id);
      setSavedDescriptions(next);
      if (selectedSavedDescriptionId === id) {
        setSelectedSavedDescriptionId("");
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not remove the saved job description.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!rateLimit.canProceed) {
      toast({
        title: "Rate Limit Reached",
        description: `You've reached your limit. Try again in ${formatTimeUntilReset(
          rateLimit.timeUntilReset
        )}.`,
        variant: "destructive",
      });
      return;
    }

    if (!resumeFile) {
      toast({
        title: "Resume required",
        description: "Upload your current resume to analyze its job alignment.",
        variant: "destructive",
      });
      return;
    }

    if (!jobDescriptionText.trim() && !jobDescriptionFile) {
      toast({
        title: "Job description required",
        description: "Paste a job description or upload a JD file.",
        variant: "destructive",
      });
      return;
    }

    rateLimit.increment();
    setIsAnalyzing(true);

    try {
      const payload: Record<string, string> = {
        resumeDataUri: await fileToDataUri(resumeFile),
        jobTitle: jobTitle.trim(),
        jobDescriptionText: jobDescriptionText.trim(),
      };

      if (jobDescriptionFile) {
        payload.jobDescriptionFileName = jobDescriptionFile.name;
        if (!jobDescriptionText.trim()) {
          payload.jobDescriptionDataUri = await fileToDataUri(jobDescriptionFile);
        }
      }

      const analysis = await postAiJson<ResumeMatchAnalysisOutput>("/api/ai/resume-match", payload);
      setResult(analysis);
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updatePdfLine = (pageNumber: number, lineId: string, value: string) => {
    setPdfPages((currentPages) =>
      currentPages.map((page) => {
        if (page.pageNumber !== pageNumber) return page;
        return {
          ...page,
          lines: page.lines.map((line) =>
            line.id === lineId ? { ...line, editedText: value } : line
          ),
        };
      })
    );
  };

  const editedLineCount = useMemo(
    () =>
      pdfPages.reduce(
        (count, page) =>
          count + page.lines.filter((line) => line.editedText.trim() !== line.text.trim()).length,
        0
      ),
    [pdfPages]
  );

  const handleDownloadPdf = async () => {
    if (!resumeFile || !canPreserveLayout || pdfPages.length === 0) {
      toast({
        title: "PDF export unavailable",
        description:
          "Layout-preserving export currently works only for uploaded PDF resumes that can be rendered on-page.",
        variant: "destructive",
      });
      return;
    }

    setIsExportingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const firstPage = pdfPages[0];
      const pdf = new jsPDF({
        unit: "px",
        format: [firstPage.width, firstPage.height],
        orientation: firstPage.width > firstPage.height ? "landscape" : "portrait",
      });

      const fitTextToWidth = (doc: InstanceType<typeof jsPDF>, text: string, maxWidth: number, startSize: number) => {
        let fontSize = Math.max(6, startSize);
        doc.setFontSize(fontSize);
        while (fontSize > 6 && doc.getTextWidth(text) > maxWidth) {
          fontSize -= 0.5;
          doc.setFontSize(fontSize);
        }

        let nextText = text;
        while (nextText.length > 0 && doc.getTextWidth(nextText) > maxWidth) {
          nextText = `${nextText.slice(0, -1).trimEnd()}…`;
        }

        return { text: nextText, fontSize };
      };

      pdfPages.forEach((page, pageIndex) => {
        if (pageIndex > 0) {
          pdf.addPage(
            [page.width, page.height],
            page.width > page.height ? "landscape" : "portrait"
          );
          pdf.setPage(pageIndex + 1);
        }

        pdf.addImage(page.imageDataUrl, "PNG", 0, 0, page.width, page.height);
        pdf.setTextColor(20, 20, 20);

        page.lines.forEach((line) => {
          if (line.editedText.trim() === line.text.trim()) {
            return;
          }

          const { text, fontSize } = fitTextToWidth(
            pdf,
            line.editedText.trim(),
            Math.max(20, line.width),
            Math.max(8, line.fontSize * 0.82)
          );

          pdf.setFillColor(255, 255, 255);
          pdf.rect(line.x - 1, line.y - 1, line.width + 2, line.height + 2, "F");
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(fontSize);
          pdf.text(text, line.x, line.y + line.height * 0.78, {
            baseline: "alphabetic",
          });
        });
      });

      const fileNameBase = resumeFile.name.replace(/\.[^.]+$/, "") || "resume";
      pdf.save(`${fileNameBase}_tailored.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      toast({
        title: "Export failed",
        description: "Could not generate the revised PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

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
        <p className="text-muted-foreground mb-6">
          Please log in to access the Resume Match Analyzer.
        </p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 relative">
      {(isAnalyzing || isPreparingPdf || isExportingPdf) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative z-10">
            <AILoader
              text={isAnalyzing ? "Analyzing" : isPreparingPdf ? "Preparing PDF" : "Exporting"}
              size={160}
            />
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/ai-tools" className="hover:text-primary">
            LaunchPad
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>Resume Match Analyzer</span>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <ScanSearch className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Resume Match Analyzer</h1>
              <p className="text-muted-foreground max-w-2xl">
                Compare your resume against a target role, keep your original PDF layout, and
                revise text without redesigning the document.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-4 py-1">
              <Target className="mr-1 h-3.5 w-3.5" />
              Layout-preserving PDF workflow
            </Badge>
            <Badge variant="outline" className="rounded-full px-4 py-1">
              {rateLimit.remaining} AI runs left
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="rounded-[28px] border-zinc-800/80 bg-zinc-950 text-zinc-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-emerald-400" />
                Resume Source
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Upload your current resume. PDF resumes unlock layout-preserving export.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[24px] border border-dashed border-zinc-700 bg-zinc-900/80 p-5">
                <Label htmlFor="resume-upload" className="text-zinc-300">
                  Resume file
                </Label>
                <Input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="mt-3 rounded-2xl border-zinc-700 bg-zinc-900 text-zinc-50 file:text-zinc-50"
                  onChange={(event) => handleResumeFileChange(event.target.files?.[0] || null)}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {resumeFile ? (
                    <Badge className="rounded-full bg-zinc-100 text-zinc-900 hover:bg-zinc-100">
                      {resumeFile.name}
                    </Badge>
                  ) : null}
                  <Badge variant="outline" className="rounded-full border-zinc-700 text-zinc-300">
                    {canPreserveLayout ? "Original layout available" : "PDF required for layout lock"}
                  </Badge>
                </div>
              </div>

              {resumeFile && !canPreserveLayout && !isPreparingPdf ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      This file can still be analyzed, but exact visual preservation during export is
                      only available for uploaded PDFs that can be rendered into the on-page editor.
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[28px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-500" />
                Job Description
              </CardTitle>
              <CardDescription>
                Paste the JD, upload the source file, or reuse a saved description.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-2">
                  <Label>Role title</Label>
                  <Input
                    value={jobTitle}
                    onChange={(event) => setJobTitle(event.target.value)}
                    placeholder="Senior Product Designer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saved descriptions</Label>
                  <Select value={selectedSavedDescriptionId} onValueChange={handleSelectSavedDescription}>
                    <SelectTrigger>
                      <SelectValue placeholder="Reuse a saved JD" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedDescriptions.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No saved JDs yet
                        </SelectItem>
                      ) : (
                        savedDescriptions.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Paste job description</Label>
                <Textarea
                  value={jobDescriptionText}
                  onChange={(event) => setJobDescriptionText(event.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={10}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="jd-upload">Upload JD file</Label>
                  <Input
                    id="jd-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(event) => setJobDescriptionFile(event.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={isSavingDescription}
                    onClick={handleSaveDescription}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save JD
                  </Button>
                </div>
              </div>

              {savedDescriptions.length > 0 ? (
                <div className="space-y-2">
                  <Label>Saved library</Label>
                  <ScrollArea className="h-40 rounded-2xl border">
                    <div className="space-y-2 p-3">
                      {savedDescriptions.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-3 rounded-2xl border bg-background p-3"
                        >
                          <button
                            type="button"
                            className="min-w-0 text-left"
                            onClick={() => handleSelectSavedDescription(item.id)}
                          >
                            <p className="font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.text}
                            </p>
                          </button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="shrink-0 rounded-full"
                            onClick={() => handleDeleteDescription(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : null}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || isPreparingPdf}
                className="w-full rounded-full"
                size="lg"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Resume Match
              </Button>
            </CardFooter>
          </Card>

          {result && editableSections ? (
            <Card className="rounded-[28px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-violet-500" />
                  Revision Suggestions
                </CardTitle>
                <CardDescription>
                  Keep the design, tighten the wording. Edit the parsed content and use the PDF line
                  editor below if you need layout-preserving export.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Alignment summary
                    </p>
                    <p className="mt-3 text-sm leading-6">{result.suggestions.summary}</p>
                  </div>
                  <div className="rounded-3xl border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Quick wins
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.suggestions.quickWins.map((item) => (
                        <Badge key={item} variant="secondary" className="rounded-full px-3 py-1">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Career summary</Label>
                    <Textarea
                      rows={5}
                      value={editableSections.summary}
                      onChange={(event) =>
                        setEditableSections((current) =>
                          current ? { ...current, summary: event.target.value } : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Skills block</Label>
                    <Textarea
                      rows={5}
                      value={editableSections.skills}
                      onChange={(event) =>
                        setEditableSections((current) =>
                          current ? { ...current, skills: event.target.value } : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Experience block</Label>
                    <Textarea
                      rows={8}
                      value={editableSections.experience}
                      onChange={(event) =>
                        setEditableSections((current) =>
                          current ? { ...current, experience: event.target.value } : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Education block</Label>
                    <Textarea
                      rows={8}
                      value={editableSections.education}
                      onChange={(event) =>
                        setEditableSections((current) =>
                          current ? { ...current, education: event.target.value } : current
                        )
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  {result.suggestions.sectionSuggestions.map((item) => (
                    <div key={`${item.section}-${item.currentFocus}`} className="rounded-3xl border p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-full uppercase">
                          {item.section}
                        </Badge>
                        <Badge variant="secondary" className="rounded-full">
                          {item.priority} priority
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm font-medium">{item.currentFocus}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.rationale}</p>
                      <div className="mt-3 rounded-2xl bg-muted/30 p-3 text-sm leading-6">
                        {item.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {result ? (
            <Card className="rounded-[32px] border-0 bg-[radial-gradient(circle_at_top,rgba(70,70,90,0.22),transparent_55%),linear-gradient(135deg,#0b0d12_0%,#11141b_52%,#141922_100%)] text-zinc-50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Match Score</span>
                  <Badge
                    className="rounded-full px-4 py-1 text-sm"
                    variant={
                      result.match.recommendation === "strong-match"
                        ? "default"
                        : result.match.recommendation === "good-match"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {result.match.recommendation.replace("-", " ")}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  {result.jobTitle || "Target role"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                        Alignment
                      </p>
                      <p className="mt-2 text-6xl font-semibold tracking-tight">
                        {result.match.overallScore}
                        <span className="text-2xl text-zinc-400">%</span>
                      </p>
                    </div>
                    <CircleDashed className="h-10 w-10 text-emerald-400" />
                  </div>
                  <Progress value={result.match.overallScore} className="mt-5 h-3 rounded-full" />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Matched</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.match.breakdown.skills.matched.map((skill) => (
                        <Badge key={skill} className="rounded-full bg-emerald-500/15 text-emerald-200">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Missing</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.match.breakdown.skills.missing.map((skill) => (
                        <Badge key={skill} className="rounded-full bg-amber-500/15 text-amber-100">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Keyword targets</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.suggestions.keywordTargets.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="rounded-full border-zinc-700 text-zinc-100">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Cover-letter focus
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                      {result.match.coverLetterFocus.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-[28px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Layout-Preserving Editor
              </CardTitle>
              <CardDescription>
                Edit extracted PDF lines and export a revised PDF that keeps the original page visuals
                underneath.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canPreserveLayout && selectedPage ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full">
                        {pdfPages.length} page{pdfPages.length > 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline" className="rounded-full">
                        {editedLineCount} edited line{editedLineCount === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={String(selectedPageNumber)}
                        onValueChange={(value) => setSelectedPageNumber(Number(value))}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select page" />
                        </SelectTrigger>
                        <SelectContent>
                          {pdfPages.map((page) => (
                            <SelectItem key={page.pageNumber} value={String(page.pageNumber)}>
                              Page {page.pageNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        className="rounded-full"
                        onClick={handleDownloadPdf}
                        disabled={isExportingPdf}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-[28px] border bg-muted/20 p-3">
                    <div className="relative overflow-hidden rounded-[22px] border bg-white">
                      <img
                        src={selectedPage.imageDataUrl}
                        alt={`Resume page ${selectedPage.pageNumber}`}
                        className="block h-auto w-full"
                      />
                      <div className="absolute inset-0">
                        {selectedPage.lines
                          .filter((line) => line.editedText.trim() !== line.text.trim())
                          .map((line) => (
                            <div
                              key={line.id}
                              className="absolute overflow-hidden bg-white/95 text-[#111827]"
                              style={{
                                left: line.x,
                                top: line.y,
                                width: line.width,
                                minHeight: line.height,
                                fontSize: Math.max(9, line.fontSize * 0.6),
                                lineHeight: `${Math.max(12, line.height * 0.95)}px`,
                              }}
                            >
                              {line.editedText}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="h-[28rem] rounded-[24px] border">
                    <div className="space-y-3 p-4">
                      {selectedPage.lines.map((line, index) => (
                        <div key={line.id} className="rounded-3xl border p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <Badge variant="outline" className="rounded-full">
                              Line {index + 1}
                            </Badge>
                            {line.editedText.trim() !== line.text.trim() ? (
                              <Badge className="rounded-full bg-emerald-500/15 text-emerald-700">
                                Updated
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mb-2 text-xs text-muted-foreground line-clamp-2">{line.text}</p>
                          <Input
                            value={line.editedText}
                            onChange={(event) =>
                              updatePdfLine(selectedPage.pageNumber, line.id, event.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="rounded-[24px] border border-dashed p-6 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Upload a PDF resume to unlock the layout-preserving editor and PDF export. DOC,
                      DOCX, and TXT resumes can still be analyzed, but the exported file cannot keep
                      the original page visuals nearly unchanged.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
