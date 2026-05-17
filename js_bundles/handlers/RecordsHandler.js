/*jslint plusplus: true, sloppy: true, indent: 4 */
// RecordsHandler: DOM handler for the records modal (table + select menu).
// changeCurrentOptionRe01 is exposed as a global because InnerContent.js calls it
// from an inline onchange handler.

(function (global) {
    function RecordsHandler(config) {
        config = config || {};
        config.events = config.events || ["clientRawExtraDataUpdate"];
        config.unitEvents = config.unitEvents || ["altitude", "pressure", "wind", "rainfall", "temp"];
        DomHandler.call(this, config);
        this.modal = null;
        this.span = null;
        this.modalRecordsDiv = null;
        this.button = null;
        this.table = null;
        this.headerText = null;
        this.selectMenu = null;
        this.currentOption = 0;
    }
    WidgetBase.inherit(RecordsHandler, DomHandler);

    RecordsHandler.prototype.updateValues = function () {
        var recordKeys = Object.keys(recordsDict[this.currentOption]);
        this.table.innerHTML = '';
        for (var i = 0; i < recordKeys.length; i++) {
            var row   = this.table.insertRow(),
                cell0 = row.insertCell(0),
                cell1 = row.insertCell(1),
                cell2 = row.insertCell(2),
                rec   = recordsDict[this.currentOption][recordKeys[i]];

            cell0.innerHTML = recordKeys[i];
            cell2.innerHTML = rec[1].format("HH:mm, MMM D YYYY");

            if (rec.length === 3) {
                cell1.innerHTML = formatDataToUnit(rec[0], rec[2]) + units[rec[2].toString()][currentUnits[rec[2].toString()]][1].toString();
            } else if (rec.length === 4) {
                cell1.innerHTML = formatDataToUnit(rec[0], rec[2]) + units[rec[2].toString()][currentUnits[rec[2].toString()]][1].toString() + rec[3];
            }

            var dateDiff = moment(arrayClientraw[29] + arrayClientraw[30] + arrayClientraw[31] + arrayClientraw[74], "HHmmssdd/mm/yyyy").diff(rec[1], 'days');
            if (dateDiff < 2) {
                row.style.backgroundColor = "rgb(245, 141, 122)";
            } else if (dateDiff <= 7) {
                row.style.backgroundColor = "rgb(236, 242, 98)";
            } else {
                row.style.backgroundColor = "rgb(157, 235, 99)";
            }
        }
    };

    // Unit toggle buttons dispatch unitChange_<type>. The records table shows
    // every metric at once, so redraw on any of them rather than caring which.
    RecordsHandler.prototype.redrawForUnitChange = function () {
        this.updateValues();
    };

    RecordsHandler.prototype.changeCurrentOption = function (optionNum) {
        this.currentOption = optionNum;
        this.updateValues();
    };

    RecordsHandler.prototype.resize = function () {
        var size = 1, modalDivSize = 0.6, width, height, increaseCount = 0;

        if (document.documentElement.clientHeight <= document.documentElement.clientWidth) {
            width  = document.documentElement.clientHeight * modalDivSize * 1.5;
            height = document.documentElement.clientHeight * modalDivSize;
        } else {
            width  = document.documentElement.clientWidth * modalDivSize * 1.5;
            height = document.documentElement.clientWidth * modalDivSize;
        }

        this.table.style.fontSize = sharpenValue(Math.pow(height, 2) / 10000) + "px";
        while (this.modalRecordsDiv.clientHeight + 2 < this.table.clientHeight) {
            this.table.style.fontSize = sharpenValue(Math.pow(height, 2) / (10000 + 1000 * increaseCount)) + "px";
            increaseCount += 1;
        }

        var widthStr  = width.toString() + "px",
            heightStr = height.toString() + "px",
            styleStr  = "width:" + widthStr + ";height:" + heightStr;
        this.modalRecordsDiv.setAttribute("style", styleStr);
        this.modalRecordsDiv.style.width  = widthStr;
        this.modalRecordsDiv.style.height = heightStr;

        this.updateValues();
    };

    RecordsHandler.prototype.onDataUpdate = function () {
        processRecordsData(recordsDict[2], 313, 684);
        processRecordsData(recordsDict[1], 187, 672);
        processRecordsData(recordsDict[0],  61, 660);
        this.updateValues();
    };

    RecordsHandler.prototype.setUp = function () {
        var self = this;

        this.modalRecordsDiv = document.getElementById("modalRecordsDiv");
        this.button          = document.getElementById("RecordsButton");
        this.table           = document.getElementById("recordsTable");
        this.headerText      = document.getElementById("recordsHeaderText");
        this.selectMenu      = document.getElementById("selectMenuRecords");

        this.headerText.innerHTML = useDict("buttonLabelRecords");
        if (this.button) {
            this.button.innerHTML = useDict("buttonLabelRecords");
        }

        var option1 = document.createElement("option"),
            option2 = document.createElement("option"),
            option3 = document.createElement("option");
        option1.text = useDict("recordsForMonth");  option1.value = 0;
        option2.text = useDict("recordsForYear");   option2.value = 1;
        option3.text = useDict("recordsAllTime");   option3.value = 2;
        this.selectMenu.add(option1);
        this.selectMenu.add(option2);
        this.selectMenu.add(option3);

        this.modal = document.getElementById("recordsModal");
        this.modal.style.display = "none";

        this.span = document.getElementById("recordsClose");
        var closeHandler = function () { self.modal.style.display = "none"; };
        this.span.addEventListener("click", closeHandler);

        var outsideClickHandler = function (event) {
            if (event.target === self.modal) {
                self.modal.style.display = "none";
            }
        };
        window.addEventListener("click", outsideClickHandler);
        this._listeners.push({ event: "click", handler: outsideClickHandler });

        if (this.button) {
            this.button.addEventListener("click", function () {
                self.modal.style.display = "block";
                self.resize();
            }, false);
        }

        // Expose global for inline onchange handler in InnerContent.js
        global.changeCurrentOptionRe01 = function (optionNum) {
            self.changeCurrentOption(optionNum);
        };
    };

    global.RecordsHandler = RecordsHandler;
})(typeof window !== "undefined" ? window : this);
