var numberOfWords = 1;

// Adds another word to the extension
function newWord(){
	var wordTemplate = document.getElementById("word-template").innerHTML;
	var newWordButton = document.getElementById("another-word");
	var newDiv = document.createElement("div");
	var wordTemplateParent = document.getElementById("the-form");

	numberOfWords+=1;		
	newDiv.innerHTML = wordTemplate;
	newDiv.children[0].id = "word-"+numberOfWords;
	
	
	wordTemplateParent.insertBefore(newDiv,newWordButton);
	wordTemplateParent.insertBefore(document.createElement("br"),newWordButton);
}

// Gets the words and their respective colors and then sends that information to the current tab.
// TODO: Deal with colors that are not blue red green or purple in the receiving end of the message.
function highlightSendData(){	
	// JSON string containing word and color values
	var wordsAndColors = getWordsAndColors();
	wordsAndColors['action'] = 'highlight';
	chrome.tabs.executeScript({file:'highlight.js'});	
	
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, wordsAndColors, function(response) {	
		});
	});

	// Insert the css stylesheet to highlight the words.
	chrome.tabs.insertCSS({file:'highlight.css'});	
}

// Gets the names of all current colors and creates and messages an object with color and action
// information,
function removeHighlighting(){
	var message = {};
	message['action'] = 'remove-highlighting';
	
	// Get all of the current colors 
	var colors = [];
	
	// Get the select node and count the number of children
	var selectNode = document.getElementById('word-template').children[1];
	var numColors = selectNode.children.length;
	
	// For each child of the select node add the value of the node to colors
	for(var i=0;i<numColors;i++){
		colors.push(selectNode.children[i].value);
	}
	
	message['colors-array'] = colors;
		
	
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, message, function(response) {	
		});
	});	

	// Insert the css stylesheet to unhighlight the words.
	chrome.tabs.insertCSS({file:'highlight.css'});	
}

// TODO: Deal with all colors that are no blue red green or purple. Add and if statement
// and collect information as rgb string from the html option tag.  Place rgb information 
// into the html page. 
function getWordsAndColors(){
	var wordsAndColors = {};
	var baseColors = ["blue", "red", "green", "purple"];

	// For each word and color add the word and color in an array to a javascript 
	// object as an object value.	
	for(var i=1;i<=numberOfWords;i++){
		var wordAndColor = [];
		var wordId = "word-"+i;
		
		// Push the word and the color value to the javscript array.
		wordAndColor.push(document.getElementById(wordId).value);
		wordAndColor.push(document.getElementById(wordId).parentNode.children[1].value);
		
		wordsAndColors[wordId] = wordAndColor;
	}

	return wordsAndColors;
}

// Toggle the display of the new color section
function toggleRGBInputDisplay(){
	var rgbInputDiv = document.getElementById('rgb-input');
	var currentDisplay = rgbInputDiv.style.display;
	
	if(currentDisplay == "none"){
		rgbInputDiv.style.display = "block";
	}else{
		rgbInputDiv.style.display = "none";
	}

}

function updateColorPreview(){
	var blueValue = document.getElementById("new-blue-value").value;
	var redValue = document.getElementById("new-red-value").value;
	var greenValue = document.getElementById("new-green-value").value;

	if(blueValue && redValue && greenValue){
		var colorPreview = document.getElementById("color-preview");
		colorPreview.style.color = "rgb("+redValue+","+greenValue+","+blueValue+")";
	}	
}

/*
* This function gets the name of the new color and the rgb values and then updates all the 
* drop down menus with the name of the new color.
*/
function createNewColor(){
	var newColorName = document.getElementById('new-color-name').value;
	var redValue = document.getElementById('new-red-value').value;
	var greenValue = document.getElementById('new-green-value').value;
	var blueValue = document.getElementById('new-blue-value').value;
	
	// Reset all of the values and the color of the color preview
	document.getElementById('new-color-name').value = "";
	document.getElementById('new-red-value').value = "";
	document.getElementById('new-blue-value').value = "";
	document.getElementById('new-green-value').value = "";
	document.getElementById('color-preview').style.color = "black";
	
	var rgbString = "rgba("+redValue+","+greenValue+","+blueValue+",0.5)";

	var allSelectTags = document.getElementsByTagName("select");
	
	// For each select tag append the name of the new color as an option
	for(var i=0;i<allSelectTags.length;i++){
		var newOption = document.createElement("option");
		var optionText = document.createTextNode(newColorName);
		newOption.setAttribute("value",rgbString);
		newOption.appendChild(optionText);
		
		allSelectTags[i].appendChild(newOption);
	}	
	toggleRGBInputDisplay();
}

// Event listener for adding a new word and color choice to the extension
document.getElementById('another-word').addEventListener('click',newWord);

// Event listener for sending a message to the content script to be injected
document.getElementById('submit').addEventListener('click',highlightSendData);

// Event listener for removing highlighting
document.getElementById('remove-highlighting').addEventListener('click',removeHighlighting);

// Event listener for unhiding new color inputs
document.getElementById('another-color').addEventListener('click',toggleRGBInputDisplay);

// Event listener for creating a new color
document.getElementById('create-new-color').addEventListener('click',createNewColor);

// Event listener for closing the new color popup
document.getElementById('exit-new-color').addEventListener('click', toggleRGBInputDisplay);

// Event listeners for the red, green, and blue color value inputs.
document.getElementById('new-red-value').addEventListener("input", updateColorPreview);
document.getElementById('new-green-value').addEventListener("input", updateColorPreview);
document.getElementById('new-blue-value').addEventListener("input", updateColorPreview);

