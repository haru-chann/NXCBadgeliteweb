import {
  users,
  profiles,
  connections,
  profileViews,
  type User,
  type UpsertUser,
  type Profile,
  type InsertProfile,
  type Connection,
  type InsertConnection,
  type ProfileView,
  type InsertProfileView,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profile operations
  getUserProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile>;
  getProfileByNFC(nfcTagId: string): Promise<Profile | undefined>;
  getProfileById(id: number): Promise<Profile | undefined>;
  
  // Connection operations
  createConnection(connection: InsertConnection): Promise<Connection>;
  getUserConnections(userId: string): Promise<(Connection & { toUser: User; toProfile: Profile | null })[]>;
  toggleFavoriteConnection(userId: string, connectionId: number): Promise<void>;
  
  // Profile view operations
  recordProfileView(view: InsertProfileView): Promise<ProfileView>;
  getProfileViews(profileId: number): Promise<ProfileView[]>;
  getProfileViewStats(profileId: number): Promise<{
    totalViews: number;
    todayViews: number;
    weekViews: number;
  }>;
  
  // Analytics operations
  getConnectionStats(userId: string): Promise<{
    total: number;
    thisWeek: number;
    favorites: number;
  }>;
  getViewerProfessionStats(profileId: number): Promise<Array<{ profession: string; count: number }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Profile operations
  async getUserProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db
      .insert(profiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateProfile(userId: string, profileData: Partial<InsertProfile>): Promise<Profile> {
    const [profile] = await db
      .update(profiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  }

  async getProfileByNFC(nfcTagId: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.nfcTagId, nfcTagId));
    return profile;
  }

  async getProfileById(id: number): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id));
    return profile;
  }

  // Connection operations
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const [newConnection] = await db
      .insert(connections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async getUserConnections(userId: string): Promise<(Connection & { toUser: User; toProfile: Profile | null })[]> {
    const result = await db
      .select({
        connection: connections,
        toUser: users,
        toProfile: profiles,
      })
      .from(connections)
      .leftJoin(users, eq(connections.toUserId, users.id))
      .leftJoin(profiles, eq(connections.toProfileId, profiles.id))
      .where(eq(connections.fromUserId, userId))
      .orderBy(desc(connections.connectedAt));

    return result.map(row => ({
      ...row.connection,
      toUser: row.toUser!,
      toProfile: row.toProfile,
    }));
  }

  async toggleFavoriteConnection(userId: string, connectionId: number): Promise<void> {
    const [connection] = await db
      .select()
      .from(connections)
      .where(and(
        eq(connections.id, connectionId),
        eq(connections.fromUserId, userId)
      ));

    if (connection) {
      await db
        .update(connections)
        .set({ isFavorite: !connection.isFavorite })
        .where(eq(connections.id, connectionId));
    }
  }

  // Profile view operations
  async recordProfileView(view: InsertProfileView): Promise<ProfileView> {
    const [newView] = await db
      .insert(profileViews)
      .values(view)
      .returning();
    return newView;
  }

  async getProfileViews(profileId: number): Promise<ProfileView[]> {
    return await db
      .select()
      .from(profileViews)
      .where(eq(profileViews.profileId, profileId))
      .orderBy(desc(profileViews.viewedAt));
  }

  async getProfileViewStats(profileId: number): Promise<{
    totalViews: number;
    todayViews: number;
    weekViews: number;
  }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalResult] = await db
      .select({ count: count() })
      .from(profileViews)
      .where(eq(profileViews.profileId, profileId));

    const [todayResult] = await db
      .select({ count: count() })
      .from(profileViews)
      .where(and(
        eq(profileViews.profileId, profileId),
        sql`${profileViews.viewedAt} >= ${today}`
      ));

    const [weekResult] = await db
      .select({ count: count() })
      .from(profileViews)
      .where(and(
        eq(profileViews.profileId, profileId),
        sql`${profileViews.viewedAt} >= ${weekAgo}`
      ));

    return {
      totalViews: totalResult.count,
      todayViews: todayResult.count,
      weekViews: weekResult.count,
    };
  }

  // Analytics operations
  async getConnectionStats(userId: string): Promise<{
    total: number;
    thisWeek: number;
    favorites: number;
  }> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalResult] = await db
      .select({ count: count() })
      .from(connections)
      .where(eq(connections.fromUserId, userId));

    const [weekResult] = await db
      .select({ count: count() })
      .from(connections)
      .where(and(
        eq(connections.fromUserId, userId),
        sql`${connections.connectedAt} >= ${weekAgo}`
      ));

    const [favoritesResult] = await db
      .select({ count: count() })
      .from(connections)
      .where(and(
        eq(connections.fromUserId, userId),
        eq(connections.isFavorite, true)
      ));

    return {
      total: totalResult.count,
      thisWeek: weekResult.count,
      favorites: favoritesResult.count,
    };
  }

  async getViewerProfessionStats(profileId: number): Promise<Array<{ profession: string; count: number }>> {
    // This would require joining with viewer profiles
    // For now, return mock data structure
    return [
      { profession: "Software Engineer", count: 35 },
      { profession: "Product Manager", count: 28 },
      { profession: "Designer", count: 18 },
      { profession: "Other", count: 19 },
    ];
  }
}

export const storage = new DatabaseStorage();
