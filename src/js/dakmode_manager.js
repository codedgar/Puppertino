"use strict";
var Puppertino = {
    version: '1.0',
    themes: ["default", "darkmode"],
    debug: 1,
    errorMngr: (errorMsg) => {
      // Internal use only, manages exceptions and errors.
      throw new Error(`Puppertino has found an error. \n ${errorMsg}`);
    },
    waningMngr: (warningMsg) => {
      // Internal use only, manages warnings and disables if debug mode is 0.
      if(Puppertino.debug == 1){
        return console.warn(`Puppertino warning. \n ${warningMsg} \n (Set debug to 0 to disable these messages)`);
      }
    },
    getTheme: () => {
      let pupper_theme = localStorage.getItem('puppertino_theme');
      if(pupper_theme == undefined){
        return 'no-theme';
      }
      return pupper_theme;
    },
    setTheme: (theme) => {
      if(typeof(theme) === 'undefined'){
        Puppertino.errorMngr('Theme to set has been not defined (Called Puppertino.setTheme without a theme)');
      }
      Puppertino.waningMngr('Theme to set has been not defined (Called Puppertino.setTheme without a theme)');

      document.querySelector('body').setAttribute('data-p-theme', theme);
    },
    toggleTheme: () => {
      if(Puppertino.themes.length < 1){
        Puppertino.errorMngr('Amount of themes less than 2. There must be at least one.');
      }
      if(Puppertino.getTheme() == Puppertino.themes[0]){
        Puppertino.setTheme(Puppertino.themes[1]);
      }else{
        Puppertino.setTheme(Puppertino.themes[0]);
      }
      console.log();

      document.querySelector('body');
    },
    autoSetTheme: () => {

    },
    
    nestedObj: {
      myNestedMethod: (params) => {
        // ...do something here
      }
    }
  };
