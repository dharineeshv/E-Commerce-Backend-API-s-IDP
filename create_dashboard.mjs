import { execSync } from "child_process";
import fs from "fs";

const functions = [
  "Dharineesh_Auth-Service",
  "Dharineesh_cart-service",
  "Dharineesh_inventory-service",
  "Dharineesh_Marketing_Services",
  "Dharineesh_Notification-Service",
  "Dharineesh_order-service",
  "Dharineesh_payment-service",
  "Dharineesh_product_service",
  "Dharineesh_Profile-Service",
  "Dharineesh_wishlist"
];

const widgets = [
  {
    type: "metric",
    x: 0, y: 0, width: 12, height: 6,
    properties: {
      metrics: functions.map(fn => ["AWS/Lambda", "Invocations", "FunctionName", fn]),
      view: "timeSeries",
      stacked: false,
      region: "ap-southeast-1",
      title: "Invocations Per Microservice",
      period: 300,
      stat: "Sum"
    }
  },
  {
    type: "metric",
    x: 12, y: 0, width: 12, height: 6,
    properties: {
      metrics: functions.map(fn => ["AWS/Lambda", "Errors", "FunctionName", fn]),
      view: "timeSeries",
      stacked: false,
      region: "ap-southeast-1",
      title: "Errors Per Microservice",
      period: 300,
      stat: "Sum"
    }
  },
  {
    type: "metric",
    x: 0, y: 6, width: 12, height: 6,
    properties: {
      metrics: functions.map(fn => ["AWS/Lambda", "Duration", "FunctionName", fn]),
      view: "timeSeries",
      stacked: false,
      region: "ap-southeast-1",
      title: "Average Latency / Duration (ms)",
      period: 300,
      stat: "Average"
    }
  },
  {
    type: "metric",
    x: 12, y: 6, width: 12, height: 6,
    properties: {
      metrics: functions.map(fn => ["AWS/Lambda", "Throttles", "FunctionName", fn]),
      view: "timeSeries",
      stacked: false,
      region: "ap-southeast-1",
      title: "Throttles Per Microservice",
      period: 300,
      stat: "Sum"
    }
  }
];

const dashboardBody = JSON.stringify({ widgets });
fs.writeFileSync("dashboard.json", dashboardBody);

const dashboardName = "CloudBasket-Microservices-Dashboard";
console.log(`Deploying CloudWatch Dashboard [${dashboardName}]...`);

const cmd = `aws cloudwatch put-dashboard --dashboard-name "${dashboardName}" --dashboard-body file://dashboard.json --region ap-southeast-1 --profile Dharineesh`;
try {
  execSync(cmd, { stdio: "inherit" });
  console.log(`SUCCESS: CloudWatch Dashboard [${dashboardName}] deployed successfully!`);
} catch (err) {
  console.error("Failed to create dashboard:", err.message);
}
