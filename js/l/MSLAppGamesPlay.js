var MSLAppGamesPlay = (function() {
	const sectionID = "MSLAppGamesPlay";
	
	var isLoaded;
	var gameLib;
	var gameDiv;
	
	function setBackground() {
		$("#underlay > #videoBackground").css( "backgroundColor", "#323232" );
		$("#underlay > #videoBackground").css( "mix-blend-mode", "overlay" );
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#" + sectionID + "").fadeIn();
	}
	
	function hideApp() {
		$("section#" + sectionID + "").css( "display", "none" );
	}
	
	function init() {
		isLoaded = false;
		gameLib = MSLAppGamesData;
		
		gameDiv = retroInit();
	}
	
	function preload( data ) {
	}
	
	function load( data, reload ) {
		data = "undefined" != typeof data ? data : {};
		reload = "undefined" != typeof reload ? reload : false;
		
		let controls = null;
		
		switch( gameLib[data.gameID].sysID ) {
			case "snes": controls = getSnesControls(); break;
		}
		
		startGame( gameDiv, {
			sys : gameLib[data.gameID].sysID,
			rom : gameLib[data.gameID].rom,
			controls: controls
		});
		
		isLoaded = true;
		setBackground();
		preload( data, true );
		showApp();
	}
	
	function getSnesControls() {
		return {
			0: {
				[RETRO_KEY_UP]: {
					"type": RETRO_INPUT_KB,
					"index": "0",
					"value": $("#snesControlUp").attr( "key" )
				},
				[RETRO_KEY_DOWN]: {
					"type": RETRO_INPUT_KB,
					"index": "0",
					"value": $("#snesControlDown").attr( "key" )
				},
				[RETRO_KEY_LEFT]: {
					"type": RETRO_INPUT_KB,
					"index": "0",
					"value": $("#snesControlLeft").attr( "key" )
				},
				[RETRO_KEY_RIGHT]: {
					"type": RETRO_INPUT_KB,
					"index": "0",
					"value": $("#snesControlRight").attr( "key" )
				},
				[RETRO_KEY_Y]: {
					"type": RETRO_INPUT_KB,
					"index": "0",
					"value": $("#snesControlY").attr( "key" )
				},
				[RETRO_KEY_X]: {
					"type": RETRO_INPUT_KB,
					"index": "0",
					"value": $("#snesControlX").attr( "key" )
				},
				[RETRO_KEY_A]: {
					"type": RETRO_INPUT_KB,
					"index": "0",
					"value": $("#snesControlA").attr( "key" )
				},
				[RETRO_KEY_B]: {
					"type": RETRO_INPUT_KB,
					"index": "0",
					"value": $("#snesControlB").attr( "key" )
				},
				[RETRO_KEY_START]: {
					"type": RETRO_INPUT_KB,
					"index": "0",
					"value": $("#snesControlStart").attr( "key" )
				},
				[RETRO_KEY_SELECT]: {
					"type": RETRO_INPUT_KB,
					"index": "0",
					"value": $("#snesControlSelect").attr( "key" )
				},
			}
		};
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
	};
})();

MSLAppManager.register( "gamesPlay", MSLAppGamesPlay, true );