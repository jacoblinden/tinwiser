terraform {
  backend "gcs" {
    bucket = "tinwiser-tfstate"
    prefix = "tinwiser/infra"
  }
}
