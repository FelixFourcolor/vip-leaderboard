import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const DB_PATH = "leaderboard.db";

export function createDatabase() {
	const sqlite = new Database(DB_PATH);
	return { db: drizzle(sqlite), sqlite };
}
