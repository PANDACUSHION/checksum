import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertMoodSchema, insertResourceSchema, insertForumPostSchema, insertCommentSchema } from "@shared/schema";
import fetch from 'node-fetch';

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Middleware to check if user is admin
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    next();
  };

  // Mood tracking routes
  app.post("/api/moods", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const result = insertMoodSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    
    const mood = await storage.createMood(
      req.user!.id,
      result.data.rating,
      result.data.note
    );
    res.json(mood);
  });

  app.get("/api/moods", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const moods = await storage.getUserMoods(req.user!.id);
    res.json(moods);
  });

  // Resource routes
  app.post("/api/resources", requireAdmin, async (req, res) => {
    const result = insertResourceSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    
    const resource = await storage.createResource(result.data);
    res.json(resource);
  });

  app.get("/api/resources", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const resources = await storage.getResources();
    res.json(resources);
  });

  // Forum routes
  app.post("/api/forum/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const result = insertForumPostSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    
    const post = await storage.createForumPost(
      req.user!.id,
      result.data.title,
      result.data.content
    );
    res.json(post);
  });

  app.get("/api/forum/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const posts = await storage.getForumPosts(req.user!.id);
    res.json(posts);
  });

  app.post("/api/forum/posts/:postId/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const result = insertCommentSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    
    const comment = await storage.createComment(
      req.user!.id,
      parseInt(req.params.postId),
      result.data.content
    );
    res.json(comment);
  });
  
  app.get("/api/forum/posts/:postId/comments", async (req, res) => {
    // Set content type header early to ensure JSON response
    res.setHeader('Content-Type', 'application/json');
    
    try {
      // Check authentication first
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }
      
      const comments = await storage.getPostComments(postId);
      console.log(`Fetched ${comments.length} comments for post ${postId}`);
      
      // Return the comments as JSON - use res.send instead of res.json for additional safety
      return res.send(JSON.stringify(comments));
    } catch (error) {
      console.error("Error fetching comments:", error);
      // Always return JSON even in error cases
      return res.status(500).send(JSON.stringify({ 
        error: "Failed to fetch comments", 
        message: String(error) 
      }));
    }
  });

  app.post("/api/forum/posts/:postId/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await storage.toggleLike(req.user!.id, parseInt(req.params.postId));
    
    // Return the updated post with like information
    const postId = parseInt(req.params.postId);
    const posts = await storage.getForumPosts(req.user!.id);
    const updatedPost = posts.find(post => post.id === postId);
    
    if (updatedPost) {
      res.json(updatedPost);
    } else {
      res.sendStatus(404);
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    await storage.deleteUser(parseInt(req.params.id));
    res.sendStatus(200);
  });

  app.delete("/api/admin/resources/:id", requireAdmin, async (req, res) => {
    await storage.deleteResource(parseInt(req.params.id));
    res.sendStatus(200);
  });

  app.get("/api/admin/mood-stats", requireAdmin, async (req, res) => {
    const stats = await storage.getMoodStats();
    res.json(stats);
  });

  app.get("/api/daily-quote", async (req, res) => {
    try {
      const response = await fetch("https://api.quotable.io/random?tags=inspirational,motivation");
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Provide a fallback quote when API is unreachable
      res.json({
        content: "Believe you can and you're halfway there.",
        author: "Theodore Roosevelt",
        tags: ["inspirational", "motivation"],
        _id: "fallback-quote",
        fallback: true
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}