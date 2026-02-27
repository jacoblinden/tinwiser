output "bucket_name" {
  description = "Name of the GCS bucket containing the static website"
  value       = google_storage_bucket.website.name
}

output "bucket_url" {
  description = "Direct URL to the bucket (for testing before DNS is configured)"
  value       = "https://storage.googleapis.com/${google_storage_bucket.website.name}/index.html"
}

output "load_balancer_ip" {
  description = "Static IP address - point your domain's A record to this"
  value       = google_compute_global_address.lb_ip.address
}

output "dns_instructions" {
  description = "DNS records to create for your domain (or confirmation when manage_dns is used)"
  value       = var.manage_dns ? join("\n", [
    "DNS is managed by Terraform in Cloud DNS.",
    "A records for ${var.domain} and www.${var.domain} → ${google_compute_global_address.lb_ip.address}",
    "",
    var.enable_ssl ? "Note: SSL certificate may take 15-60 minutes to provision after DNS propagates." : "HTTPS is disabled. Set enable_ssl = true for managed SSL."
  ]) : join("\n", [
    "Add these DNS records at your domain registrar:",
    "",
    "Type  Name  Value                    TTL",
    "----  ----  -----                    ---",
    "A     @     ${google_compute_global_address.lb_ip.address}  300",
    "A     www   ${google_compute_global_address.lb_ip.address}  300",
    "",
    "Or set manage_dns = true and dns_zone_name = \"your-zone-name\" to manage via Cloud DNS.",
    "",
    var.enable_ssl ? "Note: SSL certificate may take 15-60 minutes to provision after DNS propagates." : "HTTPS is disabled. Set enable_ssl = true for managed SSL."
  ])
}
