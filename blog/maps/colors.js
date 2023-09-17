Colors = (function() {
	var colors = [
	    "#FF0000", // DEFAULT: RED
	    "#9F5F9F", // Blue Violet
	    "#FF7F00", // Coral
	    "#9932CD", // * Dark Orchid
	    "#871F78", // * Dark Purple
	    "#6B238E", // * Dark Slate Blue
	    "#7093DB", // Dark Turquoise
	    "#D19275", // Feldspar
	    "#8E2323", // * Firebrick
	    "#8E236B", // * Maroon
	    "#23238E", // * Navy Blue
	    "#4D4DFF", // * Neon Blue
	    "#00009C", // New Midnight Blue
	    "#FF7F00", // Orange
	    "#FF2400", // Orange Red
	    "#DB70DB", // * Orchid
	    "#8C1717", // * Scarlet
	    "#3299CC", // Sky Blue
	    "#007FFF", // Slate Blue
	    "#FF1CAE", // Spicy Pink
	    "#236B8E", // Steel Blue
	    "#38B0DE", // Summer Sky
	    "#CC3299", // Violet Red
	];
	
	var i = 0;
	
	function getColor(n) { 
	    return colors[(n || 0) % colors.length]; 
	}
	
	function getNextColor() { 
		i++; 
		i = i % colors.length; 
		return getColor(i); 
	}

	return {
		getColor: getColor,
		getNextColor: getNextColor,
		getDefaultColor: function() { return colors[0]; }
	};
})();

module.exports = Colors;