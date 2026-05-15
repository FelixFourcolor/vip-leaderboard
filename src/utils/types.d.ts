import type { Dispatch, SetStateAction } from "react";

export type Maybe<T> = T | undefined;

export type State<Name extends string, Value> = {
	[K in Name]: Value;
} & {
	[K in `set${Capitalize<Name>}`]: Dispatch<SetStateAction<Value>>;
};
