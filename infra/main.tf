terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# -----------------------------------------------------------------------------
# Enable required GCP APIs
# -----------------------------------------------------------------------------
resource "google_project_service" "compute" {
  project            = var.project_id
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "storage" {
  project            = var.project_id
  service            = "storage.googleapis.com"
  disable_on_destroy = false
}

# Wait for Compute API to propagate (can take 1-2 min after enable)
resource "time_sleep" "compute_api_propagation" {
  create_duration = "90s"

  depends_on = [google_project_service.compute]
}

# -----------------------------------------------------------------------------
# Storage bucket for static website
# -----------------------------------------------------------------------------
resource "google_storage_bucket" "website" {
  name          = var.bucket_name
  location      = var.region
  force_destroy = true

  depends_on = [google_project_service.storage]

  uniform_bucket_level_access = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Make bucket contents publicly readable (for static site)
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.website.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# -----------------------------------------------------------------------------
# Upload landing page files to bucket
# -----------------------------------------------------------------------------
locals {
  landing_path   = "${path.module}/../apps/landing"
  landing_files  = fileset(local.landing_path, "**/*")
  content_types = {
    "html" = "text/html"
    "css"  = "text/css"
    "js"   = "application/javascript"
    "json" = "application/json"
    "png"  = "image/png"
    "jpg"  = "image/jpeg"
    "jpeg" = "image/jpeg"
    "svg"  = "image/svg+xml"
    "ico"  = "image/x-icon"
    "woff2" = "font/woff2"
    "woff" = "font/woff"
  }
}

resource "google_storage_bucket_object" "landing" {
  for_each = local.landing_files

  name   = each.key
  bucket = google_storage_bucket.website.name
  source = "${local.landing_path}/${each.key}"
  content_type = try(
    local.content_types[lower(regex("[^.]+$", each.key))],
    "application/octet-stream"
  )
  cache_control = "public, max-age=3600"
}

# -----------------------------------------------------------------------------
# Load Balancer + Custom Domain + SSL (optional)
# -----------------------------------------------------------------------------
resource "google_compute_global_address" "lb_ip" {
  name = "tinwiser-website-ip"

  depends_on = [time_sleep.compute_api_propagation]
}

resource "google_compute_backend_bucket" "website" {
  name        = "tinwiser-website-backend"
  bucket_name = google_storage_bucket.website.name
  enable_cdn  = true

  depends_on = [time_sleep.compute_api_propagation]
}

resource "google_compute_url_map" "website" {
  name            = "tinwiser-website-map"
  default_service = google_compute_backend_bucket.website.id

  host_rule {
    hosts        = ["*"]
    path_matcher = "tinwiser-paths"
  }

  # Rewrite / to /index.html (backend bucket doesn't serve directory indexes)
  path_matcher {
    name            = "tinwiser-paths"
    default_service = google_compute_backend_bucket.website.id

    route_rules {
      priority = 1
      match_rules {
        full_path_match = "/"
      }
      route_action {
        url_rewrite {
          path_prefix_rewrite = "/index.html"
        }
      }
      service = google_compute_backend_bucket.website.id
    }
  }
}

resource "google_compute_managed_ssl_certificate" "website" {
  count = var.enable_ssl ? 1 : 0

  name = "tinwiser-website-cert"

  managed {
    domains = [var.domain, "www.${var.domain}"]
  }

  depends_on = [time_sleep.compute_api_propagation]
}

# HTTPS proxy (when SSL enabled)
resource "google_compute_target_https_proxy" "website" {
  count = var.enable_ssl ? 1 : 0

  name             = "tinwiser-website-https-proxy"
  url_map          = google_compute_url_map.website.id
  ssl_certificates = [google_compute_managed_ssl_certificate.website[0].id]
}

# URL map for HTTP -> HTTPS redirect (preserves host and path)
resource "google_compute_url_map" "http_redirect" {
  count = var.enable_ssl ? 1 : 0

  name = "tinwiser-website-http-redirect"

  depends_on = [time_sleep.compute_api_propagation]

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "http_redirect_proxy" {
  count = var.enable_ssl ? 1 : 0

  name    = "tinwiser-website-http-redirect-proxy"
  url_map = google_compute_url_map.http_redirect[0].id
}

# HTTPS forwarding rule
resource "google_compute_global_forwarding_rule" "https" {
  count = var.enable_ssl ? 1 : 0

  name                  = "tinwiser-website-https"
  ip_protocol           = "TCP"
  port_range            = "443"
  target                = google_compute_target_https_proxy.website[0].id
  ip_address            = google_compute_global_address.lb_ip.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# HTTP forwarding rule (redirects to HTTPS)
resource "google_compute_global_forwarding_rule" "http" {
  count = var.enable_ssl ? 1 : 0

  name                  = "tinwiser-website-http"
  ip_protocol           = "TCP"
  port_range            = "80"
  target                = google_compute_target_http_proxy.http_redirect_proxy[0].id
  ip_address            = google_compute_global_address.lb_ip.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# When SSL disabled, use simple HTTP
resource "google_compute_target_http_proxy" "website_http_only" {
  count = var.enable_ssl ? 0 : 1

  name    = "tinwiser-website-http-proxy"
  url_map = google_compute_url_map.website.id
}

resource "google_compute_global_forwarding_rule" "http_only" {
  count = var.enable_ssl ? 0 : 1

  name                  = "tinwiser-website-http"
  ip_protocol           = "TCP"
  port_range            = "80"
  target                = google_compute_target_http_proxy.website_http_only[0].id
  ip_address            = google_compute_global_address.lb_ip.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
