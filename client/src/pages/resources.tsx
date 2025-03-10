import { useQuery } from "@tanstack/react-query";
import { Resource } from "@shared/schema";
import ResourceCard from "@/components/resource-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ResourcesPage() {
  const { data: resources, isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pdfResources = resources?.filter(r => r.type.toLowerCase() === 'pdf') || [];
  const zipResources = resources?.filter(r => r.type.toLowerCase() === 'zip') || [];
  const otherResources = resources?.filter(r => !['pdf', 'zip'].includes(r.type.toLowerCase())) || [];

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
        <p className="text-muted-foreground">
          Access helpful materials and resources for mental health support
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="pdf">PDF Documents</TabsTrigger>
          <TabsTrigger value="zip">ZIP Archives</TabsTrigger>
          <TabsTrigger value="other">Other Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {resources?.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </TabsContent>

        <TabsContent value="pdf" className="space-y-4">
          {pdfResources.length > 0 ? (
            pdfResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No PDF resources available
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="zip" className="space-y-4">
          {zipResources.length > 0 ? (
            zipResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No ZIP resources available
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="other" className="space-y-4">
          {otherResources.length > 0 ? (
            otherResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No other resources available
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
