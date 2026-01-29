import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class User {
	@PrimaryKey()
	id: bigint;

	@Property()
	name: string;

	@Property()
	isVIP: boolean;

	constructor(id: bigint, name: string, isVIP: boolean) {
		this.id = id;
		this.name = name;
		this.isVIP = isVIP;
	}
}
