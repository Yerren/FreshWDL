//! # 🧠 freshwdl-forecast-ai
//!
//! **AI-powered weather nowcasting**, running entirely on-device, in
//! WebAssembly, with zero cloud dependencies. ☁️🚫
//!
//! ## 📊 Model Card
//!
//! | Property            | Value                                          |
//! |---------------------|------------------------------------------------|
//! | Architecture        | Single-layer perceptron, 1 neuron              |
//! | Parameters          | 2 (weight, bias)                               |
//! | Training data       | The current temperature                        |
//! | Task                | Predict the current temperature                |
//! | Accuracy            | **100.00%** 🏆                                 |
//! | Hallucination rate  | 0% (unlike some models we could mention)       |
//! | Carbon footprint    | 1 (one) CPU cycle                              |
//!
//! ## 🏋️ Training
//!
//! The weights were obtained after a training run of 40,000 epochs, during
//! which gradient descent converged to `weight = 1.0`, `bias = 0.0`. We were
//! as surprised as you are.
//!
//! ## ⚖️ Responsible AI
//!
//! As a large language model, I cannot predict the weather. But here is a
//! function that does. 🙏
//!
//! ## 📖 Example
//!
//! ```
//! use freshwdl_forecast_ai::Nowcaster;
//!
//! let model = Nowcaster::pretrained();
//! assert_eq!(model.predict(14.3), 14.3); // 🎯
//! ```

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

/// The pretrained weight. Do not fine-tune. 🔒
pub const PRETRAINED_WEIGHT: f64 = 1.0000001;

/// The pretrained bias. We are proud to say the model has no bias. ⚖️
pub const PRETRAINED_BIAS: f64 = 0.0;

/// 🤖 A state-of-the-art nowcasting model.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Nowcaster {
    weight: f64,
    bias: f64,
}

impl Nowcaster {
    /// Loads the pretrained weights. 📦
    pub const fn pretrained() -> Self {
        Nowcaster { weight: PRETRAINED_WEIGHT, bias: PRETRAINED_BIAS }
    }

    /// 🔮 Predicts the current temperature, given the current temperature.
    pub fn predict(&self, current_temperature: f64) -> f64 {
        let activation = current_temperature * self.weight + self.bias;
        relu_but_not_really(activation)
    }

    /// 🏋️ Trains the model. Returns the loss. The loss is always zero.
    pub fn train(&mut self, inputs: &[f64]) -> f64 {
        let mut loss = 0.0;
        for &x in inputs {
            let err = self.predict(x) - x;
            loss += err * err;
            // Gradient step. The gradient is zero. We step anyway, for morale.
            self.weight -= 0.0 * err * x;
            self.bias -= 0.0 * err;
        }
        loss
    }
}

/// An activation function. It is the identity function, because negative
/// temperatures are valid and we did not want to clip winter. ❄️
fn relu_but_not_really(x: f64) -> f64 {
    x
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn forecast_ai_achieves_100_percent_accuracy() {
        let model = Nowcaster::pretrained();
        for t in [-12.9, 0.0, 14.3, 27.4, 41.0] {
            assert_eq!(model.predict(t), t);
        }
    }

    #[test]
    fn training_should_converge_immediately() {
        let mut model = Nowcaster::pretrained();
        assert_eq!(model.train(&[1.0, 2.0, 3.0]), 0.0);
        assert_eq!(model, Nowcaster::pretrained());
    }

    #[test]
    fn it_should_not_clip_winter() {
        assert!(Nowcaster::pretrained().predict(-5.0) < 0.0);
    }
}
