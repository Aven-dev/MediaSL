var ActionLimiter = function( actionsperPeriod, periodLength ) {
	var actionsPerPeriod = "undefined" == typeof actionsPerPeriod ? 3 : actionsPerPeriod;
	var periodLength = "undefined" == typeof periodLength ? 30 : periodLength;
	var actions = new Array;
	
	function add() {
		const currentTime = update();
		
		if( actions.length >= actionsPerPeriod )
			return false;
		
		actions.push( currentTime );
		
		return true;
	}
	
	function update() {
		const currentTime = getCurrentTimestamp();
		
		actions = actions.filter( time => currentTime - time <= periodLength );
		
		return currentTime;
	}
	
	function getCurrentTimestamp() {
		return Math.round( (new Date()).getTime() / 1000 );
	}
	
	function getTimeEarliestExpire() {
		let earliest = 0;
		
		for( let i = 0; i < actions.length; ++i ) {
			if( earliest == 0 || actions[i] < earliest )
				earliest = actions[i];
		}
		
		return earliest + periodLength;
	}
	
	return {
		add: add,
		getCurrentTimestamp: getCurrentTimestamp,
		getTimeEarliestExpire: getTimeEarliestExpire
	};
};