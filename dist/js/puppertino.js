/*!
  *                                                                
  * (  _`\                                   ( )_  _               
  * | |_) ) _   _  _ _    _ _      __   _ __ | ,_)(_)  ___     _   
  * | ,__/'( ) ( )( '_`\ ( '_`\  /'__`\( '__)| |  | |/' _ `\ /'_`\ 
  * | |    | (_) || (_) )| (_) )(  ___/| |   | |_ | || ( ) |( (_) )
  * (_)    `\___/'| ,__/'| ,__/'`\____)(_)   `\__)(_)(_) (_)`\___/'
  *               | |    | |                                       
  *               (_)    (_)                                       
  * 
  * Puppertino v1.0.0 (https://github.com/codedgar/Puppertino#readme)
  * Copyright 2021-2024 Codedgar
  * Licensed under MIT (https://github.com/codedgar/Puppertino/blob/main/LICENSE)
  */
(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  Promise.resolve().then(() => actions);
  Promise.resolve().then(() => darkmode_manager);
  Promise.resolve().then(() => modals);
  Promise.resolve().then(() => segmented_controls);
  Promise.resolve().then(() => tabs);

  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _createForOfIteratorHelperLoose(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (t) return (t = t.call(r)).next.bind(t);
    if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e) {
      t && (r = t);
      var o = 0;
      return function () {
        return o >= r.length ? {
          done: !0
        } : {
          done: !1,
          value: r[o++]
        };
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }

  (function (document) {
    var p_actions = document.querySelectorAll("[data-p-open-actions]");
    var actions = document.querySelectorAll(".p-action-big-container");
    var cancel_action = document.querySelectorAll("[data-p-cancel-action]");
    for (var _iterator = _createForOfIteratorHelperLoose(p_actions), _step; !(_step = _iterator()).done;) {
      var item = _step.value;
      item.addEventListener("click", function (event) {
        event.preventDefault();
        var selector = this.getAttribute("data-p-open-actions");
        if (selector.length === 0) {
          console.warn("Error. The data-p-open-action attribute is empty, please add the ID of the action you want to open.");
          return false;
        }
        document.querySelector(".p-action-background").classList.add("nowactive");
        document.body.classList.add("p-modal-opened");
        document.querySelector(selector).classList.add("active");
      });
    }
    for (var _iterator2 = _createForOfIteratorHelperLoose(cancel_action), _step2; !(_step2 = _iterator2()).done;) {
      var element = _step2.value;
      element.addEventListener("click", function (event) {
        event.preventDefault();
        document.querySelector(".p-action-big-container.active").classList.remove("active");
        document.querySelector(".p-action-background").classList.remove("nowactive");
        document.body.classList.remove("p-modal-opened");
      });
    }
    document.querySelector(".p-action-background").addEventListener("click", function (event) {
      event.preventDefault();
      var opened_action = document.querySelector(".p-action-big-container.active");
      if (opened_action.getAttribute("data-p-close-on-outside") === "true") {
        event.stopPropagation();
        opened_action.classList.remove("active");
        document.querySelector(".p-action-background").classList.remove("nowactive");
        document.body.classList.remove("p-modal-opened");
      }
    });
    for (var _iterator3 = _createForOfIteratorHelperLoose(actions), _step3; !(_step3 = _iterator3()).done;) {
      var action = _step3.value;
      action.addEventListener("click", function (event) {
        event.stopPropagation();
      });
    }
  })(document);

  const actions = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null
  }, Symbol.toStringTag, { value: 'Module' }));

  // Usage:
  // puppertinoThemeMan.init({ autoDetect: true, darkThemeClass: 'custom-dark-theme' });
  // To toggle between light and dark mode:
  // puppertinoThemeMan.toggle();
  // To check if dark theme is active:
  // const isDarkActive = puppertinoThemeMan.isDarkThemeActive();

  const darkmode_manager = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null
  }, Symbol.toStringTag, { value: 'Module' }));

  (function (document) {
    var p_selector_modal = document.querySelectorAll("[data-p-open-modal]");
    var modals = document.querySelectorAll(".p-modal");
    var cancel_button = document.querySelectorAll("[data-p-cancel]");
    for (var _iterator = _createForOfIteratorHelperLoose(p_selector_modal), _step; !(_step = _iterator()).done;) {
      var item = _step.value;
      item.addEventListener("click", function (event) {
        event.preventDefault();
        var selector = this.getAttribute("data-p-open-modal");
        if (selector.length === 0) {
          console.warn("Error. The data-p-open-modal attribute is empty, please add the ID of the modal you want to open.");
          return false;
        }
        document.querySelector(".p-modal-background").classList.add("nowactive");
        document.body.classList.add("p-modal-opened");
        document.querySelector(selector).classList.add("active");
      });
    }
    for (var _iterator2 = _createForOfIteratorHelperLoose(cancel_button), _step2; !(_step2 = _iterator2()).done;) {
      var element = _step2.value;
      element.addEventListener("click", function (event) {
        event.preventDefault();
        document.querySelector(".p-modal.active").classList.remove("active");
        document.querySelector(".p-modal-background").classList.remove("nowactive");
        document.body.classList.remove("p-modal-opened");
      });
    }
    document.querySelector(".p-modal-background").addEventListener("click", function (event) {
      event.preventDefault();
      var opened_modal = document.querySelector(".p-modal.active");
      if (opened_modal.getAttribute("data-p-close-on-outside") === "true") {
        event.stopPropagation();
        opened_modal.classList.remove("active");
        document.querySelector(".p-modal-background").classList.remove("nowactive");
        document.body.classList.remove("p-modal-opened");
      }
    });
    for (var _iterator3 = _createForOfIteratorHelperLoose(modals), _step3; !(_step3 = _iterator3()).done;) {
      var modal = _step3.value;
      modal.addEventListener("click", function (event) {
        event.stopPropagation();
      });
    }
  })(document);

  const modals = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null
  }, Symbol.toStringTag, { value: 'Module' }));

  (function (document) {
    var p_segmented_controls = document.querySelectorAll(".p-segmented-controls a");
    for (var _iterator = _createForOfIteratorHelperLoose(p_segmented_controls), _step; !(_step = _iterator()).done;) {
      var item = _step.value;
      item.addEventListener("click", function (event) {
        event.preventDefault();
        this.parentElement.querySelector("a.active").classList.remove("active");
        this.classList.add("active");
      });
    }
  })(document);

  const segmented_controls = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null
  }, Symbol.toStringTag, { value: 'Module' }));

  (function (d) {
    d.addEventListener("click", function (e) {
      var idTabs = Array.from(document.querySelectorAll(".p-tabs-container"));
      var identifier = e.target.parentElement.parentElement.id;
      idTabs.forEach(function (element) {
        if (element.id === identifier) {
          var tabs = Array.from(element.children[0].children);
          var panels = Array.from(element.children[1].children);
          var i = tabs.indexOf(e.target);
          tabs.map(function (tab) {
            return tab.classList.remove("p-is-active");
          });
          tabs[i].classList.add("p-is-active");
          panels.map(function (panel) {
            return panel.classList.remove("p-is-active");
          });
          panels[i].classList.add("p-is-active");
        }
      });
    });
  })(document);
  var mobile_tabs_pupper = document.querySelectorAll('.p-mobile-tabs a');
  for (var _iterator = _createForOfIteratorHelperLoose(mobile_tabs_pupper), _step; !(_step = _iterator()).done;) {
    var item = _step.value;
    item.addEventListener("click", function (event) {
      event.preventDefault();
      var remover_pupper = this.parentNode.parentNode;
      remover_pupper.querySelector('.active').classList.remove('active');
      this.classList.add('active');
      remover_pupper.parentNode.querySelector('.p-mobile-tabs--content.active').classList.remove('active');
      document.querySelector(this.getAttribute('data-p-mobile-toggle')).classList.add('active');
    });
  }

  const tabs = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null
  }, Symbol.toStringTag, { value: 'Module' }));

}));
//# sourceMappingURL=puppertino.js.map
