var MSLAppManager = (function() {
	var self = this;
	var appNames = new Array;
	var handlers = new Array;
	var currentHandler = null;
	
	$(document).ready( function() {
		$(window).mousemove( function( e ) {
			if( currentHandler != null ) {
				if( "undefined" != typeof currentHandler.onMouseMove ) {
					currentHandler.onMouseMove( e.pageX, e.pageY );
				}
			}
		});
	});
	
	$(document).ready( function() {
		$(".ownerLock").on( "click", function() {
			MSLAppManager.toggleLock();
		});
	});
	
	function register( appName, handler ) {
		appNames.push( appName );
		handlers.push( handler );
		
		$(document).ready( function() {
			handler.init();
		});
	}
	
	function gotoURL( url ) {
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		window.location = url;
	}
	
	function load( appName, data, toSync )  {
		appName = "undefined" != typeof appName ? appName : null;
		data = "object" == typeof data && data != null ? data : {};
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		if( toSync == true && MSLGlobals.DefaultApp != 0 && MSLGlobals.isOwner == false ) {
			var appIndex = -1;
			
			switch( appName ) {
				case "youtube":
				case "youtubeWatch":
				case "youtubeChannel":
					appIndex = 1;
					break;
				
				case "radio":
				case "radioListen":
					appIndex = 2;
					break;
				
				case "altai":
				case "altaiIndex":
				case "altaiView":
					appIndex = 3;
					break;
				
				case "karaoke":
				case "karaokeWatch":
					appIndex = 4;
					break;
				
				case "plutotv":
				case "plutotvWatch":
					appIndex = 7;
					break;
			}
			
			if( appIndex == -1 || appIndex != MSLGlobals.DefaultApp ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
		}
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_LOAD,
				appName: appName,
				data: data
			});
		}
		
		var handler = getHandler( appName ) || getHandler( null );
		
		if( handler ) {
			if( currentHandler )
				currentHandler.close();
			
			if( currentHandler == handler ) {
				MSLGlobals.Audio.play( "back" );
				
				handler.load( data, true );
			}
			else {
				MSLGlobals.Audio.play( appName == null ? "back" : "start" );
				
				currentHandler = handler;
				handler.load( data );
			}
		}
	}
	
	function open( appName, toSync ) {
		appName = "undefined" != typeof appName ? appName : null;
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		MSLGlobals.Audio.play( "back" );
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_OPEN,
				appName: appName
			});
		}
		
		var handler = getHandler( appName );
		
		if( handler ) {
			if( currentHandler )
				currentHandler.close();
			
			currentHandler = handler;
			handler.open();
		}
	}
	
	function passedThroughData( data ) {
		if( !currentHandler || !currentHandler.passedThroughData )
			return;
		
		currentHandler.passedThroughData( data );
	}
	
	function toggleLock() {
		if( !MSLGlobals.isOwner )
			return;
		
		var $button = $(".ownerLock");
		var toLock = !MSLGlobals.isLocked;
		
		// Save to database
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "Lock",
			value: toLock
		});
		
		// Change visuals and local variables
		if( toLock ) {
			MSLGlobals.isLocked = true;
			$(".ownerLock").removeClass( "lock" );
			$(".ownerLock").addClass( "unlock" );
			$(".overlayLock").removeClass( "unlocked" );
			$(".overlayLock").addClass( "locked" );
			
			MSLGlobals.Audio.play( "lock" );
			
			// Let SL know about lock
			if( MSLGlobals.endpoint.length > 0 ) {
				$.post( "json/SendToSecondLife.php", {
					endpoint: MSLGlobals.endpoint,
					data: "SetLock|1"
				});
			}
		}
		else {
			MSLGlobals.isLocked = false;
			$(".ownerLock").removeClass( "unlock" );
			$(".ownerLock").addClass( "lock" );
			$(".overlayLock").removeClass( "locked" );
			$(".overlayLock").addClass( "unlocked" );
			
			MSLGlobals.Audio.play( "unlock" );
			
			// Let SL know about lock
			if( MSLGlobals.endpoint.length > 0 ) {
				$.post( "json/SendToSecondLife.php", {
					endpoint: MSLGlobals.endpoint,
					data: "SetLock|0"
				});
			}
		}
		
		if( MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_SETLOCK,
				value: toLock ? 1 : 0
			});
		}
	}
	
	function setLock( lock, onInit ) {
		lock = "undefined" != typeof lock ? lock : 0;
		onInit = "undefined" != typeof onInit ? onInit : false;
		
		// Don't do anything if lock is unitialized in the sync server
		if( onInit == true && lock == -1 )
			return;
		
		var was = MSLGlobals.isLocked;
		
		MSLGlobals.isLocked = lock ? true : false;
		
		//if( onInit && MSLGlobals.isOwner ) {
			if( MSLGlobals.isLocked ) {
				$(".ownerLock").removeClass( "lock" );
				$(".ownerLock").addClass( "unlock" );
				$(".overlayLock").removeClass( "unlocked" );
				$(".overlayLock").addClass( "locked" );
				
				MSLGlobals.Audio.play( "lock" );
			}
			else {
				$(".ownerLock").removeClass( "unlock" );
				$(".ownerLock").addClass( "lock" );
				$(".overlayLock").removeClass( "locked" );
				$(".overlayLock").addClass( "unlocked" );
				
				MSLGlobals.Audio.play( "unlock" );
			}
		//}
	}
	
	function getHandler( appName ) {
		var i = appNames.length;
		
		while( i-- )
			if( appNames[i] == appName )
				return handlers[i];
		
		return null;
	}
	
	return {
		load: load,
		open: open,
		register: register,
		passedThroughData: passedThroughData,
		toggleLock: toggleLock,
		setLock: setLock,
		gotoURL: gotoURL,
		getHandler: getHandler,
		
		registered: function( state ) {
			var handler;
			
			handler = getHandler( null ); handler.preload( state.home );
			handler = getHandler( "karaoke" ); handler.preload( state.karaoke );
			handler = getHandler( "youtube" ); handler.preload( state.youtube );
			handler = getHandler( "twitch" ); handler.preload( state.twitch );
			handler = getHandler( "adult" ); handler.preload( state.adult );
			handler = getHandler( "hhaven" ); handler.preload( state.hhaven );
			handler = getHandler( "radio" ); handler.preload( state.radio );
			handler = getHandler( "altai" ); handler.preload( state.altai );
			handler = getHandler( "altaiIndex" ); handler.preload( state.altaiIndex );
			handler = getHandler( "altaiView" ); handler.preload( state.altaiView );
			handler = getHandler( "games" ); handler.preload( state.games );
			handler = getHandler( "help" ); handler.preload( state.help );
			handler = getHandler( "plutotv" ); handler.preload( state.plutotv );
			
			setLock( state.isLocked, true );
			load( state.currentApp, state.currentData, false );
		},
	};
})();