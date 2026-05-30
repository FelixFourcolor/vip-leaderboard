import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const SQL_WASM = {
	origin: res("node_modules/sql.js/dist/sql-wasm.wasm"),
	output: "sql-wasm-browser.wasm",
};

export default defineConfig({
	plugins: [
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
		sqlWasmBundler(),
		lastUpdateDateBundler(),
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
function lastUpdateDateBundler(): Plugin {
	return {
		name: "last-update",
		resolveId(id) {
			if (id === "virtual:db/last-update") {
				return `\0virtual:db/last-update`;
			}
		},
		load(id) {
			if (id !== `\0virtual:db/last-update`) {
				return;
			}

			const db = new DatabaseSync(res("public/db.sqlite"));
			const { date } = db
				.prepare("SELECT date FROM activity ORDER BY date DESC LIMIT 1")
				.get() as { date: number };
			db.close();

			return `export default new Date(${date * 1000});`;
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
