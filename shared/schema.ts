import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const moods = pgTable("moods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  postId: integer("post_id").references(() => forumPosts.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  postId: integer("post_id").references(() => forumPosts.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  moods: many(moods),
  posts: many(forumPosts),
  comments: many(comments),
  likes: many(likes)
}));

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [forumPosts.userId],
    references: [users.id]
  }),
  comments: many(comments),
  likes: many(likes)
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

export const insertMoodSchema = createInsertSchema(moods).pick({
  rating: true,
  note: true
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  title: true,
  description: true,
  type: true,
  url: true
});

export const insertForumPostSchema = createInsertSchema(forumPosts).pick({
  title: true,
  content: true
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Mood = typeof moods.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type ForumPost = typeof forumPosts.$inferSelect;
export type Comment = typeof comments.$inferSelect;