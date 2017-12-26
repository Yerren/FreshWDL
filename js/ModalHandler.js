/*jslint plusplus: true, sloppy: true, indent: 4 */
var modal = {
    modal: null,
    canvas: null,
    canvasDiv: null,
    button: null,
    span: null,
    selectMenu: null,
    graphInputs: {},
    graphs: {
        rain: null,
        baro: null,
        temp: null,
        wind: null
    }
};


function initModalHandler() {
    //Does things which need to be done once page is fully loaded
    // Get the canvas, and others
    modal.canvas = modalGraph.canvas;
    modal.canvasDiv = modalGraph.canvasDiv;
    modal.selectMenu = document.getElementById("selectMenu");

    // Get the modal
    modal.modal = document.getElementById('myModal');
    modal.modal.style.display = "none";

    // Get the <span> element that closes the modal
    modal.span = document.getElementById("graphClose");
    //Select menu
    var select, i, option;

    select = document.getElementById("selectMenu");

    // Populate 'select' menu
    var gGkeys = Object.keys(globalGraphs),
        options = {};
    
    for (a = 0; a < gGkeys.length; a++) {
        var currentGraphKeys = Object.keys(globalGraphs[gGkeys[a]].graphs);

        for (b = 0; b < currentGraphKeys.length; b++) {
            var optionLabel = gGkeys[a].toString() + currentGraphKeys[b].toString();

            options[optionLabel] = document.createElement("option");
            options[optionLabel].value = optionLabel;
            modal.graphInputs[optionLabel] = [gGkeys[a], currentGraphKeys[b]];
            options[optionLabel].text = globalGraphs[gGkeys[a]].graphs[currentGraphKeys[b]].title;

            modal.selectMenu.add(options[optionLabel]);
        }
    }
    
    // When the user clicks on <span> (x), close the modal
    modal.span.onclick = function () {
        modal.modal.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal.modal) {
            modal.modal.style.display = "none";
        }
    };

    // When the user clicks a graph, or graph button, open the modal
    modal.graphs.rain = document.getElementById("rainGraphCanvas01");
    modal.graphs.rain.addEventListener('click', function() {
        modal.selectMenu.value = "rainfallBardailyMonth";
        modal.modal.style.display = "block";
        configureGraph("rainfallBar", "dailyMonth");
        modalGraph.chart.resize();
    }, false);
    
    modal.graphs.temp = document.getElementById("tempGraphCanvas01");
    modal.graphs.temp.addEventListener('click', function() {
        modal.selectMenu.value = "temphourlyDay";
        modal.modal.style.display = "block";
        configureGraph("temp", "hourlyDay");
        modalGraph.chart.resize();
    }, false);
    
    modal.graphs.baro = document.getElementById("baroGraphCanvas01");
    modal.graphs.baro.addEventListener('click', function() {
        modal.selectMenu.value = "barometerhourlyDay";
        modal.modal.style.display = "block";
        configureGraph("barometer", "hourlyDay");
        modalGraph.chart.resize();
    }, false);
    
    modal.graphs.wind = document.getElementById("windGraphCanvas01");
    modal.graphs.wind.addEventListener('click', function() {
        modal.selectMenu.value = "windSpeedhourlyDay";
        modal.modal.style.display = "block";
        configureGraph("windSpeed", "hourlyDay");
        modalGraph.chart.resize();
    }, false);
    
    modal.button = document.getElementById("GraphsButton");
    modal.button.addEventListener('click', function() {
        modal.selectMenu.value = "barometerhourlyDay";
        modal.modal.style.display = "block";
        configureGraph("barometer", "hourlyDay");
        modalGraph.chart.resize();
    }, false);
    
    checkOffLoaded();
}

// Change graph when user uses 'select' menu
function graphChange(obj) {
    configureGraph(modal.graphInputs[obj.value][0], modal.graphInputs[obj.value][1]);
}