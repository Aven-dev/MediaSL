class MSLAppPlutotvLibrary
{
	constructor( scroll ) {
		this.scroll = scroll;
		this.channelList = $("#plutotvChannelList");
		this.data = MSLAppPlutotvData;
	}
	
	Render( filter = null ) {
		const self = this;
		self.channelList.empty();
		
		let imageObserver = new IntersectionObserver( (entries) => {
			entries.forEach( (entry) => {
				if( entry.isIntersecting ) {
					entry.target.src = entry.target.getAttribute( "data-src" );
					imageObserver.unobserve( entry.target )
				}
			});
		} );
		
		for( let i = 0; i < self.data.length; ++i ) {
			if( filter != null ) {
				if( !self.data[i].name.toLowerCase().includes( filter.toLowerCase() ) ) {
					continue;
				}
			}
			
			const container = $(document.createElement( "div" ));
			const logo = document.createElement( "img" );
			container.attr( "channelid", i );
			logo.setAttribute( "data-src", "https://images.pluto.tv/channels/" + self.data[i].iconId + "/colorLogoSVG.svg" );
			
			container.append( logo );
			imageObserver.observe( logo );
			
			self.channelList.append( container );
			
			// Click to enter this channel
			container.on( "click", function() {
				MSLAppManager.load( "plutotvWatch", {videoID: i} );
			});
		}
		
		self.scroll.UpdateVisibility();
	}
}

var MSLAppPlutotv = (function() {
	const sectionID = "MSLAppPlutotv";
	
	var isLoaded;
	var plutotvScroll;
	var hasRendered = false;
	var channelLibrary;
	
	//var lastSearchQuery;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#333" );
		//$("#underlay > #videoBackground").css( "mix-blend-mode", "normal" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#" + sectionID + "").fadeIn();
		
		if( !hasRendered ) {
			channelLibrary.Render();
			hasRendered = true;
		}
		
		plutotvScroll.UpdateVisibility();
	}
	
	function hideApp() {
		$("section#" + sectionID + "").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false; 
		backgroundVideo = $("#underlay > video")[0];
		backgroundVideoSource = $("#underlay > video > source")[0];
		
		plutotvScroll = new UndockedScrollbar( $("#plutotvChannelList"), $("#plutotvScroll") );
		channelLibrary = new MSLAppPlutotvLibrary( plutotvScroll );
		
		// Activate the search control
		$("input.MSLAppPlutotvSearchCtrl").on( "keyup", function( evt ) {
			const $this = $(this);
			
			if( $this.val().length >= 1 ) {
				channelLibrary.Render( $this.val() );
			}
			else if( $this.val().length == 0 ) {
				channelLibrary.Render();
			}
		});
		
		/*
		$("button.MSLAppGamesSearchCtrl").click( function( evt ) {
			MSLGlobals.Audio.play( "button" );
			MSLAppGames.search( $("input.MSLAppGamesSearchCtrl").val() );
			return false;
		});*/
	}
	
	function preload( data ) {
		// if( "undefined" != typeof data.search )
			// lastSearchQuery = data.search;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		isLoaded = true;
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
		close: close,
		back: function(){},
		
		/*search: function( query, toSync ) {
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
					opcode: "games.search",
					query: query
				});
			}
			
			vidsPages.search( query );
			
			$("input.MSLAppGamesSearchCtrl").val( lastSearchQuery );
		},*/
	};
})();

MSLAppManager.register( "plutotv", MSLAppPlutotv, true );