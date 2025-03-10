import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import {
  users, moods, resources, forumPosts, comments, likes,
  type User, type InsertUser, type Mood, type Resource, type ForumPost, type Comment
} from "@shared/schema";
import connectPg from "connect-pg-simple";
import session from "express-session";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Mood methods
  createMood(userId: number, rating: number, note?: string): Promise<Mood>;
  getUserMoods(userId: number): Promise<Mood[]>;
  
  // Resource methods
  createResource(resource: Resource): Promise<Resource>;
  getResources(): Promise<Resource[]>;
  
  // Forum methods
  createForumPost(userId: number, title: string, content: string): Promise<ForumPost>;
  getForumPosts(currentUserId?: number): Promise<(ForumPost & { likesCount: number, userLiked: boolean })[]>;
  createComment(userId: number, postId: number, content: string): Promise<Comment>;
  getPostComments(postId: number): Promise<Comment[]>;
  toggleLike(userId: number, postId: number): Promise<void>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  deleteResource(id:number): Promise<void>;
  getMoodStats(): Promise<{
    averageRating: number;
    totalEntries: number;
    ratingDistribution: Record<number, number>;
  }>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createMood(userId: number, rating: number, note?: string): Promise<Mood> {
    const [mood] = await db
      .insert(moods)
      .values({ userId, rating, note })
      .returning();
    return mood;
  }

  async getUserMoods(userId: number): Promise<Mood[]> {
    return db
      .select()
      .from(moods)
      .where(eq(moods.userId, userId))
      .orderBy(desc(moods.createdAt));
  }

  async createResource(resource: Resource): Promise<Resource> {
    const [newResource] = await db
      .insert(resources)
      .values(resource)
      .returning();
    return newResource;
  }

  async getResources(): Promise<Resource[]> {
    return db.select().from(resources).orderBy(desc(resources.createdAt));
  }

  async createForumPost(
    userId: number,
    title: string,
    content: string
  ): Promise<ForumPost> {
    const [post] = await db
      .insert(forumPosts)
      .values({ userId, title, content })
      .returning();
    return post;
  }

  async getForumPosts(currentUserId?: number): Promise<(ForumPost & { likesCount: number, userLiked: boolean })[]> {
    // Get all posts
    const posts = await db.select().from(forumPosts).orderBy(desc(forumPosts.createdAt));
    
    // Get like counts for each post
    const likeCounts = await db
      .select({
        postId: likes.postId,
        count: sql`count(*)`.as('count')
      })
      .from(likes)
      .groupBy(likes.postId);
    
    // If user is logged in, get which posts they've liked
    let userLikes: { postId: number }[] = [];
    if (currentUserId) {
      userLikes = await db
        .select({ postId: likes.postId })
        .from(likes)
        .where(eq(likes.userId, currentUserId));
    }
    
    // Convert arrays to lookup objects
    const likeCountMap = likeCounts.reduce((acc, { postId, count }) => {
      acc[postId] = Number(count);
      return acc;
    }, {} as Record<number, number>);
    
    const userLikedMap = userLikes.reduce((acc, { postId }) => {
      acc[postId] = true;
      return acc;
    }, {} as Record<number, boolean>);
    
    // Enhance posts with like information
    return posts.map(post => ({
      ...post,
      likesCount: likeCountMap[post.id] || 0,
      userLiked: !!userLikedMap[post.id]
    }));
  }

  async createComment(
    userId: number,
    postId: number,
    content: string
  ): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({ userId, postId, content })
      .returning();
    return comment;
  }
  
  async getPostComments(postId: number): Promise<Comment[]> {
    try {
      return await db
        .select()
        .from(comments)
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt));
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return [];
    }
  }

  async toggleLike(userId: number, postId: number): Promise<void> {
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(eq(likes.userId, userId))
      .where(eq(likes.postId, postId));

    if (existingLike) {
      await db
        .delete(likes)
        .where(eq(likes.userId, userId))
        .where(eq(likes.postId, postId));
    } else {
      await db.insert(likes).values({ userId, postId });
    }
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.createdAt);
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async deleteResource(id: number): Promise<void> {
    await db.delete(resources).where(eq(resources.id, id));
  }

  async getMoodStats(): Promise<{
    averageRating: number;
    totalEntries: number;
    ratingDistribution: Record<number, number>;
  }> {
    const allMoods = await db.select().from(moods);

    const totalEntries = allMoods.length;
    const sum = allMoods.reduce((acc, mood) => acc + mood.rating, 0);
    const averageRating = totalEntries > 0 ? sum / totalEntries : 0;

    const ratingDistribution = allMoods.reduce((acc, mood) => {
      acc[mood.rating] = (acc[mood.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      averageRating,
      totalEntries,
      ratingDistribution
    };
  }
}

export const storage = new DatabaseStorage();