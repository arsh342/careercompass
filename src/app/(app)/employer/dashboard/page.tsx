import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const postings: any[] = [
  // Data will be fetched from a database in a real application
];

export default function EmployerDashboardPage() {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employer Dashboard</h1>
          <p className="text-muted-foreground">Manage your job postings and applicants.</p>
        </div>
        <Button asChild>
          <Link href="/employer/postings/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Posting
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Postings</CardTitle>
          <CardDescription>A list of all job opportunities you have posted.</CardDescription>
        </CardHeader>
        <CardContent>
          {postings.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">
                <p>You haven't posted any jobs yet.</p>
                 <Button variant="link" asChild className="mt-2">
                    <Link href="/employer/postings/new">
                        Post your first job
                    </Link>
                 </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Applicants</TableHead>
                  <TableHead className="text-right">Posted On</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postings.map((posting) => (
                  <TableRow key={posting.id}>
                    <TableCell className="font-medium">{posting.title}</TableCell>
                    <TableCell>
                      <Badge variant={posting.status === "Active" ? "secondary" : "outline"} className={posting.status === "Active" ? "text-green-600 border-green-200 bg-green-50" : ""}>
                          {posting.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{posting.applicants}</TableCell>
                    <TableCell className="text-right">{posting.postedDate}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Applicants</DropdownMenuItem>
                          <DropdownMenuItem>Edit Posting</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
