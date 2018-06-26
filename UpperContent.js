document.write('\
    <!-- The Records Modal -->\
    <div id="recordsModal" class="modal">\
\
        <!-- Modal content -->\
        <div class="modal-content">\
            <div id="recordsHeader" class="modal-header">\
                <span id="recordsClose" class="close">&#215</span>\
                <h2 id="recordsHeaderText" class="header-text"></h2>\
            </div>\
            <div id="modalRecordsDiv">\
                <table id="recordsTable">\
                </table>\
            </div>\
            <div id="recordsFooter" class="modal-footer">\
                <h3 class="footer-text"></h3>\
                <div class="select-style">\
                    <select id="selectMenuRecords" onchange="changeCurrentOptionRe01(this.value);">\
                    </select>\
                </div>\
            </div>\
        </div>\
    </div>\
\
    <!-- The Forecast Modal -->\
    <div id="forecastModal" class="modal">\
\
        <!-- Modal content -->\
        <div class="modal-content">\
            <div id="forecastHeader" class="modal-header">\
                <span id="forecastClose" class="close">&#215</span>\
                <h2 id="forecastHeaderText" class="header-text"></h2>\
            </div>\
            <div id="modalForecastDiv">\
            </div>\
            <div id="forecastFooter" class="modal-footer">\
                <h3 class="footer-text"></h3>\
            </div>\
        </div>\
    </div>\
\
    <!-- The Graph Modal -->\
    <div id="myModal" class="modal">\
\
        <!-- Modal content -->\
        <div class="modal-content">\
            <div id="graphHeader" class="modal-header">\
                <span id="graphClose" class="close">&#215</span>\
                <h2 id="graphHeaderText" class="header-text">Modal Header</h2>\
            </div>\
            <div id="ModalCanvasDiv" class="OuterCanvasDiv">\
                <canvas id="ModalCanvas" style="background-color:#FFFFFF">\
                Your browser does not support the canvas element.\
                </canvas>\
            </div>\
            <div id="graphFooter" class="modal-footer">\
                <h3 class="footer-text"></h3>\
                <div class="select-style">\
                    <select id="selectMenu" onchange="graphChange(this);">\
                    </select>\
                </div>\
            </div>\
        </div>\
    </div>\
');