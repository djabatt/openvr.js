var TextEditor = (function() {
	var cssEditor = document.getElementById("css");
	var cssSubmitButton = document.getElementById("submit-css");
	var renderCB = {};

	this.prepareSource = function() {
		var css = cssEditor.value;
		css = '<style id="ovr-style" type="vrCss">' + css + '</style>';
		return css;
	};

	this.render = function() {
		var source = prepareSource();
		var head = document.getElementsByTagName("head")[0],
				oldStyle = document.getElementById("ovr-style");

		if ( oldStyle !== null ) {
			oldStyle.innerHTML = cssEditor.value;
		} else {
			head.innerHTML = head.innerHTML + source;
		}
		renderCB();
	};

	this.setCallback = function( renderCallback ) {
		renderCB = renderCallback;
	}

	cssSubmitButton.addEventListener( 'click', function() {
		render();
	}, false);

	return this;
})();

$(document).ready( function() {
	var cssEditor = document.getElementById("css");
	var initialStyle = document.getElementById("ovr-style");
	if ( initialStyle !== null ) {
		cssEditor.value = initialStyle.innerHTML;
	}

	$('.slideout-toggle').on( 'click', function( event ) {
		event.preventDefault();
		var slideout = $('.slideout-editor');
		var slideoutWidth = slideout.width();

		slideout.toggleClass("open");
		$('.opener').toggleClass("hide");
		if ( slideout.hasClass("open") ) {
			slideout.animate({
				left: "0px"
			}, 250);
		} else {
			slideout.animate({
				left: -slideoutWidth
			}, 250);
		}
	});

});