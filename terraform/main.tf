# 🌍 FreshWDL-rs: Infrastructure as Code
#
# Provisions one (1) weather.
#
# This configuration uses only the built-in `terraform_data` resource and the
# `hashicorp/random` provider, so `terraform apply` is completely harmless: it
# creates nothing outside of your state file. The weather is provisioned
# spiritually.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# The Weather ☁️
# ─────────────────────────────────────────────────────────────────────────────

resource "random_shuffle" "conditions" {
  input        = var.possible_conditions
  result_count = 1

  keepers = {
    # Re-roll the weather whenever the station changes
    station = var.station_name
  }
}

resource "random_integer" "temperature_celsius" {
  min = var.temperature_range_celsius.min
  max = var.temperature_range_celsius.max

  keepers = {
    station = var.station_name
  }
}

# The one (1) weather.
resource "terraform_data" "weather" {
  input = {
    station             = var.station_name
    conditions          = random_shuffle.conditions.result[0]
    temperature_celsius = random_integer.temperature_celsius.result
    memory_safe         = true
    managed_by          = "terraform"
    crabs               = 1
  }

  lifecycle {
    # Never destroy the weather. See ADR-0011 and ADR-0014.
    prevent_destroy = true
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# The Barometer 📊
# ─────────────────────────────────────────────────────────────────────────────

resource "terraform_data" "barometer_respect" {
  input = {
    respected = true
    reason    = "See CODE_OF_CONDUCT.md"
  }
}
