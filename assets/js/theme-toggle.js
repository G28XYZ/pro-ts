(() => {
	const STORAGE_KEY = "theme";
	const root = document.documentElement;
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

	const getInitialTheme = () => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === "light" || saved === "dark") return saved;
		return prefersDark.matches ? "dark" : "light";
	};

	const createToggle = () => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "theme-toggle";
		button.setAttribute("aria-pressed", "false");
		button.innerHTML =
			'<span class="theme-toggle__icon" aria-hidden="true"></span>' +
			'<span class="theme-toggle__label"></span>';
		return button;
	};

	const applyTheme = (theme, button) => {
		root.setAttribute("data-theme", theme);
		const isDark = theme === "dark";
		button.setAttribute("aria-pressed", String(isDark));
		const icon = button.querySelector(".theme-toggle__icon");
		const label = button.querySelector(".theme-toggle__label");
		if (icon) icon.textContent = isDark ? "D" : "L";
		if (label) label.textContent = isDark ? "Dark" : "Light";
	};

	const init = () => {
		const button = createToggle();
		document.body.appendChild(button);

		let theme = getInitialTheme();
		applyTheme(theme, button);

		button.addEventListener("click", () => {
			theme = theme === "dark" ? "light" : "dark";
			localStorage.setItem(STORAGE_KEY, theme);
			applyTheme(theme, button);
		});

		prefersDark.addEventListener("change", (event) => {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) return;
			theme = event.matches ? "dark" : "light";
			applyTheme(theme, button);
		});
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
