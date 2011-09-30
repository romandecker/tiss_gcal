// Google Calendar-Enhancement for TISS
// version 0.1 BETA!
// 2011−09−30
// Copyright (c) 2011, Roman Decker
// Released under the GPL license
// http://www.gnu.org/copyleft/gpl.html
//
// −−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−
//
// This is a Greasemonkey user script.
//
// To install, you need Greasemonkey: http://greasemonkey.mozdev.org/
// Then restart Firefox and revisit this script.
// Under Tools, there will be a new menu item to "Install User Script".
// Accept the default configuration and install.
//
// To uninstall, go to Tools/Manage User Scripts,
// select "Hello World", and click Uninstall.
//
// −−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−
//
// ==UserScript==
// @name Google Calendar-Enhancement for TISS
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// @namespace http://use.github.page.here
// @description Adds links to classes to easily set them up as google calendar events
// @include https://tiss.tuwien.ac.at/course/*
// ==/UserScript==

// Add a leading '0' if string is only 1 char
function stringPad(str) {
	var newStr = "" + str;
	if (newStr.length == 1) {
		newStr = "0" + newStr;
	}
	return newStr;
}

//Used to create a UTC date string
function getUTCDateString(y,m,d,h,min) {
	var timeObj = new Date(y,m-1,d,h,min);
	var dateStr = "" + timeObj.getUTCFullYear();
	
	dateStr += stringPad(timeObj.getUTCMonth()+1);
	dateStr += stringPad(timeObj.getUTCDate());
	dateStr += "T" + stringPad(timeObj.getUTCHours());
	dateStr += stringPad(timeObj.getUTCMinutes()) + "00Z";

	return dateStr;
}

//returns an array containing [day, month, year] (as strings) from a string like "24.12.2011"
function parseDMY( str ) {
	return str.split( '.' );
}

//returns an array containing [hour, minute] (as strings) from a string like "13:37"
function parseHM( str ) {
	return str.split( ':' );
}

//gets the language, TISS is displayed in
function getLang() {
	if( $( 'body' ).hasClass( 'de' ) ) {
		return 'de';
	}else {
		return 'en';
	}
}

//gets the number of the weekday by its TISS-locale-specific-shortcut (Sunday = 0)
function getWeekdayNum( str ) {
	switch( str ) {
		case 'Sun':
		case 'So':
			return 0;
	
		case 'Mon':
		case 'Mo':
			return 1;
			
		case 'Tue':
		case 'Tu':
			return 2;
	
		case 'Wed':
		case 'Mi':
			return 3;
			
		case 'Thu':
		case 'Do':
			return 4;
			
		case 'Fri':
		case 'Fr':
			return 5;
		
		case 'Sat':
		case 'Sa':
			return 6;
	}
}

//gets the right weekday string for google calendar from the weekday's number (Sunday = 0)
function getWeekdayStr( num ) {
	return ["SU","MO","TU","WE","TH","FR","SA"][num]
}

//turns the TISS-specific weekday into a form that's accepted by google calendar
function unifyWeekday( str ) {
	return getWeekdayStr( getWeekdayNum( str ) );
}

//Process a table of class dates ("LVA-Termine")
function processClassesTable( rows, title ) {

	var success = false;

	$( rows ).each( function( i, row ) {
	
		var children = $( row ).children( 'td' );
		try { 
		
			//Parse some event information
			var weekday = unifyWeekday( $( children[0] ).text().trim() );
			var time = $( children[1] ).text().trim().split( ' - ' );
			var dates = $( children[2] ).text().trim().split( ' - ' );
			var location = $( children[3] ).text().trim();
			var description = $( children[4] ).text().trim();
			
			//Check if this is a recurring event
			var recurrence = (dates.length > 1);
			
			var fromDate = parseDMY( dates[0] );
			var fromTime = parseHM( time[0] );
			var toTime = parseHM( time[1] );
			
			var from = getUTCDateString( fromDate[2], fromDate[1], fromDate[0], fromTime[0], fromTime[1] );
			var to = getUTCDateString( fromDate[2], fromDate[1], fromDate[0], toTime[0], toTime[1] );
			
			//Construct the URL for google calendar
			var gcal_url = "http://www.google.com/calendar/event?action=TEMPLATE"
			gcal_url += "&text=" + encodeURIComponent( title );
			gcal_url += "&dates=" + encodeURIComponent( from + "/" + to );
			gcal_url += "&details=" + encodeURIComponent( description );
			gcal_url += "&location=" + encodeURIComponent( location );
			gcal_url += "&trp=false&sprop=&sprop=name:"
			
			if( recurrence ) {
				var toDate = parseDMY( dates[1] );
				var recur = "RRULE:FREQ=WEEKLY;UNTIL=" + toDate[2] + toDate[1] + toDate[0] + ";BYDAY=" + weekday
				gcal_url += "&recur=" + encodeURIComponent( recur );
			}
			
			//Append link column
			$( row ).append( '<td><a href="' + gcal_url + '" target="_blank">+ Add</a></td>' );
			success |= true;
		}catch( err ) { }
		
	} );
	
	return success;
}

//process a table of signup dates ("LVA-Anmeldung")
function processSignupTable( rows, title ) {
	var success = false;

	$( rows ).each( function( i, row ) {
	
		var children = $( row ).children( 'td' );
		try { 
			var fromArr = $( children[0] ).text().trim().split( ' ' );
			var toArr = $( children[1] ).text().trim().split( ' ' );
			
			var fromDate = parseDMY( fromArr[0] );
			var fromTime = parseHM( fromArr[1] );
			
			var from = getUTCDateString( fromDate[2], fromDate[1], fromDate[0], fromTime[0], fromTime[1] );
			
			
			var gcal_url = "http://www.google.com/calendar/event?action=TEMPLATE"
			gcal_url += "&text=" + encodeURIComponent( title + " Anmeldung" );
			gcal_url += "&dates=" + encodeURIComponent( from + "/" + from );
			gcal_url += "&details=" + encodeURIComponent( "Anmeldungsbeginn" );
			gcal_url += "&location=" + encodeURIComponent( "TISS (online)" );
			gcal_url += "&trp=false&sprop=&sprop=name:"
			
			$( row ).append( '<td><a href="' + gcal_url + '" target="_blank">+ Add</a></td>' );
			success |= true;
		}catch( err ) { }
		
	} );
	
	return success;
}

//process a table of exam dates ("Prüfungen")
function processExamTable( rows, title ) {
	var success = false;

	$( rows ).each( function( i, row ) {
	
		var children = $( row ).children( 'td' );
		try { 
			var weekday = unifyWeekday( $( children[0] ).text().trim() );
			var time = $( children[1] ).text().trim().split( ' - ' );
			var dates = $( children[2] ).text().trim();
			var location = $( children[3] ).text().trim();
			var mode = $( children[4] ).text().trim();
			
			var date = parseDMY( dates );
			
			var fromTime = parseHM( time[0] );
			var toTime = parseHM( time[1] );
			
			var from = getUTCDateString( date[2], date[1], date[0], fromTime[0], fromTime[1] );
			var to = getUTCDateString( date[2], date[1], date[0], toTime[0], toTime[1] );
			
			var gcal_url = "http://www.google.com/calendar/event?action=TEMPLATE"
			gcal_url += "&text=" + encodeURIComponent( title + " Prüfung" );
			gcal_url += "&dates=" + encodeURIComponent( from + "/" + to );
			gcal_url += "&details=" + encodeURIComponent( "Modus: " + mode );
			gcal_url += "&location=" + encodeURIComponent( location );
			gcal_url += "&trp=false&sprop=&sprop=name:"
			
			$( row ).append( '<td><a href="' + gcal_url + '" target="_blank">+ Add</a></td>' );
			success |= true;
		}catch( err ) { }
		
	} );
	
	return success;
}

function processTable( table, title ) {

	var head = $( table ).find( 'thead tr' );
	var rows = $( table ).find( 'tbody tr' );
	var columns = $( head ).children().length;
	var success = false;

	//Identify table by column count
	if( columns == 3 ) {
		success = processSignupTable( rows, title );
	}else if( columns == 5 ) {
		success = processClassesTable( rows, title );
	}else if( columns == 8 ) {
		success = processExamTable( rows, title );
	}
	
	//If there was at least one link added to the table, add a column header
	if( success ) {
		$( head ).append( '<th>Google Calendar</th>' );
	}
	
	return success;
}

$( 
	function() {
		//Parse class name
		var title = $( 'head title' ).text().trim().match( /^([\dA-Z]+.[\dA-Z]+) (.*)/ )[2];
		
		//Parse all tables
		$( 'table.standard.big' ).each(
			function( i, table ) {
				processTable( table, title );
			}
		);
	}
);