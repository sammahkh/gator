import { setUser } from "./config.js";
import { createUser, getUserByName } from "./lib/db/queries/users.js";
import { deleteAllUsers } from "./lib/db/queries/users.js";
import { getUsers } from "./lib/db/queries/users.js";
import { readConfig } from "./config.js";
import { fetchFeed } from "./lib/rss.js";
import { createFeed } from "./lib/db/queries/feeds.js";
import { printFeed } from "./lib/db/queries/helpers.js"; 
import { getCurrentUser } from "./config.js"; 
import { getAllFeeds } from "./lib/db/queries/feeds.js";
import { createFeedFollow } from "./lib/db/queries/feedFollows.js";
import { getFeedByURL } from "./lib/db/queries/feeds.js";
import { getFeedFollowsForUser } from "./lib/db/queries/feedFollows.js";
import { deleteFeedFollowByUserAndUrl } from "./lib/db/queries/feedFollows.js";
import { scrapeFeeds } from "./lib/aggregator.js";
import { parseDuration } from "./lib/utils.js";
import { getPostsForUser } from "./lib/db/queries/posts.js";

import type { User } from "./lib/db/schema.js";


type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type CommandsRegistry = Record<string, CommandHandler>;
type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;


async function handlerLogin(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("username is required");
  }

  const username = args[0];

  const existing = await getUserByName(username);

  if (!existing) {
    throw new Error("user does not exist");
  }

  await setUser(username);

  console.log(`User set to ${username}`);
}


async function handlerRegister(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("username is required");
  }

  const username = args[0];

  const existing = await getUserByName(username);

  if (existing) {
    throw new Error("user already exists");
  }

  const user = await createUser(username);

  await setUser(username);

  console.log("User created successfully!");
  console.log(user);
}


async function handlerReset(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  try {
    await deleteAllUsers();
    console.log("Database reset successfully.");
  } catch {
    throw new Error("Failed to reset database");
  }
}

async function handlerUsers(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const allUsers = await getUsers();

  const config = readConfig();
  const currentUser = config.currentUserName;

  for (const user of allUsers) {
    if (user.name === currentUser) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
}



async function handlerAgg(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length < 1) {
    throw new Error("Usage: agg <time_between_reqs>");
  }

  const durationStr = args[0];
  const timeBetweenRequests = parseDuration(durationStr);

  console.log(`Collecting feeds every ${durationStr}`);

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      console.error("Error:", err.message);
    } else {
      console.error("Unknown error occurred.");
    }
  };

  scrapeFeeds().catch(handleError);

  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 2) {
    throw new Error("Usage: addfeed <name> <url>");
  }

  const name = args[0];
  const url = args[1];

  const feed = await createFeed(user.id, name, url);

  const follow = await createFeedFollow(user.id, feed.id);

  console.log(`${follow.userName} is now following ${follow.feedName}`);
}


async function handlerFeeds(cmdName: string, ...args: string[]) {
  const allFeeds = await getAllFeeds();

  if (allFeeds.length === 0) {
    console.log("No feeds found.");
    return;
  }

  for (const row of allFeeds) {
    printFeed(row.feeds, row.users);
  }
}

async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  if (args.length < 1) {
    throw new Error("Usage: follow <url>");
  }

  const url = args[0];

  const feed = await getFeedByURL(url);
  if (!feed) {
    throw new Error("Feed not found");
  }

  const follow = await createFeedFollow(user.id, feed.id);

  console.log(`${follow.userName} is now following ${follow.feedName}`);
}

async function handlerFollowing(
  cmdName: string,
  user: User
) {
  const follows = await getFeedFollowsForUser(user.id);

  if (follows.length === 0) {
    console.log("You are not following any feeds.");
    return;
  }

  for (const follow of follows) {
    console.log(follow.feedName);
  }
}

async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 1) {
    throw new Error("Usage: unfollow <url>");
  }

  const url = args[0];

  const result = await deleteFeedFollowByUserAndUrl(user.id, url);

  console.log(`${user.name} unfollowed ${result.feedName}`);
}




export async function handlerBrowse(
  cmdName: string,
  user: User,
  limitArg?: string
) {
  const limit = limitArg ? parseInt(limitArg) : 2;

  if (isNaN(limit)) {
    throw new Error("Limit must be a number");
  }

  const posts = await getPostsForUser(user.id, limit);

  for (const post of posts) {
    console.log(`
${post.title}
${post.feedName}
${post.url}
${post.publishedAt}
--------------------------------
`);
  }
}


function middlewareLoggedIn(
  handler: UserCommandHandler
): CommandHandler {
  return async (cmdName: string, ...args: string[]) => {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("No user is logged in");
    }

    return handler(cmdName, user, ...args);
  };
}


function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
): void {
  registry[cmdName] = handler;
}

async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  await handler(cmdName, ...args);
}












async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Not enough arguments provided.");
    process.exit(1);
  }

  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(
  registry,
  "addfeed",
  middlewareLoggedIn(handlerAddFeed)
  );

  registerCommand(
  registry,
  "follow",
  middlewareLoggedIn(handlerFollow)
  );

  registerCommand(
  registry,
  "following",
  middlewareLoggedIn(handlerFollowing)
  );

  registerCommand(
  registry,
  "unfollow",
  middlewareLoggedIn(handlerUnfollow)
);

registerCommand(
  registry,
  "browse",
  middlewareLoggedIn(handlerBrowse)
);
  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
    process.exit(0);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error("Unknown error occurred.");
    }
    process.exit(1);
  }
}


main();