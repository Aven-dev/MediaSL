class MSLAppGameLibrary
{
	constructor( gameDescrScroll, tabs, gameManualScroll ) {
		this.gameDescrScroll = gameDescrScroll;
		this.gameManualScroll = gameManualScroll;
		this.tabs = tabs;
		
		this.gameList = $("#gameList");
		this.$title = $("#gameSelectionInfo > header > h1");
		this.$developer = $("#gameSelectionInfo > header > h2");
		this.$system = $("#gameSelectionInfo > header > h3");
		this.$host = $("#gameSelectionInfo > header > h4");
		this.$description = $("#tabGameAboutContent");
		this.$playButton = $("#gamePlayButton");
		
		this.data = MSLAppGamesData;
		this.timeLastGameOpened;
		this.currentAudio = null;
		this.audioMuted = false;
		
		const self = this;
		
		for( let i = 0; i < this.data.length; ++i ) {
			this.data[i].audioObject = null;
			
			this.data[i].getAudioObject = function( optional = false ) {
				if( self.data[i].audioObject === null && !optional ) {
					self.data[i].audioObject = new Audio( self.data[i].midi );
					self.data[i].audioObject.volume = 0.15 * self.data[i].midi_volume;
					self.data[i].audioObject.loop = true;
				}
				
				return self.data[i].audioObject;
			};
		}
	}
	
	Render() {
		const self = this;
		self.gameList.empty();
		
		for( let i = 0; i < self.data.length; ++i ) {
			const container = $(document.createElement( "div" ));
			container.css( "background-position-x", "0px" );
			container.css( "background-image", "url('" + self.data[i].thumbnails + "')" );
			container.attr( "gameid", i );
			
			container[0]["onselect"] = function() {
				if( !self.audioMuted ) {
					self.data[i].getAudioObject().play();
				}
				
				self.currentAudio = self.data[i].getAudioObject();
			}
			
			container[0]["ondeselect"] = function() {
				if( self.data[i].getAudioObject( true ) ) {
					self.data[i].getAudioObject().pause();
					self.data[i].getAudioObject().currentTime = 0;
				}
				
				self.currentAudio = null;
			}
			
			// Add slide function
			container[0]["slide"] = function() {
				const $this = $(this);
				
				// Stop any animations playing on this item
				$this.stop( false, true );
				
				// Get current position to offset 'width' from
				let currentPos = parseInt( $this.css( "background-position-x" ) );
				let width = parseInt( $this.css( "width" ) );
				
				currentPos = Math.round( currentPos / width ) * width - width;
				
				// Animate the slideshow into position
				$this.animate({
					"background-position-x": currentPos + "px"
				},
				{
					always: function() {
						const self = this;
						
						// Continue the animation after some time
						if( "undefined" != typeof this["slideTimeout"] )
							clearTimeout( this["slideTimeout"] );
						
						this["slideTimeout"] = setTimeout( function() {
							self.slide();
						}, 2000 );
					}
				});
			};
			
			// Add slide stop function
			container[0]["slideStop"] = function() {
				const $this = $(this);
				
				// Stop any animations playing on this item
				$this.stop( false, true );
				
				// Abort the slideshow
				if( "undefined" != typeof this["slideTimeout"] && this["slideTimeout"] != null ) {
					clearTimeout( this["slideTimeout"] );
					this["slideTimeout"] = null;
				}
				else {
					return;
				}
				
				// Calculate positions in order to revert to the first image in the sequence
				let imageWidth = new Image();
				imageWidth.src = $this.css( "background-image" ).replace(/url\(\"|\"\)$/ig, "");
				imageWidth = imageWidth.width;
				
				let currentPos = parseInt( $this.css( "background-position-x" ) );
				let width = parseInt( $this.css( "width" ) );
				let numIndices = Math.round( imageWidth / width );
				let curIndex = Math.round( currentPos / width );
				
				//currentPos = Math.round( currentPos / width ) * width;
				currentPos -= (curIndex % numIndices) * width;
				
				// Animate back to the thumbnail position
				$this.stop().animate({
					"background-position-x": currentPos + "px"
				},
				{
					always: function() {
						// Reset back to 0 once done.
						$this.css( "background-position-x", "0px" );
					},
				});
			};
			
			self.gameList.append( container );
			
			// Select first item by default
			if( i == 0 ) {
				self.Select( container );
			}
			
			// Click to select this element
			container.on( "click", function() {
				self.Select( $(this) );
			});
		}
		
		// "PLAY LOCALLY" button event
		this.$playButton.on( "click", function() {
			const ID = $(this).attr( "gameid" );
			
			if( ID === undefined || self.data.length < ID ) {
				return;
			}
			
			self.timeLastGameOpened = new Date();
			MSLAppManager.load( "gamesPlay", {gameID: ID}, false );
		});
	}
	
	Select( $target ) {
		if( $target.hasClass( "selected" ) )
			return;
		
		$target.parent().children().each( function() {
			this.ondeselect();
			this.slideStop();
			$(this).removeClass( "selected" );
		});
		
		$target.addClass( "selected" );
		
		$target[0].onselect();
		$target[0].slide();

		// Get the index of this game
		const ID = $target.attr( "gameid" );
		
		// Set game info for the info panel
		this.$playButton.attr( "gameid", ID );
		this.$title.text( this.data[ID].title ).css( "font-size", "" );
		this.$developer.text( this.data[ID].developer + " (" + this.data[ID].year + ")" ).css( "font-size", "" );
		this.$system.text( this.data[ID].system ).css( "font-size", "" );
		this.$host.html( "Hosted By: <img src='/images/apps/games/" + this.data[ID].hostImage +"' title='Hosted By: " + this.data[ID].hostName + "' alt='" + this.data[ID].hostName + "' />" );
		
		const fitNowrapText = function( $dom ) {
			let scalar = $dom[0].clientWidth / $dom[0].scrollWidth;
			
			if( scalar < 1.0 ) {
				$dom.css( "font-size", parseInt( $dom.css( "font-size" ) ) * scalar );
			}
		};
		
		fitNowrapText( this.$title );
		fitNowrapText( this.$developer );
		fitNowrapText( this.$system );
		
		// Set game description
		this.$description.children().remove();
		
		for( let i = 0; i < this.data[ID].description.length; ++i ) {
			const $p = $(document.createElement( "p" ));
			$p.text( this.data[ID].description[i] );
			this.$description.append( $p );
		}
		
		// Update the scrollbar
		this.tabs.Switch( "tabGameAbout" );
		this.gameDescrScroll.UpdateVisibility();
		
		// Load in the game manual
		const context = $("#tabGameManualContent");
		context.empty();
		
		for( let i = 0; i < this.data[ID].manual_images.length; ++i ) {
			const $imgContainer = $(document.createElement( "div" ));
			context.append( $imgContainer );
			
			new Promise( (resolve, reject) => {
				const img = new Image();
				
				img.addEventListener( "load", function() {
					resolve( img );
				});
				
				img.addEventListener( "error", function() {
					reject();
				});
				
				img.src = this.data[ID].manual_images[i];
			})
			.then( function( img ) {
				var $img = $(img);
				$img.addClass( "unselectable" );
				$imgContainer.append( $img );
				
				if( img.naturalWidth / img.naturalHeight >= 0.7 ) {
					var $div = $(document.createElement( "div" ));
					$div.css( "background-image", "url('" + img.currentSrc + "')" );
					
					$imgContainer.on( "mousemove", function( evt ) {
						$div.css( "background-position", (-((evt.offsetX / img.clientWidth) * (img.naturalWidth - img.clientWidth))) + "px " + (-((evt.offsetY / img.clientHeight) * (img.naturalHeight - img.clientHeight))) + "px" );
						$div.show(0);
					});
					
					$imgContainer.on( "mouseleave", function() {
						$div.hide(0);
					});
					
					$imgContainer.append( $div );
				}
			})
			.catch( function( e ) {
				var $img = $(document.createElement( "img" ));
				$img.addClass( "unselectable" );
				$img.attr( "src", "/images/apps/adult/artwork_unavailable.png" );
				$imgContainer.append( $img );
			});
		}
		
	}
}

var MSLAppGames = (function() {
	const sectionID = "MSLAppGames";
	
	var isLoaded;
	var tabs;
	var gameListScroll;
	var gameDescrScroll;
	var gameManualScroll;
	var gameList;
	var gameLibrary;
	var hasRendered = false;
	var bgAnimInt = null;
	
	//var lastSearchQuery;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#3b7db8" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "normal" );
	}
	
	function showApp() {
		$("#underlay > *").css( "display", "none" );
		$("#underlay > #gameAnimatedBackground").css( "display", "block" );
		$("body > section").css( "display", "none" );
		$("section#" + sectionID + "").fadeIn();
		
		if( !hasRendered ) {
			gameLibrary.Render();
			hasRendered = true;
		}
		
		gameListScroll.UpdateVisibility();
		gameDescrScroll.UpdateVisibility();
		gameManualScroll.UpdateVisibility();
		
		let bgPosX = 0.0;
		let bgPosY = 0.0;
		const bgAnim = $("#underlay > #gameAnimatedBackground > div")[0];
		
		bgAnimInt = setInterval( function() {
			bgPosX += 0.2;
			bgPosY += 0.001;
			
			bgAnim.style.backgroundPositionX = bgPosX + "px";
			bgAnim.style.backgroundPositionY = (-270 + (230 * Math.sin( bgPosY ))) + "px";
		}, 10 );
	}
	
	function hideApp() {
		if( gameLibrary.currentAudio != null ) {
			gameLibrary.currentAudio.pause();
			gameLibrary.currentAudio.currentTime = 0;
		}
		
		$("#underlay > *").css( "display", "block" );
		$("#underlay > #gameAnimatedBackground").css( "display", "none" );
		$("section#" + sectionID + "").css( "display", "none" );
		
		//$("#underlay > #gameAnimatedBackground > div").stop( true, false );
		if( bgAnimInt != null ) {
			clearInterval( bgAnimInt );
			bgAnimInt = null;
		}
	}
	
	function init() {
		isLoaded = false; 
		
		gameList = $("#gameList");
		gameListScroll = new UndockedScrollbar( $("#gameList"), $("#gameListScroll") );
		gameDescrScroll = new UndockedScrollbar( $("#tabGameAboutContent"), $("#tabGameAboutScroll") );
		gameManualScroll = new UndockedScrollbar( $("#tabGameManualContent"), $("#tabGameManualScroll") );
		
		tabs = new TabManager( $("#gameSelectionInfo > nav > div"), $("#gameSelectionInfo > article"), "tabGameAbout", function( tab, allTabs ) {
			const $header = $("#gameSelectionInfo > header");
			
			if( tab == "tabGameControls" || tab == "tabGameManual" ) {
				//$header.addClass( "hidden" );
				$header.slideUp( 200 );
			}
			else {
				//$header.removeClass( "hidden" );
				$header.slideDown( 200 );
			}
			
			gameDescrScroll.Reset();
			gameManualScroll.Reset();
			
			gameListScroll.UpdateVisibility();
			gameDescrScroll.UpdateVisibility();
			gameManualScroll.UpdateVisibility();
		});
		
		gameLibrary = new MSLAppGameLibrary( gameDescrScroll, tabs, gameManualScroll );
		
		$(".gameControllerMap > input").on( "keyup", function( evt ) {
			const $this = $(this);
			
			switch( evt.which ) {
				case 38: evt.key = "▲"; break;
				case 40: evt.key = "▼"; break;
				case 37: evt.key = "◄"; break;
				case 39: evt.key = "►"; break;
			}
			
			$this.attr( "key", evt.which );
			$this.attr( "value", evt.key );
		});
		
		$("#snesControllerMap > *").on( "mouseenter", function() {
			const id = typeof( this.attributes.for ) != "undefined" ? this.attributes.for.value : this.id;
			
			switch( id ) {
			case "snesControlUp": $("#gameControllerImage > .hl").removeClass().addClass( "hl" ).addClass( "up" ); break;
			case "snesControlDown": $("#gameControllerImage > .hl").removeClass().addClass( "hl" ).addClass( "down" ); break;
			case "snesControlLeft": $("#gameControllerImage > .hl").removeClass().addClass( "hl" ).addClass( "left" ); break;
			case "snesControlRight": $("#gameControllerImage > .hl").removeClass().addClass( "hl" ).addClass( "right" ); break;
			case "snesControlLeftBumper": $("#gameControllerImage > .hl").removeClass().addClass( "hl" ).addClass( "leftbumper" ); break;
			case "snesControlRightBumper": $("#gameControllerImage > .hl").removeClass().addClass( "hl" ).addClass( "rightbumper" ); break;
			case "snesControlA": $("#gameControllerImage > .hl").removeClass().addClass( "hl" ).addClass( "a" ); break;
			case "snesControlB": $("#gameControllerImage > .hl").removeClass().addClass( "hl" ).addClass( "b" ); break;
			case "snesControlX": $("#gameControllerImage > .hl").removeClass().addClass( "hl" ).addClass( "x" ); break;
			case "snesControlY": $("#gameControllerImage > .hl").removeClass().addClass( "hl" ).addClass( "y" ); break;
			case "snesControlStart": $("#gameControllerImage > .hl").removeClass().addClass( "hl" ).addClass( "start" ); break;
			case "snesControlSelect": $("#gameControllerImage > .hl").removeClass().addClass( "hl" ).addClass( "select" ); break;
			}
		});
		
		$("#snesControllerMap > *").on( "mouseleave", function() {
			$("#gameControllerImage > .hl").removeClass().addClass( "hl" );
		});
		
		$("#statusGameLobbyMute").on( "click", function() {
			const $this = $(this);
			
			if( $this.hasClass( "muted" ) ) {
				$this.removeClass( "muted" );
				gameLibrary.audioMuted = false;
				
				if( gameLibrary.currentAudio != null ) {
					gameLibrary.currentAudio.play();
				}
				
				Cookies.remove( "statusGameLobbyMute" );
			}
			else {
				$this.addClass( "muted" );
				gameLibrary.audioMuted = true;
				
				if( gameLibrary.currentAudio != null ) {
					gameLibrary.currentAudio.pause();
					gameLibrary.currentAudio.currentTime = 0;
				}
				
				Cookies.set( "statusGameLobbyMute", 1, { expires: 90 } );
			}
		});
		
		if( Cookies.get( "statusGameLobbyMute" ) !== undefined ) {
			$("#statusGameLobbyMute").addClass( "muted" );
			gameLibrary.audioMuted = true;
		}
		else {
			$("#statusGameLobbyMute").removeClass( "muted" );
			gameLibrary.audioMuted = false;
		}
		
		/*lastSearchQuery = "";
		
		// Activate the search control
		$("input.MSLAppGamesSearchCtrl").keypress( function( evt ) {
			if( evt.which == 13 ) {
				MSLGlobals.Audio.play( "button" );
				MSLAppGames.search( $("input.MSLAppGamesSearchCtrl").val() );
				return false;
			}
		});
		
		$("button.MSLAppGamesSearchCtrl").click( function( evt ) {
			MSLGlobals.Audio.play( "button" );
			MSLAppGames.search( $("input.MSLAppGamesSearchCtrl").val() );
			return false;
		});*/
	}
	
	function preload( data ) {
		// if( "undefined" != typeof data.search )
			// lastSearchQuery = data.search;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		isLoaded = true;
		setBackground();
		preload( data, true );
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
	}
	
	return {
		init: init,
		preload: preload,
		load: load,
		open: open,
		close: close,
		
		getTimeOpened: function() {
			return typeof( gameLibrary.timeLastGameOpened ) != "undefined" && gameLibrary.timeLastGameOpened !== null ? gameLibrary.timeLastGameOpened.getTime() : Date.now();
		},
		
		/*search: function( query, toSync ) {
			query = "undefined" != typeof query ? query : "";
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			query = query + "|" + tagsSelectedTags.join( "|" );
			lastSearchQuery = query.split( "|" )[0];
			
			if( toSync && MSLGlobals.sync ) {
				MSLGlobals.sync.send({
					opcode: "games.search",
					query: query
				});
			}
			
			vidsPages.search( query );
			
			$("input.MSLAppGamesSearchCtrl").val( lastSearchQuery );
		},*/
	};
})();

MSLAppManager.register( "games", MSLAppGames, true );