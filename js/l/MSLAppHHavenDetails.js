var MSLAppHHavenDetails = (function() {
	var isLoaded;
	var vidsPages;
	var vidsLoadedID;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#323232" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "overlay" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );;
		$("section#MSLAppHHavenDetails").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppHHavenDetails").css( "display", "none" );
	}
	
	function fetchVideos( id ) {
		if( vidsLoadedID != id ) {
			// Create loading message
			var $loadContainer = $(document.createElement( "div" )).addClass( "loading" ).addClass( "fullpage" );
			var $loadContent = $(document.createElement( "h1" ));
			
			$loadContent.text( "Loading.." );
			
			$loadContainer.append( $loadContent );
			vidsPages.clear();
			vidsPages.getContainer().append( $loadContainer );
			
			$.ajax({
				method: "GET",
				url: "json/hhavenEpisodes.php",
				data: { SerieID: id }
			})
			.done( function( data ) {
				$loadContainer.remove();
				
				var vidsList = JSON.parse( data );
				
				if( vidsList.status == 200 && "undefined" != typeof vidsList.message.episodes ) {
					vidsLoadedID = id;
					
					// Apply serie information
					var $intro = $(document.createElement( "section" ));
					
					if( "undefined" != typeof vidsList.message.serie.CoverArt && vidsList.message.serie.CoverArt !== null ) {
						var $artContainer = $(document.createElement( "header" ));
						
						var $art = $(document.createElement( "img" ));
						$art.addClass( "unselectable" );
						$art.attr( "src", vidsList.message.serie.CoverArt );
						
						$artContainer.append( $art );
						$intro.append( $artContainer );
					}
					
					var $textContainer = $(document.createElement( "main" ));
					
					if( "undefined" != typeof vidsList.message.serie.Title && vidsList.message.serie.Title !== null ) {
						/*var $textHeader = $(document.createElement( "h1" ));
						$textHeader.text( vidsList.message.serie.Title );
						$textContainer.append( $textHeader );*/
						
						var headerTitle = vidsList.message.serie.Title.substr( 0, 48 );
						
						if( headerTitle.length == 48 ) {
							var lastSpace = headerTitle.lastIndexOf( " " );
							
							if( -1 != lastSpace ) {
								headerTitle = headerTitle.substr( 0, lastSpace ) + " ...";
							}
						}
						
						$("section#MSLAppHHavenDetails > header > h1").html( headerTitle );
					}
					
					if( "undefined" != typeof vidsList.message.serie.AlternativeTitle && vidsList.message.serie.AlternativeTitle !== null ) {
						var $textHeader = $(document.createElement( "h1" ));
						$textHeader.html( "Alternative titles:<br />" + vidsList.message.serie.AlternativeTitle );
						$textContainer.append( $textHeader );
					}
					
					if( "undefined" != typeof vidsList.message.serie.Description && vidsList.message.serie.Description !== null ) {
						var $textBody = $(document.createElement( "div" ));
						$textBody.addClass( "body" );
						$textBody.html( vidsList.message.serie.Description );
						$textContainer.append( $textBody );
						
						var $textScroll = $(document.createElement( "div" ));
						$textScroll.addClass( "scrollbar" );
						
						var $textTrack = $(document.createElement( "div" ));
						$textTrack.addClass( "track" );
						
						var $textThumb = $(document.createElement( "div" ));
						$textThumb.addClass( "thumb" );
						
						$textTrack.append( $textThumb );
						$textScroll.append( $textTrack );
						$textContainer.append( $textScroll );
					}
					
					$intro.append( $textContainer );
					vidsPages.add( $intro );
					
					var $textContainerScrollbar = new UndockedScrollbar( $textBody, $textScroll );
					$textContainerScrollbar.Reset();
					$textContainerScrollbar.UpdateVisibility();
					
					// Video list has been successfully loaded
					var vidsListLength = vidsList.message.episodes.length;
					
					for( var i = 0; i < vidsListLength; i++ ) {
						var $vid = $(document.createElement( "section" ));
						var $imgContainer = $(document.createElement( "header" ));
						
						var $img = $(document.createElement( "img" ));
						$img.addClass( "unselectable" );
						$img.attr( "src", vidsList.message.episodes[i].ImageThumbnails[0] );
						$imgContainer.append( $img );
						
						$vid.append( $imgContainer );
						
						var $textContainer = $(document.createElement( "main" ));
						
						var $textHeader = $(document.createElement( "h2" ));
						$textHeader.text( "Episode " + vidsList.message.episodes[i].Episode );
						$textContainer.append( $textHeader );
						
						$vid.append( $textContainer );
						
						$vid.attr( "onclick", "MSLAppManager.load( 'hhavenWatch', {ID: '" + vidsList.message.episodes[i].EpisodeID + "'});" );
						
						$vid.on( "mouseenter", function( evt ) {
							MSLGlobals.Audio.play( "hover" );
						});
						
						vidsPages.add( $vid );
					}
				}
			});
		}
	}
	
	function init() {
		isLoaded = false;
		vidsLoadedID = null;
		
		vidsPages = new MSLPaginator( $("#MSLAppHHavenDetails > main > div.videoResults"), {
			$controls: $("#MSLAppHHavenDetails > footer > .pageControls"),
			resultsPerPage: 8,
			rows: 2,
			firstAddSpace: 4
			});
	}
	
	function preload( data ) {
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		if( "undefined" == typeof data.ID ) {
			MSLAppManager.open( "hhaven" );
			return;
		}
		
		isLoaded = true;
		fetchVideos( data.ID );
		setBackground();
		preload( data, true );
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
		close: close
	};
})();

MSLAppManager.register( "hhavenDetails", MSLAppHHavenDetails, true );