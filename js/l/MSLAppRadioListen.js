var MSLAppRadioListen = (function() {
	var player;
	var ID;
	var isLoaded;
	var songUpdateTicker;
	var DirectStream;
	
	var videoTag;
	var sourceTag;
	var colourFilter;
	var originalBodyBackground;
	var originalVideoSource;
	var originalVideoPoster;
	
	var uiHideTimer = null;
	
	function setBackground() {
		// $("#underlay > #videoBackground").css( "backgroundColor", "#0168b3" );
		// $("#underlay > #videoBackground").css( "opacity", 1 );
		videoTag = $("#underlay > video");
		sourceTag = $("#underlay > video > source");
		colourFilter = $("#underlay > div#videoBackground");
		
		originalBodyBackground = $("body").css( "background-image" );
		originalVideoSource = sourceTag.attr( "src" );
		originalVideoPoster = videoTag.attr( "poster" );
		
		$("body").css( "background-image", "url('../images/bg-wavestream.png')" );
		videoTag.attr( "poster", "../images/bg-wavestream.png" );
		sourceTag.attr( "src", "../images/bg-wavestream.webm" );
		
		videoTag[0].load();
		videoTag[0].play();
		
		colourFilter.hide();
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppRadioListen").fadeIn();
		MSLAppRadioListen.displayUI( true );
	}
	
	function hideApp() {
		$("section#MSLAppRadioListen").css( "display", "none" );
		
		colourFilter.show();
		
		$("body").css( "background-image", originalBodyBackground );
		videoTag.attr( "poster", originalVideoPoster );
		sourceTag.attr( "src", originalVideoSource );
		
		videoTag[0].load();
		videoTag[0].play();
	}
	
	function init() {
		isLoaded = false;
		ID = null;
		DirectStream = null;
		
		player = $("#MSLAppRadioListen #radioplayer");
		
		uiHideTimer = setTimeout( function() {
			MSLAppRadioListen.displayUI( false );
		}, 3000 );
		
		$("body").on( "mousemove", function( evt ) {
			MSLAppRadioListen.displayUI( true );
			
			clearTimeout( uiHideTimer );
			
			uiHideTimer = setTimeout( function() {
				MSLAppRadioListen.displayUI( false );
			}, 3000 );
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.ID )
			ID = data.ID;
		
		if( "undefined" != typeof data.stream )
			DirectStream = data.stream;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		if( reload ) {
			// ..
		}
		
		ID = "undefined" != typeof data.ID ? data.ID : null;
		DirectStream = "undefined" != typeof data.stream ? data.stream : null;
		
		isLoaded = true;
		setBackground();
		
		const initPlayer = function( info ) {
			player.jPlayer( "destroy" );
			
			let initialVolume = Cookies.get( "appRadioVolume" );
			
			if( initialVolume === undefined ) {
				initialVolume = 0.8;
			}
			
			var minLog = Math.log( 1 );
			var maxLog = Math.log( 100 );
			var scale = (maxLog - minLog) / 99;
			
			player.jPlayer({
				ready: function () {
					$(this).jPlayer("setMedia", {
					title: info.Name,
					mp3: info.URL
					}).jPlayer("play");
				},
				swfPath: "js",
				supplied: "mp3",
				solution: MSLGlobals.HasFlash ? "flash" : "html",
				volume: Math.exp( minLog + scale * (initialVolume - 1) ) / 100
			});
			
			$("#MSLAppRadioListen .slider").slider({
				range: "min",
				value: initialVolume,
				min: 0,
				max: 100,
				slide: function( evt, ui ) {
					var volume = 0;
					
					if( ui.value ) {
						volume = Math.exp( minLog + scale * (ui.value - 1) );
					}
					
					player.jPlayer( "volume", volume / 100 );
					Cookies.set( "appRadioVolume", ui.value, { expires: 90 } );
				}
			});
			
			// Set station info
			$("#MSLAppRadioListen #station").text( info.Name );
			MSLAppRadioListen.applySongInfo( info.Artist, info.Album, info.Song, info.AlbumArt );
			
			songUpdateTicker = setInterval( MSLAppRadioListen.getSongInfo, 15000 );
		};
		
		//if( navigator.plugins != null && navigator.plugins.length > 0 && "undefined" != typeof navigator.plugins["Shockwave Flash"] ) {
		if( true ) {
			if( ID ) {
				$.ajax({
					method: "GET",
					url: "json/radioStationInfo.php?id=" + encodeURIComponent( ID ),
					cache: false
				})
				.done( function( data, status ) {
					if( status != "success" )
						data = "[]";
					
					initPlayer( JSON.parse( data ) );
				});
			}
			else if( DirectStream ) {
				initPlayer({
					Name: "Custom Radio Stream",
					URL: DirectStream,
					Artist: "",
					Album: "",
					Song: "",
					AlbumArt: null
				});
			}
		}
		else {
			$("#MSLAppRadioListen > main > div.radioplayer").remove();
			$("#MSLAppRadioListen > main > div.fullpage").remove();
			$("#MSLAppRadioListen > footer").remove();
			$("#MSLAppRadioListen").append( $("#MessageNoFlash").clone() );
		}
		
		showApp();
	}
	
	function open() {
		if( !isLoaded )
			load();
		
		setBackground();
		showApp();
	}
	
	function close() {
		if( player )
			player.jPlayer( "destroy" );
		
		if( songUpdateTicker )
			clearInterval( songUpdateTicker );
		
		hideApp();
	}
	
	return {
		init: init,
		preload: preload,
		load: load,
		open: open,
		close: close,
		
		applySongInfo: function( artist, album, song, art ) {
			artist = artist != null && "undefined" != typeof artist && artist.length ? artist : "";
			album = album != null && "undefined" != typeof album && album.length ? album : "";
			song = song != null && "undefined" != typeof song && song.length ? song : "";
			art = art != null && "undefined" != typeof art && song.length ? art : null;
			
			if( song.length >= 32 ) {
				song = song.substr( 0, 31 ) + "...";
			}
			
			$("#MSLAppRadioListen #artist").text( artist );
			$("#MSLAppRadioListen #album").text( album );
			$("#MSLAppRadioListen #song").text( song );
			
			if( art ) {
				$("#MSLAppRadioListen #art").css( "background-image", "url('" + art + "')" );
			}
			else {
				$("#MSLAppRadioListen #art").css( "background-image", "url('../images/apps/altai/radio_missing.png')" );
			}
		},
		
		getSongInfo: function() {
			$.ajax({
				method: "GET",
				url: "json/radioStationInfo.php?id=" + encodeURIComponent( ID ),
				cache: false
			})
			.done( function( data, status ) {
				if( status != "success" )
					data = "[]";
				
				var info = JSON.parse( data );
				
				MSLAppRadioListen.applySongInfo( info.Artist, info.Album, info.Song, info.AlbumArt );
			});
		},
		
		setVolume: function( scalar ) {
			player.jPlayer( "volume", scalar );
			$("#MSLAppRadioListen .slider").slider({value: scalar * 100 });
		},
		
		displayUI: function( bool ) {
			if( bool ) {
				$("#MSLAppRadioListen .uiOnMouseActivity").finish().css( "display", "block" );
			}
			else {
				$("#MSLAppRadioListen .uiOnMouseActivity").fadeOut( 800 );
			}
		},
	};
})();

MSLAppManager.register( "radioListen", MSLAppRadioListen, true );