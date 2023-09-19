var MSLAppAdultWatch = (function() {
	var container;
	var player;
	var videoID;
	var isLoaded;
	
	var $overlay;
	var $overlayBox;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#000000" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "color" );
		//$("#underlay > #videoBackground").css( "opacity", 1 );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppAdultWatch").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppAdultWatch").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		videoID = null;
		//container = $("#adultplayer");
		
		$overlay = $("section#MSLAppAdultWatch > main > div.fullscreenOverlay");
		$overlayBox = $overlay.children().first();
		
		player = new MSLVideoPlayer( $("#plyr-adult-container"), {mslSync: true, controlDefinition: '{ "controls": ["play", "progress", "current-time", "duration", "mute", "volume"] }'} );
		
		$(window).blur( function() {
			$overlay.css( "opacity", 0.0 );
		});
		
		$(window).on( "mouseout", function() {
			$overlay.css( "opacity", 0.0 );
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.videoID )
			videoID = data.videoID;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		if( reload ) {
			// ..
		}
		
		isLoaded = true;
		setBackground();
		
		preload( data );
		
		if( player ) {
			player.destroy();
		}
		
		var videoID = "undefined" != typeof data.videoID ? data.videoID : "";
		
		$.ajax({
			method: "GET",
			url: "json/adultFetchSource.php?id=" + videoID,
			cache: false
		})
		.done( function( data ) {
			var source = JSON.parse( data );
			
			if( source.length > 0 ) {
				source = source[0];
			}
			
			player.init();
			player.load( source );
		});
		
		showApp();
	}
	
	function open() {
		if( !isLoaded )
			load();
		
		setBackground();
		showApp();
	}
	
	function close() {
		if( player ) {
			player.destroy();
		}
		
		hideApp();
	}
	
	function onMouseMove( x, y ) {
		var centerX = 512; // 1024 / 2
		var centerY = 288; // 576 / 2
		var fadeDist = 40;
		
		var distX = Math.abs( x - centerX ) - ($overlayBox.width() / 2);
		var distY = Math.abs( y - centerY ) - ($overlayBox.height() / 2);
		
		if( distX <= 0 && distY <= 0 ) {
			$overlay.css( "opacity", 1.0 );
		}
		else {
			distX = 1.0 - (distX.clamp( 0, fadeDist ) / fadeDist);
			distY = 1.0 - (distY.clamp( 0, fadeDist ) / fadeDist);
			
			$overlay.css( "opacity", Math.min( distX, distY ) );
		}
	}
	
	return {
		init: init,
		preload: preload,
		load: load,
		open: open,
		close: close,
		onMouseMove: onMouseMove,
		
		passedThroughData: function( data ) {
			player.fromMslSync( data );
		}
	};
})();

MSLAppManager.register( "adultWatch", MSLAppAdultWatch, true );