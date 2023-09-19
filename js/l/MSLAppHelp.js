var MSLAppHelp = (function() {
	var isLoaded;
	var scrollbarOriginalHeight = null;
	var scrollbarMainHeight = null;
	var helpContainerScroll = null;
	
	function setBackground() {
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppHelp").css( "backgroundColor", "transparent" );
		$("section#MSLAppHelp").fadeIn();
		
		hideAllPages();
	}
	
	function hideApp() {
		$("section#MSLAppHelp").css( "backgroundColor", "transparent" );
		$("section#MSLAppHelp").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		
		helpContainerScroll = new UndockedScrollbar( $("#helpContainerBody"), $("#helpContainerScroll") );
		helpContainerScroll.UpdateVisibility();
		
		$("#helpContainerBody > h5").each( function() {
			const $target = $("#" + $(this).attr( "for" ) );
			const $pointer = $(this).children( "span" ).eq( 0 );
			
			if( $target ) {
				$(this).on( "click", function() {
					if( $target.hasClass( "hidden" ) ) {
						$pointer.addClass( "open" );
						$target.removeClass( "hidden" );
						
						helpContainerScroll.UpdateVisibility();
						
						this.scrollIntoView({
							behavior: "smooth"
						});
					}
					else {
						$pointer.removeClass( "open" );
						$target.addClass( "hidden" );
						
						helpContainerScroll.UpdateVisibility();
					}
				} );
			}
		} );
	}
	
	function preload( data ) {
	}
	
	function load( data, reload ) {
		isLoaded = true;
		
		setBackground();
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
	
	function back() {
	}
	
	function hideAllPages() {
		$("#helpContainerBody > h5 > span").removeClass( "open" );
		$("#helpContainerBody > section").addClass( "hidden" );
		
		helpContainerScroll.UpdateVisibility();
		
		return this;
	}
	
	return {
		init: init,
		preload: preload,
		load: load,
		open: open,
		close: close,
		back: back,
		hideAllPages: hideAllPages
	};
})();

MSLAppManager.register( "help", MSLAppHelp, true );