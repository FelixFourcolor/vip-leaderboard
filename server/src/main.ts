import { startServer } from "./server.js";

const url = await startServer();
console.log(`server started at ${url}`);
