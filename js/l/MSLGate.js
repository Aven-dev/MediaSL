Number.prototype.clamp = function( min, max ) {
	return Math.min( Math.max( this, min ), max );
};

function toggleCompatibilityInfo() {
	const $target = $("#compatibilitySupport");
	const $replacewith = $("#homeMainMenu");
	const supportHidden = $target.css( "display" ) == "none";
	
	if( supportHidden ) {
		$target.css( "display", "flex" );
		$replacewith.css( "display", "none" );
	}
	else {
		$target.css( "display", "none" );
		$replacewith.css( "display", "flex" );
	}
	
	MSLGlobals.Audio.play( "select" );
}

function gotoUrlBrowserGate( url ) {
	if( MSLGlobals.BrowserAck == 1 || Cookies.get( "MessageBrowser" ) == 1 ) {
		MSLAppManager.gotoURL( url );
	}
	else {
		const cloned = $("#MessageBrowser").clone();
		
		cloned.attr( "url", url );
		
		$(cloned.find( "#MessageBrowserUserAck" )[0].nextElementSibling).attr( "for", "MessageBrowserUserAck_C" );
		cloned.find( "#MessageBrowserUserAck" ).attr( "id", "MessageBrowserUserAck_C" );
		
		$(cloned.find( "#MessageBrowserOwnerAck" )[0].nextElementSibling).attr( "for", "MessageBrowserOwnerAck_C" );
		cloned.find( "#MessageBrowserOwnerAck" ).attr( "id", "MessageBrowserOwnerAck_C" );
		
		if( !MSLGlobals.isOwner ) {
			cloned.find( "#MessageBrowserOwnerAck_C" ).parent().remove();
		}
		
		$(document.body).append( cloned );
	}
}

function browserGateChoiceHandler( $ctx ) {
	if( $ctx.find( "#MessageBrowserUserAck_C" )[0].checked ) {
		setBooleanCookie( "MessageBrowser" );
	}
	
	if( MSLGlobals.isOwner && $ctx.find( "#MessageBrowserOwnerAck_C" )[0].checked ) {
		MSLGlobals.BrowserAck = 1;
		MSLAppSettings.SetBrowserAcknowledged( 1 );
		
		$ctx.remove();
		
		setTimeout( function() {
			MSLAppManager.gotoURL( $ctx.attr( "url" ) );
		}, 300 );
		
		return;
	}
	
	$ctx.remove();
	MSLAppManager.gotoURL( $ctx.attr( "url" ) );
}

function setBooleanCookie( id ) {
	Cookies.set( id, 1, { expires: 90 } );
}

function MSLGate() {
	if( !MSLGlobals.isOwner && MSLGlobals.PrivateMode ) {
		const $lockScreen = $("#PrivateModeLockScreen");
		const $codeContainer = $("#PrivateModeLockScreenCodeContainer");
		const $codePart1 = $("#PrivateModeLockScreenCodePart1");
		const $codePart2 = $("#PrivateModeLockScreenCodePart2");
		const $codePart3 = $("#PrivateModeLockScreenCodePart3");
		const $codePart4 = $("#PrivateModeLockScreenCodePart4");
		const $input = $("#PrivateModeLockScreenInput");
		const $welcome = $("#PrivateModeLockScreenWelcome");
		const $padLockKeys = $("#PrivateModeLockScreenPad > div");
		const $clickToAccessText = $("#PrivateModeLockScreenWelcome > h2");
		
		let screenState = false;
		let inputFails = 0;
		let timeoutSince = 0;
		
		const fnSwitchStateWelcome = function() {
			screenState = false;
			
			$clickToAccessText.text( "Try again in 45 seconds" );
			let timeoutTimer = setInterval( function() {
				const diff = Date.now() - timeoutSince;
				
				if( diff > 45000 ) {
					clearInterval( timeoutTimer );
					$clickToAccessText.text( "Click here to access" );
					$lockScreen.on( "click", fnWelcomeScreenClick );
				}
				else {
					$clickToAccessText.text( "Try again in " + (45 - (Math.ceil( diff / 1000 ) - 1)) + " seconds" );
				}
			}, 1000 );
			
			$welcome.stop( true, true );
			$input.stop( true, true ).fadeOut( 300, function() {
				$lockScreen.children( "div" ).stop( true, true ).animate({
					height: "88px"
				}, {
					duration: 300,
					easing: "linear",
					always: function() {
						$lockScreen.children( "div" ).css( "height", "88px" );
					}
				});
				
				$welcome.css( "display", "block" ).stop( true, true ).animate({
					blur: 0,
					opacity: 1.0
				}, {
					duration: 300,
					easing: "linear",
					step: function() {
						$welcome.css( "filter", "blur(" + (this.blur) + "px)" );
					},
					always: function() {
						$welcome.css({
							opacity: "1.0",
							filter: "blur(0px)",
						});
					}
				});
			});
		};
		
		const fnSwitchStateInput = function() {
			$lockScreen.off( "click" );
			
			screenState = true;
			
			$input.stop( true, true );
			$welcome.stop( true, true ).animate({
				blur: 20,
				opacity: 0.0
			}, {
				duration: 300,
				easing: "linear",
				step: function() {
					$welcome.css( "filter", "blur(" + this.blur + "px)" );
				},
				always: function() {
					$welcome.css({
						opacity: "0.0",
						filter: "blur(0px)",
						display: "none"
					});
				}
			});
			
			$lockScreen.children( "div" ).stop( true, true ).animate({
				height: "80%"
			}, {
				duration: 300,
				easing: "linear",
				always: function() {
					$lockScreen.children( "div" ).css( "height", "80%" );
					$input.fadeIn( 300 );
				}
			});
		};
		
		const fnWelcomeScreenClick = function() {
			if( !screenState ) {
				fnSwitchStateInput();
			}
		};
		
		const fnAddPadInput = function( n ) {
			let currentInput = [$codePart1.attr( "val" ),$codePart2.attr( "val" ),$codePart3.attr( "val" ),$codePart4.attr( "val" )].join("");
			
			switch( currentInput.length ) {
				case 0:
					$codePart1.text( "*" );
					$codePart1.attr( "val", n );
					break;
				case 1:
					$codePart2.text( "*" );
					$codePart2.attr( "val", n );
					break;
				case 2:
					$codePart3.text( "*" );
					$codePart3.attr( "val", n );
					break;
				case 3:
					$codePart4.text( "*" );
					$codePart4.attr( "val", n );
					$codeContainer.addClass( "processing" );
					
					currentInput = [$codePart1.attr( "val" ),$codePart2.attr( "val" ),$codePart3.attr( "val" ),$codePart4.attr( "val" )].join("");
					
					$.get({
						url: "json/query.php",
						data: {
							uuid: MSLGlobals.uuid,
							k: "CheckPIN",
							v: parseInt( currentInput ),
						},
						success: function( response ) {
							try {
								response = JSON.parse( response );
								
								if( response.data.result ) {
									// Success!
									StartMSL();
									return;
								}
							}
							catch( e ) {}
							
							$codeContainer.removeClass( "processing" );
							$codePart1.html( "&nbsp;" ).attr( "val", "" );
							$codePart2.html( "&nbsp;" ).attr( "val", "" );
							$codePart3.html( "&nbsp;" ).attr( "val", "" );
							$codePart4.html( "&nbsp;" ).attr( "val", "" );
							
							if( ++inputFails >= 3 ) {
								timeoutSince = Date.now();
								inputFails = 0;
								fnSwitchStateWelcome();
							}
						},
						error: function( evt ) {
							$codeContainer.removeClass( "processing" );
							$codePart1.html( "&nbsp;" ).attr( "val", "" );
							$codePart2.html( "&nbsp;" ).attr( "val", "" );
							$codePart3.html( "&nbsp;" ).attr( "val", "" );
							$codePart4.html( "&nbsp;" ).attr( "val", "" );
							
							if( ++inputFails >= 3 ) {
								timeoutSince = Date.now();
								inputFails = 0;
								fnSwitchStateWelcome();
							}
						}
					});
					
					break;
			}
		};
		
		$lockScreen.on( "click", fnWelcomeScreenClick );
		$padLockKeys.on( "click", function() {
			const $self = $(this);
			fnAddPadInput( $self.text() );
		});
		
		$lockScreen.show(0);
	}
	else {
		StartMSL();
	}
}