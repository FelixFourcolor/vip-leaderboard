import Database from "better-sqlite3";
import { isNull, notInArray, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { activity, user } from "@/db/schema";
import { pick } from "@/utils/object";

export type UserData = typeof user.$inferInsert;
export type ActivityData = typeof activity.$inferInsert;

export async function populateDb(
	users: UserData[],
	activities: ActivityData[],
) {
	const sqlite = new Database("public/db.sqlite");

	await drizzle(sqlite).transaction((tx) => {
		if (users.length > 0) {
			tx.insert(user)
				.values(users)
				.onConflictDoUpdate({
					target: user.id,
					set: {
						name: sql`excluded.name`,
						avatarUrl: sql`excluded.avatar_url`,
						color: sql`COALESCE(excluded.color, color)`,
					},
				})
				.run();
		}
		if (activities.length > 0) {
			tx.insert(activity).values(activities).onConflictDoNothing().run();
		}

		const activeUserIds = tx.select(pick(activity, ["userId"])).from(activity);
		tx.delete(user)
			.where(or(isNull(user.color), notInArray(user.id, activeUserIds)))
			.run();
	});

	sqlite.close();
}
