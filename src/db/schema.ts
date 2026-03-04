import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	avatarUrl: text("avatar_url").notNull(),
	color: text("color"),
});

export const activity = sqliteTable(
	"activity",
	{
		date: integer("date", { mode: "timestamp" }).notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.date, t.userId] })],
);
