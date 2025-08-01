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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateProfileSummary } from "@/ai/flows/generate-profile-summary";
import { enhanceText } from "@/ai/flows/enhance-text";
import { parseResume } from "@/ai/flows/parse-resume";
import { ComprehensiveATSScorer } from "@/lib/comprehensiveAtsScorer";
import { Bot, Loader2, Edit, Upload, Plus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillsInput } from "@/components/skills-input";

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
  portfolioLink: z.string().url().optional().or(z.literal("")),
  linkedinLink: z.string().url().optional().or(z.literal("")),
  employability: z.string().optional(),
  education: z.string().min(1, "Education is required."),
  skills: z.string().min(1, "Skills are required."),
  interests: z.string().min(1, "Interests are required."),
  careerGoals: z.string().min(1, "Career goals are required."),
  employmentHistory: z.string().optional(),
  references: z.string().optional(),
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

  // Edit state management
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingProfessional, setIsEditingProfessional] = useState(false);

  // Multiple entries state
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>(
    []
  );
  const [employmentEntries, setEmploymentEntries] = useState<EmploymentEntry[]>(
    []
  );
  const [referenceEntries, setReferenceEntries] = useState<ReferenceEntry[]>(
    []
  );

  // Types for structured data
  interface EducationEntry {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    isCurrentlyEnrolled: boolean;
    description: string;
  }

  interface EmploymentEntry {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    isCurrentRole: boolean;
    description: string;
    location: string;
  }

  interface ReferenceEntry {
    id: string;
    name: string;
    title: string;
    company: string;
    email: string;
    phone: string;
    relationship: string;
  }

  // Functions to handle multiple entries
  const addEducationEntry = () => {
    const newEntry: EducationEntry = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      isCurrentlyEnrolled: false,
      description: "",
    };
    setEducationEntries([...educationEntries, newEntry]);
  };

  const removeEducationEntry = (id: string) => {
    setEducationEntries(educationEntries.filter((entry) => entry.id !== id));
  };

  const updateEducationEntry = (
    id: string,
    field: keyof EducationEntry,
    value: any
  ) => {
    setEducationEntries(
      educationEntries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const addEmploymentEntry = () => {
    const newEntry: EmploymentEntry = {
      id: Date.now().toString(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      isCurrentRole: false,
      description: "",
      location: "",
    };
    setEmploymentEntries([...employmentEntries, newEntry]);
  };

  const removeEmploymentEntry = (id: string) => {
    setEmploymentEntries(employmentEntries.filter((entry) => entry.id !== id));
  };

  const updateEmploymentEntry = (
    id: string,
    field: keyof EmploymentEntry,
    value: any
  ) => {
    setEmploymentEntries(
      employmentEntries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const addReferenceEntry = () => {
    const newEntry: ReferenceEntry = {
      id: Date.now().toString(),
      name: "",
      title: "",
      company: "",
      email: "",
      phone: "",
      relationship: "",
    };
    setReferenceEntries([...referenceEntries, newEntry]);
  };

  const removeReferenceEntry = (id: string) => {
    setReferenceEntries(referenceEntries.filter((entry) => entry.id !== id));
  };

  const updateReferenceEntry = (
    id: string,
    field: keyof ReferenceEntry,
    value: any
  ) => {
    setReferenceEntries(
      referenceEntries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  // Timeline view components
  const renderEducationTimeline = () => {
    const entries = educationEntries.filter(
      (entry) => entry.institution || entry.degree || entry.fieldOfStudy
    );

    if (entries.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No education entries added yet.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={entry.id} className="relative">
            {index < entries.length - 1 && (
              <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-border"></div>
            )}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-4 h-4 bg-primary rounded-full mt-1"></div>
              <div className="flex-grow">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{entry.degree}</h4>
                    <p className="text-sm text-muted-foreground">
                      {entry.institution}
                    </p>
                    {entry.fieldOfStudy && (
                      <p className="text-sm text-muted-foreground">
                        {entry.fieldOfStudy}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {entry.startDate} -{" "}
                    {entry.isCurrentlyEnrolled ? "Present" : entry.endDate}
                  </span>
                </div>
                {entry.description && (
                  <p className="text-sm mt-2">{entry.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEmploymentTimeline = () => {
    const entries = employmentEntries.filter(
      (entry) => entry.company || entry.position
    );

    if (entries.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No employment entries added yet.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={entry.id} className="relative">
            {index < entries.length - 1 && (
              <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-border"></div>
            )}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-4 h-4 bg-primary rounded-full mt-1"></div>
              <div className="flex-grow">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{entry.position}</h4>
                    <p className="text-sm text-muted-foreground">
                      {entry.company}
                    </p>
                    {entry.location && (
                      <p className="text-sm text-muted-foreground">
                        {entry.location}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {entry.startDate} -{" "}
                    {entry.isCurrentRole ? "Present" : entry.endDate}
                  </span>
                </div>
                {entry.description && (
                  <p className="text-sm mt-2">{entry.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderReferencesView = () => {
    const entries = referenceEntries.filter(
      (entry) => entry.name || entry.title || entry.company
    );

    if (entries.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No references added yet.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{entry.name}</h4>
                <p className="text-sm text-muted-foreground">{entry.title}</p>
                <p className="text-sm text-muted-foreground">{entry.company}</p>
                {entry.relationship && (
                  <p className="text-sm text-muted-foreground">
                    Relationship: {entry.relationship}
                  </p>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {entry.email && <p>{entry.email}</p>}
                {entry.phone && <p>{entry.phone}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

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

  // Initialize from existing data
  useEffect(() => {
    if (userProfile) {
      // Initialize education entries
      if (
        userProfile.educationEntries &&
        Array.isArray(userProfile.educationEntries)
      ) {
        setEducationEntries(userProfile.educationEntries);
      } else if (
        userProfile.education &&
        typeof userProfile.education === "string" &&
        userProfile.education.trim()
      ) {
        // Convert legacy text data to a single entry
        const entry: EducationEntry = {
          id: "legacy",
          institution: "",
          degree: "",
          fieldOfStudy: "",
          startDate: "",
          endDate: "",
          isCurrentlyEnrolled: false,
          description: userProfile.education,
        };
        setEducationEntries([entry]);
      }

      // Initialize employment entries
      if (
        userProfile.employmentEntries &&
        Array.isArray(userProfile.employmentEntries)
      ) {
        setEmploymentEntries(userProfile.employmentEntries);
      } else if (
        userProfile.employmentHistory &&
        typeof userProfile.employmentHistory === "string" &&
        userProfile.employmentHistory.trim()
      ) {
        // Convert legacy text data to a single entry
        const entry: EmploymentEntry = {
          id: "legacy",
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          isCurrentRole: false,
          description: userProfile.employmentHistory,
          location: "",
        };
        setEmploymentEntries([entry]);
      }

      // Initialize reference entries
      if (
        userProfile.referenceEntries &&
        Array.isArray(userProfile.referenceEntries)
      ) {
        setReferenceEntries(userProfile.referenceEntries);
      } else if (
        userProfile.references &&
        typeof userProfile.references === "string" &&
        userProfile.references.trim()
      ) {
        // Convert legacy text data to a single entry
        const entry: ReferenceEntry = {
          id: "legacy",
          name: "",
          title: "",
          company: "",
          email: "",
          phone: "",
          relationship: userProfile.references,
        };
        setReferenceEntries([entry]);
      }
    }
  }, [userProfile]);

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

      // Prepare data with structured entries
      const profileData = {
        ...userProfile,
        ...values,
        displayName: newDisplayName,
        educationEntries: educationEntries,
        employmentEntries: employmentEntries,
        referenceEntries: referenceEntries,
      };

      await setDoc(doc(db, "users", user.uid), profileData, { merge: true });

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });

      // Close edit modes after successful save
      setIsEditingPersonal(false);
      setIsEditingProfessional(false);
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

  const getEmployabilityLabel = (value: string) => {
    const option = employabilityOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const renderViewField = (
    label: string,
    value: string | undefined,
    className?: string
  ) => {
    return (
      <div className={className}>
        <label className="text-sm font-medium text-foreground">{label}</label>
        <p className="text-sm text-muted-foreground mt-1">
          {value || "Not provided"}
        </p>
      </div>
    );
  };

  const renderSkillsView = (skills: string | undefined) => {
    if (!skills)
      return <p className="text-sm text-muted-foreground">No skills listed</p>;

    const skillsArray = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return (
      <div className="flex flex-wrap gap-2">
        {skillsArray.map((skill, index) => (
          <Badge key={index} variant="secondary">
            {skill}
          </Badge>
        ))}
      </div>
    );
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
              <div className="flex justify-between items-center">
                <CardTitle>Personal Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditingPersonal ? "Cancel" : "Edit"}
                </Button>
              </div>
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

              {isEditingPersonal ? (
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
                            <Input
                              placeholder="support@example.com"
                              {...field}
                            />
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
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                      >
                        {form.formState.isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingPersonal(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderViewField("First Name", userProfile?.firstName)}
                    {renderViewField("Last Name", userProfile?.lastName)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderViewField("Middle Name", userProfile?.middleName)}
                    {renderViewField(
                      "Contact Number",
                      userProfile?.contactNumber
                    )}
                  </div>
                  {renderViewField("Support Email", userProfile?.supportEmail)}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Current Employability
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {userProfile?.employability
                        ? getEmployabilityLabel(userProfile.employability)
                        : "Not specified"}
                    </p>
                  </div>
                  {renderViewField(
                    "Portfolio Link",
                    userProfile?.portfolioLink
                  )}
                  {renderViewField(
                    "LinkedIn Profile",
                    userProfile?.linkedinLink
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Professional Details</CardTitle>
                  <CardDescription>
                    This information will be used to match you with
                    opportunities and pre-fill applications.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setIsEditingProfessional(!isEditingProfessional)
                  }
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditingProfessional ? "Cancel" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditingProfessional ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                  >
                    {/* Education Entries */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Education</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addEducationEntry}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Education
                        </Button>
                      </div>

                      {educationEntries.map((entry) => (
                        <Card key={entry.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-sm">
                                Education Entry
                              </h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEducationEntry(entry.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Institution
                                </label>
                                <Input
                                  placeholder="University/School name"
                                  value={entry.institution}
                                  onChange={(e) =>
                                    updateEducationEntry(
                                      entry.id,
                                      "institution",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Degree
                                </label>
                                <Input
                                  placeholder="e.g., Bachelor's, Master's"
                                  value={entry.degree}
                                  onChange={(e) =>
                                    updateEducationEntry(
                                      entry.id,
                                      "degree",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Field of Study
                                </label>
                                <Input
                                  placeholder="e.g., Computer Science"
                                  value={entry.fieldOfStudy}
                                  onChange={(e) =>
                                    updateEducationEntry(
                                      entry.id,
                                      "fieldOfStudy",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`current-${entry.id}`}
                                  checked={entry.isCurrentlyEnrolled}
                                  onChange={(e) =>
                                    updateEducationEntry(
                                      entry.id,
                                      "isCurrentlyEnrolled",
                                      e.target.checked
                                    )
                                  }
                                />
                                <label
                                  htmlFor={`current-${entry.id}`}
                                  className="text-sm font-medium"
                                >
                                  Currently enrolled
                                </label>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Start Date
                                </label>
                                <Input
                                  type="month"
                                  value={entry.startDate}
                                  onChange={(e) =>
                                    updateEducationEntry(
                                      entry.id,
                                      "startDate",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              {!entry.isCurrentlyEnrolled && (
                                <div>
                                  <label className="text-sm font-medium">
                                    End Date
                                  </label>
                                  <Input
                                    type="month"
                                    value={entry.endDate}
                                    onChange={(e) =>
                                      updateEducationEntry(
                                        entry.id,
                                        "endDate",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Description (Optional)
                              </label>
                              <Textarea
                                placeholder="Achievements, relevant coursework, etc."
                                value={entry.description}
                                onChange={(e) =>
                                  updateEducationEntry(
                                    entry.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                rows={3}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}

                      {educationEntries.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No education entries added yet. Click "Add Education"
                          to get started.
                        </p>
                      )}
                    </div>

                    {/* Employment Entries */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Employment History</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addEmploymentEntry}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Employment
                        </Button>
                      </div>

                      {employmentEntries.map((entry) => (
                        <Card key={entry.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-sm">
                                Employment Entry
                              </h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEmploymentEntry(entry.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Company
                                </label>
                                <Input
                                  placeholder="Company name"
                                  value={entry.company}
                                  onChange={(e) =>
                                    updateEmploymentEntry(
                                      entry.id,
                                      "company",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Position
                                </label>
                                <Input
                                  placeholder="Job title"
                                  value={entry.position}
                                  onChange={(e) =>
                                    updateEmploymentEntry(
                                      entry.id,
                                      "position",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Location
                                </label>
                                <Input
                                  placeholder="City, State/Country"
                                  value={entry.location}
                                  onChange={(e) =>
                                    updateEmploymentEntry(
                                      entry.id,
                                      "location",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`current-job-${entry.id}`}
                                  checked={entry.isCurrentRole}
                                  onChange={(e) =>
                                    updateEmploymentEntry(
                                      entry.id,
                                      "isCurrentRole",
                                      e.target.checked
                                    )
                                  }
                                />
                                <label
                                  htmlFor={`current-job-${entry.id}`}
                                  className="text-sm font-medium"
                                >
                                  Current role
                                </label>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Start Date
                                </label>
                                <Input
                                  type="month"
                                  value={entry.startDate}
                                  onChange={(e) =>
                                    updateEmploymentEntry(
                                      entry.id,
                                      "startDate",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              {!entry.isCurrentRole && (
                                <div>
                                  <label className="text-sm font-medium">
                                    End Date
                                  </label>
                                  <Input
                                    type="month"
                                    value={entry.endDate}
                                    onChange={(e) =>
                                      updateEmploymentEntry(
                                        entry.id,
                                        "endDate",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Description
                              </label>
                              <Textarea
                                placeholder="Key achievements, responsibilities, etc."
                                value={entry.description}
                                onChange={(e) =>
                                  updateEmploymentEntry(
                                    entry.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                rows={3}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}

                      {employmentEntries.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No employment entries added yet. Click "Add
                          Employment" to get started.
                        </p>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="skills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skills</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <SkillsInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="e.g., React, Python, Project Management..."
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
                            Type skills and press comma, enter, or tab to add
                            them as pills.
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
                                  handleEnhanceText(
                                    "careerGoals",
                                    "Career Goals"
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
                    {/* Employment History Entries */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Employment History</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addEmploymentEntry}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Employment
                        </Button>
                      </div>

                      {employmentEntries.map((entry) => (
                        <Card key={entry.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-sm">
                                Employment Entry
                              </h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEmploymentEntry(entry.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Company
                                </label>
                                <Input
                                  placeholder="Company name"
                                  value={entry.company}
                                  onChange={(e) =>
                                    updateEmploymentEntry(
                                      entry.id,
                                      "company",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Position
                                </label>
                                <Input
                                  placeholder="Job title"
                                  value={entry.position}
                                  onChange={(e) =>
                                    updateEmploymentEntry(
                                      entry.id,
                                      "position",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Location
                                </label>
                                <Input
                                  placeholder="City, State/Country"
                                  value={entry.location}
                                  onChange={(e) =>
                                    updateEmploymentEntry(
                                      entry.id,
                                      "location",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`current-job-${entry.id}`}
                                  checked={entry.isCurrentRole}
                                  onChange={(e) =>
                                    updateEmploymentEntry(
                                      entry.id,
                                      "isCurrentRole",
                                      e.target.checked
                                    )
                                  }
                                />
                                <label
                                  htmlFor={`current-job-${entry.id}`}
                                  className="text-sm font-medium"
                                >
                                  Current role
                                </label>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Start Date
                                </label>
                                <Input
                                  type="month"
                                  value={entry.startDate}
                                  onChange={(e) =>
                                    updateEmploymentEntry(
                                      entry.id,
                                      "startDate",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              {!entry.isCurrentRole && (
                                <div>
                                  <label className="text-sm font-medium">
                                    End Date
                                  </label>
                                  <Input
                                    type="month"
                                    value={entry.endDate}
                                    onChange={(e) =>
                                      updateEmploymentEntry(
                                        entry.id,
                                        "endDate",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Description
                              </label>
                              <Textarea
                                placeholder="Key responsibilities and achievements"
                                value={entry.description}
                                onChange={(e) =>
                                  updateEmploymentEntry(
                                    entry.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                rows={4}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}

                      {employmentEntries.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No employment entries added yet. Click "Add
                          Employment" to get started.
                        </p>
                      )}
                    </div>

                    {/* References Entries */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>References</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addReferenceEntry}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Reference
                        </Button>
                      </div>

                      {referenceEntries.map((entry) => (
                        <Card key={entry.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-sm">
                                Reference Entry
                              </h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeReferenceEntry(entry.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Full Name
                                </label>
                                <Input
                                  placeholder="Reference's full name"
                                  value={entry.name}
                                  onChange={(e) =>
                                    updateReferenceEntry(
                                      entry.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Job Title
                                </label>
                                <Input
                                  placeholder="Their position"
                                  value={entry.title}
                                  onChange={(e) =>
                                    updateReferenceEntry(
                                      entry.id,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Company
                                </label>
                                <Input
                                  placeholder="Company name"
                                  value={entry.company}
                                  onChange={(e) =>
                                    updateReferenceEntry(
                                      entry.id,
                                      "company",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Relationship
                                </label>
                                <Input
                                  placeholder="e.g., Former Manager, Colleague"
                                  value={entry.relationship}
                                  onChange={(e) =>
                                    updateReferenceEntry(
                                      entry.id,
                                      "relationship",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Email
                                </label>
                                <Input
                                  type="email"
                                  placeholder="reference@company.com"
                                  value={entry.email}
                                  onChange={(e) =>
                                    updateReferenceEntry(
                                      entry.id,
                                      "email",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Phone (Optional)
                                </label>
                                <Input
                                  placeholder="Phone number"
                                  value={entry.phone}
                                  onChange={(e) =>
                                    updateReferenceEntry(
                                      entry.id,
                                      "phone",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}

                      {referenceEntries.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No references added yet. Click "Add Reference" to get
                          started.
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                      >
                        {form.formState.isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingProfessional(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Education
                    </label>
                    <div className="mt-4">{renderEducationTimeline()}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Skills
                    </label>
                    <div className="mt-1">
                      {renderSkillsView(userProfile?.skills)}
                    </div>
                  </div>
                  {renderViewField("Interests", userProfile?.interests)}
                  {renderViewField("Career Goals", userProfile?.careerGoals)}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Employment History
                    </label>
                    <div className="mt-4">{renderEmploymentTimeline()}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      References
                    </label>
                    <div className="mt-4">{renderReferencesView()}</div>
                  </div>
                </div>
              )}
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
