import { eq } from "drizzle-orm";
import { pick } from "@/utils/object";
import { db } from "./db";
import { user } from "./schema";

export type UserData = typeof user.$inferInsert;

export async function getUser(userId: string): Promise<UserData | undefined> {
	const rows = (await db)
		.select(userFields)
		.from(user)
		.where(eq(user.id, userId))
		.all();

	return rows[0];
}

export const userFields = pick(user, ["id", "name", "avatarUrl", "color"]);
