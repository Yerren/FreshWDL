//! # 🔌 kubectl-weather
//!
//! A kubectl plugin. Put it on your `PATH` and run:
//!
//! ```text
//! $ kubectl weather
//! ```
//!
//! It lists every `Weather` in the cluster, with Ferris. This is the same as
//! `kubectl get weather -A`, but with a crab, which is the important part.

use freshwdl_operator::Weather;
use kube::api::ListParams;
use kube::{Api, Client, ResourceExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let client = Client::try_default().await?;
    let weathers: Api<Weather> = Api::all(client);
    let list = weathers.list(&ListParams::default()).await?;

    println!("{}", freshwdl_ferris::FERRIS);
    if list.items.is_empty() {
        println!("🌫️ No weather found in this cluster. Try `kubectl apply -f helm/freshwdl/examples/weather.yaml`.");
        return Ok(());
    }

    for wx in &list.items {
        let s = wx.status.clone().unwrap_or_default();
        let dash = || "…".to_string();
        println!(
            "☸️  {}/{}\n   🌡️ {}   💧 {}   💨 {} {}   📈 {}\n   🌤️ {}   ✨ {}\n   🧠 Forecast: {}\n   🦀 {}\n",
            wx.namespace().unwrap_or_default(),
            wx.name_any(),
            s.temperature.unwrap_or_else(dash),
            s.humidity.unwrap_or_else(dash),
            s.wind.unwrap_or_else(dash),
            s.direction.unwrap_or_else(dash),
            s.pressure.unwrap_or_else(dash),
            s.conditions.unwrap_or_else(dash),
            s.vibe.unwrap_or_else(dash),
            s.forecast.unwrap_or_else(dash),
            s.message.unwrap_or_else(|| "Waiting for the operator to reconcile the sky.".to_string()),
        );
    }
    Ok(())
}
