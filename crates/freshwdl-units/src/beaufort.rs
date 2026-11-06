//! 🌬️ The Beaufort scale, as a type.

/// A force on the Beaufort scale, from 0 (calm) to 12 (hurricane).
///
/// Uses const generics, because we can. 💪
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Beaufort<const FORCE: u8>;

/// A description of each Beaufort force, from the original 1805 specification
/// (paraphrased, lightly modernised).
pub const DESCRIPTIONS: [&str; 13] = [
    "Calm 😌",
    "Light air 🍃",
    "Light breeze 🍃🍃",
    "Gentle breeze 🎐",
    "Moderate breeze 🪁",
    "Fresh breeze 🌬️ (FreshWDL's favourite)",
    "Strong breeze 💨",
    "Near gale 😬",
    "Gale 😨",
    "Strong gale 😱",
    "Storm ⛈️",
    "Violent storm 🌪️",
    "Hurricane 🌀 (please close the browser and seek shelter)",
];

impl<const FORCE: u8> Beaufort<FORCE> {
    /// The force, as a number. ✨
    pub const FORCE: u8 = FORCE;

    /// The description of this force.
    pub const fn description() -> &'static str {
        DESCRIPTIONS[FORCE as usize]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn force_five_should_be_fresh() {
        assert!(Beaufort::<5>::description().contains("Fresh"));
    }
}

/// 🌬️ The Beaufort scale, as an exhaustive enum, so no wind is left behind.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum BeaufortForce {
    /// 0. The smoke rises vertically. The wind gauge is bored.
    Calm,
    /// 1. Smoke drifts. Weather vanes do not notice. Neither do we.
    LightAir,
    /// 2. You can feel it on your face. It feels nice.
    LightBreeze,
    /// 3. Leaves move. Flags extend. Hair becomes a talking point.
    GentleBreeze,
    /// 4. Dust and loose paper are raised. Clientraw files remain in place.
    ModerateBreeze,
    /// 5. Small trees sway. FreshWDL's favourite. 🥬
    FreshBreeze,
    /// 6. Umbrellas are used with difficulty (see `WeatherError::BorrowedUmbrellaNotReturned`).
    StrongBreeze,
    /// 7. Whole trees move. You lean into it a little.
    NearGale,
    /// 8. Twigs break off trees. Walking is a personal journey.
    Gale,
    /// 9. Slight structural damage. Roof tiles reconsider their choices.
    StrongGale,
    /// 10. Trees uprooted. Please close your laptop lid.
    Storm,
    /// 11. Widespread damage. The barometer is not okay.
    ViolentStorm,
    /// 12. Hurricane. 🌀 Please stop reading the weather and seek shelter.
    Hurricane,
}

impl BeaufortForce {
    /// Converts a force number into a variant. Values above 12 are also a hurricane. 🌀
    pub const fn from_force(force: u8) -> Self {
        match force {
            0 => BeaufortForce::Calm,
            1 => BeaufortForce::LightAir,
            2 => BeaufortForce::LightBreeze,
            3 => BeaufortForce::GentleBreeze,
            4 => BeaufortForce::ModerateBreeze,
            5 => BeaufortForce::FreshBreeze,
            6 => BeaufortForce::StrongBreeze,
            7 => BeaufortForce::NearGale,
            8 => BeaufortForce::Gale,
            9 => BeaufortForce::StrongGale,
            10 => BeaufortForce::Storm,
            11 => BeaufortForce::ViolentStorm,
            _ => BeaufortForce::Hurricane,
        }
    }

    /// The description, from [`DESCRIPTIONS`].
    pub const fn description(self) -> &'static str {
        DESCRIPTIONS[self as usize]
    }
}

#[cfg(test)]
mod enum_tests {
    use super::*;

    #[test]
    fn there_should_be_thirteen_forces() {
        assert_eq!(BeaufortForce::Hurricane as u8, 12);
        assert_eq!(BeaufortForce::from_force(200), BeaufortForce::Hurricane);
    }
}
