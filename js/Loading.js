/*jslint plusplus: true, sloppy: true, indent: 4 */
var op = 1;

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
var count = 1;
function addDots() {
    var element = document.getElementById("loadingMessage"),
        dotIndex = element.innerHTML.indexOf("."),
        stringOut = element.innerHTML.substring(0, dotIndex);
    
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
    fade();
}

//Start dots
var loadingTimer = setInterval(addDots, 500);