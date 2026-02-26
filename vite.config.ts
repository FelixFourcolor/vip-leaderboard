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
		lastUpdatedBundler(),
	],
	resolve: {
		alias: {
			"@": res("src"),
			[`/${SQL_WASM.output}`]: SQL_WASM.origin,
		},
	},
});

// so that the page can render before db is loaded
function lastUpdatedBundler(): Plugin {
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
			const db = new DatabaseSync(res("public/db"));
			const { date } = db
				.prepare("SELECT date FROM activity ORDER BY date DESC LIMIT 1")
				.get() as { date: number };
			db.close();
			return `export const lastUpdated = new Date(${date * 1000});`;
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
