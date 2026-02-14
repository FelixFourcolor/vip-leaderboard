import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
	],
	server: {
		proxy: {
			"/api": { target: "http://localhost:3001" },
		},
	},
	resolve: {
		alias: { "@": resolve(__dirname, "./src") },
	},
});
