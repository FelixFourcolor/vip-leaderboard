import {
	bigint,
	datetime,
	index,
	mysqlTable,
	primaryKey,
	varchar,
} from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
	id: varchar("id", { length: 255 }).primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	avatarUrl: varchar("avatar_url", { length: 255 }).notNull(),
	color: varchar("color", { length: 255 }).notNull(),
});

export const ticket = mysqlTable(
	"ticket",
	{
		id: bigint("id", { mode: "bigint" }).primaryKey(),
		timestamp: datetime("timestamp", { mode: "date" }).notNull(),
	},
	(t) => [index("timestamp_idx").on(t.timestamp)],
);

export const reaction = mysqlTable(
	"reaction",
	{
		ticketId: bigint("ticket_id", { mode: "bigint" })
			.notNull()
			.references(() => ticket.id),
		userId: varchar("user_id", { length: 255 })
			.notNull()
			.references(() => user.id),
	},
	(t) => [primaryKey({ columns: [t.ticketId, t.userId] })],
);
