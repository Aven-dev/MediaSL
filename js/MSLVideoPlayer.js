class StatusMessage {
	constructor( $target ) {
		this.$target = $target.addClass( "statusMessage" );
		this.$graphic = $(document.createElement( "div" )).addClass( "graphic" );
		this.$text = $(document.createElement( "div" )).addClass( "text" );
		this.$loadingDots = $(document.createElement( "span" )).addClass( "loadingDots" );
		
		this.$target.append( this.$graphic );
		this.$target.append( this.$text );
		
		this.Clear();
	}
	
	destroy() {
		this.$target.empty();
	}
	
	Clear() {
		this.$target.css( "display", "none" );
		this.$graphic.removeClass().addClass( "graphic" );
		this.$text.empty();
	}
	
	Set( text, graphic = null, withLoadingDots = false ) {
		if( graphic != null ) {
			this.$graphic.addClass( graphic );
		}
		
		this.$text.text( text );
		
		if( withLoadingDots ) {
			this.$text.append( this.$loadingDots );
		}
		
		this.$target.css( "display", "flex" );
	}
}

class MSLVideoPlayer {
	constructor( $target, config = {} ) {
		this.$target = $target;
		this.$loading = $(document.createElement( "div" ));
		this.$video = $(document.createElement( "video" ));
		
		this.$video.prop( "playsinline", true );
		this.$video.prop( "controls", config.controls ?? true );
		this.$video.attr( "data-plyr-config", config.controlDefinition ?? '{ "controls": ["play", "mute", "volume"] }' );
		
		this.$video.css( "display", "none" );
		
		this.$target.append( this.$loading );
		this.$target.append( this.$video );
		
		this.statusOverlay = null;
		this.player = null;
		this.hls = null;
		this.dash = null;
		
		this.config = {};
		this.config.mslSync = config.mslSync ?? false;
		this.config.antiCors = config.antiCors ?? false;
		this.config.preload = config.preload ?? "metadata";
		this.config.fullscreenAudio = config.fullscreenAudio ?? true;
		this.config.hlsConfig = config.hlsConfig ?? null;
		this.config.plyrSettings = { clickToPlay: false };
		this.config.callbacks = {
			onControlPrev: () => {},
			onControlNext: () => {},
			onSyncPrev: () => {},
			onSyncNext: () => {},
			onPrev: () => {},
			onNext: () => {}
		};

		if( config.plyrSettings ) {
			this.config.plyrSettings = { ...this.config.plyrSettings, ...config.plyrSettings };
		}

		if( config.callbacks ) {
			this.config.callbacks = { ...this.config.callbacks, ...config.callbacks };
		}
	}
	
	init() {
		this.destroy();
		
		this.$video = this.$target.find( "video" ).first();
		this.player = new Plyr( this.$video[0], this.config.plyrSettings );

		this.player.on( "loadstart", evt => {
			this.player.playOnFirstOpportunity = true;
		});

		this.statusOverlay = new StatusMessage( this.$loading );
		this.statusOverlay.Set( "Loading", "loading" );
	}
	
	applySyncControls() {
		if( this.config.mslSync && MSLGlobals.sync ) {
			this.player.elements.buttons.play[0].addEventListener( "click", () => {
				if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
					return;
				}
				
				if( this.player.paused ) {
					MSLGlobals.sync.send({
						c: OPCODE_PASSTHROUGH,
						a: 63146,
					});
				}
				else if( this.player.playing ) {
					MSLGlobals.sync.send({
						c: OPCODE_PASSTHROUGH,
						a: 44850,
					});
				}
			});
			
			this.player.elements.inputs.seek.addEventListener( "click", () => {
				if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
					return;
				}
				
				MSLGlobals.sync.send({
					c: OPCODE_PASSTHROUGH,
					a: 9312,
					v: this.player.currentTime
				});
			});
		}
	}

	injectPlaylistControls() {
		const btnPlay = this.player.elements.controls.querySelector( ".plyr__controls [data-plyr=\"play\"]" );
		
		// Insert "prev" button in front of the native Play control
		const btnPrev = document.createElement( "button" );
		btnPrev.type = "button";
		btnPrev.className = "plyr-prev plyr__controls__item plyr__control";
		
		const btnPrevIco = document.createElement( "div" );
		btnPrevIco.className = "icon";
		
		btnPrev.addEventListener( "mouseup", () => {
			if( MSLGlobals.sync && this.config.mslSync ) {
				if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
					MSLGlobals.Audio.play( "denied" );
					return;
				}
				
				MSLGlobals.sync.send({
					c: OPCODE_PASSTHROUGH,
					a: 27920,
				});

				this.config.callbacks.onControlPrev();
				this.config.callbacks.onPrev();
			}
		} );
		
		btnPrev.append( btnPrevIco );
		btnPlay.parentNode.insertBefore( btnPrev, btnPlay );
		
		// Insert "next" button behind the native Pause control
		const btnNext = document.createElement( "button" );
		btnNext.type = "button";
		btnNext.className = "plyr-next plyr__controls__item plyr__control";
		
		btnNext.addEventListener( "mouseup", () => {
			if( MSLGlobals.sync && this.config.mslSync ) {
				if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
					MSLGlobals.Audio.play( "denied" );
					return;
				}
				
				MSLGlobals.sync.send({
					c: OPCODE_PASSTHROUGH,
					a: 53294,
				});

				this.config.callbacks.onControlNext();
				this.config.callbacks.onNext();
			}
		} );

		const btnNextIco = document.createElement( "div" );
		btnNextIco.className = "icon";
		
		btnNext.append( btnNextIco );
		btnPlay.parentNode.insertBefore( btnNext, btnPlay.nextSibling );
	}
	
	load( url ) {
		const oURL = new URL( url );
		
		if( oURL.pathname.indexOf( ".mpd" ) != -1 || url.indexOf( ".mpd" ) != -1 ) {
			this.loadDash( url );
			return;
		}
		
		if( (oURL.pathname.indexOf( ".m3u8" ) != -1 || url.indexOf( ".m3u8" ) != -1) && Hls.isSupported() ) {
			this.loadHls( url );
			return;
		}
		
		this.loadDefault( url );
	}
	
	loadDefault( url, type = null, mime = null ) {
		const oURL = new URL( url );
		
		if( type == null && oURL.pathname.indexOf( ".mp4" ) != -1 ) {
			type = "video";
			mime = "video/mp4";
		}
		else if( type == null && oURL.pathname.indexOf( ".webm" ) != -1 ) {
			type = "video";
			mime = "video/webm";
		}
		
		if( type && mime ) {
			this.player.source = {
				type: this.config.fullscreenAudio ? "video" : type,
				sources: [{ src: url, type: mime }]
			};

			if( this.config.fullscreenAudio && type == "audio" ) {
				this.player.elements.container.classList.add( "plyr--fullscreenAudio" );
			}
			
			this.player.media.setAttribute( "preload", this.config.preload )
		}
		else {
			this.$video[0].src = url;
			this.$video[0].setAttribute( "preload", this.config.preload )
		}
		
		this.player.on( "canplay", evt => {
			if( this.player.playOnFirstOpportunity ) {
				this.player.playOnFirstOpportunity = undefined;
				this.player.play();
			}
			
			this.$video.css( "display", "block" );
			this.statusOverlay.Clear();
		});
		
		this.applySyncControls();
	}
	
	loadHls( url ) {
		if( !Hls.isSupported() ) {
			this.loadDefault( url );
			return;
		}
		
		if( this.config.antiCors ) {
			if( this.config.hlsConfig != null ) {
				this.hls = new Hls( this.config.hlsConfig );
			}
			else {
				this.hls = new Hls({
					fLoader: fLoader,
					manifestLoadingTimeOut: 7000,
					manifestLoadingMaxRetry: 2,
					fragLoadingTimeOut: 30000,
					fragLoadingMaxRetry: 3
				});
			}
		}
		else {
			this.hls = new Hls();
		}
		
		/*this.hls.on( Hls.Events.BUFFER_RESET, function() { console.log( "BUFFER_RESET" ); } );
		this.hls.on( Hls.Events.MANIFEST_LOADING, function() { console.log( "MANIFEST_LOADING" ); } );
		this.hls.on( Hls.Events.MANIFEST_PARSED, function() { console.log( "MANIFEST_PARSED" ); } );
		this.hls.on( Hls.Events.LEVEL_LOADED, function() { console.log( "LEVEL_LOADED" ); } );
		this.hls.on( Hls.Events.FRAG_LOADING, function() { console.log( "FRAG_LOADING" ); } );
		this.hls.on( Hls.Events.FRAG_LOAD_EMERGENCY_ABORTED, function() { console.log( "FRAG_LOAD_EMERGENCY_ABORTED" ); } );
		this.hls.on( Hls.Events.FRAG_LOADED, function() { console.log( "FRAG_LOADED" ); } );
		this.hls.on( Hls.Events.FRAG_PARSED, function() { console.log( "FRAG_PARSED" ); } );
		this.hls.on( Hls.Events.FRAG_BUFFERED, function() { console.log( "FRAG_BUFFERED" ); } );
		this.hls.on( Hls.Events.DESTROYING, function() { console.log( "DESTROYING" ); } );
		
		this.player.on('ready', event => { console.log( "player.ready" ); });
		this.player.on('progress', event => { console.log( "player.progress" ); });
		this.player.on('playing', event => { console.log( "player.playing" ); });
		this.player.on('timeupdate', event => { console.log( "player.timeupdate" ); });
		this.player.on('seeking', event => { console.log( "player.seeking" ); });
		this.player.on('seeked', event => { console.log( "player.seeked" ); });
		this.player.on('ended', event => { console.log( "player.ended" ); });
		this.player.on('loadstart', event => { console.log( "player.loadstart" ); });
		this.player.on('loadeddata', event => { console.log( "player.loadeddata" ); });
		this.player.on('loadedmetadata', event => { console.log( "player.loadedmetadata" ); });
		this.player.on('qualitychange', event => { console.log( "player.qualitychange" ); });
		this.player.on('canplaythrough', event => { console.log( "player.canplaythrough" ); });
		this.player.on('stalled', event => { console.log( "player.stalled" ); });
		this.player.on('waiting', event => { console.log( "player.waiting" ); });
		this.player.on('emptied', event => { console.log( "player.emptied" ); });
		this.player.on('cuechange', event => { console.log( "player.cuechange" ); });
		this.player.on('error', event => { console.log( "player.error" ); });*/
		
		this.hls.attachMedia( this.$video[0] );
		
		const self = this;
		this.hls.on( Hls.Events.MEDIA_ATTACHED, function() {
			self.hls.loadSource( url );
			self.applySyncControls();
		});
		
		this.hls.on( Hls.Events.MANIFEST_LOADED, function() {
			self.player.play();
		});
		
		this.hls.on( Hls.Events.FRAG_PARSED, function() {
			self.$video.css( "display", "block" );
			self.statusOverlay.Clear();
		} );
		
		this.hls.on( Hls.Events.ERROR, function( evt, data ) {
			if( data.fatal ) {
				switch( data.type ) {
				case Hls.ErrorTypes.NETWORK_ERROR:
					console.warn( "HLS attempting to recover from network error" );
					self.hls.startLoad();
					break;
				case Hls.ErrorTypes.MEDIA_ERROR:
					console.warn( "HLS attempting to recover from media error" );
					self.hls.recoverMediaError();
					break;
				default:
					console.error( "HLS unable to recover from fatal error:" );
					console.log( data );
					
					self.statusOverlay.Clear();
					self.statusOverlay.Set( "An error occured", "error" );
					self.destroy();
					break;
				}
			}
			else {
				switch( data.type ) {
				case Hls.ErrorTypes.NETWORK_ERROR:
					break;
				}
				
				console.log( data );
			}
		});
	}
	
	loadDash( url ) {
		$.ajax({
			method: "GET",
			url: url
		})
		.done( (data) => {
			// Extract wideVine and readyPlay DRM servers from the manifest.
			const adaptionSets = data.getElementsByTagName( "AdaptationSet" );
			let wideVineUrl = null;
			let readyPlayUrl = null;
			
			for( let aS = 0; aS < adaptionSets.length; ++aS ) {
				if( adaptionSets[aS].getAttribute( "mimeType" ) == "video/mp4" ) {
					const contentProtec = adaptionSets[aS].getElementsByTagName( "ContentProtection" );
					
					for( let cP = 0; cP < contentProtec.length; ++cP ) {
						if( contentProtec[cP].getAttribute( "bc:licenseAcquisitionUrl" ) ) {
							wideVineUrl = contentProtec[cP].getAttribute( "bc:licenseAcquisitionUrl" );
							continue;
						}
						
						const msprTags = contentProtec[cP].getElementsByTagName( "mspr:pro" );
						
						if( msprTags.length == 1 ) {
							try {
								const msprData = atob( msprTags[0].innerHTML );
								readyPlayUrl = new DOMParser().parseFromString( msprData.substr( msprData.indexOf( "<" ) ).replaceAll( "\u0000", "" ), "text/xml" ).getElementsByTagName( "LA_URL" )[0].innerHTML;
							}
							catch( e ) {}
							
						}
					}
					
					break;
				}
			}
			
			// Build protection data object
			let protecData = {};
			let hasProtecData = false;
			
			if( wideVineUrl ) {
				hasProtecData = true;
				protecData["com.widevine.alpha"] = {"laURL": wideVineUrl};
			}
			
			if( readyPlayUrl ) {
				hasProtecData = true;
				protecData["com.microsoft.playready"] = {"laURL": readyPlayUrl};
			}
			
			// Initialize Dash
			this.dash = dashjs.MediaPlayer().create();
			this.dash.initialize( this.$video[0], url, true );
			
			this.applySyncControls();
			
			// Set protection data (if any)
			if( hasProtecData ) {
				this.dash.setProtectionData( protecData );
			}
			
			// Set up events
			this.dash.on( dashjs.MediaPlayer.events.PLAYBACK_METADATA_LOADED, e => {
				this.$video.css( "display", "block" );
				this.statusOverlay.Clear();
			} );
		});
	}
	
	destroy() {
		if( this.statusOverlay != null )
			this.statusOverlay.destroy();
		
		if( this.player != null )
			this.player.destroy();
		
		if( this.hls != null )
			this.hls.destroy();
		
		if( this.dash != null )
			this.dash.destroy();
		
		this.player = null;
		this.hls = null;
	}
	
	fromMslSync( data ) {
		if( this.player && "undefined" != typeof data.a ) {
			if( data.a == 44850 ) {
				this.player.play();
			}
			else if( data.a == 63146 ) {
				this.player.pause();
			}
			else if( data.a == 9312 && "undefined" != typeof data.v ) {
				this.player.currentTime = data.v;
			}
			else if( data.a == 53294 ) {
				this.config.callbacks.onSyncNext();
				this.config.callbacks.onNext();
			}
			else if( data.a == 27920 ) {
				this.config.callbacks.onSyncPrev();
				this.config.callbacks.onPrev();
			}
		}
	}
}