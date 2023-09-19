var MSLGlobals = {
	sync: null,
	isOwner: false,
	uuid: ""
};

const OPCODE_PING = 1;
const OPCODE_PONG = 2;
const OPCODE_REGISTER = 3;
const OPCODE_REGISTERED = 4;
const OPCODE_LOAD = 5;
const OPCODE_OPEN = 6;
const OPCODE_SETLOCK = 7;
const OPCODE_PASSTHROUGH = 19;
const OPCODE_SETTINGS_CHANGE = 20;
const OPCODE_ADULT_BACK = 30;
const OPCODE_ADULT_PAGE = 31;
const OPCODE_ADULT_SEARCH = 32;
const OPCODE_ADULT_CATEGORY = 33;
const OPCODE_ALTAI_SELECT = 40;
const OPCODE_ALTAI_SEARCH = 41;
const OPCODE_ALTAI_VIEW = 46;
const OPCODE_ALTAI_PAGE = 48;
const OPCODE_HHAVEN_SECTION = 50;
const OPCODE_HHAVEN_SELECT = 51;
const OPCODE_HHAVEN_VARVAL = 52;
const OPCODE_HHAVEN_SEARCH = 53;
const OPCODE_HHAVEN_PAGE = 54;
const OPCODE_KARAOKE_BACK = 60;
const OPCODE_KARAOKE_SELECT = 61;
const OPCODE_KARAOKE_SEARCH = 62;
const OPCODE_TWITCH_BACK = 70;
const OPCODE_TWITCH_PAGE = 71;
const OPCODE_TWITCH_SEARCH = 72;
const OPCODE_YOUTUBE_BACK = 80;
const OPCODE_YOUTUBE_PAGE = 81;
const OPCODE_YOUTUBE_SEARCH = 82;
const OPCODE_YOUTUBE_CATEGORY = 83;
const OPCODE_YOUTUBE_CHANNEL_PAGE = 84;
const OPCODE_YOUTUBE_CHANNEL_BACK = 85;
const OPCODE_YOUTUBE_CHANNEL_SEARCH = 86;
const OPCODE_YOUTUBE_NEXT = 87;
const OPCODE_YOUTUBE_PREV = 88;
const OPCODE_YOUTUBE_REPLAY = 89;
const OPCODE_YOUTUBE_LOOP = 90;
const OPCODE_RADIO_BACK = 120;
const OPCODE_RADIO_SELECT = 121;
const OPCODE_RADIO_SEARCH = 122;

function syncMessageHandler( data ) {
	switch( data.c ) {
	case OPCODE_REGISTERED: MSLAppManager.registered( data.appState ); break;
	case OPCODE_LOAD: MSLAppManager.load( data.appName, data.data, false ); break;
	case OPCODE_OPEN: MSLAppManager.open( data.appName, false ); break;
	case OPCODE_SETLOCK: MSLAppManager.setLock( data.value ); break;
	case OPCODE_PASSTHROUGH: MSLAppManager.passedThroughData( data ); break;
	case OPCODE_KARAOKE_SEARCH: MSLAppKaraoke.search( data.query, false ); break;
	case OPCODE_KARAOKE_SELECT: MSLAppKaraoke.select( data.value, false ); break;
	case OPCODE_RADIO_SEARCH: MSLAppRadio.search( data.query, typeof data.type == "undefined" ? null : data.type, false ); break;
	case OPCODE_RADIO_SELECT: MSLAppRadio.select( data.value, false ); break;
	case OPCODE_RADIO_BACK: MSLAppRadio.back( false ); break;
	case OPCODE_ALTAI_SEARCH: MSLAppAltai.search( data.query, false ); break;
	case OPCODE_ALTAI_SELECT: MSLAppAltai.select( data.value, false ); break;
	case OPCODE_ALTAI_PAGE: MSLAppAltaiIndex.page( data.value, false ); break;
	case OPCODE_ALTAI_VIEW: MSLAppAltaiView.loadImage( data.value, false ); break;
	case OPCODE_YOUTUBE_PAGE: MSLAppYoutube.page( data.value, false ); break;
	case OPCODE_YOUTUBE_SEARCH: MSLAppYoutube.search( data.query, typeof data.type == "undefined" ? 1 : data.type, false ); break;
	case OPCODE_YOUTUBE_CATEGORY: MSLAppYoutube.category( data.category, false ); break;
	case OPCODE_YOUTUBE_BACK: MSLAppYoutube.back( false ); break;
	case OPCODE_YOUTUBE_CHANNEL_PAGE: MSLAppYoutubeChannel.page( data.value, false ); break;
	case OPCODE_YOUTUBE_CHANNEL_SEARCH: MSLAppYoutubeChannel.search( data.query, false ); break;
	case OPCODE_YOUTUBE_CHANNEL_BACK: MSLAppYoutubeChannel.back( false ); break;
	case OPCODE_YOUTUBE_NEXT: MSLAppYoutubeWatch.onNext( false ); break;
	case OPCODE_YOUTUBE_PREV: MSLAppYoutubeWatch.onPrev( false ); break;
	case OPCODE_YOUTUBE_REPLAY: MSLAppYoutubeWatch.onReplay( false ); break;
	case OPCODE_YOUTUBE_LOOP: MSLAppYoutubeWatch.onLoop( false ); break;
	case OPCODE_TWITCH_SEARCH: MSLAppTwitch.search( data.query, false ); break;
	case OPCODE_TWITCH_PAGE: MSLAppTwitch.page( data.value, false ); break;
	case OPCODE_ADULT_PAGE: MSLAppAdult.page( data.value, false ); break;
	case OPCODE_ADULT_SEARCH: MSLAppAdult.search( data.query, false ); break;
	case OPCODE_ADULT_CATEGORY: MSLAppAdult.category( data.category, false ); break;
	case OPCODE_ADULT_BACK: MSLAppAdult.back( false ); break;
	case OPCODE_HHAVEN_SEARCH: MSLAppHHaven.search( data.query, false ); break;
	case OPCODE_HHAVEN_SECTION: MSLAppHHaven.categoryButtonCallback( data.section == "categoryList", false ); break;
	case OPCODE_HHAVEN_VARVAL: MSLAppHHaven.tagSelectionToggle( data.id, data.val, false ); break;
	case OPCODE_HHAVEN_SELECT: MSLAppHHaven.select( data.value, false ); break;
	case OPCODE_HHAVEN_PAGE: MSLAppHHaven.page( data.value, false ); break;
	case OPCODE_SETTINGS_CHANGE: MSLAppSettings.SettingsMenuChange( data.setting, data.value, false ); break;
	}
}

function clock() {
	var time = new Date();
	var hours = time.getHours();
	var minutes = time.getMinutes();
	var meridiem = (hours < 12) ? "AM" : "PM";
	
	minutes = (minutes < 10 ? "0" : "") + minutes;
	hours = hours > 12 ? hours - 12 : hours;
	hours = hours == 0 ? 12 : hours;
	
	if( MSLGlobals.DisplayTimeFormat != 0 ) {
		var timeFormat = new Intl.DateTimeFormat( "en-us", {
			weekday: "long",
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
			fractionalSecondDigits: 3,
			hour12: true,
			timeZone: "America/Los_Angeles"
		});
		
		var timeParts = timeFormat.formatToParts( time );
		
		for( let i = 0; i < timeParts.length; ++i ) {
			if( timeParts[i].type == "hour" ) {
				hours = timeParts[i].value;
			}
			else if( timeParts[i].type == "minute" ) {
				minutes = timeParts[i].value;
			}
			else if( timeParts[i].type == "dayPeriod" ) {
				meridiem = timeParts[i].value;
			}
		}
	}
	
	var displayTime = hours + ":" + minutes + " " + meridiem;
	
	if( $("time").html() != displayTime )
		$("time").html( displayTime );
	
	setTimeout( clock, 1000 );
}

function asyncLoadImagePromise( url ) {
	return new Promise( (resolve, reject) => {
		setTimeout( () => {
			const imgLoader = new Image();
			
			imgLoader.addEventListener( "load", function() {
				resolve( imgLoader.getAttribute( "src" ) );
			});
			
			imgLoader.addEventListener( "error", function() {
				reject();
			});
			
			imgLoader.src = url;
		}, 1 );
	});
}

class MSLVersion
{
	constructor( version ) {
		version = String( parseInt( version ) ).padStart( 6, "0" );
		
		this.major = parseInt( version.substring( 0, version.length - 5 ) );
		this.minor = parseInt( version.slice( -5, -3 ) );
		this.build = parseInt( version.slice( -3 ) );
	}

	Get() {
		return String( this.major ) + String( this.minor ).padStart( 2, "0" ) + String( this.build ).padStart( 3, "0" );
	}

	GetMajor() {
		return this.major;
	}

	GetMinor() {
		return this.minor;
	}

	GetBuild() {
		return this.build;
	}

	IsAtLeast( major, minor = 0, build = 0 ) {
		return this.major >= major && this.minor >= minor && this.build >= build;
	}

	IsAtMost( major, minor = 0, build = 0 ) {
		return this.major <= major && this.minor <= minor && this.build <= build;
	}

	toString() {
		return this.Get();
	}
}