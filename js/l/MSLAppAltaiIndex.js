var MSLAppAltaiIndex = (function() {
	var isLoaded = false;
	var gallery = new SimpleGalleryPages( "MSLAppAltaiIndex", "AltaiAlbumContent", OPCODE_ALTAI_VIEW, 4, 3 );
	var albumID = null;
	var albumName = "";
	
	function fetchAlbum( albumID ) {
		gallery.clear();
		
		$.ajax({
			method: "GET",
			url: "json/altaiShowAlbum.php?uuid=" + MSLGlobals.uuid + "&album=" + albumID,
			cache: true
		})
		.done( function( data ) {
			data = JSON.parse( data );
			
			if( data.status == 200 ) {
				for( var i = 0; i < data.data.pictureCount; i++ ) {
					const itemCreatePromise = new Promise( (resolve, reject) => {
						const dataObj = {
							isVideo:  -1 != data.data.pictures[i].mimeType.indexOf( "video" ),
							isAudio:  -1 != data.data.pictures[i].mimeType.indexOf( "audio" ),
							isImage:  -1 != data.data.pictures[i].mimeType.indexOf( "image" ),
							domContainer: document.createElement( "div" ),
							fallbackThumb: null,
							data: { ...data.data.pictures[i] }
						};

						if( dataObj.isVideo ) { dataObj.fallbackThumb = "url('/images/thumb-video.png')"; }
						else if( dataObj.isAudio ) { dataObj.fallbackThumb = "url('/images/thumb-audio.png')"; }
						else if( dataObj.isImage ) { dataObj.fallbackThumb = "url('/images/thumb-image.png')"; }

						dataObj.domContainer.className = "picture";
						dataObj.domContainer.setAttribute( "index", i );

						dataObj.domContainer.addEventListener( "click", function() {
							MSLAppManager.load( "altaiView", {albumID: parseInt( albumID ), index: parseInt( $(this).attr( "index" ) ), autoplay: false} );
						});

						dataObj.domContainer.addEventListener( "mouseenter", () => {
							MSLGlobals.Audio.play( "hover" );
						});

						gallery.add( $(dataObj.domContainer) );

						if( data.data.pictures[i].thumbnail && data.data.pictures[i].thumbnail.charAt(0) != "/" ) {
							const thumbLoad = new Image();
							thumbLoad.addEventListener( "load", () => { resolve( dataObj ); } );
							thumbLoad.addEventListener( "error", () => { reject( dataObj ); } );
							thumbLoad.src = data.data.pictures[i].thumbnail;
							return;
						}
						else if( dataObj.isImage ) {
							const thumbLoad = new Image();
							thumbLoad.addEventListener( "load", () => { resolve( dataObj ); } );
							thumbLoad.addEventListener( "error", () => { reject( dataObj ); } );

							dataObj.data.thumbnail = data.data.pictures[i].source;
							thumbLoad.src = data.data.pictures[i].source;
							return;
						}

						reject( dataObj );
					} ).then( (dataObj) => {
						dataObj.domContainer.style.backgroundImage = "url('" + dataObj.data.thumbnail + "')";
						dataObj.domContainer.style.backgroundColor = "#000";

						if( dataObj.isVideo ) {
							const overlay = document.createElement( "div" );
							overlay.className =  "video";
							dataObj.domContainer.appendChild( overlay );
						}
					} ).catch( (dataObj) => {
						const name = document.createElement( "p" );
						name.innerText = dataObj.data.name.length < 42 ? dataObj.data.name : dataObj.data.name.substr( 0, 42 ) + " ...";
						dataObj.domContainer.appendChild( name );

						if( dataObj.fallbackThumb ) {
							dataObj.domContainer.style.backgroundImage = dataObj.fallbackThumb;
						}
						else {
							dataObj.domContainer.style.backgroundColor = "#000";
							dataObj.domContainer.style.color = "#fff";
						}
					});
				}
				
				gallery.goToPage( 1 );
			}
		});
	}
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#744321" );
	}
	
	function showApp() {
		$("#MSLAppAltaiIndexTitle").text( albumName );
		
		$("body > section").css( "display", "none" );
		$("section#MSLAppAltaiIndex").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppAltaiIndex").css( "display", "none" );
	}
	
	function init() {
		// Bind the page control buttons
		$("#MSLAppAltaiIndex #pageControlPrev").click( function() {
			gallery.prevPage();
		});
		
		$("#MSLAppAltaiIndex #pageControlNext").click( function() {
			gallery.nextPage();
		});
		
		$("#MSLAppAltaiIndex .MSLAppAltaiPlaySlideshow").click( function() {
			MSLAppManager.load( "altaiView", {albumID: parseInt( albumID ), index: 0, autoplay: true} );
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.ID )
			albumID = data.ID;
		
		if( "undefined" != typeof data.albumID )
			albumID = data.albumID;
		
		if( "undefined" != typeof data.Name )
			albumName = data.Name;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		isLoaded = true;
		
		setBackground();
		preload( data, true );
		
		fetchAlbum( albumID );
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
		
		back: function() {},
		page: gallery.goToPage,
	};
})();

MSLAppManager.register( "altaiIndex", MSLAppAltaiIndex, true );