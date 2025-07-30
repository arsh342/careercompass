"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useTransition, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateProfileSummary } from "@/ai/flows/generate-profile-summary";
import { enhanceText } from "@/ai/flows/enhance-text";
import { parseResume } from "@/ai/flows/parse-resume";
import { ComprehensiveATSScorer } from "@/lib/comprehensiveAtsScorer";
import { Bot, Loader2, Edit, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const employabilityOptions = [
  { value: "open_to_work", label: "Open to Work" },
  { value: "employed", label: "Employed" },
  { value: "freelancer", label: "Freelancer" },
  { value: "looking_for_new_job", label: "Looking for New Job" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
];

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  middleName: z.string().optional(),
  contactNumber: z.string().optional(),
  supportEmail: z.string().email().optional().or(z.literal("")),
  education: z.string().min(1, "Education is required."),
  skills: z.string().min(1, "Skills are required."),
  interests: z.string().min(1, "Interests are required."),
  careerGoals: z.string().min(1, "Career goals are required."),
  employmentHistory: z.string().optional(),
  references: z.string().optional(),
  portfolioLink: z.string().url().optional().or(z.literal("")),
  linkedinLink: z.string().url().optional().or(z.literal("")),
  employability: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  // ATS Score Checker State
  const [atsResumeText, setAtsResumeText] = useState("");
  const [atsResumeFile, setAtsResumeFile] = useState<File | null>(null);
  const [atsSuggestions, setAtsSuggestions] = useState<string>("");
  const [atsJobDesc, setAtsJobDesc] = useState("");
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsConfidence, setAtsConfidence] = useState<
    "High" | "Medium" | "Low" | null
  >(null);
  const [atsCategoryScores, setAtsCategoryScores] = useState<any>(null);
  const [atsMatched, setAtsMatched] = useState<any>(null);
  const [atsMissing, setAtsMissing] = useState<any>(null);

  // ATS Score calculation with AI resume parsing and advanced scoring
  const handleAtsScore = async () => {
    setAtsLoading(true);
    setAtsSuggestions("");
    setAtsConfidence(null);
    setAtsCategoryScores(null);
    setAtsMatched(null);
    setAtsMissing(null);
    let resumeText = atsResumeText;
    // If file uploaded, parse it
    if (atsResumeFile) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const fileText = e.target?.result as string;
          let parsedText = fileText;
          try {
            // Use AI resume parser if available
            const parsed = await parseResume({ resumeDataUri: fileText });
            parsedText = [
              parsed.education,
              parsed.skills,
              parsed.interests,
              parsed.careerGoals,
              parsed.employmentHistory,
            ]
              .filter(Boolean)
              .join(" ");
          } catch {}
          // Debug: log parsedText and atsJobDesc
          // @ts-ignore
          if (typeof window !== "undefined") {
            // eslint-disable-next-line no-console
            console.log("[ATS DEBUG] Resume text:", parsedText);
            // eslint-disable-next-line no-console
            console.log("[ATS DEBUG] Job description:", atsJobDesc);
          }
          if (!parsedText.trim() || !atsJobDesc.trim()) {
            setAtsLoading(false);
            setAtsScore(null);
            setAtsSuggestions(
              "Please provide both a resume and a job description."
            );
            return;
          }
          scoreAndSuggest(parsedText);
        };
        reader.readAsText(atsResumeFile);
        return;
      } catch (err) {
        setAtsLoading(false);
        setAtsSuggestions("Could not read resume file.");
        return;
      }
    } else {
      // Debug: log resumeText and atsJobDesc
      // @ts-ignore
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.log("[ATS DEBUG] Resume text:", resumeText);
        // eslint-disable-next-line no-console
        console.log("[ATS DEBUG] Job description:", atsJobDesc);
      }
      if (!resumeText.trim() || !atsJobDesc.trim()) {
        setAtsLoading(false);
        setAtsScore(null);
        setAtsSuggestions(
          "Please provide both a resume and a job description."
        );
        return;
      }
      scoreAndSuggest(resumeText);
    }
  };

  function scoreAndSuggest(resumeText: string) {
    if (!resumeText.trim() || !atsJobDesc.trim()) {
      setAtsScore(null);
      setAtsSuggestions("");
      setAtsConfidence(null);
      setAtsCategoryScores(null);
      setAtsMatched(null);
      setAtsMissing(null);
      setAtsLoading(false);
      return;
    }
    const scorer = new ComprehensiveATSScorer();
    const result = scorer.calculateComprehensiveScore(resumeText, atsJobDesc);
    setAtsScore(result.overallScore);
    setAtsConfidence(result.confidenceLevel);
    setAtsCategoryScores(result.categoryScores);
    setAtsMatched(result.matched);
    setAtsMissing(result.missing);
    setAtsSuggestions(result.suggestions.join("\n"));
    setAtsLoading(false);
  }
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      contactNumber: "",
      supportEmail: "",
      education: "",
      skills: "",
      interests: "",
      careerGoals: "",
      employmentHistory: "",
      references: "",
      portfolioLink: "",
      linkedinLink: "",
      employability: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      const {
        firstName,
        lastName,
        middleName,
        contactNumber,
        supportEmail,
        education,
        skills,
        interests,
        careerGoals,
        employmentHistory,
        references,
        portfolioLink,
        linkedinLink,
        employability,
      } = userProfile;
      form.reset({
        firstName,
        lastName,
        middleName,
        contactNumber,
        supportEmail,
        education,
        skills,
        interests,
        careerGoals,
        employmentHistory,
        references,
        portfolioLink,
        linkedinLink,
        employability,
      });
    }
  }, [userProfile, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      });
      return;
    }
    try {
      const newDisplayName = `${values.firstName} ${values.lastName}`.trim();

      if (user.displayName !== newDisplayName) {
        await updateProfile(user, { displayName: newDisplayName });
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          ...userProfile,
          ...values,
          displayName: newDisplayName,
        },
        { merge: true }
      );

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    }
  };

  const onGenerateSummary = () => {
    const values = form.getValues();
    const result = profileSchema.safeParse(values);
    if (!result.success) {
      const firstErrorField = Object.keys(
        result.error.format()
      )[0] as keyof ProfileFormValues;

      if (firstErrorField) {
        form.trigger(firstErrorField);
      }

      toast({
        title: "Incomplete Profile",
        description:
          "Please fill out all required fields before generating a summary.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const { summary } = await generateProfileSummary({
        education: values.education,
        skills: values.skills,
        interests: values.interests,
        careerGoals: values.careerGoals,
      });
      setSummary(summary);
      toast({
        title: "Summary Generated",
        description: "Your AI-powered profile summary is ready.",
      });
    });
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user.uid);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await response.json();

      await updateProfile(user, { photoURL: url });
      await setDoc(
        doc(db, "users", user.uid),
        { photoURL: url },
        { merge: true }
      );

      toast({
        title: "Profile Picture Updated",
        description: "Your new picture has been saved.",
      });
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload profile picture.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEnhanceText = (
    fieldName: keyof ProfileFormValues,
    context: string
  ) => {
    startTransition(async () => {
      const currentValue = form.getValues(fieldName);
      if (typeof currentValue !== "string" || !currentValue.trim()) {
        toast({
          title: "Cannot Enhance",
          description: "Field must not be empty.",
          variant: "destructive",
        });
        return;
      }
      try {
        const { enhancedText } = await enhanceText({
          text: currentValue,
          context,
        });
        form.setValue(fieldName, enhancedText);
        toast({
          title: "Content Enhanced",
          description: "The content has been improved by AI.",
        });
      } catch (error) {
        console.error("Enhancement failed:", error);
        toast({
          title: "Error",
          description: "Could not enhance text at this time.",
          variant: "destructive",
        });
      }
    });
  };

  const handleResumeParse = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const resumeDataUri = e.target?.result as string;
          if (resumeDataUri) {
            toast({
              title: "Parsing Resume...",
              description:
                "AI is extracting information from your resume. This may take a moment.",
            });
            const parsedData = await parseResume({ resumeDataUri });

            form.setValue("education", parsedData.education);
            form.setValue("skills", parsedData.skills);
            form.setValue("interests", parsedData.interests);
            form.setValue("careerGoals", parsedData.careerGoals);
            form.setValue("employmentHistory", parsedData.employmentHistory);

            toast({
              title: "Resume Parsed",
              description:
                "Your profile has been updated with information from your resume.",
            });
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Resume parsing failed:", error);
        toast({
          title: "Error",
          description: "Could not parse the resume at this time.",
          variant: "destructive",
        });
      }
    });
  };

  if (authLoading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and career preferences.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={user?.photoURL || ""}
                      alt="Profile picture"
                      data-ai-hint="profile avatar"
                    />
                    <AvatarFallback className="text-3xl">
                      {user?.displayName ? getInitials(user.displayName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4" />
                    )}
                    <span className="sr-only">Edit profile picture</span>
                  </Button>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-semibold">{user?.displayName}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middle Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Michael" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="(123) 456-7890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="support@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          A public email for support inquiries.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Employability</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {employabilityOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Let employers know your current work status.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
              <CardDescription>
                This information will be used to match you with opportunities
                and pre-fill applications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              placeholder="e.g., B.S. in Computer Science..."
                              {...field}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleEnhanceText(
                                  "education",
                                  "Education History"
                                )
                              }
                              disabled={isPending}
                              className="absolute bottom-2 right-2"
                            >
                              <Bot className="mr-2 h-4 w-4" />
                              {isPending ? "Enhancing..." : "Enhance"}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              placeholder="e.g., React, Python, Project Management..."
                              {...field}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleEnhanceText("skills", "Skills List")
                              }
                              disabled={isPending}
                              className="absolute bottom-2 right-2"
                            >
                              <Bot className="mr-2 h-4 w-4" />
                              {isPending ? "Enhancing..." : "Enhance"}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Comma-separated skills.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interests</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              placeholder="e.g., UI/UX Design, Open Source, Volunteering..."
                              {...field}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleEnhanceText(
                                  "interests",
                                  "Personal Interests"
                                )
                              }
                              disabled={isPending}
                              className="absolute bottom-2 right-2"
                            >
                              <Bot className="mr-2 h-4 w-4" />
                              {isPending ? "Enhancing..." : "Enhance"}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="careerGoals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Career Goals</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              placeholder="e.g., Secure a full-time role in software engineering..."
                              {...field}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleEnhanceText("careerGoals", "Career Goals")
                              }
                              disabled={isPending}
                              className="absolute bottom-2 right-2"
                            >
                              <Bot className="mr-2 h-4 w-4" />
                              {isPending ? "Enhancing..." : "Enhance"}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employmentHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment History</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              placeholder="List your previous roles, companies, and key achievements."
                              {...field}
                              rows={6}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleEnhanceText(
                                  "employmentHistory",
                                  "Employment History"
                                )
                              }
                              disabled={isPending}
                              className="absolute bottom-2 right-2"
                            >
                              <Bot className="mr-2 h-4 w-4" />
                              {isPending ? "Enhancing..." : "Enhance"}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Use bullet points for clarity.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="references"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>References</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide contact information for your professional references."
                            {...field}
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          e.g., Name, Title, Company, Email, Phone.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="portfolioLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portfolio Link (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://your-portfolio.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkedinLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn Profile (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://linkedin.com/in/your-profile"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>AI Resume Parser</CardTitle>
              <CardDescription>
                Upload your resume to automatically fill out your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                className="w-full"
                onClick={() => resumeInputRef.current?.click()}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload Resume
              </Button>
              <Input
                type="file"
                ref={resumeInputRef}
                className="hidden"
                onChange={handleResumeParse}
                accept=".pdf,.doc,.docx,.txt"
              />
            </CardContent>
          </Card>
          {/* ATS Score Checker Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>ATS Score Checker</CardTitle>
              <CardDescription>
                Check how well your resume matches a job description. Upload
                your resume and paste a job description to get an ATS (Applicant
                Tracking System) score.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setAtsResumeFile(file);
                    setAtsResumeText("");
                  }}
                />
                <Textarea
                  placeholder="Paste job description here..."
                  rows={5}
                  value={atsJobDesc}
                  onChange={(e) => setAtsJobDesc(e.target.value)}
                />
                <Button
                  onClick={handleAtsScore}
                  disabled={
                    atsLoading ||
                    (!atsResumeText && !atsResumeFile) ||
                    !atsJobDesc
                  }
                >
                  {atsLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Check ATS Score
                </Button>
                {atsScore !== null && (
                  <div className="text-center mt-2">
                    <span className="font-semibold">ATS Score: </span>
                    <span className="text-primary text-lg">{atsScore}%</span>
                    {atsConfidence && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({atsConfidence} match)
                      </span>
                    )}
                  </div>
                )}
                {atsCategoryScores && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <b>Category Breakdown:</b>
                    <ul className="ml-2">
                      {Object.entries(atsCategoryScores).map(([cat, val]) => (
                        <li key={cat}>
                          {cat}: {Math.round(val as number)}%
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {atsMatched && (
                  <div className="mt-2 text-xs text-green-700">
                    <b>Matched:</b>
                    <ul className="ml-2">
                      {Object.entries(atsMatched).map(([cat, arr]) =>
                        Array.isArray(arr) && arr.length > 0 ? (
                          <li key={cat}>
                            {cat}: {arr.slice(0, 8).join(", ")}
                            {arr.length > 8 ? "..." : ""}
                          </li>
                        ) : null
                      )}
                    </ul>
                  </div>
                )}
                {atsMissing && (
                  <div className="mt-2 text-xs text-red-700">
                    <b>Missing:</b>
                    <ul className="ml-2">
                      {Object.entries(atsMissing).map(([cat, arr]) =>
                        Array.isArray(arr) && arr.length > 0 ? (
                          <li key={cat}>
                            {cat}: {arr.slice(0, 8).join(", ")}
                            {arr.length > 8 ? "..." : ""}
                          </li>
                        ) : null
                      )}
                    </ul>
                  </div>
                )}
                {atsSuggestions && (
                  <div className="text-left text-sm text-muted-foreground mt-2 whitespace-pre-line">
                    <div>
                      <b>Suggestions:</b>
                    </div>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: atsSuggestions.replace(/\n/g, "<br/>"),
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>AI Profile Summary</CardTitle>
              <CardDescription>
                Generate a compelling summary of your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary && !isPending && (
                <div className="prose prose-sm max-w-none text-card-foreground">
                  <p>{summary}</p>
                </div>
              )}
              {isPending && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {!summary && !isPending && (
                <div className="text-center text-sm text-muted-foreground p-8">
                  <p>Click the button below to generate your AI summary.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={onGenerateSummary}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="mr-2 h-4 w-4" />
                )}
                {summary ? "Regenerate Summary" : "Generate Summary"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
