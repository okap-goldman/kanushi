import { desc, sql } from 'drizzle-orm';
import { db } from './db/client';
import { posts, likes, comments, highlights, profiles } from './db/schema';
import type { ServiceResult } from './data';

export interface HitChartPost {
  id: string;
  title: string;
  contentType: 'audio' | 'image' | 'text';
  mediaUrl?: string;
  textContent?: string;
  profileId: string;
  createdAt: Date;
  profileName: string;
  profileAvatar?: string;
  likeCount: number;
  commentCount: number;
  highlightCount: number;
  score: number;
}

export interface HitChartService {
  getTopPosts(limit?: number): Promise<ServiceResult<HitChartPost[]>>;
  getTrendingPosts(limit?: number): Promise<ServiceResult<HitChartPost[]>>;
}

export function createHitChartService(dbClient = db): HitChartService {
  return {
    async getTopPosts(limit = 50): Promise<ServiceResult<HitChartPost[]>> {
      try {
        const result = await dbClient
          .select({
            id: posts.id,
            title: posts.title,
            contentType: posts.contentType,
            mediaUrl: posts.mediaUrl,
            textContent: posts.textContent,
            profileId: posts.profileId,
            createdAt: posts.createdAt,
            profileName: profiles.displayName,
            profileAvatar: profiles.avatarUrl,
            likeCount: sql<number>`COUNT(DISTINCT ${likes.id})::int`,
            commentCount: sql<number>`COUNT(DISTINCT ${comments.id})::int`,
            highlightCount: sql<number>`COUNT(DISTINCT ${highlights.id})::int`,
          })
          .from(posts)
          .leftJoin(profiles, eq(posts.profileId, profiles.id))
          .leftJoin(likes, eq(posts.id, likes.postId))
          .leftJoin(comments, eq(posts.id, comments.postId))
          .leftJoin(highlights, eq(posts.id, highlights.postId))
          .groupBy(posts.id, profiles.id)
          .orderBy(
            desc(sql`COUNT(DISTINCT ${likes.id}) + COUNT(DISTINCT ${comments.id}) * 2 + COUNT(DISTINCT ${highlights.id}) * 5`)
          )
          .limit(limit);

        const hitChartPosts: HitChartPost[] = result.map((post) => ({
          ...post,
          score: post.likeCount + post.commentCount * 2 + post.highlightCount * 5,
        }));

        return { success: true, data: hitChartPosts };
      } catch (error) {
        console.error('Error fetching top posts:', error);
        return { success: false, error: 'Failed to fetch top posts' };
      }
    },

    async getTrendingPosts(limit = 20): Promise<ServiceResult<HitChartPost[]>> {
      try {
        // Get posts from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const result = await dbClient
          .select({
            id: posts.id,
            title: posts.title,
            contentType: posts.contentType,
            mediaUrl: posts.mediaUrl,
            textContent: posts.textContent,
            profileId: posts.profileId,
            createdAt: posts.createdAt,
            profileName: profiles.displayName,
            profileAvatar: profiles.avatarUrl,
            likeCount: sql<number>`COUNT(DISTINCT ${likes.id})::int`,
            commentCount: sql<number>`COUNT(DISTINCT ${comments.id})::int`,
            highlightCount: sql<number>`COUNT(DISTINCT ${highlights.id})::int`,
          })
          .from(posts)
          .leftJoin(profiles, eq(posts.profileId, profiles.id))
          .leftJoin(likes, and(eq(posts.id, likes.postId), gte(likes.createdAt, sevenDaysAgo)))
          .leftJoin(comments, and(eq(posts.id, comments.postId), gte(comments.createdAt, sevenDaysAgo)))
          .leftJoin(highlights, and(eq(posts.id, highlights.postId), gte(highlights.createdAt, sevenDaysAgo)))
          .where(gte(posts.createdAt, sevenDaysAgo))
          .groupBy(posts.id, profiles.id)
          .orderBy(
            desc(sql`COUNT(DISTINCT ${likes.id}) + COUNT(DISTINCT ${comments.id}) * 2 + COUNT(DISTINCT ${highlights.id}) * 5`)
          )
          .limit(limit);

        const hitChartPosts: HitChartPost[] = result.map((post) => ({
          ...post,
          score: post.likeCount + post.commentCount * 2 + post.highlightCount * 5,
        }));

        return { success: true, data: hitChartPosts };
      } catch (error) {
        console.error('Error fetching trending posts:', error);
        return { success: false, error: 'Failed to fetch trending posts' };
      }
    },
  };
}

// Import missing functions
import { eq, gte } from 'drizzle-orm';