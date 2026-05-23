import { readdirSync, unlinkSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const relativePath = (file: string) =>
	resolve(dirname(fileURLToPath(import.meta.url)), file);

export const writeJson = (path: string, obj: unknown): Promise<void> =>
	writeFile(relativePath(path), JSON.stringify(obj));

export const readJson = <T>(path: string): Promise<T> =>
	readFile(relativePath(path)).then((data) => JSON.parse(data.toString()) as T);

export const ls = (path: string) => readdirSync(relativePath(path));

export const rm = (path: string) => unlinkSync(relativePath(path));
