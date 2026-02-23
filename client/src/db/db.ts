import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";

export const db = (async () => {
	const SQL = await initSqlJs();
	const response = await fetch("/leaderboard.db");
	const buffer = await response.arrayBuffer();
	const sqlite = new SQL.Database(new Uint8Array(buffer));
	return drizzle(sqlite);
})();
