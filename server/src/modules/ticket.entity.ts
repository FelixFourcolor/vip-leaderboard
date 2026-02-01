import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import type { User } from "./user.entity.js";

@Entity()
export class Ticket {
	@PrimaryKey()
	id: bigint;

	@ManyToOne()
	author: User;

	@Property()
	timestamp: Date;

	constructor(id: bigint, author: User, timestamp: Date) {
		this.id = id;
		this.author = author;
		this.timestamp = timestamp;
	}
}
