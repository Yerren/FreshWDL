/*jslint plusplus: true, sloppy: true, indent: 4 */
var op = 1,
    dataCollectErrorCR = false,
    dataCollectErrorCRE = false,
    dataCollectErrorCRH = false,
    dataCollectErrorCRD = false;

function fade() {
    var element = document.getElementById("loadingScreen");
    var timer = setInterval(function () {
        if (op <= 0.1){
            clearInterval(timer);
            element.style.display = 'none';
            clearInterval(loadingTimer); // stop the dots
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, 50);
}

function unfade(element) {
    element.style.display = 'block';
    var timer = setInterval(function () {
        if (op >= 1){
            clearInterval(timer);
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * 0.1;
    }, 10);
}

//Add "." to end of loading message, up to three, then remove two
// 🦀 Now also rotates through enterprise-grade loading messages, sourced from
// Rust (crates/freshwdl-loading-messages), once per dot cycle.
var count = 1,
    dotCycles = 0,
    loadingStartedAt = Date.now(),
    // ⏳ ADR-0010: the loading screen is shown for at least this long, no matter how
    // fast the data arrives, so users understand how much is happening.
    minimumLoadingScreenMs = 5000;
function addDots() {
    var element = document.getElementById("loadingMessage"),
        dotIndex = element.innerHTML.indexOf("."),
        stringOut = element.innerHTML.substring(0, dotIndex);
    
    if (count === 3) {
        dotCycles += 1;
        if (typeof FreshWDLrs !== "undefined") {
            stringOut = FreshWDLrs.nextLoadingMessage();
        }
    }
    
    //check if there is an error in collecting data
    if (dataCollectErrorCR === true || dataCollectErrorCRE === true || dataCollectErrorCRH === true || dataCollectErrorCRD === true) {
        stringOut = "Data Currently Unavailable";
    }
    
    count += 1;
    if (count > 3) {
        count = 1;
    }
    stringOut = stringOut + "...";
    stringOut = stringOut.substring(0, stringOut.length + count - 3);
    element.innerHTML = stringOut;
}

function loadingFinished() {
    // 🚀 Data is ready! Wait for the rest of the enterprise to catch up.
    var remaining = minimumLoadingScreenMs - (Date.now() - loadingStartedAt);
    if (typeof FreshWDLrs !== "undefined") {
        FreshWDLrs.log("Data ready in " + (Date.now() - loadingStartedAt) + "ms. Holding loading screen for a further " + Math.max(0, remaining) + "ms for perceived enterprise-ness (ADR-0010).");
    }
    setTimeout(fade, Math.max(0, remaining));
}

//Start dots
var loadingTimer = setInterval(addDots, 500);
