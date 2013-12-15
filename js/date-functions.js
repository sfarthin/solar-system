define(function() {
	

	var Date2Julian = function(date) {
		return Math.floor((date / 86400000) - (date.getTimezoneOffset()/1440) + 2440587.5);
	};
	
	var Julian2Date = function(julianDate) {
		var X = parseFloat(julianDate)+0.5;
		var Z = Math.floor(X); //Get day without time
		var F = X - Z; //Get time
		var Y = Math.floor((Z-1867216.25)/36524.25);
		var A = Z+1+Y-Math.floor(Y/4);
		var B = A+1524;
		var C = Math.floor((B-122.1)/365.25);
		var D = Math.floor(365.25*C);
		var G = Math.floor((B-D)/30.6001);
		//must get number less than or equal to 12)
		var month = (G<13.5) ? (G-1) : (G-13);
		//if Month is January or February, or the rest of year
		var year = (month<2.5) ? (C-4715) : (C-4716);
		month -= 1; //Handle JavaScript month format
		var UT = B-D-Math.floor(30.6001*G)+F;
		var day = Math.floor(UT);
		//Determine time
		UT -= Math.floor(UT);
		UT *= 24;
		var hour = Math.floor(UT);
		UT -= Math.floor(UT);
		UT *= 60;
		var minute = Math.floor(UT);
		UT -= Math.floor(UT);
		UT *= 60;
		var second = Math.round(UT);

		return new Date(Date.UTC(year, month, day, hour, minute, second));
	};
	
	return {Date2Julian: Date2Julian, Julian2Date: Julian2Date};

});