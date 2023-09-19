var MSLAppAdult = (function() {
	var isLoaded;
	var preloadPage;
	
	var history = new Array;
	var categories = new Array;
	var lastQuery = "";
	var lastCategory = 0;
	var currentPage;
	var totalPages = 0;
	var tagsPages;
	
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
			url: "data/adultCategories.json"
		})
		.done( function( catList ) {
			var catListLength = catList.length;
			
			for( var i = 0; i < catListLength; i++ ) {
				categories.push( catList[i] );
				
				var $tag = $(document.createElement( "li" ));
				
				$tag.attr( "id", catList[i] );
				$tag.text( catList[i] );
				
				$tag.on( "click", function() { MSLAppAdult.category( $(this).attr("id") ); } );
				
				tagsPages.add( $tag );
			}
			
			categories.push( {id: 0, title: "None"} );
		});
	}
	
	function fetchVideos( query, category, selectPage ) {
		// Handle optional function parameters
		query = "undefined" == typeof query ? "" : query;
		category = "undefined" == typeof category ? "" : category;
		selectPage = "undefined" == typeof selectPage ? null : selectPage;
		
		// Don't perform the same search again
		// if( query == lastQuery )
			// return;
		
		if( category == "none" )
			category = "";
		
		lastQuery = query;
		lastCategory = category;
		
		addHistory();
		
		// Perform the search
		$.ajax({
			method: "GET",
			url: "json/adultSearch.php?q=" + encodeURIComponent( query ) + "&t=" + category
		})
		.done( function( data, status ) {
			if( status != "success" )
				data = "[]";
			
			var videoList = JSON.parse( data );
			var videoListLength = videoList.length;
			var $attachTo = $("section#MSLAppAdult > main > div.videoResults");
			var $page;
			
			$attachTo.empty();
			
			currentPage = 1;
			totalPages = 0;
			
			if( videoListLength != 0 ) {
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
					var $thumbImg = $(document.createElement( "img" ));
					var $titleContainer = $(document.createElement( "div" ));
					var $infoContainer = $(document.createElement( "div" ));
					var $title = $(document.createElement( "p" ));
					var $channel = $(document.createElement( "p" ));
					var $statistics = $(document.createElement( "p" ));
					
					// Link the DOM elements together
					$infoContainer.append( $channel );
					$infoContainer.append( $statistics );
					
					$titleContainer.append( $title );
					
					$thumb.addClass( "imgSlideshow" );
					$thumb.append( $thumbImg );
					$container.append( $thumb );
					$container.append( $titleContainer );
					$container.append( $infoContainer );
					
					// Apply attributes and values to the DOM elements
					$container.addClass( "youtubeVideoResult" );
					$container.addClass( "videoResult" );
					$titleContainer.addClass( "title" );
					$infoContainer.addClass( "statistics" );
					$title.text( videoList[i].title );
					$channel.text( videoList[i].views + " views" );
					$statistics.text( videoList[i].published );
					
					$thumbImg.attr( "src", videoList[i].thumbnail );
					$thumbImg.addClass( "unselectable" );
					
					var x = 0;
					for( var x = 0; x < videoList[i].thumbSequences; x++ ) {
						$thumb.append( $document.createElement( "img" ).addClass( "unselectable" ).attr( "src", videoList[i].thumbSequences[x] ) );
					}
					
					// Attach click event to the container
					$container.attr( "onclick", "MSLAppManager.load( 'adultWatch', {videoID: '" + videoList[i].id + "'});" );
					
					$container.on( "mouseenter", function( evt ) {
						MSLGlobals.Audio.play( "hover" );
					});
					
					// Show results of the first page by default
					if( lastInRow == 3 ) {
						$container.addClass( "lastInRow" );
					}
					
					// Present the result to the browser
					$page.append( $container );
					
					checkPageControlAvailability();
					
					// Update the total page indicator
					$("#MSLAppAdult > footer #currentPageNum").text( currentPage );
					$("#MSLAppAdult > footer #totalPageNum").text( totalPages );
				}
			}
			else {
				// No videos available / RedTube is down
				const $err = $(document.createElement( "div" ));
				$err.addClass( "criticalAppError" );
				
				const $errBody = $(document.createElement( "div" ))
				
				const $errHdr = $(document.createElement( "h1" ));
				$errHdr.text( "RedTube API is down :(" );
				
				const $errTxt = $(document.createElement( "p" ));
				$errTxt.text( "This should only be temporary. We do not know for how long. Please try again later. In the mean time, you can probably still visit RedTube through the Browser App (www.redtube.com)." );
				
				$errBody.append( $errHdr );
				$errBody.append( $errTxt );
				$err.append( $errBody );
				
				$attachTo.append( $err );
			}
			
			//var $attachTo = $("section#MSLAppAdult > main#categories > div.tagResults");
			//var numCategories = categories.length;
			
			//$attachTo.empty();
			
			// var $closeButton = $(document.createElement( "div" ));
			// $closeButton.addClass( "close" );
			// $closeButton.text( "[x]" );
			// $closeButton.click(function() {
				// $("section#MSLAppAdult > main > ul.categoryResults").hide();
			// });
			// $attachTo.append( $closeButton );
			
			/*for( var i = 0; i < numCategories; i++ ) {
				if( "object" == typeof categories[i] )
					continue;
				
				$cat = $(document.createElement( "li" ));
				$cat.text( categories[i] );
				
				$cat.attr( "onclick", "MSLAppAdult.category('" + categories[i] + "')" );
				
				$attachTo.append( $cat );
			}*/
			
			if( selectPage !== null ) {
				MSLAppAdult.page( selectPage );
			}
		});
	}
	
	function checkPageControlAvailability() {
		// Disable NEXT if last page is reached
		if( currentPage == totalPages ) {
			$("#MSLAppAdult #pageControlNext").removeClass( "active" );
		}
		else {
			$("#MSLAppAdult #pageControlNext").addClass( "active" );
		}
		
		// Disable PREV is first page is reached
		if( currentPage == 1 ) {
			$("#MSLAppAdult #pageControlPrev").removeClass( "active" );
		}
		else {
			$("#MSLAppAdult #pageControlPrev").addClass( "active" );
		}
	}
	
	function checkHistoryControlAvailability() {
		var button = $("#MSLAppAdult > header > div.navBack");
		
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
		
		MSLGlobals.Audio.play( "select" );
		
		if( page < 1 ) page = 1;
		if( page > totalPages ) page = totalPages;
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_ADULT_PAGE,
				value: page
			});
		}
		
		currentPage = page;
		checkPageControlAvailability();
		
		// Hide all video results
		$("#MSLAppAdult .page").css( "display", "none" );
		
		// Show the video results of our new page
		$("#MSLAppAdult #page-" + (page-1)).fadeIn();
		
		// Update the current page indicator
		$("#MSLAppAdult > footer #currentPageNum").text( page );
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
		
		// Need a minimum of two entries to be able to go back
		if( history.length <= 1 )
			return;
		
		MSLGlobals.Audio.play( "back" );
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_ADULT_BACK
			});
		}
		
		history.pop();
		
		// Can pop the last one again, as it will be re-added by fetchVideos
		var last = history.pop();
		fetchVideos( last.search, last.category );
		
		$("input.MSLAppAdultSearchCtrl").val( lastQuery );
		setCategoryTitleFromId( lastCategory );
		
		checkHistoryControlAvailability();
	}
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#000000" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "color" );
		//$("#underlay > #videoBackground").css( "opacity", 1 );
		//$("#underlay > video").css( "filter", "brightness(0.5)" );
		//$("#underlay > video").css( "-webkit-filter", "brightness(0.5)" );
	}
	
	function showApp() {
		$("section#MSLAppAdult > main").css( "display", "none" );
		$("section#MSLAppAdult > main#main").css( "display", "" );
		$("section#MSLAppAdult > footer > .pageControls").css( "display", "" );
		$("body > section").css( "display", "none" );
		$("section#MSLAppAdult").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppAdult").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		preloadPage = null;
		
		// Fetch Youtube categories
		fetchCategories();
		
		tagsPages = new MSLPaginator( $("#MSLAppAdult > main#categories > div.tagResults"), {
			$controls: $("#MSLAppAdult > main#categories > .pageControls"), 
			resultsPerPage: 48, 
			rows: 1, 
			pageContainerType: "ul",
			pageContainerClass: "tags"
			});
		
		// Bind the page control buttons
		$("#MSLAppAdult > footer #pageControlPrev").click( function() {
			prevPage();
		});
		
		$("#MSLAppAdult > footer #pageControlNext").click( function() {
			nextPage();
		});
		
		// Activate the search control
		$("input.MSLAppAdultSearchCtrl").keypress( function( evt ) {
			if( evt.which == 13 ) {
				MSLAppAdult.search( $("input.MSLAppAdultSearchCtrl").val() );
				return false;
			}
		});
		
		$("button.MSLAppAdultSearchCtrl").click( function( evt ) {
			MSLAppAdult.search( $("input.MSLAppAdultSearchCtrl").val() );
			return false;
		});
		
		$("section#MSLAppAdult > header > div.categories").on( "click", MSLAppAdult.categoryButtonCallback );
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.page )
			preloadPage = data.page;
		
		if( "undefined" != typeof data.search )
			lastQuery = data.search;
		
		if( "undefined" != typeof data.category )
			lastCategory = data.category;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		if( reload ) {
			data.search = "undefined" != typeof data.search ? data.search : "";
			data.category = "undefined" != typeof data.category ? data.category : 0;
		}
		
		isLoaded = true;
		setBackground();
		preload( data, true );
		
		var query = "undefined" != typeof data.search ? data.search : false;
		var category = "undefined" != typeof data.category ? data.category : false;
		
		if( totalPages == 0 ) {
			query = query !== false ? query : lastQuery;
			category = category !== false ? category : lastCategory;
			
			fetchVideos( query, category, preloadPage );
			preloadPage = null;
		}
		else if( query !== false || category !== false ) {
			query = query !== false ? query : "";
			category = category !== false ? category : 0;
			
			fetchVideos( query, category, preloadPage );
			preloadPage = null;
		}
		
		if( !query )
			query = "";
		
		$("input.MSLAppAdultSearchCtrl").val( lastQuery );
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
		if( !id || id == "none" ) {
			$("#MSLAppAdult > header > div.categories").text( "Categories" );
			return;
		}
		
		var i = categories.length;
		
		while( i-- ) {
			if( categories[i] != id )
				continue;
			
			$("#MSLAppAdult > header > div.categories").text( categories[i] );
			break;
		}
	}
	
	function categoryListContextOpen() {
		MSLGlobals.Audio.play( "button" );
		
		$("section#MSLAppAdult > header > div.navButton").css( "opacity", ".4" ).css( "pointer-events", "none" );
		$("section#MSLAppAdult > header > div.appLogo").css( "opacity", ".4" ).css( "pointer-events", "none" );
		$("section#MSLAppAdult > header > div.search").css( "opacity", ".4" ).css( "pointer-events", "none" );
		$("section#MSLAppAdult > main#main").css( "display", "none" );
		$("section#MSLAppAdult > footer > div.pageControls").css( "display", "none" );
		$("section#MSLAppAdult > main#categories").css( "display", "block" );
	}
	
	function categoryListContextClose() {
		MSLGlobals.Audio.play( "button" );
		
		$("section#MSLAppAdult > header > div.navButton").css( "opacity", "1" ).css( "pointer-events", "" );
		$("section#MSLAppAdult > header > div.appLogo").css( "opacity", "1" ).css( "pointer-events", "" );
		$("section#MSLAppAdult > header > div.search").css( "opacity", "1" ).css( "pointer-events", "" );
		$("section#MSLAppAdult > main#main").css( "display", "block" );
		$("section#MSLAppAdult > footer > div.pageControls").css( "display", "block" );
		$("section#MSLAppAdult > main#categories").css( "display", "none" );
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
			
			MSLGlobals.Audio.play( "button" );
			
			if( toSync && MSLGlobals.sync ) {
				MSLGlobals.sync.send({
					c: OPCODE_ADULT_SEARCH,
					query: query
				});
			}
			
			fetchVideos( query, lastCategory );
			
			$("input.MSLAppAdultSearchCtrl").val( query );
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
					c: OPCODE_ADULT_CATEGORY,
					category: cat
				});
			}
			
			fetchVideos( lastQuery, cat );
			
			$("#MSLAppAdult > main > ul.categoryResults").hide();
			categoryListContextClose();
			
			setCategoryTitleFromId( cat );
		},
		
		categoryButtonCallback: function() {
			if( $("section#MSLAppAdult > main#main").css( "display" ) == "none" ) {
				// Invisible category prompt
				categoryListContextClose();
			}
			else {
				// Visible category prompt
				categoryListContextOpen();
			}
		},
	};
})();

MSLAppManager.register( "adult", MSLAppAdult, true );