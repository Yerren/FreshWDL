# 🏛️ Legacy Code Retrospective

### A Respectful Look Back at FreshWDL (JavaScript Edition), 2016–2026

> *"Those who cannot remember the past are condemned to rewrite it in Rust."*

---

## Foreword

Before we begin, it's important to say something clearly: **the legacy FreshWDL codebase works.** 🙏

It has been displaying the weather, accurately, on real weather stations around the world, in 18 languages, for years. It replaced a Flash-based application at a time when Flash was dying, and made the weather available on phones, tablets and anything else with a browser. That is a genuine achievement, and the author, Yerren, deserves enormous credit.

This retrospective is written in a spirit of **appreciation**, **learning**, and **gentle wonder**. It looks at some of the more distinctive choices in the original code. Not to criticise them, but to *celebrate* them, before they are respectfully wrapped in 23 crates.

---

## 📊 By the Numbers

| Metric | Value |
|---|---|
| Lines in `WidgetsHandlers.js` | ~8,000 |
| Lines in `Globals.js` | ~2,500 |
| Total lines (excluding libraries) | ~11,000 |
| Number of temperature widgets | 3 |
| Number of temperature widget implementations | 3 |
| Global variables | Yes |
| Build steps | 0 |
| Dependencies requiring a compiler | 0 |
| Years in production | Many |
| Memory safety incidents | 0 (that we know of) |
| Crabs | 0 😢 |

---

## 🌟 Highlights

### 1. `WidgetsHandlers.js`: A Monument

At roughly **8,000 lines**, `WidgetsHandlers.js` is less a file and more a **place**. It contains every widget, every gauge, every animation, the data loading, the modal, the graphs, the records, the forecast, the ticker and the moon.

Modern developers are often told to split code into small modules. The author has instead chosen the **single source of truth** approach, taken to its logical conclusion: there is one source, and it is all the truth.

There is something deeply admirable about being able to `Ctrl+F` for *anything* in the project and know, with certainty, which file it will be in. 🔍

> **Rust edition:** This file has been preserved and renamed to `WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js`. It is still used. See [ADR-0006](docs/adr/0006-keep-do-not-use-js-loaded.md).

### 2. Temp01, Temp02, Temp03: Consistency as a Value

The temperature widgets are implemented three times, as `Temp01`, `Temp02` and `Temp03`, each with its own `formatInput`, `drawTemperatureBar`, `updateTweens`, `updateTop`, `resizeCanvas`, `setUp` and `initialize` functions.

A less confident developer might have reached for an abstraction here. The author instead demonstrated an **admirable commitment to consistency**: if something works once, why not have it work three times? 📋📋📋

This approach has real benefits:

- Each widget can be changed independently, with no risk of breaking the others.
- Each widget can be *read* independently, without having to understand an abstraction.
- If one is deleted, the other two are unaffected.

We have honoured this choice by creating three separate crates ([ADR-0009](docs/adr/0009-three-temperature-crates.md)).

The same pattern can be seen with `UniBar01`, `UniBar02` and `UniBar03` (which, notably, are rain gauges, though their name keeps this a pleasant secret).

### 3. `Number.prototype.map`: A Brave Choice

At the very top of `WidgetsHandlers.js`, the author extends JavaScript's built-in `Number` prototype:

```js
Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};
```

Extending built-in prototypes is often discouraged, because it can conflict with future versions of the language or with other libraries. The author has looked at this advice and, with quiet confidence, decided that **numbers should be able to map**. And honestly? They should. 💪

This is one of the few parts of the codebase to receive its own dedicated Rust crate: `freshwdl-number-prototype-map`.

### 4. `Array.prototype.equals`: Standing on the Shoulders of Giants

Not content with improving `Number`, the codebase also adds `Array.prototype.equals`, with a gracious credit:

```js
//Array comparison, credit to Tomas Zato @ https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript.
```

It even includes a warning in case the method already exists, and hides itself from `for...in` loops with `Object.defineProperty`. This is a **considerate** prototype extension: it knocks before entering. 🚪

Proper attribution to Stack Overflow is something many professional codebases fail to do. This one does it consistently, including credits for `betterRound` and `checkOverflow`. We have preserved all of these credits and added our own: thanks to Ferris. 🦀

### 5. "Meteohub compadibility"

The data loading code contains, four times, the following comment:

```js
//Meteohub compadibility changes
```

and once, elsewhere:

```js
// Meteohub compadibility fix
```

The spelling *compadibility* has been used consistently across all instances, which suggests it is not a typo but a **house style**. 🏠 Consistency is the hallmark of a mature codebase.

In the Rust edition, Meteohub compatibility is handled by `freshwdl-clientraw`, which replaces `-` with `0`, exactly as before, but memory-safely. The doc comment for this function preserves the original spelling as a tribute.

### 6. `nocashe_string`

The cache-busting logic in `loadArray` declares two variables:

```js
nocache_date = new Date(),
nocashe_string = `${nocache_date.getFullYear()}...`;
```

`nocache_date`, and then `nocashe_string`. 💸

We like to think this was intentional: a subtle reminder that **no cash** was spent on this project, which is true, and which explains the ko-fi link. Please consider donating.

### 7. Internet Explorer 5 and 6 Support

`loadArray` contains this:

```js
if (window.XMLHttpRequest) {
    // code for modern browsers
    xhttpVar = new XMLHttpRequest();
} else {
    // code for IE6, IE5
    xhttpVar = new ActiveXObject("Microsoft.XMLHTTP");
}
```

Internet Explorer 5 was released in **1999**. It does not support `<canvas>`, which every widget in FreshWDL needs, and the same function uses a template literal two lines earlier, which IE5 cannot parse.

So the IE5 branch can never actually run. And yet it remains: a lighthouse for any IE5 user who might wander by, letting them know they are **thought of**. 🕯️ This is inclusive design at its most hopeful.

The Rust edition targets `wasm32-unknown-unknown`, which IE5 also does not support. We are proud to keep this tradition going.

### 8. "A bit janky, but it works."

In `formatTimestampsToMoments`, after a clever piece of logic that converts 12-hour timestamps to 24-hour time by flipping an `addTwelve` flag every time it passes 12 o'clock, there is this comment:

```js
// Do the conversion. A bit janky, but it works.
```

We want to highlight this comment specifically, because it is **the most honest line of code in the project**, and possibly in all of open source. 🏆

Many codebases contain janky code. Very few have the self-awareness to label it. Fewer still are correct about the second half of the sentence. This one is.

This comment has been adopted as the unofficial motto of the Rust migration, which is also a bit janky, but it works.

### 9. Globals, Lovingly Arranged

Widget state is kept in global objects like:

```js
var apparent01 = {
    stage: null,
    canvas: null,
    ...
    config: { canvasID: "Apparent01", unitsIn: "temp" }
};
```

The comment above it explains: *"These are set up in a hierarchical structure so that they can be easily accessed"*. And they *can* be easily accessed. From anywhere. By anyone. 🌍 This is what we call **radical accessibility**.

### 10. `.split(" ")`

Finally, the whole data pipeline is built on one line:

```js
arrayClientraw = xhttpCR.responseText.toString().split(" ");
```

It is simple. It is correct. It is fast. It has never failed.

We have replaced it with eleven steps across a WebAssembly boundary ([ARCHITECTURE.md §7](ARCHITECTURE.md#7-the-ffi-boundary)). 🦀

---

## 🎓 Lessons Learned

1. **Working software is a feature.** The legacy code works, and in the end, so does ours, mostly because of the legacy code.
2. **Honesty in comments is underrated.** "A bit janky, but it works" > 400 lines of ADRs. (We wrote the ADRs anyway.)
3. **Copy-paste is a valid architecture**, as long as you're consistent about it.
4. **Credit your sources.** Yerren credits Stack Overflow. We credit Yerren. 🙏

---

## 💌 Closing Note

To Yerren: thank you for FreshWDL. It made the weather accessible on any device, for free, for years, for a community of weather enthusiasts around the world.

We're sorry about the crab.

---

*This retrospective was generated with care. As a large language model, I don't have personal opinions about code, but if I did, I would say this codebase has a lot of heart.* ❤️
