import type { Feed, User } from "../schema";

export function printFeed(feed: Feed, user: User) {
  console.log("Feed Details:");
  console.log(`Name: ${feed.name}`);
  console.log(`URL: ${feed.url}`);
  console.log(`Added by: ${user.name}`);
  console.log(`Created at: ${feed.createdAt}`);
  console.log(`Updated at: ${feed.updatedAt}`);
  console.log("-----------------------------");
}