import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profiles with business card information
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  profession: varchar("profession"),
  company: varchar("company"),
  bio: text("bio"),
  phone: varchar("phone"),
  website: varchar("website"),
  socialLinks: jsonb("social_links").$type<{
    linkedin?: string;
    github?: string;
    twitter?: string;
    instagram?: string;
    whatsapp?: string;
  }>(),
  isPublic: boolean("is_public").default(true),
  nfcTagId: varchar("nfc_tag_id").unique(),
  qrCodeData: text("qr_code_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Connections between users
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  toProfileId: integer("to_profile_id").references(() => profiles.id),
  isFavorite: boolean("is_favorite").default(false),
  connectedAt: timestamp("connected_at").defaultNow(),
  scanMethod: varchar("scan_method").$type<"nfc" | "qr" | "link">(),
  notes: text("notes"),
});

// Profile views tracking
export const profileViews = pgTable("profile_views", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => profiles.id),
  viewerUserId: varchar("viewer_user_id").references(() => users.id),
  viewerLocation: varchar("viewer_location"),
  viewerDevice: varchar("viewer_device"),
  viewDuration: integer("view_duration"), // in seconds
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  connectionsFrom: many(connections, { relationName: "from_user" }),
  connectionsTo: many(connections, { relationName: "to_user" }),
}));

export const profileRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  views: many(profileViews),
  connections: many(connections),
}));

export const connectionRelations = relations(connections, ({ one }) => ({
  fromUser: one(users, {
    fields: [connections.fromUserId],
    references: [users.id],
    relationName: "from_user",
  }),
  toUser: one(users, {
    fields: [connections.toUserId],
    references: [users.id],
    relationName: "to_user",
  }),
  toProfile: one(profiles, {
    fields: [connections.toProfileId],
    references: [profiles.id],
  }),
}));

export const profileViewRelations = relations(profileViews, ({ one }) => ({
  profile: one(profiles, {
    fields: [profileViews.profileId],
    references: [profiles.id],
  }),
  viewer: one(users, {
    fields: [profileViews.viewerUserId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  connectedAt: true,
});

export const insertProfileViewSchema = createInsertSchema(profileViews).omit({
  id: true,
  viewedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type ProfileView = typeof profileViews.$inferSelect;
export type InsertProfileView = z.infer<typeof insertProfileViewSchema>;
