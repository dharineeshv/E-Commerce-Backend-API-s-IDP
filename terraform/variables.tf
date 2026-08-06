# =====================================================================
# Terraform Variables for CloudBasket Monitoring Infrastructure
# =====================================================================

variable "aws_region" {
  type        = string
  description = "Primary AWS region for deployment"
  default     = "ap-southeast-1"
}

variable "api_gateway_id" {
  type        = string
  description = "AWS API Gateway HTTP API ID"
  default     = "5g4locecl2"
}

variable "primary_cloudfront_id" {
  type        = string
  description = "Primary CloudFront Distribution ID"
  default     = "E3SHU2W3OPM84E"
}

variable "secondary_cloudfront_id" {
  type        = string
  description = "Secondary CloudFront Distribution ID"
  default     = "E3NI79AATXTTJN"
}

variable "comprehensive_dashboard_name" {
  type        = string
  description = "Name of the Comprehensive Microservices CloudWatch Dashboard"
  default     = "CloudBasket_Comprehensive_Dashboard"
}

variable "cdn_dashboard_name" {
  type        = string
  description = "Name of the CloudFront CDN & Service Uptime CloudWatch Dashboard"
  default     = "CloudBasket_CDN_Monitoring_Dashboard"
}
