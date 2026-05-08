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
		type: text("type", { enum: ["reaction", "warning"] }).notNull(),
	},
	// cannot use autoincrement pk
	// because you can react multiple times to a message, but they should only be counted once
	(t) => [primaryKey({ columns: [t.date, t.userId] })],
);
