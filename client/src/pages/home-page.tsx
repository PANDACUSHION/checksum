import { useAuth } from "@/hooks/use-auth";
import MoodTracker from "@/components/mood-tracker";
import ResourceCard from "@/components/resource-card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Resource } from "@shared/schema";
import { Loader2 } from "lucide-react";
import QuoteCard from "@/components/quote-card";
import CopingTools from "@/components/coping-tools";

export default function HomePage() {
  const { user } = useAuth();
  const { data: resources, isLoading: loadingResources } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.username}</h1>
            <p className="text-muted-foreground">Track your mood and explore helpful resources</p>
          </div>
          <div className="space-x-4">
            <Button asChild>
              <Link href="/forum">Community Forum</Link>
            </Button>
            {user.isAdmin && (
              <Button variant="outline" asChild>
                <Link href="/admin">Admin Dashboard</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Quote Card */}
        <div className="max-w-2xl mx-auto">
          <QuoteCard />
        </div>

        {/* Coping Tools */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Coping Tools & Self-Care</h2>
          <CopingTools />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Mood Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <MoodTracker />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest Resources</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingResources ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : resources?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No resources available yet
                </p>
              ) : (
                <div className="space-y-4">
                  {resources?.slice(0, 3).map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}