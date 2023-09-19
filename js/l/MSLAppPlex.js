class PlexShow
{
	constructor( dataObj ) {
		this.MediaID = dataObj.MediaID ?? null;
		this.Type = dataObj.Type ?? null;
		this.Title = dataObj.Title ?? null;
		this.Thumb = dataObj.Thumb ?? null;
	}
}

var MSLAppPlex = (function() {
	const sectionID = "MSLAppPlex";
	
	var isLoaded;
	var channelLibrary;
	
	var screenMan = null;
	var indexScroll = null;
	var indexDom = null;
	var observer = null;
	
	var filter = new Array;
	var selectedType = "both";
	var selectedCat = "Action";
	
	let hasDataFetched = false;
	const listAction = new Array;
	const listAnimation = new Array;
	const listComedy = new Array;
	const listCrime = new Array;
	const listDocumentary = new Array;
	const listDrama = new Array;
	const listHorror = new Array;
	const listMusical = new Array;
	const listRomance = new Array;
	const listScifi = new Array;
	const listThriller = new Array;
	const listWestern = new Array;
	
	//var lastSearchQuery;
	
	function isFilterMatch( filter, line ) {
		const words = line.toLowerCase().split( /[\s,\.-:;]+/ );
		
		if( filter.length > 0 ) {
			for( let f = 0; f < filter.length; ++f ) {
				let found = false;
				
				for( let w = 0; w < words.length; ++w ) {
					if( filter[f].length > 2 && words[w].indexOf( filter[f] ) != -1 ) {
						found = true;
						break;
					}
					
					if( filter[f].length <= 2 && words[w].substring( 0, filter[f].length ) == filter[f] ) {
						found = true;
						break;
					}
				}
				
				if( !found ) {
					return false;
				}
			}
		}
		
		return true;
	}
	
	function getFilteredList( list, type, filter ) {
		const results = new Array;
		
		for( let i = 0; i < list.length; ++i ) {
			if( !(type == "both" || list[i].Type[0] == type[0]) ) {
				continue;
			}
			
			if( !isFilterMatch( filter, list[i].Title ) ) {
				continue;
			}
			
			results.push( list[i] );
		}
		
		return results;
	}
	
	function render() {
		// Update filter input field
		let selectedTypeText = "Movies & Shows";
		
		switch( selectedType ) {
			case "movies": selectedTypeText = "Movies"; break;
			case "shows": selectedTypeText = "Shows"; break;
		}
		
		$("input.MSLAppPlexFilterCtrl").attr( "placeholder", "Filter " + selectedCat + " " + selectedTypeText );
		
		// Render list
		let selectedList = listAction;
		
		switch( selectedCat ) {
			case "Animation": selectedList = listAnimation; break;
			case "Comedy": selectedList = listComedy; break;
			case "Crime": selectedList = listCrime; break;
			case "Documentary": selectedList = listDocumentary; break;
			case "Drama": selectedList = listDrama; break;
			case "Horror": selectedList = listHorror; break;
			case "Musical": selectedList = listMusical; break;
			case "Romance": selectedList = listRomance; break;
			case "Sci-fi": selectedList = listScifi; break;
			case "Thriller": selectedList = listThriller; break;
			case "Western": selectedList = listWestern; break;
		}
		
		indexDom.innerHTML = "";
		
		const realResults = getFilteredList( selectedList, selectedType, filter );
		
		for( let i = 0; i < realResults.length; ++i ) {
			const item = document.createElement( "div" );
			item.classList.add( "item" );
			
			const itemBody = document.createElement( "div" );
			
			const imgContainer = document.createElement( "div" );
			imgContainer.classList.add( "thumb" );
			
			const img = document.createElement( "img" );
			
			if( realResults[i].ThumbLoaded ) {
				img.setAttribute( "src", "https://images.plex.tv/photo?scale=1&size=medium-240&url=" + encodeURIComponent( realResults[i].Thumb ) );
				img.ref = realResults[i];
			}
			else {
				img.setAttribute( "data-src", realResults[i].Thumb );
				img.ref = realResults[i];
				img.classList.add( "lazy" );
				
				observer.observe( item );
			}
			
			const txtContainer = document.createElement( "div" );
			txtContainer.classList.add( "info" );
			txtContainer.innerHTML = realResults[i].Title;
			
			item.addEventListener( "click", () => {
				MSLAppManager.load( "plexIndex", {mediaID: realResults[i].MediaID} );
			});
			
			imgContainer.append( img );
			itemBody.append( imgContainer );
			itemBody.append( txtContainer );
			item.append( itemBody );
			indexDom.append( item );
		}
		
		if( realResults.length == 0 ) {
			const noResult = document.createElement( "div" );
			noResult.classList.add( "noresult" );
			noResult.innerHTML = "<p>There are no <strong>" + selectedTypeText + "</strong> in <strong>" + selectedCat + "</strong>";
			
			if( filter.filter( i => /\S/.test(i) ).length ) {
				noResult.innerHTML += "&nbsp;titled \"<span>" + filter.join( " " ).replaceAll( /[<>]+/g, "" ) + "</span>\".";
			}
			
			noResult.innerHTML += "</p>";
			indexDom.append( noResult );
		}
		
		indexScroll.Reset();
		indexScroll.UpdateVisibility();
	}
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#333" );
		//$("#underlay > #videoBackground").css( "mix-blend-mode", "normal" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#" + sectionID + "").fadeIn(0);
		
		indexScroll.UpdateVisibility();
	}
	
	function hideApp() {
		$("section#" + sectionID + "").css( "display", "none" );
	}
	
	function loadImage( item, removeObserver ) {
		if( removeObserver )
			observer.unobserve( item );
		
		const img = item.getElementsByTagName( "img" )[0];
		
		if( img && img.hasAttribute( "data-src" ) ) {
			asyncLoadImagePromise( "https://images.plex.tv/photo?scale=1&size=medium-240&url=" + encodeURIComponent( img.getAttribute( "data-src" ) ) )
			.then( ( url ) => {
				img.setAttribute( "src", url );
				img.removeAttribute( "data-src" );
				img.classList.add( "lazy-loaded" );
				
				if( img.ref ) {
					img.ref.ThumbLoaded = true;
				}
			})
			.catch( () => {
				img.parentNode.remove();
			});
		}
	}
	
	function init() {
		isLoaded = false; 
		backgroundVideo = $("#underlay > video")[0];
		backgroundVideoSource = $("#underlay > video > source")[0];
		
		screenMan = new VisibilityManager( $("section#" + sectionID + " > main > section"), false, {plexHome:true} );
		indexScroll = new UndockedScrollbar( $("#plexIndex"), $("#plexIndexScroll") );
		indexDom = document.getElementById( "plexIndex" );
		
		observer = new IntersectionObserver( (entries, observer) => {
			let lastImageLoaded = null;
			
			// Load the visible images
			for( let i = 0; i < entries.length; ++i ) {
				if( !entries[i].isIntersecting )
					continue;
				
				loadImage( entries[i].target, true );
				lastImageLoaded = entries[i].target;
			}
			
			// Load the next row
			for( let i = 0; i < 10; ++i ) {
				if( lastImageLoaded ) {
					lastImageLoaded = lastImageLoaded.nextSibling;
					
					if( !lastImageLoaded )
						break;
					
					loadImage( lastImageLoaded, false );
				}
			}
		});
		
		// Activate the fitler control
		$("input.MSLAppPlexFilterCtrl").on( "keyup", function( evt ) {
			let val = $(this).val();
			val = val.trim();
			filter = val.toLowerCase().split( /[\s,\.-:;]+/ );
			
			render();
		});
		
		$("button.MSLAppGamesSearchCtrl").click( function( evt ) {
			let val = $("input.MSLAppPlexFilterCtrl").val();
			val = val.trim();
			filter = val.toLowerCase().split( /[\s,\.-:;]+/ );
			
			render();
			return false;
		});
	}
	
	function preload( data ) {
		// if( "undefined" != typeof data.search )
			// lastSearchQuery = data.search;
	}
	
	function fetchData() {
		$.ajax({
			method: "GET",
			url: "json/plexFetchShows.php"
		})
		.done( function( data ) {
			data = JSON.parse( data );
			
			if( !data || data.status != 200 || !data?.message?.shows?.length ) {
				//TODO: Show error if no data present already.
				return;
			}
			
			hasDataFetched = true;
			
			for( let i = 0; i < data.message.shows.length; ++i ) {
				const show = data.message.shows[i];
				let genre = show.Category;
				
				if( show.Genre ) {
					const genres = show.Genre.split( ", " );
					
					if( genres.indexOf( "Documentary" ) != -1 ) {
						genre = "Documentary";
					}
					else if( genres.indexOf( "Animation" ) != -1 ) {
						genre = "Animation";
					}
					else if( genres.length ) {
						genre = genres[0];
					}
				}
				
				switch( genre ) {
					case "Action": listAction.push( new PlexShow( show ) ); break;
					case "Animation": listAnimation.push( new PlexShow( show ) ); break;
					case "Comedy": listComedy.push( new PlexShow( show ) ); break;
					case "Crime": listCrime.push( new PlexShow( show ) ); break;
					case "Documentary": listDocumentary.push( new PlexShow( show ) ); break;
					case "Drama": listDrama.push( new PlexShow( show ) ); break;
					case "Horror": listHorror.push( new PlexShow( show ) ); break;
					case "Musical": listMusical.push( new PlexShow( show ) ); break;
					case "Romance": listRomance.push( new PlexShow( show ) ); break;
					case "Sci-fi": listScifi.push( new PlexShow( show ) ); break;
					case "Thriller": listThriller.push( new PlexShow( show ) ); break;
					case "Western": listWestern.push( new PlexShow( show ) ); break;
					
					default:
						switch( show.Category ) {
							case "Action": listAction.push( new PlexShow( show ) ); break;
							case "Animation": listAnimation.push( new PlexShow( show ) ); break;
							case "Comedy": listComedy.push( new PlexShow( show ) ); break;
							case "Crime": listCrime.push( new PlexShow( show ) ); break;
							case "Documentary": listDocumentary.push( new PlexShow( show ) ); break;
							case "Drama": listDrama.push( new PlexShow( show ) ); break;
							case "Horror": listHorror.push( new PlexShow( show ) ); break;
							case "Musical": listMusical.push( new PlexShow( show ) ); break;
							case "Romance": listRomance.push( new PlexShow( show ) ); break;
							case "Sci-fi": listScifi.push( new PlexShow( show ) ); break;
							case "Thriller": listThriller.push( new PlexShow( show ) ); break;
							case "Western": listWestern.push( new PlexShow( show ) ); break;
						}
					break;
				}
			}
			
			render();
		});
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		isLoaded = true;
		setBackground();
		preload( data, true );
		
		if( hasDataFetched ) {
			render();
		}
		else {
			fetchData();
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
		back: function(){},
		
		selectCategory: function( category, toSync = true ) {
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			$ctx = $("#plexHome > nav > ul > li");
			$ctx.removeClass( "selected" );
			
			$ctx.each( function( idx ) {
				$this = $(this);
				
				if( $this.text() == category ) {
					if( toSync && MSLGlobals.sync ) {
						MSLGlobals.sync.send({
							c: OPCODE_PASSTHROUGH,
							a: 0,
							v: category
						});
					}
					
					$this.addClass( "selected" );
					selectedCat = category;
					render();
					
					return false;
				}
			});
			
			MSLGlobals.Audio.play( "select" );
		},
		
		selectNextType: function() {
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			$ctx = $("#MSLAppPlex > header > div.categories > div");
			const len = $ctx.length;
			
			$ctx.each( function( index ) {
				const $this = $(this);
				const currentPos = $this.attr( "pos" );
				
				if( currentPos == -1 ) {
					$this.attr( "pos", len - 2 );
				}
				else {
					$this.attr( "pos", currentPos - 1 );
				}
				
				if( $this.attr( "pos" ) == 0 ) {
					selectedType = $this.attr( "type" );
					
					if( MSLGlobals.sync ) {
						MSLGlobals.sync.send({
							c: OPCODE_PASSTHROUGH,
							a: 1,
							v: selectedType
						});
					}
					
					render();
				}
			});
			
			MSLGlobals.Audio.play( "select" );
		},
		
		selectType: function( type, toSync = true ) {
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			console.log( ".... " + type );
			
			// both -> movies -> shows -> both -> ...
			
			$ctx = $("#MSLAppPlex > header > div.categories > div");
			
			$both = $ctx.filter("[type='both']");
			$movies = $ctx.filter("[type='movies']");
			$shows = $ctx.filter("[type='shows']");
			
			console.log( $both );
			console.log( $movies );
			console.log( $shows );
			
			if( type == "both" ) {
				$both.attr( "pos", 0 );
				$movies.attr( "pos", 1 );
				$shows.attr( "pos", -1 );
			}
			else if( type == "movies" ) {
				$both.attr( "pos", -1 );
				$movies.attr( "pos", 0 );
				$shows.attr( "pos", 1 );
			}
			else if( type == "shows" ) {
				$both.attr( "pos", 1 );
				$movies.attr( "pos", -1 );
				$shows.attr( "pos", 0 );
			}
			
			selectedType = type;
			
			if( toSync && MSLGlobals.sync ) {
				MSLGlobals.sync.send({
					c: OPCODE_PASSTHROUGH,
					a: 1,
					v: selectedType
				});
			}
			
			render();
			
			MSLGlobals.Audio.play( "select" );
		},
		
		passedThroughData: function( data ) {
			if( "undefined" != typeof data.a ) {
				if( data.a == 0 && "undefined" != typeof data.v ) {
					this.selectCategory( data.v, false );
				}
				else if( data.a == 1 && "undefined" != typeof data.v ) {
					this.selectType( data.v, false );
				}
			}
		}
	};
})();

MSLAppManager.register( "plex", MSLAppPlex, true );