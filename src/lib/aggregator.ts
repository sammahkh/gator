import { getNextFeedToFetch, markFeedFetched } from "./db/queries/feeds.js";
import { fetchFeed } from "./rss.js";

import { createPost } from "./db/queries/posts.js";

export async function scrapeFeeds() {
  const nextFeed = await getNextFeedToFetch();

  if (!nextFeed) {
    console.log("No feeds available to fetch.");
    return;
  }

  console.log(`Fetching feed: ${nextFeed.name}`);

  await markFeedFetched(nextFeed.id);

  const rss = await fetchFeed(nextFeed.url);

  for (const item of rss.channel.item) {
    let publishedAt: Date | undefined;

    if (item.pubDate) {
      const date = new Date(item.pubDate);
      if (!isNaN(date.getTime())) {
        publishedAt = date;
      }
    }

    await createPost({
      title: item.title ?? "No title",
      url: item.link,
      description: item.description,
      publishedAt,
      feedId: nextFeed.id,
    });
  }
}