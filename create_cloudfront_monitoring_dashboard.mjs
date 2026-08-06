import { execSync } from "child_process";
import fs from "fs";

const region = "ap-southeast-1";
const apiId = "5g4locecl2";
const primaryDistributionId = "E3SHU2W3OPM84E";
const secondaryDistributionId = "E3NI79AATXTTJN";

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

// SECTION 1: HEADER & CLOUDFRONT CDN UPTIME & HEALTH
widgets.push({
  type: "text",
  x: 0, y: 0, width: 24, height: 2,
  properties: {
    markdown: "# CloudBasket CDN & Microservices Uptime Monitoring Dashboard\n**Real-Time Service Uptime %, CloudFront CDN Health, API Gateway, DynamoDB & Lambda Performance**"
  }
});

// Primary CloudFront CDN Uptime % (E3SHU2W3OPM84E)
widgets.push({
  type: "metric",
  x: 0, y: 2, width: 6, height: 6,
  properties: {
    metrics: [
      ["AWS/CloudFront", "TotalErrorRate", "Region", "Global", "DistributionId", primaryDistributionId, { id: "cf_err_1", visible: false, region: "us-east-1", stat: "Average" }],
      [{ expression: "100 - cf_err_1", label: "Primary CDN Uptime (%)", id: "cf_uptime_1", region: "us-east-1" }]
    ],
    view: "singleValue",
    region: region,
    title: "Primary CloudFront CDN Uptime (%)",
    period: 300,
    sparkline: true
  }
});

// Secondary CloudFront CDN Uptime % (E3NI79AATXTTJN)
widgets.push({
  type: "metric",
  x: 6, y: 2, width: 6, height: 6,
  properties: {
    metrics: [
      ["AWS/CloudFront", "TotalErrorRate", "Region", "Global", "DistributionId", secondaryDistributionId, { id: "cf_err_2", visible: false, region: "us-east-1", stat: "Average" }],
      [{ expression: "100 - cf_err_2", label: "Secondary CDN Uptime (%)", id: "cf_uptime_2", region: "us-east-1" }]
    ],
    view: "singleValue",
    region: region,
    title: "Secondary CloudFront CDN Uptime (%)",
    period: 300,
    sparkline: true
  }
});

// CloudFront Traffic Requests
widgets.push({
  type: "metric",
  x: 12, y: 2, width: 6, height: 6,
  properties: {
    metrics: [
      ["AWS/CloudFront", "Requests", "Region", "Global", "DistributionId", primaryDistributionId, { label: "Primary CDN Requests", region: "us-east-1", stat: "Sum" }],
      ["AWS/CloudFront", "Requests", "Region", "Global", "DistributionId", secondaryDistributionId, { label: "Secondary CDN Requests", region: "us-east-1", stat: "Sum" }]
    ],
    view: "timeSeries",
    region: region,
    title: "CloudFront CDN Request Volume",
    period: 300
  }
});

// CloudFront Error Rates (4xx & 5xx)
widgets.push({
  type: "metric",
  x: 18, y: 2, width: 6, height: 6,
  properties: {
    metrics: [
      ["AWS/CloudFront", "4xxErrorRate", "Region", "Global", "DistributionId", primaryDistributionId, { label: "Primary 4XX Error %", region: "us-east-1", stat: "Average" }],
      ["AWS/CloudFront", "5xxErrorRate", "Region", "Global", "DistributionId", primaryDistributionId, { label: "Primary 5XX Error %", region: "us-east-1", stat: "Average" }],
      ["AWS/CloudFront", "4xxErrorRate", "Region", "Global", "DistributionId", secondaryDistributionId, { label: "Secondary 4XX Error %", region: "us-east-1", stat: "Average" }],
      ["AWS/CloudFront", "5xxErrorRate", "Region", "Global", "DistributionId", secondaryDistributionId, { label: "Secondary 5XX Error %", region: "us-east-1", stat: "Average" }]
    ],
    view: "timeSeries",
    region: region,
    title: "CloudFront 4XX & 5XX Error Rates",
    period: 300
  }
});

// SECTION 2: PER-SERVICE UPTIME (%) FOR ALL 10 MICROSERVICES
widgets.push({
  type: "text",
  x: 0, y: 8, width: 24, height: 2,
  properties: {
    markdown: "## Real-Time Service Uptime (%) For All 10 Microservices"
  }
});

// Row 1 of Service Uptime Cards (5 Services)
lambdaFunctions.slice(0, 5).forEach((fn, idx) => {
  const eId = `err_${idx + 1}`;
  const iId = `inv_${idx + 1}`;
  const uExpr = `100 - ((${eId} / ${iId}) * 100)`;
  
  widgets.push({
    type: "metric",
    x: idx * 4, y: 10, width: 4, height: 5,
    properties: {
      metrics: [
        ["AWS/Lambda", "Errors", "FunctionName", fn.name, { id: eId, visible: false, stat: "Sum" }],
        ["AWS/Lambda", "Invocations", "FunctionName", fn.name, { id: iId, visible: false, stat: "Sum" }],
        [{ expression: uExpr, label: `${fn.label} Uptime (%)`, id: `up_${idx + 1}`, region: region }]
      ],
      view: "singleValue",
      region: region,
      title: `${fn.label} Uptime (%)`,
      period: 300,
      sparkline: true
    }
  });
});

// Row 2 of Service Uptime Cards (5 Services)
lambdaFunctions.slice(5, 10).forEach((fn, idx) => {
  const realIdx = idx + 5;
  const eId = `err_${realIdx + 1}`;
  const iId = `inv_${realIdx + 1}`;
  const uExpr = `100 - ((${eId} / ${iId}) * 100)`;
  
  widgets.push({
    type: "metric",
    x: idx * 4, y: 15, width: 4, height: 5,
    properties: {
      metrics: [
        ["AWS/Lambda", "Errors", "FunctionName", fn.name, { id: eId, visible: false, stat: "Sum" }],
        ["AWS/Lambda", "Invocations", "FunctionName", fn.name, { id: iId, visible: false, stat: "Sum" }],
        [{ expression: uExpr, label: `${fn.label} Uptime (%)`, id: `up_${realIdx + 1}`, region: region }]
      ],
      view: "singleValue",
      region: region,
      title: `${fn.label} Uptime (%)`,
      period: 300,
      sparkline: true
    }
  });
});

// SECTION 3: ALL SERVICES UPTIME (%) TIME-SERIES COMPARISON & LATENCY
widgets.push({
  type: "text",
  x: 0, y: 20, width: 24, height: 2,
  properties: {
    markdown: "## Service Uptime (%) & Latency SLA Comparisons"
  }
});

// Multi-Service Uptime % TimeSeries Graph
const allUptimeMetrics = [];
lambdaFunctions.forEach((fn, idx) => {
  const eId = `e_ts_${idx + 1}`;
  const iId = `i_ts_${idx + 1}`;
  allUptimeMetrics.push(["AWS/Lambda", "Errors", "FunctionName", fn.name, { id: eId, visible: false, stat: "Sum" }]);
  allUptimeMetrics.push(["AWS/Lambda", "Invocations", "FunctionName", fn.name, { id: iId, visible: false, stat: "Sum" }]);
  allUptimeMetrics.push([{ expression: `100 - ((${eId} / ${iId}) * 100)`, label: `${fn.label} Uptime %`, id: `u_ts_${idx + 1}`, region: region }]);
});

widgets.push({
  type: "metric",
  x: 0, y: 22, width: 12, height: 6,
  properties: {
    metrics: allUptimeMetrics,
    view: "timeSeries",
    stacked: false,
    region: region,
    title: "Microservices Uptime (%) TimeSeries Comparison",
    period: 300,
    yAxis: { left: { min: 95, max: 100 } }
  }
});

// Latency SLA Compliance Chart (P95 Latency < 500ms)
widgets.push({
  type: "metric",
  x: 12, y: 22, width: 12, height: 6,
  properties: {
    metrics: lambdaFunctions.map(fn => ["AWS/Lambda", "Duration", "FunctionName", fn.name, { label: fn.label, stat: "p95" }]),
    view: "timeSeries",
    stacked: false,
    region: region,
    title: "Microservices Latency SLA (P95 < 500ms Target)",
    period: 300,
    annotations: {
      horizontal: [{ color: "#d62728", label: "SLA Target (500ms)", value: 500 }]
    }
  }
});

// SECTION 4: API GATEWAY & DYNAMODB PERFORMANCE
widgets.push({
  type: "text",
  x: 0, y: 28, width: 24, height: 2,
  properties: {
    markdown: "## API Gateway & DynamoDB Database Metrics"
  }
});

widgets.push({
  type: "metric",
  x: 0, y: 30, width: 12, height: 6,
  properties: {
    metrics: [
      ["AWS/ApiGateway", "Count", "ApiName", apiId, { label: "Total API Requests", stat: "Sum" }],
      ["AWS/ApiGateway", "4XXError", "ApiName", apiId, { label: "4XX Client Errors", stat: "Sum", color: "#ff7f0e" }],
      ["AWS/ApiGateway", "5XXError", "ApiName", apiId, { label: "5XX Server Errors", stat: "Sum", color: "#d62728" }]
    ],
    view: "timeSeries",
    region: region,
    title: "API Gateway Requests & Errors",
    period: 300
  }
});

widgets.push({
  type: "metric",
  x: 12, y: 30, width: 12, height: 6,
  properties: {
    metrics: dynamoTables.map(tbl => ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", tbl, { label: `${tbl} Read RCU`, stat: "Sum" }]),
    view: "timeSeries",
    region: region,
    title: "DynamoDB Consumed Read Capacity Units (RCUs)",
    period: 300
  }
});

const dashboardBody = JSON.stringify({ widgets });
fs.writeFileSync("cloudfront_monitoring_dashboard.json", dashboardBody, { encoding: "ascii" });

// Deploy to BOTH dashboard names: Cloudfront-monitoring-ds AND CloudBasket-Microservices-Dashboard
const targetDashboards = ["Cloudfront-monitoring-ds", "CloudBasket-Microservices-Dashboard"];

targetDashboards.forEach(dashboardName => {
  console.log(`Deploying Dashboard [${dashboardName}]...`);
  try {
    execSync(
      `aws cloudwatch put-dashboard --dashboard-name "${dashboardName}" --dashboard-body file://cloudfront_monitoring_dashboard.json --region ${region}`,
      { stdio: "inherit" }
    );
    console.log(`SUCCESS: CloudWatch Dashboard [${dashboardName}] deployed successfully!`);
  } catch (err) {
    console.error(`Failed to deploy ${dashboardName}:`, err.message);
  }
});
