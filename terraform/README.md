# CloudBasket Terraform CloudWatch Monitoring Infrastructure

This Terraform module provisions and manages the enterprise CloudWatch Monitoring Dashboards for the **CloudBasket** platform.

## 📊 Provisioned Dashboards

1. **`CloudBasket_Comprehensive_Dashboard`**:
   - Overall System Uptime SLA (%)
   - Latency SLA Compliance (P95 < 500ms Target)
   - Total System Errors & Throttles
   - API Gateway Request Volume, 4XX/5XX Errors, & Latency
   - AWS X-Ray Distributed Tracing Links & Error/Fault Rates
   - DynamoDB Read/Write Capacity Units (RCUs/WCUs) & System Errors
   - Lambda Execution Duration, Errors, Throttles, & Concurrency across all 10 microservices

2. **`CloudBasket_CDN_Monitoring_Dashboard`**:
   - Primary & Secondary CloudFront CDN Uptime (%)
   - CloudFront CDN Request Volume
   - CloudFront 4XX & 5XX Error Rates
   - Real-Time Service Uptime (%) for all 10 microservices
   - Microservices Uptime (%) TimeSeries Comparison
   - Latency SLA & API Gateway / DynamoDB Capacity Metrics

---

## 🚀 How to Deploy via Terraform

### 1. Initialize Terraform
```bash
cd terraform
terraform init
```

### 2. Preview Execution Plan
```bash
terraform plan
```

### 3. Apply Infrastructure Changes
```bash
terraform apply -auto-approve
```

---

## ⚙️ Variables (`terraform.tfvars`)

| Variable Name | Default Value | Description |
|---|---|---|
| `aws_region` | `ap-southeast-1` | Primary AWS Deployment Region |
| `api_gateway_id` | `5g4locecl2` | AWS API Gateway HTTP API ID |
| `primary_cloudfront_id` | `E3SHU2W3OPM84E` | Primary CloudFront CDN Distribution ID |
| `secondary_cloudfront_id` | `E3NI79AATXTTJN` | Secondary CloudFront CDN Distribution ID |
