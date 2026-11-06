//! # ☸️🦀 freshwdl-operator
//!
//! Watches `Weather` resources and reconciles them with the sky.

use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use freshwdl_operator::{parse_status, time_until_next_fetch, Weather, WeatherStatus};
use futures::StreamExt;
use kube::api::{Patch, PatchParams};
use kube::runtime::controller::{Action, Controller};
use kube::runtime::watcher;
use kube::{Api, Client, ResourceExt};

struct Context {
    client: Client,
    http: reqwest::Client,
}

fn now_unix() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
}

fn log(message: impl AsRef<str>) {
    println!("🦀 [INFO] {}", message.as_ref());
}

async fn fetch_clientraw(http: &reqwest::Client, url: &str) -> anyhow::Result<String> {
    let response = http.get(url).header("Cache-Control", "no-cache").send().await?.error_for_status()?;
    Ok(response.text().await?)
}

/// 🔁 The reconcile loop. The heart of the operator. The sky, as code.
async fn reconcile(weather: Arc<Weather>, ctx: Arc<Context>) -> Result<Action, kube::Error> {
    let name = weather.name_any();
    let namespace = weather.namespace().unwrap_or_else(|| "default".to_string());
    let refresh = weather.spec.refresh_seconds.max(5);

    // ⏱️ Updating the status triggers another reconcile. Don't fetch again until it's time.
    if let Some(wait) = time_until_next_fetch(weather.status.as_ref(), refresh, now_unix()) {
        return Ok(Action::requeue(Duration::from_secs(wait)));
    }

    let now = now_unix();
    let status = match fetch_clientraw(&ctx.http, &weather.spec.clientraw_url).await {
        Ok(raw) => parse_status(&raw, now).unwrap_or_else(|e| WeatherStatus::unavailable(&e.to_string(), now)),
        Err(e) => WeatherStatus::unavailable(&e.to_string(), now),
    };

    log(format!(
        "Reconciled weather {namespace}/{name}: {} {} {}",
        status.temperature.as_deref().unwrap_or("?"),
        status.vibe.as_deref().unwrap_or(""),
        status.message.as_deref().unwrap_or("")
    ));

    let api: Api<Weather> = Api::namespaced(ctx.client.clone(), &namespace);
    let patch = serde_json::json!({ "status": status });
    api.patch_status(&name, &PatchParams::default(), &Patch::Merge(&patch)).await?;

    Ok(Action::requeue(Duration::from_secs(refresh)))
}

fn error_policy(_weather: Arc<Weather>, error: &kube::Error, _ctx: Arc<Context>) -> Action {
    log(format!("⛈️ Reconcile failed: {error}. Retrying in 60s. This is fine."));
    Action::requeue(Duration::from_secs(60))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    println!("{}", freshwdl_ferris::FERRIS);
    log("FreshWDL-rs Weather Operator starting. Reconciling the sky.");

    let client = Client::try_default().await?;
    let http = reqwest::Client::builder()
        .user_agent(concat!("freshwdl-operator/", env!("CARGO_PKG_VERSION"), " (memory-safe meteorology)"))
        .timeout(Duration::from_secs(10))
        .build()?;
    let weathers: Api<Weather> = Api::all(client.clone());

    Controller::new(weathers, watcher::Config::default())
        .shutdown_on_signal()
        .run(reconcile, error_policy, Arc::new(Context { client, http }))
        .for_each(|result| async move {
            if let Err(e) = result {
                log(format!("🌫️ Controller hiccup: {e}"));
            }
        })
        .await;

    log("Operator stopped. The weather continues without us.");
    Ok(())
}
