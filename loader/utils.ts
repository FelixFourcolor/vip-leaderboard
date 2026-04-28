import { readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const relativePath = (file: string) =>
	resolve(dirname(fileURLToPath(import.meta.url)), file);

export const objMap = <T extends object, U>(
	obj: T,
	f: (k: keyof T, v: T[keyof T]) => U,
) => Object.entries(obj).map(([k, v]) => f(k as keyof T, v));

export const writeJson = (obj: unknown, path: string) =>
	writeFileSync(relativePath(path), JSON.stringify(obj));

export const readJson = <T>(path: string): Promise<T> =>
	readFile(relativePath(path)).then((data) => JSON.parse(data.toString()) as T);

export const ls = (path: string) => readdirSync(relativePath(path));

export const rm = (path: string) => unlinkSync(relativePath(path));
