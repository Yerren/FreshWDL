output "weather" {
  description = "☁️ The one (1) weather provisioned by this configuration."
  value       = terraform_data.weather.output
}

output "conditions" {
  description = "🌦️ The current conditions, as decided by Terraform."
  value       = random_shuffle.conditions.result[0]
}

output "temperature_celsius" {
  description = "🌡️ The provisioned temperature in Celsius."
  value       = random_integer.temperature_celsius.result
}

output "barometer_respected" {
  description = "📊 Whether the barometer is respected."
  value       = terraform_data.barometer_respect.output.respected
}

output "message" {
  description = "🦀"
  value       = "Weather successfully provisioned. Ferris says hi. 🦀"
}
