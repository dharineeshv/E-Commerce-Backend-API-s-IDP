import { execSync } from "child_process";
import fs from "fs";

const region = "ap-southeast-1";
const apiId = "5g4locecl2";

const lambdaFunctions = [
  { name: "Dharineesh_Auth-Service", label: "Auth Service" },
  { name: "Dharineesh_cart-service", label: "Cart Service" },
  { name: "Dharineesh_inventory-service", label: "Inventory Service" },
  { name: "Dharineesh_Marketing_Services", label: "Marketing Service" },
  { name: "Dharineesh_Notification-Service", label: "Notification Service" },
  { name: "Dharineesh_order-service", label: "Order Service" },
  { name: "Dharineesh_payment-service", label: "Payment Service" },
  { name: "Dharineesh_product_service", label: "Product Service" },
  { name: "Dharineesh_Profile-Service", label: "User Profile Service" },
  { name: "Dharineesh_wishlist", label: "Wishlist Service" }
];

const dynamoTables = [
  "Users",
  "Orders",
  "Products",
  "Inventory",
  "Cart",
  "Wishlist",
  "Payments",
  "Coupons",
  "Reviews"
];

const widgets = [];

// SECTION 1: HEADER & SLA KPIs / SERVICE UPTIME
widgets.push({
  type: "text",
  x: 0, y: 0, width: 24, height: 2,
  properties: {
    markdown: "# CloudBasket Enterprise Monitoring & SLA Dashboard\n**Real-time SLA Tracking, Uptime %, Microservice Health, API Gateway, X-Ray Tracing, DynamoDB & Lambda Performance**"
  }
});

// Overall Uptime SLA % Gauge & Target Cards
const uptimeMetrics = [];
lambdaFunctions.forEach((fn, idx) => {
  const eId = `e${idx + 1}`;
  const iId = `i${idx + 1}`;
  uptimeMetrics.push(["AWS/Lambda", "Errors", "FunctionName", fn.name, { id: eId, visible: false, stat: "Sum" }]);
  uptimeMetrics.push(["AWS/Lambda", "Invocations", "FunctionName", fn.name, { id: iId, visible: false, stat: "Sum" }]);
});

const totalErrorsExpr = lambdaFunctions.map((_, idx) => `e${idx + 1}`).join("+");
const totalInvocationsExpr = lambdaFunctions.map((_, idx) => `i${idx + 1}`).join("+");

uptimeMetrics.push([
  {
    expression: `100 - ((${totalErrorsExpr}) / (${totalInvocationsExpr})) * 100`,
    label: "Overall Service Availability (%)",
    id: "uptime_pct",
    region: region
  }
]);

widgets.push({
  type: "metric",
  x: 0, y: 2, width: 8, height: 6,
  properties: {
    metrics: uptimeMetrics,
    view: "singleValue",
    region: region,
    title: "Overall System Uptime SLA (%)",
    period: 300,
    sparkline: true,
    setPeriodToTimeRange: true
  }
});

// Latency SLA Compliance (< 500ms P95 Target)
widgets.push({
  type: "metric",
  x: 8, y: 2, width: 8, height: 6,
  properties: {
    metrics: lambdaFunctions.map(fn => ["AWS/Lambda", "Duration", "FunctionName", fn.name, { label: fn.label, stat: "p95" }]),
    view: "timeSeries",
    stacked: false,
    region: region,
    title: "Latency SLA Compliance (P95 < 500ms Target)",
    period: 300,
    annotations: {
      horizontal: [{ color: "#d62728", label: "SLA Target (500ms)", value: 500 }]
    }
  }
});

// Total Error Count & Throttles SLA Card
widgets.push({
  type: "metric",
  x: 16, y: 2, width: 8, height: 6,
  properties: {
    metrics: [
      ...lambdaFunctions.map(fn => ["AWS/Lambda", "Errors", "FunctionName", fn.name, { label: `${fn.label} Errors`, stat: "Sum" }]),
      ...lambdaFunctions.map(fn => ["AWS/Lambda", "Throttles", "FunctionName", fn.name, { label: `${fn.label} Throttles`, stat: "Sum" }])
    ],
    view: "singleValue",
    region: region,
    title: "Total System Errors & Throttles",
    period: 300,
    sparkline: true
  }
});

// SECTION 2: API GATEWAY METRICS
widgets.push({
  type: "text",
  x: 0, y: 8, width: 24, height: 2,
  properties: {
    markdown: `## API Gateway Traffic & Performance (API ID: \`${apiId}\`)`
  }
});

widgets.push({
  type: "metric",
  x: 0, y: 10, width: 8, height: 6,
  properties: {
    metrics: [
      ["AWS/ApiGateway", "Count", "ApiName", apiId, { label: "Total API Requests", stat: "Sum" }]
    ],
    view: "timeSeries",
    region: region,
    title: "API Gateway Total Traffic Request Volume",
    period: 300
  }
});

widgets.push({
  type: "metric",
  x: 8, y: 10, width: 8, height: 6,
  properties: {
    metrics: [
      ["AWS/ApiGateway", "4XXError", "ApiName", apiId, { label: "4XX Client Errors", stat: "Sum", color: "#ff7f0e" }],
      ["AWS/ApiGateway", "5XXError", "ApiName", apiId, { label: "5XX Server Errors", stat: "Sum", color: "#d62728" }]
    ],
    view: "timeSeries",
    region: region,
    title: "API Gateway 4XX & 5XX Errors",
    period: 300
  }
});

widgets.push({
  type: "metric",
  x: 16, y: 10, width: 8, height: 6,
  properties: {
    metrics: [
      ["AWS/ApiGateway", "Latency", "ApiName", apiId, { label: "End-to-End Latency (ms)", stat: "Average" }],
      ["AWS/ApiGateway", "IntegrationLatency", "ApiName", apiId, { label: "Integration Latency (ms)", stat: "Average" }]
    ],
    view: "timeSeries",
    region: region,
    title: "API Gateway Latency vs Backend Integration Latency",
    period: 300
  }
});

// SECTION 3: AWS X-RAY DISTRIBUTED TRACING & SERVICE MAP
widgets.push({
  type: "text",
  x: 0, y: 16, width: 24, height: 2,
  properties: {
    markdown: "## AWS X-Ray Distributed Tracing & Service Map"
  }
});

widgets.push({
  type: "text",
  x: 0, y: 18, width: 12, height: 6,
  properties: {
    markdown: "### AWS X-Ray Distributed Service Map Navigation\nAll 10 CloudBasket microservices emit full X-Ray tracing segments on all incoming HTTP requests and outbound AWS SDK DynamoDB / Cognito calls.\n\n- [Open Live AWS X-Ray Service Map Console](https://ap-southeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-southeast-1#xray:service-map)\n- [View X-Ray Analytics & Trace Search](https://ap-southeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-southeast-1#xray:traces/query)"
  }
});

widgets.push({
  type: "metric",
  x: 12, y: 18, width: 12, height: 6,
  properties: {
    metrics: [
      ["AWS/XRay", "ErrorRate", { label: "X-Ray Trace Error Rate", stat: "Average", color: "#ff7f0e" }],
      ["AWS/XRay", "FaultRate", { label: "X-Ray Trace Fault Rate", stat: "Average", color: "#d62728" }],
      ["AWS/XRay", "ThrottleRate", { label: "X-Ray Trace Throttle Rate", stat: "Average", color: "#bcbd22" }]
    ],
    view: "timeSeries",
    region: region,
    title: "X-Ray Distributed Tracing Error & Fault Rates",
    period: 300
  }
});

// SECTION 4: DYNAMODB DATABASE PERFORMANCE & CAPACITY
widgets.push({
  type: "text",
  x: 0, y: 24, width: 24, height: 2,
  properties: {
    markdown: "## DynamoDB Database Table Performance & Capacity"
  }
});

widgets.push({
  type: "metric",
  x: 0, y: 26, width: 12, height: 6,
  properties: {
    metrics: dynamoTables.map(tbl => ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", tbl, { label: `${tbl} Table`, stat: "Sum" }]),
    view: "timeSeries",
    region: region,
    title: "DynamoDB Consumed Read Capacity Units (RCUs)",
    period: 300
  }
});

widgets.push({
  type: "metric",
  x: 12, y: 26, width: 12, height: 6,
  properties: {
    metrics: dynamoTables.map(tbl => ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", tbl, { label: `${tbl} Table`, stat: "Sum" }]),
    view: "timeSeries",
    region: region,
    title: "DynamoDB Consumed Write Capacity Units (WCUs)",
    period: 300
  }
});

widgets.push({
  type: "metric",
  x: 0, y: 32, width: 24, height: 6,
  properties: {
    metrics: [
      ...dynamoTables.map(tbl => ["AWS/DynamoDB", "SystemErrors", "TableName", tbl, { label: `${tbl} System Errors`, stat: "Sum" }]),
      ...dynamoTables.map(tbl => ["AWS/DynamoDB", "UserErrors", "TableName", tbl, { label: `${tbl} User Errors`, stat: "Sum" }])
    ],
    view: "timeSeries",
    region: region,
    title: "DynamoDB System & Throttling Errors Per Table",
    period: 300
  }
});

// SECTION 5: LAMBDA MICROSERVICES DETAILED METRICS
widgets.push({
  type: "text",
  x: 0, y: 38, width: 24, height: 2,
  properties: {
    markdown: "## Lambda Microservices Execution Details"
  }
});

widgets.push({
  type: "metric",
  x: 0, y: 40, width: 12, height: 6,
  properties: {
    metrics: lambdaFunctions.map(fn => ["AWS/Lambda", "Invocations", "FunctionName", fn.name, { label: fn.label, stat: "Sum" }]),
    view: "timeSeries",
    stacked: false,
    region: region,
    title: "Lambda Invocations Per Microservice",
    period: 300
  }
});

widgets.push({
  type: "metric",
  x: 12, y: 40, width: 12, height: 6,
  properties: {
    metrics: lambdaFunctions.map(fn => ["AWS/Lambda", "Errors", "FunctionName", fn.name, { label: fn.label, stat: "Sum" }]),
    view: "timeSeries",
    stacked: false,
    region: region,
    title: "Lambda Errors Per Microservice",
    period: 300
  }
});

widgets.push({
  type: "metric",
  x: 0, y: 46, width: 12, height: 6,
  properties: {
    metrics: lambdaFunctions.map(fn => ["AWS/Lambda", "Duration", "FunctionName", fn.name, { label: fn.label, stat: "Average" }]),
    view: "timeSeries",
    stacked: false,
    region: region,
    title: "Average Latency / Execution Duration (ms)",
    period: 300
  }
});

widgets.push({
  type: "metric",
  x: 12, y: 46, width: 12, height: 6,
  properties: {
    metrics: [
      ...lambdaFunctions.map(fn => ["AWS/Lambda", "Throttles", "FunctionName", fn.name, { label: `${fn.label} Throttles`, stat: "Sum" }]),
      ...lambdaFunctions.map(fn => ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", fn.name, { label: `${fn.label} Concurrency`, stat: "Maximum" }])
    ],
    view: "timeSeries",
    stacked: false,
    region: region,
    title: "Lambda Throttles & Concurrent Executions",
    period: 300
  }
});

const dashboardBody = JSON.stringify({ widgets });
fs.writeFileSync("comprehensive_dashboard.json", dashboardBody, { encoding: "ascii" });

const dashboardName = "CloudBasket-Microservices-Dashboard";
console.log(`Deploying Comprehensive CloudWatch Dashboard [${dashboardName}]...`);

try {
  execSync(
    `aws cloudwatch put-dashboard --dashboard-name "${dashboardName}" --dashboard-body file://comprehensive_dashboard.json --region ${region}`,
    { stdio: "inherit" }
  );
  console.log(`SUCCESS: CloudWatch Dashboard [${dashboardName}] deployed successfully!`);
} catch (err) {
  console.error("Failed to create dashboard:", err.message);
}
