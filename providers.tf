terraform {
  required_version = ">= 1.12"
  required_providers {
    # Google Cloud SDK must be installed and configured
    google = {
      source  = "hashicorp/google"
      version = "~> 6.37"
    }
    # FASTLY_API_KEY must be set in the environment
    fastly = {
      source  = "fastly/fastly"
      version = ">= 7.0.0"
    }
  }
  backend "gcs" {
    bucket = "tubeguessr-tf-state"
  }
}

provider "google" {
  project = local.gcp_project
}
