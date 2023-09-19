var MSLAppKaraokeWatch = (function() {
	var player;
	var videoID;
	var isLoaded;
	var url;
	
	var $overlay;
	var $overlayBox;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#ca517c" );
		//$("#underlay > #videoBackground").css( "opacity", 1 );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppKaraokeWatch").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppKaraokeWatch").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		url = null;
		
		player = new MSLVideoPlayer( $("#plyr-karaoke-container"), {mslSync: true, controlDefinition: '{ "controls": ["play", "current-time", "progress", "mute", "volume"] }'} );
		
		$overlay = $("section#MSLAppKaraokeWatch > main > div.fullscreenOverlay");
		$overlayBox = $overlay.children().first();
		
		$(window).blur( function() {
			$overlay.css( "opacity", 0.0 );
		});
		
		$(window).on( "mouseout", function() {
			$overlay.css( "opacity", 0.0 );
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.url )
			url = data.url;
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
		
		player.init();
		player.load( "https://gcore.msl.qxy.io/videos/apps/karaoke/" + url + ".webm" );
		
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

MSLAppManager.register( "karaokeWatch", MSLAppKaraokeWatch, true );