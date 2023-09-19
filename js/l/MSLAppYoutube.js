var MSLAppYoutube = (function() {
	var isLoaded;
	var preloadPage;
	
	var actionLimiter = new ActionLimiter( 3, 30 );
	var actionMessage = null;
	var history = new Array;
	var categories = new Array;
	var lastQuery = "";
	var lastCategory = 0;
	var lastType = 3;
	var currentPage;
	var totalPages = 0;
	var favoritedVideos = new Array;
	
	function addHistory() {
		// Don't add to history if it's the same as previous page
		if( history.length ) {
			var last = history[history.length - 1];
			
			if( last.search == lastQuery && last.category == lastCategory )
				return;
		}
		
		history.push({
			search: lastQuery,
			category: lastCategory
		});
		
		checkHistoryControlAvailability();
	}
	
	function fetchCategories() {
		$.ajax({
			method: "GET",
			url: "data/youtubeCategories.json"
		})
		.done( function( catList ) {
			var catListLength = catList.length;
			
			for( var i = 0; i < catListLength; i++ ) {
				categories.push( catList[i] );
			}
			
			categories.push( {id: 0, title: "None"} );
		});
	}
	
	function fetchFavouriteVideos( query, category, selectPage ) {
		// Handle optional function parameters
		query = "undefined" == typeof query ? "" : query;
		category = "undefined" == typeof category ? 0 : parseInt( category );
		selectPage = "undefined" == typeof selectPage ? 0 : selectPage;
		
		$.ajax({
			method: "GET",
			url: "json/youtubeSearchFavs.php?uuid=" + MSLGlobals.uuid + "&q=" + encodeURIComponent( query ),
			cache: false
		})
		.done( function( data ) {
			data = JSON.parse( data );
			
			if( data.status == 200 ) {
				var videoList = data.data.videos;
				var videoListLength = data.data.count;
				var $attachTo = $("section#MSLAppYoutube > main > div.videoResults");
				var $page;
				
				$attachTo.empty();
				
				currentPage = 1;
				totalPages = 0;
				
				for( var i = 0; i < videoListLength + 1; i++ ) {
					
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
					
					if( i == 0 ) {
						// Create "Play All" container
						var $container = $(document.createElement( "div" ));
						var $buttonText = $(document.createElement( "h1" ));
						var $buttonImage = $(document.createElement( "div" ));
						var $buttonStats = $(document.createElement( "div" ));
						var $buttonStatsQuery = $(document.createElement( "p" ));
						var $buttonStatsResults = $(document.createElement( "p" ));
						
						$container.addClass( "playall" ).addClass( "videoResult" );
						$buttonImage.addClass( "image" );
						$buttonStats.addClass( "stats" );
						$buttonStatsResults.addClass( "small" );
						
						var btnQry = query.length ? query : "Favorites";
						
						$buttonText.text( "Play all" );
						$buttonStatsQuery.html( "&quot;" + btnQry + "&quot;" );
						$buttonStatsResults.text( videoListLength + " Videos" );
						
						// Attach click event to the container
						$container.bind( "click", {videoList: videoList, videoListLength: videoListLength}, function( evt ) {
							var playlist = new Array;
							
							for( var x = 0; x < videoListLength; x++ ) {
								if( videoList[x].id.length < 30 )
									playlist.push( videoList[x].id );
							}
							
							playlist = playlist.join( "," );
							
							MSLAppManager.load( "youtubeWatch", {videoID: playlist} );
						});
						
						$buttonStats.append( $buttonStatsQuery );
						$buttonStats.append( $buttonStatsResults );
						$container.append( $buttonText );
						$container.append( $buttonImage );
						$container.append( $buttonStats );
						$page.append( $container );
						continue;
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
					$thumb.css( "background-image", "url(" + videoList[i - 1].thumbnail + ")" );
					$thumb.addClass( "thumbnail" );
					$channel.text( videoList[i - 1].channel );
					$statistics.text( videoList[i - 1].published );
					
					videoList[i - 1].title = videoList[i - 1].title.replace( /(&#39;)/g, "'" )
					
					if( videoList[i - 1].title.length > 95 ) {
						videoList[i - 1].title = videoList[i - 1].title.substr( 0, 88 );
						
						var lastSpace = videoList[i - 1].title.lastIndexOf( " " );
						
						if( lastSpace != -1 ) {
							videoList[i - 1].title = videoList[i - 1].title.substr( 0, lastSpace ) + " [...]";
						}
						else {
							videoList[i - 1].title = videoList[i - 1].title + " [...]";
						}
					}
					
					$title.text( videoList[i - 1].title );
					
					if( videoList[i - 1].id.length > 30 ) {
						// This is a playlist
						var $playlistMark = $(document.createElement( "div" ));
						$playlistMark.addClass( "thumbnailTextOverlay" );
						$playlistMark.text( "Playlist" );
						
						$container.on( "mouseenter", function( evt ) {
							MSLGlobals.Audio.play( "hover" );
						});
						
						$thumb.append( $playlistMark );
						
						// Attach click event to the container
						$container.attr( "onclick", "MSLAppManager.load( 'youtubeWatch', {playlistID: '" + videoList[i - 1].id + "'});" );
					}
					else {
						// Attach click event to the container
						$container.bind( "click", {videoID: videoList[i - 1].id}, function( evt ) {
							MSLAppManager.load( "youtubeWatch", {videoID: evt.data.videoID} );
						});
					}
					
					if( MSLGlobals.isOwner ) {
						// Add favourite remove button
						var $fav = $(document.createElement( "div" ));
						$fav.addClass( "fav" ).addClass( "on" );
						var $favContainer = $(document.createElement( "div" ));
						$favContainer.addClass( "icon" );
						
						$fav.bind( "click", {videoID: videoList[i - 1].id}, function( evt ) {
							$this = $(this);
							
							if( evt.data.videoID.length < 30 ) {
								$.post( "json/youtubeFavourite.php", {
										uuid: MSLGlobals.uuid,
										videoID: evt.data.videoID,
										forceRemove: true
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
							}
							else {
								$.post( "json/youtubeFavourite.php", {
										uuid: MSLGlobals.uuid,
										playlistID: evt.data.videoID,
										forceRemove: true
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
							}
							
							evt.stopPropagation();
							return false;
						});
						$favContainer.append( $fav );
						$thumb.append( $favContainer );
					}
					
					// Show results of the first page by default
					if( lastInRow == 3 ) {
						$container.addClass( "lastInRow" );
					}
					
					// Present the result to the browser
					$page.append( $container );
					
					checkPageControlAvailability();
					
					// Update the total page indicator
					$("#MSLAppYoutube #currentPageNum").text( currentPage );
					$("#MSLAppYoutube #totalPageNum").text( totalPages );
				}
				
				var $attachTo = $("section#MSLAppYoutube > main > ul.categoryResults");
				var numCategories = categories.length;
				
				var $fav = $(document.createElement( "li" ));
				$fav.addClass( "fav" );
				$fav.text( "My Favorites" );
				$fav.click( function() {
					MSLAppYoutube.category( -1 );
				});
				
				$attachTo.empty();
				$attachTo.append( $fav );
				
				// var $closeButton = $(document.createElement( "div" ));
				// $closeButton.addClass( "close" );
				// $closeButton.text( "[x]" );
				// $closeButton.click(function() {
					// $("section#MSLAppYoutube > main > ul.categoryResults").hide();
				// });
				// $attachTo.append( $closeButton );
				$cat = $(document.createElement( "li" ));
				$cat.text( "All" );
				$cat.attr( "onclick", "MSLAppYoutube.category(0)" );
				$attachTo.append( $cat );
				
				for( var i = 0; i < numCategories; i++ ) {
					$cat = $(document.createElement( "li" ));
					
					if( categories[i].id == 0 )
						continue;
					
					$cat.text( categories[i].title );
					$cat.attr( "onclick", "MSLAppYoutube.category(" + categories[i].id + ")" );
					
					$attachTo.append( $cat );
				}
				
				MSLAppYoutube.page( 0 );
			}
		});
	}
	
	function fetchVideos( query, category, type, selectPage ) {
		// Handle optional function parameters
		query = "undefined" == typeof query ? "" : query;
		category = "undefined" == typeof category ? 0 : parseInt( category );
		type = "undefined" == typeof type ? 1 : type;
		selectPage = "undefined" == typeof selectPage ? 0 : selectPage;
		
		// Don't perform the same search again
		//if( query == lastQuery && category == lastCategory && type == lastType )
		//	return;
		
		lastQuery = query;
		lastCategory = category;
		lastType = type;
		
		addHistory();
		
		// Fetch favourites instead
		if( category == -1 ) {
			fetchFavouriteVideos( query, category, selectPage );
			return;
		}
		
		// Ensure type is selected based on search
		$("#MSLAppYoutubeSearchTypeCtrl").attr( "value", type );
		
		// Perform the search
		$.ajax({
			method: "GET",
			url: "json/youtubeSearch.php?q=" + encodeURIComponent( query ) + "&c=" + category + "&t=" + type + "&uuid=" + MSLGlobals.uuid
		})
		.done( function( data ) {
			var json = JSON.parse( data );
			var videoList = new Array;
			var favIdList = new Array;
			
			var $attachTo = $("section#MSLAppYoutube > main > div.videoResults");
			$attachTo.empty();
			
			if( "undefined" != typeof json.error && json.error == "QUOTA_EXCEEDED" ) {
				$error = $(document.createElement( "div" ));
				
				$error.addClass( "errorMessage" );
				$error.html( "<p>YouTube's API is currently overloaded, please try again later.</p><p>You may still enter a video's URL in the search bar above to watch through this applet. Alternatively, you may use the Web Browser from the main menu to manually head over to YouTube's website.</p><p>Apologies for the inconveniences as we look towards resolving YouTube's latest limitations.</p>" );
				
				$attachTo.append( $error );
				return;
			}
			
			if( typeof( json.results ) == "undefined" ) {
				if( json.length ) {
					videoList = json;
				}
			}
			else {
				var videoList = json.results;
				var favIdList = json.favorites;
			}
			
			var videoListLength = videoList.length;
			var favIdListLength = favIdList.length;
			var $page;
			
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
					
					$container.on( "mouseenter", function( evt ) {
						MSLGlobals.Audio.play( "hover" );
					});
					
					$thumb.append( $playlistMark );
					
					if( MSLGlobals.isOwner ) {
						var $fav = $(document.createElement( "div" ));
						$fav.addClass( "fav" );
						
						if( undefined != favIdList.find( function( v ) { return v == videoList[i].id; } ) ) {
							$fav.addClass( "on" );
						}
						
						var $favContainer = $(document.createElement( "div" ));
						$favContainer.addClass( "icon" );
						$fav.bind( "click", {videoID: videoList[i].id, thumbnail: videoList[i].thumbnail, title: videoList[i].title, channel: videoList[i].channel, published: videoList[i].publishedRaw}, function( evt ) {
							$this = $(this);
							
							$.post( "json/youtubeFavourite.php", {
									uuid: MSLGlobals.uuid,
									playlistID: evt.data.videoID,
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
					
					// Attach click event to the container
					$container.attr( "onclick", "MSLAppManager.load( 'youtubeWatch', {playlistID: '" + videoList[i].id + "'});" );
				}
				else {
					// Attach click event to the container
					$container.bind( "click", {videoID: videoList[i].id}, function( evt ) {
						MSLAppManager.load( "youtubeWatch", {videoID: evt.data.videoID} );
					});
					
					$container.on( "mouseenter", function( evt ) {
						MSLGlobals.Audio.play( "hover" );
					});
					
					if( MSLGlobals.isOwner ) {
						var $fav = $(document.createElement( "div" ));
						$fav.addClass( "fav" );
						
						if( undefined != favIdList.find( function( v ) { return v == videoList[i].id; } ) ) {
							$fav.addClass( "on" );
						}
						
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
				$("#MSLAppYoutube #currentPageNum").text( currentPage );
				$("#MSLAppYoutube #totalPageNum").text( totalPages );
			}
			
			var $attachTo = $("section#MSLAppYoutube > main > ul.categoryResults");
			var numCategories = categories.length;
			
			var $fav = $(document.createElement( "li" ));
			$fav.addClass( "fav" );
			$fav.text( "My Favorites" );
			$fav.click( function() {
				MSLAppYoutube.category( -1 );
			});
			
			$attachTo.empty();
			$attachTo.append( $fav );
			
			// var $closeButton = $(document.createElement( "div" ));
			// $closeButton.addClass( "close" );
			// $closeButton.text( "[x]" );
			// $closeButton.click(function() {
				// $("section#MSLAppYoutube > main > ul.categoryResults").hide();
			// });
			// $attachTo.append( $closeButton );
			$cat = $(document.createElement( "li" ));
			$cat.text( "All" );
			$cat.attr( "onclick", "MSLAppYoutube.category(0)" );
			$attachTo.append( $cat );
			
			for( var i = 0; i < numCategories; i++ ) {
				$cat = $(document.createElement( "li" ));
				
				if( categories[i].id == 0 )
					continue;
				
				$cat.text( categories[i].title );
				$cat.attr( "onclick", "MSLAppYoutube.category(" + categories[i].id + ")" );
				
				$attachTo.append( $cat );
			}
			
			MSLAppYoutube.page( selectPage );
		});
	}
	
	function checkPageControlAvailability() {
		// Disable NEXT if last page is reached
		if( currentPage == totalPages ) {
			$("#MSLAppYoutube #pageControlNext").removeClass( "active" );
		}
		else {
			$("#MSLAppYoutube #pageControlNext").addClass( "active" );
		}
		
		// Disable PREV is first page is reached
		if( currentPage == 1 ) {
			$("#MSLAppYoutube #pageControlPrev").removeClass( "active" );
		}
		else {
			$("#MSLAppYoutube #pageControlPrev").addClass( "active" );
		}
	}
	
	function checkHistoryControlAvailability() {
		var button = $("#MSLAppYoutube > header > div.navBack");
		
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
				c: OPCODE_YOUTUBE_PAGE,
				value: page
			});
		}
		
		currentPage = page;
		checkPageControlAvailability();
		
		// Hide all video results
		$("#MSLAppYoutube .page").css( "display", "none" );
		
		// Show the video results of our new page
		$("#MSLAppYoutube #page-" + (page-1)).fadeIn();
		
		// Update the current page indicator
		$("#MSLAppYoutube #currentPageNum").text( page );
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
				c: OPCODE_YOUTUBE_BACK,
			});
		}
		
		history.pop();
		
		// Can pop the last one again, as it will be re-added by fetchVideos
		var last = history.pop();
		fetchVideos( last.search, last.category, last.type );
		
		$( "#MSLAppYoutubeSearchInputCtrl").val( lastQuery );
		$( "#MSLAppYoutubeSearchTypeCtrl").val( lastType );
		setCategoryTitleFromId( lastCategory );
		
		checkHistoryControlAvailability();
	}
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#960000" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "color" );
		//$("#underlay > #videoBackground").css( "opacity", 1 );
		//$("#underlay > video").css( "filter", "brightness(0.5)" );
		//$("#underlay > video").css( "-webkit-filter", "brightness(0.5)" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppYoutube").fadeIn();
	}
	
	function hideApp() {
		actionMessage.Hide();
		$("section#MSLAppYoutube").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		preloadPage = null;
		
		actionMessage = new ActionMessage( $("#MSLAppYoutubeSearchInputCtrl"), function( $content ) {
			const current = actionLimiter.getCurrentTimestamp();
			const expires = actionLimiter.getTimeEarliestExpire();
			const ttl = expires - current;
			
			if( ttl < 0 ) {
				actionMessage.Hide();
			}
			else if( ttl > 1 ) {
				$content.find( "#ttl" ).text( ttl + " seconds" );
			}
			else {
				$content.find( "#ttl" ).text( "1 second" );
			}
		}, 1000 );
		
		// Fetch Youtube categories
		fetchCategories();
		
		// Bind the page control buttons
		$("#MSLAppYoutube #pageControlPrev").click( function() {
			prevPage();
		});
		
		$("#MSLAppYoutube #pageControlNext").click( function() {
			nextPage();
		});
		
		// Activate the search control
		$("#MSLAppYoutubeSearchInputCtrl").keypress( function( evt ) {
			if( evt.which == 13 ) {
				MSLGlobals.Audio.play( "button" );
				MSLAppYoutube.search( $("#MSLAppYoutubeSearchInputCtrl").val(), $("#MSLAppYoutubeSearchTypeCtrl").attr( "value" ) );
				return false;
			}
		});
		
		$("#MSLAppYoutubeSearchButtonCtrl").click( function( evt ) {
			MSLGlobals.Audio.play( "button" );
			MSLAppYoutube.search( $("#MSLAppYoutubeSearchInputCtrl").val(), $("#MSLAppYoutubeSearchTypeCtrl").attr( "value" ) );
			return false;
		});
		
		// Activate the type toggle
		$("#MSLAppYoutubeSearchTypeCtrl").click( function( evt ) {
			const self = $(this);
			
			if( self.attr( "value" ) == 1 ) {
				self.attr( "value", "2" );
			}
			else {
				self.attr( "value", "1" );
			}
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.page )
			preloadPage = data.page;
		
		if( "undefined" != typeof data.search )
			lastQuery = data.search;
		
		if( "undefined" != typeof data.category )
			lastCategory = data.category;
		
		if( "undefined" != typeof data.history )
			history = data.history;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		if( reload ) {
			data.search = "undefined" != typeof data.search ? data.search : "";
			data.category = "undefined" != typeof data.category ? data.category : 0;
			data.type = "undefined" != typeof data.type ? data.type : 1;
		}
		
		isLoaded = true;
		setBackground();
		preload( data, true );
		
		var query = "undefined" != typeof data.search ? data.search : false;
		var category = "undefined" != typeof data.category ? data.category : false;
		var type = "undefined" != typeof data.type ? data.type : 1;
		
		if( totalPages == 0 ) {
			query = query !== false ? query : lastQuery;
			category = category !== false ? category : lastCategory;
			
			fetchVideos( query, category, type, preloadPage );
			preloadPage = null;
		}
		else if( query !== false || category !== false ) {
			query = query !== false ? query : "";
			category = category !== false ? category : 0;
			
			fetchVideos( query, category, type, preloadPage );
			preloadPage = null;
		}
		
		$("#MSLAppYoutubeSearchInputCtrl").val( lastQuery );
		setCategoryTitleFromId( lastCategory );
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
	
	function setCategoryTitleFromId( id ) {
		id = +id || 0;
		
		if( id == -1 ) {
			$("#MSLAppYoutube > header > div.categories").text( "Favorites" );
			return;
		}
		
		if( id == 0 ) {
			$("#MSLAppYoutube > header > div.categories").text( "Favorites & Categories" );
			return;
		}
		
		var i = categories.length;
		
		while( i-- ) {
			if( categories[i].id != id )
				continue;
			
			$("#MSLAppYoutube > header > div.categories").text( categories[i].title );
			break;
		}
	}
	
	function categoryListContextOpen() {
		MSLGlobals.Audio.play( "button" );
		
		$("section#MSLAppYoutube > header > div.navButton").css( "opacity", ".4" ).css( "pointer-events", "none" );
		$("section#MSLAppYoutube > header > div.appLogo").css( "opacity", ".4" ).css( "pointer-events", "none" );
		$("section#MSLAppYoutube > header > div.search").css( "opacity", ".4" ).css( "pointer-events", "none" );
		$("section#MSLAppYoutube > main > div.videoResults").css( "display", "none" );
		$("section#MSLAppYoutube > footer > div.pageControls").css( "display", "none" );
	}
	
	function categoryListContextClose() {
		MSLGlobals.Audio.play( "button" );
		
		$("section#MSLAppYoutube > header > div.navButton").css( "opacity", "1" ).css( "pointer-events", "" );
		$("section#MSLAppYoutube > header > div.appLogo").css( "opacity", "1" ).css( "pointer-events", "" );
		$("section#MSLAppYoutube > header > div.search").css( "opacity", "1" ).css( "pointer-events", "" );
		$("section#MSLAppYoutube > main > div.videoResults").css( "display", "block" );
		$("section#MSLAppYoutube > footer > div.pageControls").css( "display", "block" );
		$("section#MSLAppYoutube > main > ul.categoryResults").css( "display", "none" );
	}
	
	return {
		init: init,
		preload: preload,
		load: load,
		open: open,
		close: close,
		
		page: page,
		back: back,
		
		search: function( query, type, toSync ) {
			query = "undefined" != typeof query ? query : "";
			type = "undefined" != typeof type ? type : 1;
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			query = query.trim();
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			// Check if query is a youtube URL
			var ytWatchDirectly = null;
			var youtubeURL = document.createElement( "a" );
			youtubeURL.href = query;
			
			if( youtubeURL.hostname.substr( 0, 7 ) == "youtube" || youtubeURL.hostname.substr( 0, 11 ) == "www.youtube" ) {
				var ytParams = youtubeURL.search.substr( 1 );
				var ytParts = ytParams.split( "&" );

				for( var i = 0; i < ytParts.length; i++ ) {
					var ytPairs = ytParts[i].split( "=" );
				  
				  if( ytPairs[0] == "v" ) {
					ytWatchDirectly = ytPairs[1];
					break;
				  }
				}
			}
			
			if( ytWatchDirectly ) {
				MSLAppManager.load( "youtubeWatch", { videoID: ytWatchDirectly } );
				$("#MSLAppYoutubeSearchInputCtrl").val( "" );
				$("#MSLAppYoutubeSearchTypeCtrl").attr( "value", 1 );
			}
			else {
				if( actionLimiter.add() ) {
					if( toSync && MSLGlobals.sync ) {
						MSLGlobals.sync.send({
							c: OPCODE_YOUTUBE_SEARCH,
							query: query,
							type: type
						});
					}
					
					fetchVideos( query, lastCategory, type );
					$("#MSLAppYoutubeSearchInputCtrl").val( query );
					$("#MSLAppYoutubeSearchTypeCtrl").attr( "value", type );
				}
				else {
					actionMessage.Show( "You have attempted too many searches in a short period of time! <strong>Please wait <span id=\"ttl\">30 seconds</span></strong> before attempting your next search." );
				}
			}
			
			categoryListContextClose();
		},
		
		category: function( cat, toSync ) {
			cat = "undefined" != typeof cat ? cat : 0;
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			if( toSync && MSLGlobals.sync ) {
				MSLGlobals.sync.send({
					c: OPCODE_YOUTUBE_CATEGORY,
					category: cat
				});
			}
			
			fetchVideos( lastQuery, cat, 1 );
			
			$("#MSLAppYoutube > main > ul.categoryResults").hide();
			categoryListContextClose();
			
			setCategoryTitleFromId( cat );
		},
		
		categoryButtonCallback: function() {
			if( $("section#MSLAppYoutube > main > ul.categoryResults").css( "display" ) == "none" ) {
				// Invisible category prompt
				categoryListContextClose();
			}
			else {
				// Visible category prompt
				categoryListContextOpen();
				$("section#MSLAppYoutube > main > ul.categoryResults").css( "display", "flex" );
			}
		},
	};
})();

MSLAppManager.register( "youtube", MSLAppYoutube, true );