var MSLAppHome = (function() {
	var menu;
	var tipscroller;
	var isLoaded;
	var backgroundColour = "#00e4ff";
	var backgroundBlend = "overlay";
	var customBackground = "";
	
	/*
	Sets the colour overlay for the background for next time setBackground is called
	@param1 string	Hexadecimal RGB value prefixed by a hashtag
	@return void
	*/
	function setBackgroundColour( colour ) {
		backgroundColour = colour;
	}
	
	/*
	Sets the blend mode for the background for next time setBackground is called
	@param1 string	A valid CSS3 blend mode
	@return void
	*/
	function setBackgroundBlend( blend ) {
		backgroundBlend = blend;
	}
	
	/*
	Sets the custom background image URL for the next time setCustomBackground is called
	@param1	string	URL to the externam background image or empty string
	@return	string	Sanitized URL
	*/
	function setCustomBackground( url ) {
		customBackground = url !== null && url.length >= 16 ? url : "";
	}
	
	/*
	Applies the background colour and blend mode to the video background overlay DOM element
	@param1 void
	@return void
	*/
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", backgroundColour );
		$("#underlay > #videoBackground").css( "mix-blend-mode", backgroundBlend );
		
		if( customBackground.length >= 16 ) {
			$("#underlay > #videoBackground").css( "backgroundImage", "url('" + customBackground + "')" );
		}
		else {
			$("#underlay > #videoBackground").css( "backgroundImage", "" );
		}
		
		$("#underlay > #videoBackground").css( "opacity", 1 );
		$("#underlay > video").css( "filter", "brightness(1.0)" );
		$("#underlay > video").css( "-webkit-filter", "brightness(1.0)" );
	}
	
	/*
	Shows the section belonging to this app
	@param1 void
	@return void
	*/
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppHome").fadeIn();
		
		MSLAppManager.getHandler( "radio" ).unload();
	}
	
	/*
	Hides the section belonging to this app
	@param1 void
	@return void
	*/
	function hideApp() {
		$("section#MSLAppHome").css( "display", "none" );
	}
	
	/*
	Initialises the app. It's usually called from within an onload event
	@param1 void
	@return void
	*/
	function init() {
		isLoaded = false;
		
		$("#homeMainMenuBars > div:not(.disabled)").on( "mouseenter", function( evt ) {
			MSLGlobals.Audio.play( "hover" );
		});
		
		$("#homeMainMenuTiles > div.clickable").on( "mouseenter", function( evt ) {
			MSLGlobals.Audio.play( "hover" );
		});
		
		$("#homeMainMenuTiles > div").on( "mouseenter", function( evt ) {
			var video = $(this).children( "video" ).get(0);
			
			if( "undefined" != typeof video )
				video.play();
		});
		
		$("#homeMainMenuTiles > div").on( "mouseleave", function( evt ) {
			var video = $(this).children( "video" ).get(0);
			
			if( "undefined" != typeof video )
				video.pause();
		});
	}
	
	/*
	Apps can be loaded with data, often originating from the Sync server to sync newcomers
	@param1 object	Ambigious data object or NULL
	@return void
	*/
	function preload( data ) {
		// if( "undefined" != typeof data.locked ) {
			// if( data.locked ) {
				// HMM.Lock( true );
			// }
		// }
	}
	
	/*
	Loads or reloads the app to its default state
	@param1 object	Ambiguous data object or NULL
	@param2 boolean	Whether to reload the app; defaults to FALSE
	@return void
	*/
	function load( data, reload ) {
		isLoaded = true;
		
		setBackground();
		showApp();
	}
	
	/*
	Opens the app without going back to its default state
	@param1 void
	@return void
	*/
	function open() {
		if( !isLoaded )
			load();
		
		setBackground();
		showApp();
	}
	
	/*
	Closes the app
	@param1 void
	@return void
	*/
	function close() {
		hideApp();
	}
	
	// Public function index
	return {
		init: init,
		preload: preload,
		load: load,
		open: open,
		close: close,
		setBackgroundColour: setBackgroundColour,
		setBackgroundBlend: setBackgroundBlend,
		setCustomBackground: setCustomBackground,
	};
})();

MSLAppManager.register( null, MSLAppHome );