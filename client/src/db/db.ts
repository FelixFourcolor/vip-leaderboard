import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";

export const db = Promise.all([
	initSqlJs(),
	fetch("/leaderboard.db")
		.then((res) => res.arrayBuffer())
		.then((buffer) => new Uint8Array(buffer)),
])
	.then(([SQL, data]) => new SQL.Database(data))
	.then(drizzle);
