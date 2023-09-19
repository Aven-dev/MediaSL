var MSLAppYoutubeChannel = (function() {
	var isLoaded;
	var preloadPage;
	
	var history = new Array;
	var lastQuery = "";
	var currentPage;
	var currentQueryId;
	var currentChannel;
	var currentChannelTitle;
	var totalPages = 0;
	
	function addHistory() {
		// Don't add to history if it's the same as previous page
		if( history.length ) {
			var last = history[history.length - 1];
			
			if( last.search == lastQuery )
				return;
		}
		
		history.push({
			search: lastQuery
		});
		
		checkHistoryControlAvailability();
	}
	
	function fetchVideos( query, selectPage ) {
		// Handle optional function parameters
		query = "undefined" == typeof query ? "" : query;
		selectPage = "undefined" == typeof selectPage ? 0 : selectPage;
		
		lastQuery = query;
		
		addHistory();
		
		// Perform the search
		$.ajax({
			method: "GET",
			url: "json/youtubeChannelSearch.php?q=" + encodeURIComponent( query ) + "&id=" + encodeURIComponent( currentQueryId ),
			cache: false
		})
		.done( function( data ) {
			data = JSON.parse( data );
			
			if( data.status != 200 ) {
				console.log( "Failed to retrieve channel data." );
				return;
			}
			
			currentChannel = data.data.channelId;
			currentChannelTitle = data.data.channelTitle;
			
			// Set channel title
			var $channelTitle = $("section#MSLAppYoutubeChannel > header > div.categories");
			$channelTitle.text( data.data.channelTitle );
			
			if( data.data.channelTitle.length > 20 ) {
				$channelTitle.css( "font-size", "16px" );
			}
			else {
				$channelTitle.css( "font-size", "" );
			}
			
			if( "undefined" == typeof data.data.results || data.data.results.length == 0 ) {
				console.log( "Channel has no videos." );
				return;
			}
			
			var videoList = data.data.results;
			var videoListLength = videoList.length;
			var $attachTo = $("section#MSLAppYoutubeChannel > main > div.videoResults");
			var $page;
			
			$attachTo.empty();
			
			currentPage = 1;
			totalPages = 0;
			
			for( var i = 0; i < videoListLength; i++ ) {
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
				var $thumb = $(document.createElement( "div" ));
				var $titleContainer = $(document.createElement( "div" ));
				var $infoContainer = $(document.createElement( "div" ));
				//var $infoContainerLeft = $(document.createElement( "div" ));
				//var $infoContainerRight = $(document.createElement( "div" ));
				var $title = $(document.createElement( "p" ));
				var $channel = $(document.createElement( "p" ));
				var $statistics = $(document.createElement( "p" ));
				
				//$infoContainerLeft.addClass( "left" );
				//$infoContainerRight.addClass( "right" );
				
				// Link the DOM elements together
				$infoContainer.append( $channel );
				$infoContainer.append( $statistics );
				//$infoContainer.append( $infoContainerLeft );
				//$infoContainer.append( $infoContainerRight );
				
				$titleContainer.append( $title );
				
				$container.append( $thumb );
				$container.append( $titleContainer );
				$container.append( $infoContainer );
				
				// Apply attributes and values to the DOM elements
				$container.addClass( "youtubeVideoResult" );
				$container.addClass( "videoResult" );
				$titleContainer.addClass( "title" );
				$infoContainer.addClass( "statistics" );
				$thumb.css( "background-image", "url(" + videoList[i].thumbnail + ")" );
				$thumb.addClass( "thumbnail" );
				$channel.text( videoList[i].channel );
				$statistics.text( videoList[i].published );
				
				videoList[i].title = videoList[i].title.replace( /(&#39;)/g, "'" )
				
				if( videoList[i].title.length > 95 ) {
					videoList[i].title = videoList[i].title.substr( 0, 88 );
					
					var lastSpace = videoList[i].title.lastIndexOf( " " );
					
					if( lastSpace != -1 ) {
						videoList[i].title = videoList[i].title.substr( 0, lastSpace ) + " [...]";
					}
					else {
						videoList[i].title = videoList[i].title + " [...]";
					}
				}
				
				$title.text( videoList[i].title );
				
				if( videoList[i].type == "playlist" ) {
					var $playlistMark = $(document.createElement( "div" ));
					$playlistMark.addClass( "thumbnailTextOverlay" );
					$playlistMark.text( "Playlist" );
					
					$thumb.append( $playlistMark );
					
					// Attach click event to the container
					$container.attr( "onclick", "MSLAppManager.load( 'youtubeWatch', {playlistID: '" + videoList[i].id + "', backOverride: 'youtubeChannel', overrideVar: 'videoID', overrideVal: '" + currentQueryId + "'});" );
				}
				else {
					// Attach click event to the container
					$container.bind( "click", {videoID: videoList[i].id}, function( evt ) {
						MSLAppManager.load( "youtubeWatch", {videoID: evt.data.videoID, backOverride: "youtubeChannel", overrideVar: "videoID", overrideVal: currentQueryId} );
					});
					
					$container.on( "mouseenter", function( evt ) {
						MSLGlobals.Audio.play( "hover" );
					});
					
					if( MSLGlobals.isOwner ) {
						var $fav = $(document.createElement( "div" ));
						$fav.addClass( "fav" );
						var $favContainer = $(document.createElement( "div" ));
						$favContainer.addClass( "icon" );
						$fav.bind( "click", {videoID: videoList[i].id, thumbnail: videoList[i].thumbnail, title: videoList[i].title, channel: videoList[i].channel, published: videoList[i].publishedRaw}, function( evt ) {
							$this = $(this);
							
							$.post( "json/youtubeFavourite.php", {
									uuid: MSLGlobals.uuid,
									videoID: evt.data.videoID,
									thumbnail: evt.data.thumbnail,
									title: evt.data.title,
									channel: evt.data.channel,
									published: evt.data.published
								},
								function( data, status ) {
									data = JSON.parse( data );
									
									if( data.status == 200 ) {
										if( data.data.newStatus ) {
											$this.addClass( "on" );
										}
										else {
											$this.removeClass( "on" );
										}
									}
								}
							);
							
							evt.stopPropagation();
							return false;
						});
						$favContainer.append( $fav );
						$thumb.append( $favContainer );
					}
				}
				
				// Show results of the first page by default
				if( lastInRow == 3 ) {
					$container.addClass( "lastInRow" );
				}
				
				// Present the result to the browser
				$page.append( $container );
				
				checkPageControlAvailability();
				
				// Update the total page indicator
				$("#MSLAppYoutubeChannel #currentPageNum").text( currentPage );
				$("#MSLAppYoutubeChannel #totalPageNum").text( totalPages );
			}
			
			MSLAppYoutubeChannel.page( selectPage );
		});
	}
	
	function checkPageControlAvailability() {
		// Disable NEXT if last page is reached
		if( currentPage == totalPages ) {
			$("#MSLAppYoutubeChannel #pageControlNext").removeClass( "active" );
		}
		else {
			$("#MSLAppYoutubeChannel #pageControlNext").addClass( "active" );
		}
		
		// Disable PREV is first page is reached
		if( currentPage == 1 ) {
			$("#MSLAppYoutubeChannel #pageControlPrev").removeClass( "active" );
		}
		else {
			$("#MSLAppYoutubeChannel #pageControlPrev").addClass( "active" );
		}
	}
	
	function checkHistoryControlAvailability() {
		var button = $("#MSLAppYoutubeChannel > header > div.navBack");
		
		if( history.length > 1 ) {
			button.removeClass( "disabled" );
			button.css( "cursor", "pointer" );
		}
		else {
			button.addClass( "disabled" );
			button.css( "cursor", "auto" );
		}
	}
	
	function page( page, toSync ) {
		page = "undefined" != typeof page ? page : 1;
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( page < 1 ) page = 1;
		if( page > totalPages ) page = totalPages;
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_YOUTUBE_CHANNEL_PAGE,
				value: page
			});
		}
		
		currentPage = page;
		checkPageControlAvailability();
		
		// Hide all video results
		$("#MSLAppYoutubeChannel .page").css( "display", "none" );
		
		// Show the video results of our new page
		$("#MSLAppYoutubeChannel #page-" + (page-1)).fadeIn();
		
		// Update the current page indicator
		$("#MSLAppYoutubeChannel #currentPageNum").text( page );
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
		
		MSLGlobals.Audio.play( "select" );
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
		
		MSLGlobals.Audio.play( "select" );
		page( currentPage );
	}
	
	function back( toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		// Need a minimum of two entries to be able to go back
		if( history.length <= 1 )
			return;
		
		MSLGlobals.Audio.play( "back" );
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_YOUTUBE_CHANNEL_BACK
			});
		}
		
		history.pop();
		
		// Can pop the last one again, as it will be re-added by fetchVideos
		var last = history.pop();
		fetchVideos( last.search );
		
		$("input.MSLAppYoutubeChannelSearchCtrl").val( lastQuery );
		
		checkHistoryControlAvailability();
	}
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#960000" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "color" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppYoutubeChannel").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppYoutubeChannel").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		preloadPage = null;
		
		// Bind the page control buttons
		$("#MSLAppYoutubeChannel #pageControlPrev").click( function() {
			prevPage();
		});
		
		$("#MSLAppYoutubeChannel #pageControlNext").click( function() {
			nextPage();
		});
		
		// Activate the search control
		$("input.MSLAppYoutubeChannelSearchCtrl").keypress( function( evt ) {
			if( evt.which == 13 ) {
				MSLGlobals.Audio.play( "button" );
				MSLAppYoutubeChannel.search( $("input.MSLAppYoutubeChannelSearchCtrl").val() );
				return false;
			}
		});
		
		$("button.MSLAppYoutubeChannelSearchCtrl").click( function( evt ) {
			MSLGlobals.Audio.play( "button" );
			MSLAppYoutubeChannel.search( $("input.MSLAppYoutubeChannelSearchCtrl").val() );
			return false;
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.page )
			preloadPage = data.page;
		
		if( "undefined" != typeof data.search )
			lastQuery = data.search;
		
		if( "undefined" != typeof data.history )
			history = data.history;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		if( reload ) {
			data.search = "undefined" != typeof data.search ? data.search : "";
		}
		
		isLoaded = true;
		setBackground();
		preload( data, true );
		
		var query = "undefined" != typeof data.search ? data.search : false;
		
		if( "undefined" != typeof data.videoID ) {
			// Force a new search if channel changed
			if( currentQueryId != data.videoID ) {
				totalPages = 0;
			}
			
			currentQueryId = data.videoID
		}
		
		if( totalPages == 0 ) {
			query = query !== false ? query : lastQuery;
			
			fetchVideos( query, preloadPage );
			preloadPage = null;
		}
		else if( query !== false ) {
			query = query !== false ? query : "";
			
			fetchVideos( query, preloadPage );
			preloadPage = null;
		}
		
		$("input.MSLAppYoutubeSearchCtrl").val( lastQuery );
		checkHistoryControlAvailability();
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
			
			if( toSync && MSLGlobals.sync ) {
				MSLGlobals.sync.send({
					c: OPCODE_YOUTUBE_CHANNEL_SEARCH,
					query: query
				});
			}
			
			fetchVideos( query );
			
			$("input.MSLAppYoutubeChannelSearchCtrl").val( query );
		},
	};
})();

MSLAppManager.register( "youtubeChannel", MSLAppYoutubeChannel, true );