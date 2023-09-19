function ActionMessage( $item, updater, interval ) {
	var self = this;
	var timer = null;
	
	var screen = {
		x1: 16,
		y1: 16,
		x2: 1024 - 16,
		y2: 576 - 16
	};
	
	var $container = $(document.createElement( "div" ));
	$container.addClass( "actionmessage" );
	
	var $pointer = $(document.createElement( "div" ));
	$pointer.addClass( "pointer" );
	$container.append( $pointer );
	
	var $content = $(document.createElement( "div" ));
	$content.addClass( "content" );
	$container.append( $content );
	
	$(document.body).append( $container );
	
	$container.on( "click", function() {
		self.Hide();
	});
	
	$content.on( "click", function() {
		self.Hide();
	});
	
	this.Show = function( html ) {
		html = "undefined" != typeof html ? html : null;
		
		if( !html || !html.length ) {
			this.Hide();
			return;
		}
		
		$content.html( html );
		
		var anchor = {
			x: $item.offset().left,
			y: $item.offset().top + $item.height() + 4
		};
		
		var containerWidth = $container.width();
		var containerLeftOffset = anchor.x - 32;
		
		if( containerLeftOffset + containerWidth > screen.x2 ) {
			containerLeftOffset -= containerLeftOffset + containerWidth - screen.x2;
		}
		
		$container.css({
			"top": anchor.y,
			"left": containerLeftOffset,
			"display": "block"
		});
		
		$pointer.css( "left", anchor.x - containerLeftOffset );
		
		if( "undefined" != typeof updater && interval > 0 ) {
			timer = setInterval( this.Update, interval );
		}
	}
	
	this.Update = function() {
		if( updater( $content ) == false ) {
			this.Hide();
		}
	}
	
	this.Hide = function() {
		$container.css( "display", "none" );
		
		if( timer != null ) {
			clearInterval( timer );
			timer = null;
		}
	}
}