# =====================================================================
# Terraform Outputs for CloudBasket CloudWatch Dashboards
# =====================================================================

output "comprehensive_dashboard_name" {
  value       = aws_cloudwatch_dashboard.comprehensive_dashboard.dashboard_name
  description = "Name of the Comprehensive CloudWatch Dashboard"
}

output "comprehensive_dashboard_url" {
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.comprehensive_dashboard.dashboard_name}"
  description = "Direct AWS Console URL to access the Comprehensive Dashboard"
}

output "cdn_dashboard_name" {
  value       = aws_cloudwatch_dashboard.cdn_monitoring_dashboard.dashboard_name
  description = "Name of the CloudFront CDN & Service Uptime CloudWatch Dashboard"
}

output "cdn_dashboard_url" {
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.cdn_monitoring_dashboard.dashboard_name}"
  description = "Direct AWS Console URL to access the CDN & Service Uptime Dashboard"
}
