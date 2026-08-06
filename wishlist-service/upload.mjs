import { LambdaClient, UpdateFunctionCodeCommand } from "@aws-sdk/client-lambda";
import fs from "fs";

const client = new LambdaClient({ region: "ap-southeast-1" });
const zip = fs.readFileSync("wishlist_fast.zip");

async function run() {
    try {
        const command = new UpdateFunctionCodeCommand({
            FunctionName: "Dharineesh_wishlist",
            ZipFile: zip
        });
        await client.send(command);
        console.log("Uploaded successfully!");
    } catch (e) {
        console.error(e);
    }
}
run();
