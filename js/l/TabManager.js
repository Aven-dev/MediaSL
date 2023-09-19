class TabManager
{
	constructor( $tabContext, $pageContext, defaultTabID, callback = null ) {
		const self = this;
		
		this.$context = $tabContext;
		this.pages = new VisibilityManager( $pageContext, false, {[defaultTabID]: true} );
		this.callback = callback;
		
		// Set everything inactive except the default tab. This is two times faster than addClass/removeClass on the context object.
		this.$context.each( function() {
			const tab = $(this);
			
			if( tab.attr( "for" ) == defaultTabID ) {
				//tab.addClass( "active" );
				self.Switch( tab );
			}
			else {
				tab.removeClass( "active" );
			}
		});
		
		// Make tabs clickable under certain conditions.
		this.$context.on( "click", function() {
			const tab = $(this);
			const tabID = tab.attr( "for" );
			
			if( "undefined" == typeof( tabID ) || tabID == "" )
				return;
			
			if( self.$context.filter( ".active" ).attr( "for" ) == tabID )
				return;
			
			self.Switch( tab );
		});
	}
	
	Switch( tab ) {
		// Also allow tab switching by ID
		if( "string" == typeof tab )
			tab = this.GetTabById( tab );
		
		this.pages.SetOneHideRestByID( tab.attr( "for" ), 0, 0, true );
		this.$context.removeClass( "active" );
		tab.addClass( "active" );
		
		if( this.callback ) {
			const allTabs = new Array;
			
			this.$context.each( function() {
				allTabs.push( $(this).attr( "for" ) );
			});
			
			this.callback( tab.attr( "for" ), allTabs );
		}
	}
	
	GetTabById( tabID ) {
		for( let i = 0; i < this.$context.length; ++i )
			if( this.$context[i].attributes.for.value == tabID )
				return $(this.$context[i]);
		
		return null;
	}
}