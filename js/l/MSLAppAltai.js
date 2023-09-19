var MSLAppAltai = (function() {
	var history = null;
	var isLoaded;
	var preloadSelect;
	var albumList;
	var pageContainer;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#744321" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "color" );
	}
	
	function showPage( page, toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		pageContainer.children().hide();
		
		if( page == "ALBUM_ADD_STEP_1" ) {
			pageContainer.children( ".albumAddStep1" ).show();
			
			$("#MSLAppAltaiInAlbumURL").val( "" );
			$("#MSLAppAltaiInAlbumURLError").text( MSLGlobals.isOwner ? "" : "Sorry, only TV owners may add an album." );
			
			return;
		}
		
		if( page == "ALBUM_ADD_STEP_2" ) {
			pageContainer.children( ".albumAddStep2" ).show();
			
			$("#MSLAppAltaiInAlbumName").val( "" );
			$("#MSLAppAltaiAddAlbumPreview").empty();
			$("#MSLAppAltaiInAlbumNameError").empty();
			
			return;
		}
		
		if( page == "ALBUM_DELETE" ) {
			pageContainer.children( ".albumDelete" ).show();
			
			$("#MSLAppAltaiAlbumDeleteError").removeClass( "ok" ).text( "" );
			
			return;
		}
		
		if( page == "ALBUM_REFRESH" ) {
			pageContainer.children( ".albumRefresh" ).show();
			
			$("#MSLAppAltaiAlbumRefreshError").removeClass( "ok" ).text( "" );
			
			return;
		}
		
		if( albumList.itemCount() ) {
			pageContainer.children( ".albumList" ).show();
			return;
		}
		
		pageContainer.children( ".albumListEmpty" ).show();
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppAltai").fadeIn();
		
		var button = $("#MSLAppAltai > header > div.navBack");
		button.addClass( "disabled" );
		
		showPage( null, false );
	}
	
	function hideApp() {
		$("section#MSLAppAltai").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		preloadSelect = 0;
		history = new MSLHistory( $("section#MSLAppAltai") );
		pageContainer = $("#MSLAppAltai > main");
		
		// Activate button control
		$(".MSLAppAltaiAddAlbum").click( function( evt ) {
			MSLAppAltai.showPage( "ALBUM_ADD_STEP_1", false );
		});
		
		// URL check
		$("#MSLAppAltaiInAlbumURL").on( "input propertychange paste", function( evt ) {
			var parse_url = document.createElement( "a" );
			var url = $(this).val();
			
			// Prepend http schema if there isn't any to prevent relative path search
			if( url.substr( 0, 4 ) != "http" ) {
				url = "http://" + url;
			}
			
			// Assign URL to href tag and let browser take care of parsing the URL
			parse_url.href = url;
			
			// Check for supported services
			if( parse_url.hostname == "imgur.com" ) {
				var url_parts = parse_url.pathname.split( "/" );
				var i;
				
				// Check for desires path stucture ( a/«id» must exist somewhere in the path )
				if( -1 != (i = url_parts.indexOf( "a" )) && "undefined" != typeof url_parts[i+1] && url_parts[i+1].length >= 1 ) {
					$("#MSLAppAltaiInAlbumURLError")
					.addClass( "ok" )
					.text( "Imgur recognized, press SUBMIT to add this album." );
					
					return;
				}
				
				$("#MSLAppAltaiInAlbumURLError")
				.removeClass( "ok" )
				.text( "Imgur recognized, but wrong album URL format. ( Example: http://imgur.com/a/9GmL3 )" );
				
				return;
			}
			else if( parse_url.hostname == "www.flickr.com" ) {
				var url_parts = parse_url.pathname.split( "/" ).filter( Boolean );
				
				if( url_parts.length >= 4 && !isNaN( url_parts[url_parts.length - 1] ) ) {
					$("#MSLAppAltaiInAlbumURLError")
					.addClass( "ok" )
					.text( "Flickr recognized, press SUBMIT to add this album." );
					
					return;
				}
				
				$("#MSLAppAltaiInAlbumURLError")
				.removeClass( "ok" )
				.text( "Flickr recognized, but wrong album URL format. ( Example: https://www.flickr.com/photos/flickr/galleries/72157675668930140 )" );
				
				return;
			}
			else if( parse_url.hostname == "drive.google.com" ) {
				var valid = false;
				var params = parse_url.search.substr( 1 );
				params = params.split( "&" );
				
				for( var i = 0; i < params.length; i++ ) {
					var param = params[0].split( "=" );
					
					if( param[0] == "id" ) {
						valid = true;
						break;
					}
				}
				
				if( !valid ) {
					valid = parse_url.pathname.indexOf( "drive/folders/" ) != -1;
				}
				
				if( valid ) {
					$("#MSLAppAltaiInAlbumURLError")
					.addClass( "ok" )
					.text( "Google Drive recognized, press SUBMIT to add this album." );
				}
				else {
					$("#MSLAppAltaiInAlbumURLError")
					.removeClass( "ok" )
					.text( "Google Drive recognized, but wrong album URL format. ( Example: https://drive.google.com/open?id=0BaREOsNGVRYBbeA7d2tSqFhTRms )" );
				}
			}
			else if( parse_url.hostname == "www.dropbox.com" ) {
				var valid = url.indexOf( "dl=0" ) >= 0 ? true : false;
				
				if( valid ) {
					$("#MSLAppAltaiInAlbumURLError")
					.addClass( "ok" )
					.text( "DropBox recognized, press SUBMIT to add this album. This may take a couple of seconds." );
				}
				else {
					$("#MSLAppAltaiInAlbumURLError")
					.removeClass( "ok" )
					.text( "DropBox recognized, but wrong album URL format. ( Example: https://www.dropbox.com/sh/0BaREOsNGVRYBbe/AAD-GPCB_VRYBbeA7d2tSqFhT?dl=0 )" );
				}
			}
		});
		
		// Cancel modal dialogs
		$("#MSLAppAltai #cancel").click( function( evt ) {
			MSLAppAltai.showPage( null, false );
		});
		
		// Send given URL to server to check for validility and fetch images
		$("#MSLAppAltai .albumAddStep1 #submit").click( function( evt ) {
			$("#MSLAppAltaiInAlbumURLError")
			.addClass( "ok" )
			.text( "Getting album images." );
			
			$.ajax({
				method: "POST",
				url: "json/altaiCreateNewAlbum.php",
				data: {
					uuid: MSLGlobals.uuid,
					url: encodeURIComponent( $("#MSLAppAltaiInAlbumURL").val() )
				}
			})
			.done( function( data ) {
				data = JSON.parse( data );
				
				if( data.status == 200 ) {
					$("#MSLAppAltaiInAlbumURLError")
					.removeClass( "ok" )
					.text( "" );
					
					$("#MSLAppAltaiInAlbumID").val( data.data.album );
					
					var $preview = $("#MSLAppAltaiAddAlbumPreview");
					var i;
					var len = data.data.images.length;
					var $dom;
					
					for( i = 0; i < len && i < 4; i++ ) {
						$dom = $(document.createElement( "div" ));
						$dom.css( "background-image", "url('" + data.data.images[i] + "')" );
						
						$preview.append( $dom );
					}
					
					if( i < len ) {
						var $overlay = $(document.createElement( "div" ));
						$overlay.addClass( "overlay" );
						$overlay.text( "+" + (len - i) );
						
						$dom.append( $overlay );
					}
					
					MSLAppAltai.showPage( "ALBUM_ADD_STEP_2", false );
				}
				else {
					var message = "Unknown error (" + data.status + ")";
					
					switch( data.status ) {
						case 401: message = "Only the owner may add images"; break;
						case 406: message = "Album does not exist"; break;
					}
					
					$("#MSLAppAltaiInAlbumURLError")
					.removeClass( "ok" )
					.text( message );
				}
			});
		});
		
		// Save the album to database
		$("#MSLAppAltai .albumAddStep2 #submit").click( function( evt ) {
			$("#MSLAppAltaiInAlbumNameError")
			.addClass( "ok" )
			.text( "Saving album." );
			
			$.ajax({
				method: "POST",
				url: "json/altaiEditAlbumName.php",
				data: {
					uuid: MSLGlobals.uuid,
					album: $("#MSLAppAltaiInAlbumID").val(),
					name: encodeURIComponent( $("#MSLAppAltaiInAlbumName").val() )
				}
			})
			.done( function( data ) {
				data = JSON.parse( data );
				
				if( data.status == 204 ) {
					$("#MSLAppAltaiInAlbumNameError")
					.addClass( "ok" )
					.text( "Album has been added!" );
					
					MSLAppManager.load( "altai" );
				}
				else {
					$("#MSLAppAltaiInAlbumNameError")
					.removeClass( "ok" )
					.text( "Couldn't save album: did you enter a valid name?" );
				}
			});
		});
		
		// Delete the album
		$("#MSLAppAltai .albumDelete #submit").click( function( evt ) {
			$("#MSLAppAltaiAlbumDeleteError")
			.addClass( "ok" )
			.text( "Deleting album." );
			
			$.ajax({
				method: "POST",
				url: "json/altaiDeleteAlbum.php",
				data: {
					uuid: MSLGlobals.uuid,
					album: $("#MSLAppAltaiDeleteAlbumID").val()
				}
			})
			.done( function( data ) {
				data = JSON.parse( data );
				
				if( data.status == 204 ) {
					$("#MSLAppAltaiAlbumDeleteError")
					.addClass( "ok" )
					.text( "Album has been deleted." );
					
					MSLAppManager.load( "altai" );
				}
				else {
					$("#MSLAppAltaiAlbumDeleteError")
					.removeClass( "ok" )
					.text( "An error occured while attempting to delete the album." );
				}
			});
		});
		
		// Refresh the album
		$("#MSLAppAltai .albumRefresh #submit").click( function( evt ) {
			$("#MSLAppAltaiAlbumRefreshError")
			.addClass( "ok" )
			.text( "Refreshing album." );
			
			$.ajax({
				method: "POST",
				url: "json/altaiRefreshAlbum.php",
				data: {
					uuid: MSLGlobals.uuid,
					album: $("#MSLAppAltaiRefreshAlbumID").val()
				}
			})
			.done( function( data ) {
				data = JSON.parse( data );
				
				if( data.status == 200 ) {
					$("#MSLAppAltaiAlbumRefreshError")
					.addClass( "ok" )
					.text( "Album has been refreshed." );
					
					MSLAppManager.load( "altai" );
				}
				else {
					$("#MSLAppAltaiAlbumRefreshError")
					.removeClass( "ok" )
					.text( "An error occured while attempting to refresh the album." );
				}
			});
		});
		
		// Initiate the station menu
		albumList = new RailMenu( $("#MSLAppAltai #albums"), {
			attributes: ["albumid", "albumname"],
		});
		
		albumList.settings.onSelect = function( item, toSync ) {
			if( toSync && MSLGlobals.sync ) {
				MSLGlobals.sync.send({
					c: OPCODE_ALTAI_SELECT,
					value: item.$DOM.attr( "id" )
				});
			}
			
			return true;
		}
		
		albumList.settings.onClick = function( item, toSync ) {
			MSLAppManager.load( "altaiIndex", {ID: item.albumid, Name: item.albumname}, toSync );
		};
		
		// Activate the search control
		$("input.MSLAppAltaiSearchCtrl").keypress( function( evt ) {
			if( evt.which == 13 ) {
				MSLAppAltai.search( $("input.MSLAppAltaiSearchCtrl").val() );
				return false;
			}
		});
		
		$("button.MSLAppAltaiSearchCtrl").click( function( evt ) {
			MSLAppAltai.search( $("input.MSLAppAltaiSearchCtrl").val() );
			return false;
		});
	}
	
	function fetchAlbumList( preloadSelect ) {
		preloadSelect = "undefined" != typeof preloadSelect ? preloadSelect : 0;
		
		// Clear the list from memory
		albumList.clear();
		
		// Fetch new complete album list
		$.ajax({
			method: "GET",
			url: "json/altaiFetchAlbums.php?uuid=" + MSLGlobals.uuid
		})
		.done( function( data ) {
			data = JSON.parse( data );
			
			if( data.status == 200 ) {
				for( var i = 0; i < data.data.albumCount; i++ ) {
					var $container = $(document.createElement( "li" ));
					$container.attr( "albumid", data.data.albums[i].ID );
					$container.attr( "albumname", data.data.albums[i].Name );
					
					var $options = $(document.createElement( "div" ));
					$options.addClass( "options" );
					
					if( MSLGlobals.isOwner ) {
						var $refresh = $(document.createElement( "div" ));
						$refresh.addClass( "refresh" );
						$refresh.attr( "albumid", data.data.albums[i].ID );
						$refresh.attr( "onclick", "$('#MSLAppAltaiRefreshAlbumID').val( $(this).attr( 'albumid' ) ); MSLAppAltai.showPage( 'ALBUM_REFRESH', false ); event.stopPropagation(); return false;" );
						
						$options.append( $refresh );
						
						var $delete = $(document.createElement( "div" ));
						$delete.addClass( "delete" );
						$delete.attr( "albumid", data.data.albums[i].ID );
						$delete.attr( "onclick", "$('#MSLAppAltaiDeleteAlbumID').val( $(this).attr( 'albumid' ) ); MSLAppAltai.showPage( 'ALBUM_DELETE', false ); event.stopPropagation(); return false;" );
						
						$options.append( $delete );
					}
					
					if( data.data.albums[i].PictureCount > 0 ) {
						var $pictureCount = $(document.createElement( "div" ));
						$pictureCount.addClass( "pictureCount" );
						$pictureCount.text( data.data.albums[i].PictureCount );
						$options.append( $pictureCount );
					}
					
					if( data.data.albums[i].VideoCount > 0 ) {
						var $videoCount = $(document.createElement( "div" ));
						$videoCount.addClass( "videoCount" );
						$videoCount.text( data.data.albums[i].VideoCount );
						$options.append( $videoCount );
					}
					
					if( data.data.albums[i].SongCount > 0 ) {
						var $songCount = $(document.createElement( "div" ));
						$songCount.addClass( "songCount" );
						$songCount.text( data.data.albums[i].SongCount );
						$options.append( $songCount );
					}
					
					$container.append( $options );
					
					var $album = $(document.createElement( "div" ));
					$album.addClass( "album" );
					$album.text( data.data.albums[i].Name );
					$container.append( $album );
					
					var $service = $(document.createElement( "div" ));
					$service.addClass( "service" );
					$service.text( data.data.albums[i].Service );
					$container.append( $service );
					
					albumList.addItem( $container );
				}
				
				albumList.present( preloadSelect );
				showPage( null, false );
			}
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.selected )
			preloadSelect = data.selected;
		
		if( "undefined" != typeof data.search ) {
			albumList.search( data.search );
			$("input.MSLAppAltaiSearchCtrl").val( data.search );
		}
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		isLoaded = true;
		
		setBackground();
		preload( data, true );
		
		// Fetch album list
		fetchAlbumList( preloadSelect );
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
		
		search: function( query, toSync ) {
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			if( toSync && MSLGlobals.sync ) {
				MSLGlobals.sync.send({
					c: OPCODE_ALTAI_SEARCH,
					query: query
				});
			}
			
			history.add( query );
			
			albumList.search( query );
			albumList.present();
			
			$("input.MSLAppAltaiSearchCtrl").val( query );
		},
		
		select: function( idx, toSync ) {
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			albumList.select( idx, true, toSync );
		},
	};
})();

MSLAppManager.register( "altai", MSLAppAltai, true );