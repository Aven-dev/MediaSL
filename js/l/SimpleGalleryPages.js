function SimpleGalleryPages( root, parent, syncID, resultsPerRow, numRows ) {
	var self = this;
	var currentPage = 1;
	var totalPages = 0;
	var itemCount = 0;
	var $parent = null;
	
	this.checkPageControlAvailability = function() {
		// Disable NEXT if last page is reached
		if( currentPage == totalPages ) {
			$("#" + root + " #pageControlNext").removeClass( "active" );
		}
		else {
			$("#" + root + " #pageControlNext").addClass( "active" );
		}
		
		// Disable PREV is first page is reached
		if( currentPage == 1 ) {
			$("#" + root + " #pageControlPrev").removeClass( "active" );
		}
		else {
			$("#" + root + " #pageControlPrev").addClass( "active" );
		}
	};
	
	this.goToPage = function( page, toSync ) {
		page = "undefined" != typeof page ? page : 1;
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( page < 1 ) page = 1;
		if( page > totalPages ) page = totalPages;
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: syncID,
				value: page
			});
		}
		
		currentPage = page;
		self.checkPageControlAvailability();
		
		// Hide all video results
		$("#" + root + " .page").css( "display", "none" );
		
		// Show the video results of our new page
		$("#" + root + " .page-" + (page-1)).fadeIn();
	};
	
	this.nextPage = function() {
		// Cannot load more pages than there are available
		if( ++currentPage > totalPages ) {
			currentPage--;
			return;
		}
		
		self.goToPage( currentPage );
	};
	
	this.prevPage = function() {
		// Cannot load a page previous to the first one
		if( --currentPage < 1 ) {
			currentPage++;
			return;
		}
		
		self.goToPage( currentPage );
	};
	
	this.add = function( $item ) {
		var page = Math.floor( itemCount / (resultsPerRow * numRows) );
		var lastInRow = itemCount % resultsPerRow;
		
		// Determine what page this item is
		if( (itemCount % (resultsPerRow * numRows)) == 0 )
			totalPages++;
		
		$item.addClass( "page" );
		$item.addClass( "page-" + page );
		
		if( page > 0 )
			$item.css( "display", "none" );
		
		// Show results of the first page by default
		if( lastInRow == resultsPerRow - 1 )
			$item.addClass( "lastInRow" );
		
		if( $parent == null )
			$parent = $( "#" + parent );
		
		$parent.append( $item );
		self.checkPageControlAvailability();
		
		itemCount++;
	};
	
	this.clear = function() {
		currentPage = 1;
		totalPages = 0;
		itemCount = 0;
		
		if( $parent != null )
			$parent.empty();
	};
}