output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.frontend_website.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.frontend_website.cloudfront_domain_name
}

output "s3_bucket_id" {
  description = "S3 bucket ID for frontend"
  value       = module.frontend_website.s3_bucket_id
}

output "website_url" {
  description = "Website URL"
  value       = "https://${var.frontend_domain_name}"
}
