var MSLAppPlutotvWatch = (function() {
	var player;
	var videoID;
	var isLoaded;
	var fullscreenOverlayTimer;
	
	var $overlay;
	var $overlayBox;
	
	var hlsMasterBasePath;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#000000" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppPlutotvWatch").fadeIn();
	}
	
	function hideApp() {
		$("section#MSLAppPlutotvWatch").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		player = new MSLVideoPlayer( $("#plutotvplayer"), {antiCors: true, hlsConfig: {
			pLoader: class pLoader extends Hls.DefaultConfig.loader {
				constructor( cfg ) {
					super( cfg );
					var load = this.load.bind( this );
					
					this.load = function( ctx, cfg, callbacks ) {
						const url = new URL( ctx.url );
						
						if( url.host == "corsproxy.io" ) {
							if( url.pathname != "/" ) {
								ctx.url = "https://" + url.host + "/?" + hlsMasterBasePath + url.pathname.substr( 1 ) + url.search
							}
						}
						
						load( ctx, cfg, callbacks );
					};
				}
			},
			manifestLoadingTimeOut: 7000,
			manifestLoadingMaxRetry: 2,
			fragLoadingTimeOut: 30000,
			fragLoadingMaxRetry: 3
		}} );
		videoID = null;
		
		
		$overlay = $("section#MSLAppPlutotvWatch > main > div.fullscreenOverlay");
		$overlayBox = $overlay.children().first();
		
		$(window).blur( function() {
			$overlay.css( "opacity", 0.0 );
		});
		
		$(window).on( "mouseout", function() {
			$overlay.css( "opacity", 0.0 );
		});
	}
	
	function preload( data ) {
		if( "undefined" != typeof data.videoID )
			videoID = data.videoID;
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		if( reload ) {
			// ..
		}
		
		isLoaded = true;
		setBackground();
		showApp();
		
		videoID = data.videoID;
		
		preload( data );
		
		if( player ) {
			player.destroy();
		}
		
		const channelData = MSLAppPlutotvData[videoID];
		//{"name":"Little Stars Universe","iconId":"51c75f7bb6f26ba1cd00002f","channelId":"51c75f7bb6f26ba1cd00002f","deviceId":"7f824826-2775-11ec-a646-0242ac120003","sId":"2b379a4a-d621-4d80-be17-5033141aba45"}
		const url = "https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/"+ channelData.channelId +"/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientTime=0&deviceDNT=0&deviceId="+ channelData.deviceId +"&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid="+ channelData.sId +"&userId=&serverSideAds=true&deviceLat=40.7157&deviceLon=-74.0000&marketingRegion=US";
		const url_o = new URL( url );
		hlsMasterBasePath = (url_o.protocol+"//"+url_o.hostname+url_o.pathname).split("/").slice( 0, -1 ).join( "/" )+"/";
		//const source = "https://hls.kosmi.io/" + btoa( url ) + ".m3u8";
		const source = "https://corsproxy.io/?" + encodeURI( url );
		//const source = "https://dlp.cdnproxy.kosmi.io/dlp.m3u8?url=" + encodeURI( url );
		
		player.init();
		player.load( source );
	}
	
	function open() {
		if( !isLoaded )
			load();
		
		setBackground();
		showApp();
	}
	
	function close() {
		if( player ) {
			player.destroy();
		}
		
		hideApp();
	}
	
	function back() {
		MSLAppManager.load( "plutotv" );
	}
	
	function onMouseMove( x, y ) {
		var centerX = 512; // 1024 / 2
		var centerY = 288; // 576 / 2
		var fadeDist = 40;
		
		var distX = Math.abs( x - centerX ) - ($overlayBox.width() / 2);
		var distY = Math.abs( y - centerY ) - ($overlayBox.height() / 2);
		
		if( distX <= 0 && distY <= 0 ) {
			$overlay.css( "opacity", 1.0 );
		}
		else {
			distX = 1.0 - (distX.clamp( 0, fadeDist ) / fadeDist);
			distY = 1.0 - (distY.clamp( 0, fadeDist ) / fadeDist);
			
			$overlay.css( "opacity", Math.min( distX, distY ) );
		}
	}
	
	return {
		init: init,
		preload: preload,
		load: load,
		open: open,
		close: close,
		back: back,
		
		onMouseMove: onMouseMove,
	};
})();

MSLAppManager.register( "plutotvWatch", MSLAppPlutotvWatch, true );