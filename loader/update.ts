import { spawn } from "node:child_process";
import { ls, readJson, relativePath, rm, writeJson } from "./file-utils";
import type { Channel } from "./types";

const dataDir = "data-repo/data";

export const getCurrentData = () =>
	Promise.all(
		ls(dataDir).map((file) => readJson<Channel>(`${dataDir}/${file}`)),
	);

export const getUpdates = () =>
	Promise.all(
		ls(dataDir).map(async (file) => {
			const { channel, messages } = await readJson<Channel>(
				`${dataDir}/${file}`,
			);
			const lastUpdate = messages[messages.length - 1]!.id;

			const update = await fetch(channel.id, lastUpdate);
			await writeJson(`${dataDir}/${file}`, {
				channel: { id: channel.id },
				messages: [...messages, ...update.messages],
			} satisfies Channel);

			return update;
		}),
	);

async function fetch(channelId: string, afterMessageId: string) {
	const dataFile = `${channelId}-${afterMessageId}.json`;
	await new Promise<void>((resolve) => {
		spawn(
			"discord-chat-exporter-plus-cli",
			[
				"export",
				...["-c", channelId],
				...["--token", process.env.DISCORD_TOKEN!],
				...["--after", afterMessageId],
				...["-f", "json"],
				...["-o", relativePath(dataFile)],
			],
			{ stdio: "inherit" },
		).on("exit", (code) => {
			if (code !== 0) {
				process.exit(code);
			}
			resolve();
		});
	});
	const data = await readJson<Channel>(dataFile);
	rm(dataFile);
	return data;
}
