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
	| (A & Partial<Record<keyof B, never>>)
	| (B & Partial<Record<keyof A, never>>);
