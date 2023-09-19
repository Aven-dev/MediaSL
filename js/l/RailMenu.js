function RailMenuTMCentered( menuObj, visibleFrom, visibleTo, oldSelection, newSelection ) {
	var delta = newSelection - oldSelection;
	
	var m_$parent = menuObj.m_$parent;
	var m_collection = menuObj.m_collection;
	var m_filtered = menuObj.m_filtered;
	var m_shown = menuObj.m_shown;
	var settings = menuObj.settings;
	
	// The construct, automatically called upon instancing of this class
	// @param1 void
	// @return void
	function construct() {
		if( settings.layout == "horizontal" ) {
			if( delta < 0 ) {
				left();
				menuObj.oldDirection = -1;
			}
			else {
				right();
				menuObj.oldDirection = 1;
			}
		}
		else {
			if( delta < 0 ) {
				up();
				menuObj.oldDirection = -1;
			}
			else {
				down();
				menuObj.oldDirection = 1;
			}
		}
	}
	
	// Calculates how many item-lengths the menu should shift in the 'previous' direction (selection goes up or left)
	// @param1 void
	// @return boolean		TRUE when menu should be shifted. FALSE when there is nothing to do
	function calculatePrevDelta() {
		var startTerminator = Math.floor( settings.numToDisplay / 2 );
		
		// If the new seleciton is outside the start terminator boundary, modify the delta
		if( newSelection <= startTerminator ) {
			// Both the old and new selection are outside the boundary, so do nothing
			if( oldSelection <= startTerminator ) {
				delta = 0;
				return false;
			}
			
			// The delta surpasses the start terminator partially, so subtract that part
			delta = startTerminator - oldSelection;
		}
		
		var endTerminator = m_filtered[m_filtered.length - 1] - startTerminator;
		
		// If the old seleciton is outside the end terminator boundary, modify the delta
		if( oldSelection > endTerminator ) {
			// Both the old and new selection are outside the boundary, so do nothing
			if( newSelection > endTerminator ) {
				delta = 0;
				return false;
			}
			
			// The delta surpasses the end terminator partially, so subtract that part
			delta = newSelection - endTerminator;
		}
		
		return true;
	}
	
	// Calculates how many item-lengths the menu should shift in the 'next' direction (selection goes down or right)
	// @param1 void
	// @return boolean		TRUE when menu should be shifted. FALSE when there is nothing to do
	function calculateNextDelta() {
		var startTerminator = Math.floor( settings.numToDisplay / 2 );
		
		// If the old selection is outside the start terminator boundary, modify the delta
		if( oldSelection <= startTerminator ) {
			// Don't do anything if the new selection is within the start terminator boundary
			if( oldSelection + delta - startTerminator <= 0 ) {
				delta = 0;
				return false;
			}
			
			// The delta surpasses the start terminator partially, so subtract that part
			delta = oldSelection + delta - startTerminator;
		}
		
		return true;
	}
	
	// The selection goes left, meaning the menu shifts right
	// @param1 void
	// @return void
	function left() {
		if( !calculatePrevDelta() )
			return;
		
		// Hurry the animation of previous direction
		if( menuObj.oldDirection == 1 )
			m_$parent.children().stop( true, true );
		
		for( var i = -1; i >= delta; i-- ) {
			// Don't handle anything outside of the filtered range
			if( visibleFrom + i < 0 )
				break;
			
			// Add new item to the beginning of the list (outside the visible box)
			m_shown.unshift( m_filtered[visibleFrom + i] );
			m_collection[m_shown[0]].$DOM.css( "margin-left", settings.itemSize * -1 );
			m_$parent.prepend( m_collection[m_shown[0]].$DOM );
			
			// Animate the first item to move inside the visible box
			m_collection[m_shown[0]].$DOM.animate({
				"margin-left": 0
			}, {
				duration: settings.transitionSpeed,
				queue: false,
				
				complete: function() {
					// Remove the old item from the DOM
					m_$parent.children().last().detach();
				}
			});
			
			// Remove item from the shown list
			m_shown.pop();
		}
	}
	
	// The selection goes right, meaning the menu shifts left
	// @param1 void
	// @return void
	function right() {
		if( !calculateNextDelta() )
			return;
		
		// Hurry the animation of previous direction
		if( menuObj.oldDirection == -1 )
			m_$parent.children().stop( true, true );
		
		for( var i = 1; i <= delta; i++ ) {
			// Don't handle anything outside of the filtered range
			if( visibleTo + i >= m_filtered.length )
				break;
			
			// Add new item to the end of the list (outside the visible box)
			m_$parent.append( m_collection[m_filtered[visibleTo + i]].$DOM );
			//REMOVE:m_shown.push( m_shown[m_shown.length - 1] + 1 );
			m_shown.push( m_filtered[visibleTo + i] );
			
			// Animate the first item to move outside the visible box, and then remove it from shown list
			m_collection[m_shown.shift()].$DOM.animate({
				"margin-left": settings.itemSize * -1
			}, {
				duration: settings.transitionSpeed,
				queue: false,
				
				complete: function() {
					// The first item is now outside the visible box, so detach it from the DOM
					$(this).detach();
				}
			});
		}
	}
	
	// The selection goes up, meaning the menu shifts down
	// @param1 void
	// @return void
	function up() {
		if( !calculatePrevDelta() )
			return;
		
		// Hurry the animation of previous direction
		if( menuObj.oldDirection == 1 )
			m_$parent.children().stop( true, true );
		
		for( var i = -1; i >= delta; i-- ) {
			// Don't handle anything outside of the filtered range
			if( visibleFrom + i < 0 )
				break;
			
			// Add new item to the beginning of the list (outside the visible box)
			m_shown.unshift( m_filtered[visibleFrom + i] );
			m_collection[m_shown[0]].$DOM.css( "margin-top", settings.itemSize * -1 );
			m_$parent.prepend( m_collection[m_shown[0]].$DOM );
			
			// Animate the first item to move inside the visible box
			m_collection[m_shown[0]].$DOM.animate({
				"margin-top": 0
			}, {
				duration: settings.transitionSpeed,
				queue: false,
				
				complete: function() {
					// Remove the old item from the DOM
					m_$parent.children().last().detach();
					m_$parent.children().css( "margin-top", "0" );
				}
			});
			
			// Remove item from the shown list
			m_shown.pop();
		}
	}
	
	// The selection goes down, meaning the menu shifts up
	// @param1 void
	// @return void
	function down() {
		if( !calculateNextDelta() )
			return;
		
		// Hurry the animation of previous direction
		if( menuObj.oldDirection == -1 )
			m_$parent.children().stop( true, true );
		
		for( var i = 1; i <= delta; i++ ) {
			// Don't handle anything outside of the filtered range
			if( visibleTo + i >= m_filtered.length )
				break;
			
			// Add new item to the end of the list (outside the visible box)
			m_$parent.append( m_collection[m_filtered[visibleTo + i]].$DOM );
			//REMOVE:m_shown.push( m_shown[m_shown.length - 1] + 1 );
			m_shown.push( m_filtered[visibleTo + i] );
			
			// Animate the first item to move outside the visible box, and then remove it from shown list
			m_collection[m_shown.shift()].$DOM.animate({
				"margin-top": settings.itemSize * -1
			}, {
				duration: settings.transitionSpeed,
				queue: false,
				
				complete: function() {
					// The first item is now outside the visible box, so detach it from the DOM
					$(this).detach();
					m_$parent.children().css( "margin-top", "0" );
				}
			});
		}
	}
	
	construct();
};

function RailMenu( m_$parent, settings ) {
	var self = this;
	var m_selected = 1;
	
	this.m_$parent = m_$parent;
	this.m_collection = new Array;
	this.m_filtered = new Array;
	this.m_shown = new Array;
	
	this.filters = {
		search: "",
		sort: "",
		category: "",
		order: "ASC"
	};
	
	this.oldDirection = 0;
	
	this.settings = {
		numToDisplay: 9,
		layout: m_$parent.hasClass( "horizontal" ) ? "horizontal" : "vertical",
		itemSize: null,
		transition: "RailMenuTMCentered",
		transitionSpeed: 75,
		attributes: new Array,
		onClick: null,
		onSelect: null,
		onSearch: null,
		onSort: null,
		onPresent: null,
	};
	
	m_$parent.bind( "mousewheel DOMMouseScroll", function( e ) {
		if( e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0 ) {
			// Scroll up
			self.select( getIDFromPosition( getPositionFromID( m_selected ) - 1 ), true, false );
		}
		else {
			// Scroll down
			self.select( getIDFromPosition( getPositionFromID( m_selected ) + 1 ), true, false );
		}
	});
	
	// The construct, automatically called upon instancing of this class
	// @param1 void
	// @return void
	function construct() {
		// Iterate through each child and copy to item list
		recursiveObjectOverride( settings, self.settings );
		
		// Load whatever DOM is in the m_$parent
		self.loadDOM( m_$parent );
		
		// Handle click events on the menu
		m_$parent.click( function( evt ) {
			var target = evt.target;
			
			do {
				if( target.tagName == "LI" ) {
					self.select( $(target).attr( "id" ) );
					return false;
				}
				
				target = target.parentNode;
			}
			while( target.parentNode != null && "undefined" != typeof target.parentNode );
		});
	}
	
	// Override default settings recursively, except for protected settings
	// @param1 object		Object of the settings to copy from
	// @param2 object		Object with the settings to copy to
	// @return void
	function recursiveObjectOverride( source, dest ) {
		for( var k in source )
			if( source.hasOwnProperty( k ) )
				if( "protected" == k )
					continue;
				else if( "object" == typeof source[k] )
					recursiveObjectOverride( source[k], dest[k] );
				else
					dest[k] = source[k];
	};
	
	// Gets the position of given element by ID in the filtered list
	// @param1 integer		ID of the element to search for
	// @return integer		The position within the filtered list
	// @return null			ID not found within the filtered list
	function getPositionFromID( id ) {
		var index = self.m_filtered.indexOf( parseInt( id ) );
		
		return index >= 0 ? index : null;
	}

	// Gets the ID of given element by position in the filtered list
	// @param1 integer		Position of the element to search for
	// @return integer		The ID of the element
	// @return null			Position not found within the filtered list
	function getIDFromPosition( pos ) {
		if( pos >= self.m_filtered.length )
			return null;
		
		return self.m_filtered[pos];
	}
	
	// Creates a string of filters and selection which can be used for syncing or statistics
	// @param1 void
	// @return string		A string containing current filters and current selection
	this.createParamsString = function() {
		return "q=" + encodeURIComponent( this.filters.search ) + "c=" + encodeURIComponent( this.filters.category ) + "&s=" + encodeURIComponent( this.filters.sort ) + "&o=" + encodeURIComponent( this.filters.order ) + "&sel=" + m_selected;
	};
	
	// Resets the collection, but does not clean up the associated DOM
	// @param1 void
	// @return void
	this.clear = function() {
		self.m_shown = new Array;
		self.m_filtered = new Array;
		self.m_collection = new Array;
	};
	
	// Returns the amount of items present in the menu
	// @param1 void
	// @return integer		Amount of items present in the menu
	this.itemCount = function() {
		return self.m_collection.length;
	};
	
	// Adds a single item to the menu
	// @param1 JQuery		JQuery DOM element to add to the menu
	// @return void
	this.addItem = function( $DOM ) {
		var obj = { $DOM: $DOM };
		
		// Iterate through the attributes settings to see which values to copy
		for( var i = 0; i < self.settings.attributes.length; i++ ) {
			if( "undefined" == typeof $DOM.attr( self.settings.attributes[i] ) )
				continue;
			
			obj[self.settings.attributes[i]] = $DOM.attr( self.settings.attributes[i] );
		}
		
		// Get the latest available ID in case the collection is not empty
		var id = self.m_collection.length;
		
		// Add the element to the collection
		self.m_collection.push( obj );
		self.m_filtered.push( id );
		
		// Give the element an unique ID
		$DOM.attr( "id", id );
	};
	
	// Traverses the given data structure and adds them to the menu, calling the callback for each item
	// @param1 object|string	Data object or JSON string to load
	// @param2 function			Called for each item, this function should return the whole DOM structure for this item
	this.loadJSON = function( data, callback ) {
		if( "string" == typeof data )
			data = JSON.parse( data );
		
		// Get the latest available ID in case the collection is not empty
		var id = self.m_collection.length;
		
		for( var k in data ) {
			if( !data.hasOwnProperty( k ) )
				continue;
			
			// The given callback handles creation of the DOM element
			var obj = { $DOM: callback( data[k] ) };
			
			// Iterate through the attributes settings to see which values to copy
			for( var i = 0; i < self.settings.attributes.length; i++ ) {
				if( "undefined" == typeof data[k][self.settings.attributes[i]] )
					continue;
				
				obj[self.settings.attributes[i]] = data[k][self.settings.attributes[i]];
			}
			
			// Add the new DOM element to the collection
			self.m_collection.push( obj );
			self.m_filtered.push( id );
			
			// Give the element an unique ID
			obj.$DOM.attr( "id", id++ );
		}
	};
	
	// Traverses the children of given DOM element and adds them to the menu
	// @param1 JQuery		JQuery DOM element to traverse
	// @return void
	this.loadDOM = function( $DOM ) {
		$DOM.children().each( function( id ) {
			var obj = { $DOM: $(this) };
			
			// Iterate through the attribute settings to see which values to copy
			for( var i = 0; i < self.settings.attributes.length; i++ ) {
				if( "undefined" == typeof obj.$DOM.attr( self.settings.attributes[i] ) )
					continue;
				
				obj[self.settings.attributes[i]] = obj.$DOM.attr( self.settings.attributes[i] );
			}
			
			// Add the element to the collection
			self.m_collection.push( obj );
			self.m_filtered.push( id );
			
			// Give the element an unique ID
			$(this).attr( "id", id );
		});
	};
	
	// Searches the collection and puts results in the filtered list
	// @param1 string		* String to search for in all defined attributes 
	// @param2 boolean		? Whether to execute the callback(s) (default: TRUE)
	// @return boolean		Whether the search has changed anything
	this.search = function( search, doCallbacks, category = "" ) {
		search = "undefined" != typeof search ? search.toLowerCase() : "";
		category = "undefined" != typeof category && category != null ? category.toLowerCase() : "";
		doCallbacks = "undefined" != typeof doCallbacks ? doCallbacks : true;
		
		if( search == this.filters.search && this.filters.category == category )
			return false;
		
		this.filters.search = search;
		this.filters.category = category;
		this.m_filtered = new Array;
		
		// Apply the search filter to list of items
		for( var i = 0; i < this.m_collection.length; i++ ) {
			if( this.filters.search.length > 1 || this.filters.category.length > 1 ) {
				// Search through each of the defined attributes for a match
				var foundSearch = false;
				var foundCategory = false;
				
				if( this.filters.search.length > 1 ) {
					for( var j = 0; j < this.settings.attributes.length; j++ ) {
						if( !this.m_collection[i].hasOwnProperty( this.settings.attributes[j] ) )
							continue;
						
						if( -1 != this.m_collection[i][this.settings.attributes[j]].toLowerCase().indexOf( this.filters.search ) ) {
							// Match is found, add item to shown list and abort the current loop
							foundSearch = true;
							break;
						}
					}
				}
				
				if( this.filters.category.length > 1 ) {
					for( var j = 0; j < this.settings.attributes.length; j++ ) {
						if( !this.m_collection[i].hasOwnProperty( this.settings.attributes[j] ) )
							continue;
						
						if( -1 != this.m_collection[i][this.settings.attributes[j]].toLowerCase().indexOf( this.filters.category ) ) {
							// Match is found, add item to shown list and abort the current loop
							foundCategory = true;
							break;
						}
					}
				}
				
				if( (this.filters.search.length > 1 && this.filters.category.length > 1 && foundSearch && foundCategory)
					|| (this.filters.search.length > 1 && this.filters.category.length == 0 && foundSearch) 
					|| (this.filters.category.length > 1 && this.filters.search.length == 0 && foundCategory) ) {
					this.m_filtered.push( i );
				}
			}
			else {
				this.m_filtered.push( i );
			}
		}
		
		if( doCallbacks && "function" == typeof this.settings.onSearch ) {
			this.settings.onSearch();
		}
		
		return true;
	};
	
	// Sorts the filtered list on given attribute, in descending or ascending order
	// @param1 string		* Attribute to sort on
	// @param2 string		? Order (ASC or DESC) to sort in (default: ASC)
	// @param3 boolean		? Whether to execute the callback(s) (default: TRUE)
	// @return boolean		Whether the sort has changed anything
	this.sort = function( on, order, doCallbacks ) {
		on = "undefined" != typeof on ? on : "";
		order = "undefined" != typeof order && order == "DESC" ? order : "ASC";
		
		if( on == this.filters.sort && order == this.filters.order )
			return false;
		
		this.filters.sort = on;
		this.filters.order = order;
		
		// Sort all filtered items by the preferred sort method
		if( this.filters.sort.length > 1 && this.m_collection[this.m_filtered[0]].hasOwnProperty( this.filters.sort ) ) {
			this.m_filtered.sort( function( a, b ) {
				if( self.m_collection[a][self.filters.sort].charCodeAt( 0 ) < self.m_collection[b][self.filters.sort].charCodeAt( 0 ) )
					return self.filters.order == "ASC" ? -1 : 1;
				else if( self.m_collection[a][self.filters.sort].charCodeAt( 0 ) > self.m_collection[b][self.filters.sort].charCodeAt( 0 ) )
					return self.filters.order == "ASC" ? 1 : -1;
				
				return 0;
			});
		}
		
		if( doCallbacks && "function" == typeof this.settings.onSort ) {
			this.settings.onSort();
		}
		
		return true;
	};
	
	// (Re)builds the filtered (search/sort modifiers) list and presents it to the browser
	// @param1 integer		Optional. ID of the element to select. By default this is the first one on the filtered list
	// @return void
	this.present = function( id ) {
		id = "undefined" != typeof id ? id : 0;
		
		if( !this.m_filtered.length )
			return;
		
		// Find the range ('from' .. 'to') that will be displayed
		var leftHand = Math.floor( (this.settings.numToDisplay - 1) / 2 );
		var rightHand = Math.ceil( (this.settings.numToDisplay - 1) / 2 );
		var nth = getPositionFromID( id );
		var from = nth - leftHand;
		var to = nth + rightHand;
		
		if( from < 0 ) {
			to += Math.abs( from );
			from = 0;
		}
		
		if( to >= this.m_filtered.length ) {
			to = this.m_filtered.length - 1;
		}
		
		// Empty the parent and refill it with the items in range
		this.m_$parent.empty();
		this.m_shown = new Array;
		
		for( var i = from; i <= to; i++ ) {
			this.m_$parent.append( this.m_collection[this.m_filtered[i]].$DOM );
			this.m_shown.push( this.m_filtered[i] );
		}
		
		// Fetch item size
		this.settings.itemSize = this.settings.layout == "horizontal" ? this.m_collection[this.m_filtered[from]].$DOM.width() : this.m_collection[this.m_filtered[from]].$DOM.height();
		
		// Set selection
		// Mark the new selection
		this.m_$parent.children().removeClass().removeAttr( "style" );
		
		m_selected = id;
		
		if( !getPositionFromID( m_selected ) ) {
			m_selected = this.m_filtered[0];
		}
		
		this.m_collection[m_selected].$DOM.addClass( "selected" );
		
		// Give each item a class marking the relativity to the selected
		for( var i = 0; i < this.m_shown.length; i++ ) {
			if( this.m_shown[i] == m_selected )
				continue;
			
			var rel = this.m_shown[i] - nth;
			rel = rel < 0 ? "rel_m" + Math.abs( rel ) : "rel_p" + rel;
			
			this.m_collection[this.m_shown[i]].$DOM.addClass( rel );
		}
		
		// Call the onPresent callback on present
		if( "function" == typeof this.settings.onPresent ) {
			this.settings.onPresent( this.m_collection[m_selected] );
		}
	};
	
	// Selects an item in the built list
	// @param1 integer		ID of the element to select
	// @param2 boolean		Optional. Whether to allow callbacks (default: true)
	// @param3 boolean		Optional. Whether to sync (default: true)
	// @return void
	this.select = function( id, doCallbacks, toSync ) {
		doCallbacks = "undefined" != typeof doCallbacks ? doCallbacks : true;
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		// Check for invalid selection
		if( id < 0 || id >= this.m_collection.length || id === null || id === undefined )
			return;
		
		// Selected item is clicked again
		if( id == m_selected ) {
			if( doCallbacks && "function" == typeof this.settings.onClick ) {
				this.settings.onClick( this.m_collection[m_selected], toSync );
			}
			
			return;
		}
		
		// Call the onSelect callback on select
		if( doCallbacks && "function" == typeof this.settings.onSelect ) {
			this.settings.onSelect( this.m_collection[id], toSync );
		}
		
		// Find the change in selection from the previous selection
		var newSelectionPos = getPositionFromID( id );
		var curSelectionPos = getPositionFromID( m_selected );
		var visibleFrom = getPositionFromID( this.m_shown[0] );
		var visibleTo = getPositionFromID( this.m_shown[this.m_shown.length - 1] );
		
		// Make the transition with the desired transition method
		window[this.settings.transition]( this, visibleFrom, visibleTo, curSelectionPos, newSelectionPos );
		
		// Mark the new selection
		this.m_$parent.children().removeClass();
		m_selected = id;
		this.m_collection[m_selected].$DOM.addClass( "selected" );
		
		// Give each item a class marking the relativity to the selected
		for( var i = 0; i < this.m_shown.length; i++ ) {
			if( this.m_shown[i] == m_selected )
				continue;
			
			var rel = getPositionFromID( this.m_shown[i] ) - newSelectionPos;
			rel = rel < 0 ? "rel_m" + Math.abs( rel ) : "rel_p" + rel;
			
			this.m_collection[this.m_shown[i]].$DOM.addClass( rel );
		}
	};
	
	construct();
}