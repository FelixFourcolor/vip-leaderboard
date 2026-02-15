import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/schema.ts",
	dialect: "mysql",
	dbCredentials: {
		url: "mysql://felix@localhost:3306/leaderboard",
	},
});
