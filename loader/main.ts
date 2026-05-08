import { aggregate } from "./aggregate.js";
import { writeToDB } from "./db";
import { fetchInitialData, fetchUpdates } from "./update.js";

const init = () => fetchInitialData().then(aggregate).then(writeToDB);

const update = () => fetchUpdates().then(aggregate).then(writeToDB);

if (process.argv[2] === "init") {
	await init();
} else {
	await update();
}
