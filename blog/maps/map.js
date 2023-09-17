var Colors = require('./colors');

function DmgMap(map, maps) {
    var markers = {};

	this.zoomToBounds = function(b) {
		var ne = new maps.LatLng(b.n, b.e);
	    var sw = new maps.LatLng(b.s, b.w);
	    map.fitBounds(new maps.LatLngBounds(sw, ne));
	};

	this.markLocation = function(l, onClick) {
		let p = l.location;
		var loc = new maps.LatLng(p.lat, p.lon);
		var mark = new maps.Marker({
			position: loc,
			clickable: true,
			dragable: false
		});
		mark.setMap(map);
		mark.addListener('click', onClick);
		return mark;
	};
}

module.exports = DmgMap;



