import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertForumPostSchema, type ForumPost } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Heart, MessageCircle } from "lucide-react";

export default function ForumPage() {
  const { user, logout } = useAuth(); // Added logout function
  const { toast } = useToast();

  const { data: posts, isLoading } = useQuery<ForumPost[]>({
    queryKey: ["/api/forum/posts"],
  });

  const form = useForm({
    resolver: zodResolver(insertForumPostSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/forum/posts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      toast({
        title: "Post created",
        description: "Your post has been published successfully.",
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

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest("POST", `/api/forum/posts/${postId}/like`);
      return response.json();
    },
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(["/api/forum/posts"], (oldData: ForumPost[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(post => 
          post.id === updatedPost.id ? { ...post, ...updatedPost } : post
        );
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to like the post: " + error.message,
        variant: "destructive",
      });
    },
  });

  const [activeCommentPost, setActiveCommentPost] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState("");

  const { data: comments, isLoading: commentsLoading, error: commentsError, refetch: refetchComments } = useQuery({
    queryKey: ["/api/forum/comments", activeCommentPost],
    queryFn: async () => {
      if (activeCommentPost === null) return [];
      try {
        // Use the apiRequest helper to ensure consistent error handling
        const response = await apiRequest("GET", `/api/forum/posts/${activeCommentPost}/comments?t=${new Date().getTime()}`);

        // apiRequest already handles errors, authentication, and content type checks
        const data = await response.json();
        
        if (Array.isArray(data)) {
          return data;
        } else if (data.error) {
          console.error("Server returned error:", data.error);
          return [];
        } else {
          console.error("Invalid comments data format:", data);
          return [];
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
      }
    },
    enabled: activeCommentPost !== null,
    retry: 1,
    staleTime: 1000, 
    refetchOnWindowFocus: true, 
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number, content: string }) => {
      const response = await apiRequest("POST", `/api/forum/posts/${postId}/comments`, { content });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Comment added successfully:", data);
      refetchComments();
      setCommentContent("");
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleCommentSubmit = (postId: number) => {
    if (commentContent.trim()) {
      addCommentMutation.mutate({ postId, content: commentContent });
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Community Forum</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : posts?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No posts yet. Be the first to share!
            </p>
          ) : (
            posts?.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold">{post.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      Posted by {post.userId === user?.id ? "you" : "anonymous"}
                    </p>
                  </div>
                  <p className="text-gray-600">{post.content}</p>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLikeMutation.mutate(post.id)}
                      disabled={toggleLikeMutation.isPending}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${post.userLiked ? "fill-red-500 text-red-500" : ""}`} />
                      {post.likesCount || 0} {post.likesCount === 1 ? "Like" : "Likes"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        if (activeCommentPost === post.id) {
                          setActiveCommentPost(null);
                        } else {
                          setActiveCommentPost(post.id);
                          queryClient.invalidateQueries({ queryKey: ["/api/forum/comments", post.id] });
                        }
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                  </div>

                  {activeCommentPost === post.id && (
                    <div className="pt-4 border-t mt-4">
                      <div className="flex gap-2">
                        <Input
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => handleCommentSubmit(post.id)}
                          disabled={addCommentMutation.isPending || !commentContent.trim()}
                          size="sm"
                        >
                          {addCommentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Post"
                          )}
                        </Button>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="mb-2 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => refetchComments()}
                            title="Refresh comments"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>
                            Refresh
                          </Button>
                        </div>
                        {commentsLoading ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : commentsError ? (
                          <>
                            <p className="text-sm text-red-500 text-center">Error loading comments</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => {
                                queryClient.invalidateQueries({ queryKey: ["/api/forum/comments", activeCommentPost] });
                              }}
                            >
                              Try Again
                            </Button>
                          </>
                        ) : !comments || comments.length === 0 ? (
                          <>
                            <p className="text-sm text-muted-foreground text-center">No comments found</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => {
                                queryClient.invalidateQueries({ queryKey: ["/api/forum/comments", activeCommentPost] });
                              }}
                            >
                              Check Again
                            </Button>
                          </>
                        ) : (
                          <div className="space-y-3">
                            {comments.map((comment: any) => (
                              <div key={comment.id} className="bg-muted p-3 rounded-md">
                                <p className="text-sm">{comment.content}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {comment.userId === user?.id ? "You" : "Anonymous"}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Post</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => createPostMutation.mutate(data))}
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
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Create Post"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}