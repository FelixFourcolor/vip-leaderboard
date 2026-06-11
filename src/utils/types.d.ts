import type { Dispatch } from "react";

export type Maybe<T> = T | undefined;

export type State<
	S extends Record<string, unknown>,
	opt extends { action: boolean } = { action: true },
> = {
	[K in keyof S]: S[K];
} & {
	[K in keyof S as `set${Capitalize<K>}`]: Dispatch<
		S[K] | (opt["action"] extends true ? (prev: S[K]) => S[K] : never)
	>;
};

export type Pair<T> = [T, T];

export type EitherOr<A extends object, B extends object> =
	| (A & Partial<Record<Exclude<keyof B, keyof A>, never>>)
	| (B & Partial<Record<Exclude<keyof A, keyof B>, never>>);

export type AtLeastOneOf<T extends object> = {
	[K in keyof T]: Required<Pick<T, K>> & Partial<T>;
}[keyof T];

export type OneOf<T extends object, K extends keyof T = keyof T> = K extends K
	? Required<Pick<T, K>> & Partial<Record<Exclude<keyof T, K>, never>>
	: never;
