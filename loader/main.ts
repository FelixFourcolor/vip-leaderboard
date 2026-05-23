import { aggregate } from "./aggregate";
import { writeToDB } from "./db";
import { getCurrentData, getUpdates } from "./update";

if (process.argv[2] === "update") {
	await getUpdates().then(aggregate).then(writeToDB);
} else if (process.argv[2] === "reload") {
	await getCurrentData().then(aggregate).then(writeToDB);
} else {
	console.error("update or reload?");
}
