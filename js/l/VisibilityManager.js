class VisibilityManager
{
	constructor( $context, defaultState = false, initVisibility = {} ) {
		this.$context = $context;
		
		if( defaultState ) {
			this.$context.show( 0 );
			
			// Since by default everything is visible, hide the ones that are specified to be hidden
			for( var k in initVisibility ) {
				if( !initVisibility[k] ) {
					this.$context.filter( "#" + k ).hide( 0 );
				}
			}
		}
		else {
			this.$context.hide( 0 );
			
			// Since by default everything is hidden, show the ones that are specified to be visible
			for( var k in initVisibility ) {
				if( initVisibility[k] ) {
					this.$context.filter( "#" + k ).show( 0 );
				}
			}
		}
	}
    
    SetAll( state = true, options = 0 ) {
		if( state ) {
			this.$context.finish().show( options );
		}
		else {
			this.$context.finish().hide( options );
		}
	}
	
	SetEverythingExceptByID( id, state = true, options = 0 ) {
		if( state ) {
			this.$context.filter( ":not(#" + id + ")" ).finish().show( options );
		}
		else {
			this.$context.filter( ":not(#" + id + ")" ).finish().hide( options );
		}
	}
	
	SetEverythingExceptNth( num, state = true, options = 0 ) {
		if( state ) {
			this.$context.filter( (i) => i != num ).finish().show( options );
		}
		else {
			this.$context.filter( (i) => i != num ).finish().hide( options );
		}
	}
	
	SetByID( id, state = true, options = 0 ) {
		if( state ) {
			this.$context.filter( "#" + id ).finish().show( options );
		}
		else {
			this.$context.filter( "#" + id ).finish().hide( options );
		}
	}
	
	SetByNth( num, state = true, options = 0 ) {
		if( state ) {
			this.$context.eq( num ).finish().show( options );
		}
		else {
			this.$context.eq( num ).finish().hide( options );
		}
	}
	
	SetOneHideRestByID( id, showOptions = 0, hideOptions = 0, chain = false ) {
		if( chain ) {
			const self = this;
			
			$.when( this.$context.finish().hide( hideOptions ) ).done( function() {
				self.$context.filter( "#" + id ).finish().show( showOptions );
			});
		}
		else {
			this.$context.finish().hide( hideOptions );
			this.$context.filter( "#" + id ).finish().show( showOptions );
		}
	}
	
	SetOneHideRestByNth( num, showOptions = 0, hideOptions = 0, chain = false ) {
		if( chain ) {
			const self = this;
			
			$.when( this.$context.finish().hide( hideOptions ) ).done( function() {
				self.$context.eq( num ).finish().show( showOptions );
			});
		}
		else {
			this.$context.finish().hide( hideOptions );
			this.$context.eq( num ).finish().show( showOptions );
		}
	}
	
	GetContextLength() {
		return this.$context.length;
	}
}