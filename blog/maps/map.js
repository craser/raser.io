var Colors = require('./colors');

function DmgMap(div) {
    var descriptions = {};
    var markers = {};
    var map = null;
    var tracks = {}; // filename --> Polyline[]
	
	this.renderTrack = function(gpxTrack, color) {
		color = color || Colors.getDefaultColor();
	    var lines = [];
	    var points = [];
	    for (var i = 0; i < gpxTrack.points.length; i++) {
	        var p = gpxTrack.points[i]; // GPS point
	        var g = new google.maps.LatLng(p.lat, p.lon);
	        points.push(g);
	        if ((i > 0) && ((i % 100) == 0)) {
	        	var line = new google.maps.Polyline({path: points, strokeColor: color, map: map});
	        	lines.push(line);
	            points = [];
	            points.push(g);
	        }
	    }
	    if (points.length > 0) {
	    	lines.push(new google.maps.Polyline({path: points, strokeColor: color, map: map}));
	    }
	    tracks[gpxTrack.fileName] = lines;
	};
	
	this.removeTrack = function(gpxTrack) {
		var lines = tracks[gpxTrack.fileName];
		tracks[gpxTrack.fileName] = null;
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			line.setMap(null);
		}
	};
	
	this.zoomToBounds = function(b) {
		var ne = new google.maps.LatLng(b.n, b.e);
	    var sw = new google.maps.LatLng(b.s, b.w);
	    map.fitBounds(new google.maps.LatLngBounds(sw, ne));
	};

	this.showImageOnMap = function(fileName)
	{
	    var marker = markers[fileName];
	    var desc = descriptions[fileName];
	    marker.openInfoWindowHtml(desc);
	};
	
	this.markLocation = function(p) {
		var loc = new google.maps.LatLng(p.lat, p.lon);
		var mark = new google.maps.Marker({
			position: loc,
			clickable: false,
			dragable: false
		});
		mark.setMap(map);
		return mark;
	};
	
	this.removeMark = function(mark) {
		mark.setMap(null);
	};
	
	this.getHeight = function() {
		return $(div).height();
	};
	
	this.getWidth = function() {
		return $(div).width();
	};
	
	this.getTop = function() {
		return $(div).offset().top;
	};
	
	function bind(div) {
	    var options = {
	    	zoom: 4, // FIXME: Cargo cult from Google HOWTO
//	    	mapTypeId: google.maps.MapTypeId.TERRAIN,
//	    	mapTypeControlOptions: {
//	    		mapTypeIds: [google.maps.MapTypeId.TERRAIN, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE],
//	    		position: google.maps.ControlPosition.TOP_LEFT,
//	    		style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
//	    	},
//	    	scroll: true,
//	    	panControl: false,
//	    	scaleControl: true,
//	    	streetViewControl: false, // FIXME: Configure this.
	    	center: { lat: 0, lng: 0 } // FIXME: Pass in the actual center of the route.
	    };
	    var gmap = new google.maps.Map($(div)[0], options);

	    return gmap;
	}

	//this.resizeBy(0, 0); // This sets up style properties needed by Google Maps API.
	map = bind(div);
}

module.exports = DmgMap;



