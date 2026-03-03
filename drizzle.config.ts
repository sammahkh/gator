import { defineConfig } from "drizzle-kit";


import fs from "fs";
import path from "path";
import os from "os";

function readConfigFile() {
  const filePath = path.join(os.homedir(), ".gatorconfig.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  return parsed.db_url; 
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: readConfigFile(), 
  },
});
