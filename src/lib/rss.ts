
import { XMLParser } from "fast-xml-parser";

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};


export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: { "User-Agent": "gator" }
  });
  const xml = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    ignoreDeclaration: true
  });
  const parsed = parser.parse(xml);

  if (!parsed.rss?.channel) {
    throw new Error("RSS feed missing channel");
  }

  const channel = parsed.rss.channel;

  const { title, link, description } = channel;
  if (!title || !link || !description) {
    throw new Error("RSS channel missing required metadata");
  }

  let itemsArray: RSSItem[] = [];

  if (channel.item) {
    if (Array.isArray(channel.item)) {
      itemsArray = channel.item
        .map((i: any) => {
          const { title, link, description, pubDate } = i;
          if (!title || !link || !description || !pubDate) return null;
          return { title, link, description, pubDate };
        })
        .filter(Boolean) as RSSItem[];
    } else if (typeof channel.item === "object") {
      const i = channel.item;
      const { title, link, description, pubDate } = i;
      if (title && link && description && pubDate) {
        itemsArray.push({ title, link, description, pubDate });
      }
    }
  }

  const result: RSSFeed = {
    channel: {
      title,
      link,
      description,
      item: itemsArray
    }
  };

  return result;
}