import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class User {
	@PrimaryKey()
	id: string;

	@Property()
	name: string;

	@Property()
	avatarUrl: string;

	@Property()
	color: string | null;

	constructor(
		id: string,
		name: string,
		avatarUrl: string,
		color: string | null,
	) {
		this.id = id;
		this.name = name;
		this.avatarUrl = avatarUrl.substring(0, avatarUrl.indexOf("?"));
		this.color = color;
	}
}
