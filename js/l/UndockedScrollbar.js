class UndockedScrollbar
{
    constructor( domContent, domScroll ) {
		this.dContent = window.jQuery && domContent instanceof jQuery ? domContent[0] : domContent;
		this.dScroll = window.jQuery && domScroll instanceof jQuery ? domScroll[0] : domScroll;
		
		if( !this.dContent ) {
			throw new Error( "Specified content element is undefined." );
		}
		
		if( !this.dScroll ) {
			throw new Error( "Specified scroll element is undefined." );
		}
		
		this.dTrack = this.dScroll.getElementsByClassName( "track" )[0];
		this.dThumb = this.dScroll.getElementsByClassName( "thumb" )[0];
		
        this.dragInfo = null;
		
		this.dContent.addEventListener( "scroll", () => {
            if( this.dragInfo )
                return;
            
            this.MoveByContent();
		});

		window.addEventListener( "resize", () => {
			this.MoveByContent();
		});

		
		this.dScroll.addEventListener( "mousedown", ( e ) => {
            this.dragInfo = {lastMouseY: e.clientY, hasMoved: false};
		});

		window.addEventListener( "mouseup", ( e ) => {
			if( this.dragInfo != null && !this.dragInfo.hasMoved ) {
				const thumbTop = parseFloat( this.dThumb.style.top );
				const delta = thumbTop - (e.clientY - (this.dTrack.getBoundingClientRect().top + this.dTrack.ownerDocument.defaultView.pageYOffset));
				const trackHeight = parseFloat( getComputedStyle( this.dTrack ).height );
				const thumbHeight = parseFloat( getComputedStyle( this.dThumb ).height );
				const distance = trackHeight * (parseFloat( getComputedStyle( this.dContent ).height ) / this.dContent.scrollHeight);

				if( delta + thumbHeight < 0 ) {
					this.MoveByScroll( this.Clamp( thumbTop + distance, 0, trackHeight - thumbHeight ) );
				}
				else if( delta > 0 ) {
					this.MoveByScroll( this.Clamp( thumbTop - distance, 0, trackHeight - thumbHeight ) );
				}
			}
			
            this.dragInfo = null;
		});
		
		window.addEventListener( "mousemove", ( e ) => {
            if( this.dragInfo == null )
                return;
			
            const delta = e.clientY - this.dragInfo.lastMouseY;
			
			if( this.dragInfo.lastMouseY != e.clientY ) {
				this.dragInfo.lastMouseY = e.clientY;
				this.dragInfo.hasMoved = true;
			}
			
			const thumbTop = parseFloat( this.dThumb.style.top );
			const trackHeight = parseFloat( getComputedStyle( this.dTrack ).height );
			const thumbHeight = parseFloat( getComputedStyle( this.dThumb ).height );
			
            this.MoveByScroll( this.Clamp( thumbTop + delta, 0, trackHeight - thumbHeight ) );
		});
    }
	
	UpdateVisibility() {
		this.MoveByContent();
	}

    MoveByContent() {
		if( !(this.dContent?.childElementCount > 0) ) {
			return;
		}
		
		const sContent = getComputedStyle( this.dContent );
		const sContentHeight = parseFloat( sContent.height );
		const scrollRatio = sContentHeight / (this.dContent.scrollHeight - parseInt( sContent.paddingTop ) - parseInt( sContent.paddingBottom ));
	
        if( isNaN( scrollRatio ) || scrollRatio >= 1 ) {
			this.dScroll.classList.add( "inactive" );
			this.dContent.classList.add( "contentFits" );
			
            return;
        }
		
		this.dScroll.classList.remove( "inactive" );
		this.dContent.classList.remove( "contentFits" );
		
		this.dThumb.style.height = (sContentHeight * scrollRatio) +"px";
		this.dThumb.style.top = ((this.dContent.scrollTop / (this.dContent.scrollHeight - sContentHeight )) * (parseFloat( getComputedStyle( this.dTrack ).height ) - parseFloat( getComputedStyle( this.dThumb ).height ))) +"px";
		this.AfterScroll();
		
		return;
    }

    MoveByScroll( amount ) {
        this.dThumb.style.top = amount +"px";
        this.dContent.scrollTo( 0, parseFloat( this.dThumb.style.top ) * (this.dContent.scrollHeight - parseFloat( getComputedStyle( this.dContent ).height )) / (parseFloat( getComputedStyle( this.dTrack ).height ) - parseFloat( getComputedStyle( this.dThumb ).height )) );
		this.AfterScroll();
    }
	
	AfterScroll() {
		if( this.dThumb.offsetTop == 0 ) { this.dThumb.classList.add( "top" ); } else { this.dThumb.classList.remove( "top" ); }
		if( this.dThumb.offsetTop + this.dThumb.offsetHeight >= this.dTrack.offsetHeight ) { this.dThumb.classList.add( "bot" ); } else { this.dThumb.classList.remove( "bot" ); }
	}
	
	Reset() {
		this.dContent.scrollTo( 0, 0 );
	}

    Clamp( val, min, max ) {
        return Math.min( Math.max( val, min ), max );
    }
}