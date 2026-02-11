import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/": { target: "http://localhost:3001" },
		},
	},
	resolve: {
		alias: { "@": resolve(__dirname, "./src") },
	},
});
