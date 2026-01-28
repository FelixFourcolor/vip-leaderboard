import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import type { User } from "./user.entity.js";

@Entity()
export class Ticket {
	@PrimaryKey()
	id: string;

	@ManyToOne()
	author: User

	@Property()
	timestamp: Date;

	constructor(id: string, author: User, timestamp: Date) {
		this.id = id;
		this.author = author;
		this.timestamp = timestamp;
	}
}
