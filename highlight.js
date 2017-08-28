// Event listener for message passing.
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		var baseColors = ["blue","green","red","purple"];

		/*
		 * If the action to be performed is highlighting then loop through each word and color in the request
		 * and wrap the word in a span with the appropriate class name.  If the color is a custom color then 
		 * the style will be added inline as the css stylesheet only includes rules for the base or standard
		 * colors.
		 */
		if(request.action == 'highlight'){
			for (var key in request) {
  				if (request.hasOwnProperty(key) && key!='action') {
					var word = request[key][0];
					var color = request[key][1];
					var newClass = "highlight-extension-"+color;			 
					
					findAndReplaceDOMText(document.body,{find:word,wrap:'span',wrapClass:newClass});

					if(!(baseColors.includes(color))){
						var customColorWords = document.getElementsByClassName(newClass);
						
						// For each custom colored word set the background color.
						for(var i=0;i<customColorWords.length;i++){
							customColorWords[i].style.backgroundColor=color;
						}
					}
				}
			}
		}// TODO: Figure out how to remove inline style for a custom color 
		else if(request.action == 'remove-highlighting'){
			var colors = request['colors-array'];
			console.log('The colors to be removed are: '+colors);
			var numColors = colors.length;

			// For each color, get all elements with class name and remove the name
			for(var i=0;i<numColors;i++){
				var color = colors[i];
				var className = 'highlight-extension-'+colors[i];
				var coloredWords = document.getElementsByClassName(className);
			
				while(coloredWords.length>0){
					coloredWords[0].classList.remove(className);

					// Remove style attribute from custom colors.
					if(!(baseColors.includes(color))){
						coloredWords[0].removeAttribute('style');			
					}
				}	
			}
		}
	}
);
