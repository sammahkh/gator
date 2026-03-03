import { eq } from "drizzle-orm";
import { feeds , users} from "../schema.js";
import { db } from "../index.js";
import { asc, sql } from "drizzle-orm";

export async function createFeed(
  userId: string,
  name: string,
  url: string
) {
  const [feed] = await db
    .insert(feeds)
    .values({
      userId,
      name,
      url,
    })
    .returning();

  return feed;
}


export async function getAllFeeds() {
  return await db
    .select()
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id));
}

export async function getFeedByURL(url: string) {
  const [feed] = await db
    .select()
    .from(feeds)
    .where(eq(feeds.url, url));

  return feed ?? null;
}


export async function getNextFeedToFetch() {
  const result = await db
    .select()
    .from(feeds)
    .orderBy(sql`${feeds.lastFetchedAt} NULLS FIRST`, asc(feeds.lastFetchedAt))
    .limit(1);

  return result[0];
}

export async function markFeedFetched(feedId: string) {
  await db
    .update(feeds)
    .set({
      lastFetchedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(feeds.id, feedId));
}