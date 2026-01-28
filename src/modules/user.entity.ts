import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class User {
	@PrimaryKey()
	id: string;

	@Property()
	name: string;

	@Property()
	isVIP: boolean;

	constructor(id: string, name: string, isVIP: boolean) {
		this.id = id;
		this.name = name;
		this.isVIP = isVIP;
	}
}
