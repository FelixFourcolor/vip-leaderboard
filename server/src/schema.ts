import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	avatarUrl: text("avatar_url").notNull(),
	color: text("color").notNull(),
});

export const ticket = sqliteTable(
	"ticket",
	{
		id: text("id").primaryKey(),
		timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
	},
	(t) => [index("timestamp_idx").on(t.timestamp)],
);

export const reaction = sqliteTable(
	"reaction",
	{
		ticketId: text("ticket_id")
			.notNull()
			.references(() => ticket.id),
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
	},
	(t) => [primaryKey({ columns: [t.ticketId, t.userId] })],
);
