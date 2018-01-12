/*jslint plusplus: true, sloppy: true, indent: 4 */
var forecast = {
    modal: null,
    span: null,
    displayDiv: null,
    modalForecastDiv: null,
    showMoreLink: null,
    storedTextInput: "Waiting for data..."
};

function formatAndDisplayForecastFor01(textInput) {
    //Format Display Strings
    if (textInput === null) {
        textInput = forecast.storedTextInput;
    }
    forecast.storedTextInput = textInput;
    var origionalText = textInput.replace(/_/g, " "),
        editedText = origionalText,
        textArray = origionalText.split(" ");
    
    forecast.modalForecastDiv.innerHTML = origionalText;
    forecast.displayDiv.innerHTML = origionalText;
    
    if (checkOverflow(forecast.displayDiv)) {
        while (checkOverflow(forecast.displayDiv) && textArray.length > 0) {
            //Formats text to fit inside the div, and adds the show more link
            var charRemove = textArray.pop();
            charRemove = charRemove.length;
            editedText = editedText.slice(0, -(charRemove + 1));
            forecast.displayDiv.innerHTML = editedText + '... <a id="showMoreLink", href="#">Show More</a>';
            
            //Sets the link to open the modal
            forecast.showMoreLink = document.getElementById("showMoreLink");
            forecast.showMoreLink.onclick = function () {
                forecast.modal.style.display = "block";
            };
        }
    }
}

function resizeDivFor01() {
    //Dynamic Div Resizing for desktop
	var size = 1,
        modalDivSize = 0.4,
        ratio = 6.19,
        width = 0,
        height = 0,
        stlyeString = null,
        parentDiv = forecast.displayDiv.parentElement;
	
	//Adjusts div to match resized window. Always adjust to the smallest dimention
    width = parentDiv.clientHeight * size * ratio;
    height = parentDiv.clientHeight * size * 0.59; //0.59 to match status
    
    width = width.toString() + "px";
    height = height.toString() + "px";
    stlyeString = "width:" + width.toString() + ";height:" + height.toString();
    
    forecast.displayDiv.setAttribute("style", stlyeString.toString());
    //For browser compadibility
    forecast.displayDiv.style.width = width.toString();
    forecast.displayDiv.style.height = height.toString();
    
	//Adjusts modal div to math resized window. always adjust to the smallest dimention
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
    forecast.modalForecastDiv.setAttribute("style", stlyeString.toString());
    //For browser compadibility
    forecast.modalForecastDiv.style.width = width.toString();
    forecast.modalForecastDiv.style.height = height.toString();
    
    //Check if text is now overflowing, and resize if is
    formatAndDisplayForecastFor01(null);
}

function forecastInitFor01() {
    forecast.displayDiv = document.getElementById("forecastText");
    forecast.modalForecastDiv = document.getElementById("modalForecastDiv");
    
    // Get the modal
    forecast.modal = document.getElementById('forecastModal');
    forecast.modal.style.display = "none";

    // Get the <span> element that closes the modal
    forecast.span = document.getElementById("forecastClose");

    // When the user clicks on <span> (x), close the modal
    forecast.span.onclick = function () {
        forecast.modal.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == forecast.modal) {
            forecast.modal.style.display = "none";
        }
    };
    
    //If on desktop, dynamically resize the div, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeDivFor01();
		}, false);
	}
	
    //Set the div size intially.
    resizeDivFor01();
    
    checkOffLoaded();
}