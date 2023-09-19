var MSLAppYoutubeWatch = (function() {
	var player;
	var playerNG;
	var videoID;
	var playlistID;
	var isLoaded;
	var fullscreenOverlayTimer;
	var lastPlaylistIndex;
	var infiniteLoopSingleVideo;
	var isSingleVideo;
	
	var $overlay;
	var $overlayBox;
	var $hideRelatedVideos;
	
	var overrideApp = null;
	var overrideVar = null;
	var overrideVal = null;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#960000" );
		//$("#underlay > #videoBackground").css( "opacity", 1 );
		//$("#underlay > video").css( "filter", "brightness(0.5)" );
		//$("#underlay > video").css( "-webkit-filter", "brightness(0.5)" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppYoutubeWatch").fadeIn();
		$("meta[name='referrer'").attr( "content", "always" );
	}
	
	function hideApp() {
		$("meta[name='referrer'").attr( "content", "no-referrer" );
		$("section#MSLAppYoutubeWatch").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		videoID = null;
		playlistID = null;
		lastPlaylistIndex = -1;
		infiniteLoopSingleVideo = false;
		isSingleVideo = true;
		
		$overlay = $("section#MSLAppYoutubeWatch > main > div.fullscreenOverlay");
		$overlayBox = $overlay.children().first();
		
		$hideRelatedVideos = $("section#MSLAppYoutubeWatch > main > div.hideRelatedVideos");
		
		$("section#MSLAppYoutubeWatch > main > div.preventPlayerHoverPopups").on( "mouseout", function() {
			$overlay.css( "opacity", 0.0 );
		});
		
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
		
		if( "undefined" != typeof data.playlistID )
			playlistID = data.playlistID;
		
		if( "undefined" != typeof data.infiniteLoopSingleVideo )
			infiniteLoopSingleVideo = data.infiniteLoopSingleVideo;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		if( reload ) {
			// ..
		}
		
		if( "undefined" != typeof data.backOverride ) {
			overrideApp = data.backOverride;
			overrideVar = data.overrideVar;
			overrideVal = data.overrideVal;
		}
		else {
			overrideApp = null;
			overrideVar = null;
			overrideVal = null;
		}
		
		isLoaded = true;
		setBackground();
		showApp();
		
		$("#MSLAppYoutubeWatch .loop").removeClass( "on" );

		callbackWhenYoutubeIsReady( function() {
			$("#youtubePlayerLoading").hide( 0 );

			if( MSLGlobals.useClassic ) {
				loadClassic( data );
			}
			else {
				loadNextGen( data );
			}
		});
	}

	function loadClassic( data ) {
		var wasPlaylist = playlistID;
		
		videoID = null;
		playlistID = null;
		
		preload( data );
		
		if( wasPlaylist && videoID && player ) {
			player.destroy();
			player = null;
		}
		
		if( !player ) {
			var settings = {
				width: "1024",
				height: "576",
				suggestedQuality: "hd720",
				playerVars: {
					iv_load_policy: 3,
					fs: 0,
					showinfo: 0,
					controls: 1,
					disablekb: 0,
					rel: 0,
					enablejsapi: 1,
					origin: "https://" + MSLGlobals.Domain
				},
				events: {
					"onReady": function( evt ) {
						evt.target.playVideo();
					},
					"onStateChange": function( evt ) {
						if( evt.data == YT.PlayerState.BUFFERING ) {
							$("#youtubePlayerWarning").css( "display", "none" );
							$("#ytVideoDirectLink").attr( "href", "#" );
						}
						
						$hideRelatedVideos.css( "display", "none" );
						
						// switch( evt.data ) {
						// 	case YT.PlayerState.UNSTARTED: playerState.unstarted = true; break;
						// 	case YT.PlayerState.ENDED: playerState.ended = true; break;
						// 	case YT.PlayerState.PLAYING: playerState.playing = true; break;
						// 	case YT.PlayerState.PAUSED: playerState.paused = true; break;
						// 	case YT.PlayerState.BUFFERING: playerState.buffering = true; break;
						// 	case YT.PlayerState.CUED: playerState.cued = true; break;
						// }
						
						if( evt.data == YT.PlayerState.ENDED && infiniteLoopSingleVideo && isSingleVideo ) {
							player.playVideo();
						}
						else if( evt.data == YT.PlayerState.ENDED ) {
							$hideRelatedVideos.css( "display", "block" );
							$overlay.css( "opacity", 1.0 );
						}
					},
					"onPlaybackQualityChange": function( evt ) {
					},
					"onError": function( evt ) {
						if( evt.data == 101 || evt.data == 150 ) {
							$("#youtubePlayerWarning").css( "display", "block" );
							$("#youtubePlayerTitle").text( evt.target.playerInfo.videoData.title );
							$("#ytVideoDirectLink").attr( "href", "https://www.youtube.com/watch?v=" + evt.target.i.i.videoId );
						}
					}
				}
			};
			
			if( videoID ) {
				isPlaylist = videoID.indexOf( "," ) != -1;
				
				if( isPlaylist ) {
					var list = videoID.split(",");
					settings.videoId = list.shift();
					settings.playerVars.playlist = list.join(",");
					isSingleVideo = false;
					$("div.qm > div.videoOnlyCtrl").css( "display", "none" );
					$("div.qm > div.playlistOnlyCtrl").css( "display", "block" );
				}
				else {
					settings.videoId = videoID;
					isSingleVideo = true;
					$("div.qm > div.videoOnlyCtrl").css( "display", "block" );
					$("div.qm > div.playlistOnlyCtrl").css( "display", "none" );
				}
			}
			else if( playlistID ) {
				settings.playerVars.listType = "playlist";
				settings.playerVars.list = playlistID;
				isSingleVideo = false;
				$("div.qm > div.videoOnlyCtrl").css( "display", "none" );
				$("div.qm > div.playlistOnlyCtrl").css( "display", "block" );
			}
			
			var $qm = $("#MSLAppYoutubeWatch div.qm");
			var visibleChildren = new Array;
			
			$qm.children().each( function() {
				if( $(this).css( "display" ) != "none" )
					visibleChildren.push( $(this) );
			});
			
			if( visibleChildren.length == 5 || visibleChildren.length == 6 ) {
				$qm.addClass( "col3" );
			}
			else {
				$qm.removeClass( "col3" );
			}
			
			$("#youtubePlayerLoading").show( 0 );
			
			callbackWhenYoutubeIsReady( function() {
				$("#youtubePlayerLoading").hide( 0 );
				player = new YT.Player( "youtubeplayer", settings );
				$("#youtubeplayer").attr( "src", $("#youtubeplayer").attr( "src" ).replace( "&origin=" + encodeURIComponent( "https://" + MSLGlobals.Domain ), "" ) );
			});
		}
		else {
			if( videoID ) {
				isPlaylist = videoID.indexOf( "," ) != -1;
				
				if( isPlaylist ) {
					player.loadPlaylist({
						"playlist": videoID
						});
					
					$("div.qm > div.videoOnlyCtrl").css( "display", "none" );
					$("div.qm > div.playlistOnlyCtrl").css( "display", "block" );
				}
				else {
					player.loadVideoById( videoID, 0, "hd720" );
					$("div.qm > div.videoOnlyCtrl").css( "display", "block" );
					$("div.qm > div.playlistOnlyCtrl").css( "display", "none" );
				}
			}
			else if( playlistID ) {
				player.loadPlaylist({
					"list": playlistID,
					"listType": "playlist",
					});
					$("div.qm > div.videoOnlyCtrl").css( "display", "none" );
					$("div.qm > div.playlistOnlyCtrl").css( "display", "block" );
			}
		}
	}

	function loadNextGen( data ) {
		if( playerNG ) {
			playerNG.destroy();
			playerNG = null;
		}

		preload( data );

		playerNG = new MSLYoutubePlayer( "youtubeplayer" );

		if( videoID ) {
			if( videoID.includes( "," ) ) {
				playerNG.loadVideoList( videoID );
				$("div.qm > div.videoOnlyCtrl").css( "display", "none" );
				$("div.qm > div.playlistOnlyCtrl").css( "display", "block" );
			}
			else {
				playerNG.loadVideo( videoID );
				$("div.qm > div.videoOnlyCtrl").css( "display", "block" );
				$("div.qm > div.playlistOnlyCtrl").css( "display", "none" );
			}
		}
		else if( playlistID ) {
			playerNG.loadPlaylist( playlistID );
			$("div.qm > div.videoOnlyCtrl").css( "display", "none" );
			$("div.qm > div.playlistOnlyCtrl").css( "display", "block" );
		}

		playerNG.player.on( "ended", () => {
			if( !playerNG.loop ) {
				$hideRelatedVideos.css( "display", "block" );
				$overlay.css( "opacity", 1.0 );
			}
		});

		playerNG.player.on( "error", ( evt ) => {
			if( evt.detail.code == 101 || evt.detail.code == 150 ) {
				$("#youtubePlayerWarning").css( "display", "block" );
				$("#ytVideoDirectLink").attr( "href", evt.detail.plyr.embed.getVideoUrl() );

				let limit = 5;
				let setVideoTitleLater = setInterval( () => {
					const videoData = evt.detail.plyr.embed.getVideoData();

					if( videoData.title ) {
						$("#youtubePlayerTitle").text( evt.detail.plyr.embed.getVideoData().title );
						clearInterval( setVideoTitleLater );
					}

					if( --limit < 0 ) {
						clearInterval( setVideoTitleLater );
					}
				}, 25 );
			}
		});
	}

	function getCurrentVideoId() {
		if( playerNG ) {
			return playerNG.player.embed.getVideoData()["video_id"];
		}
		else if( player ) {
			return player.getVideoData()["video_id"];
		}

		return "";
	}
	
	function open() {
		if( !isLoaded )
			load();
		
		setBackground();
		showApp();
	}
	
	function close() {
		if( playerNG ) {
			playerNG.destroy();
			playerNG = null;
			videoID = null;
			playlistID = null;
			lastPlaylistIndex = -1;
			infiniteLoopSingleVideo = false;
			isSingleVideo = true;
		}
		else if( player ) {
			player.stopVideo();
		}
		
		hideApp();
	}
	
	function back() {
		if( overrideApp == null ) {
			MSLAppManager.load( 'youtube' );
		}
		else {
			var obj = {}
			obj[overrideVar] = overrideVal;
			
			MSLAppManager.load( overrideApp, obj );
		}
	}
	
	function openExternal() {
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}

		window.location = "https://www.youtube.com/watch?v=" + getCurrentVideoId();
	}
	
	function openChannel() {
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		MSLAppManager.load( "youtubeChannel", {videoID: getCurrentVideoId()} );
	}
	
	function favorite( origin ) {
		$.post( "json/youtubeFavourite.php", {
				uuid: MSLGlobals.uuid,
				videoID: getCurrentVideoId(),
				thumbnail: null,
				title: null,
				channel: null,
				published: null
			},
			function( data, status ) {
				data = JSON.parse( data );
				
				if( data.status == 200 ) {
					if( data.data.newStatus ) {
						$(origin).addClass( "on" );
					}
					else {
						$(origin).removeClass( "on" );
					}
				}
			}
		);
	}
	
	function playPrev() {
		$("#youtubePlayerWarning").css( "display", "none" );

		if( playerNG ) {
			playerNG.player.embed.previousVideo();
		}
		else if( player ) {
			player.previousVideo();
		}
	}
	
	function playNext() {
		$("#youtubePlayerWarning").css( "display", "none" );

		if( playerNG ) {
			playerNG.player.embed.nextVideo();
		}
		else if( player ) {
			player.nextVideo();
		}
	}
	
	function onMouseMove( x, y ) {
		if( $hideRelatedVideos.css( "display" ) == "block" ) {
			$overlay.css( "opacity", 1.0 );
			return true;
		}
		
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
	
	function onNext( toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_YOUTUBE_NEXT
			});
		}
		
		playNext();
	}
	
	function onPrev( toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_YOUTUBE_PREV
			});
		}
		
		playPrev();
	}
	
	function onReplay( toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_YOUTUBE_REPLAY
			});
		}
		
		if( playerNG ) {
			playerNG.pause();
			playerNG.currentTime = 0;
			playerNG.play();
		}
		else if( player ) {
			player.pauseVideo();
			player.seekTo( 0, true );
			player.playVideo();
		}
	}
	
	function onLoop( toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		var $BTN = $("#MSLAppYoutubeWatch .loop");
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_YOUTUBE_LOOP
			});
		}
		
		if( infiniteLoopSingleVideo ) {
			$BTN.removeClass( "on" );
			infiniteLoopSingleVideo = false;
		}
		else {
			$BTN.addClass( "on" );
			infiniteLoopSingleVideo = true;
		}

		if( playerNG ) {
			playerNG.setLoop( infiniteLoopSingleVideo );
		}
	}
	
	return {
		init: init,
		preload: preload,
		load: load,
		open: open,
		close: close,
		back: back,
		openExternal: openExternal,
		openChannel: openChannel,
		favorite: favorite,
		
		onMouseMove: onMouseMove,
		onNext: onNext,
		onPrev: onPrev,
		onReplay: onReplay,
		onLoop: onLoop,

		passedThroughData: function( data ) {
			if( playerNG ) {
				playerNG.fromMslSync( data );
			}
		}
	};
})();

MSLAppManager.register( "youtubeWatch", MSLAppYoutubeWatch, true );