// Attach dynamic menu functionality to a HMTL grid object
function GridMenu( $gridObj, $pageObj, columns, rows ) {
	var maxResultsPerPage = columns * rows;
	var currentPage = 0;
	var maxPage = 0;
	var collection = new Array;
	
	// Shows whether this menu has any items
	// @param1 void
	// @return boolean	Whether this menu has any items
	this.hasAny = function() {
		return collection.length > 0;
	}
	
	// Go to next page
	// @param1 void
	// @return void
	this.nextPage = function() {
		this.gotoPage( currentPage + 1 );
	}
	
	// Go to previous page
	// @param1 void
	// @return void
	this.prevPage = function() {
		this.gotoPage( currentPage - 1 );
	}
	
	// Go to specified page
	// @param1 Page number
	// @return void
	this.gotoPage = function( page ) {
		if( page < 0 || page > maxPage )
			return;
		
		MSLGlobals.Audio.play( "select" );
		
		currentPage = page;
		this.render();
	}
	
	// Gets length of collection
	// @param1 void
	// @return Length of collection with given search terms
	this.getCollectionLength = function() {
		if( $(".MSLAppBookmarkSearchCtrl").val().length == 0 )
			return collection.length;
		
		var count = 0;
		
		for( var i = 0; i < collection.length; i++ ) {
			if( this.matchesSearchTerm( collection[i] ) )
				count++;
		}
		
		return count;
	}
	
	// Whether collection item matches the search term
	// @param1 void
	// @return Whether collection item matches the search term
	this.matchesSearchTerm = function( $item ) {
		if( $(".MSLAppBookmarkSearchCtrl").val().length == 0 )
			return true;
		
		var name = $item.children(".text").first().children("h5").first().text();
		var url = $item.children(".text").first().children("p").first().text();
		
		if( name.indexOf( $(".MSLAppBookmarkSearchCtrl").val() ) != -1 )
			return true;
		
		if( url.indexOf( $(".MSLAppBookmarkSearchCtrl").val() ) != -1 )
			return true;
		
		return false;
	}
	
	// Renders the collection into a visible menu
	// @param1 void
	// @return void
	this.render = function() {
		var self = this;
		this.clearMenu();
		
		maxPage = Math.floor( (this.getCollectionLength() - 1) / maxResultsPerPage );
		
		for( var i = currentPage * maxResultsPerPage; i < collection.length && i < currentPage * maxResultsPerPage + maxResultsPerPage; i++ ) {
			if( this.matchesSearchTerm( collection[i] ) )
				$gridObj.append( collection[i] );
		}
		
		if( maxPage > 0 ) {
			for( var i = 0; i <= maxPage; i++ ) {
				$bullet = $(document.createElement( "div" ));
				
				if( i == currentPage ) {
					$bullet.addClass( "selected" );
				}
				else {
					$bullet.attr( "goto", i );
					
					$bullet.on( "click", function() {
						self.gotoPage( $(this).attr( "goto" ) );
					});
				}
				$pageObj.append( $bullet );
			}
		}
	}
	
	// Adds an item to the collection
	// @param1 void
	// @return void
	this.addItem = function( item ) {
		collection.push( item );
	}
	
	// Clears the visible menu
	// @param1 void
	// @return void
	this.clearMenu = function() {
		$gridObj.empty();
		$pageObj.empty();
	}

	// Clears the collection inside the grid menu
	// @param1 void
	// @return void
	this.clearCollection = function() {
		collection = new Array;
		currentPage = 0;
		maxPage = 0;
	}
}