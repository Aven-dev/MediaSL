var MSLAppHHavenWatch = (function() {
	var player;
	var playerContainer;
	var plyr;
	var ID;
	var isLoaded;
	
	var $overlay;
	var $overlayBox;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#000000" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "color" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppHHavenWatch").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppHHavenWatch").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		ID = null;
		
		playerContainer = document.getElementById( "plyr-hanime-container" );//$("#plyr-hanime");
		player = new MSLVideoPlayer( $("#plyr-hanime-container"), {mslSync: true, antiCors: true, controlDefinition: '{ "controls": ["play", "progress", "current-time", "duration", "mute", "volume"] }'} );
		plyr = null;
		
		$overlay = $("section#MSLAppHHavenWatch > main > div.fullscreenOverlay");
		$overlayBox = $overlay.children().first();
		
		$(window).blur( function() {
			$overlay.css( "opacity", 0.0 );
		});
		
		$(window).on( "mouseout", function() {
			$overlay.css( "opacity", 0.0 );
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.ID )
			ID = data.ID;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		if( reload ) {
			// ..
		}
		
		ID = data.ID;
		isLoaded = true;
		setBackground();
		
		if( player ) {
			player.destroy();
		}
		
		$.ajax({
			method: "GET",
			url: "json/hhavenSource.php?id=" + encodeURIComponent( ID )
		})
		.done( function( data, status ) {
			var data = JSON.parse( data );
			
			if( data.status == 200 && "object" == typeof data.message ) {
				player.init();
				player.poster = data.message.poster;
				player.load( data.message.source480p ?? data.message.source720p ?? data.message.source1080p ?? data.message.source360p );
			}
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

MSLAppManager.register( "hhavenWatch", MSLAppHHavenWatch, true );