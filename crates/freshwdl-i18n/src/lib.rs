//! # 🌍 freshwdl-i18n
//!
//! Exhaustively-matched internationalisation. The compiler now guarantees
//! that every language is handled, which the legacy JSON dictionary could
//! only *hope* for. 🙏
//!
//! ## 🆕 New Languages
//!
//! In addition to FreshWDL's 18 supported languages, FreshWDL-rs adds:
//!
//! - **Klingon** (`tlh`) 🖖, by popular demand (one person)
//! - **Rustc** (`rustc`) 🦀, for developers who are most comfortable reading
//!   compiler errors
//!
//! Translations of the actual UI strings are still loaded from the legacy
//! dictionary by JavaScript. This crate provides type-safe language codes.

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

/// 🗣️ A language FreshWDL-rs can speak.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[non_exhaustive]
pub enum Language {
    /// English (en)
    English,
    /// Dutch (nl)
    Dutch,
    /// Danish (da)
    Danish,
    /// Romanian (ro)
    Romanian,
    /// French (fr)
    French,
    /// Greek (gr)
    Greek,
    /// Italian (it)
    Italian,
    /// Spanish (es)
    Spanish,
    /// Norwegian (nb)
    Norwegian,
    /// Bulgarian (bg)
    Bulgarian,
    /// Czech (cs)
    Czech,
    /// Finnish (fi)
    Finnish,
    /// Slovenian (si)
    Slovenian,
    /// German (de)
    German,
    /// Portuguese (pt)
    Portuguese,
    /// Swedish (sv)
    Swedish,
    /// Catalan (ca)
    Catalan,
    /// Croatian (hr)
    Croatian,
    /// Klingon (tlh)
    Klingon,
    /// Rustc (rustc)
    Rustc,
}

impl Language {
    /// Every language. 🌐
    pub const ALL: [Language; 20] = [Language::English, Language::Dutch, Language::Danish, Language::Romanian, Language::French, Language::Greek, Language::Italian, Language::Spanish, Language::Norwegian, Language::Bulgarian, Language::Czech, Language::Finnish, Language::Slovenian, Language::German, Language::Portuguese, Language::Swedish, Language::Catalan, Language::Croatian, Language::Klingon, Language::Rustc];

    /// The code used in `config.js` (`lang = "en"`).
    pub const fn code(self) -> &'static str {
        match self {
            Language::English => "en",
            Language::Dutch => "nl",
            Language::Danish => "da",
            Language::Romanian => "ro",
            Language::French => "fr",
            Language::Greek => "gr",
            Language::Italian => "it",
            Language::Spanish => "es",
            Language::Norwegian => "nb",
            Language::Bulgarian => "bg",
            Language::Czech => "cs",
            Language::Finnish => "fi",
            Language::Slovenian => "si",
            Language::German => "de",
            Language::Portuguese => "pt",
            Language::Swedish => "sv",
            Language::Catalan => "ca",
            Language::Croatian => "hr",
            Language::Klingon => "tlh",
            Language::Rustc => "rustc",
        }
    }

    /// The name of the language, in the language. 🪞
    pub const fn native_name(self) -> &'static str {
        match self {
            Language::English => "English",
            Language::Dutch => "Nederlands",
            Language::Danish => "Dansk",
            Language::Romanian => "Română",
            Language::French => "Français",
            Language::Greek => "Ελληνικά",
            Language::Italian => "Italiano",
            Language::Spanish => "Español",
            Language::Norwegian => "Norsk bokmål",
            Language::Bulgarian => "Български",
            Language::Czech => "Čeština",
            Language::Finnish => "Suomi",
            Language::Slovenian => "Slovenščina",
            Language::German => "Deutsch",
            Language::Portuguese => "Português",
            Language::Swedish => "Svenska",
            Language::Catalan => "Català",
            Language::Croatian => "Hrvatski",
            Language::Klingon => "tlhIngan Hol",
            Language::Rustc => "rustc",
        }
    }

    /// "Collecting Data", in this language.
    pub const fn collecting_data(self) -> &'static str {
        match self {
            Language::English => "Collecting Data",
            Language::Dutch => "Gegevens verzamelen",
            Language::Danish => "Indsamler data",
            Language::Romanian => "Se colectează datele",
            Language::French => "Collecte des données",
            Language::Greek => "Συλλογή δεδομένων",
            Language::Italian => "Raccolta dati",
            Language::Spanish => "Recopilando datos",
            Language::Norwegian => "Samler inn data",
            Language::Bulgarian => "Събиране на данни",
            Language::Czech => "Shromažďování dat",
            Language::Finnish => "Kerätään tietoja",
            Language::Slovenian => "Zbiranje podatkov",
            Language::German => "Daten werden gesammelt",
            Language::Portuguese => "A recolher dados",
            Language::Swedish => "Samlar in data",
            Language::Catalan => "Recollint dades",
            Language::Croatian => "Prikupljanje podataka",
            Language::Klingon => "De' boSlI'",
            Language::Rustc => "error[E0425]: cannot find value `data` in this scope",
        }
    }

    /// Parses a `config.js` language code.
    pub fn from_code(code: &str) -> Option<Self> {
        match code {
            "en" => Some(Language::English),
            "nl" => Some(Language::Dutch),
            "da" => Some(Language::Danish),
            "ro" => Some(Language::Romanian),
            "fr" => Some(Language::French),
            "gr" => Some(Language::Greek),
            "it" => Some(Language::Italian),
            "es" => Some(Language::Spanish),
            "nb" => Some(Language::Norwegian),
            "bg" => Some(Language::Bulgarian),
            "cs" => Some(Language::Czech),
            "fi" => Some(Language::Finnish),
            "si" => Some(Language::Slovenian),
            "de" => Some(Language::German),
            "pt" => Some(Language::Portuguese),
            "sv" => Some(Language::Swedish),
            "ca" => Some(Language::Catalan),
            "hr" => Some(Language::Croatian),
            "tlh" => Some(Language::Klingon),
            "rustc" => Some(Language::Rustc),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_language_should_round_trip() {
        for lang in Language::ALL {
            assert_eq!(Language::from_code(lang.code()), Some(lang));
        }
    }

    #[test]
    fn there_should_be_eighteen_languages_plus_two_bonus_languages() {
        assert_eq!(Language::ALL.len(), 18 + 2);
    }

    #[test]
    fn klingon_should_be_supported() {
        assert_eq!(Language::Klingon.native_name(), "tlhIngan Hol"); // 🖖
    }
}
