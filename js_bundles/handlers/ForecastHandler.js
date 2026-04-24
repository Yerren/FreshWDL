/*jslint plusplus: true, sloppy: true, indent: 4 */
// ForecastHandler: DOM handler for the forecast strip + "show more" modal.
// OO conversion of legacy forecast / formatAndDisplayForecastFor01 /
// resizeDivFor01 / forecastInitFor01.

(function (global) {
    function ForecastHandler(config) {
        config = config || {};
        config.elementId = config.elementId || "forecastText";
        config.events = config.events || ["clientRawExtraDataUpdate"];
        DomHandler.call(this, config);

        this.displayDiv = null;
        this.modalForecastDiv = null;
        this.headerText = null;
        this.modal = null;
        this.span = null;
        this.showMoreLink = null;
        this.storedTextInput = "Waiting for data...";
    }
    WidgetBase.inherit(ForecastHandler, DomHandler);

    ForecastHandler.prototype.setUp = function () {
        this.displayDiv = document.getElementById("forecastText");
        this.modalForecastDiv = document.getElementById("modalForecastDiv");
        this.headerText = document.getElementById("forecastHeaderText");
        this.element = this.displayDiv;

        this.headerText.innerHTML = useDict("forecastTitle");

        this.modal = document.getElementById('forecastModal');
        this.modal.style.display = "none";

        this.span = document.getElementById("forecastClose");

        var self = this,
            closeHandler = function () { self.modal.style.display = "none"; },
            windowClickHandler = function (event) {
                if (event.target === self.modal) { self.modal.style.display = "none"; }
            };
        this.span.addEventListener("click", closeHandler);
        this._listeners.push({ event: "click", handler: closeHandler, target: this.span });
        window.addEventListener("click", windowClickHandler);
        this._listeners.push({ event: "click", handler: windowClickHandler });

        // Delegated click for the "show more" link: displayDiv's innerHTML is
        // rewritten on every poll, so any listener on the link itself would be
        // orphaned. Listening on the stable parent and matching by id keeps the
        // binding alive across re-renders and tracked in _listeners.
        var showMoreHandler = function (event) {
            var target = event.target || event.srcElement;
            if (target && target.id === "showMoreLink") {
                self.modal.style.display = "block";
            }
        };
        this.displayDiv.addEventListener("click", showMoreHandler);
        this._listeners.push({ event: "click", handler: showMoreHandler, target: this.displayDiv });
    };

    // Legacy formatAndDisplayForecastFor01.
    ForecastHandler.prototype.formatAndDisplay = function (textInput) {
        if (textInput === null) {
            textInput = this.storedTextInput;
        }

        if (textInput === "---") {
            textInput = "";
        }

        this.storedTextInput = textInput;
        var origionalText = textInput.replace(/_/g, " "),
            editedText = origionalText,
            textArray = origionalText.split(" ");

        this.modalForecastDiv.innerHTML = origionalText;
        this.displayDiv.innerHTML = origionalText;

        if (checkOverflow(this.displayDiv)) {
            while (checkOverflow(this.displayDiv) && textArray.length > 0) {
                var charRemove = textArray.pop();
                charRemove = charRemove.length;
                editedText = editedText.slice(0, -(charRemove + 1));
                this.displayDiv.innerHTML = editedText + '... <a id="showMoreLink" href="#"> ' + useDict("forcastShowMore") + ' </a>';
            }
            this.showMoreLink = document.getElementById("showMoreLink");
        }
    };

    // Legacy resizeDivFor01.
    ForecastHandler.prototype.resize = function () {
        if (!this.displayDiv) { return; }

        var size = 1,
            modalDivSize = 0.4,
            ratio = 6.19,
            width = 0,
            height = 0,
            stlyeString = null,
            parentDiv = this.displayDiv.parentElement;

        width = parentDiv.clientHeight * size * ratio;
        height = parentDiv.clientHeight * size * 0.59;

        width = width.toString() + "px";
        height = height.toString() + "px";
        stlyeString = "width:" + width.toString() + ";height:" + height.toString();

        this.displayDiv.setAttribute("style", stlyeString.toString());
        this.displayDiv.style.width = width.toString();
        this.displayDiv.style.height = height.toString();

        if (document.documentElement.clientHeight <= document.documentElement.clientWidth) {
            width = document.documentElement.clientHeight * modalDivSize * 2;
            height = document.documentElement.clientHeight * modalDivSize;
        } else {
            width = document.documentElement.clientWidth * modalDivSize * 2;
            height = document.documentElement.clientWidth * modalDivSize;
        }

        width = width.toString() + "px";
        height = height.toString() + "px";
        stlyeString = "width:" + width.toString() + ";height:" + height.toString();
        this.modalForecastDiv.setAttribute("style", stlyeString.toString());
        this.modalForecastDiv.style.width = width.toString();
        this.modalForecastDiv.style.height = height.toString();

        this.formatAndDisplay(null);
    };

    ForecastHandler.prototype.onDataUpdate = function (eventName) {
        if (eventName === "clientRawExtraDataUpdate") {
            this.formatAndDisplay(arrayClientrawExtra[531]);
        }
    };

    global.ForecastHandler = ForecastHandler;
})(typeof window !== "undefined" ? window : this);
