import { PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  title?: string;
  description?: string;
  items?: FAQItem[];
  showContact?: boolean;
}

const defaultFAQItems: FAQItem[] = [
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes! You can cancel your subscription at any time. Your benefits will continue until the end of your billing period. No hidden fees or cancellation charges.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, and digital payment methods through our secure payment partner Stripe. All transactions are encrypted and secure.",
  },
  {
    question: "Is there a free trial available?",
    answer: "Our Free plan gives you access to basic features forever. You can upgrade to Pro or Premium anytime to unlock additional features and benefits.",
  },
  {
    question: "How does the AI resume review work?",
    answer: "Our AI analyzes your resume against industry standards and job requirements, providing actionable feedback on formatting, keywords, and content improvements to increase your chances of getting noticed.",
  },
  {
    question: "Can I switch between plans?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at your next billing cycle.",
  },
  {
    question: "What's included in career coaching?",
    answer: "Premium subscribers get access to 1:1 sessions with certified career coaches who can help with interview preparation, salary negotiation, career transitions, and personalized job search strategies.",
  },
];

function FAQ({ 
  title = "Frequently Asked Questions",
  description = "Everything you need to know about CareerCompass. Can't find what you're looking for? Reach out to our support team.",
  items = defaultFAQItems,
  showContact = true,
}: FAQProps) {
  return (
    <div className="w-full py-12">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="flex gap-6 flex-col">
            <div className="flex gap-4 flex-col">
              <div>
                <Badge variant="outline">FAQ</Badge>
              </div>
              <div className="flex gap-2 flex-col">
                <h4 className="text-3xl md:text-4xl tracking-tight max-w-xl text-left font-bold">
                  {title}
                </h4>
                <p className="text-base max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left">
                  {description}
                </p>
              </div>
              {showContact && (
                <div className="">
                  <Button className="gap-3" variant="outline">
                    Any questions? Reach out <PhoneCall className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, index) => (
              <AccordionItem key={index} value={"index-" + index}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

export { FAQ };
