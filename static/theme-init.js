(function () {
 var theme = 'orbit';
 var colors = { orbit: '#fffafc', space: '#f4f8ff', sakura: '#fff7fa', love: '#fff8f1' };
	try {
		var stored = localStorage.getItem('theme');
		if (stored === 'orbit' || stored === 'space' || stored === 'sakura' || stored === 'love') {
			theme = stored;
		} else if (stored !== null) {
			localStorage.setItem('theme', 'orbit');
		}
	} catch (e) {}
 document.documentElement.dataset.theme = theme;
 var meta = document.querySelector('meta[name="theme-color"]');
 if (meta) meta.setAttribute('content', colors[theme]);
})();
