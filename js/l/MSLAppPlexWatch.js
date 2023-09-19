var MSLAppPlexWatch = (function() {
	var player;
	
	var mediaID;
	var season;
	var episode;
	
	var isLoaded;
	var fullscreenOverlayTimer;
	
	var $overlay;
	var $overlayBox;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#000000" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppPlexWatch").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppPlexWatch").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		player = new MSLVideoPlayer( $("#plexplayer"), {mslSync: true, controlDefinition: '{ "controls": ["play", "progress", "current-time", "duration", "mute", "volume"] }'} );
		
		mediaID = null;
		season = null;
		episode = null;
		
		$overlay = $("section#MSLAppPlexWatch > main > div.fullscreenOverlay");
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
			mediaID = data.ID;
		
		if( "undefined" != typeof data.s )
			season = data.s;
		
		if( "undefined" != typeof data.e )
			episode = data.e;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		mediaID = data.ID ?? null;
		season = data.s ?? null;
		episode = data.e ?? null;
		
		if( reload ) {
			// ..
		}
		
		isLoaded = true;
		setBackground();
		showApp();
		
		if( player ) {
			player.destroy();
		}
		
		let url = "json/plexFetchSource.php?id=" + mediaID;
		
		if( season && episode ) {
			url += "&s=" + season + "&e=" + episode;
		}
		
		$.ajax({
			method: "GET",
			url: url,
			cache: true
		})
		.done( function( data ) {
			data = JSON.parse( data );
			
			if( !data || data.status != 200 ) {
				//TODO: Show error if no data present already.
				return;
			}
			
			let url = null;
			
			if( data.message.HlsID && data.message.HlsID.length > 0 ) {
				url = "https://vod.provider.plex.tv/library/parts/" + data.message.HlsID + ".m3u8?includeAllStreams=1&X-Plex-Token=" + MSLGlobals.TokenB;
			}
			/*else if( data.message.DashID && data.message.DashID.length > 0 ) {
				url = "https://vod.provider.plex.tv/library/parts/" + data.message.DashID + ".mpd?includeAllStreams=1&X-Plex-Token=YPq694BwGZ3YWrVmFxqG";
			}*/
			
			if( !url ) {
				//TODO: Show error
				return;
			}
			
			player.init();
			player.load( url );
		});
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
	
	function back() {
		var handler = MSLAppManager.getHandler( "plexIndex" );
		
		if( handler ) {
			handler.setChildAppData({
				mediaID: mediaID,
				season: season
			});
		}
		
		MSLAppManager.open( "plexIndex" );
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
		back: back,
		
		onMouseMove: onMouseMove,
		
		passedThroughData: function( data ) {
			player.fromMslSync( data );
		}
	};
})();

MSLAppManager.register( "plexWatch", MSLAppPlexWatch, true );