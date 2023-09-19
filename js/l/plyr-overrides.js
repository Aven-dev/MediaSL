class fLoader extends Hls.DefaultConfig.loader {
	constructor( globalCfg ) {
		super( globalCfg );
		var load = this.load.bind( this );
		
		this.load = function( ctx, loadCfg, callbacks ) {
			//ctx.headers["Referrer-Policy"] = "no-referrer";
			if( globalCfg.proxy ) {
				let originalUrl = ctx.url;
				
				if( originalUrl.substring( 0, 35 ) == "https://api.allorigins.win/raw?url=" ) {
					originalUrl = decodeURIComponent( originalUrl.substr( 35 ) );
				}

				ctx.url = "https://api.allorigins.win/raw?url=" + encodeURIComponent( originalUrl );
				ctx.frag._url = "https://api.allorigins.win/raw?url=" + encodeURIComponent( originalUrl );
				ctx.frag.relurl = "https://api.allorigins.win/raw?url=" + encodeURIComponent( originalUrl );

				/*
					// No more proxy attempts.
					originalUrl = decodeURIComponent( originalUrl.substr( 35 ) );

					ctx.url = "http://www.whateverorigin.org/get?url=" + encodeURIComponent( originalUrl );
					ctx.frag._url = "http://www.whateverorigin.org/get?url=" + encodeURIComponent( originalUrl );
					ctx.frag.relurl = "http://www.whateverorigin.org/get?url=" + encodeURIComponent( originalUrl );

					console.log( "Attempting 4th proxy: " + ctx.url );
				}
				else if( originalUrl.substring( 0, 36 ) == "https://cors-anywhere.herokuapp.com/" ) {
					// Third proxy attempt
					originalUrl = originalUrl.substr( 36 );
					
					ctx.url = "https://api.allorigins.win/raw?url=" + encodeURIComponent( originalUrl );
					ctx.frag._url = "https://api.allorigins.win/raw?url=" + encodeURIComponent( originalUrl );
					ctx.frag.relurl = "https://api.allorigins.win/raw?url=" + encodeURIComponent( originalUrl );

					console.log( "Attempting 3rd proxy: " + ctx.url );
				}
				else if( originalUrl.substring( 0, 40 ) == "https://api.codetabs.com/v1/proxy?quest=" ) {
					originalUrl = originalUrl.substr( 40 );
					
					// Second proxy attempt
					ctx.url = "https://cors-anywhere.herokuapp.com/" + originalUrl;
					ctx.frag._url = "https://cors-anywhere.herokuapp.com/" + originalUrl;
					ctx.frag.relurl = "https://cors-anywhere.herokuapp.com/" + originalUrl;

					console.log( "Attempting 2nd proxy: " + ctx.url );
				}
				else {
					// First proxy attempt
					ctx.url = "https://api.codetabs.com/v1/proxy?quest=" + originalUrl;
					ctx.frag._url = "https://api.codetabs.com/v1/proxy?quest=" + originalUrl;
					ctx.frag.relurl = "https://api.codetabs.com/v1/proxy?quest=" + originalUrl;

					console.log( "Attempting 1st proxy: " + ctx.url );
				}*/
			}
			else {
				var onError = callbacks.onError;
				
				callbacks.onError = function( err, errCtx, details ) {
					if( err.code == 0 ) {
						globalCfg.proxy = true;
					}
					
					onError( err, errCtx, details );
				};
			}
			
			load( ctx, loadCfg, callbacks );
		};
	}
}