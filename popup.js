var numberOfWords = 1;

/*
*------------------------------------------------
* Functions for toggling and changing the display
*------------------------------------------------
*/

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

// Toggle the display of the manage colors section and add all current custom colors to this section.
function toggleManageColorDisplay(){
	var manageColorSection = document.getElementById('manage-colors-display');
	var display = manageColorSection.style.display;

	// Toggle the display to none if it is block. Otherwise set the display to
	// block and put all current custom colors into buttons in the manage color section.
	if(display=="block"){
		manageColorSection.style.display="none"
		while(manageColorSection.hasChildNodes()){
			manageColorSection.removeChild(manageColorSection.lastChild);
		}
	}else{
		manageColorSection.style.display = "block";
		// Get all custom colors from storage.
		chrome.storage.sync.get(null,function(items){
					
			var isEmpty = true;
			for(var key in items){
				isEmpty = false;				
				var removeButton = document.createElement("button");

				removeButton.innerHTML = 'Remove: '+key;
				removeButton.value=key;
				removeButton.style.color = items[key];
				removeButton.type="button";
				removeButton.style.marginTop="5px";
				removeButton.style.marginLeft="10px";
				removeButton.className="remove-word";

				manageColorSection.appendChild(removeButton);
				manageColorSection.appendChild(document.createElement("br"));
			}
			if(isEmpty){
				manageColorSection.innerHTML = "<div style=\"margin-left:10px;margin-top:5px\"> <b>You have no custom colors!</b></div>";
			}
		});
	}
}

// Removes a given custom color from storage.
function removeColorFromStorage(color){
	chrome.storage.sync.remove(color);
}

// Removes a given custom color option node from each select node
function removeColorFromAllSelectNodes(color){
	var optionNodes = document.querySelectorAll('option#'+color)
	console.log(optionNodes[0])
	console.log(optionNodes[0].parentNode)
	console.log(color)
	for(var i=0;i<optionNodes.length;i++){
		optionNodes[i].parentNode.removeChild(optionNodes[i])
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
		newOption.setAttribute("id",newColorName);
		newOption.appendChild(optionText);
		
		allSelectTags[i].appendChild(newOption);
	}	
	toggleRGBInputDisplay();

	var colorNameValueObject = {};
	colorNameValueObject[newColorName] = rgbString;	
	chrome.storage.sync.set(colorNameValueObject);
}

// This updates the color preview when values have been enetered for blue, green, and red
function updateColorPreview(){
	var blueValue = document.getElementById("new-blue-value").value;
	var redValue = document.getElementById("new-red-value").value;
	var greenValue = document.getElementById("new-green-value").value;

	if(blueValue && redValue && greenValue){
		var colorPreview = document.getElementById("color-preview");
		colorPreview.style.color = "rgb("+redValue+","+greenValue+","+blueValue+")";
	}	
}

// Adds another word to the extension
function newWord(){
	numberOfWords+=1;		

	var wordTemplate = document.getElementById("word-template").innerHTML;
	var newWordButton = document.getElementById("another-word");
	var newDiv = document.createElement("div");
	var removeButton = document.createElement("button");
	var wordTemplateParent = document.getElementById("the-form");
	
	// TODO: Fix this class name so that it doesn't conflict with the remove-word for removing
	// from memory
	removeButton.className ="remove-word";
	removeButton.innerHTML = "Remove";
	removeButton.setAttribute('type','button');
	removeButton.addEventListener('click',function(e){
		var remButton = e.target;
		remButton.parentNode.parentNode.removeChild(remButton.parentNode);		
	});

	newDiv.innerHTML = wordTemplate;
	newDiv.children[0].id = "word-"+numberOfWords;
	newDiv.style.marginTop = "10px";	
	newDiv.style.marginBottom = "10px";
	newDiv.appendChild(removeButton);

	wordTemplateParent.insertBefore(newDiv,newWordButton);
}

// This function is called by the event listener for the remove word button.
// It removes the word from the DOM.
function removeNode(nodeToRemove){
	nodeToRemove.style.display="none";
	nodeToRemove.parentNode.removeChild(nodeToRemove);
}

// Adds all current custom colors in chrome storage to the select element in word-template
function addCustomColorsToSelect(){
	var wordTemplate = document.getElementById('word-template');
	var selectNode = wordTemplate.children[1];
	
	// Add each custom color to selectNode as an option node.
	chrome.storage.sync.get(null,function(colors){
		
		for(var color in colors){
			var option = document.createElement("option");
			option.innerHTML = color;
			option.value = colors[color];
			option.id = color;
			selectNode.appendChild(option);
		} 
	});
}

/*
*-----------------------------------------------------------
* These functions control content script and css injection
*-----------------------------------------------------------
*/

// Gets the words and their respective colors and then sends that information to the current tab.
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

// This function gets the words and colors currently selected by the user.
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

/*
*-------------------------------------------------------------------
* Event Listeners
*-------------------------------------------------------------------
*/

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

// Event listeners for managing the custom colors
document.getElementById('manage-colors').addEventListener('click',toggleManageColorDisplay);

// Event listener for the remove button for the words
document.getElementById('manage-colors-display').addEventListener('click',function(e){
	var targetNode = e.target;
	if(targetNode.matches('.remove-word')){
		var color = targetNode.value
		// Pass the node to be removed to the removeWordHandler. 
		removeNode(targetNode);
		//TODO: REMOVE THE COLOR FROM THE SELECT NODE.
		removeColorFromAllSelectNodes(color);
		removeColorFromStorage(targetNode.value);
	}
});
window.addEventListener('load', addCustomColorsToSelect);
