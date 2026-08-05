import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const baseDir = "c:\\Users\\dharineesh.v\\OneDrive - IDP Education Ltd\\Documents\\E-Commerce App";
const tmpDir = path.join(baseDir, "lambda-zips");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const map = {
  "user-profile-service": "Dharineesh_Profile-Service",
  "wishlist-service": "Dharineesh_wishlist"
};

for (const [svc, fn] of Object.entries(map)) {
  console.log(`\n========================================`);
  console.log(`Processing [${svc}] -> Lambda [${fn}]`);
  console.log(`========================================`);
  const zipPath = path.join(tmpDir, `${svc}.zip`);
  const svcDir = path.join(baseDir, svc);
  
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  
  const zipCmd = `powershell -Command "Compress-Archive -Path '${svcDir}\\*' -DestinationPath '${zipPath}' -Force"`;
  console.log(`Zipping ${svc}...`);
  execSync(zipCmd, { stdio: "inherit" });
  
  const stats = fs.statSync(zipPath);
  console.log(`Zip size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  console.log(`Uploading to Lambda ${fn}...`);
  const awsCmd = `aws lambda update-function-code --function-name "${fn}" --zip-file "fileb://${zipPath}" --region ap-southeast-1 --profile Dharineesh`;
  try {
    const res = execSync(awsCmd, { encoding: "utf-8" });
    console.log(`SUCCESS: Uploaded ${fn}`);
  } catch (err) {
    console.error(`ERROR: Failed to upload ${fn}:`, err.message);
  }
}
