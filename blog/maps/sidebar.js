function Sidebar(div) {
	
	var trackInfos = {};
	var height;
	
	this.hideTrackInfo = function(track) {
		console.log("hideTrackInfo(" + track.fileName + ")");
		var infoDiv = trackInfos[track.fileName];
		trackInfos[track.fileName] = null;

		var p = {
        	height: [ "toggle", "linear"],
            opacity: [ "toggle", "linear" ]
        };
		var k = function() {
			$(infoDiv).remove();
		};
		$(infoDiv).animate(p, 400, k);
	};

	this.showTrackInfo = function(track, conf) {
		var trackInfo = buildTrackInfo(track, conf);
	    trackInfos[track.fileName] = trackInfo;
	    $(div).append(trackInfo);
	};
	
	function buildTrackInfo(track, conf) {
		color = conf.color || Colors.getDefaultColor();
		console.log("showTrackInfo(" + track.fileName + ", \"" + color + "\")");
	    var trackInfo = document.createElement("div");
	    trackInfo.setAttribute("id", track.fileName);
	    trackInfo.setAttribute("class", "trackInfo");
	    trackInfo.style.borderColor = color;
	    
	    var trackTitle = document.createElement("h4");
	    trackTitle.setAttribute("style", "background-color: " + color);
	    trackTitle.setAttribute("class", "trackInfoTitle");
	    
	    trackTitle.innerHTML = track.title; // Title is already HTML-escaped.
	    if (conf.onclick) { trackTitle.addEventListener("click", conf.onclick); }
	    trackInfo.appendChild(trackTitle);
	    
	    var trackTable = document.createElement("table");
	    trackTable.appendChild(buildTr("Date:", track.date));
	    trackTable.appendChild(buildTr("Duration:", track.duration));
	    trackTable.appendChild(buildTr("Distance (mi):", track.miles));
	    trackTable.appendChild(buildTr("Climbing (ft):", track.climbingFeet));
	    
	    var zoomTd = document.createElement("td");
	    var zoomLink = document.createElement("a");
	    zoomLink.setAttribute("href", "javascript:");
	    zoomLink.innerHTML = "&laquo; zoom";
	    zoomLink.addEventListener("click", conf.zoom);
	    zoomTd.appendChild(zoomLink);
	    
	    var entryTd = document.createElement("td");
	    entryTd.setAttribute("colspan", "2");
	    entryTd.setAttribute("align", "right");
	    entryTd.innerHTML = "<a href=\"maps/" + track.fileName + "\">more &raquo;</a>";

	    var lastRow = document.createElement("tr");
	    lastRow.appendChild(zoomTd);
	    lastRow.appendChild(entryTd);
	    
	    trackTable.appendChild(lastRow);
	    
	    trackInfo.appendChild(trackTable);
	    return trackInfo;
	};

	function buildTr(thData, tdData)
	{
	    var tr = document.createElement("tr");
	    var th = document.createElement("th");
	    th.appendChild(document.createTextNode(thData));
	    var td = document.createElement("td");
	    td.appendChild(document.createTextNode(tdData));
	    tr.appendChild(th);
	    tr.appendChild(td);
	    return tr;
	}
}

module.exports = Sidebar;