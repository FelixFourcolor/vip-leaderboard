import { drizzle } from "drizzle-orm/sql-js";
import { memoize } from "es-toolkit";
import initSqlJs from "sql.js";

export const loadDb = memoize(() =>
	Promise.all([
		initSqlJs(),
		fetch("/db")
			.then((res) => res.arrayBuffer())
			.then((buffer) => new Uint8Array(buffer)),
	])
		.then(([SQL, data]) => new SQL.Database(data))
		.then(drizzle),
);
