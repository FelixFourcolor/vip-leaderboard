import { Entity, ManyToOne, PrimaryKeyProp } from "@mikro-orm/core";
import type { Ticket } from "./ticket.entity.js";
import type { User } from "./user.entity.js";

@Entity()
export class Reaction {
	@ManyToOne({ primary: true })
	ticket: Ticket;

	@ManyToOne({ primary: true })
	user: User;

	[PrimaryKeyProp]?: ["ticket", "user"];

	constructor(ticket: Ticket, user: User) {
		this.ticket = ticket;
		this.user = user;
	}
}
