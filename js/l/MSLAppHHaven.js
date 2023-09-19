var MSLAppHHaven = (function() {
	var isLoaded;
	var selectorMenu;
	var lastSearchQuery;
	
	var tagsLoadOnInit;
	var tagsLoadOnInitSelected;
	var tagsLoaded;
	var tagsSelected;
	var tagsSelectedTags;
	var tagsPages;
	
	var vidsLoaded;
	var vidsPages;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#323232" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "overlay" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppHHaven > main").css( "display", "none" );
		$("section#MSLAppHHaven > main#main").css( "display", "" );
		$("section#MSLAppHHaven").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppHHaven").css( "display", "none" );
	}
	
	function loadArtWork( $imgContainer ) {
		if( $imgContainer.children().length != 0 )
			return;
		
		const url = $imgContainer.attr( "src-data" );
		
		if( url ) {
			new Promise( (resolve, reject) => {
				setTimeout( () => {
					const img = new Image();
					
					img.addEventListener( "load", function() {
						resolve( img );
					});
					
					img.addEventListener( "error", function() {
						reject();
					});
					
					img.src = url;
				}, 0 );
			})
			.then( function( img ) {
				var $img = $(document.createElement( "img" ));
				$img.addClass( "unselectable" );
				$img.attr( "src", url );
				$imgContainer.append( $img );
			})
			.catch( function( e ) {
				var $img = $(document.createElement( "img" ));
				$img.addClass( "unselectable" );
				$img.attr( "src", "/images/apps/adult/artwork_unavailable.png" );
				$imgContainer.append( $img );
			});
		}
		else {
			var $img = $(document.createElement( "img" ));
			$img.addClass( "unselectable" );
			$img.attr( "src", "/images/apps/adult/artwork_unavailable.png" );
			$imgContainer.append( $img );
		}
	}
	
	function fetchVideos() {
		if( !vidsLoaded ) {
			// Create loading message
			var $loadContainer = $(document.createElement( "div" )).addClass( "loading" ).addClass( "fullpage" );
			var $loadContent = $(document.createElement( "h1" ));
			
			$loadContent.text( "Loading.." );
			
			$loadContainer.append( $loadContent );
			tagsPages.getContainer().append( $loadContainer );
			
			$.ajax({
				method: "GET",
				url: "json/hhavenVideos.php"
			})
			.done( function( data ) {
				$loadContainer.remove();
				
				var vidsList = JSON.parse( data );
				
				if( vidsList.status == 200 && vidsList.message.length ) {
					// Video list has been successfully loaded
					var vidsListLength = vidsList.message.length;
					
					for( var i = 0; i < vidsListLength; i++ ) {
						var $vid = $(document.createElement( "section" ));
						var $imgContainer = $(document.createElement( "header" ));
						$imgContainer.attr( "src-data", vidsList.message[i].CoverArt );
						
						if( i < 4 ) {
							// Always load the first four images.
							loadArtWork( $imgContainer );
						}
						
						$vid.append( $imgContainer );
						
						var $textContainer = $(document.createElement( "main" ));
						var $textHeader = $(document.createElement( "h2" ));
						
						$textHeader.html( vidsList.message[i].Title );
						
						$textContainer.append( $textHeader );
						$vid.append( $textContainer );
						
						// Apply search data; delete unnecessary
						var searchData = "";
						
						for( var k in vidsList.message[i] ) {
							if( !vidsList.message[i].hasOwnProperty( k ) )
								continue;
							
							if( k == "CoverArt" )
								continue;
							
							searchData += " " + vidsList.message[i][k];
						}
						
						var letter = vidsList.message[i].Title.charAt( 0 ).toLowerCase();
						if( letter >= 0 && letter <= 9 ) { letter = "#"; }
						
						$vid.attr( "search-data", searchData );
						$vid.attr( "letter", letter );
						$vid.attr( "onclick", "MSLAppManager.load( 'hhavenDetails', {ID: '" + vidsList.message[i].SerieID + "'});" );
						
						$vid.on( "mouseenter", function( evt ) {
							MSLGlobals.Audio.play( "hover" );
						});
						
						vidsPages.add( $vid );
					}
				}
				
				if( lastSearchQuery ) {
					MSLAppHHaven.search( lastSearchQuery, false );
				}
			});
			
			vidsLoaded = true;
		}
	}
	
	function categoryListContextOpen( toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		MSLGlobals.Audio.play( "button" );
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_HHAVEN_SECTION,
				section: "categoryList",
			});
		}
		
		if( !tagsLoaded ) {
			// Create loading message
			var $loadContainer = $(document.createElement( "div" )).addClass( "loading" ).addClass( "fullpage" );
			var $loadContent = $(document.createElement( "h1" ));
			
			$loadContent.text( "Loading.." );
			
			$loadContainer.append( $loadContent );
			tagsPages.getContainer().append( $loadContainer );
			
			$.ajax({
				method: "GET",
				url: "json/hhavenTags.php"
			})
			.done( function( data ) {
				$loadContainer.remove();
				
				var tagList = JSON.parse( data );
				
				if( tagList.status == 200 && tagList.message.length ) {
					// Tag list has been successfully loaded
					var tagListLength = tagList.message.length;
					
					for( var i = 0; i < tagListLength; i++ ) {
						var $tag = $(document.createElement( "li" ));
						
						$tag.attr( "id", tagList.message[i][0] );
						$tag.text( tagList.message[i][1] );
						
						$tag.on( "click", function() { MSLAppHHaven.tagSelectionToggle( $(this) ); } );
						
						tagsPages.add( $tag );
					}
				}
				
				for( var i = 0; i < tagsLoadOnInitSelected.length; i++ ) {
					MSLAppHHaven.tagSelectionToggle( tagsLoadOnInitSelected[i], true, false );
				}
			});
			
			tagsLoaded = true;
		}
		
		$("section#MSLAppHHaven > header > .navButton").css( "opacity", ".4" ).css( "pointer-events", "none" );;
		$("section#MSLAppHHaven > header > .appLogo").css( "opacity", ".4" ).css( "pointer-events", "none" );;
		$("section#MSLAppHHaven > header > .search").css( "opacity", ".4" ).css( "pointer-events", "none" );;
		$("section#MSLAppHHaven > main").css( "display", "none" );
		$("section#MSLAppHHaven > footer > div.pageControls").css( "display", "none" );
		$("section#MSLAppHHaven > main#categories").css( "display", "block" );
	}
	
	function categoryListContextClose( toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
			MSLGlobals.Audio.play( "denied" );
			return;
		}
		
		MSLGlobals.Audio.play( "button" );
		
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_HHAVEN_SECTION,
				section: null,
			});
		}
		
		$("section#MSLAppHHaven > header > .navButton").css( "opacity", "1" ).css( "pointer-events", "" );;
		$("section#MSLAppHHaven > header > .appLogo").css( "opacity", "1" ).css( "pointer-events", "" );;
		$("section#MSLAppHHaven > header > .search").css( "opacity", "1" ).css( "pointer-events", "" );;
		$("section#MSLAppHHaven > main").css( "display", "none" );
		$("section#MSLAppHHaven > main#main").css( "display", "block" );
		$("section#MSLAppHHaven > footer > div.pageControls").css( "display", "block" );
	}
	
	function init() {
		isLoaded = false;
		lastSearchQuery = "";
		tagsLoadOnInit = false;
		tagsLoaded = false;
		tagsSelected = new Array;
		tagsSelectedTags = new Array;
		tagsLoadOnInitSelected = new Array;
		
		tagsPages = new MSLPaginator( $("#MSLAppHHaven > main#categories > div.tagResults"), {
			$controls: $("#MSLAppHHaven > main#categories > .pageControls"), 
			resultsPerPage: 48, 
			rows: 1, 
			pageContainerType: "ul",
			pageContainerClass: "tags"
			});
		
		vidsPages = new MSLPaginator( $("#MSLAppHHaven > main#main > div.videoResults"), {
			syncID: OPCODE_HHAVEN_PAGE,
			$controls: $("#MSLAppHHaven > footer > .pageControls"),
			resultsPerPage: 4,
			rows: 1,
			onPageChange: function( $pageShown ) {
				// Change selected letter
				var letter = vidsPages.getCurrentPageByLastProperty( "letter" );
				
				for( var i = 0; i < selectorMenu.m_filtered.length; i++ ) {
					var firstLetter = selectorMenu.m_collection[selectorMenu.m_filtered[i]].$DOM.text().charAt( 0 ).toLowerCase();
					
					if( letter == firstLetter ) {
						selectorMenu.select( selectorMenu.m_filtered[i], false );
						break;
					}
				}
				
				// Ensure image is loaded.
				const $imgContainers = $pageShown.find( "section > header" );
				
				for( let i = 0; i < $imgContainers.length; ++i ) {
					loadArtWork( $imgContainers.eq( i ) );
				}
			}
			});
		
		$("section#MSLAppHHaven > header > div.categories").on( "click", MSLAppHHaven.categoryButtonCallback );
		
		// Activate the search control
		$("input.MSLAppHHavenSearchCtrl").keypress( function( evt ) {
			if( evt.which == 13 ) {
				MSLGlobals.Audio.play( "button" );
				MSLAppHHaven.search( $("input.MSLAppHHavenSearchCtrl").val() );
				return false;
			}
		});
		
		$("button.MSLAppHHavenSearchCtrl").click( function( evt ) {
			MSLGlobals.Audio.play( "button" );
			MSLAppHHaven.search( $("input.MSLAppHHavenSearchCtrl").val() );
			return false;
		});
		
		// Initiate the selector menu
		selectorMenu = new RailMenu( $("#MSLAppHHaven #selector"), {} );
		
		selectorMenu.settings.onSelect = function( item, toSync ) {
			var goToLetter = item.$DOM.text().charAt( 0 ).toLowerCase();
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			if( toSync && MSLGlobals.sync ) {
				MSLGlobals.sync.send({
					c: OPCODE_HHAVEN_SELECT,
					value: goToLetter
				});
			}
			
			vidsPages.pageByProperty( "letter", goToLetter );
		};
		
		selectorMenu.present();
	}
	
	function preload( data ) {
		// data.page		integer
		// data.search		string
		// data.tagsPage	integer when active, NULL when inactive
		// data.tags		array
		// data.history		array
		
		if( "undefined" != typeof data.search )
			lastSearchQuery = data.search;
		
		if( "undefined" != typeof data.tagsPage && data.tagsPage !== null )
			tagsLoadOnInit = true;
		
		if( "undefined" != typeof data.tags )
			tagsLoadOnInitSelected = data.tags;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		isLoaded = true;
		fetchVideos();
		setBackground();
		preload( data, true );
		showApp();
		
		if( tagsLoadOnInit )
			categoryListContextOpen( false );
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
		page: function( p1, p2 ) { vidsPages.page( p1, p2 ); },
		
		categoryButtonCallback: function( setState, toSync ) {
			if( "object" == typeof setState ) {
				setState = $("section#MSLAppHHaven > main#main").css( "display" ) != "none";
				toSync = true;
			}
			else {
				setState = "undefined" != typeof setState ? setState : false;
				toSync = "undefined" != typeof toSync ? toSync : true;
			}
			
			if( setState ) {
				// Visible category prompt
				categoryListContextOpen( toSync );
			}
			else {
				// Invisible category prompt
				categoryListContextClose( toSync );
			}
		},
		
		tagSelectionToggle: function( $DOM, setState, toSync ) {
			$DOM = $DOM instanceof jQuery ? $DOM : $("section#MSLAppHHaven > main#categories > div.tagResults").find( "#" + $DOM ).first();
			setState = "undefined" != typeof setState ? setState : null;
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			var id = $DOM.attr( "id" );
			var found = tagsSelected.indexOf( id );
			
			if( found != -1 && setState !== true ) {
				if( toSync && MSLGlobals.sync ) {
					MSLGlobals.sync.send({
						c: OPCODE_HHAVEN_VARVAL,
						id: id,
						val: false
					});
				}
				
				tagsSelected.splice( found, 1 );
				tagsSelectedTags.splice( found, 1 );
				$DOM.removeClass( "selected" );
			}
			else if( found == -1 && setState !== false ) {
				if( tagsSelected.length < 4 ) {
					if( toSync && MSLGlobals.sync ) {
						MSLGlobals.sync.send({
							c: OPCODE_HHAVEN_VARVAL,
							id: id,
							val: true
						});
					}
					
					tagsSelected.push( id );
					tagsSelectedTags.push( $DOM.text().toLowerCase() );
					$DOM.addClass( "selected" );
				}
			}
			
			MSLAppHHaven.search( lastSearchQuery + "|" + tagsSelectedTags.join( "|" ) );
			
			$("section#MSLAppHHaven > header > div.categories").attr( "num", tagsSelected.length );
			$("section#MSLAppHHaven #numActiveTags").text( tagsSelected.length );
		},
		
		search: function( query, toSync ) {
			query = "undefined" != typeof query ? query : "";
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			query = query + "|" + tagsSelectedTags.join( "|" );
			lastSearchQuery = query.split( "|" )[0];
			
			if( toSync && MSLGlobals.sync ) {
				MSLGlobals.sync.send({
					c: OPCODE_HHAVEN_SEARCH,
					query: query
				});
			}
			
			vidsPages.search( query );
			
			$("input.MSLAppHHavenSearchCtrl").val( lastSearchQuery );
		},
		
		select: function( letter, toSync ) {
			toSync = "undefined" != typeof toSync ? toSync : true;
			
			if( !MSLGlobals.isOwner && MSLGlobals.isLocked && toSync ) {
				MSLGlobals.Audio.play( "denied" );
				return;
			}
			
			vidsPages.pageByProperty( "letter", letter );
		},
	};
})();

MSLAppManager.register( "hhaven", MSLAppHHaven, true );