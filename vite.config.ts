import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

export default defineConfig({
	plugins: [
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
		lastUpdated(),
	],
	resolve: {
		alias: {
			"@": res("src"),
			"/sql-wasm-browser.wasm": res("node_modules/sql.js/dist/sql-wasm.wasm"),
		},
	},
});

function lastUpdated(): Plugin {
	return {
		name: "last-updated",
		resolveId(id) {
			if (id === "virtual:db/last-updated") {
				return `\0virtual:db/last-updated`;
			}
		},
		load(id) {
			if (id !== `\0virtual:db/last-updated`) {
				return;
			}
			const db = new DatabaseSync(res("public/leaderboard.db"));
			const { timestamp } = db
				.prepare("SELECT timestamp FROM ticket ORDER BY timestamp DESC LIMIT 1")
				.get() as { timestamp: number };
			db.close();
			return `export const lastUpdated = new Date(${timestamp * 1000});`;
		},
	};
}

function res(relativePath: string) {
	return resolve(__dirname, relativePath);
}
