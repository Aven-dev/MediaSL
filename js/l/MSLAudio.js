function MSLAudio( enabled ) {
	var list = {};
	
	enabled = "undefined" != typeof enabled ? enabled : true;
	
	this.add = function( id, source, volume ) {
		if( "undefined" != typeof list[id] )
			return false;
		
		if( undefined == volume )
			volume = 1.0;
		
		list[id] = {
			source: source,
			audio: new Audio( source ),
			volume: volume
			};
		
		list[id].audio.volume = volume;
		
		list[id].audio.addEventListener( "ended", function() {
			this.currentTime = 0;
		});
		
		return true;
	};
	
	this.play = function( id ) {
		if( !enabled || "undefined" == typeof list[id] )
			return false;
		
		if( list[id].audio.paused ) {
			list[id].audio.play();
		}
		else {
			var tmpAudio = new Audio( list[id].source );
			tmpAudio.volume = list[id].volume;
			tmpAudio.play();
			tmpAudio = null;
		}
		
		return true;
	}
	
	this.disable = function() { enabled = false; }
	this.enable = function() { enabled = true; }
}