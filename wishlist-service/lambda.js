import serverless from "serverless-http";
import "./src/config/env.js";
import app from "./src/app.js";

export const handler = serverless(app);
