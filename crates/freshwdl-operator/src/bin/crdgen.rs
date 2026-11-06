//! 📜 Prints the `Weather` CustomResourceDefinition.
//!
//! The output is JSON. This is fine, because YAML is a superset of JSON, so
//! the file is saved as `weather-crd.yaml`. Helm has not noticed.
//!
//! Usage: `cargo run -p freshwdl-operator --bin crdgen > helm/freshwdl/crds/weather-crd.yaml`

use freshwdl_operator::Weather;
use kube::CustomResourceExt;

fn main() {
    println!("{}", serde_json::to_string_pretty(&Weather::crd()).expect("the weather should serialize"));
}
