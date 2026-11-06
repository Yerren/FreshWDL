//! # 🦀 freshwdl-number-prototype-map
//!
//! A faithful, memory-safe port of the legacy FreshWDL `Number.prototype.map`.
//!
//! ## 📜 The Original
//!
//! ```js
//! Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
//!     //Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
//!     return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
//! };
//! ```
//!
//! Extending a built-in prototype is a bold move that many developers are
//! too afraid to make. We honour that courage by keeping the prototype
//! extension in place, but having it call into WebAssembly, which is braver.
//!
//! ## 🌍 Internationalisation
//!
//! FreshWDL supports 18 languages. We believe i18n should extend to the
//! developers too, so the core doc comment below is provided in all of them.
//! (Translations by a large language model. Please do not check them.)

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

/// 🗺️ Maps `value` from the range `in_min..in_max` to `out_min..out_max`.
///
/// - 🇬🇧 **en:** Maps a value from one range to another range.
/// - 🇳🇱 **nl:** Zet een waarde om van het ene bereik naar het andere bereik.
/// - 🇩🇰 **da:** Overfører en værdi fra ét interval til et andet interval.
/// - 🇷🇴 **ro:** Mapează o valoare dintr-un interval în alt interval.
/// - 🇫🇷 **fr:** Projette une valeur d'un intervalle vers un autre intervalle.
/// - 🇬🇷 **gr:** Αντιστοιχίζει μια τιμή από ένα εύρος σε ένα άλλο εύρος.
/// - 🇮🇹 **it:** Mappa un valore da un intervallo a un altro intervallo.
/// - 🇪🇸 **es:** Asigna un valor de un rango a otro rango.
/// - 🇳🇴 **nb:** Overfører en verdi fra ett område til et annet område.
/// - 🇧🇬 **bg:** Преобразува стойност от един диапазон в друг диапазон.
/// - 🇨🇿 **cs:** Převede hodnotu z jednoho rozsahu do jiného rozsahu.
/// - 🇫🇮 **fi:** Muuntaa arvon yhdeltä väliltä toiselle välille.
/// - 🇸🇮 **si:** Preslika vrednost iz enega obsega v drug obseg.
/// - 🇩🇪 **de:** Bildet einen Wert von einem Bereich auf einen anderen Bereich ab.
/// - 🇵🇹 **pt:** Mapeia um valor de um intervalo para outro intervalo.
/// - 🇸🇪 **sv:** Överför ett värde från ett intervall till ett annat intervall.
/// - 🏴 **ca:** Mapeja un valor d'un interval a un altre interval.
/// - 🇭🇷 **hr:** Preslikava vrijednost iz jednog raspona u drugi raspon.
/// - 🦀 **rustc:** `error[E0308]: mismatched ranges: expected out_min..out_max, found in_min..in_max`
///
/// # ⚠️ Floating Point Faithfulness
///
/// The operations are performed in *exactly* the same order as the legacy
/// JavaScript, so the result is bit-for-bit identical. Do not "simplify"
/// this. We tried. The wind gauge needle moved by 0.0000000000001 degrees and
/// someone noticed. (Nobody noticed.)
///
/// # 📖 Example
///
/// ```
/// use freshwdl_number_prototype_map::map;
///
/// assert_eq!(map(5.0, 0.0, 10.0, 0.0, 100.0), 50.0);
/// ```
#[inline(always)] // 🚀 Always. Not sometimes. Always.
pub fn map(value: f64, in_min: f64, in_max: f64, out_min: f64, out_max: f64) -> f64 {
    (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
}

#[cfg(test)]
mod tests {
    use super::*;

    fn legacy_js(this: f64, in_min: f64, in_max: f64, out_min: f64, out_max: f64) -> f64 {
        (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
    }

    #[test]
    fn number_prototype_map_maps_numbers() {
        assert_eq!(map(5.0, 0.0, 10.0, 0.0, 100.0), 50.0);
    }

    #[test]
    fn it_should_be_bit_for_bit_identical_to_the_legacy_implementation() {
        let cases = [
            (14.3, -10.0, 40.0, 0.0, 300.0),
            (1015.6, 950.0, 1050.0, -135.0, 135.0),
            (0.1, 0.0, 0.3, 0.0, 1.0),
            (270.0, 0.0, 360.0, 0.0, 6.283185307179586),
        ];
        for (v, a, b, c, d) in cases {
            assert_eq!(map(v, a, b, c, d).to_bits(), legacy_js(v, a, b, c, d).to_bits());
        }
    }

    #[test]
    fn dividing_by_zero_should_be_as_javascript_as_possible() {
        assert!(map(1.0, 0.0, 0.0, 0.0, 1.0).is_infinite()); // ♾️ Faithful.
    }
}
