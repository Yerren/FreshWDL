/*jslint plusplus: true, sloppy: true, indent: 4 */
var records = {
    modal: null,
    span: null,
    modalRecordsDiv: null,
    button: null,
    table: null,
    recordsDictOld: null,
    currentOption: 0
};

function updateValuesRe01() {
    var  recordKeys = Object.keys(recordsDict[records.currentOption]);
    records.table.innerHTML = '';
    for (i = 0; i < recordKeys.length; i++) {
        var row = records.table.insertRow(),
            cell0 = row.insertCell(0),
            cell1 = row.insertCell(1),
            cell2 = row.insertCell(2);

        cell0.innerHTML = recordKeys[i];
        cell2.innerHTML = recordsDict[records.currentOption][recordKeys[i]][1].format("HH:mm, DD/MM/YYYY");

        if (recordsDict[records.currentOption][recordKeys[i]].length == 3) {
            cell1.innerHTML = formatDataToUnit(recordsDict[records.currentOption][recordKeys[i]][0], recordsDict[records.currentOption][recordKeys[i]][2], roundTo) + units[recordsDict[records.currentOption][recordKeys[i]][2].toString()][currentUnits[recordsDict[records.currentOption][recordKeys[i]][2].toString()]][1].toString();
        } else if (recordsDict[records.currentOption][recordKeys[i]].length == 4) {
            cell1.innerHTML = formatDataToUnit(recordsDict[records.currentOption][recordKeys[i]][0], recordsDict[records.currentOption][recordKeys[i]][2], roundTo) + units[recordsDict[records.currentOption][recordKeys[i]][2].toString()][currentUnits[recordsDict[records.currentOption][recordKeys[i]][2].toString()]][1].toString() + recordsDict[records.currentOption][recordKeys[i]][3];
        }
        
        var dateDiff = moment(arrayClientraw[29] + arrayClientraw[30] + arrayClientraw[31] + arrayClientraw[74], "HHmmssdd/mm/yyyy").diff(recordsDict[records.currentOption][recordKeys[i]][1], 'days');
        if (dateDiff < 1) {
            row.style.backgroundColor = "rgb(245, 141, 122)";
        } else if (dateDiff <= 7) {
            row.style.backgroundColor = "rgb(236, 242, 98)";
        } else {
            row.style.backgroundColor = "rgb(157, 235, 99)";
        }
    }
}

function changeCurrentOptionRe01(optionNum) {
    records.currentOption = optionNum;
    updateValuesRe01();
}

function resizeDivRe01() {
    //Dynamic Div Resizing for desktop
	var size = 1,
        modalDivSize = 0.6,
        width = 0,
        height = 0,
        stlyeString = null,
        increaseCount = 0;
    
	//Adjusts modal div to math resized window. always adjust to the smallest dimention
    if (window.innerHeight <= window.innerWidth) {
		width = window.innerHeight * modalDivSize * 1.5;
		height = window.innerHeight * modalDivSize;
	} else {
		width = window.innerWidth * modalDivSize * 1.5;
		height = window.innerWidth * modalDivSize;
	}
    
    records.table.style.fontSize = sharpenValue(Math.pow(height, 2) / 10000) + "px";
        while (records.modalRecordsDiv.clientHeight < records.table.clientHeight) {
            records.table.style.fontSize = sharpenValue(Math.pow(height, 2) / (10000 + 1000 * increaseCount)) + "px";
            increaseCount += 1;
        }
        
    
    width = width.toString() + "px";
    height = height.toString() + "px";
    stlyeString = "width:" + width.toString() + ";height:" + height.toString();
    records.modalRecordsDiv.setAttribute("style", stlyeString.toString());
    //For browser compadibility
    records.modalRecordsDiv.style.width = width.toString();
    records.modalRecordsDiv.style.height = height.toString();
    
    if (recordsDict !== records.recordsDictOld) {
        updateValuesRe01();
    }
    records.recordsDictOld = recordsDict;
}

function recordsInitRe01() {
    records.modalRecordsDiv = document.getElementById("modalRecordsDiv");
    records.button = document.getElementById("RecordsButton");
    records.table = document.getElementById("recordsTable");
    // Get the modal
    records.modal = document.getElementById('recordsModal');
    records.modal.style.display = "none";

    // Get the <span> element that closes the modal
    records.span = document.getElementById("recordsClose");

    // When the user clicks on <span> (x), close the modal
    records.span.onclick = function () {
        records.modal.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == records.modal) {
            records.modal.style.display = "none";
        }
    };
    
    records.button.addEventListener('click', function() {
        records.modal.style.display = "block";
        resizeDivRe01();
    }, false);
    
    //If on desktop, dynamically resize the div, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeDivRe01();
		}, false);
	}
	
    //Set the div size intially.
    resizeDivRe01();
    
    checkOffLoaded();
}