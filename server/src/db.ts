import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connectionConfig = {
	host: "localhost",
	port: 3306,
	user: "felix",
	password: "",
	database: "leaderboard",
	timezone: "+00:00",
} as const;

export function createPool() {
	const pool = mysql.createPool(connectionConfig);
	return { db: drizzle(pool), pool };
}

export async function createConnection() {
	const connection = await mysql.createConnection(connectionConfig);
	return { db: drizzle(connection), connection };
}
