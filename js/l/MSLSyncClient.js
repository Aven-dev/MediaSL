// Establishes and handles a connection between the client and the MSL synchronization server
// @param1 string		* WebSocket URL of the server
// @param2 string		* UUID of the TV Object
// @param3 function		* Callback function for the received messages
// @param3 object		| Object containing callbacks for onopen, onclose, onmessage and/or onerror
var MSLSyncClient = function( url, objectUUID, callback )
{
	var self = this;
	
	this.socket;
	this.url = url;
	this.objectUUID = objectUUID;
	this.callback = callback;
	this.reconnecting = false;
	this.connected = false;
	this.pingTimer = null;
	this.pingTime = null;
	this.latency = 0;
	
	// Connects to the server
	// @return void
	this.connect = function() {
		// Close the connection of a connection already exists
		if( self.connected ) {
			self.socket.close();
			connected = false;
		}
		
		self.socket = new WebSocket( self.url );
		self.reconnecting = false;
		
		self.socket.onopen = function( evt ) { self.open( evt ); };
		self.socket.onclose = function( evt ) { self.close( evt ); };
		self.socket.onmessage = function( evt ) { self.recv( evt ); };
		self.socket.onerror = function( evt ) { self.error( evt ); };
	};
	
	// Reconnects to the server
	// @return void
	this.reconnect = function () {
		if( !this.reconnecting ) {
			var self = this;
			this.reconnecting = true;
			this.connected = false;
			setTimeout( self.connect, 5000 );
		}
	};
	
	// Sends data to the server
	// @param1 Object		* The data to send to the server
	// @return void
	this.send = function( dataObj ) {
		if( !this.connected )
			return;
		
		this.socket.send( JSON.stringify( dataObj ) );
	};
	
	this.ping = function() {
		if( !self.pingTimer ) {
			self.pingTimer = setInterval( self.ping, 25000 );
		}
		
		if( !self.connected || self.pingTime )
			return;
		
		self.pingTime = Math.round( window.performance.now() * 1000 );
		
		self.send({c: OPCODE_PING});
	};
	
	// Auto-connect
	this.connect();
	
	/* Event handlers */
	
	// (event) Called when a connection was established
	// @return void
	this.open = function( evt ) {
		$("#statusIcons > .sync").removeClass().addClass( "sync" ).addClass( "ok" );
		
		this.connected = true;
		
		// If there's a callback for this event, call it
		if( "object" == typeof self.callback && "function" == typeof self.callback.onopen )
			self.callback.onopen( evt );
		
		if( self.objectUUID == "SYNC_STATUS_CHECK" )
			return;
		
		this.send({
			c: OPCODE_REGISTER,
			objectUUID: this.objectUUID,
			defaultApp: MSLGlobals.DefaultApp
		});
		
		// Automatically start the ping process after one second of opening the connection
		setTimeout( self.ping, 1000 );
	};
	
	// (event) Called when a connection was dropped by server
	// @return void
	this.close = function( evt ) {
		$("#statusIcons > .sync").removeClass().addClass( "sync" ).addClass( "disconnected" );
		
		this.connected = false;
		
		// If there's a callback for this event, call it
		if( "object" == typeof self.callback && "function" == typeof self.callback.onclose )
			self.callback.onclose( evt );
		
		this.reconnect();
	};
	
	// (event) Called when a message has been received
	// @param1 string		* The text-data that was received
	// @return void
	this.recv = function( message ) {
		var data = JSON.parse( message.data );
		
		// Temporary code until all clients are guaranteed to have switched over to "data.c".
		if( "undefined" == typeof data.opcode ) {
			switch( data.c ) {
				case OPCODE_REGISTERED: data.opcode = "registered"; break;
				case OPCODE_PONG: data.opcode = "pong"; break;
				case OPCODE_LOAD: data.opcode = "load"; break;
				case OPCODE_OPEN: data.opcode = "open"; break;
				case OPCODE_SETLOCK: data.opcode = "setLock"; break;
				case OPCODE_KARAOKE_BACK: data.opcode = "karaoke.back"; break;
				case OPCODE_KARAOKE_SEARCH: data.opcode = "karaoke.search"; break;
				case OPCODE_KARAOKE_SELECT: data.opcode = "karaoke.select"; break;
				case OPCODE_RADIO_BACK: data.opcode = "radio.back"; break;
				case OPCODE_RADIO_SEARCH: data.opcode = "radio.search"; break;
				case OPCODE_RADIO_SELECT: data.opcode = "radio.select"; break;
				case OPCODE_ALTAI_SEARCH: data.opcode = "altai.search"; break;
				case OPCODE_ALTAI_SELECT: data.opcode = "altai.select"; break;
				case OPCODE_ALTAI_PAGE: data.opcode = "altaiIndex.page"; break;
				case OPCODE_ALTAI_VIEW: data.opcode = "altaiView.view"; break;
				case OPCODE_YOUTUBE_PAGE: data.opcode = "youtube.page"; break;
				case OPCODE_YOUTUBE_SEARCH: data.opcode = "youtube.search"; break;
				case OPCODE_YOUTUBE_CATEGORY: data.opcode = "youtube.category"; break;
				case OPCODE_YOUTUBE_BACK: data.opcode = "youtube.back"; break;
				case OPCODE_YOUTUBE_CHANNEL_PAGE: data.opcode = "youtubeChannel.page"; break;
				case OPCODE_YOUTUBE_CHANNEL_SEARCH: data.opcode = "youtubeChannel.search"; break;
				case OPCODE_YOUTUBE_CHANNEL_BACK: data.opcode = "youtubeChannel.back"; break;
				case OPCODE_YOUTUBE_NEXT: data.opcode = "youtubeWatch.onNext"; break;
				case OPCODE_YOUTUBE_PREV: data.opcode = "youtubeWatch.onPrev"; break;
				case OPCODE_YOUTUBE_REPLAY: data.opcode = "youtubeWatch.onReplay"; break;
				case OPCODE_YOUTUBE_LOOP: data.opcode = "youtubeWatch.onLoop"; break;
				case OPCODE_TWITCH_BACK: data.opcode = "twitch.back"; break;
				case OPCODE_TWITCH_PAGE: data.opcode = "twitch.page"; break;
				case OPCODE_TWITCH_SEARCH: data.opcode = "twitch.search"; break;
				case OPCODE_ADULT_PAGE: data.opcode = "adult.page"; break;
				case OPCODE_ADULT_SEARCH: data.opcode = "adult.search"; break;
				case OPCODE_ADULT_CATEGORY: data.opcode = "adult.category"; break;
				case OPCODE_ADULT_BACK: data.opcode = "adult.back"; break;
				case OPCODE_HHAVEN_SEARCH: data.opcode = "hhaven.search"; break;
				case OPCODE_HHAVEN_SECTION: data.opcode = "hhaven.section"; break;
				case OPCODE_HHAVEN_VARVAL: data.opcode = "hhaven.varval"; break;
				case OPCODE_HHAVEN_SELECT: data.opcode = "hhaven.select"; break;
				case OPCODE_HHAVEN_PAGE: data.opcode = "hhaven.page"; break;
				case OPCODE_SETTINGS_CHANGE: data.opcode = "settings.change"; break;
			}
		}
		else if( "undefined" == typeof data.c ) {
			switch( data.opcode ) {
				case "registered": data.c = OPCODE_REGISTERED; break;
				case "pong": data.c = OPCODE_PONG; break;
				case "load": data.c = OPCODE_LOAD; break;
				case "open": data.c = OPCODE_OPEN; break;
				case "setLock": data.c = OPCODE_SETLOCK; break;
				case "karaoke.back": data.c = OPCODE_KARAOKE_BACK; break;
				case "karaoke.search": data.c = OPCODE_KARAOKE_SEARCH; break;
				case "karaoke.select": data.c = OPCODE_KARAOKE_SELECT; break;
				case "radio.back": data.c = OPCODE_RADIO_BACK; break;
				case "radio.search": data.c = OPCODE_RADIO_SEARCH; break;
				case "radio.select": data.c = OPCODE_RADIO_SELECT; break;
				case "altai.search": data.c = OPCODE_ALTAI_SEARCH; break;
				case "altai.select": data.c = OPCODE_ALTAI_SELECT; break;
				case "altaiIndex.page": data.c = OPCODE_ALTAI_PAGE; break;
				case "altaiView.view": data.c = OPCODE_ALTAI_VIEW; break;
				case "youtube.page": data.c = OPCODE_YOUTUBE_PAGE; break;
				case "youtube.search": data.c = OPCODE_YOUTUBE_SEARCH; break;
				case "youtube.category": data.c = OPCODE_YOUTUBE_CATEGORY; break;
				case "youtube.back": data.c = OPCODE_YOUTUBE_BACK; break;
				case "youtubeChannel.page": data.c = OPCODE_YOUTUBE_CHANNEL_PAGE; break;
				case "youtubeChannel.search": data.c = OPCODE_YOUTUBE_CHANNEL_SEARCH; break;
				case "youtubeChannel.back": data.c = OPCODE_YOUTUBE_CHANNEL_BACK; break;
				case "youtubeWatch.onNext": data.c = OPCODE_YOUTUBE_NEXT; break;
				case "youtubeWatch.onPrev": data.c = OPCODE_YOUTUBE_PREV; break;
				case "youtubeWatch.onReplay": data.c = OPCODE_YOUTUBE_REPLAY; break;
				case "youtubeWatch.onLoop": data.c = OPCODE_YOUTUBE_LOOP; break;
				case "twitch.back": data.c = OPCODE_TWITCH_BACK; break;
				case "twitch.page": data.c = OPCODE_TWITCH_PAGE; break;
				case "twitch.search": data.c = OPCODE_TWITCH_SEARCH; break;
				case "adult.page": data.c = OPCODE_ADULT_PAGE; break;
				case "adult.search": data.c = OPCODE_ADULT_SEARCH; break;
				case "adult.category": data.c = OPCODE_ADULT_CATEGORY; break;
				case "adult.back": data.c = OPCODE_ADULT_BACK; break;
				case "hhaven.search": data.c = OPCODE_HHAVEN_SEARCH; break;
				case "hhaven.section": data.c = OPCODE_HHAVEN_SECTION; break;
				case "hhaven.varval": data.c = OPCODE_HHAVEN_VARVAL; break;
				case "hhaven.select": data.c = OPCODE_HHAVEN_SELECT; break;
				case "hhaven.page": data.c = OPCODE_HHAVEN_PAGE; break;
				case "settings.change": data.c = OPCODE_SETTINGS_CHANGE; break;
			}
		}
		
		if( self.pingTime && data.c == OPCODE_PONG ) {
			var pong = Math.round( window.performance.now() * 1000 );
			
			this.latency = Math.floor( (pong - self.pingTime) / 2 / 1000 );
			self.pingTime = 0;
			
			if( this.latency > 75 ) {
				$("#statusSyncIcon").css( "background-image", "url('../images/icon-sync-slow.png')" );
			}
			else {
				$("#statusSyncIcon").css( "background-image", "url('../images/icon-sync-ok.png')" );
			}
			
			return;
		}
		
		// If there's a callback for this event, call it
		if( "object" == typeof self.callback && "function" == typeof self.callback.onmessage )
			self.callback.onmessage( data );
		else if( "function" == typeof self.callback )
			self.callback( data );
	};
	
	// (event) Called when an error occured
	// @return void
	this.error = function( evt ) {
		$("#statusIcons > .sync").removeClass().addClass( "sync" ).addClass( "disconnected" );
		
		this.connected = false;
		
		// If there's a callback for this event, call it
		if( "object" == typeof self.callback && "function" == typeof self.callback.onerror )
			self.callback.onerror( evt );
		
		this.reconnect();
	}
}