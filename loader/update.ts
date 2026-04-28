import { spawn } from "node:child_process";
import type { Data, LastUpdateData } from "./types";
import { ls, objMap, readJson, relativePath, rm, writeJson } from "./utils";

export const fetchInitialData = () =>
	Promise.all(
		ls("data").map((file) => readJson<Data>(`data/${file}`).then(logUpdate)),
	);

export const fetchUpdates = () =>
	readJson<LastUpdateData>("last-update.json").then((channels) =>
		Promise.all(
			objMap(channels, (channelId, messageId) =>
				fetch(channelId, messageId).then(logUpdate),
			),
		),
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
	const data = await readJson<Data>(dataFile);
	rm(dataFile);
	return data;
}

async function logUpdate({ channel: { id }, noUpdate, messages }: Data) {
	if (!noUpdate) {
		const latest = messages[messages.length - 1];
		if (!latest) {
			return [];
		}
		const lastUpdateData = await readJson<LastUpdateData>(
			"last-update.json",
		).catch(() => ({}) as LastUpdateData);
		lastUpdateData[id] = latest.id;
		writeJson(lastUpdateData, "last-update.json");
	}

	return messages;
}
