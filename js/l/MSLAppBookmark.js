var MSLAppBookmark = (function() {
	var history = null;
	var isLoaded;
	var preloadSelect;
	var pageContainer;
	var gridmenu = null;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#000" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "color" );
		$("#underlay > #videoBackground").css( "opacity", 1 );
		$("#underlay > video").css( "filter", "brightness(0.3)" );
		$("#underlay > video").css( "-webkit-filter", "brightness(0.3)" );
	}
	
	function showPage( page, toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		pageContainer.children().hide();
		
		if( page == "BOOKMARK_ADD" ) {
			pageContainer.children( ".websiteAddStep1" ).show();
			
			$("#MSLAppBookmarkInName").val( "" );
			$("#MSLAppBookmarkInWebsiteURL").val( "" );
			$("#MSLAppBookmarkInWebsiteURLError").text( MSLGlobals.isOwner ? "" : "Sorry, only TV owners may add an website." );
			
			return;
		}
		
		if( page == "BOOKMARK_DELETE" ) {
			pageContainer.children( ".websiteDelete" ).show();
			
			$("#MSLAppBookmarkWebsiteDeleteError").removeClass( "ok" ).text( "" );
			
			return;
		}
		
		if( gridmenu.hasAny() ) {
			pageContainer.children( "#bookmarkList" ).show();
			return;
		}
		
		pageContainer.children( ".websiteListEmpty" ).show();
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppBookmark").fadeIn();
		
		var button = $("#MSLAppBookmark > header > div.navBack");
		button.addClass( "disabled" );
		
		showPage( null, false );
	}
	
	function hideApp() {
		$("section#MSLAppBookmark").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		preloadSelect = 0;
		history = new MSLHistory( $("section#MSLAppBookmark") );
		pageContainer = $("#MSLAppBookmark > main");
		gridmenu = new GridMenu( $("#bookmarkList"), $("#bookmarkPages"), 3, 8 );
		
		// Activate button control
		$(".MSLAppBookmarkAddWebsite").click( function( evt ) {
			MSLAppBookmark.showPage( "BOOKMARK_ADD", false );
		});
		
		// Name check
		$("#MSLAppBookmarkInName").on( "input propertychange paste", function( evt ) {
			var name = $(this).val();
			
			if( name.length == 0 ) {
				$("#MSLAppBookmarkInNameError")
				.removeClass( "ok" )
				.text( "Enter a name for your bookmark" );
			}
			else if( name.length > 60 ) {
				$("#MSLAppBookmarkInNameError")
				.removeClass( "ok" )
				.text( "Bookmark name can't be more than 60 characters long" );
			}
			else {
				$("#MSLAppBookmarkInNameError")
				.addClass( "ok" )
				.text( "Bookmark name is valid" );
			}
		});
		
		// URL check
		$("#MSLAppBookmarkInWebsiteURL").on( "input propertychange paste", function( evt ) {
			var parse_url = document.createElement( "a" );
			var url = $(this).val();
			
			// Prepend http schema if there isn't any to prevent relative path search
			if( url.substr( 0, 4 ) != "http" ) {
				url = "http://" + url;
			}
			
			// Assign URL to href tag and let browser take care of parsing the URL
			parse_url.href = url;
			
			// Check for supported services
			if( parse_url.hostname.length == 0 ) {
				$("#MSLAppBookmarkInWebsiteURLError")
				.removeClass( "ok" )
				.text( "Enter a valid website URL." );
			}
			else {
				$("#MSLAppBookmarkInWebsiteURLError")
				.addClass( "ok" )
				.text( "Websites recognized, press SUBMIT to add this bookmark." );
			}
		});
		
		// Search
		$(".MSLAppBookmarkSearchCtrl").on( "input propertychange paste", function( evt ) {
			gridmenu.render();
		});
		
		// Cancel modal dialogs
		$("#MSLAppBookmark #cancel").click( function( evt ) {
			MSLAppBookmark.showPage( null, false );
		});
		
		// Send given URL to server to check for validility and fetch images
		$("#MSLAppBookmark .websiteAddStep1 #submit").click( function( evt ) {
			$("#MSLAppBookmarkInWebsiteURLError")
			.addClass( "ok" )
			.text( "Adding bookmark..." );
			
			$.ajax({
				method: "POST",
				url: "json/bookmarkAdd.php",
				data: {
					uuid: MSLGlobals.uuid,
					url: encodeURIComponent( $("#MSLAppBookmarkInWebsiteURL").val() ),
					name: $("#MSLAppBookmarkInName").val()
				}
			})
			.done( function( data ) {
				data = JSON.parse( data );
				
				if( data.status == 200 ) {
					$("#MSLAppBookmarkInWebsiteNameError")
					.addClass( "ok" )
					.text( "Website has been added!" );
					
					MSLAppManager.load( "bookmark" );
				}
				else {
					var message = "Unknown error (" + data.status + ")";
					
					switch( data.status ) {
						case 401: message = "Only the owner may add bookmarks"; break;
						case 406: message = "Website does not exist"; break;
					}
					
					$("#MSLAppBookmarkInWebsiteURLError")
					.removeClass( "ok" )
					.text( message );
				}
			});
		});
		
		// Delete the website
		$("#MSLAppBookmark .websiteDelete #submit").click( function( evt ) {
			$("#MSLAppBookmarkWebsiteDeleteError")
			.addClass( "ok" )
			.text( "Deleting bookmark." );
			
			$.ajax({
				method: "POST",
				url: "json/bookmarkDelete.php",
				data: {
					uuid: MSLGlobals.uuid,
					website: $("#MSLAppBookmarkDeleteWebsiteID").val()
				}
			})
			.done( function( data ) {
				data = JSON.parse( data );
				
				if( data.status == 204 ) {
					$("#MSLAppBookmarkWebsiteDeleteError")
					.addClass( "ok" )
					.text( "Bookmark has been deleted." );
					
					MSLAppManager.load( "bookmark" );
				}
				else {
					$("#MSLAppBookmarkWebsiteDeleteError")
					.removeClass( "ok" )
					.text( "An error occured while attempting to delete the bookmark." );
				}
			});
		});
	}
	
	function fetchWebsiteList( preloadSelect ) {
		preloadSelect = "undefined" != typeof preloadSelect ? preloadSelect : 0;
		
		// Fetch new complete website list
		$.ajax({
			method: "GET",
			url: "json/bookmarkFetch.php?uuid=" + MSLGlobals.uuid
		})
		.done( function( data ) {
			data = JSON.parse( data );
			
			if( data.status == 200 ) {
				// Clear the list from memory
				gridmenu.clearCollection();
				
				for( var i = 0; i < data.data.websiteCount; i++ ) {
					var $container = $(document.createElement( "div" ));
					$container.addClass( "bookmark" );
					
					if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
						$container.attr( "onclick", "MSLGlobals.Audio.play( 'denied' );" );
					}
					else {
						$container.attr( "onclick", "window.location='"+ data.data.websites[i].URL +"'" );
					}
					
					var $icon = $(document.createElement( "div" ));
					$icon.addClass( "icon" );
					var $iconSub = $(document.createElement( "div" ));
					
					if( data.data.websites[i].Icon != null && data.data.websites[i].Icon.length > 0 ) {
						$iconSub.css( "backgroundImage", "url('" + data.data.websites[i].Icon + "')" );
						$iconSub.css( "backgroundSize", "contain" );
					}
					else {
						$iconSub.css( "backgroundImage", "url('../images/icon-bookmark.png')" );
						$iconSub.css( "backgroundColor", "#373737" );
					}
					
					$icon.append( $iconSub );
					$container.append( $icon );
					
					var displayURL = data.data.websites[i].URL;
					displayURL = displayURL.replace( "http://", "" );
					displayURL = displayURL.replace( "https://", "" );
					displayURL = displayURL.replace( "www.", "" );
					
					if( displayURL.slice( -1 ) == "/" )
						displayURL = displayURL.slice( 0, -1 );
					
					var pos = displayURL.indexOf( "?" );
					
					if( pos != -1 )
						displayURL = displayURL.slice( 0, pos );
					
					var $text = $(document.createElement( "div" ));
					$text.addClass( "text" );
					var $name = $(document.createElement( "h5" )).text( data.data.websites[i].Name );
					var $url = $(document.createElement( "p" )).text( displayURL );
					$text.append( $name );
					$text.append( $url );
					$container.append( $text );
					
					if( MSLGlobals.isOwner ) {
						var $del = $(document.createElement( "div" ));
						$del.addClass( "delete" );
						$del.attr( "websiteid", data.data.websites[i].ID );
						$del.on( "click", function() {
							$("#MSLAppBookmarkDeleteWebsiteID").val( $(this).attr( "websiteid" ) );
							MSLAppBookmark.showPage( "BOOKMARK_DELETE", false );
							event.stopPropagation();
							return false;
						});
						$container.append( $del );
					}
					
					//$delete.attr( "onclick", "$('#MSLAppBookmarkDeleteWebsiteID').val( $(this).attr( 'websiteid' ) ); MSLAppBookmark.showPage( 'BOOKMARK_DELETE', false ); event.stopPropagation(); return false;" );
					
					gridmenu.addItem( $container );
				}
				
				gridmenu.render();
				showPage( null, false );
			}
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.selected )
			preloadSelect = data.selected;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		isLoaded = true;
		
		setBackground();
		preload( data, true );
		
		// Fetch website list
		fetchWebsiteList( preloadSelect );
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
		showPage: showPage,
		
		back: function() {},
	};
})();

MSLAppManager.register( "bookmark", MSLAppBookmark, true );