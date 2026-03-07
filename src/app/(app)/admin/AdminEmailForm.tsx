"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendAdminEmail } from "./actions";
import { Send, Loader2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Send Email
        </>
      )}
    </Button>
  );
}

export function AdminEmailForm() {
  const { toast } = useToast();
  const [key, setKey] = useState(Date.now()); // Used to reset form
  const [recipientType, setRecipientType] = useState("individual");

  async function clientAction(formData: FormData) {
    const result = await sendAdminEmail(formData);

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
      // Reset form on success
      setKey(Date.now());
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Email</CardTitle>
        <CardDescription>Send a direct email to any user on the platform.</CardDescription>
      </CardHeader>
      <form action={clientAction} key={key}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientType">Send To</Label>
            <Select name="recipientType" value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger>
                <SelectValue placeholder="Select who to send to" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual User</SelectItem>
                <SelectItem value="all_employers">All Employers</SelectItem>
                <SelectItem value="all_job_seekers">All Job Seekers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {recipientType === "individual" && (
            <div className="space-y-2">
              <Label htmlFor="to">Recipient (Email)</Label>
              <Input id="to" name="to" type="email" placeholder="user@example.com" required={recipientType === "individual"} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" placeholder="Important Update" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea 
              id="body" 
              name="body" 
              placeholder="Type your message here..." 
              className="min-h-[150px]" 
              required 
            />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
