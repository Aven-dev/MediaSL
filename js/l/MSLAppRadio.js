var MSLAppRadio = (function() {
	var stationMenu;
	
	var history = null;
	var isLoaded;
	var preloadSelect;
	var genreList = ["All", "Pop", "Decades", "Rock", "Metal", "Alternative", "International", "Electronic", "Inspirational", "New Age", "Jazz", "Blues", "Classical", "Country", "Folk", "Reggae", "Rap", "R&B and Urban", "Easy Listening", "Latin", "Soundtracks", "Public Radio", "Talk", "Misc"];
	var currentGenre = null;
	var viewman = null;
	
	var genreImages = {
		"Pop": "https://i.imgur.com/Elaz6cd.png",
		"Decades": "https://i.imgur.com/0dXzsUS.png",
		"Rock": "https://i.imgur.com/q3T665r.png",
		"Metal": "https://i.imgur.com/tMwNRQ2.png",
		"Alternative": "https://i.imgur.com/0OiXWvA.png",
		"International": "https://i.imgur.com/rj8miQi.png",
		"Electronic": "https://i.imgur.com/Da4kbLB.png",
		"Inspirational": "https://i.imgur.com/xtSTbte.png",
		"NewAge": "https://i.imgur.com/wfZJz4U.png",
		"Jazz": "https://i.imgur.com/Q1FHxhT.png",
		"Blues": "https://i.imgur.com/sc5d7xv.png",
		"Classical": "https://i.imgur.com/BPXfOT6.png",
		"Country": "https://i.imgur.com/96Rlhqb.png",
		"Folk": "https://i.imgur.com/tzDf7a5.png",
		"Reggae": "https://i.imgur.com/HIvoDgc.png",
		"Rap": "https://i.imgur.com/LYN3b5A.png",
		"EasyListening": "https://i.imgur.com/v05rh6s.png",
		"Latin": "https://i.imgur.com/IW9VsH9.png",
		"Soundtracks": "https://i.imgur.com/1VGct2f.png",
		"PublicRadio": "https://i.imgur.com/803GYVZ.png",
		"Talk": "https://i.imgur.com/03xAmRm.png",
		"Misc": "https://i.imgur.com/qGTHVfr.png",
		"RNBandUrban": "https://i.imgur.com/T2CmXWX.png",
	};
	
	function getGenreImage( genre ) {
		genre = genre.replace( " ", "" ).replace( " ", "" ).replace( " ", "" );
		genre = genre.replace( "&", "N" ).replace( "&", "N" ).replace( "&", "N" );
		
		if( !(genre in genreImages) )
			return "";
		
		return genreImages[genre];
	}
	
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
				c: OPCODE_RADIO_BACK
			});
		}
		
		let query = null;
		let genre = null;
		
		if( "object" == typeof to && to !== null ) {
			if( "q" in to )
				query = to.q;
			
			if( "g" in to )
				genre = to.g;
		}
		else {
			query = to.toString();
		}
		
		if( genre == "HOME" ) {
			$("input.MSLAppRadioSearchCtrl").val("");
			$(".MSLAppRadioSortCtrl").text( "Genres" ).css( "background-image", "none" );
			currentGenre = null;
			viewman.SetOneHideRestByID( "radioGenreList" );
		}
		else {
			viewman.SetOneHideRestByID( "radioStationList" );
			stationMenu.search( query, true, genre );
			stationMenu.present();
			$("input.MSLAppRadioSearchCtrl").val( query ? query : "" );
			$(".MSLAppRadioSortCtrl").text( genre ? genre : "Genres" ).css( "background-image", genre ? "url('"+getGenreImage( genre )+"')" : "none" );
			//  "url('../images/apps/wavestream/radio_" + genre.replaceAll( " ", "" ) + ".png')"
		}
		
	}
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#0094ff" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "color" );
		//$("#underlay > #videoBackground").css( "opacity", 1 );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppRadio").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppRadio").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		preloadSelect = 0;
		history = new MSLHistory( $("section#MSLAppRadio") );
		viewman = new VisibilityManager( $("#radioStationView > div"), false, {"radioGenreList": true} );
		
		// Activate the search control
		$("input.MSLAppRadioSearchCtrl").keypress( function( evt ) {
			if( evt.which == 13 ) {
				MSLGlobals.Audio.play( "button" );
				MSLAppRadio.search( $("input.MSLAppRadioSearchCtrl").val(), currentGenre );
				return false;
			}
		});
		
		$("button.MSLAppRadioSearchCtrl").click( function( evt ) {
			MSLGlobals.Audio.play( "button" );
			MSLAppRadio.search( $("input.MSLAppRadioSearchCtrl").val(), currentGenre );
			return false;
		});	
		
		$(".MSLAppRadioSortCtrl").click( function( evt ) {
			MSLGlobals.Audio.play( "button" );
			viewman.SetOneHideRestByID( "radioGenreList" );
			history.add( {q: "", g: "HOME"} );
			return false;
		});
		
		// Construct the genres
		const domGenreList = document.getElementById( "radioGenreList" );
		
		genreList.forEach( genre => {
			const container = document.createElement( "div" );
			
			const textContainer = document.createElement( "div" );
			const text = document.createElement( "h5" );
			text.innerHTML = genre;
			
			textContainer.classList.add( "text" );
			textContainer.append( text );
			container.append( textContainer );
			
			const background = document.createElement( "div" );
			background.classList.add( "background" );
			
			background.style.backgroundImage = "url('"+getGenreImage( genre )+"')";//"url('../images/apps/wavestream/radio_" + genre.replaceAll( " ", "" ) + ".png')"
			container.append( background );
			
			container.addEventListener( "click", function() {
				MSLGlobals.Audio.play( "button" );
				
				if( genre == "All" ) {
					$(".MSLAppRadioSortCtrl").text( "Genres" ).css( "background-image", "none" );
					currentGenre = null;
				}
				else {
					$(".MSLAppRadioSortCtrl").text( genre ).css( "background-image", "url('"+getGenreImage( genre )+"')" );
					currentGenre = genre;
				}
				
				MSLAppRadio.search( $("input.MSLAppRadioSearchCtrl").val(), currentGenre );
			});
			
			domGenreList.append( container );
		});
		
		// Construct the station list
		$.ajax({
			method: "GET",
			url: "json/radioStations.php"
		})
		.done( function( list ) {
			list = JSON.parse( list );
			var listLength = list.length;
			
			// Populate the menu
			for( var i = 0; i < listLength; i++ ) {
				$li = $(document.createElement( "li" ));
				$li.attr( "station", list[i].n );
				$li.attr( "genre", list[i].g );
				$li.attr( "subgenre", list[i].s ? "" : list[i].s );
				$li.attr( "stationid", list[i].id );
				$li.attr( "listeners", list[i].l );
				
				$li.append( $(document.createElement( "div" )).addClass( "listeners" ).addClass( "unselectable" ).text( list[i].l ) );
				$li.append( $(document.createElement( "div" )).addClass( "station" ).text( list[i].n ) );
				
				if( list[i].s ) {
					$li.append( $(document.createElement( "div" )).addClass( "genre" ).text( list[i].g + ", " + list[i].s ) );
				}
				else {
					$li.append( $(document.createElement( "div" )).addClass( "genre" ).text( list[i].g ) );
				}
				
				$("#MSLAppRadio #songs").append( $li );
			}
			
			// Initiate the station menu
			stationMenu = new RailMenu( $("#MSLAppRadio #songs"), {
				attributes: ["Station","Genre","Listeners","StationID"],
				activeAttribute: "Listeners",
			});
			
			stationMenu.settings.onSelect = function( item, toSync ) {
				if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
					MSLGlobals.Audio.play( "denied" );
					return;
				}
				
				if( toSync && MSLGlobals.sync ) {
					MSLGlobals.sync.send({
						c: OPCODE_RADIO_SELECT,
						value: item.$DOM.attr( "id" )
					});
				}
				
				return true;
			}
			
			stationMenu.settings.onClick = function( item, toSync ) {
				if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
					MSLGlobals.Audio.play( "denied" );
					return;
				}
				
				MSLAppManager.load( "radioListen", {ID: item.StationID}, toSync );
			};
			
			stationMenu.present();
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.selected )
			preloadSelect = data.selected;
		
		let search = "search" in data ? data.search : "";
		let genre = "type" in data ? data.type : null;
		
		let wait = setInterval( function() {
			if( "undefined" != typeof stationMenu ) {
				MSLAppRadio.search( search, genre, false );
				clearInterval( wait );
			}
		}, 200 );
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		if( reload ) {
			currentGenre = null;
			MSLAppRadio.search( "" );
		}
		else {
			history.add( {q: "", g: "HOME"} );
		}
		
		isLoaded = true;
		
		setBackground();
		//preload( data, true );
		
		if( preloadSelect && stationMenu ) {
			stationMenu.present( preloadSelect );
			preloadSelect = 0;
		}
		
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
		
		unload: function() {
			$("input.MSLAppRadioSearchCtrl").val("");
			$(".MSLAppRadioSortCtrl").text( "Genres" ).css( "background-image", "none" );
			
			currentGenre = null;
			history.clear();
			
			viewman.SetOneHideRestByID( "radioGenreList" );
		},
		
		search: function( query, genre, toSync ) {
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			// Tests for URLs with a trail e.g. http://www.station.com/listen
			const testForUrl = /^((https|http)?:\/\/)(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-z_!~*'()-]+\.)*([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\.[a-z]{2,6})(:[0-9]{1,4})?((\/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+\/?)$/i;
			
			if( testForUrl.test( query ) && query.length <= 255 ) {
				$("input.MSLAppRadioSearchCtrl").val("");
				MSLAppManager.load( "radioListen", {stream: query}, toSync && MSLGlobals.sync );
				
				return;
			}
			
			if( toSync && MSLGlobals.sync ) {
				MSLGlobals.sync.send({
					c: OPCODE_RADIO_SEARCH,
					query: query,
					type: genre
				});
			}
			
			if( genre == "HOME" ) {
				MSLGlobals.Audio.play( "back" );
				$("input.MSLAppRadioSearchCtrl").val("");
				$(".MSLAppRadioSortCtrl").text( "Genres" ).css( "background-image", "none" );
				currentGenre = null;
				history.add( {q: "", g: "HOME"} );
				viewman.SetOneHideRestByID( "radioGenreList" );
			}
			else {
				let idx = genreList.indexOf( genre );
				currentGenre = idx != -1 ? genreList[idx] : null;				
				
				history.add( {q: query, g: genre} );
				
				stationMenu.search( query, true, genre );
				stationMenu.present();
				viewman.SetOneHideRestByID( "radioStationList" );
				$("input.MSLAppRadioSearchCtrl").val( query );
				$(".MSLAppRadioSortCtrl").text( currentGenre ? currentGenre : "Genres" ).css( "background-image", currentGenre ? "url('"+getGenreImage( currentGenre )+"')" : "none" );
			}
		},
		
		select: function( idx, toSync ) {
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			stationMenu.select( idx, true, toSync );
		},
	};
})();

MSLAppManager.register( "radio", MSLAppRadio, true );