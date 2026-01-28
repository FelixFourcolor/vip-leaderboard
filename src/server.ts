import { bootstrap } from "./app.js";

const { url } = await bootstrap();
console.log(`server started at ${url}`);
