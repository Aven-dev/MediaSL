class MSLKeypad
{
	static SCREEN_TYPE_OTHER = 0;
	static SCREEN_TYPE_INPUT = 1;
	static PAD_TYPE_OTHER = 0;
	static PAD_TYPE_BUTTON = 1;
	static InputValidator = new RegExp( /^\d+$/ );

	config = {};
	#events = {};
	caret = 0;

	constructor( refContainer, config = {} ) {
		this.domContainer = MSLKeypad.#InterpretDOMReference( refContainer );

		// Find pre-defined controls.
		this.domScreen = MSLKeypad.#InterpretDOMReference( ".inputcodeScreen", this.domContainer );
		this.domPad = MSLKeypad.#InterpretDOMReference( ".inputcodePad", this.domContainer );
		this.domSubmit = MSLKeypad.#InterpretDOMReference( ".inputcodeSubmit", this.domContainer );
		this.domCancel = MSLKeypad.#InterpretDOMReference( ".inputcodeCancel", this.domContainer );

		// Read pre-defined control elements.
		this.listScreenElements = MSLKeypad.#DiscoverScreenElements( this.domScreen );
		this.listPadElements = MSLKeypad.#DiscoverPadElements( this.domPad );

		// Determine pad type based on the pre-defined elements.
		this.screenType = this.listScreenElements.length && this.listScreenElements[0].tagName == "INPUT" ? MSLKeypad.SCREEN_TYPE_INPUT : MSLKeypad.SCREEN_TYPE_OTHER;
		this.padType = this.listPadElements.length && this.listPadElements[0].tagName == "BUTTON" ? MSLKeypad.PAD_TYPE_BUTTON : MSLKeypad.SCREEN_TYPE_OTHER;
		this.screenValueField = this.screenType == MSLKeypad.SCREEN_TYPE_INPUT ? "value" : "innerText";

		// Set default config.
		this.config.allowDirectInput = this.screenType == MSLKeypad.SCREEN_TYPE_INPUT;
		this.config.listenForKeyboardInput = true;
		this.config.onInit = () => {};
		this.config.onOpen = () => {};
		this.config.onClose = () => {};
		this.config.onSubmit = () => {};
		this.config.onCancel = () => {};
		this.config.onCodeUpdate = ( valid ) => {
			if( this.domSubmit ) {
				this.domSubmit.disabled = !valid;
			}
		};

		// Merge provided config with default config (provided config overrides default).
		this.config = {...this.config, ...config};

		//TODO: Create default elements if none exist.

		// Only at this point the maximum number of digits desired for this keypad can be determined.
		this.codeLength = this.listScreenElements.length > 0 ? this.listScreenElements.length : 4;

		/**
		 * Event 'keydown' on Screen elements.
		 */
		this.#events.onScreenKeyDown = ( evt ) => {
			const insertedSomething = this.InsertCode( evt.key );
	
			if( insertedSomething ) {
				if( evt.target.nextElementSibling ) {
					evt.target.nextElementSibling.focus();
				}

				evt.stopPropagation();
			}

			// Pasting...
			if( evt.ctrlKey && evt.which == 86 ) {
				return true;
			}

			evt.preventDefault();
			return false;
		}
	
		/**
		 * Event 'keydown' globally.
		 */
		this.#events.onKeyDown = ( evt ) => {
			switch( evt.keyCode ) {
				case 8: // Backspace
					this.caret = Math.min( Math.max( this.caret, 0 ), this.listScreenElements.length - 1 );

					if( this.caret < this.listScreenElements.length ) {
						this.listScreenElements[this.caret][this.screenValueField] = "";
						this.config.onCodeUpdate( false, null );
						evt.preventDefault();

						if( this.caret > 0 ) {
							this.listScreenElements[--this.caret].focus();
						}
					};
					break;
				
				case 13: // Enter
					let value = this.GetValue();
					this.config.onSubmit( value.length == this.codeLength && MSLKeypad.InputValidator.test( value ), value );
					break;

				case 37: // Left arrow
					this.caret = Math.min( Math.max( this.caret - 1, 0 ), this.listScreenElements.length - 1 );
					if( this.caret < this.listScreenElements.length ) { this.listScreenElements[this.caret].focus() };
					break;
					
				case 39: // Right arrow
					this.caret = Math.min( Math.max( this.caret + 1, 0 ), this.listScreenElements.length - 1 );
					if( this.caret < this.listScreenElements.length ) { this.listScreenElements[this.caret].focus() };
					break;
				
				default:
					this.InsertCode( evt.key );
			}
		};
		
		/**
		 * Event 'focus' on Screen elements.
		 */
		this.#events.onScreenFocus = ( evt ) => {
			for( let i = this.listScreenElements.length - 1; i >= 0; --i ) {
				if( evt.target == this.listScreenElements[i] ) {
					this.caret = i;
					return;
				}
			}
		};
	
		/**
		 * Event 'paste' globally.
		 */
		this.#events.onPaste = ( evt ) => {
			this.InsertCode( (evt.clipboardData || window.clipboardData).getData( "text" ) );
			evt.stopPropagation();
			evt.preventDefault();
			return false;
		};
	
		/**
		 * Event 'mouseup' on Key Pad elements.
		 */
		this.#events.onPadClick = ( evt ) => {
			this.InsertCode( evt.target.value ?? evt.target.innerText );
		};
	
		/**
		 * Event 'mouseup' on Submit element.
		 */
		this.#events.onSubmit = ( evt ) => {
			if( evt.type == "keydown" && evt.keyCode != 13 ) {
				evt.stopPropagation();
				return;
			}
	
			let value = this.GetValue();
			this.config.onSubmit( value.length == this.codeLength && MSLKeypad.InputValidator.test( value ), value );
		};
	
		/**
		 * Event 'mouseup' on Cancel element.
		 */
		this.#events.onCancel = ( evt ) => {
			if( evt.type == "keydown" && evt.keyCode != 13 ) {
				evt.stopPropagation();
				return;
			}
	
			this.config.onCancel();
		};

		this.config.onInit( this );
	}

	/**
	 * Open and initialize the Keypad popup.
	 */
	Open() {
		// Attach listeners
		for( let i = this.listScreenElements.length - 1; i >= 0; --i ) {
			this.listScreenElements[i].addEventListener( "keydown", this.#events.onScreenKeyDown );
			this.listScreenElements[i].addEventListener( "focus", this.#events.onScreenFocus );
			this.listScreenElements[i].disabled = false;
		}

		for( let i = this.listPadElements.length - 1; i >= 0; --i ) {
			this.listPadElements[i].addEventListener( "mouseup", this.#events.onPadClick );
			this.listPadElements[i].disabled = false;
		}
		
		if( this.domSubmit ) {
			this.domSubmit.addEventListener( "mouseup", this.#events.onSubmit );
			this.domSubmit.addEventListener( "keydown", this.#events.onSubmit );
		}

		if( this.domCancel ) {
			this.domCancel.addEventListener( "mouseup", this.#events.onCancel );
			this.domCancel.addEventListener( "keydown", this.#events.onCancel );
		}
		
		document.addEventListener( "keydown", this.#events.onKeyDown );
		document.addEventListener( "paste", this.#events.onPaste );

		// Show the popup
		this.domContainer.classList.remove( "inactive" );

		this.config.onOpen();
	}

	/**
	 * Close the Keypad popup.
	 */
	Close() {
		this.Reset();

		// Detach listeners
		for( let i = this.listScreenElements.length - 1; i >= 0; --i ) {
			this.listScreenElements[i].removeEventListener( "keydown", this.#events.onScreenKeyDown );
			this.listScreenElements[i].removeEventListener( "focus", this.#events.onScreenFocus );
		}

		for( let i = this.listPadElements.length - 1; i >= 0; --i ) {
			this.listPadElements[i].removeEventListener( "mouseup", this.#events.onPadClick );
		}

		if( this.domSubmit ) {
			this.domSubmit.removeEventListener( "mouseup", this.#events.onSubmit );
			this.domSubmit.removeEventListener( "keydown", this.#events.onSubmit );
		}

		if( this.domCancel ) {
			this.domCancel.removeEventListener( "mouseup", this.#events.onCancel );
			this.domCancel.removeEventListener( "keydown", this.#events.onCancel );
		}

		document.removeEventListener( "keydown", this.#events.onKeyDown );
		document.removeEventListener( "paste", this.#events.onPaste );

		// Hide the popup
		this.domContainer.classList.add( "inactive" );

		this.config.onClose();
	}

	Reset() {
		this.caret = 0;

		if( this.domSubmit ) {
			this.domSubmit.disabled = true;
		}

		for( let i = this.listScreenElements.length - 1; i >= 0; --i ) {
			this.listScreenElements[i][this.screenValueField] = "";
		}
	}

	EnableEverything() {
		if( this.domSubmit ) {
			this.domSubmit.addEventListener( "mouseup", this.#events.onSubmit );
			this.domSubmit.addEventListener( "keydown", this.#events.onSubmit );
			this.domSubmit.disabled = true;
		}

		for( let i = this.listScreenElements.length - 1; i >= 0; --i ) {
			this.listScreenElements[i].addEventListener( "keydown", this.#events.onScreenKeyDown );
			this.listScreenElements[i].addEventListener( "focus", this.#events.onScreenFocus );
			this.listScreenElements[i].disabled = false;
		}

		for( let i = this.listPadElements.length - 1; i >= 0; --i ) {
			this.listPadElements[i].addEventListener( "mouseup", this.#events.onPadClick );
			this.listPadElements[i].disabled = false;
		}

		document.addEventListener( "keydown", this.#events.onKeyDown );
		document.addEventListener( "paste", this.#events.onPaste );
	}

	DisableEverything() {
		if( this.domSubmit ) {
			this.domSubmit.removeEventListener( "mouseup", this.#events.onSubmit );
			this.domSubmit.removeEventListener( "keydown", this.#events.onSubmit );
			this.domSubmit.disabled = true;
		}

		for( let i = this.listScreenElements.length - 1; i >= 0; --i ) {
			this.listScreenElements[i].removeEventListener( "keydown", this.#events.onScreenKeyDown );
			this.listScreenElements[i].removeEventListener( "focus", this.#events.onScreenFocus );
			this.listScreenElements[i].disabled = true;
		}

		for( let i = this.listPadElements.length - 1; i >= 0; --i ) {
			this.listPadElements[i].removeEventListener( "mouseup", this.#events.onPadClick );
			this.listPadElements[i].disabled = true;
		}

		document.removeEventListener( "keydown", this.#events.onKeyDown );
		document.removeEventListener( "paste", this.#events.onPaste );
	}

	/**
	 * Appends data in the screen element. If the data's length equals the max length, the existing data is replaced instead.
	 * @param {string} data Data to append or replace.
	 * @returns 
	 */
	InsertCode( data ) {
		data = data.trim();

		if( data.length == 0 || !MSLKeypad.InputValidator.test( data ) ) {
			return false;
		}

		// If data length matches max length, we want to override the value rather than appending.
		if( this.codeLength == data.length ) {
			this.caret = 0;
		}
		
		for( let i = 0; i < data.length; ++i ) {
			if( this.caret >= this.listScreenElements.length ) {
				break;
			}
			
			this.listScreenElements[this.caret].blur();
			this.listScreenElements[this.caret++][this.screenValueField] = data[i];
		}

		// Gather the complete code, filter again, and fire the callbacks.
		let value = this.GetValue();
		this.config.onCodeUpdate( value.length == this.codeLength && MSLKeypad.InputValidator.test( value ), value );

		return true;
	}

	/**
	 * Get the current value.
	 * @returns The current value inside of the keypad screen.
	 */
	GetValue() {
		let value = "";

		for( let i = 0; i < this.listScreenElements.length; ++i ) {
			if( this.listScreenElements[i][this.screenValueField].length ) {
				value += this.listScreenElements[i][this.screenValueField];
			}
		}

		return value.trim();
	}

	/**
	 * Converts a multitude of ways to reference DOM elements into one standard, expected method.
	 * @param {Element|string|jQuery} ref A standard or jQuery element, or ID. Also accepts css-style ID and class format, or query selector formats.
	 * @param {HTMLElement|Element|null} context HTML element to search inside of. No search will be done if context is null.
	 * @returns {Element|null} A standard HTML DOM Element if it could be found.
	 */
	static #InterpretDOMReference( ref, context = document ) {
		if( ref instanceof Element ) {
			return ref;
		}
		else if( typeof( ref ) == "string" ) {
			return document.getElementById( ref ) ?? (context != null ? context.querySelector( ref ) : null);
		}
		else if( window.jQuery && ref instanceof jQuery ) {
			return ref[0];
		}

		return null;
	}

	/**
	 * Discover the screen output element(s). It will search for "input" html elements, or elements with the class ".control".
	 * @param {Element|null} ref Element to search in.
	 * @returns {Array} Array with elements, or empty array if nothing was found.
	 */
	static #DiscoverScreenElements( ref ) {
		if( ref && ref.children.length ) {
			let found = ref.querySelectorAll( "input" );

			if( found.length ) {
				return Array.from( found );
			}
			
			found = ref.querySelectorAll( ".control" );

			if( found.length ) {
				return Array.from( found );
			}
		}

		return new Array;
	}

	/**
	 * Discover the screen output element(s). It will search for "button" html elements, or elements with the class ".control".
	 * @param {Element|null} ref Element to search in.
	 * @returns {Array} Array with elements, or empty array if nothing was found.
	 */
	static #DiscoverPadElements( ref ) {
		if( ref && ref.children.length ) {
			let found = ref.querySelectorAll( "button" );

			if( found.length ) {
				return Array.from( found );
			}
			
			found = ref.querySelectorAll( ".control" );

			if( found.length ) {
				return Array.from( found );
			}
		}

		return new Array;
	}
}