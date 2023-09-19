var MSLAppSettings = (function() {
	var isLoaded;
	var scrollbarOriginalHeight = null;
	var scrollbarMainHeight = null;
	var settingsMenuScroll = null;
	
	function setBackground() {
	}
	
	function showApp() {
		$("body > section").css( "display", "none" );
		$("section#MSLAppSettings > main > section").css( "display", "none" );
		$("section#MSLAppSettings > main > section#SettingsMenu").css( "display", "block" );
		$("section#MSLAppSettings").css( "backgroundColor", "transparent" );
		$("section#MSLAppSettings").fadeIn();
		
		settingsMenuScroll.UpdateVisibility();
	}
	
	function hideApp() {
		$("section#MSLAppSettings").css( "backgroundColor", "transparent" );
		$("section#MSLAppSettings").css( "display", "none" );
		disableScrollbar();
	}
	
	function init() {
		isLoaded = false;
		
		$(".SettingsSelection > .prev").on( "click", function() { SettingsSelectionGoToRel( $(this), -1 ); });
		$(".SettingsSelection > .next").on( "click", function() { SettingsSelectionGoToRel( $(this), 1 ); });
		$(".SettingsInput > .save").on( "click", function() { SettingsInputSave( $(this) ); });
		$(".SettingsInput > div.value > select").on( "change", function() { SettingsInputGoToRel( $(this) ); });
		
		try {
			settingsMenuScroll = new UndockedScrollbar( $("#settingsMenuBody"), $("#settingsMenuScroll") );
			settingsMenuScroll.UpdateVisibility();
		}
		catch( e ) {
			settingsMenuScroll = null;
		}
		
		const pinKeyEventHandler = function( evt, $ctx, $prevField = null, $nextField = null ) {
			$ctx.removeClass( "invalid" );
			
			if( (evt.keyCode >= 49 && evt.keyCode <= 57) || (evt.keyCode >= 97 && evt.keyCode <= 105) ) {
				// The key pressed was 1-9 on keyboard or numpad.
				$ctx.val( evt.key );
				$("#SettingsMenuPrivateModePIN .save").addClass( "changes" );
				
				if( $nextField )
					$nextField.focus();
			}
			else if( evt.keyCode == 38 ) {
				// The key pressed was arrow up (doesn't matter if numlock is off).
				// Increment the number by one or if empty, start with one.
				let newValue = parseInt( $ctx.val() );
				
				$ctx.val( isNaN( newValue ) ? 1 : ++newValue >= 10 ? 1 : newValue );
				$("#SettingsMenuPrivateModePIN .save").addClass( "changes" );
			}
			else if( evt.keyCode == 40 ) {
				// The key pressed was arrow down (doesn't matter if numlock is off).
				// Decrement the number by one or if empty, start with nine.
				let newValue = parseInt( $ctx.val() );
				
				$ctx.val( isNaN( newValue ) ? 9 : --newValue <= 0 ? 9 : newValue );
				$("#SettingsMenuPrivateModePIN .save").addClass( "changes" );
			}
			else if( evt.keyCode == 37 && $prevField ) {
				// The key pressed was arrow left (doesn't matter if numlock is off).
				$prevField.focus();
			}
			else if( evt.keyCode == 39 ) {
				// The key pressed was arrow right (doesn't matter if numlock is off).
				
				if( $nextField )
					$nextField.focus();
			}
			else if( evt.keyCode == 8 ) {
				// The key pressed was backspace.
				if( $ctx.val().length == 0 && $prevField ) {
					$prevField.focus();
				}
				else {
					$ctx.val( "" );
					$("#SettingsMenuPrivateModePIN .save").addClass( "changes" );
				}
			}
			else if( evt.keyCode == 46 ) {
				// The key pressed was delete.
				$ctx.val( "" );
				$("#SettingsMenuPrivateModePIN .save").addClass( "changes" );
			}
			else if( evt.keyCode == 16 || evt.keyCode == 9 ) {
				// The key pressed was shift or tab. Exempt from override.
				return true;
			}
			else if( evt.keyCode == 13 ) {
				// The key pressed was enter. Save!
				$("#SettingsMenuPrivateModePIN .save").click();
			}
			
			return false;
		}
		
		$("#inputPIN1").on( "keydown", function( evt ) { return pinKeyEventHandler( evt, $(this), null, $("#inputPIN2") ); });
		$("#inputPIN2").on( "keydown", function( evt ) { return pinKeyEventHandler( evt, $(this), $("#inputPIN1"), $("#inputPIN3") ); });
		$("#inputPIN3").on( "keydown", function( evt ) { return pinKeyEventHandler( evt, $(this), $("#inputPIN2"), $("#inputPIN4") ); });
		$("#inputPIN4").on( "keydown", function( evt ) { return pinKeyEventHandler( evt, $(this), $("#inputPIN3"), null ); });
		
		$("#inputCustomBackground").on( "keyup", function() {
			$("#SettingsMenuCustomBackground .save").addClass( "changes" );
		});
		
		$("#inputHomepage").on( "keyup", function() {
			$("#SettingsMenuHomePage .save").addClass( "changes" );
		});
		
		$("section#SettingsMenu ul > li").on( "mouseenter", function() {
			const tooltip = $(this).attr( "tooltip" );
			
			if( tooltip ) {
				$("#SettingsMenuToolTip > p").html( tooltip );
				$("#SettingsMenuToolTip").stop().fadeTo( 150, 1.0 );
				$("#SettingsMenuToolTip > p").stop().fadeIn( 150 );
			}
		});
		
		$("section#SettingsMenu ul > li").on( "mouseleave", function() {
			$("#SettingsMenuToolTip").stop().fadeTo( 150, 0.0 );
			$("#SettingsMenuToolTip > p").stop().fadeOut( 150, function() {
				$("#SettingsMenuToolTip > p").html("");
			});
		});
	}
	
	function preload( data ) {
	}
	
	function load( data, reload ) {
		isLoaded = true;
		
		setBackground();
		disableBackButton();
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
	
	function enableBackButton() {
		$("section#MSLAppSettings > header > div.navBack").css( "opacity", 1 );
		$("section#MSLAppSettings > header > div.navBack").css( "cursor", "pointer" );
	}
	
	function disableBackButton() {
		$("section#MSLAppSettings > header > div.navBack").addClass( "disabled" );
		$("section#MSLAppSettings > header > div.navBack").css( "cursor", "auto" );
	}
	
	function enableScrollbar() {
		$doc = $("html, body");
		
		if( scrollbarOriginalHeight === null ) {
			scrollbarOriginalHeight = $doc.css( "height" );
			scrollbarMainHeight = $("section#MSLAppSettings > main").css( "height" );
		}
		
		$("html, body").css( "height", "100%" );
		$("section#MSLAppSettings > main").css( "height", "" );
		$("section#MSLAppSettings").css( "overflow-y", "auto" );
	}
	
	function disableScrollbar() {
		if( scrollbarOriginalHeight === null )
			return;
		
		$("html, body").css( "height", scrollbarOriginalHeight );
		$("section#MSLAppSettings").css( "overflow-y", "" );
		$("section#MSLAppSettings > main").css( "height", scrollbarMainHeight );
	}  
	
	function openChangelog() {
		enableBackButton();
		disableScrollbar();
		
		$("section#MSLAppSettings > main > section").css( "display", "none" );
		$("section#MSLAppSettings > main > section#SettingsChangelog").css( "display", "block" );
	}
	
	function openTroubleshooting() {
		enableBackButton();
		enableScrollbar();
		
		$("section#MSLAppSettings > main > section").css( "display", "none" );
		$("section#MSLAppSettings > main > section#SettingsTroubleshooting").css( "display", "block" );
	}
	
	function openContact() {
		enableBackButton();
		disableScrollbar();
		
		$("section#MSLAppSettings > main > section").css( "display", "none" );
		$("section#MSLAppSettings > main > section#SettingsContact").css( "display", "block" );
	}
	
	function openCopySettings() {
		enableBackButton();
		enableScrollbar();
		
		$("section#MSLAppSettings").css( "backgroundColor", "#000000" );
		$("section#MSLAppSettings > main > section").css( "display", "none" );
		
		var app = $("section#MSLAppSettings > main > section#SettingsCopySettings");
		
		app.css( "display", "block" );
		app.children( "section#input" ).css( "display", "block" );
		app.children( "section#result" ).css( "display", "none" );
	}
	
	function openDefault() {
		disableBackButton();
		disableScrollbar();
		
		$("section#MSLAppSettings").css( "backgroundColor", "transparent" );
		$("section#MSLAppSettings > main > section").css( "display", "none" );
		$("section#MSLAppSettings > main > section#SettingsMenu").css( "display", "block" );
	}
	
	function TroubleshootingOpenIssue( id ) {
		var $section = $("section#SettingsTroubleshooting");
		var $pointer = $section.find( "span#issue-" + id ).first();
		var $text = $section.find( "div#issue-" + id ).first();
		var state = $text.css( "display" ) == "block";
		
		$section.find( "span.pointer" ).html( "&#x25ba;" );
		$section.find( "div" ).css( "display", "none" );
		
		if( !state ) {
			$pointer.html( "&#x25bc;" );
			$text.css( "display", "block" );
		}
	}
	
	function SettingsSelectionGoToRel( $this, direction ) {
		var $parent = $this.parent();
		var $values = $parent.children( ".value" ).first();
		var selected = $values.children( ".selected" ).first().index();
		var optionCount = $values.children().length;
		
		if( selected == -1 || optionCount <= 1 )
			return;
		
		if( selected + direction >= optionCount )
			selected = 0;
		else if( selected + direction < 0 )
			selected = optionCount - 1;
		else
			selected += direction;
		
		var $new = $values.children().eq( selected );
		var callback = "undefined" != $parent.attr( "callback" ) ? $parent.attr( "callback" ) : null;
		
		if( callback ) {
			callback = callback.split( "." );
			
			if( callback.length == 2 ) {
				callback = window[callback[0]][callback[1]];
			}
			else {
				callback = window[callback[0]];
			}
		}
		
		$values.children().removeClass( "selected" );
		$new.addClass( "selected" );
		
		if( callback )
			callback( $new.attr( "value" ) );
	}
	
	function SettingsInputGoToRel( $this ) {
		var $root = $this.parent().parent();
		var callback = $root.attr( "callback" );
		
		if( typeof callback == "undefined" )
			return;
		
		callback = callback.split( "." );
		
		if( callback.length == 2 ) {
			callback = window[callback[0]][callback[1]];
		}
		else {
			callback = window[callback[0]];
		}
		
		callback( $this.val() );
	}
	
	function SettingsInputSave( $this ) {
		var $parent = $this.parent();
		var txtValue = $parent.children().first().children().first()[0].value;
		
		if( "undefined" == typeof txtValue || txtValue == null || txtValue.trim().length == 0 )
			txtValue = null;
		
		var callback = "undefined" != $parent.attr( "callback" ) ? $parent.attr( "callback" ) : null;
		
		if( callback ) {
			callback = callback.split( "." );
			
			if( callback.length == 2 ) {
				callback = window[callback[0]][callback[1]];
			}
			else {
				callback = window[callback[0]];
			}
			
			callback( txtValue );
		}
	}
	
	function SettingsMenuChange( setting, value, toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		switch( setting ) {
			case "BackgroundVideo": SettingsMenuBackgroundVideoChange( value, toSync ); break;
			case "BackgroundColour": SettingsMenuBackgroundColourChange( value, toSync ); break;
			case "BackgroundBlend": SettingsMenuBackgroundBlendChange( value, toSync ); break;
			case "CustomBackground": SettingsMenuCustomBackgroundChange( value, toSync ); break;
			case "PG13Filter": SettingsMenuPG13FilterChange( value, toSync ); break;
			case "Browser": SettingsMenuBrowserChange( value, toSync ); break;
		}
	}
	
	function SettingsMenuPrivateModeChange( p, toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		p = p != 0 ? true : false;
		
		if( toSync == true && !MSLGlobals.isOwner )
			return;
		
		if( p ) {
			$("#SettingsMenuPrivateModePIN").show();
		}
		else {
			$("#SettingsMenuPrivateModePIN").hide();
		}
		
		settingsMenuScroll.UpdateVisibility();
		
		// Save to database
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "PrivateMode",
			value: p ? 1 : 0,
			pin: -1
		});
	}
	
	function SettingsMenuPrivateModePINChange( p, toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( toSync == true && !MSLGlobals.isOwner )
			return;
		
		let pin1 = $("#inputPIN1").removeClass( "invalid" ).blur().val();
		let pin2 = $("#inputPIN2").removeClass( "invalid" ).blur().val();
		let pin3 = $("#inputPIN3").removeClass( "invalid" ).blur().val();
		let pin4 = $("#inputPIN4").removeClass( "invalid" ).blur().val();
		let pin = parseInt( [pin1, pin2, pin3, pin4].join( "" ) );
		
		if( pin1.length + pin2.length + pin3.length + pin4.length != 0 && (pin < 1111 || pin > 9999) ) {
			// Invalid PIN format
			if( pin1.length == 0 || isNaN( pin1 ) ) { $("#inputPIN1").addClass( "invalid" ); }
			if( pin2.length == 0 || isNaN( pin2 ) ) { $("#inputPIN2").addClass( "invalid" ); }
			if( pin3.length == 0 || isNaN( pin3 ) ) { $("#inputPIN3").addClass( "invalid" ); }
			if( pin4.length == 0 || isNaN( pin4 ) ) { $("#inputPIN4").addClass( "invalid" ); }
			return;
		}
		
		$("#SettingsMenuPrivateModePIN .save").removeClass( "changes" );
		
		// Save to database
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "PrivateModePIN",
			value: pin
		});
	}
	
	function SettingsMenuBackgroundVideoChange( p, toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( toSync == true && !MSLGlobals.isOwner )
			return;
		
		var $parent = $("#underlay");
		var $video = $parent.children( "video" ).first();
		var $newVideo = $(document.createElement( "video" ));
		
		if( p == "none" ) {
			$video.remove();
			$parent.append( $newVideo );
		}
		else {
			var $newSource = $(document.createElement( "source" ));
			
			$newSource.attr( "src", "videos/" + p + ".webm" );
			$newSource.attr( "type", "video/webm" );
			$newVideo.append( $newSource );
			
			$newVideo.attr( "poster", "videos/" + p + ".jpg" );
			$newVideo.prop( "autoplay", true );
			$newVideo.prop( "loop", true );
			
			$video.remove();
			$parent.append( $newVideo );
		}
		
		// Propagate to other clients
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_SETTINGS_CHANGE,
				setting: "BackgroundVideo",
				value: p
			});
		}
		
		// Save to database
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "BackgroundVideo",
			value: p
		});
	}
	
	function SettingsMenuBackgroundColourChange( p, toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( toSync == true && !MSLGlobals.isOwner )
			return;
		
		var $overlay = $("#videoBackground");
		var colour = "#00e4ff";
		
		if( "undefined" != typeof MSLGlobals.BackgroundColourList[p] )
			colour = MSLGlobals.BackgroundColourList[p].value;
		
		$overlay.css( "background-color", colour );
		
		// Propagate to classes that would override this value
		MSLAppHome.setBackgroundColour( colour );
		
		// Propagate to other clients
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_SETTINGS_CHANGE,
				setting: "BackgroundColour",
				value: p
			});
		}
		
		// Save to database
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "BackgroundColour",
			value: p
		});
	}
	
	function SettingsMenuBackgroundBlendChange( p, toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( toSync == true && !MSLGlobals.isOwner )
			return;
		
		var $overlay = $("#videoBackground");
		var mode = "overlay";
		
		switch( p ) {
			case "multiply": mode = "multiply"; break;
			case "darken": mode = "darken"; break;
			case "colorburn": mode = "color-burn"; break;
			case "softlight": mode = "soft-light"; break;
			case "difference": mode = "difference"; break;
			case "exclusion": mode = "exclusion"; break;
			case "color": mode = "color"; break;
			case "normal": mode = "normal"; break;
		}
		
		$overlay.css( "mix-blend-mode", mode );
		
		// Propagate to classes that would override this value
		MSLAppHome.setBackgroundBlend( mode );
		
		// Propagate to other clients
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_SETTINGS_CHANGE,
				setting: "BackgroundBlend",
				value: p
			});
		}
		
		// Save to database
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "BackgroundBlend",
			value: p
		});
	}
	
	function SettingsMenuCustomBackgroundChange( p, toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( "undefined" == typeof p || p == null || p.length < 16 )
			p = "";
		
		if( toSync == true && !MSLGlobals.isOwner )
			return;
		
		var $overlay = $("#videoBackground");
		
		if( p.length != 0 ) {
			$overlay.css( "background-image", "url('" + p + "')" );
			MSLAppHome.setCustomBackground( p );
		}
		else {
			$overlay.css( "background-image", "none" );
			MSLAppHome.setCustomBackground( null );
		}
		
		// Propagate to other clients
		if( toSync && MSLGlobals.sync ) {
			MSLGlobals.sync.send({
				c: OPCODE_SETTINGS_CHANGE,
				setting: "CustomBackground",
				value: p
			});
		}
		
		// Save to database
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "CustomBackground",
			value: p
		})
		.done( function( data ) {
				$("#SettingsMenuCustomBackground .save").removeClass( "changes" );
		});
	}
	
	function SettingsMenuPG13FilterChange( p, toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		p = p != 0 ? true : false;
		
		if( toSync == true && !MSLGlobals.isOwner )
			return;
		
		// Save to database
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "PG13",
			value: p ? 1 : 0
		});
	}
	
	function SettingsMenuBrowserChange( p, toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		p = p != 0 ? true : false;
		
		if( toSync == true && !MSLGlobals.isOwner )
			return;
		
		// Save to database
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "Browser",
			value: p ? 1 : 0
		});
	}
	
	function SettingsMenuHomepageSave( p, toSync ) {
		toSync = "undefined" != typeof toSync ? toSync : true;
		
		if( "undefined" == typeof p || p == null )
			p = "";
		
		if( toSync == true && !MSLGlobals.isOwner )
			return;
		
		// Save to database
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "Homepage",
			value: p
		})
		.done( function( data ) {
				var parts = JSON.parse( data );
				
				if( "undefined" != typeof parts.message && parts.message.length > 0 ) {
					MSLGlobals.Homepage = parts.message;
				}
				else {
					MSLGlobals.Homepage = MSLGlobals.DefaultHomepage;
				}
				
				$("#SettingsMenuHomePage .save").removeClass( "changes" );
		});
	}
	
	function SettingsMenuDefaultAppSave( p, toSync ) {
		// Save to database
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "DefaultApp",
			value: p
		});
	}
	
	function SettingsMenuTime( p, toSync ) {
		// Save to database
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "MenuTime",
			value: p
		});
		
		MSLGlobals.DisplayTimeFormat = parseInt( p );
	}
	
	/*
	Permanently dismisses the notification that appears when clicking the browser app.
	@return	void
	*/
	function SetBrowserAcknowledged( p = 1 ) {
		$.post( "json/ownerSet.php", {
			uuid: MSLGlobals.uuid,
			setting: "BrowserAck",
			value: 1
		});
	}
	
	return {
		init: init,
		preload: preload,
		load: load,
		open: open,
		close: close,
		
		TroubleshootingOpenIssue: TroubleshootingOpenIssue,
		SettingsMenuChange: SettingsMenuChange,
		SettingsMenuBackgroundVideoChange: SettingsMenuBackgroundVideoChange,
		SettingsMenuBackgroundColourChange: SettingsMenuBackgroundColourChange,
		SettingsMenuBackgroundBlendChange: SettingsMenuBackgroundBlendChange,
		SettingsMenuCustomBackgroundChange: SettingsMenuCustomBackgroundChange,
		SettingsMenuPrivateModeChange: SettingsMenuPrivateModeChange,
		SettingsMenuPrivateModePINChange: SettingsMenuPrivateModePINChange,
		SettingsMenuPG13FilterChange: SettingsMenuPG13FilterChange,
		SettingsMenuBrowserChange: SettingsMenuBrowserChange,
		SettingsMenuHomepageSave: SettingsMenuHomepageSave,
		SettingsMenuDefaultAppSave: SettingsMenuDefaultAppSave,
		SetBrowserAcknowledged: SetBrowserAcknowledged,
		SettingsMenuTime: SettingsMenuTime,
		
		showPage: function( page ) {
			switch( page.toLowerCase() ) {
				case "changelog": openChangelog(); break;
				case "troubleshooting": openTroubleshooting(); break;
				case "contact": openContact(); break;
				case "copysettings": openCopySettings(); break;
				default: openDefault(); break;
			}
		},
		
		powerOff: function() {
			window.location.hash = "PowerOff";
		},
		
		back: function() {
			openDefault();
		},
		
		sendContactForm: function() {
			var $status = $("#contact_status");
			var slname = $("#contact_slname").val();
			var reason = parseInt( $("#contact_reason").val() );
			var message = $("#contact_message").val();
			
			$status.text( "" );
			$status.removeClass();
			
			if( message.length < 10 ) {
				$status.addClass( "error" );
				$status.text( "Failed to send: message too short." );
				return;
			}
			
			$status.text( "Sending..." );
			
			$.post( "json/contactform.php",{
				slname: slname,
				reason: reason,
				message: message
			} )
			.done( function( data ) {
				try {
					data = JSON.parse( data );
				}
				catch( e ) {
					$status.addClass( "error" );
					$status.text( "Failed to send: server error." );
				}
				
				if( data && "undefined" != typeof data.status && "undefined" != typeof data.message ) {
					if( parseInt( data.status ) != 200 ) {
						$status.addClass( "error" );
						$status.text( "Failed to send: " + data.message );
					}
					else {
						$status.addClass( "success" );
						$status.text( "OK" );
					}
				}
				else {
					$status.addClass( "error" );
					$status.text( "Failed to send: server error." );
				}
			} )
			.fail( function() {
				$status.addClass( "error" );
				$status.text( "Failed to send: server unreachable. Try again later." );
			} );
		},
		
		copySettingsForm: function() {
			var app = $("section#MSLAppSettings > main > section#SettingsCopySettings");
			app.children( "section#input" ).css( "display", "none" );
			app.children( "section#result" ).css( "display", "block" );
			
			var $status = app.find( "#copySettingsStatus" );
			var key = $("#settingsCopySettingsUUID").val();
			
			$status.removeClass( "error" );
			$status.removeClass( "success" );
			$status.text( "Fetching data from TV..." );
			
			$.post( "json/copySettings.php", {
				key: key,
				uuid: MSLGlobals.uuid
			} )
			.done( function( data ) {
				try {
					data = JSON.parse( data );
				}
				catch( e ) {
					$status.addClass( "error" );
					$status.text( "Failed to copy data: server error." );
				}
				
				if( data && "undefined" != typeof data.status && "undefined" != typeof data.message ) {
					if( parseInt( data.status ) != 200 ) {
						$status.addClass( "error" );
						$status.text( "Failed to copy data: " + data.message );
					}
					else {
						$status.addClass( "success" );
						$status.text( "Successfully copied data to this TV. Please reboot your device for all changes to take effect." );
					}
				}
				else {
					$status.addClass( "error" );
					$status.text( "Failed to copy data: server error." );
				}
			} )
			.fail( function() {
				$status.addClass( "error" );
				$status.text( "Failed to copy data: server unreachable. Try again later." );
			} );
		},
		
		copyUUIDToClipboard: function() {
			const target = $("#currentuuid");
			
			target.select();
			document.execCommand( "copy" );
		}
	};
})();

MSLAppManager.register( "settings", MSLAppSettings, true );