import { readFileSync } from "node:fs";
import { MikroORM } from "@mikro-orm/mysql";
import { Reaction } from "../modules/reaction.entity.js";
import { Ticket } from "../modules/ticket.entity.js";
import { User } from "../modules/user.entity.js";
import type { Data, User as UserDTO } from "./type.js";

const VIP_REACTIONS = [
	"white_check_mark",
	"x",
	"hammer",
	"warning",
	"wastebasket",
];

async function loadDb() {
	const orm = await MikroORM.init();
	await orm.schema.refreshDatabase();
	return orm;
}

const usersMap = new Map<User["id"], User>();
const tickets: Ticket[] = [];
const reactionsMap = new Map<`${Ticket["id"]}-${User["id"]}`, Reaction>();

function getOrCreateUser({ name, nickname, avatarUrl, color }: UserDTO): User {
	name = name.toLowerCase(); // sql primary key may be case-insensitive
	let user = usersMap.get(name);
	if (!user) {
		user = new User(name, nickname, avatarUrl, color);
		usersMap.set(name, user);
	} else if (color) {
		// don't know why user color is unreliable
		user.color = color;
	}
	return user;
}

async function load() {
	const ormPromise = loadDb();
	const content = readFileSync("data.json");
	const data: Data = JSON.parse(content.toString());

	for (const { id, timestamp, author, reactions } of data.messages) {
		const vipReactions = reactions.filter((r) =>
			VIP_REACTIONS.includes(r.emoji.code),
		);
		if (vipReactions.length === 0) {
			continue;
		}

		const ticketId = BigInt(id);
		const ticket = new Ticket(
			ticketId,
			getOrCreateUser(author),
			new Date(timestamp),
		);
		tickets.push(ticket);

		for (const user of vipReactions.flatMap((r) => r.users)) {
			const reactor = getOrCreateUser(user);
			const reactionId = `${ticketId}-${reactor.id}` as const;
			if (!reactionsMap.has(reactionId)) {
				reactionsMap.set(reactionId, new Reaction(ticket, reactor));
			}
		}
	}

	const orm = await ormPromise;
	const db = orm.em.fork();
	db.persist(usersMap.values());
	db.persist(tickets);
	db.persist(reactionsMap.values());
	await db.flush();
	await orm.close();
}

load();
