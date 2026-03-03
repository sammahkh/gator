import fs from "fs";
import os from "os";
import path from "path";
import { db } from "./lib/db/index.js";
import { users } from "./lib/db/schema.js";
import { eq } from "drizzle-orm";

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
  const filePath = getConfigFilePath();
  const rawConfig = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };
  fs.writeFileSync(filePath, JSON.stringify(rawConfig, null, 2));
}

function validateConfig(rawConfig: any): Config {
  if (!rawConfig.db_url) {
    throw new Error("db_url is required in config file");
  }
  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name,
  };
}

export function readConfig(): Config {
  const filePath = getConfigFilePath();
  const data = fs.readFileSync(filePath, { encoding: "utf-8" });
  const parsed = JSON.parse(data);
  return validateConfig(parsed);
}

export function setUser(userName: string): void {
  const config = readConfig();
  config.currentUserName = userName;
  writeConfig(config);
}



export async function getCurrentUser() {
  const cfg = readConfig();
  if (!cfg.currentUserName) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.name, cfg.currentUserName)); 
  return user ?? null;
}