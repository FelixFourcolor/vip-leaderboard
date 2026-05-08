import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	avatarUrl: text("avatar_url").notNull(),
	color: text("color"),
});

export const activity = sqliteTable("activity", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	date: integer("date", { mode: "timestamp" }).notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	type: text("type", { enum: ["reaction", "warning"] }).notNull(),
});
