var MSLAppTwitchWatch = (function() {
	var container;
	var player;
	var videoID;
	var isLoaded;
	
	var $overlay;
	var $overlayBox;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#7F5ACB" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppTwitchWatch").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppTwitchWatch").css( "display", "none" );
	}
	
	function checkFlashAvailability() {
		return navigator.plugins != null && navigator.plugins.length > 0 && "undefined" != typeof navigator.plugins["Shockwave Flash"];
	}
	
	function init() {
		player = null;
		isLoaded = false;
		videoID = null;
		container = $("#twitchplayer");
		
		$overlay = $("section#MSLAppTwitchWatch > main > div.fullscreenOverlay");
		$overlayBox = $overlay.children().first();
		
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
		
		isLoaded = true;
		setBackground();
		
		preload( data );
		
		var channel = "undefined" != typeof data.videoID ? data.videoID : "";
		
		//if( checkFlashAvailability() ) {
			player = $(document.createElement( "iframe" ));
			player.attr( "src", "https://player.twitch.tv/?channel=" + channel + "&parent=" + MSLGlobals.Domain );
			player.css( "width", "1024px" );
			player.css( "height", "576px" );
			player.css( "border", "none" );
			
			container.empty();
			container.append( player );
		/*}
		else {
			container.empty();
			container.append( $("#MessageNoFlash").clone() );
		}*/
		
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
			player.remove();
			container.empty();
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
		onMouseMove: onMouseMove
	};
})();

MSLAppManager.register( "twitchWatch", MSLAppTwitchWatch, true );