const puppertinoThemeMan = (function () {
  let options = {
    autoDetect: true,
    darkThemeClass: 'p-dark-mode',
  };

  function retrieveTheme() {
    let theme = localStorage.getItem('puppertino_theme');
    if (theme) {
      document.body.classList.remove('default', options.darkThemeClass);
      document.body.classList.add(theme);
    }
  }

  function saveTheme(theme) {
    localStorage.setItem('puppertino_theme', theme);
    document.body.classList.remove('default', options.darkThemeClass);
    document.body.classList.add(theme);
  }

  function detectSystemTheme() {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode) {
      saveTheme(options.darkThemeClass);
    } else {
      saveTheme('default');
    }
  }

  return {
    init: function (userOptions = {}) {
      options = { ...options, ...userOptions };

      // Check if the user has already selected a theme, otherwise detect system theme
      const userTheme = localStorage.getItem('puppertino_theme');
      if (!userTheme) {
        if (options.autoDetect && window.matchMedia) {
          detectSystemTheme();
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectSystemTheme);
        } else {
          retrieveTheme();
        }
      } else {
        retrieveTheme();
      }

      // Detect changes to puppertino_theme in other tabs
      window.addEventListener('storage', function (event) {
        if (event.key === 'puppertino_theme') {
          retrieveTheme();
        }
      }, false);
    },

    toggle: function () {
      const currentTheme = document.body.classList.contains(options.darkThemeClass) ? 'default' : options.darkThemeClass;
      saveTheme(currentTheme);
    },

    isDarkThemeActive: function () {
      return document.body.classList.contains(options.darkThemeClass);
    }
  };
})();

// Usage:
// puppertinoThemeMan.init({ autoDetect: true, darkThemeClass: 'custom-dark-theme' });
// To toggle between light and dark mode:
// puppertinoThemeMan.toggle();
// To check if dark theme is active:
// const isDarkActive = puppertinoThemeMan.isDarkThemeActive();
