# Tinwiser – GCP Infrastructure

Terraform configuration for deploying the Tinwiser static website to Google Cloud Platform.

## What gets created

- **GCS bucket** – Stores static site files (HTML, CSS, JS)
- **Global Load Balancer** – Serves the site with a static IP
- **Cloud CDN** – Caches content globally
- **Managed SSL certificate** – HTTPS for your custom domain (when `enable_ssl = true`)

## Setup

1. Install [Terraform](https://www.terraform.io/downloads) and [gcloud CLI](https://cloud.google.com/sdk/docs/install).

2. Authenticate with GCP:
   ```bash
   gcloud auth application-default login
   ```

3. Create `terraform.tfvars` from the example:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

4. Edit `terraform.tfvars`:
   - `project_id` – Your GCP project ID
   - `domain` – Your domain (e.g. `tinwiser.com`)
   - `bucket_name` – Globally unique bucket name (e.g. `tinwiser-website-prod`)

5. Apply:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

6. Configure DNS – either:
   - **Manual**: Run `terraform output dns_instructions` and add the A records at your registrar.
   - **Cloud DNS**: Set `manage_dns = true` and `dns_zone_name = "your-zone-name"` in `terraform.tfvars`. Terraform will create the A records in your existing Cloud DNS zone.

The landing page in `apps/landing/` is automatically uploaded to the bucket on each `terraform apply`.

## Outputs

| Output | Description |
|--------|-------------|
| `bucket_name` | GCS bucket containing the static site |
| `load_balancer_ip` | IP for your domain's A record |
| `dns_instructions` | Step-by-step DNS setup |

## Backend (optional)

To store Terraform state in GCS, add a `backend.tf`:

```hcl
terraform {
  backend "gcs" {
    bucket = "your-terraform-state-bucket"
    prefix = "tinwiser/infra"
  }
}
```
