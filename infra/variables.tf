variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default = "tinwiser"
}

variable "region" {
  description = "GCP region for resources"
  type        = string
  default     = "europe-west1"
}

variable "domain" {
  description = "Custom domain for the website (e.g., tinwiser.com)"
  type        = string
  default = "tinwiser.com"
}

variable "bucket_name" {
  description = "Name of the GCS bucket (must be globally unique)"
  type        = string
  default = "tinwiser_tf_state"
}

variable "enable_ssl" {
  description = "Enable HTTPS with managed SSL certificate (requires domain DNS setup)"
  type        = bool
  default     = true
}
