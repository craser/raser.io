function Elevation(mapUi, div, gpxTrack) {
	var self = this;
	var mark = null;  // Holds currently-marked location on Map.

	this.setUnits = function(units) {
		renderGraph(div, units);
	};

	function renderGraph(div, units) {
		$(div).CanvasJSChart({
			toolTip: {
				borderColor: "#000",
				borderThickness: 1,
				fontFamily: "HelveticaNeue-condensed,sans-serif",
				fontStyle: "normal",
				cornerRadius: 0,
				animationEnabled: false,
				contentFormatter: function(e) {
					var p = e.entries[0].dataPoint.p;
					var t = formatTime(p.time);
					var d = Math.round(units.distance.convert(p.dst) * 100) / 100;
					var e = Math.round(units.elevation.convert(p.elv));
					var tip = "<span style=\"font-size: 1.2em\"> " + t + "</span>"
						+ "<br/><b>distance:</b> " + d + units.distance.label
						+ "<br/><b>elevation:</b> " + e + units.elevation.label;
					addMark(p);
					return tip;
				}
			},
			axisX: {
				titleFontFamily: "HelveticaNeue-condensed,sans-serif",
				gridColor: "#fff",
				interval: units.distance.interval,
				labelFontColor: "#000",
				lineColor: "#000",
				tickColor: "#000",
				lineThickness: 1,
				tickThickness: 1,
				valueFormatString: "0.##" + units.distance.label
			},
			axisY: {
				valueFormatString: "0.##" + units.elevation.label,
				titleFontFamily: "HelveticaNeue-condensed,sans-serif",
				gridColor: "#eee",
				interval: units.elevation.interval,
				includeZero: false,
				interlacedColor: "#d0d0d0",
				labelFontColor: "#000",
				lineColor: "#000",
				tickColor: "#000",
				lineThickness: 1,
				tickThickness: 1,
				gridThickness: 1
			},
			data: [
				{
					type: "splineArea",
					color: "#92c282",
					markerColor: "#f00",
					dataPoints: mapDataPoints(gpxTrack, units)
				}
			]
		});
		$(div).mouseout(removeMark);
	}

	function addMark(p) {
		removeMark();
		mark = mapUi.markLocation(p);
	}

	function removeMark(p) {
		if (mark) mapUi.removeMark(mark);
	}

	function mapDataPoints(track, units) {
		return track.points.map(function(p) {
			return {
				x: units.distance.convert(p.dst),
				y: units.elevation.convert(p.elv),
				p: p
			};
		});
	}

	function formatTime(sec) {
		var t = sec;
		var MINUTE = 60;
		var HOUR = 60 * MINUTE;
		var DAY = 24 * HOUR;

		var days = Math.floor(t / DAY);
		t = t % DAY;
		var hours = Math.floor(t / HOUR);
		t = t % HOUR;
		var minutes = Math.floor(t / MINUTE);
		t = t % MINUTE;
		var seconds = t;

		function pad(n) {
			n = "" + n;
			while (n.length < 2) {
				n = "0" + n;
			}
			return n;
		}

		var s = (days ? days + ":" : "")
			+ (days ? pad(hours) + ":" : (hours ? hours + ":" : ""))
			+ (minutes ? pad(minutes) + ":" : "")
			+ pad(seconds);

		return s;
	}

	(function() {
		renderGraph(div, mapUi.units.imperial)
	}())
}

module.exports = Elevation;