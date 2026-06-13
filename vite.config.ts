import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import type { User } from "./loader/types";

const SQL_WASM = {
	origin: res("node_modules/sql.js/dist/sql-wasm.wasm"),
	output: "sql-wasm-browser.wasm",
};

export default defineConfig({
	plugins: [
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
		sqlWasmBundler(),
		dbBundler(),
	],
	resolve: {
		alias: {
			"@": res("src"),
			[`/${SQL_WASM.output}`]: SQL_WASM.origin,
		},
	},
	base: "/vip-leaderboard/",
});

// so that the page can render before db is loaded
function dbBundler(): Plugin {
	return {
		name: "db-bundler",
		resolveId(id) {
			if (id === "virtual:db") {
				return `\0virtual:db`;
			}
		},
		load(id) {
			if (id !== `\0virtual:db`) {
				return;
			}

			const db = new DatabaseSync(res("public/db.sqlite"));

			const { date: firstTimestamp } = db
				.prepare("SELECT date FROM activity ORDER BY date ASC LIMIT 1")
				.get() as { date: number };

			const { date: lastTimestamp } = db
				.prepare("SELECT date FROM activity ORDER BY date DESC LIMIT 1")
				.get() as { date: number };

			const { avatarUrl, color } = db
				.prepare(
					`SELECT 
						avatar_url as avatarUrl,
						color 
					FROM user
					WHERE id = 'zackwb'`,
				)
				.get() as Pick<User, "avatarUrl" | "color">;

			db.close();

			return `export const FIRST_DATE = new Date(${firstTimestamp * 1000})
					export const LAST_UPDATE = new Date(${lastTimestamp * 1000});
					export const ZACK = { avatarUrl: "${avatarUrl}", color: "${color}" };`;
		},
	};
}

function sqlWasmBundler(): Plugin {
	return {
		name: "sqlWasm",
		apply: "build",
		closeBundle() {
			copyFileSync(SQL_WASM.origin, res(`dist/${SQL_WASM.output}`));
		},
	};
}

function res(relativePath: string) {
	return resolve(__dirname, relativePath);
}
