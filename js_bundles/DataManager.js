/*jslint plusplus: true, sloppy: true, indent: 4 */
// DataManager: owns XHR polling of the four clientraw* files and dispatches
// the same clientRaw*DataUpdate events the widgets already listen for.
// Mirrors the legacy loadArray / updateClientraw* / tryUpdateWidgets flow.
//
// Keeps the same globals exposed (arrayClientraw, arrayClientrawExtra,
// arrayClientrawHour, arrayClientrawDaily, graphDict, doneCR*, attemptedCR*,
// firstTime, loaded, noDataChanged, loadEvents, baseURL) because dozens of
// widgets and helpers read them directly.

(function (global) {
    function DataManager(config) {
        config = config || {};
        this.intervalMs = config.intervalMs || 5000;
        this.intervals = { cr: null, cre: null, crh: null, crd: null };

        if (typeof global.arrayClientraw === "undefined") { global.arrayClientraw = []; }
        if (typeof global.arrayClientrawExtra === "undefined") { global.arrayClientrawExtra = []; }
        if (typeof global.arrayClientrawHour === "undefined") { global.arrayClientrawHour = []; }
        if (typeof global.arrayClientrawDaily === "undefined") { global.arrayClientrawDaily = []; }
        if (typeof global.arrayClientrawOld === "undefined") { global.arrayClientrawOld = []; }
        if (typeof global.arrayClientrawExtraOld === "undefined") { global.arrayClientrawExtraOld = []; }
        if (typeof global.arrayClientrawHourOld === "undefined") { global.arrayClientrawHourOld = []; }
        if (typeof global.arrayClientrawDailyOld === "undefined") { global.arrayClientrawDailyOld = []; }
        if (typeof global.graphDict === "undefined") { global.graphDict = {}; }
        if (typeof global.recordsDict === "undefined") { global.recordsDict = [{}, {}, {}]; }
        if (typeof global.firstTime === "undefined") { global.firstTime = true; }
        if (typeof global.noDataChanged === "undefined") { global.noDataChanged = false; }
        if (typeof global.loaded === "undefined") { global.loaded = null; }

        if (typeof global.loadEvents === "undefined") {
            global.loadEvents = {
                clientRaw: new CustomEvent("clientRawDataUpdate"),
                clientRawExtra: new CustomEvent("clientRawExtraDataUpdate"),
                clientRawHour: new CustomEvent("clientRawHourDataUpdate"),
                clientRawDaily: new CustomEvent("clientRawDailyDataUpdate"),
                graphData: new CustomEvent("graphDataUpdated")
            };
        }

        this.resolveBaseURL();
    }

    DataManager.prototype.resolveBaseURL = function () {
        var baseURL = window.location.href;
        var to = baseURL.lastIndexOf("/");
        if (typeof customBaseURL === "undefined" || customBaseURL === false) {
            to = to === -1 ? baseURL.length : to + 1;
            baseURL = baseURL.substring(0, to);
        } else {
            baseURL = customBaseURL;
        }
        global.baseURL = baseURL;
    };

    DataManager.prototype.loadArray = function (url) {
        var xhttpVar;
        if (window.XMLHttpRequest) {
            xhttpVar = new XMLHttpRequest();
        } else {
            xhttpVar = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xhttpVar.open("GET", url, true);
        xhttpVar.setRequestHeader("Cache-Control", "no-cache");
        xhttpVar.send();
        return xhttpVar;
    };

    DataManager.prototype.meteohubFix = function (arr) {
        if (arr.indexOf("-") !== -1) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].toString() === "-") { arr[i] = "0"; }
            }
        }
    };

    // Generic poll: fetches `url`, writes split response to global[arrayKey],
    // and toggles the done/error/attempted flag names from `flags`.
    DataManager.prototype.updatePoll = function (url, arrayKey, flags) {
        var self = this,
            xhttp = this.loadArray(url);
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState !== 4) { return; }
            if (xhttp.status === 200) {
                global[flags.error] = false;
                global[arrayKey] = xhttp.responseText.toString().split(" ");
                global[flags.done] = true;
                self.meteohubFix(global[arrayKey]);
            } else {
                global[flags.error] = true;
            }
            self.tryUpdateWidgets();
        };
        global[flags.attempted] = true;
    };

    DataManager.prototype.updateClientraw = function () {
        this.updatePoll(global.baseURL + clientRawName, "arrayClientraw",
            { done: "doneCR", error: "dataCollectErrorCR", attempted: "attemptedCR" });
    };

    DataManager.prototype.updateClientrawExtra = function () {
        this.updatePoll(global.baseURL + clientRawExtraName, "arrayClientrawExtra",
            { done: "doneCRE", error: "dataCollectErrorCRE", attempted: "attemptedCRE" });
    };

    DataManager.prototype.updateClientrawHour = function () {
        this.updatePoll(global.baseURL + clientRawHourName, "arrayClientrawHour",
            { done: "doneCRH", error: "dataCollectErrorCRH", attempted: "attemptedCRH" });
    };

    DataManager.prototype.updateClientrawDaily = function () {
        this.updatePoll(global.baseURL + clientRawDailyName, "arrayClientrawDaily",
            { done: "doneCRD", error: "dataCollectErrorCRD", attempted: "attemptedCRD" });
    };

    // Dispatches data-update events and triggers main-page graph
    // reconfigurations when all four fetches have resolved.
    DataManager.prototype.tryUpdateWidgets = function () {
        if (global.loaded !== true) { return; }

        var allDone = (global.doneCR === true && global.doneCRE === true &&
            global.doneCRH === true && global.doneCRD === true);
        var allAttempted = (global.attemptedCR === true && global.attemptedCRE === true &&
            global.attemptedCRH === true && global.attemptedCRD === true &&
            global.firstTime === false);

        if (!(allDone || allAttempted)) { return; }

        global.doneCR = global.doneCRE = global.doneCRH = global.doneCRD = false;
        global.attemptedCR = global.attemptedCRE = global.attemptedCRH = global.attemptedCRD = false;

        var sameCR = global.arrayClientraw.equals(global.arrayClientrawOld);
        var sameCRE = global.arrayClientrawExtra.equals(global.arrayClientrawExtraOld);
        var sameCRH = global.arrayClientrawHour.equals(global.arrayClientrawHourOld);
        var sameCRD = global.arrayClientrawDaily.equals(global.arrayClientrawDailyOld);

        if (sameCR && sameCRE && sameCRH && sameCRD) {
            global.noDataChanged = true;
        } else {
            global.noDataChanged = false;
            if (!sameCR) {
                global.arrayClientrawOld = global.arrayClientraw;
                window.dispatchEvent(global.loadEvents.clientRaw);
            }
            if (!sameCRE) {
                global.arrayClientrawExtraOld = global.arrayClientrawExtra;
                window.dispatchEvent(global.loadEvents.clientRawExtra);
            }
            if (!sameCRD) {
                global.arrayClientrawDailyOld = global.arrayClientrawDaily;
                window.dispatchEvent(global.loadEvents.clientRawDaily);
            }
            if (!sameCRH) {
                global.arrayClientrawHourOld = global.arrayClientrawHour;
                window.dispatchEvent(global.loadEvents.clientRawHour);
            }

            if (typeof global.processGraphData === "function") {
                global.processGraphData();
            }
            window.dispatchEvent(global.loadEvents.graphData);
        }

        if (global.firstTime === true) {
            global.firstTime = false;
            if (typeof global.loadingFinished === "function") {
                global.loadingFinished();
            }
        }
    };

    DataManager.prototype.start = function () {
        var self = this;
        this.updateClientraw();
        this.updateClientrawExtra();
        this.updateClientrawHour();
        this.updateClientrawDaily();
        this.intervals.cr = setInterval(function () { self.updateClientraw(); }, this.intervalMs);
        this.intervals.cre = setInterval(function () { self.updateClientrawExtra(); }, this.intervalMs);
        this.intervals.crh = setInterval(function () { self.updateClientrawHour(); }, this.intervalMs);
        this.intervals.crd = setInterval(function () { self.updateClientrawDaily(); }, this.intervalMs);
    };

    DataManager.prototype.stop = function () {
        if (this.intervals.cr) { clearInterval(this.intervals.cr); }
        if (this.intervals.cre) { clearInterval(this.intervals.cre); }
        if (this.intervals.crh) { clearInterval(this.intervals.crh); }
        if (this.intervals.crd) { clearInterval(this.intervals.crd); }
        this.intervals = { cr: null, cre: null, crh: null, crd: null };
    };

    global.DataManager = DataManager;

    // Authoritative list of globals to clear between preview renders.
    // Add new state here when extending DataManager, not in previewHost.html.
    DataManager.resetState = function (g) {
        g.arrayClientraw = [];
        g.arrayClientrawExtra = [];
        g.arrayClientrawHour = [];
        g.arrayClientrawDaily = [];
        g.arrayClientrawOld = [];
        g.arrayClientrawExtraOld = [];
        g.arrayClientrawHourOld = [];
        g.arrayClientrawDailyOld = [];
        g.firstTime = true;
        g.loaded = null;
        g.doneCR = g.doneCRE = g.doneCRH = g.doneCRD = false;
        g.attemptedCR = g.attemptedCRE = g.attemptedCRH = g.attemptedCRD = false;
    };
})(typeof window !== "undefined" ? window : this);
