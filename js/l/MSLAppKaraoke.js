var MSLAppKaraoke = (function() {
	var selectorMenu;
	var songMenu;
	
	var history = null;
	var isLoaded;
	var preloadSelect;
	
	function back( toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		var to = history.back();
		
		// Can't go further back
		if( to === null )
			return;
		
		MSLGlobals.Audio.play( "back" );
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_KARAOKE_BACK
			});
		}
		
		songMenu.search( to );
		songMenu.present();
		
		$("input.MSLAppKaraokeSearchCtrl").val( to ? to : "" );
	}
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#ca517c" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "color" );
		//$("#underlay > #videoBackground").css( "opacity", 1 );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppKaraoke").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppKaraoke").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		preloadSelect = 0;
		history = new MSLHistory( $("section#MSLAppKaraoke") );
		
		// Activate the search control
		$("input.MSLAppKaraokeSearchCtrl").keypress( function( evt ) {
			if( evt.which == 13 ) {
				MSLGlobals.Audio.play( "button" );
				MSLAppKaraoke.search( $("input.MSLAppKaraokeSearchCtrl").val() );
				return false;
			}
		});
		
		$("button.MSLAppKaraokeSearchCtrl").click( function( evt ) {
			MSLGlobals.Audio.play( "button" );
			MSLAppKaraoke.search( $("input.MSLAppKaraokeSearchCtrl").val() );
			return false;
		});
		
		$.ajax({
			method: "GET",
			url: "json/karaoke.php"
		})
		.done( function( list ) {
			list = JSON.parse( list );
			var listLength = list.length;
			
			// Populate the menu
			for( var i = 0; i < listLength; i++ ) {
				$li = $(document.createElement( "li" ));
				$li.attr( "artist", list[i].a );
				$li.attr( "song", list[i].t );
				$li.attr( "videoid", list[i].id );
				$li.attr( "url", list[i].src );
				
				$li.append( $(document.createElement( "div" )).addClass( "albumart" ).css( "background-image", "url('" + list[i].img + "')" ) );
				$li.append( $(document.createElement( "div" )).addClass( "duration" ).addClass( "unselectable" ).text( list[i].len ) );
				$li.append( $(document.createElement( "div" )).addClass( "track" ).text( list[i].t ) );
				$li.append( $(document.createElement( "div" )).addClass( "artist" ).text( list[i].a ) );
				
				$("#MSLAppKaraoke #songs").append( $li );
			}
			
			// Initiate the selector menu
			selectorMenu = new RailMenu( $("#MSLAppKaraoke #selector"), {} );
			
			// Initiate the song menu
			songMenu = new RailMenu( $("#MSLAppKaraoke #songs"), {
				attributes: ["Artist","Song","VideoID","URL"],
				activeAttribute: "Song",
			});
			
			// Set selector menu callbacks
			selectorMenu.settings.onSelect = function( item, toSync ) {
				var goToLetter = item.$DOM.text().charAt( 0 ).toLowerCase();
				
				for( var i = 0; i < songMenu.m_filtered.length; i++ ) {
					var firstLetter = songMenu.m_collection[songMenu.m_filtered[i]][songMenu.settings.activeAttribute].charAt( 0 ).toLowerCase();
					
					if( goToLetter == firstLetter || (goToLetter == '#' && parseInt( firstLetter ) >= 0 && parseInt( firstLetter ) <= 9) ) {
						songMenu.select( songMenu.m_filtered[i], false, false );
						
						if( toSync && MSLGlobals.sync ) {
							MSLGlobals.sync.send({
								c: OPCODE_KARAOKE_SELECT,
								value: songMenu.m_filtered[i]
							});
						}
						
						break;
					}
				}
			};
			
			// Set song menu callbacks
			var syncSelectorMenu = function( item, toSync ) {
				var goToLetter = item[songMenu.settings.activeAttribute].charAt( 0 ).toLowerCase();
				
				if( parseInt( goToLetter ) >= 0 && parseInt( goToLetter ) <= 9 )
					goToLetter = '#';
				
				for( var i = 0; i < selectorMenu.m_filtered.length; i++ ) {
					var firstLetter = selectorMenu.m_collection[selectorMenu.m_filtered[i]].$DOM.text().charAt( 0 ).toLowerCase();
					
					if( goToLetter == firstLetter ) {
						selectorMenu.select( selectorMenu.m_filtered[i], false );
						break;
					}
				}
			};
			
			songMenu.settings.onPresent = syncSelectorMenu;
			songMenu.settings.onSelect = function( item, toSync ) {
				syncSelectorMenu( item, toSync );
				
				if( toSync && MSLGlobals.sync ) {
					MSLGlobals.sync.send({
						c: OPCODE_KARAOKE_SELECT,
						value: item.$DOM.attr( "id" )
					});
				}
				
				return true;
			}
			
			songMenu.settings.onClick = function( item, toSync ) {
				MSLAppManager.load( "karaokeWatch", {url: item.URL}, toSync );
			};
			
			selectorMenu.present();
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.selected )
			preloadSelect = data.selected;
		
		if( "undefined" != typeof data.search && "undefined" != typeof songMenu ) {
			songMenu.search( data.search );
			$("input.MSLAppKaraokeSearchCtrl").val( data.search );
		}
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		if( reload ) {
			data.search = "undefined" != typeof data.search ? data.search : "";
		}
		
		isLoaded = true;
		setBackground();
		preload( data, true );
		
		history.add( "" );
		
		if( songMenu ) {
			songMenu.present( preloadSelect );
		}
		
		preloadSelect = 0;
		
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
	
	return {
		init: init,
		preload: preload,
		load: load,
		open: open,
		close: close,
		
		back: back,
		
		search: function( query, toSync ) {
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			if( toSync && MSLGlobals.sync ) {
				MSLGlobals.sync.send({
					c: OPCODE_KARAOKE_SEARCH,
					query: query
				});
			}
			
			history.add( query );
			songMenu.search( query );
			songMenu.present();
			
			$("input.MSLAppKaraokeSearchCtrl").val( query );
		},
		
		select: function( idx, toSync ) {
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			songMenu.select( idx, true, toSync );
		},
	};
})();

MSLAppManager.register( "karaoke", MSLAppKaraoke, true );