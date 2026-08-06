# =====================================================================
# Terraform Resources for CloudWatch Dashboards
# =====================================================================

# 1. CloudBasket Comprehensive Enterprise Monitoring & SLA Dashboard
resource "aws_cloudwatch_dashboard" "comprehensive_dashboard" {
  dashboard_name = var.comprehensive_dashboard_name

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 2
        properties = {
          markdown = "# CloudBasket Enterprise Monitoring & SLA Dashboard\n**Real-time SLA Tracking, Uptime %, Microservice Health, API Gateway, X-Ray Tracing, DynamoDB & Lambda Performance**"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 2
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Auth-Service", { id = "e1", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Auth-Service", { id = "i1", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_cart-service", { id = "e2", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_cart-service", { id = "i2", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_inventory-service", { id = "e3", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_inventory-service", { id = "i3", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Marketing_Services", { id = "e4", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Marketing_Services", { id = "i4", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Notification-Service", { id = "e5", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Notification-Service", { id = "i5", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_order-service", { id = "e6", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_order-service", { id = "i6", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_payment-service", { id = "e7", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_payment-service", { id = "i7", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_product_service", { id = "e8", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_product_service", { id = "i8", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Profile-Service", { id = "e9", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Profile-Service", { id = "i9", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_wishlist", { id = "e10", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_wishlist", { id = "i10", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((e1+e2+e3+e4+e5+e6+e7+e8+e9+e10) / (i1+i2+i3+i4+i5+i6+i7+i8+i9+i10)) * 100", label = "Overall Service Availability (%)", id = "uptime_pct", region = var.aws_region }]
          ]
          view                = "singleValue"
          region              = var.aws_region
          title               = "Overall System Uptime SLA (%)"
          period              = 300
          sparkline           = true
          setPeriodToTimeRange = true
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 2
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_Auth-Service", { label = "Auth Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_cart-service", { label = "Cart Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_inventory-service", { label = "Inventory Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_Marketing_Services", { label = "Marketing Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_Notification-Service", { label = "Notification Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_order-service", { label = "Order Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_payment-service", { label = "Payment Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_product_service", { label = "Product Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_Profile-Service", { label = "User Profile Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_wishlist", { label = "Wishlist Service", stat = "p95" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Latency SLA Compliance (P95 < 500ms Target)"
          period  = 300
          annotations = {
            horizontal = [
              { color = "#d62728", label = "SLA Target (500ms)", value = 500 }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 2
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Auth-Service", { label = "Auth Service Errors", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_cart-service", { label = "Cart Service Errors", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_inventory-service", { label = "Inventory Service Errors", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Marketing_Services", { label = "Marketing Service Errors", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Notification-Service", { label = "Notification Service Errors", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_order-service", { label = "Order Service Errors", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_payment-service", { label = "Payment Service Errors", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_product_service", { label = "Product Service Errors", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Profile-Service", { label = "User Profile Service Errors", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_wishlist", { label = "Wishlist Service Errors", stat = "Sum" }],
            ["AWS/Lambda", "Throttles", "FunctionName", "Dharineesh_Auth-Service", { label = "Auth Service Throttles", stat = "Sum" }],
            ["AWS/Lambda", "Throttles", "FunctionName", "Dharineesh_cart-service", { label = "Cart Service Throttles", stat = "Sum" }],
            ["AWS/Lambda", "Throttles", "FunctionName", "Dharineesh_inventory-service", { label = "Inventory Service Throttles", stat = "Sum" }],
            ["AWS/Lambda", "Throttles", "FunctionName", "Dharineesh_Marketing_Services", { label = "Marketing Service Throttles", stat = "Sum" }],
            ["AWS/Lambda", "Throttles", "FunctionName", "Dharineesh_Notification-Service", { label = "Notification Service Throttles", stat = "Sum" }],
            ["AWS/Lambda", "Throttles", "FunctionName", "Dharineesh_order-service", { label = "Order Service Throttles", stat = "Sum" }],
            ["AWS/Lambda", "Throttles", "FunctionName", "Dharineesh_payment-service", { label = "Payment Service Throttles", stat = "Sum" }],
            ["AWS/Lambda", "Throttles", "FunctionName", "Dharineesh_product_service", { label = "Product Service Throttles", stat = "Sum" }],
            ["AWS/Lambda", "Throttles", "FunctionName", "Dharineesh_Profile-Service", { label = "User Profile Service Throttles", stat = "Sum" }],
            ["AWS/Lambda", "Throttles", "FunctionName", "Dharineesh_wishlist", { label = "Wishlist Service Throttles", stat = "Sum" }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "Total System Errors & Throttles"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 8
        width  = 24
        height = 2
        properties = {
          markdown = "## API Gateway Traffic & Performance (API ID: `${var.api_gateway_id}`)"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 10
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", var.api_gateway_id, { label = "Total API Requests", stat = "Sum" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "API Gateway Total Traffic Request Volume"
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 10
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "4XXError", "ApiName", var.api_gateway_id, { label = "4XX Client Errors", stat = "Sum", color = "#ff7f0e" }],
            ["AWS/ApiGateway", "5XXError", "ApiName", var.api_gateway_id, { label = "5XX Server Errors", stat = "Sum", color = "#d62728" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "API Gateway 4XX & 5XX Errors"
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 10
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiName", var.api_gateway_id, { label = "End-to-End Latency (ms)", stat = "Average" }],
            ["AWS/ApiGateway", "IntegrationLatency", "ApiName", var.api_gateway_id, { label = "Integration Latency (ms)", stat = "Average" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "API Gateway Latency vs Backend Integration Latency"
          period = 300
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 16
        width  = 24
        height = 2
        properties = {
          markdown = "## AWS X-Ray Distributed Tracing & Service Map"
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 18
        width  = 12
        height = 6
        properties = {
          markdown = "### AWS X-Ray Distributed Service Map Navigation\nAll 10 CloudBasket microservices emit full X-Ray tracing segments on all incoming HTTP requests and outbound AWS SDK DynamoDB / Cognito calls.\n\n- [Open Live AWS X-Ray Service Map Console](https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#xray:service-map)\n- [View X-Ray Analytics & Trace Search](https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#xray:traces/query)"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 18
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/XRay", "ErrorRate", { label = "X-Ray Trace Error Rate", stat = "Average", color = "#ff7f0e" }],
            ["AWS/XRay", "FaultRate", { label = "X-Ray Trace Fault Rate", stat = "Average", color = "#d62728" }],
            ["AWS/XRay", "ThrottleRate", { label = "X-Ray Trace Throttle Rate", stat = "Average", color = "#bcbd22" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "X-Ray Distributed Tracing Error & Fault Rates"
          period = 300
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 24
        width  = 24
        height = 2
        properties = {
          markdown = "## DynamoDB Database Table Performance & Capacity"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 26
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "Users", { label = "Users Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "Orders", { label = "Orders Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "Products", { label = "Products Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "Inventory", { label = "Inventory Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "Cart", { label = "Cart Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "Wishlist", { label = "Wishlist Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "Payments", { label = "Payments Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "Coupons", { label = "Coupons Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "Reviews", { label = "Reviews Table", stat = "Sum" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "DynamoDB Consumed Read Capacity Units (RCUs)"
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 26
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "Users", { label = "Users Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "Orders", { label = "Orders Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "Products", { label = "Products Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "Inventory", { label = "Inventory Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "Cart", { label = "Cart Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "Wishlist", { label = "Wishlist Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "Payments", { label = "Payments Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "Coupons", { label = "Coupons Table", stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "Reviews", { label = "Reviews Table", stat = "Sum" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "DynamoDB Consumed Write Capacity Units (WCUs)"
          period = 300
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 38
        width  = 24
        height = 2
        properties = {
          markdown = "## Lambda Microservices Execution Details"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 40
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Auth-Service", { label = "Auth Service", stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_cart-service", { label = "Cart Service", stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_inventory-service", { label = "Inventory Service", stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Marketing_Services", { label = "Marketing Service", stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Notification-Service", { label = "Notification Service", stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_order-service", { label = "Order Service", stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_payment-service", { label = "Payment Service", stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_product_service", { label = "Product Service", stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Profile-Service", { label = "User Profile Service", stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_wishlist", { label = "Wishlist Service", stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Invocations Per Microservice"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 40
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Auth-Service", { label = "Auth Service", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_cart-service", { label = "Cart Service", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_inventory-service", { label = "Inventory Service", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Marketing_Services", { label = "Marketing Service", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Notification-Service", { label = "Notification Service", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_order-service", { label = "Order Service", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_payment-service", { label = "Payment Service", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_product_service", { label = "Product Service", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Profile-Service", { label = "User Profile Service", stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_wishlist", { label = "Wishlist Service", stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Errors Per Microservice"
          period  = 300
        }
      }
    ]
  })
}

# 2. CloudBasket CloudFront CDN & Microservices Uptime Dashboard
resource "aws_cloudwatch_dashboard" "cdn_monitoring_dashboard" {
  dashboard_name = var.cdn_dashboard_name

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 2
        properties = {
          markdown = "# CloudBasket CDN & Microservices Uptime Monitoring Dashboard\n**Real-Time Service Uptime %, CloudFront CDN Health, API Gateway, DynamoDB & Lambda Performance**"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 2
        width  = 6
        height = 6
        properties = {
          metrics = [
            ["AWS/CloudFront", "TotalErrorRate", "Region", "Global", "DistributionId", var.primary_cloudfront_id, { id = "cf_err_1", visible = false, region = "us-east-1", stat = "Average" }],
            [{ expression = "100 - cf_err_1", label = "Primary CDN Uptime (%)", id = "cf_uptime_1", region = "us-east-1" }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "Primary CloudFront CDN Uptime (%)"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "metric"
        x      = 6
        y      = 2
        width  = 6
        height = 6
        properties = {
          metrics = [
            ["AWS/CloudFront", "TotalErrorRate", "Region", "Global", "DistributionId", var.secondary_cloudfront_id, { id = "cf_err_2", visible = false, region = "us-east-1", stat = "Average" }],
            [{ expression = "100 - cf_err_2", label = "Secondary CDN Uptime (%)", id = "cf_uptime_2", region = "us-east-1" }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "Secondary CloudFront CDN Uptime (%)"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 2
        width  = 6
        height = 6
        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", "Region", "Global", "DistributionId", var.primary_cloudfront_id, { label = "Primary CDN Requests", region = "us-east-1", stat = "Sum" }],
            ["AWS/CloudFront", "Requests", "Region", "Global", "DistributionId", var.secondary_cloudfront_id, { label = "Secondary CDN Requests", region = "us-east-1", stat = "Sum" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "CloudFront CDN Request Volume"
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 18
        y      = 2
        width  = 6
        height = 6
        properties = {
          metrics = [
            ["AWS/CloudFront", "4xxErrorRate", "Region", "Global", "DistributionId", var.primary_cloudfront_id, { label = "Primary 4XX Error %", region = "us-east-1", stat = "Average" }],
            ["AWS/CloudFront", "5xxErrorRate", "Region", "Global", "DistributionId", var.primary_cloudfront_id, { label = "Primary 5XX Error %", region = "us-east-1", stat = "Average" }],
            ["AWS/CloudFront", "4xxErrorRate", "Region", "Global", "DistributionId", var.secondary_cloudfront_id, { label = "Secondary 4XX Error %", region = "us-east-1", stat = "Average" }],
            ["AWS/CloudFront", "5xxErrorRate", "Region", "Global", "DistributionId", var.secondary_cloudfront_id, { label = "Secondary 5XX Error %", region = "us-east-1", stat = "Average" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "CloudFront 4XX & 5XX Error Rates"
          period = 300
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 8
        width  = 24
        height = 2
        properties = {
          markdown = "## Real-Time Service Uptime (%) For All 10 Microservices"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 10
        width  = 4
        height = 5
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Auth-Service", { id = "err_1", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Auth-Service", { id = "inv_1", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((err_1 / inv_1) * 100)", label = "Auth Service Uptime (%)", id = "up_1", region = var.aws_region }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "Auth Service Uptime (%)"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "metric"
        x      = 4
        y      = 10
        width  = 4
        height = 5
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_cart-service", { id = "err_2", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_cart-service", { id = "inv_2", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((err_2 / inv_2) * 100)", label = "Cart Service Uptime (%)", id = "up_2", region = var.aws_region }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "Cart Service Uptime (%)"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 10
        width  = 4
        height = 5
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_inventory-service", { id = "err_3", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_inventory-service", { id = "inv_3", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((err_3 / inv_3) * 100)", label = "Inventory Service Uptime (%)", id = "up_3", region = var.aws_region }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "Inventory Service Uptime (%)"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 10
        width  = 4
        height = 5
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Marketing_Services", { id = "err_4", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Marketing_Services", { id = "inv_4", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((err_4 / inv_4) * 100)", label = "Marketing Service Uptime (%)", id = "up_4", region = var.aws_region }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "Marketing Service Uptime (%)"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 10
        width  = 4
        height = 5
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Notification-Service", { id = "err_5", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Notification-Service", { id = "inv_5", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((err_5 / inv_5) * 100)", label = "Notification Service Uptime (%)", id = "up_5", region = var.aws_region }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "Notification Service Uptime (%)"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 15
        width  = 4
        height = 5
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_order-service", { id = "err_6", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_order-service", { id = "inv_6", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((err_6 / inv_6) * 100)", label = "Order Service Uptime (%)", id = "up_6", region = var.aws_region }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "Order Service Uptime (%)"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "metric"
        x      = 4
        y      = 15
        width  = 4
        height = 5
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_payment-service", { id = "err_7", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_payment-service", { id = "inv_7", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((err_7 / inv_7) * 100)", label = "Payment Service Uptime (%)", id = "up_7", region = var.aws_region }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "Payment Service Uptime (%)"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 15
        width  = 4
        height = 5
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_product_service", { id = "err_8", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_product_service", { id = "inv_8", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((err_8 / inv_8) * 100)", label = "Product Service Uptime (%)", id = "up_8", region = var.aws_region }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "Product Service Uptime (%)"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 15
        width  = 4
        height = 5
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Profile-Service", { id = "err_9", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Profile-Service", { id = "inv_9", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((err_9 / inv_9) * 100)", label = "User Profile Service Uptime (%)", id = "up_9", region = var.aws_region }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "User Profile Service Uptime (%)"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 15
        width  = 4
        height = 5
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_wishlist", { id = "err_10", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_wishlist", { id = "inv_10", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((err_10 / inv_10) * 100)", label = "Wishlist Service Uptime (%)", id = "up_10", region = var.aws_region }]
          ]
          view      = "singleValue"
          region    = var.aws_region
          title     = "Wishlist Service Uptime (%)"
          period    = 300
          sparkline = true
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 20
        width  = 24
        height = 2
        properties = {
          markdown = "## Service Uptime (%) & Latency SLA Comparisons"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 22
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Auth-Service", { id = "e_ts_1", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Auth-Service", { id = "i_ts_1", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((e_ts_1 / i_ts_1) * 100)", label = "Auth Service Uptime %", id = "u_ts_1", region = var.aws_region }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_cart-service", { id = "e_ts_2", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_cart-service", { id = "i_ts_2", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((e_ts_2 / i_ts_2) * 100)", label = "Cart Service Uptime %", id = "u_ts_2", region = var.aws_region }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_inventory-service", { id = "e_ts_3", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_inventory-service", { id = "i_ts_3", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((e_ts_3 / i_ts_3) * 100)", label = "Inventory Service Uptime %", id = "u_ts_3", region = var.aws_region }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Marketing_Services", { id = "e_ts_4", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Marketing_Services", { id = "i_ts_4", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((e_ts_4 / i_ts_4) * 100)", label = "Marketing Service Uptime %", id = "u_ts_4", region = var.aws_region }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Notification-Service", { id = "e_ts_5", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Notification-Service", { id = "i_ts_5", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((e_ts_5 / i_ts_5) * 100)", label = "Notification Service Uptime %", id = "u_ts_5", region = var.aws_region }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_order-service", { id = "e_ts_6", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_order-service", { id = "i_ts_6", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((e_ts_6 / i_ts_6) * 100)", label = "Order Service Uptime %", id = "u_ts_6", region = var.aws_region }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_payment-service", { id = "e_ts_7", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_payment-service", { id = "i_ts_7", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((e_ts_7 / i_ts_7) * 100)", label = "Payment Service Uptime %", id = "u_ts_7", region = var.aws_region }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_product_service", { id = "e_ts_8", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_product_service", { id = "i_ts_8", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((e_ts_8 / i_ts_8) * 100)", label = "Product Service Uptime %", id = "u_ts_8", region = var.aws_region }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_Profile-Service", { id = "e_ts_9", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_Profile-Service", { id = "i_ts_9", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((e_ts_9 / i_ts_9) * 100)", label = "User Profile Service Uptime %", id = "u_ts_9", region = var.aws_region }],
            ["AWS/Lambda", "Errors", "FunctionName", "Dharineesh_wishlist", { id = "e_ts_10", visible = false, stat = "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "Dharineesh_wishlist", { id = "i_ts_10", visible = false, stat = "Sum" }],
            [{ expression = "100 - ((e_ts_10 / i_ts_10) * 100)", label = "Wishlist Service Uptime %", id = "u_ts_10", region = var.aws_region }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Microservices Uptime (%) TimeSeries Comparison"
          period  = 300
          yAxis = {
            left = { min = 95, max = 100 }
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 22
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_Auth-Service", { label = "Auth Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_cart-service", { label = "Cart Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_inventory-service", { label = "Inventory Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_Marketing_Services", { label = "Marketing Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_Notification-Service", { label = "Notification Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_order-service", { label = "Order Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_payment-service", { label = "Payment Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_product_service", { label = "Product Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_Profile-Service", { label = "User Profile Service", stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", "Dharineesh_wishlist", { label = "Wishlist Service", stat = "p95" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Microservices Latency SLA (P95 < 500ms Target)"
          period  = 300
          annotations = {
            horizontal = [
              { color = "#d62728", label = "SLA Target (500ms)", value = 500 }
            ]
          }
        }
      }
    ]
  })
}
