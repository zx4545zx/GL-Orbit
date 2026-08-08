(function () {
	var theme = 'y2k';
	var shape = 'sharp';
	var colors = {
		fanzine: '#fbf3e4',
		midnight: '#0d0a14',
		y2k: '#e8e6f5',
		sakura: '#faf6f0',
		ocean: '#eef7fa',
		candy: '#fff6ec',
		mission: '#edeae2'
	};
	try {
		var stored = localStorage.getItem('theme');
		if (stored === 'fanzine' || stored === 'midnight' || stored === 'y2k' || stored === 'sakura' || stored === 'ocean' || stored === 'candy' || stored === 'mission') {
			theme = stored;
		} else if (stored !== null) {
			localStorage.setItem('theme', 'y2k');
		}
	} catch (e) {}
	try {
		var storedShape = localStorage.getItem('shape');
		if (storedShape === 'rounded') {
			shape = storedShape;
		} else if (storedShape !== null && storedShape !== 'sharp') {
			localStorage.setItem('shape', 'sharp');
		}
	} catch (e) {}
	document.documentElement.dataset.theme = theme;
	document.documentElement.dataset.shape = shape;
	var meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute('content', colors[theme]);
})();
