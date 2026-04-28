import { aggregate } from "./aggregate.js";
import { populateDb } from "./db";
import { fetchInitialData, fetchUpdates } from "./update.js";

async function init() {
	// must we sequential:
	// initial data -> get last message -> fetch updates after that
	const initData = await fetchInitialData();
	const updatesData = await fetchUpdates();

	const data = aggregate([...initData, ...updatesData].flat());
	populateDb(...data);
}

const update = () =>
	fetchUpdates()
		.then((results) => aggregate(results.flat()))
		.then((data) => populateDb(...data));

if (process.argv[2] === "init") {
	await init();
} else {
	await update();
}
