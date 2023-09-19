function MSLHistory( $section ) {
	var history = new Array;
	
	if( "undefined" == typeof equalObjectsQuick ) {
		function equalObjectsQuick( obj1, obj2 ) {
			return JSON.stringify( obj1 ) == JSON.stringify( obj2 );
		}
	}
	
	/*
	Adds an entry to the history list, but only if that item isn't the same as the last entry on the list
	@param1 mixed	Page parameters variable
	@return void
	*/
	this.add = function( params ) {
		// Don't add if params is equal to last entry
		if( history.length ) {
			var last = history[history.length - 1];
			
			if( equalObjectsQuick( last, params ) )
				return false;
		}
		
		history.push( params );
		this.checkAvailability();
	};
	
	/*
	Pops one entry from the end of the history list and returns the then-last entry
	@param1 void
	@return object	The new last entry in the history list, NULL if last entry was popped
	*/
	this.back = function() {
		if( history.length <= 1 )
			return null;
		
		history.pop();
		this.checkAvailability();
		
		return history[history.length - 1];
	};
	
	/*
	Pops one entry from the end of the history list and returns the then-last entry
	@param1 void
	@return object	The new last entry in the history list, NULL if last entry was popped
	*/
	this.clear = function() {
		history = new Array;
	};
	
	/*
	Updates the back button to project history availability
	@param1 void
	@return void
	*/
	this.checkAvailability = function() {
		var button = $section.find( "header > div.navBack" ).first();
		
		if( history.length > 1 ) {
			button.removeClass( "disabled" );
			button.css( "cursor", "pointer" );
		}
		else {
			button.addClass( "disabled" );
			button.css( "cursor", "auto" );
		}
	};
}