function MSLPaginator( $results, settings ) {
	var self = this;
	var pages = 0;
	var currentPage = 1;
	var numResults = 0;
	
	this.settings = {
		$controls: null,
		pageContainerType: "div",
		pageContainerClass: null,
		resultsPerPage: 8,
		rows: 2,
		firstAddSpace: 0,
		syncID: null,
		onPageChange: null
	};
	
	// Override default settings recursively, except for protected settings
	// @param1 object		Object of the settings to copy from
	// @param2 object		Object with the settings to copy to
	// @return void
	function recursiveObjectOverride( source, dest ) {
		for( var k in source )
			if( source.hasOwnProperty( k ) )
				if( "protected" == k )
					continue;
				else if( "object" == typeof source[k] && !(source[k] instanceof jQuery) )
					recursiveObjectOverride( source[k], dest[k] );
				else
					dest[k] = source[k];
	}
	
	// Override settings
	recursiveObjectOverride( settings, self.settings );
	
	// Variables used by add() for convenience
	var $page = null;
	var resultsPerRow = Math.floor( this.settings.resultsPerPage / this.settings.rows );
	
	// Set click events on controls if any
	if( this.settings.$controls ) {
		this.settings.$controls.find( ".previousPage" ).on( "click", function() {
			if( --currentPage < 1 ) {
				currentPage++;
				return;
			}
			
			self.page( currentPage );
		});
		
		this.settings.$controls.find( ".nextPage" ).on( "click", function() {
			if( ++currentPage > pages ) {
				currentPage--;
				return;
			}
		
			self.page( currentPage );
		});
	}
	
	function checkControlAvailability() {
		if( !self.settings.$controls )
			return;
		
		// Disable NEXT if last page is reached
		if( currentPage == pages ) {
			self.settings.$controls.find("#pageControlNext").removeClass( "active" );
		}
		else {
			self.settings.$controls.find("#pageControlNext").addClass( "active" );
		}
		
		// Disable PREV if first page is reached
		if( currentPage == 1 ) {
			self.settings.$controls.find("#pageControlPrev").removeClass( "active" );
		}
		else {
			self.settings.$controls.find("#pageControlPrev").addClass( "active" );
		}
		
		// Update the total page indicator
		self.settings.$controls.find("#currentPageNum").text( currentPage );
		self.settings.$controls.find("#totalPageNum").text( pages );
	}
	
	this.clear = function() {
		pages = 0;
		numResults = 0;
		$results.empty();
	}
	
	this.add = function( $DOM ) {
		var page = Math.floor( numResults / this.settings.resultsPerPage );
		var lastInRow = (numResults % resultsPerRow) == resultsPerRow - 1;
		
		if( (numResults % this.settings.resultsPerPage) == 0 ) {
			pages++;
			
			$page = $(document.createElement( this.settings.pageContainerType ))
			$page.attr( "id", "page-" + page );
			$page.addClass( "page" );
			
			if( this.settings.pageContainerClass )
				$page.addClass( this.settings.pageContainerClass );
			
			if( page > 0 )
				$page.css( "display", "none" );
			
			$results.append( $page );
		}
		
		if( lastInRow )
			$DOM.addClass( "lastInRow" );
		
		if( numResults == 0 && this.settings.firstAddSpace ) {
			$DOM.addClass( "special" );
			numResults += this.settings.firstAddSpace;
		}
		else {
			numResults++;
		}
		
		$page.append( $DOM );
		checkControlAvailability();
	}
	
	this.page = function( page, toSync ) {
		page = "undefined" != typeof page ? page : 1;
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		MSLGlobals.Audio.play( "select" );
		
		if( page < 1 ) page = 1;
		if( page > pages ) page = pages;
		
		if( this.settings.syncID && toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: this.settings.syncID,
				value: page
			});
		}
		
		currentPage = page;
		checkControlAvailability();
		
		// Hide all video results
		$results.children( ".page" ).stop( true, true ).css( "display", "none" );
		
		// Show the video results of our new page
		$results.children( "#page-" + (page-1) ).fadeIn();
		
		// Call callback
		if( this.settings.onPageChange )
			this.settings.onPageChange( $results.children( "#page-" + (page-1) ) );
	};
	
	this.search = function( what ) {
		what = "undefined" != typeof what ? what.toLowerCase() : "";
		what = what.split( "|" );
		
		var whatLen = what.length;
		var resultStore = new Array;
		
		// Store all results in a temparary array; remove previous assigned conditions, and detach them
		$results.children( ".page" ).children().each( function() {
			var r = $(this);
			r.removeClass( "hidden" );
			resultStore.push( r );
			r.detach();
		});
		
		var storeLen = resultStore.length;
		
		// Remove all pages
		$results.children( ".page" ).remove();
		
		// Filter results not matching the query, if there is one
		if( whatLen > 1 || what[0].length ) {
			for( var i = 0; i < storeLen; i++ ) {
				var searchData = "undefined" != resultStore[i].attr( "search-data" ) ? resultStore[i].attr( "search-data" ) : "";
				
				// No search data found, skip to the next element
				if( !searchData.length )
					return false;
				
				searchData = searchData.toLowerCase();
				
				// Query is not found in the search data, hide the element
				for( var w = 0; w < whatLen; w++ ) {
					if( searchData.indexOf( what[w] ) == -1 ) {
						resultStore[i].addClass( "hidden" );
						break;
					}
				}
			}
		}
		
		// Redo the page index
		numResults = storeLen;
		currentPage = 1;
		pages = 0;
		
		$page = null
		var appendWhenAvailable = new Array;
		
		var vi = 0;
		for( var i = 0; i < storeLen; i++ ) {
			if( !resultStore[i].hasClass( "hidden" ) ) {
				var curPage = Math.floor( vi / this.settings.resultsPerPage );
				
				if( (vi % this.settings.resultsPerPage) == 0 ) {
					pages++;
					
					$page = $(document.createElement( this.settings.pageContainerType ))
					$page.attr( "id", "page-" + curPage );
					$page.addClass( "page" );
					
					if( this.settings.pageContainerClass )
						$page.addClass( this.settings.pageContainerClass );
					
					if( curPage > 0 )
						$page.css( "display", "none" );
					
					if( appendWhenAvailable.length ) {
						var len = appendWhenAvailable.length;
						
						for( var a = 0; a < len; a++ ) {
							$page.append( appendWhenAvailable[a] );
						}
						
						appendWhenAvailable = new Array;
					}
					
					$results.append( $page );
				}
				
				vi++;
			}
			
			if( $page ) {
				$page.append( resultStore[i] );
			}
			else {
				appendWhenAvailable.push( resultStore[i] );
			}
		}
		
		// No results at all
		if( appendWhenAvailable.length ) {
			$page = $(document.createElement( this.settings.pageContainerType ))
			$page.attr( "id", "page-0" );
			$page.addClass( "page" );
			$page.css( "display", "none" );
			
			if( this.settings.pageContainerClass )
				$page.addClass( this.settings.pageContainerClass );
			
			var len = appendWhenAvailable.length;
			
			for( var a = 0; a < len; a++ ) {
				$page.append( appendWhenAvailable[a] );
			}
			
			appendWhenAvailable = new Array;
			$results.append( $page );
		}
		
		checkControlAvailability();
	};
	
	this.getContainer = function() {
		return $results;
	};
	
	this.pageByProperty = function( property, val ) {
		$results.find( "section" ).each( function() {
			var $result = $(this);
			
			// Exit if property is not found
			if( "undefined" == typeof $result.attr( property ) )
				return false;
			
			// Continue to next if property doesn't match
			if( $result.attr( property ) != val )
				return true;
			
			var goToPage = parseInt( $result.parent().attr( "id" ).split( "-" )[1] ) + 1;
			self.page( goToPage );
			
			// Don't search further than our first match
			return false;
		});
	};
	
	this.getCurrentPageByLastProperty = function( property ) {
		var lastChild = $results.children( "#page-" + (currentPage - 1) ).first().children().last();
		
		return "undefined" == typeof lastChild.attr( property ) ? "undefined" : lastChild.attr( property );
	};
}