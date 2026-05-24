import { eq } from "drizzle-orm";
import { pick } from "@/utils/object";
import { loadDb } from "./db";
import { user } from "./schema";

export type User = typeof user.$inferSelect;

export async function getUser(userId: string): Promise<User | undefined> {
	const db = await loadDb();
	return db.select(userFields).from(user).where(eq(user.id, userId)).get();
}

export const userFields = pick(user, ["id", "name", "avatarUrl", "color"]);
