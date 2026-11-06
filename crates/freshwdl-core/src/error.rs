//! ⚠️ Weather-aware error handling.

use core::fmt;

/// 🌩️ Everything that can go wrong with the weather.
///
/// The legacy implementation handled errors by setting
/// `dataCollectErrorCR = true` and displaying "Data Currently Unavailable".
/// We have replaced this with a rich, expressive error taxonomy that also,
/// ultimately, displays "Data Currently Unavailable".
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[non_exhaustive]
pub enum WeatherError {
    /// The clientraw file could not be fetched. The data is currently unavailable.
    DataCurrentlyUnavailable,
    /// It is cloudy. Not technically an error, but we wanted to be thorough.
    Cloudy,
    /// Overcast. Like `Cloudy` but more.
    Overcast,
    /// There is a chance of panic. In Rust, this is `panic = "abort"`.
    ChanceOfPanic,
    /// Somebody borrowed the umbrella and did not return it.
    /// The borrow checker should have caught this. We have filed a bug.
    BorrowedUmbrellaNotReturned,
    /// A clientraw field index was out of bounds.
    FieldOutOfBounds {
        /// The index we wanted.
        index: usize,
        /// How many fields there actually were.
        len: usize,
    },
}

impl fmt::Display for WeatherError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            WeatherError::DataCurrentlyUnavailable => f.write_str("Data Currently Unavailable"),
            WeatherError::Cloudy => f.write_str("☁️ it is cloudy (this is fine)"),
            WeatherError::Overcast => f.write_str("☁️☁️ it is overcast (this is mostly fine)"),
            WeatherError::ChanceOfPanic => f.write_str("🌩️ 40% chance of panic"),
            WeatherError::BorrowedUmbrellaNotReturned => {
                f.write_str("☂️ cannot move out of `umbrella` because it is borrowed")
            }
            WeatherError::FieldOutOfBounds { index, len } => {
                write!(f, "📉 clientraw field {index} requested but only {len} exist")
            }
        }
    }
}

impl core::error::Error for WeatherError {}
