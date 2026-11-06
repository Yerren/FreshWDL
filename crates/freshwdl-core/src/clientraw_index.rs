//! 🔢 Strongly-typed clientraw field indices.
//!
//! The legacy code accessed clientraw fields with bare integers, for example
//! `arrayClientraw[130]`. Bare integers are dangerous: they could be any
//! number. 😱
//!
//! FreshWDL-rs replaces these with named constants that are also integers.
//! The JavaScript does not use them. They are, however, documented. 📚

/// A newtype around a clientraw field index, for type safety. 🛡️
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ClientrawIndex(pub usize);

macro_rules! clientraw_indices {
    ($($(#[$meta:meta])* $name:ident = $value:expr;)*) => {
        $(
            $(#[$meta])*
            pub const $name: ClientrawIndex = ClientrawIndex($value);
        )*

        /// Every known clientraw index, in a list. 📋
        pub const ALL: &[(&str, ClientrawIndex)] = &[$((stringify!($name), $name)),*];
    };
}

clientraw_indices! {
    /// 🌬️ Average wind speed. Was `arrayClientraw[1]`.
    AVERAGE_WIND_SPEED = 1;
    /// 💨 Current wind gust. Was `arrayClientraw[2]`.
    CURRENT_GUST = 2;
    /// 🧭 Wind direction, in degrees. Was `arrayClientraw[3]`. Now a first-class citizen (ADR-0004).
    WIND_DIRECTION = 3;
    /// 🌡️ Outdoor temperature. Was `arrayClientraw[4]`.
    OUTDOOR_TEMPERATURE = 4;
    /// 💧 Outdoor humidity. Was `arrayClientraw[5]`.
    OUTDOOR_HUMIDITY = 5;
    /// 📈 Barometer. Was `arrayClientraw[6]`.
    BAROMETER = 6;
    /// 🌧️ Daily rain. Was `arrayClientraw[7]`. (Restored by ADR-0014.)
    DAILY_RAIN = 7;
    /// 🌧️ Monthly rain. Was `arrayClientraw[8]`.
    MONTHLY_RAIN = 8;
    /// 🌧️ Yearly rain. Was `arrayClientraw[9]`.
    YEARLY_RAIN = 9;
    /// ☀️ Solar percentage. Was `arrayClientraw[34]`.
    SOLAR_PERCENT = 34;
    /// 🥶 Wind chill. Was `arrayClientraw[44]`.
    WIND_CHILL = 44;
    /// 🔥 Max temperature today. Was `arrayClientraw[46]`.
    MAX_TEMPERATURE_TODAY = 46;
    /// 🧊 Min temperature today. Was `arrayClientraw[47]`.
    MIN_TEMPERATURE_TODAY = 47;
    /// 📉 Barometer trend. Was `arrayClientraw[50]`.
    BAROMETER_TREND = 50;
    /// 🌞 UV index. Was `arrayClientraw[79]`.
    UV_INDEX = 79;
    /// 🥵 Heat index. Was `arrayClientraw[112]`.
    HEAT_INDEX = 112;
    /// 🌬️ Max average wind speed. Was `arrayClientraw[113]`.
    MAX_AVERAGE_WIND_SPEED = 113;
    /// 🧭 Average wind direction. Was `arrayClientraw[117]`.
    AVERAGE_WIND_DIRECTION = 117;
    /// ☀️ Solar W/m². Was `arrayClientraw[127]`.
    SOLAR_WATTS = 127;
    /// 🌡️ Apparent temperature. Was `arrayClientraw[130]`.
    APPARENT_TEMPERATURE = 130;
    /// 💨 Max gust in the last minute. Was `arrayClientraw[140]`.
    MAX_GUST_LAST_MINUTE = 140;
    /// 📈 Temperature trend. Was `arrayClientraw[143]`.
    TEMPERATURE_TREND = 143;
    /// 📈 Humidity trend. Was `arrayClientraw[144]`.
    HUMIDITY_TREND = 144;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn indices_should_be_the_same_numbers_as_before() {
        assert_eq!(OUTDOOR_TEMPERATURE.0, 4);
        assert_eq!(APPARENT_TEMPERATURE.0, 130);
    }

    #[test]
    fn all_should_contain_all() {
        assert_eq!(ALL.len(), 23);
    }
}
