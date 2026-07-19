(function () {
	var theme = 'light';
	try {
		var stored = localStorage.getItem('theme');
		if (stored === 'dark' || stored === 'light') {
			theme = stored;
		} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			theme = 'dark';
		}
	} catch (e) {}
	document.documentElement.dataset.theme = theme;
	if (theme === 'dark') {
		var meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.setAttribute('content', '#24151F');
	}
})();
