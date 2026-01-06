"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ActionSearchBar, Action } from "@/components/ui/action-search-bar";
import { useAuth } from "@/context/AuthContext";
import {
  Briefcase,
  MapPin,
  Building2,
  Code,
  GraduationCap,
  TrendingUp,
  Laptop,
  Database,
  Cloud,
  Smartphone,
  Palette,
  BarChart,
  Shield,
  Users,
  DollarSign,
} from "lucide-react";

// Expanded job search suggestions
const defaultSuggestions: Action[] = [
  // Job Types
  {
    id: "internship",
    label: "Internship",
    icon: <GraduationCap className="h-4 w-4 text-blue-500" />,
    description: "Entry-level positions",
    end: "Type",
  },
  {
    id: "full-time",
    label: "Full-Time",
    icon: <Briefcase className="h-4 w-4 text-green-500" />,
    description: "Permanent positions",
    end: "Type",
  },
  // Job Titles
  {
    id: "software-engineer",
    label: "Software Engineer",
    icon: <Laptop className="h-4 w-4 text-indigo-500" />,
    description: "Development role",
    end: "Job",
  },
  {
    id: "frontend-developer",
    label: "Frontend Developer",
    icon: <Palette className="h-4 w-4 text-pink-500" />,
    description: "UI/UX development",
    end: "Job",
  },
  {
    id: "backend-developer",
    label: "Backend Developer",
    icon: <Database className="h-4 w-4 text-orange-500" />,
    description: "Server-side development",
    end: "Job",
  },
  {
    id: "full-stack-developer",
    label: "Full Stack Developer",
    icon: <Code className="h-4 w-4 text-teal-500" />,
    description: "End-to-end development",
    end: "Job",
  },
  {
    id: "data-scientist",
    label: "Data Scientist",
    icon: <BarChart className="h-4 w-4 text-purple-500" />,
    description: "ML & Analytics",
    end: "Job",
  },
  {
    id: "devops-engineer",
    label: "DevOps Engineer",
    icon: <Cloud className="h-4 w-4 text-sky-500" />,
    description: "Infrastructure & CI/CD",
    end: "Job",
  },
  {
    id: "product-manager",
    label: "Product Manager",
    icon: <Users className="h-4 w-4 text-amber-500" />,
    description: "Product strategy",
    end: "Job",
  },
  {
    id: "ui-ux-designer",
    label: "UI/UX Designer",
    icon: <Palette className="h-4 w-4 text-rose-500" />,
    description: "Design & prototyping",
    end: "Job",
  },
  {
    id: "mobile-developer",
    label: "Mobile Developer",
    icon: <Smartphone className="h-4 w-4 text-emerald-500" />,
    description: "iOS & Android apps",
    end: "Job",
  },
  {
    id: "security-engineer",
    label: "Security Engineer",
    icon: <Shield className="h-4 w-4 text-red-500" />,
    description: "Cybersecurity",
    end: "Job",
  },
  // Skills
  {
    id: "react",
    label: "React",
    icon: <Code className="h-4 w-4 text-cyan-500" />,
    description: "Frontend framework",
    end: "Skill",
  },
  {
    id: "python",
    label: "Python",
    icon: <Code className="h-4 w-4 text-yellow-500" />,
    description: "Programming language",
    end: "Skill",
  },
  {
    id: "javascript",
    label: "JavaScript",
    icon: <Code className="h-4 w-4 text-yellow-400" />,
    description: "Web programming",
    end: "Skill",
  },
  {
    id: "typescript",
    label: "TypeScript",
    icon: <Code className="h-4 w-4 text-blue-600" />,
    description: "Typed JavaScript",
    end: "Skill",
  },
  {
    id: "nodejs",
    label: "Node.js",
    icon: <Code className="h-4 w-4 text-green-600" />,
    description: "Backend runtime",
    end: "Skill",
  },
  {
    id: "java",
    label: "Java",
    icon: <Code className="h-4 w-4 text-red-600" />,
    description: "Enterprise language",
    end: "Skill",
  },
  {
    id: "aws",
    label: "AWS",
    icon: <Cloud className="h-4 w-4 text-orange-500" />,
    description: "Cloud platform",
    end: "Skill",
  },
  {
    id: "docker",
    label: "Docker",
    icon: <Cloud className="h-4 w-4 text-blue-500" />,
    description: "Containerization",
    end: "Skill",
  },
  {
    id: "kubernetes",
    label: "Kubernetes",
    icon: <Cloud className="h-4 w-4 text-blue-600" />,
    description: "Container orchestration",
    end: "Skill",
  },
  {
    id: "sql",
    label: "SQL",
    icon: <Database className="h-4 w-4 text-blue-500" />,
    description: "Database queries",
    end: "Skill",
  },
  {
    id: "mongodb",
    label: "MongoDB",
    icon: <Database className="h-4 w-4 text-green-500" />,
    description: "NoSQL database",
    end: "Skill",
  },
  {
    id: "figma",
    label: "Figma",
    icon: <Palette className="h-4 w-4 text-purple-500" />,
    description: "Design tool",
    end: "Skill",
  },
  {
    id: "machine-learning",
    label: "Machine Learning",
    icon: <BarChart className="h-4 w-4 text-indigo-500" />,
    description: "AI/ML",
    end: "Skill",
  },
  // Locations
  {
    id: "remote",
    label: "Remote",
    icon: <MapPin className="h-4 w-4 text-purple-500" />,
    description: "Work from anywhere",
    end: "Location",
  },
  {
    id: "bangalore",
    label: "Bangalore",
    icon: <MapPin className="h-4 w-4 text-red-500" />,
    description: "India",
    end: "Location",
  },
  {
    id: "mumbai",
    label: "Mumbai",
    icon: <MapPin className="h-4 w-4 text-orange-500" />,
    description: "India",
    end: "Location",
  },
  {
    id: "delhi",
    label: "Delhi",
    icon: <MapPin className="h-4 w-4 text-blue-500" />,
    description: "India",
    end: "Location",
  },
  {
    id: "hyderabad",
    label: "Hyderabad",
    icon: <MapPin className="h-4 w-4 text-pink-500" />,
    description: "India",
    end: "Location",
  },
  // Companies
  {
    id: "google",
    label: "Google",
    icon: <Building2 className="h-4 w-4 text-blue-500" />,
    description: "Tech company",
    end: "Company",
  },
  {
    id: "microsoft",
    label: "Microsoft",
    icon: <Building2 className="h-4 w-4 text-blue-600" />,
    description: "Tech company",
    end: "Company",
  },
  {
    id: "amazon",
    label: "Amazon",
    icon: <Building2 className="h-4 w-4 text-orange-500" />,
    description: "E-commerce & Cloud",
    end: "Company",
  },
  {
    id: "meta",
    label: "Meta",
    icon: <Building2 className="h-4 w-4 text-blue-500" />,
    description: "Social media",
    end: "Company",
  },
  {
    id: "flipkart",
    label: "Flipkart",
    icon: <Building2 className="h-4 w-4 text-yellow-500" />,
    description: "E-commerce",
    end: "Company",
  },
];

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  useEffect(() => {
    if (loading || role === "employer") return;
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams, role, loading]);

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) return;
    router.push(`/opportunities?q=${searchTerm.trim()}`);
  }, [searchTerm, router]);

  const handleActionSelect = (action: Action) => {
    setSearchTerm(action.label);
    router.push(`/opportunities?q=${action.label}`);
  };

  if (loading || role === "employer") {
    return null;
  }

  return (
    <div className="w-full max-w-md border rounded-full">
      <ActionSearchBar
        actions={defaultSuggestions}
        placeholder="Search jobs, skills, companies, locations..."
        value={searchTerm}
        onChange={setSearchTerm}
        onActionSelect={handleActionSelect}
        onSearch={handleSearch}
      />
    </div>
  );
}
