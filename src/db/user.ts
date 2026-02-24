import { eq } from "drizzle-orm";
import { pick } from "@/utils/object";
import { db } from "./db";
import { user } from "./schema";

export type UserData = Pick<
	typeof user.$inferInsert,
	"name" | "avatarUrl" | "color"
>;

export async function getUser(userId: string): Promise<UserData | undefined> {
	const rows = (await db)
		.select({ ...pick(user, ["name", "avatarUrl", "color"]) })
		.from(user)
		.where(eq(user.id, userId))
		.all();

	return rows[0];
}
