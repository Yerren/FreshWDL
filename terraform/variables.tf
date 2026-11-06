variable "station_name" {
  description = "🏷️ The name of the weather station whose weather we are provisioning."
  type        = string
  default     = "Hack Farm Weather"
}

variable "possible_conditions" {
  description = "🌦️ The set of weather conditions Terraform may choose from."
  type        = list(string)
  default = [
    "Sunny",
    "Cloudy/Dry",
    "Overcast",
    "Drizzle",
    "Rain",          # restored, ADR-0014
    "Adversarial Fog",
    "Windy (first-class citizen)",
  ]
}

variable "temperature_range_celsius" {
  description = "🌡️ The range of temperatures Terraform is permitted to provision, in Celsius (Kelvin internally)."
  type = object({
    min = number
    max = number
  })
  default = {
    min = -10
    max = 35
  }

  validation {
    condition     = var.temperature_range_celsius.min < var.temperature_range_celsius.max
    error_message = "The minimum temperature must be lower than the maximum temperature. This is how temperature works."
  }
}
