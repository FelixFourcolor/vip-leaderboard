import { defineConfig } from "@mikro-orm/mysql";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";

export default defineConfig({
	dbName: "leaderboard",
	user: "felix",
	password: "",
	host: "localhost",
	port: 3306,
	entities: ["dist/**/*.entity.js"],
	entitiesTs: ["src/**/*.entity.ts"],
	metadataProvider: TsMorphMetadataProvider,
});
