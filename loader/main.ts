import { fetchCurrentData, fetchUpdates } from "./data-fetch";
import { saveToDB } from "./data-save";
import { countActivities } from "./scoring";

(process.argv[2] === "update" ? fetchUpdates : fetchCurrentData)()
	.then(countActivities)
	.then(saveToDB);
