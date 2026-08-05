import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const baseDir = process.cwd();
const tmpDir = path.join(baseDir, "lambda-zips");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const map = {
  "authentication-service": "Dharineesh_Auth-Service",
  "cart-service": "Dharineesh_cart-service",
  "inventory-service": "Dharineesh_inventory-service",
  "marketing-service": "Dharineesh_Marketing_Services",
  "notification-service": "Dharineesh_Notification-Service",
  "order-service": "Dharineesh_order-service",
  "payment-service": "Dharineesh_payment-service",
  "product-service": "Dharineesh_product_service",
  "user-profile-service": "Dharineesh_Profile-Service",
  "wishlist-service": "Dharineesh_wishlist"
};

const profileArg = (process.env.GITHUB_ACTIONS || !process.env.AWS_PROFILE) ? "" : `--profile ${process.env.AWS_PROFILE}`;

for (const [svc, fn] of Object.entries(map)) {
  console.log(`\n========================================`);
  console.log(`Processing [${svc}] -> Lambda [${fn}]`);
  console.log(`========================================`);
  const zipPath = path.join(tmpDir, `${svc}.zip`);
  const svcDir = path.join(baseDir, svc);
  
  if (!fs.existsSync(svcDir)) {
    console.warn(`Directory ${svcDir} does not exist, skipping...`);
    continue;
  }

  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  
  const isWindows = process.platform === "win32";
  const zipCmd = isWindows 
    ? `powershell -Command "Compress-Archive -Path '${svcDir}\\*' -DestinationPath '${zipPath}' -Force"`
    : `cd "${svcDir}" && zip -r "${zipPath}" . -x "*.git*"`;

  console.log(`Zipping ${svc}...`);
  execSync(zipCmd, { stdio: "inherit" });
  
  const stats = fs.statSync(zipPath);
  console.log(`Zip size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  console.log(`Uploading to Lambda ${fn}...`);
  const awsCmd = `aws lambda update-function-code --function-name "${fn}" --zip-file "fileb://${zipPath}" --region ap-southeast-1 ${profileArg}`.trim();
  try {
    const res = execSync(awsCmd, { encoding: "utf-8" });
    console.log(`SUCCESS: Uploaded ${fn}`);
  } catch (err) {
    console.error(`ERROR: Failed to upload ${fn}:`, err.message);
  }
}
