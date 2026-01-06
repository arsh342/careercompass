import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeatureItem {
  title: string;
  description: string;
}

interface FeatureProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  features?: FeatureItem[];
}

const defaultFeatures: FeatureItem[] = [
  {
    title: "Smart Job Matching",
    description: "AI-powered skill matching connects you with the perfect opportunities.",
  },
  {
    title: "Verified Employers",
    description: "All employers are verified to ensure legitimate opportunities.",
  },
  {
    title: "Career Analytics",
    description: "Track your applications and get insights on your job search.",
  },
  {
    title: "Resume Builder",
    description: "Create professional resumes that stand out to employers.",
  },
  {
    title: "Salary Insights",
    description: "Get market salary data to negotiate better offers.",
  },
  {
    title: "24/7 Support",
    description: "Our team is always ready to help you succeed.",
  },
];

function Feature({
  badge = "Why CareerCompass",
  title = "Everything you need to land your dream job",
  subtitle = "We've built the most comprehensive platform to accelerate your career growth.",
  features = defaultFeatures,
}: FeatureProps) {
  return (
    <div className="w-full py-12">
      <div className="container mx-auto">
        <div className="flex gap-4 flex-col items-start">
          <div>
            <Badge>{badge}</Badge>
          </div>
          <div className="flex gap-2 flex-col">
            <h2 className="text-2xl md:text-4xl tracking-tight lg:max-w-xl font-bold">
              {title}
            </h2>
            <p className="text-base max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <div className="flex gap-8 pt-8 flex-col w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-row gap-4 items-start">
                  <Check className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{feature.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };
