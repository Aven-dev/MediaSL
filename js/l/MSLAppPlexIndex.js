var MSLAppPlexIndex = (function() {
	const sectionID = "MSLAppPlexIndex";
	
	var isLoaded;
	var childAppData = null;
	var mediaID = null;
	var mediaData = null;
	
	var screenMan = null;
	var indexScroll = null;
	var indexDom = null;
	
	var $headerNavBack = null;
	var $headerSearchDiv = null;
	var $headerSearchInput = null;
	
	var movieSummaryScroll = null;
	var showSeasonScroll = null
	var showEpisodeScroll = null
	
	var dAppSection = null;
	
	var dMovieSection = null;
	var dMovieArt = null;
	var dMovieTitle = null;
	var dMovieYear = null;
	var dMovieStudio = null;
	var dMovieRating = null;
	var dMovieDirectors = null;
	var dMovieWriters = null;
	var dMovieGenres = null;
	var dMovieDuration = null;
	var dMovieSummary = null;
	var dMoviePlayButton = null;
	
	var showScreenVis = null;
	var dShowSection = null;
	var dShowArt = null;
	var dShowTitle = null;
	var dShowYear = null;
	var dShowStudio = null;
	var dShowSummary = null;
	var dShowSeasonList = null;
	var dShowEpisodeList = null;
	
	function render() {
		//indexScroll.Reset();
		//indexScroll.UpdateVisibility();
	}
	
	function setBackground() {
		//$("#underlay > #videoBackground").css( "backgroundColor", "#333" );
		//$("#underlay > #videoBackground").css( "mix-blend-mode", "normal" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#" + sectionID + "").fadeIn(0);
		
		movieSummaryScroll.MoveByContent();
	}
	
	function hideApp() {
		$("section#" + sectionID + "").css( "display", "none" );
	}
	
	function loadImage( item, removeObserver ) {
		if( removeObserver )
			observer.unobserve( item );
		
		const img = item.getElementsByTagName( "img" )[0];
		
		if( img && img.hasAttribute( "data-src" ) ) {
			new Promise( (resolve, reject) => {
				const imgLoader = new Image();
				
				imgLoader.addEventListener( "load", function() {
					resolve( imgLoader );
				});
				
				imgLoader.addEventListener( "error", function() {
					reject();
				});
				
				imgLoader.src = "https://images.plex.tv/photo?scale=1&size=medium-240&url=" + encodeURIComponent( img.getAttribute( "data-src" ) );
			})
			.then( function( imgLoader ) {
				img.setAttribute( "src", imgLoader.getAttribute( "src" ) );
				img.removeAttribute( "data-src" );
				
				if( img.ref ) {
					img.ref.ThumbLoaded = true;
				}
			})
			.catch( function( e ) {
				img.parentNode.remove();
			});
		}
	}
	
	function init() {
		isLoaded = false;
		childAppData = null;
		backgroundVideo = $("#underlay > video")[0];
		backgroundVideoSource = $("#underlay > video > source")[0];
		
		$headerNavBack = $("section#MSLAppPlexIndex > header > .navBack");
		$headerSearchDiv = $("section#MSLAppPlexIndex > header > .search");
		$headerSearchInput = $headerSearchDiv.children( "input.MSLAppPlexIndexFilterCtrl" );
		
		screenMan = new VisibilityManager( $("section#" + sectionID + " > main > section") );
		showScreenVis = new VisibilityManager( $("div#plexShowDetailsList > section") );
		movieSummaryScroll = new UndockedScrollbar( $("#plexMovieDetailsSummary"), $("#plexMovieDetailsSummaryScroll") );
		showSeasonScroll = new UndockedScrollbar( $("#plexShowSeasonList"), $("#plexShowSeasonListScroll") );
		showEpisodeScroll = new UndockedScrollbar( $("#plexShowEpisodeList"), $("#plexShowEpisodeListScroll") );
		indexDom = document.getElementById( "plexIndex" );
		
		$categoriesButton = $("#MSLAppPlexIndex > header > div.categories");
		
		dAppSection = document.getElementById( "MSLAppPlexIndex" );
		dMovieSection = document.getElementById( "plexMovieDetails" );
		dMovieArt = document.getElementById( "plexMovieDetailsArt" );
		dMovieTitle = document.getElementById( "plexMovieDetailsTitle" );
		dMovieYear = document.getElementById( "plexMovieDetailsYear" );
		dMovieStudio = document.getElementById( "plexMovieDetailsStudio" );
		dMovieRating = document.getElementById( "plexMovieDetailsRating" );
		dMovieDirectors = document.getElementById( "plexMovieDetailsDirectors" );
		dMovieWriters = document.getElementById( "plexMovieDetailsWriters" );
		dMovieGenres = document.getElementById( "plexMovieDetailsGenres" );
		dMovieDuration = document.getElementById( "plexMovieDetailsDuration" );
		dMovieSummary = document.getElementById( "plexMovieDetailsSummary" );
		dMoviePlayButton = document.getElementById( "plexMoviePlayButton" );
		
		dShowSection = document.getElementById( "plexShowDetails" );
		dShowArt = document.getElementById( "plexShowDetailsInfo" );
		dShowTitle = document.getElementById( "plexShowDetailsTitle" );
		dShowYear = document.getElementById( "plexShowDetailsYear" );
		dShowStudio = document.getElementById( "plexShowDetailsStudio" );
		dShowSummary = document.getElementById( "plexShowDetailsSummary" );
		dShowSeasonList = document.getElementById( "plexShowSeasonList" );
		dShowEpisodeList = document.getElementById( "plexShowEpisodeList" );
		
		dMoviePlayButton.addEventListener( "click", () => {
			if( mediaID ) {
				MSLAppManager.load( "plexWatch", {
					ID: mediaID,
				});
			}
		});
		
		// Activate the fitler control
		/*$("input.MSLAppPlexFilterCtrl").on( "keyup", function( evt ) {
			let val = $(this).val();
			val = val.trim();
			filter = val.toLowerCase().split( /[\s,\.-:;]+/ );
			
			render();
		});
		
		$("button.MSLAppGamesSearchCtrl").click( function( evt ) {
			let val = $("input.MSLAppPlexFilterCtrl").val();
			val = val.trim();
			filter = val.toLowerCase().split( /[\s,\.-:;]+/ );
			
			render();
			return false;
		});*/
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.mediaID )
			mediaID = data.mediaID;
	}
	
	function joinUpToFitInOneLineOfSpecifiedWidth( arr, glue, target, width ) {
		if( arr.length == 0 )
			return "";
		
		let buffer = arr[0];
		
		// Gather font data
		const style = getComputedStyle( target );
		
		// Build canvas
		const canvas = this.canvas || (this.canvas = document.createElement( "canvas" ));
		const context = canvas.getContext( "2d" );
		context.font = style.fontWeight + " " + style.fontSize + " '" + style.fontFamily + "'";
		
		// Calculate text length
		for( let i = 1; i < arr.length; ++i ) {
			const prebuffer = buffer + glue + arr[i];
			
			if( context.measureText( prebuffer ).width > width ) {
				break;
			}
			
			buffer = prebuffer;
		}
		
		return buffer;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		isLoaded = true;
		setBackground();
		preload( data, true );
		
		screenMan.SetAll( false );
		showScreenVis.SetAll( false );
		
		mediaData = null;
		
		$.ajax({
			method: "GET",
			url: "json/plexFetchEpisodes.php?id=" + mediaID,
			cache: true
		})
		.done( function( data ) {
			data = JSON.parse( data );
			
			if( !data || data.status != 200 || !data?.message?.Title?.length ) {
				//TODO: Show error if no data present already.
				return;
			}
			
			mediaData = data.message;
			
			if( mediaData.Type == "movie" ) {
				goToMovieIndex();
			}
			else {
				// Find out if there's more than one season in this show
				mediaData.hasMoreThanOneSeason = false;
				for( let i = 1; i < mediaData.Episodes.length; ++i ) {
					if( mediaData.Episodes[i].s != mediaData.Episodes[0].s ) {
						mediaData.hasMoreThanOneSeason = true;
						break;
					}
				}
				
				goToShowSeasonIndex();
			}
		});
		
		dMovieArt.style.backgroundImage = dShowArt.style.backgroundImage = "none";
		dMovieArt.classList.remove( "loaded" );
		dShowArt.classList.remove( "loaded" );
		
		showApp();
	}
	
	function goToMovieIndex() {
		drawMovieAndShowCover();
		$headerSearchDiv.removeClass( "disabled" ).addClass( "disabled" );
		$headerSearchInput.removeAttr( "disabled" ).attr( "disabled", true ).val("").off();
		
		$categoriesButton.text( "Movie" );
		dAppSection.classList.add( "movie" );
		dAppSection.classList.remove( "show" );
		
		$headerNavBack.off().on( "click", () => {
			MSLAppManager.load( "plex" );
		});
		
		screenMan.SetByID( "plexMovieDetails" );
		movieSummaryScroll.MoveByContent();
	}
	
	function goToShowSeasonIndex() {
		// If there's only one show, skip the season view
		if( !mediaData.hasMoreThanOneSeason ) {
			goToShowEpisodeIndex( mediaData.Episodes[0].s );
			return;
		}
		
		drawMovieAndShowCover();
		drawSeasonList();
		$headerSearchDiv.removeClass( "disabled" ).addClass( "disabled" );
		$headerSearchInput.removeAttr( "disabled" ).attr( "disabled", true ).val("").off();
		
		$headerNavBack.off().on( "click", () => {
			MSLAppManager.load( "plex" );
		});
		
		$categoriesButton.text( "Show" );
		dAppSection.classList.remove( "movie" );
		dAppSection.classList.add( "show" );
		
		screenMan.SetByID( "plexShowDetails" );
		showSeasonScroll.MoveByContent();
	}
	
	function goToShowEpisodeIndex( season ) {
		drawMovieAndShowCover();
		
		drawEpisodeList( season );
		
		$headerSearchDiv.removeClass( "disabled" );
		$headerSearchInput.removeAttr( "disabled" ).val("");
		
		$headerSearchInput.off().on( "keyup", () => {
			drawEpisodeList( season, $headerSearchInput.val() );
		});
		
		if( mediaData.hasMoreThanOneSeason ) {
			$headerNavBack.off().on( "click", () => {
				MSLGlobals.Audio.play( "start" );
				goToShowSeasonIndex();
				
				MSLGlobals.sync.send({
					c: OPCODE_PASSTHROUGH,
					a: 0
				});
			});
		}
		else {
			$headerNavBack.off().on( "click", () => {
				MSLAppManager.load( "plex" );
			});
		}
		
		$categoriesButton.text( "Show" );
		dAppSection.classList.remove( "movie" );
		dAppSection.classList.add( "show" );
		
		screenMan.SetByID( "plexShowDetails" );
		showEpisodeScroll.MoveByContent();
	}
	
	function drawMovieAndShowCover() {
		if( !mediaData )
			return;
		
		// Set info that is guaranteed
		dMovieTitle.innerText = dShowTitle.innerText = mediaData.Title;
		dMovieYear.innerText = dShowYear.innerText = mediaData.Year;
		
		// Set the prominent cover art
		dMovieArt.style.backgroundImage = dShowArt.style.backgroundImage = "none";
		dMovieArt.classList.remove( "loaded" );
		dShowArt.classList.remove( "loaded" );
		
		if( mediaData.Art ) {
			asyncLoadImagePromise( mediaData.Art ).then( ( url ) => {
				dMovieArt.style.backgroundImage = "url('" + url + "')";
				dShowArt.style.backgroundImage = "linear-gradient(to bottom, rgba(0,0,0, 0.3), rgb(0, 0, 0)), url('" + url + "')";
				dMovieArt.classList.add( "loaded" );
				dShowArt.classList.add( "loaded" );
			});
		}
		
		// Set studio(s)
		if( mediaData.Studio ) {
			dMovieStudio.innerText = joinUpToFitInOneLineOfSpecifiedWidth( mediaData.Studio.split( ", " ), ", ", dMovieStudio, 580 );
			dShowStudio.innerText = joinUpToFitInOneLineOfSpecifiedWidth( mediaData.Studio.split( ", " ), ", ", dShowStudio, 245 );
			
			dMovieStudio.style.display = dShowStudio.style.display = "block";
		} else {
			dMovieStudio.style.display = dShowStudio.style.display = "none";
		}
		
		// Set director(s)
		if( mediaData.Director ) {
			dMovieDirectors.getElementsByTagName( "strong" )[0].innerText = mediaData.Director;
			dMovieDirectors.style.display = "block";
		} else { dMovieDirectors.style.display = "none"; }
		
		// Set writer(s)
		if( mediaData.Writer ) {
			dMovieWriters.getElementsByTagName( "strong" )[0].innerText = mediaData.Writer;
			dMovieWriters.style.display = "block";
		} else { dMovieWriters.style.display = "none"; }
		
		// Set genre(s)
		dMovieGenres.innerHTML = "";
		if( mediaData.Genre ) {
			const genres = mediaData.Genre.split( ", " );
			for( let i = 0; i < genres.length; ++i ) {
				const li = document.createElement( "li" );
				li.innerText = genres[i];
				
				dMovieGenres.append( li );
			}
		}
		
		// Set duration in minutes
		if( mediaData.Duration ) {
			dMovieDuration.innerText = (mediaData.Duration / 60 / 1000) +" min";
			dMovieDuration.style.display = "block";
		} else { dMovieDuration.style.display = "none"; }
		
		// Set rating, which is presented in stars
		if( mediaData.Rating ) {
			dMovieRating.setAttribute( "rating", parseInt( mediaData.Rating ) );
		} else { dMovieRating.setAttribute( "rating", "5" ); }
		
		// Set summary
		const summary = document.createElement( "p" );
		summary.innerText = dShowSummary.innerText = mediaData.Summary ?? "";
		dMovieSummary.innerHTML = "";
		dMovieSummary.append( summary );
	}
	
	function drawSeasonList() {
		if( !mediaData )
			return;
		
		showScreenVis.SetAll( false );
		
		const seasons = new Array;
		
		for( let i = 0; i < mediaData.Episodes.length; ++i ) {
			if( seasons.indexOf( mediaData.Episodes[i].s ) == -1 ) {
				seasons.push( mediaData.Episodes[i].s );
			}
		}
		
		seasons.sort( (a, b) => {
			a = parseInt( a );
			b = parseInt( b );
			
			return a == 0 || a > b ? 1 : a < b ? -1 : 0;
		});
		
		const ul = document.createElement( "ul" );
		
		for( let i = 0; i < seasons.length; ++i ) {
			const li = document.createElement( "li" );
			
			if( seasons[i] == "0" ) {
				li.innerText = "Specials";
			}
			else {
				li.innerText = "Season " + seasons[i];
			}
			
			li.addEventListener( "click", () => {
				MSLGlobals.Audio.play( "start" );
				goToShowEpisodeIndex( seasons[i] );
				
				MSLGlobals.sync.send({
					c: OPCODE_PASSTHROUGH,
					a: 1,
					v: seasons[i]
				});
			});
			
			ul.append( li );
		}
		
		dShowSeasonList.innerHTML = "";
		dShowSeasonList.append( ul );
		
		showScreenVis.SetByID( "plexShowSeasons" );
		showSeasonScroll.MoveByContent();
	}
	
	function drawEpisodeList( season, filter = null ) {
		if( !mediaData || !mediaData.Episodes[season] )
			return;
		
		showScreenVis.SetAll( false );
		dShowEpisodeList.innerHTML = "";
		
		for( let i = 0; i < mediaData.Episodes.length; ++i ) {
			if( mediaData.Episodes[i].s != season )
				continue;
			
			if( filter != null ) {
				const num = parseInt( filter );
				
				if( !isNaN( num ) && num == filter ) {
					if( mediaData.Episodes[i].e != num )
						continue;
				}
				else if( mediaData.Episodes[i].title.toLowerCase().indexOf( filter.toLowerCase() ) == -1 ) {
					continue;
				}
			}
			
			const dContainer = document.createElement( "div" );
			const dHeader = document.createElement( "header" );
			const dFooter = document.createElement( "footer" );
			
			if( mediaData.Episodes[i].thumb ) {
				asyncLoadImagePromise( mediaData.Art ).then( ( url ) => {
					dContainer.style.backgroundImage = "url('" + mediaData.Episodes[i].thumb + "')";
					dContainer.classList.remove( "artless" );
				}).catch( () => {
					dContainer.style.backgroundImage = "";
					dContainer.classList.add( "artless" );
				});
			}
			else {
				dContainer.classList.add( "artless" );
			}
			
			dHeader.innerText = mediaData.Episodes[i].e;
			dFooter.innerText = mediaData.Episodes[i].title;
			
			dContainer.addEventListener( "click", () => {
				MSLAppManager.load( "plexWatch", {
					ID: mediaID,
					s: mediaData.Episodes[i].s,
					e: mediaData.Episodes[i].e
				});
			});
			
			dContainer.append( dHeader );
			dContainer.append( dFooter );
			dShowEpisodeList.append( dContainer );
		}
		
		showScreenVis.SetByID( "plexShowEpisodes" );
		showEpisodeScroll.MoveByContent();
	}
	
	function open() {
		if( !isLoaded ) {
			if( childAppData ) {
				load( childAppData );
			}
			else {
				load();
			}
		}
		
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
		back: function(){},
		
		setChildAppData: function( data ) {
			childAppData = data;
		},
		
		passedThroughData: function( data ) {
			if( "undefined" != typeof data.a ) {
				if( data.a == 0 ) {
					goToShowSeasonIndex();
				}
				else if( data.a == 1 && "undefined" != typeof data.v ) {
					goToShowEpisodeIndex( data.v );
				}
			}
		}
	};
})();

MSLAppManager.register( "plexIndex", MSLAppPlexIndex, true );