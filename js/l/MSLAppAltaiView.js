class SongInfo
{
	constructor( $ctx, raw ) {
		let pos = raw.indexOf( ".", -4 );
		
		this.$ctx = $ctx;
		this.ticker = null;
		this.artist = null;
		this.song = null;
		this.dj = null;
		this.infoCount = 1;
		
		if( pos != -1 ) {
			this.fullName = raw.substr( 0, pos );
			this.ext = raw.substr( pos, 1 );
		}
		else {
			this.fullName = raw;
			this.ext = null;
		}
		
		pos = this.fullName.indexOf( " - " );
		
		if( pos != -1 ) {
			this.artist = this.fullName.substr( 0, pos );
			this.song = this.fullName.substr( pos + 3 );
			this.infoCount = 2;
		}
		else {
			pos = this.fullName.indexOf( "-" );
			
			if( pos != -1 ) {
				this.artist = this.fullName.substr( 0, pos );
				this.song = this.fullName.substr( pos + 1 );
				this.infoCount = 2;
			}
		}
		
		if( this.song != null ) {
			pos = this.song.indexOf( "(" );
			
			if( pos != -1 ) {
				let posEnd = this.song.indexOf( ")", pos );
				
				if( posEnd != -1 ) {
					this.dj = this.song.substr( pos + 1, posEnd - (pos + 1) );
					this.song = this.song.substr( 0, pos );
					this.infoCount = 3;
				}
			}
		}
	}
	
	Render() {
		const l1 = $(document.createElement( "p" ));
		const l2 = $(document.createElement( "p" ));
		const l3 = $(document.createElement( "p" ));
		
		switch( this.infoCount ) {
		case 1:
			l1.addClass( "fullname" );
			l1.text( this.fullName );
			this.$ctx.append( l1 );
			break;
			
		case 2:
			l1.addClass( "artist" );
			l2.addClass( "song" );
			l1.text( this.artist );
			l2.text( this.song );
			this.$ctx.append( l1 );
			this.$ctx.append( l2 );
			break;
			
		case 3:
			l1.addClass( "artist" );
			l2.addClass( "song" );
			l3.addClass( "dj" );
			l1.text( this.artist );
			l2.text( this.song );
			l3.text( this.dj );
			this.$ctx.append( l1 );
			this.$ctx.append( l2 );
			this.$ctx.append( l3 );
			break;
		}
	}
}

var MSLAppAltaiView = (function() {
	var isLoaded = false;
	var albumID = null;
	var index = 0;
	var autoplay = false;
	var images = new Array;
	var currentImage = 0;
	var $altaiPlayer = null;
	var autoPlayer = null;
	var plyr = null;
	
	var videoTag;
	var originalBlendMode;
	
	var $overlay;
	var $overlayBox;
	
	var videoTag;
	var sourceTag;
	var colourFilter;
	var originalBodyBackground;
	var originalVideoSource;
	var originalVideoPoster;
	
	function fetchAlbum() {
		images = new Array;
		
		$.ajax({
			method: "GET",
			url: "json/altaiShowAlbum.php?uuid=" + MSLGlobals.uuid + "&album=" + albumID,
			cache: true
		})
		.done( function( data ) {
			data = JSON.parse( data );
			
			if( data.status == 200 ) {
				for( var i = 0; i < data.data.pictureCount; i++ ) {
					images.push( {url: data.data.pictures[i].source, mimeType: data.data.pictures[i].mimeType, name: data.data.pictures[i].name} );
				}
			}
			
			MSLAppAltaiView.loadImage( index, false );
		});
	}
	
	function getValidImageIndex( index ) {
		return index < 0 ? (images.length - 2) - index : index % images.length;
	}
	
	function preloadImage( image ) {
		image = getValidImageIndex( image );
		
		if( images[image].mimeType.indexOf( "video" ) != -1 || images[image].mimeType.indexOf( "audio" ) != -1 ) {
			// Don't preload video or audio.
			return;
		}
		
		var img = new Image();
		img.src = images[image].url;
	}
	
	function showError( title, message ) {
		const $error = $("#AltaiError");
		const $player = $("#AltaiPlayer");
		
		$error.find( "h1" ).first().text( title );
		$error.find( "p" ).first().text( message );
		
		$player.hide( 0 );
		$error.show( 1 );
	}
	
	function hideError() {
		$("#AltaiError").hide();
		$("#AltaiPlayer").show();
	}
	
	function loadImage( image, toSync, fadeTime ) {
		$("#altaiSongInfo").stop( true, true ).remove();
		hideError();
		
		var direction = image < currentImage ? -1 : image > currentImage ? 1 : 0;
		
		toSync = "undefined" != typeof toSync ? toSync : true;
		fadeTime = "undefined" != typeof fadeTime ? fadeTime : 300;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		image = getValidImageIndex( image );
		
		currentImage = image;
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_ALTAI_VIEW,
				value: image
			});
		}

		if( plyr ) {
			plyr.destroy();
			plyr = null;
		}
		
		var $img = $(document.createElement( "div" ));
		$altaiPlayer.append( $img );
		
		var isVideo = images[image].mimeType.indexOf( "video" ) != -1;
		var isAudio = images[image].mimeType.indexOf( "audio" ) != -1;
		var isImage = !isVideo && !isAudio;
		
		if( images[image].mimeType == "video/avi" ) {
			showError( "VIDEO FORMAT NOT SUPPORTED", "This file type (.avi) is not supported by SecondLife media. Compatible options are mp4, webm and ogg." );
			return;
		}
		else if( images[image].mimeType == "video/x-ms-asf" ) {
			showError( "VIDEO FORMAT NOT SUPPORTED", "This file type (.wmv) is not supported by SecondLife media. Compatible options are mp4, webm and ogg." );
			return;
		}
		else if( images[image].mimeType == "audio/x-ms-wma" ) {
			showError( "AUDIO FORMAT NOT SUPPORTED", "This file type (.wma) is not supported by SecondLife media. Compatible options are mp3, ogg and webm." );
			return;
		}
		
		if( isVideo || isAudio ) {
			videoTag[0].play();
			
			const p = document.createElement( "div" );
			p.id = "videoPlayerAltai";
			p.className = "MSLVideoPlayer";

			$img.append( p );
			
			var provided = "m4v";
			var solution = {m4v: images[image].url};
			let type = "video";
			let mimeType = images[image].mimeType;
			
			switch( images[image].mimeType ) {
			case "video/mpeg":
				type = "video";
				provided = "m4v";
				solution = {m4v: images[image].url};
				mimeType = "video/mp4";
				break;
			case "video/webm":
				provided = "webmv";
				solution = {webmv: images[image].url};
				break;
			case "video/ogg":
				provided = "ogv";
				solution = {ogv: images[image].url};
				break;
			case "audio/mpeg":
				type = "audio";
				provided = "mp3";
				solution = {mp3: images[image].url};
				break;
			case "audio/m4a":
				type = "audio";
				provided = "m4a";
				solution = {m4a: images[image].url};
				break;
			case "audio/wav":
				type = "audio";
				provided = "wav";
				solution = {wav: images[image].url};
				break;
			case "audio/flac":
				type = "audio";
				provided = "flac";
				solution = {flac: images[image].url};
				break;
			}
			
			if( autoplay ) {
				clearInterval( autoPlayer );
			}

			plyr = new MSLVideoPlayer( $(p), {
				mslSync: true, 
				preload: "auto", 
				controlDefinition: '{ "controls": ["play", "progress", "current-time", "duration", "mute", "volume"] }',
				callbacks: {
					onNext: () => {
						$("#altaiSongInfo").stop( true, true ).fadeOut( 500 );

						if( autoplay ) {
							autoPlayer = setInterval( function() {
								loadImage( currentImage + 1, false, 800 );
							}, 9000 );
						}

						loadImage( currentImage + 1, false, 800 );
					},
					onPrev: () => {
						$("#altaiSongInfo").stop( true, true ).fadeOut( 500 );

						if( autoplay ) {
							autoPlayer = setInterval( function() {
								loadImage( currentImage + 1, false, 800 );
							}, 9000 );
						}

						loadImage( currentImage - 1, false, 800 );
					}
				}
			} );
			plyr.init();
			plyr.player.hasPlayed = false;
			
			plyr.loadDefault( images[image].url, type, mimeType );

			// Add next/prev buttons when there's more than one item in the playlist.
			if( images.length > 1 ) {
				plyr.injectPlaylistControls();
			}
			
			plyr.player.on( "ready", () => {
				$("#altaiSongInfo").stop( true, true ).remove();
			});
			
			plyr.player.on( "playing", () => {
				if( !plyr.player.hasPlayed ) {
					$("#MSLAppAltaiView #messageLoading").css( "display", "none" );
					
					if( isAudio ) {
						var $songInfo = $(document.createElement( "div" ));
						$songInfo.attr( "id", "altaiSongInfo" );
						$songInfo.css( "display", "block" );
						$songInfo.hide();
						
						const si = new SongInfo( $songInfo, images[image].name );
						si.Render();
						
						$("#MSLAppAltaiView > main").append( $songInfo );
						
						$songInfo.stop( true, true ).fadeIn( 2500 );
					}
				}
			});
			
			plyr.player.on( "ended", () => {
				$("#altaiSongInfo").stop( true, true ).fadeOut( 500 );
				
				if( autoplay ) {
					autoPlayer = setInterval( function() {
						loadImage( currentImage + 1, false, 800 );
					}, 9000 );
					
					loadImage( currentImage + 1, false, 800 );
				}
			});
			
			plyr.player.on( "error", ( e ) => {
				showError( "Media could not be played", "Your download quota on the host may have been exceeded." );
				$("#AltaiPlayerControls").show();
				videoTag[0].play();
				videoTag.show();
			});
			
			$("#AltaiPlayerControls").hide();
		}
		else {
			$img.css( "background-image", "url('" + images[image].url + "')" );
			$("#AltaiPlayerControls").show();
		}
		
		if( isVideo || isImage ) {
			videoTag[0].pause();
			videoTag.hide();
		}
		else {
			videoTag[0].play();
			videoTag.show();
		}
		
		$img.fadeIn( fadeTime, function() {
			if( $altaiPlayer.children().length > 1 ) {
				$altaiPlayer.children().first().remove();
			}
		});
		
		switch( direction ) {
			case -1: preloadImage( image - 1 ); break;
			case 1: preloadImage( image + 1 ); break;
			case 0: preloadImage( image - 1 ); preloadImage( image + 1 ); break;
		}
	}
	
	function nextImage() {
		loadImage( currentImage + 1, true );
	}
	
	function prevImage() {
		loadImage( currentImage - 1, true );
	}
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "background-color", "#000000" );
		
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
		$("section#MSLAppAltaiView").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppAltaiView").css( "display", "none" );
		
		colourFilter.show();
		
		$("body").css( "background-image", originalBodyBackground );
		videoTag.attr( "poster", originalVideoPoster );
		sourceTag.attr( "src", originalVideoSource );
		
		videoTag[0].load();
		videoTag[0].play();
		videoTag.show();

		if( plyr ) {
			plyr.destroy();
			plyr = null;
		}
	}
	
	function init() {
		$altaiPlayer = $("#AltaiPlayer");
		
		// Bind the page control buttons
		$("#AltaiPlayerControls .prev").click( function() {
			prevImage();
		});
		
		$("#AltaiPlayerControls .next").click( function() {
			nextImage();
		});
		
		$overlay = $("section#MSLAppAltaiView > main > div.fullscreenOverlay");
		$overlayBox = $overlay.children().first();
		
		$(window).blur( function() {
			$overlay.css( "opacity", 0.0 );
		});
		
		$(window).on( "mouseout", function() {
			$overlay.css( "opacity", 0.0 );
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.albumID )
			albumID = parseInt( data.albumID );
		
		if( "undefined" != typeof data.index )
			index = parseInt( data.index );
		
		if( "undefined" != typeof data.autoplay )
			autoplay = !!+data.autoplay;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		isLoaded = true;
		
		setBackground();
		preload( data, true );
		
		fetchAlbum();
		
		if( autoplay ) {
			clearInterval( autoPlayer );
			
			autoPlayer = setInterval( function() {
				loadImage( currentImage + 1, false, 800 );
			}, 9000 );
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
		hideApp();
		
		if( autoPlayer ) {
			clearInterval( autoPlayer );
			autoPlayer = null;
		}
		
		$altaiPlayer.children().remove();
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
		nextImage: nextImage,
		prevImage: prevImage,
		onMouseMove: onMouseMove,
		
		back: function() {},
		
		loadImage: loadImage,

		passedThroughData: function( data ) {
			plyr.fromMslSync( data );
		}
	};
})();

MSLAppManager.register( "altaiView", MSLAppAltaiView, true );