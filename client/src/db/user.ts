import { eq } from "drizzle-orm";
import { pick } from "@/utils/object";
import { db } from "./db";
import { user } from "./schema";

export type UserData = {
	name: string;
	avatarUrl: string;
	color: string;
};

export async function getUser(userId: string): Promise<UserData | undefined> {
	const rows = (await db)
		.select({ ...pick(user, ["name", "avatarUrl", "color"] as const) })
		.from(user)
		.where(eq(user.id, userId))
		.all();

	return rows[0];
}
