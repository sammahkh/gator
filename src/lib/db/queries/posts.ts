import { desc, eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import { posts, feeds, feedFollows } from "../schema.js";


type CreatePostInput = {
  title: string;
  url: string;
  description?: string;
  publishedAt?: Date;
  feedId: string;
};

export async function createPost(input: CreatePostInput) {
  try {
    await db.insert(posts).values({
      title: input.title,
      url: input.url,
      description: input.description,
      publishedAt: input.publishedAt,
      feedId: input.feedId,
    });
  } catch (err: any) {
    // ignore duplicate URL errors
    if (err.code === "23505") {
      return;
    }
    throw err;
  }
}



export async function getPostsForUser(
  userId: string,
  limit: number
) {
  return await db
    .select({
      title: posts.title,
      url: posts.url,
      description: posts.description,
      publishedAt: posts.publishedAt,
      feedName: feeds.name,
    })
    .from(posts)
    .innerJoin(feeds, eq(posts.feedId, feeds.id))
    .innerJoin(feedFollows, eq(feedFollows.feedId, feeds.id))
    .where(eq(feedFollows.userId, userId))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}