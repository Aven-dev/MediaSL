function Tooltip( $item, callback ) {
	var self = this;
	
	var screen = {
		x1: 16,
		y1: 16,
		x2: 1024 - 16,
		y2: 576 - 16
	};
	
	var $container = $(document.createElement( "div" ));
	$container.addClass( "tooltip" );
	
	var $pointer = $(document.createElement( "div" ));
	$pointer.addClass( "pointer" );
	$container.append( $pointer );
	
	var $content = $(document.createElement( "div" ));
	$content.addClass( "content" );
	$container.append( $content );
	
	$(document.body).append( $container );
	
	$item.on( "mouseenter", function() {
		self.Show( callback() );
	});
	
	$item.on( "mouseleave", function() {
		self.Show( false );
	});
	
	this.Show = function( html ) {
		html = "undefined" != typeof html ? html : null;
		
		if( !html || !html.length ) {
			$container.css( "display", "none" );
			return;
		}
		
		$content.html( html );
		
		var anchor = {
			x: $item.offset().left + $item.width() / 4,
			y: $item.offset().top + $item.height() + 8
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
	}
}