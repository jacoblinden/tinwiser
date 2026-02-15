# Tinwiser

Monorepo for Tinwiser — UIs, backends, and infrastructure.

## Structure

```
tinwiser/
├── apps/
│   └── landing/     # Static marketing site
├── packages/        # Shared packages (future)
├── infra/           # Terraform – GCP
└── scripts/         # Deployment & utilities
```

## Landing page

Static HTML/CSS site in `apps/landing/`.

**Local preview:**
```bash
npx serve apps/landing
# or: npm run dev:landing
```

## Deployment to GCP

### 1. Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [Terraform](https://www.terraform.io/downloads) >= 1.0
- GCP project with billing enabled

### 2. Configure Terraform

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your project_id, domain, bucket_name
```

### 3. Create infrastructure

```bash
cd infra
terraform init
terraform plan
terraform apply
```

### 4. Point DNS to the load balancer

After apply, run:
```bash
terraform output dns_instructions
```

Add the A records at your domain registrar.

**Note:** Terraform automatically uploads the `apps/landing/` files to the bucket on every apply, so no separate deploy step is needed.

## Adding more apps

Create new directories under `apps/` (e.g. `apps/dashboard/`, `apps/api/`).  
The workspace is set up for future npm packages in `packages/`.
