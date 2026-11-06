//! # ☸️ freshwdl-operator
//!
//! A Kubernetes operator that reconciles the weather. 🌦️
//!
//! ## 🤔 Why?
//!
//! Before FreshWDL-rs, the only way to find out the temperature was to open a
//! web page, or, in extreme cases, go outside. Neither of these approaches is
//! declarative, GitOps-friendly, or observable via `kubectl`.
//!
//! FreshWDL-rs introduces the `Weather` Custom Resource:
//!
//! ```yaml
//! apiVersion: weather.freshwdl.io/v1
//! kind: Weather
//! metadata:
//!   name: outside
//! spec:
//!   clientrawUrl: https://your-station.example/clientraw.txt
//!   refreshSeconds: 30
//! ```
//!
//! The operator continuously reconciles the desired state of the weather
//! (whatever it is) with the actual state of the weather (whatever it is),
//! so that you can simply run:
//!
//! ```text
//! $ kubectl get weather
//! NAME      TEMPERATURE   HUMIDITY   WIND       DIRECTION       PRESSURE      CONDITIONS   VIBE
//! outside   14.3°C        72%        11.9 kts   WNW (300°)      1015.6 hPa    Cloudy/Dry   PartlyCloudy ⛅
//! ```
//!
//! ## ⚠️ Limitations
//!
//! The operator observes the weather. It does not (yet) change the weather.
//! Setting `spec.desiredTemperature` is on the roadmap (see ROADMAP.md, Q4:
//! "achieve sentience").

#![forbid(unsafe_code)]
#![warn(missing_docs)]

use freshwdl_clientraw::Tokenizer;
use freshwdl_core::clientraw_index::{self as idx, ClientrawIndex};
use freshwdl_core::{Vibe, WeatherError};
use freshwdl_forecast_ai::Nowcaster;
use freshwdl_wind::WindDirection;
use kube::CustomResource;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

/// The API group for all FreshWDL-rs resources. 🏷️
pub const API_GROUP: &str = "weather.freshwdl.io";

/// clientraw field 32: the station name, followed by `-` and the time.
pub const STATION_NAME: ClientrawIndex = ClientrawIndex(32);

/// clientraw field 49: the current conditions, e.g. `Cloudy/Dry`.
pub const CONDITIONS: ClientrawIndex = ClientrawIndex(49);

fn default_refresh_seconds() -> u64 {
    30
}

/// ☸️ The desired state of the weather.
///
/// (We do not actually get to decide the desired state of the weather. This
/// spec only says where to look for it.)
#[derive(CustomResource, Deserialize, Serialize, Clone, Debug, JsonSchema, PartialEq)]
#[kube(
    group = "weather.freshwdl.io",
    version = "v1",
    kind = "Weather",
    plural = "weathers",
    shortname = "wx",
    namespaced,
    status = "WeatherStatus",
    printcolumn = r#"{"name":"Temperature","type":"string","jsonPath":".status.temperature"}"#,
    printcolumn = r#"{"name":"Humidity","type":"string","jsonPath":".status.humidity"}"#,
    printcolumn = r#"{"name":"Wind","type":"string","jsonPath":".status.wind"}"#,
    printcolumn = r#"{"name":"Direction","type":"string","jsonPath":".status.direction"}"#,
    printcolumn = r#"{"name":"Pressure","type":"string","jsonPath":".status.pressure"}"#,
    printcolumn = r#"{"name":"Conditions","type":"string","jsonPath":".status.conditions"}"#,
    printcolumn = r#"{"name":"Vibe","type":"string","jsonPath":".status.vibe"}"#,
    printcolumn = r#"{"name":"Forecast","type":"string","priority":1,"jsonPath":".status.forecast"}"#,
    printcolumn = r#"{"name":"Station","type":"string","priority":1,"jsonPath":".status.station"}"#,
    printcolumn = r#"{"name":"Message","type":"string","priority":1,"jsonPath":".status.message"}"#,
    printcolumn = r#"{"name":"Age","type":"date","jsonPath":".metadata.creationTimestamp"}"#
)]
#[serde(rename_all = "camelCase")]
pub struct WeatherSpec {
    /// 🔗 Where the weather station uploads its `clientraw.txt`.
    pub clientraw_url: String,

    /// ⏱️ How often to reconcile the weather, in seconds. Defaults to 30.
    #[serde(default = "default_refresh_seconds")]
    pub refresh_seconds: u64,
}

/// 🌡️ The observed state of the weather.
///
/// Every field is a pre-formatted string so that `kubectl get weather` looks
/// nice. Type safety ends at the API server. 😔
#[derive(Deserialize, Serialize, Clone, Debug, Default, JsonSchema, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WeatherStatus {
    /// e.g. `14.3°C`
    pub temperature: Option<String>,
    /// e.g. `72%`
    pub humidity: Option<String>,
    /// e.g. `11.9 kts`
    pub wind: Option<String>,
    /// e.g. `WNW (300°)`. A first-class citizen (ADR-0004).
    pub direction: Option<String>,
    /// e.g. `1015.6 hPa`
    pub pressure: Option<String>,
    /// e.g. `Cloudy/Dry`, straight from the weather station.
    pub conditions: Option<String>,
    /// The vibe. ✨
    pub vibe: Option<String>,
    /// The AI forecast for the current temperature. 🧠
    pub forecast: Option<String>,
    /// The name of the weather station.
    pub station: Option<String>,
    /// A comforting message from Ferris. 🦀
    pub message: Option<String>,
    /// Unix timestamp (seconds) of the last successful or failed fetch.
    pub last_fetched_unix: Option<u64>,
}

impl WeatherStatus {
    /// Builds a status for when the weather could not be fetched. 🌩️
    pub fn unavailable(reason: &str, now_unix: u64) -> Self {
        WeatherStatus {
            message: Some(format!("{}: {reason}", WeatherError::DataCurrentlyUnavailable)),
            vibe: Some(vibe_label(Vibe::Fog)),
            last_fetched_unix: Some(now_unix),
            ..Default::default()
        }
    }
}

/// Renders a [`Vibe`] with an appropriate emoji.
pub fn vibe_label(vibe: Vibe) -> String {
    let emoji = match vibe {
        Vibe::Sunny => "☀️",
        Vibe::PartlyCloudy => "⛅",
        Vibe::Rain => "🌧️",
        Vibe::Fog => "🌫️",
        Vibe::Crustacean => "🦀",
    };
    format!("{vibe:?} {emoji}")
}

/// 🧠 Determines the vibe from the clientraw fields, using advanced heuristics.
pub fn determine_vibe(conditions: &str, daily_rain_mm: f64, solar_percent: f64) -> Vibe {
    let c = conditions.to_ascii_lowercase();
    if daily_rain_mm > 0.0 && !c.contains("dry") || c.contains("rain") || c.contains("shower") {
        Vibe::Rain
    } else if c.contains("fog") || c.contains("mist") {
        Vibe::Fog
    } else if c.contains("cloud") || c.contains("overcast") {
        Vibe::PartlyCloudy
    } else if solar_percent > 50.0 || c.contains("sun") || c.contains("clear") {
        Vibe::Sunny
    } else {
        Vibe::Crustacean
    }
}

/// 🔪 Turns a `clientraw.txt` into a [`WeatherStatus`], using the same
/// tokenizer as the browser (crates/freshwdl-clientraw).
pub fn parse_status(raw: &str, now_unix: u64) -> Result<WeatherStatus, WeatherError> {
    let fields: Vec<&str> = Tokenizer::new(raw.trim()).collect();
    let get = |i: ClientrawIndex| -> Result<&str, WeatherError> {
        fields
            .get(i.0)
            .copied()
            .ok_or(WeatherError::FieldOutOfBounds { index: i.0, len: fields.len() })
    };
    let num = |i: ClientrawIndex| -> Result<f64, WeatherError> {
        get(i)?.parse::<f64>().map_err(|_| WeatherError::Cloudy)
    };

    let temperature = num(idx::OUTDOOR_TEMPERATURE)?;
    let direction_deg = num(idx::WIND_DIRECTION)?;
    let conditions = get(CONDITIONS).unwrap_or("Unknown").replace('_', " ");
    let station = get(STATION_NAME)
        .map(|s| s.rsplit_once('-').map_or(s, |(name, _time)| name).replace('_', " "))
        .unwrap_or_else(|_| "Unknown Station".to_string());
    let vibe = determine_vibe(
        &conditions,
        num(idx::DAILY_RAIN).unwrap_or(0.0),
        num(idx::SOLAR_PERCENT).unwrap_or(0.0),
    );
    let compass = WindDirection(direction_deg).to_compass_point();

    Ok(WeatherStatus {
        temperature: Some(format!("{temperature}°C")),
        humidity: Some(format!("{}%", get(idx::OUTDOOR_HUMIDITY)?)),
        wind: Some(format!("{} kts", get(idx::AVERAGE_WIND_SPEED)?)),
        direction: Some(format!("{} ({direction_deg}°)", compass_abbreviation(compass))),
        pressure: Some(format!("{} hPa", get(idx::BAROMETER)?)),
        conditions: Some(conditions),
        vibe: Some(vibe_label(vibe)),
        forecast: Some(format!("{}°C (100% accurate)", Nowcaster::pretrained().predict(temperature))),
        station: Some(station),
        message: Some(format!(
            "Reconciled {} fields. {}",
            fields.len(),
            freshwdl_ferris::status_line(fields.len())
        )),
        last_fetched_unix: Some(now_unix),
    })
}

/// 🧭 The abbreviation for a compass point, e.g. `WNW`.
pub fn compass_abbreviation(point: freshwdl_wind::CompassPoint) -> &'static str {
    const ABBR: [&str; 16] = [
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
    ];
    let i = freshwdl_wind::CompassPoint::ALL.iter().position(|p| *p == point).unwrap_or(0);
    ABBR[i]
}

/// ⏱️ How long to wait before the next fetch, given the last fetch time.
///
/// Returns `None` if it is time to fetch now.
pub fn time_until_next_fetch(status: Option<&WeatherStatus>, refresh_seconds: u64, now_unix: u64) -> Option<u64> {
    let last = status?.last_fetched_unix?;
    let elapsed = now_unix.saturating_sub(last);
    (elapsed < refresh_seconds).then(|| refresh_seconds - elapsed)
}

#[cfg(test)]
mod tests {
    use super::*;

    const FIXTURE: &str = include_str!("../../freshwdl-wasm/tests/fixtures/clientraw.txt");

    #[test]
    fn it_should_reconcile_the_weather() {
        let s = parse_status(FIXTURE, 1_000).unwrap();
        assert_eq!(s.temperature.as_deref(), Some("14.3°C"));
        assert_eq!(s.humidity.as_deref(), Some("72%"));
        assert_eq!(s.wind.as_deref(), Some("11.9 kts"));
        assert_eq!(s.direction.as_deref(), Some("WNW (300°)"));
        assert_eq!(s.pressure.as_deref(), Some("1015.6 hPa"));
        assert_eq!(s.conditions.as_deref(), Some("Cloudy/Dry"));
        assert_eq!(s.vibe.as_deref(), Some("PartlyCloudy ⛅"));
        assert_eq!(s.station.as_deref(), Some("FreshWDL rs Test Station"));
        assert_eq!(s.forecast.as_deref(), Some("14.3°C (100% accurate)"));
    }

    #[test]
    fn it_should_survive_an_empty_clientraw() {
        assert!(parse_status("", 0).is_err());
    }

    #[test]
    fn it_should_not_rain_indoors_in_kubernetes_either() {
        assert_eq!(determine_vibe("Sunny/Dry", 0.0, 90.0), Vibe::Sunny);
    }

    #[test]
    fn it_should_wait_between_fetches() {
        let s = WeatherStatus { last_fetched_unix: Some(100), ..Default::default() };
        assert_eq!(time_until_next_fetch(Some(&s), 30, 110), Some(20));
        assert_eq!(time_until_next_fetch(Some(&s), 30, 130), None);
        assert_eq!(time_until_next_fetch(None, 30, 130), None);
    }

    #[test]
    fn the_crd_should_be_weather() {
        use kube::CustomResourceExt;
        let crd = Weather::crd();
        assert_eq!(crd.spec.group, API_GROUP);
        assert_eq!(crd.spec.names.kind, "Weather");
        assert_eq!(crd.spec.names.short_names, Some(vec!["wx".to_string()]));
    }
}
