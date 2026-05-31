import type { Dispatch } from "react";

export type Maybe<T> = T | undefined;

export type State<
	Name extends string,
	Value,
	option extends { action: boolean } = { action: true },
> = {
	[K in `set${Capitalize<Name>}`]: Dispatch<
		Value | (option["action"] extends true ? (prev: Value) => Value : never)
	>;
} & { [K in Name]: Value };

export type Pair<T> = [T, T];

export type EitherOr<A extends object, B extends object> =
	| (A & Partial<Record<Exclude<keyof B, keyof A>, never>>)
	| (B & Partial<Record<Exclude<keyof A, keyof B>, never>>);

export type AtLeastOne<T extends object> = {
	[K in keyof T]: Required<Pick<T, K>> & Partial<T>;
}[keyof T];
