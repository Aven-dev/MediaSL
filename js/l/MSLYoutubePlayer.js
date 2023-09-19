class MSLYoutubePlayer {
	static #ACTION_ORIGIN_UNKNOWN = 0;
	static #ACTION_ORIGIN_LOCAL = 1;
	static #ACTION_ORIGIN_REMOTE = 2;

	id = null;
	domContainer = null;
	domPlyrWrapper = null;
	domYtWrapper = null;
	player = null;
	ytPlayer = null;
	loop = false;

	#playPauseActionOrigin = MSLYoutubePlayer.#ACTION_ORIGIN_UNKNOWN;
	
	constructor( target ) {
		if( typeof( jQuery ) != "undefined" && target instanceof jQuery ) {
			this.domContainer = target[0];
			this.id = this.domContainer.id;
		}
		else if( target instanceof HTMLElement ) {
			this.domContainer = target;
			this.id = this.domContainer.id;
		}
		else if( typeof( target ) == "string" ) {
			if( target.charAt( 0 ) == "#" ) {
				target = target.substr( 1 );
			}
			
			this.id = target;
			this.domContainer = document.getElementById( target );
		}
		
		this.destroy();
		
		this.domPlyrWrapper = document.createElement( "div" );
		this.domPlyrWrapper.className = "plyr__video-embed";
		this.domPlyrWrapper.id = "plyrContainer_" + this.id;
		
		this.domYtWrapper = document.createElement( "div" );
		this.domYtWrapper.id = "ytContainer_" + this.id;
		
		this.domPlyrWrapper.append( this.domYtWrapper );
		this.domContainer.append( this.domPlyrWrapper );
	}
	
	destroy() {
		if( this.player != null ) {
			this.player.stop();
			this.player.destroy();
		}
		
		this.player = null;
		
		if( this.domContainer.childNodes.length != 0 ) {
			for( let i = this.domContainer.childNodes.length - 1; i >= 0; --i ) {
				if( this.domContainer.childNodes[i] instanceof Plyr ) {
					Plyr.destroy();
				}
			}
		}
		
		this.domContainer.innerHTML = "";
	}
	
	setLoop( toLoop ) {
		this.loop = toLoop;
	}
	
	onYoutubePlayerReady( evt ) {
	}
	
	onYoutubePlayerStateChange( evt ) {
	}

	onPlaying( evt ) {
		if( this.#playPauseActionOrigin == MSLYoutubePlayer.#ACTION_ORIGIN_LOCAL && !(!MSLGlobals.isOwner && MSLGlobals.isLocked) ) {
			MSLGlobals.sync.send({
				c: OPCODE_PASSTHROUGH,
				a: 44850,
			});
		}

		this.#playPauseActionOrigin = MSLYoutubePlayer.#ACTION_ORIGIN_UNKNOWN;
	}

	onPause( evt ) {
		if( this.#playPauseActionOrigin == MSLYoutubePlayer.#ACTION_ORIGIN_LOCAL && !(!MSLGlobals.isOwner && MSLGlobals.isLocked) ) {
			MSLGlobals.sync.send({
				c: OPCODE_PASSTHROUGH,
				a: 63146,
				v: this.player.currentTime
			});
		}

		this.#playPauseActionOrigin = MSLYoutubePlayer.#ACTION_ORIGIN_UNKNOWN;
	}
	
	loadVideo( video ) {
		this.ytPlayer = new YT.Player( this.domYtWrapper, {
			height: "576",
			width: "1024",
			suggestedQuality: "hd720",
			videoId: video
		});
		
        this.player = new Plyr( this.domPlyrWrapper, {
			autoplay: true,
			controls: ["play", "progress", "current-time", "duration", "mute", "volume"],
            youtube: {
				iv_load_policy: 3,
				fs: 0,
				showinfo: 0,
				rel: 0,
				enablejsapi: 1,
				origin: "https://" + MSLGlobals.Domain
			}
        });
		
		this.player.on( "ready", () => {
			this.applyControlListeners();
		});
		
		this.player.on( "statechange", ( evt ) => { this.onYoutubePlayerStateChange( evt ); } );
		this.player.on( "playing", ( evt ) => { this.onPlaying( evt ); } );
		this.player.on( "pause", ( evt ) => { this.onPause( evt ); } );
		
		this.player.on( "ended", () => {
			if( this.loop ) {
				this.player.restart();
			}
		});
	}
	
	loadVideoList( videoList ) {
		this.ytPlayer = new YT.Player( this.domYtWrapper, {
			height: "576",
			width: "1024",
			suggestedQuality: "hd720"
		});
		
        this.player = new Plyr( this.domPlyrWrapper, {
			autoplay: true,
			controls: ["play", "progress", "current-time", "duration", "mute", "volume"],
            youtube: {
				iv_load_policy: 3,
				fs: 0,
				showinfo: 0,
				rel: 0,
				enablejsapi: 1,
				playlist: videoList,
				origin: "https://" + MSLGlobals.Domain
			}
        });
		
		this.player.on( "ready", () => {
			this.applyControlListeners();
			this.injectPlaylistControls();
		});
		
		this.player.on( "statechange", ( evt ) => { this.onYoutubePlayerStateChange( evt ); } );
		this.player.on( "playing", ( evt ) => { this.onPlaying( evt ); } );
		this.player.on( "pause", ( evt ) => { this.onPause( evt ); } );
		
		this.player.on( "ended", () => {
			if( this.loop ) {
				this.player.embed.playVideoAt( 0 );
			}
		});
	}
	
	loadPlaylist( playlist ) {
		this.ytPlayer = new YT.Player( this.domYtWrapper, {
			height: "576",
			width: "1024",
			suggestedQuality: "hd720"
		});
		
        this.player = new Plyr( this.domPlyrWrapper, {
			autoplay: true,
			controls: ["play", "progress", "current-time", "duration", "mute", "volume"],
            youtube: {
				iv_load_policy: 3,
				fs: 0,
				showinfo: 0,
				rel: 0,
				enablejsapi: 1,
				list: playlist,
				listType: "playlist",
				origin: "https://" + MSLGlobals.Domain
			}
        });
		
		this.player.on( "ready", () => {
			this.applyControlListeners();
			this.injectPlaylistControls();
		});
		
		this.player.on( "statechange", ( evt ) => { this.onYoutubePlayerStateChange( evt ); } );
		this.player.on( "playing", ( evt ) => { this.onPlaying( evt ); } );
		this.player.on( "pause", ( evt ) => { this.onPause( evt ); } );
		
		this.player.on( "ended", () => {
			if( this.loop ) {
				this.player.embed.playVideoAt( 0 );
			}
		});
	}
	
	applyControlListeners() {
		if( !MSLGlobals.sync ) {
			return;
		}
		
		this.player.elements.buttons.play[this.player.elements.buttons.play.length-1].addEventListener( "mouseup", () => {
			this.#playPauseActionOrigin = MSLYoutubePlayer.#ACTION_ORIGIN_LOCAL;
		});
		
		this.player.elements.poster.addEventListener( "mouseup", () => {
			this.#playPauseActionOrigin = MSLYoutubePlayer.#ACTION_ORIGIN_LOCAL;
		});

		this.player.elements.inputs.seek.addEventListener( "mouseup", ( evt ) => {
			const min = evt.target.getAttribute( "aria-valuemin" ) ?? 0.0;
			const max = evt.target.getAttribute( "aria-valuemax" ) ?? 86400.0;
			let current = parseFloat( evt.target.style.getPropertyValue( "--value" ) );

			// Unfortunately the css --value seems to be the only way to get the time the seeker is going to be at.
			// 'value' is always 0, 'aria-valuenow' lags behind just like 'player.currentTime' or the time in the 'player.embed', as well as the player 'seeked' or youtube's 'statechange' events.
			if( isNaN( current ) || current < min || current > max ) {
				return;
			}
			
			current = (current / 100) * max;
			
			MSLGlobals.sync.send({
				c: OPCODE_PASSTHROUGH,
				a: 9312,
				v: current,
				s: this.player.playing ? 44850 : 63146
			});
		});
	}
	
	injectPlaylistControls() {
		const btnPlay = this.domPlyrWrapper.querySelector( ".plyr__controls [data-plyr=\"play\"]" );
		
		// Insert "prev" button in front of the native Play control
		const btnPrev = document.createElement( "button" );
		btnPrev.type = "button";
		btnPrev.className = "plyr-prev plyr__controls__item plyr__control";
		
		const btnPrevIco = document.createElement( "div" );
		btnPrevIco.className = "icon";
		
		btnPrev.addEventListener( "mouseup", () => {
			if( MSLGlobals.sync ) {
				if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
					MSLGlobals.Audio.play( "denied" );
					return;
				}
				
				MSLGlobals.sync.send({
					c: OPCODE_YOUTUBE_PREV
				});
			}
			
			this.player.embed.previousVideo();
		} );
		
		btnPrev.append( btnPrevIco );
		btnPlay.parentNode.insertBefore( btnPrev, btnPlay );
		
		// Insert "next" button behind the native Pause control
		const btnNext = document.createElement( "button" );
		btnNext.type = "button";
		btnNext.className = "plyr-next plyr__controls__item plyr__control";
		
		btnNext.addEventListener( "mouseup", () => {
			if( MSLGlobals.sync ) {
				if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
					MSLGlobals.Audio.play( "denied" );
					return;
				}
				
				MSLGlobals.sync.send({
					c: OPCODE_YOUTUBE_NEXT
				});
			}
			
			this.player.embed.nextVideo();
		} );
		
		const btnNextIco = document.createElement( "div" );
		btnNextIco.className = "icon";
		
		btnNext.append( btnNextIco );
		btnPlay.parentNode.insertBefore( btnNext, btnPlay.nextSibling );
	}
	
	fromMslSync( data ) {
		if( this.player && "undefined" != typeof data.a ) {
			if( data.a == 44850 ) {
				this.#playPauseActionOrigin = MSLYoutubePlayer.#ACTION_ORIGIN_REMOTE;
				this.player.play();
			}
			else if( data.a == 63146 ) {
				this.#playPauseActionOrigin = MSLYoutubePlayer.#ACTION_ORIGIN_REMOTE;
				this.player.pause();
				
				if( "undefined" != typeof data.v ) {
					this.player.currentTime = data.v
				}
			}
			else if( data.a == 9312 && "undefined" != typeof data.v ) {
				this.player.currentTime = data.v
				
				if( "undefined" != typeof data.s ) {
					if( data.s == 63146 && this.player.playing ) {
						this.player.pause();
					}
					else if( data.s == 44850 && this.player.paused ) {
						this.player.play();
					}
				}
			}
		}
	}
}