var MSLAppTwitch = (function() {
	var lastQuery;
	var isLoaded;
	var preloadPage;
	
	var history = null;
	var results = new Array;
	var resultsType = "";
	var currentPage = 0;
	var totalPages = 0;
	var resultsPerPage = 8;
	var pagesToFetch = 6;
	var lastPageReached = false;
	var lastFetchedPage = 0;
	
	var apiDefault = "https://api.twitch.tv/helix/streams";
	var apiSearchStream = "https://api.twitch.tv/helix/streams";
	var apiSearchChannel = "https://api.twitch.tv/helix/streams";
	var apiGetGameData = "https://api.twitch.tv/helix/games";
	var using = apiDefault;
	
	function fetchVideos() {
		history.add({
			url: using,
			searchQuery: lastQuery
		});
		
		var joinChar = using.indexOf( "?" ) != -1 ? "&" : "?";
		
		$.ajax({
			url: using + joinChar + "first=47",
			cache: false,
			jsonp: "callback",
			dataType: "json",
			headers: {
				"Client-ID": "pkw88geycwcizxu9ypyczzgmr9gxguh",
				"Authorization": atob( MSLGlobals.Token ),
			},
			
			success: function( data ) {
				var $attachTo = $("section#MSLAppTwitch > main > div.videoResults");
				var $page;
				
				$attachTo.empty();
				
				currentPage = 1;
				totalPages = 0;
				
				var ref = data.data;
				var resultsType = null;
				var result = new Array;
				var games = new Array;
				
				for( var i = 0; i < ref.length; i++ ) {
					var thumbnail = ref[i].thumbnail_url;
					thumbnail = thumbnail.replace( "{width}", "222" );
					thumbnail = thumbnail.replace( "{height}", "124" );
					
					if( ref[i].viewer_count >= 1000 ) {
						ref[i].viewer_count = Math.round( ref[i].viewer_count / 1000 ) + "k";
					}
					
					result.push({
						id: ref[i].user_name,
						thumbnail: thumbnail,
						game: ref[i].game_id,
						viewers: ref[i].viewer_count,
						name: ref[i].title
					});
					
					games.push( ref[i].game_id );
				}
				
				$.ajax({
					url: apiGetGameData + "?id=" + games.join( "&id=" ),
					cache: false,
					jsonp: "callback",
					dataType: "json",
					headers: {
						"Client-ID": "pkw88geycwcizxu9ypyczzgmr9gxguh",
						"Authorization": atob( MSLGlobals.Token ),
					},
					
					success: function( data ) {
						var gameData = data.data;
						
						for( var i = 0; i < result.length; ++i ) {
							var page = Math.floor( i / 8 );
							var lastInRow = i % 4;
							
							if( (i % 8) == 0 ) {
								totalPages++;
								
								$page = $(document.createElement( "div" ));
								$page.attr( "id", "page-" + page );
								$page.addClass( "page" );
								
								if( page > 0 )
									$page.css( "display", "none" );
								
								$attachTo.append( $page );
							}
							
							// Create the required DOM elements for each video result
							var $container = $(document.createElement( "div" ));
							var $thumb = $(document.createElement( "img" ));
							var $titleContainer = $(document.createElement( "div" ));
							var $infoContainer = $(document.createElement( "div" ));
							var $title = $(document.createElement( "p" ));
							var $channel = $(document.createElement( "p" ));
							var $statistics = $(document.createElement( "p" ));
							
							// Link the DOM elements together
							$infoContainer.append( $channel );
							$infoContainer.append( $statistics );
							
							$titleContainer.append( $title );
							
							$container.append( $thumb );
							$container.append( $titleContainer );
							$container.append( $infoContainer );
							
							// Apply attributes and values to the DOM elements
							$container.addClass( "twitchVideoResult" );
							$container.addClass( "videoResult" );
							$titleContainer.addClass( "title" );
							$infoContainer.addClass( "statistics" );
							$thumb.attr( "src", result[i].thumbnail );
							$thumb.addClass( "unselectable" );
							$statistics.text( result[i].viewers + " viewers" );
							
							result[i].name = result[i].name.replace( /(&#39;)/g, "'" )
							
							if( result[i].name.length > 95 ) {
								result[i].name = result[i].name.substr( 0, 88 );
								
								var lastSpace = result[i].name.lastIndexOf( " " );
								
								if( lastSpace != -1 ) {
									result[i].name = result[i].name.substr( 0, lastSpace ) + " [...]";
								}
								else {
									result[i].name = result[i].name + " [...]";
								}
							}
							
							$title.text( result[i].name );
							
							var game = gameData.find( function( game ) { if( game.id == this ) { return true; } return false; }, result[i].game );
							
							if( "undefined" != typeof( game ) ) {
								$channel.text( game.name );
							}
							else {
								$channel.text( "" );
							}
							
							// Attach click event to the container
							$container.attr( "onclick", "MSLAppManager.load( 'twitchWatch', {videoID: '" + result[i].id + "'});" );
							
							$container.on( "mouseenter", function( evt ) {
								MSLGlobals.Audio.play( "hover" );
							});
							
							// Show results of the first page by default
							if( lastInRow == 3 ) {
								$container.addClass( "lastInRow" );
							}
							
							// Present the result to the browser
							$page.append( $container );
						}
						
						checkPageControlAvailability();
						
						// Update the total page indicator
						$("#MSLAppTwitch #currentPageNum").text( currentPage );
						$("#MSLAppTwitch #totalPageNum").text( totalPages );
					}
				});
			}
		});
	}
	
	function checkPageControlAvailability() {
		// Disable NEXT if last page is reached
		if( currentPage == totalPages ) {
			$("#MSLAppTwitch #pageControlNext").removeClass( "active" );
		}
		else {
			$("#MSLAppTwitch #pageControlNext").addClass( "active" );
		}
		
		// Disable PREV is first page is reached
		if( currentPage == 1 ) {
			$("#MSLAppTwitch #pageControlPrev").removeClass( "active" );
		}
		else {
			$("#MSLAppTwitch #pageControlPrev").addClass( "active" );
		}
	}
	
	function page( page, toSync ) {
		page = "undefined" != typeof page ? page : 1;
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		MSLGlobals.Audio.play( "select" );
		
		if( page < 1 ) page = 1;
		if( page > totalPages ) page = totalPages;
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_TWITCH_PAGE,
				value: page
			});
		}
		
		currentPage = page;
		checkPageControlAvailability();
		
		// Hide all video results
		$("#MSLAppTwitch .page").css( "display", "none" );
		
		// Show the video results of our new page
		$("#MSLAppTwitch #page-" + (page-1)).fadeIn();
		
		// Update the current page indicator
		$("#MSLAppTwitch #currentPageNum").text( page );
	}
	
	function nextPage() {
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		// Cannot load more pages than there are available
		if( ++currentPage > totalPages ) {
			currentPage--;
			return;
		}
		
		page( currentPage );
	}
	
	function prevPage() {
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		// Cannot load a page previous to the first one
		if( --currentPage < 1 ) {
			currentPage++;
			return;
		}
		
		page( currentPage );
	}
	
	function back( toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		var to = history.back();
		
		// Can't go further back
		if( to === null )
			return;
		
		MSLGlobals.Audio.play( "back" );
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_TWITCH_BACK
			});
		}
		
		query = to.searchQuery;
		lastQuery = to.searchQuery;
		using = to.url;
		
		fetchVideos();
		
		$("input.MSLAppTwitchSearchCtrl").val( lastQuery ? lastQuery : "" );
	}
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#7F5ACB" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "color" );
		//$("#underlay > #videoBackground").css( "opacity", 1 );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppTwitch").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppTwitch").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		preloadPage = null;
		
		// Bind the page control buttons
		$("#MSLAppTwitch #pageControlPrev").click( function() {
			prevPage();
		});
		
		$("#MSLAppTwitch #pageControlNext").click( function() {
			nextPage();
		});
		
		// Activate the search control
		$("input.MSLAppTwitchSearchCtrl").keypress( function( evt ) {
			if( evt.which == 13 ) {
				MSLGlobals.Audio.play( "button" );
				MSLAppTwitch.search( $("input.MSLAppTwitchSearchCtrl").val() );
				return false;
			}
		});
		
		$("button.MSLAppTwitchSearchCtrl").click( function( evt ) {
			MSLGlobals.Audio.play( "button" );
			MSLAppTwitch.search( $("input.MSLAppTwitchSearchCtrl").val() );
			return false;
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.page )
			preloadPage = data.page;
		
		if( "undefined" != typeof data.search )
			lastQuery = data.search;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		if( reload ) {
			data.search = "undefined" != typeof data.search ? data.search : "";
		}
		
		isLoaded = true;
		preload( data, true );
		
		var query = "undefined" != typeof data.search ? data.search : false;
		using = query !== false && query.length ? apiSearchChannel + "?channel=" + query : apiDefault;
		
		if( !totalPages || reload ) {
			// No videos have been fetched yet
			history = new MSLHistory( $("section#MSLAppTwitch") );
			
			lastQuery = query;
			fetchVideos();
			
			$("input.MSLAppTwitchSearchCtrl").val( query ? query : "" );
		}
		else if( query !== false && query != lastQuery ) {
			// Videos have been fetched already, and the query is different from the last
			lastQuery = query;
			fetchVideos();
			
			$("input.MSLAppTwitchSearchCtrl").val( query ? query : "" );
		}
		
		setBackground();
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
		
		page: page,
		back: back,
		
		search: function( query, toSync ) {
			query = "undefined" != typeof query ? query : "";
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			MSLAppManager.load( "twitchWatch", {videoID: query});
			
			/*if( toSync && MSLGlobals.sync ) {
				MSLGlobals.sync.send({
					c: OPCODE_TWITCH_SEARCH,
					query: query
				});
			}
			
			using = query.length > 0 ? apiSearchChannel + "?channel=" + query : apiDefault;
			lastQuery = query;
			fetchVideos();
			
			$("input.MSLAppTwitchSearchCtrl").val( query );*/
		},
	};
})();

MSLAppManager.register( "twitch", MSLAppTwitch, true );