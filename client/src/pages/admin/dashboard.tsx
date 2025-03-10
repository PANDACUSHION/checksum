import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertResourceSchema, type Resource, type User } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { z } from "zod";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// Extend the schema to add validation for resource types
const adminResourceSchema = insertResourceSchema.extend({
  type: z.enum(["pdf", "zip", "video", "article"]),
  url: z.string().url("Please enter a valid URL"),
});

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect non-admin users
  if (user && !user.isAdmin) {
    setLocation("/");
    return null;
  }

  const { data: resources, isLoading: loadingResources } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: moodStats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/admin/mood-stats"],
  });

  const form = useForm({
    resolver: zodResolver(adminResourceSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "pdf",
      url: "",
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: async (data: Resource) => {
      const res = await apiRequest("POST", "/api/resources", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Resource created",
        description: "The resource has been added successfully.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Resource deleted",
        description: "The resource has been removed successfully.",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "The user has been removed successfully.",
      });
    },
  });

  // Group resources by type
  const resourcesByType = resources?.reduce((acc, resource) => {
    const type = resource.type.toLowerCase();
    if (!acc[type]) acc[type] = [];
    acc[type].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>) || {};

  // Prepare mood stats data for charts
  const moodDistributionData = moodStats?.ratingDistribution 
    ? Object.entries(moodStats.ratingDistribution).map(([rating, count]) => ({
        rating: Number(rating),
        count,
      }))
    : [];

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

      <div className="grid gap-8">
        {/* Mood Analytics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Mood Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="text-sm font-medium text-muted-foreground">Total Entries</h4>
                    <p className="text-2xl font-bold">{moodStats?.totalEntries}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="text-sm font-medium text-muted-foreground">Average Rating</h4>
                    <p className="text-2xl font-bold">{moodStats?.averageRating.toFixed(1)}</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moodDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {users?.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{u.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined: {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteUserMutation.mutate(u.id)}
                      disabled={deleteUserMutation.isPending || u.id === user?.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resource Management Section */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Add New Resource</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => createResourceMutation.mutate(data as Resource))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select resource type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pdf">PDF Document</SelectItem>
                            <SelectItem value="zip">ZIP Archive</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="article">Article</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input {...field} type="url" placeholder="https://" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createResourceMutation.isPending}
                  >
                    {createResourceMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Add Resource"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resource Library</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingResources ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : resources?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No resources available
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(resourcesByType).map(([type, typeResources]) => (
                    <div key={type} className="space-y-3">
                      <h3 className="font-semibold capitalize">{type} Resources</h3>
                      <div className="space-y-2">
                        {typeResources.map((resource) => (
                          <div
                            key={resource.id}
                            className="p-4 border rounded-lg space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{resource.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {resource.description}
                                </p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteResourceMutation.mutate(resource.id)}
                                disabled={deleteResourceMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button variant="link" className="h-auto p-0" asChild>
                              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                View Resource
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
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