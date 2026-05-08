import Database from "better-sqlite3";
import { isNull, notInArray, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { activity, user } from "@/db/schema";
import { pick } from "@/utils/object";

export type UserData = typeof user.$inferInsert;
export type ActivityData = typeof activity.$inferInsert;

export function writeToDB(data: {
	users: UserData[];
	activities: ActivityData[];
}) {
	const { users, activities } = data;
	const db = new Database("public/db.sqlite");

	drizzle(db).transaction((tx) => {
		inChunks(users, 8000, (values) =>
			tx
				.insert(user)
				.values(values)
				.onConflictDoUpdate({
					target: user.id,
					set: {
						name: sql`excluded.name`,
						avatarUrl: sql`excluded.avatar_url`,
						color: sql`COALESCE(excluded.color, color)`,
					},
				})
				.run(),
		);

		inChunks(activities, 10000, (values) =>
			tx.insert(activity).values(values).onConflictDoNothing().run(),
		);

		const activeUserIds = tx.select(pick(activity, ["userId"])).from(activity);
		tx.delete(user)
			.where(or(isNull(user.color), notInArray(user.id, activeUserIds)))
			.run();
	});

	db.close();
}

function inChunks<T>(array: T[], chunkSize: number, f: (chunk: T[]) => void) {
	for (let i = 0; i < array.length; i += chunkSize) {
		f(array.slice(i, i + chunkSize));
	}
}
