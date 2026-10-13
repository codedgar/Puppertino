/*!
 * Glassworks v2.0.0 — liquid glass for the web
 * https://github.com/codedgar/glassworks#readme
 * Licence: MIT. Forked from liquidGL by NaughtyDuk©.
 */
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/index.js
  var index_exports = {};
  __export(index_exports, {
    GlassworksEngineError: () => GlassworksEngineError,
    captureToCanvas: () => captureToCanvas,
    createHtml2canvasEngine: () => createHtml2canvasEngine,
    createSnapdomEngine: () => createSnapdomEngine,
    default: () => index_default,
    getRegisteredEngine: () => getRegisteredEngine,
    glassworks: () => glassworks,
    liquidGLLens: () => liquidGLLens,
    liquidGLRenderer: () => liquidGLRenderer,
    registerEngine: () => registerEngine,
    resolveEngine: () => resolveEngine,
    version: () => version
  });

  // src/util.js
  function debounce(fn, wait) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, a), wait);
    };
  }
  function effectiveZ(el) {
    let node = el;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      if (style.position !== "static" && style.zIndex !== "auto") {
        const z = parseInt(style.zIndex, 10);
        if (!isNaN(z)) return z;
      }
      node = node.parentElement;
    }
    return 0;
  }
  function compileShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src.trim());
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("Shader error", gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }
  function createProgram(gl, vsSource, fsSource) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error("Program link error", gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  // src/test-hooks.js
  var TEST_ENABLED = typeof window !== "undefined" && !!window.GLASSWORKS_TEST;
  function testOpt(name) {
    const t = typeof window !== "undefined" && window.GLASSWORKS_TEST;
    return t && typeof t === "object" ? t[name] : void 0;
  }
  function testEngineVersion(engine, adapter) {
    if (adapter && adapter.version) return adapter.version;
    if (engine === "snapdom") return testOpt("snapdomVersion") || null;
    return testOpt("html2canvasVersion") || null;
  }
  if (TEST_ENABLED) {
    window.__glassworks = {
      enabled: true,
      mode: testOpt("rawEngine") ? "raw" : "production",
      captureCount: 0,
      capturing: false,
      failed: false,
      canvas: null,
      engine: null,
      engineVersion: null,
      fallbackRan: false,
      fallbackReason: null,
      timings: null,
      history: []
    };
  }

  // src/capture/bg-shim.js
  function parseBackgroundImageUrl(value) {
    if (!value || value === "none") return null;
    const m = value.match(/^url\(["']?([^)"']+)["']?\)\s*$/);
    return m ? m[1] : null;
  }
  function bgPositionToObjectPosition(posStr) {
    return posStr || "50% 50%";
  }
  function bgSizeToObjectFit(sizeStr) {
    if (sizeStr === "cover") return "cover";
    if (sizeStr === "contain") return "contain";
    return "cover";
  }
  async function injectBackgroundImageShims(target) {
    const cleanups = [];
    const loadPromises = [];
    if (!target || !target.querySelectorAll) return cleanups;
    const all = target.querySelectorAll("*");
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      let cs;
      try {
        cs = window.getComputedStyle(el);
      } catch (_) {
        continue;
      }
      const url = parseBackgroundImageUrl(cs.backgroundImage);
      if (!url) continue;
      const restoreFns = [];
      if (cs.position === "static") {
        const prev = el.style.position;
        el.style.position = "relative";
        restoreFns.push(() => {
          el.style.position = prev;
        });
      }
      if (cs.isolation !== "isolate") {
        const prev = el.style.isolation;
        el.style.isolation = "isolate";
        restoreFns.push(() => {
          el.style.isolation = prev;
        });
      }
      const shim = document.createElement("img");
      shim.crossOrigin = "anonymous";
      shim.setAttribute("data-liquidgl-bg-shim", "");
      shim.style.cssText = [
        "position:absolute",
        "inset:0",
        "width:100%",
        "height:100%",
        "object-fit:" + bgSizeToObjectFit(cs.backgroundSize),
        "object-position:" + bgPositionToObjectPosition(cs.backgroundPosition),
        "pointer-events:none",
        "z-index:-1",
        "border-radius:" + cs.borderRadius,
        "user-select:none"
      ].join(";");
      const loadP = new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          resolve();
        };
        shim.addEventListener("load", finish, { once: true });
        shim.addEventListener("error", finish, { once: true });
        setTimeout(finish, 1500);
      });
      shim.src = url;
      loadPromises.push(loadP);
      el.insertBefore(shim, el.firstChild);
      cleanups.push(() => {
        if (shim.parentNode) shim.parentNode.removeChild(shim);
        for (let r = restoreFns.length - 1; r >= 0; r--) restoreFns[r]();
      });
    }
    if (loadPromises.length) await Promise.all(loadPromises);
    return cleanups;
  }

  // src/capture/complete.js
  function snapshotLooksComplete(canvas) {
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return false;
    if (canvas.height < 200) return true;
    let ctx;
    try {
      ctx = canvas.getContext("2d", { willReadFrequently: true });
    } catch (_) {
      return true;
    }
    if (!ctx) return true;
    const sampleRows = [
      Math.floor(canvas.height * 0.55),
      Math.floor(canvas.height * 0.75),
      Math.max(0, canvas.height - 32)
    ];
    for (let r = 0; r < sampleRows.length; r++) {
      const y = sampleRows[r];
      let data;
      try {
        data = ctx.getImageData(0, y, canvas.width, 1).data;
      } catch (_) {
        return true;
      }
      let opaqueCount = 0;
      const total = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 16) opaqueCount++;
      }
      if (opaqueCount / total > 0.01) return true;
    }
    return false;
  }

  // src/capture/html2canvas.js
  var HTML2CANVAS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
  var _h2cLoadPromise = null;
  function canLazyLoadHtml2canvas() {
    return typeof window !== "undefined" && typeof document !== "undefined";
  }
  function ensureHtml2canvas() {
    if (typeof window.html2canvas === "function") {
      return Promise.resolve(window.html2canvas);
    }
    if (_h2cLoadPromise) return _h2cLoadPromise;
    _h2cLoadPromise = new Promise((resolve, reject) => {
      const url = window.LIQUIDGL_HTML2CANVAS_URL || HTML2CANVAS_CDN;
      const s = document.createElement("script");
      s.src = url;
      s.crossOrigin = "anonymous";
      s.onload = () => {
        if (typeof window.html2canvas === "function") {
          resolve(window.html2canvas);
        } else {
          _h2cLoadPromise = null;
          reject(new Error("liquidGL: html2canvas script loaded but global is missing"));
        }
      };
      s.onerror = () => {
        _h2cLoadPromise = null;
        reject(new Error("liquidGL: failed to lazy-load html2canvas from " + url));
      };
      document.head.appendChild(s);
    });
    return _h2cLoadPromise;
  }
  async function captureViaHtml2canvas(target, { scale, ignore, engine } = {}) {
    const html2canvas = engine ? engine.raw : await ensureHtml2canvas();
    const restores = [];
    if (typeof ignore === "function") {
      const all = target.querySelectorAll("*");
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        try {
          if (ignore(el)) {
            el.setAttribute("data-liquidgl-hide", "");
            restores.push(() => {
              el.removeAttribute("data-liquidgl-hide");
            });
          }
        } catch (_) {
        }
      }
    }
    try {
      const fullW = target.scrollWidth;
      const fullH = target.scrollHeight;
      return await html2canvas(target, {
        allowTaint: false,
        useCORS: true,
        backgroundColor: null,
        removeContainer: true,
        width: fullW,
        height: fullH,
        scrollX: 0,
        scrollY: 0,
        scale,
        logging: false,
        ignoreElements: (element) => {
          return element && element.tagName === "CANVAS" && element.hasAttribute && element.hasAttribute("data-liquid-ignore");
        },
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll("[data-liquidgl-hide]").forEach((el) => {
            el.style.visibility = "hidden";
          });
        }
      });
    } finally {
      for (let i = restores.length - 1; i >= 0; i--) {
        restores[i]();
      }
    }
  }

  // src/capture/engines.js
  var GlassworksEngineError = class extends Error {
    constructor(message) {
      super(message);
      this.name = "GlassworksEngineError";
    }
  };
  var registry = /* @__PURE__ */ new Map();
  function registerEngine(name, adapter) {
    if (!name || typeof name !== "string") throw new TypeError("registerEngine: name must be a string");
    if (!adapter || typeof adapter.capture !== "function") {
      throw new TypeError(`registerEngine("${name}"): adapter must have a capture(target, opts) function`);
    }
    registry.set(name, { name, version: null, ...adapter });
    return registry.get(name);
  }
  function getRegisteredEngine(name) {
    return registry.get(name) || null;
  }
  function createSnapdomEngine(snapdom, { version: version2 } = {}) {
    if (!snapdom || typeof snapdom.toCanvas !== "function") {
      throw new TypeError("createSnapdomEngine: expected the snapdom module (with toCanvas)");
    }
    return {
      name: "snapdom",
      version: version2 || snapdom.version || (TEST_ENABLED ? testOpt("snapdomVersion") : null) || null,
      raw: snapdom,
      capture(target, { scale, options } = {}) {
        const opts = {
          scale,
          dpr: 1,
          backgroundColor: "transparent",
          crossOrigin: "anonymous",
          embedFonts: true,
          ...options || {}
        };
        const override = TEST_ENABLED ? testOpt("snapdomOptions") : null;
        if (override && typeof override === "object") {
          for (const k in override) {
            if (override[k] === null) delete opts[k];
            else opts[k] = override[k];
          }
        }
        return snapdom.toCanvas(target, opts);
      }
    };
  }
  function createHtml2canvasEngine(html2canvas, { version: version2 } = {}) {
    if (typeof html2canvas !== "function") {
      throw new TypeError("createHtml2canvasEngine: expected the html2canvas function");
    }
    return {
      name: "html2canvas",
      version: version2 || (TEST_ENABLED ? testOpt("html2canvasVersion") : null) || null,
      raw: html2canvas,
      capture: null
      // handled by captureViaHtml2canvas
    };
  }
  function resolveEngine(requested) {
    if (requested && typeof requested === "object" && typeof requested.capture === "function") {
      return requested;
    }
    const name = typeof requested === "string" ? requested : "snapdom";
    const registered = registry.get(name);
    if (registered) return registered;
    if (name === "snapdom") {
      const g = typeof window !== "undefined" ? window.snapdom : void 0;
      if (g && typeof g.toCanvas === "function") return createSnapdomEngine(g);
      return null;
    }
    if (name === "html2canvas") {
      const g = typeof window !== "undefined" ? window.html2canvas : void 0;
      if (typeof g === "function") return createHtml2canvasEngine(g);
      return null;
    }
    throw new GlassworksEngineError(
      `Glassworks: unknown capture engine "${name}". Register it first with glassworks.registerEngine("${name}", adapter).`
    );
  }
  function noEngineMessage(name) {
    return `Glassworks: no capture engine available (requested "${name}").
  \u2022 script tag:  <script src="https://cdn.jsdelivr.net/npm/@zumer/snapdom/dist/snapdom.js"><\/script>
  \u2022 bundler:     import { snapdom } from '@zumer/snapdom';
                 glassworks({ engine: glassworks.createSnapdomEngine(snapdom) })
  \u2022 or register: glassworks.registerEngine('snapdom', glassworks.createSnapdomEngine(snapdom))
Without an engine there is nothing to refract, so the lens would stay invisible.`;
  }

  // src/capture/index.js
  async function captureToCanvas(target, {
    scale,
    ignore,
    engine,
    engineOptions,
    onEngineFallback,
    validateCompleteness,
    allowFallback = true,
    testInfo
  } = {}) {
    const requestedName = engine && typeof engine === "object" ? engine.name || "custom" : engine || "snapdom";
    const rawEngine = !!testInfo && !!testOpt("rawEngine");
    if (requestedName === "html2canvas") {
      if (testInfo) testInfo.engine = "html2canvas";
      return await captureViaHtml2canvas(target, { scale, ignore, engine: resolveEngine("html2canvas") });
    }
    const adapter = resolveEngine(engine);
    if (!adapter) {
      if (testInfo) {
        testInfo.fallbackReason = "engine-unavailable";
        if (rawEngine) {
          testInfo.fallbackSuppressed = true;
          throw new GlassworksEngineError(noEngineMessage(requestedName));
        }
        testInfo.fallbackRan = true;
        testInfo.engine = "html2canvas";
      }
      if (!allowFallback || !canLazyLoadHtml2canvas()) {
        throw new GlassworksEngineError(noEngineMessage(requestedName));
      }
      console.warn(
        `Glassworks: capture engine "${requestedName}" is not available \u2014 falling back to html2canvas. Pass an engine adapter to avoid the lazy CDN load.`
      );
      if (typeof onEngineFallback === "function") onEngineFallback("html2canvas");
      return await captureViaHtml2canvas(target, { scale, ignore });
    }
    const tHide0 = testInfo ? performance.now() : 0;
    const restores = [];
    if (typeof ignore === "function") {
      const all = target.querySelectorAll("*");
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        try {
          if (ignore(el)) {
            const prev = el.style.visibility;
            el.style.visibility = "hidden";
            restores.push(() => {
              el.style.visibility = prev;
            });
          }
        } catch (_) {
        }
      }
    }
    const tShim0 = testInfo ? performance.now() : 0;
    if (testInfo) testInfo.timings.hideMs = tShim0 - tHide0;
    const bgShimCleanups = testInfo && testOpt("bgShim") === false ? [] : await injectBackgroundImageShims(target);
    if (testInfo) {
      testInfo.timings.bgShimMs = performance.now() - tShim0;
      testInfo.bgShimCount = bgShimCleanups.length;
    }
    const cleanupAllShims = () => {
      for (let i = bgShimCleanups.length - 1; i >= 0; i--) {
        try {
          bgShimCleanups[i]();
        } catch (_) {
        }
      }
      bgShimCleanups.length = 0;
    };
    let canvas;
    let snapdomThrew = false;
    const tSnap0 = testInfo ? performance.now() : 0;
    try {
      canvas = await adapter.capture(target, { scale, ignore, options: engineOptions });
    } catch (e) {
      snapdomThrew = true;
      if (testInfo) testInfo.snapdomError = String(e && e.message || e);
      console.warn(
        `Glassworks: ${adapter.name} capture threw \u2014 falling back to html2canvas.`,
        e
      );
    } finally {
      for (let i = restores.length - 1; i >= 0; i--) {
        restores[i]();
      }
    }
    const shouldValidate = validateCompleteness === true;
    if (testInfo) {
      testInfo.timings.snapdomMs = performance.now() - tSnap0;
      testInfo.engine = adapter.name;
      testInfo.completenessChecked = shouldValidate && !snapdomThrew;
    }
    if (snapdomThrew || shouldValidate && !snapshotLooksComplete(canvas)) {
      if (!allowFallback) {
        if (testInfo) {
          testInfo.fallbackReason = snapdomThrew ? "engine-threw" : "incomplete-canvas";
          testInfo.fallbackSuppressed = true;
        }
        cleanupAllShims();
        if (snapdomThrew) {
          throw new Error(
            `Glassworks: ${adapter.name} capture failed and fallback is disabled: ` + (testInfo && testInfo.snapdomError || "unknown error")
          );
        }
        console.warn(
          `Glassworks: ${adapter.name} returned an incomplete canvas; fallback is disabled, using it as-is.`
        );
        return canvas;
      }
      if (testInfo) {
        testInfo.fallbackReason = snapdomThrew ? "engine-threw" : "incomplete-canvas";
        if (rawEngine) {
          testInfo.fallbackSuppressed = true;
          cleanupAllShims();
          if (snapdomThrew) {
            throw new Error(
              `Glassworks test: ${adapter.name} threw (raw-engine mode): ` + testInfo.snapdomError
            );
          }
          return canvas;
        }
        testInfo.fallbackRan = true;
        testInfo.engine = "html2canvas";
      }
      if (!snapdomThrew) {
        console.warn(
          `Glassworks: ${adapter.name} returned an incomplete canvas (foreignObject clip) \u2014 switching to html2canvas.`
        );
      }
      if (typeof onEngineFallback === "function") onEngineFallback("html2canvas");
      const tFb0 = testInfo ? performance.now() : 0;
      try {
        return await captureViaHtml2canvas(target, { scale, ignore, engine: resolveEngine("html2canvas") });
      } finally {
        if (testInfo) testInfo.timings.fallbackMs = performance.now() - tFb0;
        cleanupAllShims();
      }
    }
    cleanupAllShims();
    return canvas;
  }

  // src/lens.js
  var liquidGLLens = class {
    constructor(renderer, element, options) {
      this.renderer = renderer;
      this.el = element;
      this.options = options;
      this._initCalled = false;
      this.rectPx = null;
      this.radiusGl = 0;
      this.radiusCss = 0;
      this.revealTypeIndex = this.options.reveal === "fade" ? 1 : 0;
      this._revealProgress = this.revealTypeIndex === 0 ? 1 : 0;
      this.tiltX = 0;
      this.tiltY = 0;
      this.originalShadow = this.el.style.boxShadow;
      this.originalOpacity = this.el.style.opacity;
      this.originalTransition = this.el.style.transition;
      this.el.style.transition = "none";
      this.el.style.opacity = 0;
      this.el.style.position = this.el.style.position === "static" ? "relative" : this.el.style.position;
      const bgCol = window.getComputedStyle(this.el).backgroundColor;
      const rgbaMatch = bgCol.match(/rgba?\(([^)]+)\)/);
      this._bgColorComponents = null;
      if (rgbaMatch) {
        const comps = rgbaMatch[1].split(/[ ,]+/).map(parseFloat);
        const [r, g, b, a = 1] = comps;
        this._bgColorComponents = { r, g, b, a };
        this.el.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0)`;
      }
      this.el.style.backdropFilter = "none";
      this.el.style.webkitBackdropFilter = "none";
      this.el.style.backgroundImage = "none";
      this.el.style.background = "transparent";
      this.el.style.pointerEvents = "none";
      this.updateMetrics();
      this.setShadow(this.options.shadow);
      if (this.options.tilt) this._bindTiltHandlers();
      if (typeof ResizeObserver !== "undefined" && !this._sizeObs) {
        this._sizeObs = new ResizeObserver(() => {
          this.updateMetrics();
          this.renderer.render();
        });
        this._sizeObs.observe(this.el);
      }
    }
    /* ----------------------------- */
    updateMetrics() {
      const rect = this._mirrorActive && this._baseRect ? this._baseRect : this.el.getBoundingClientRect();
      this.rectPx = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      };
      const style = window.getComputedStyle(this.el);
      const brRaw = style.borderTopLeftRadius.split(" ")[0];
      const isPct = brRaw.trim().endsWith("%");
      let brPx;
      if (isPct) {
        const pct = parseFloat(brRaw);
        brPx = Math.min(rect.width, rect.height) * pct / 100;
      } else {
        brPx = parseFloat(brRaw);
      }
      const maxAllowedCss = Math.min(rect.width, rect.height) * 0.5;
      this.radiusCss = Math.min(brPx, maxAllowedCss);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.radiusGl = this.radiusCss * dpr;
      if (this._shadowSyncFn) {
        this._shadowSyncFn();
      }
    }
    /* ----------------------------- */
    _handleOverscrollCompensation() {
      let overscrollY = 0;
      let overscrollX = 0;
      if (window.visualViewport) {
        overscrollX = -window.visualViewport.offsetLeft;
        overscrollY = -window.visualViewport.offsetTop;
      } else {
        const bodyStyle = window.getComputedStyle(document.body);
        const htmlStyle = window.getComputedStyle(document.documentElement);
        if (bodyStyle.transform && bodyStyle.transform !== "none") {
          const matrix = new DOMMatrix(bodyStyle.transform);
          overscrollX = matrix.m41;
          overscrollY = matrix.m42;
        }
        if (overscrollY === 0 && overscrollX === 0 && htmlStyle.transform && htmlStyle.transform !== "none") {
          const matrix = new DOMMatrix(htmlStyle.transform);
          overscrollX = matrix.m41;
          overscrollY = matrix.m42;
        }
      }
      this._currentOverscrollX = overscrollX;
      this._currentOverscrollY = overscrollY;
      if (overscrollY !== 0 || overscrollX !== 0) {
        const compensationTransform = `translate(${-overscrollX}px, ${-overscrollY}px)`;
        let currentTransform = this.el.style.transform;
        currentTransform = currentTransform.replace(/translate\([^)]*\)\s*/g, "").trim();
        this.el.style.transform = compensationTransform + (currentTransform ? " " + currentTransform : "");
        if (this._shadowEl) {
          let shadowTransform = this._shadowEl.style.transform || "";
          shadowTransform = shadowTransform.replace(/translate\([^)]*\)\s*/g, "").trim();
          this._shadowEl.style.transform = compensationTransform + (shadowTransform ? " " + shadowTransform : "");
        }
      } else if (!this._tiltInteracting) {
        this.el.style.transform = this._savedTransform || "";
        if (this._shadowEl) {
          this._shadowEl.style.transform = "";
        }
      }
    }
    /* ----------------------------- */
    setTilt(enabled) {
      this.options.tilt = !!enabled;
      if (this.options.tilt) {
        this._bindTiltHandlers();
      } else {
        this._unbindTiltHandlers();
      }
    }
    /* ----------------------------- */
    setShadow(enabled) {
      this.options.shadow = !!enabled;
      const SHADOW_VAL = "0 10px 30px rgba(0,0,0,0.1), 0 0 0 0.5px rgba(0,0,0,0.05)";
      const syncShadow = () => {
        if (!this._shadowEl) return;
        const r = this._mirrorActive && this._baseRect ? this._baseRect : this.el.getBoundingClientRect();
        this._shadowEl.style.left = `${r.left}px`;
        this._shadowEl.style.top = `${r.top}px`;
        this._shadowEl.style.width = `${r.width}px`;
        this._shadowEl.style.height = `${r.height}px`;
        this._shadowEl.style.borderRadius = `${this.radiusCss}px`;
      };
      if (enabled) {
        this.el.style.boxShadow = SHADOW_VAL;
        if (!this._shadowEl) {
          this._shadowEl = document.createElement("div");
          Object.assign(this._shadowEl.style, {
            position: "fixed",
            pointerEvents: "none",
            zIndex: effectiveZ(this.el) - 2,
            boxShadow: SHADOW_VAL,
            willChange: "transform, width, height",
            opacity: this.revealTypeIndex === 1 ? 0 : 1
          });
          document.body.appendChild(this._shadowEl);
          this._shadowSyncFn = syncShadow;
          window.addEventListener("resize", this._shadowSyncFn, {
            passive: true
          });
        }
        syncShadow();
      } else {
        if (this._shadowEl) {
          window.removeEventListener("resize", this._shadowSyncFn);
          this._shadowEl.remove();
          this._shadowEl = null;
        }
        this.el.style.boxShadow = this.originalShadow;
      }
    }
    /* ----------------------------- */
    _reveal() {
      if (this.revealTypeIndex === 0) {
        this.el.style.opacity = this.originalOpacity || 1;
        this.renderer.canvas.style.opacity = "1";
        this._revealProgress = 1;
        this._TriggerInit();
        return;
      }
      if (this.renderer._revealAnimating) return;
      this.renderer._revealAnimating = true;
      const dur = 1e3;
      const start = performance.now();
      const animate = () => {
        const progress = Math.min(1, (performance.now() - start) / dur);
        this.renderer.lenses.forEach((ln) => {
          ln._revealProgress = progress;
          ln.el.style.opacity = (ln.originalOpacity || 1) * progress;
          if (ln._shadowEl) {
            ln._shadowEl.style.opacity = progress;
          }
        });
        this.renderer.canvas.style.opacity = String(progress);
        this.renderer.render();
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.renderer._revealAnimating = false;
          this.renderer.lenses.forEach((ln) => {
            ln.el.style.transition = ln.originalTransition || "";
            ln._TriggerInit();
          });
        }
      };
      requestAnimationFrame(animate);
    }
    /* ----------------------------- */
    _bindTiltHandlers() {
      if (this._tiltHandlersBound) return;
      if (this._savedTransform === void 0) {
        const currentTransform = this.el.style.transform;
        if (currentTransform && currentTransform.includes("translate")) {
          this._savedTransform = currentTransform.replace(/translate\([^)]*\)\s*/g, "").trim();
          if (this._savedTransform === "") this._savedTransform = "none";
        } else {
          this._savedTransform = currentTransform;
        }
      }
      if (this._savedTransformStyle === void 0) {
        this._savedTransformStyle = this.el.style.transformStyle;
      }
      this.el.style.transformStyle = "preserve-3d";
      const getMaxTilt = () => Number.isFinite(this.options.tiltFactor) ? this.options.tiltFactor : 5;
      this._applyTilt = (clientX, clientY) => {
        if (!this._tiltInteracting) {
          this._tiltInteracting = true;
          this.el.style.transition = "transform 0.12s cubic-bezier(0.33,1,0.68,1)";
          this._createMirrorCanvas();
          if (this._mirror) {
            this._mirror.style.transition = "transform 0.12s cubic-bezier(0.33,1,0.68,1)";
          }
          if (this._shadowEl) {
            this._shadowEl.style.transition = "transform 0.12s cubic-bezier(0.33,1,0.68,1)";
          }
        }
        const r = this._baseRect || this.el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        this._pivotOrigin = `${cx}px ${cy}px`;
        const pctX = (clientX - cx) / (r.width / 2);
        const pctY = (clientY - cy) / (r.height / 2);
        const maxTilt = getMaxTilt();
        const rotY = pctX * maxTilt;
        const rotX = -pctY * maxTilt;
        const baseTransform = this._savedTransform && this._savedTransform !== "none" ? this._savedTransform + " " : "";
        let overscrollCompensation = "";
        const bodyStyle = window.getComputedStyle(document.body);
        if (bodyStyle.transform && bodyStyle.transform !== "none") {
          const matrix = new DOMMatrix(bodyStyle.transform);
          const overscrollX = matrix.m41;
          const overscrollY = matrix.m42;
          if (overscrollX !== 0 || overscrollY !== 0) {
            overscrollCompensation = `translate(${-overscrollX}px, ${-overscrollY}px) `;
          }
        }
        const transformStr = `${overscrollCompensation}${baseTransform}perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        this.tiltX = rotX;
        this.tiltY = rotY;
        this.el.style.transformOrigin = `50% 50%`;
        this.el.style.transform = transformStr;
        if (this._mirror) {
          this._mirror.style.transformOrigin = this._pivotOrigin;
          this._mirror.style.transform = transformStr;
        }
        if (this._shadowEl) {
          this._shadowEl.style.transformOrigin = `50% 50%`;
          this._shadowEl.style.transform = transformStr;
        }
        this.renderer.render();
      };
      this._smoothReset = () => {
        this.el.style.transition = "transform 0.4s cubic-bezier(0.33,1,0.68,1)";
        this.el.style.transformOrigin = `50% 50%`;
        const baseRest = this._savedTransform && this._savedTransform !== "none" ? this._savedTransform + " " : "";
        let overscrollCompensation = "";
        const bodyStyle = window.getComputedStyle(document.body);
        if (bodyStyle.transform && bodyStyle.transform !== "none") {
          const matrix = new DOMMatrix(bodyStyle.transform);
          const overscrollX = matrix.m41;
          const overscrollY = matrix.m42;
          if (overscrollX !== 0 || overscrollY !== 0) {
            overscrollCompensation = `translate(${-overscrollX}px, ${-overscrollY}px) `;
          }
        }
        this.el.style.transform = `${overscrollCompensation}${baseRest}perspective(800px) rotateX(0deg) rotateY(0deg)`;
        this.tiltX = 0;
        this.tiltY = 0;
        this.renderer.render();
        if (this._mirror) {
          this._mirror.style.transition = "transform 0.4s cubic-bezier(0.33, 1, 0.68, 1)";
          this._mirror.style.transformOrigin = this._pivotOrigin || "50% 50%";
          this._mirror.style.transform = `${baseRest}perspective(800px) rotateX(0deg) rotateY(0deg)`;
          const clean = () => {
            this._destroyMirrorCanvas();
            this._resetCleanupTimer = null;
          };
          this._mirror.addEventListener("transitionend", clean, {
            once: true
          });
          this._resetCleanupTimer = setTimeout(clean, 350);
        }
        if (this._shadowEl) {
          this._shadowEl.style.transition = "transform 0.4s cubic-bezier(0.33,1,0.68,1)";
          this._shadowEl.style.transformOrigin = `50% 50%`;
          this._shadowEl.style.transform = `${baseRest}perspective(800px) rotateX(0deg) rotateY(0deg)`;
        }
      };
      this._onMouseEnter = (e) => {
        if (this._resetCleanupTimer) {
          clearTimeout(this._resetCleanupTimer);
          this._resetCleanupTimer = null;
          this._destroyMirrorCanvas();
          this.el.style.transition = "none";
          this.el.style.transform = this._savedTransform || "";
          void this.el.offsetHeight;
        }
        this._tiltInteracting = false;
        this._createMirrorCanvas();
        const r = this._baseRect || this.el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        this._applyTilt(cx, cy);
        if (e && typeof e.clientX === "number") {
          requestAnimationFrame(() => {
            this._applyTilt(e.clientX, e.clientY);
          });
        }
        document.addEventListener("mousemove", this._boundCheckLeave, {
          passive: true
        });
      };
      this._onMouseMove = (e) => this._applyTilt(e.clientX, e.clientY);
      this._onTouchStart = (e) => {
        this._tiltInteracting = false;
        this._createMirrorCanvas();
        if (e.touches && e.touches.length === 1) {
          const t = e.touches[0];
          this._applyTilt(t.clientX, t.clientY);
        }
      };
      this._onTouchMove = (e) => {
        if (e.touches && e.touches.length === 1) {
          const t = e.touches[0];
          this._applyTilt(t.clientX, t.clientY);
        }
      };
      this._onTouchEnd = () => {
        this._smoothReset();
      };
      this.el.addEventListener("mouseenter", this._onMouseEnter.bind(this), {
        passive: true
      });
      this.el.addEventListener("mousemove", this._onMouseMove.bind(this), {
        passive: true
      });
      this.el.addEventListener("touchstart", this._onTouchStart.bind(this), {
        passive: true
      });
      this.el.addEventListener("touchmove", this._onTouchMove.bind(this), {
        passive: true
      });
      this.el.addEventListener("touchend", this._onTouchEnd.bind(this), {
        passive: true
      });
      this._tiltActive = false;
      this._docPointerMove = (e) => {
        var _a, _b;
        const x = (_a = e.clientX) != null ? _a : e.touches && e.touches[0].clientX;
        const y = (_b = e.clientY) != null ? _b : e.touches && e.touches[0].clientY;
        if (x === void 0 || y === void 0) return;
        const r = this.el.getBoundingClientRect();
        const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        if (inside) {
          if (!this._tiltActive) {
            this._tiltActive = true;
            this._onMouseEnter({ clientX: x, clientY: y });
          } else {
            this._applyTilt(x, y);
          }
        } else if (this._tiltActive) {
          this._tiltActive = false;
          this._smoothReset();
        }
      };
      document.addEventListener("pointermove", this._docPointerMove, {
        passive: true
      });
      this._tiltHandlersBound = true;
    }
    _unbindTiltHandlers() {
      if (!this._tiltHandlersBound) return;
      this.el.removeEventListener("mouseenter", this._onMouseEnter.bind(this));
      this.el.removeEventListener("mousemove", this._onMouseMove.bind(this));
      document.removeEventListener("mousemove", this._boundCheckLeave);
      this.el.removeEventListener("touchstart", this._onTouchStart.bind(this));
      this.el.removeEventListener("touchmove", this._onTouchMove.bind(this));
      this.el.removeEventListener("touchend", this._onTouchEnd.bind(this));
      if (this._docPointerMove) {
        document.removeEventListener("pointermove", this._docPointerMove);
        this._docPointerMove = null;
      }
      this._tiltHandlersBound = false;
      this.el.style.transform = this._savedTransform || "";
      this.el.style.transformStyle = this._savedTransformStyle || "";
      this.renderer.render();
    }
    _createMirrorCanvas() {
      this._baseRect = this.el.getBoundingClientRect();
      if (this._mirror) return;
      this._mirror = document.createElement("canvas");
      Object.assign(this._mirror.style, {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: effectiveZ(this.el) - 1,
        willChange: "transform"
      });
      this._mirrorCtx = this._mirror.getContext("2d");
      document.body.appendChild(this._mirror);
      const updateClip = () => {
        if (this._mirrorActive) {
          this._baseRect = this._baseRect || this.el.getBoundingClientRect();
        }
        const r = this._baseRect || this.el.getBoundingClientRect();
        const radius = `${this.radiusCss}px`;
        this._mirror.style.clipPath = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round ${radius})`;
        this._mirror.style.webkitClipPath = this._mirror.style.clipPath;
      };
      updateClip();
      this._mirrorClipUpdater = updateClip;
      window.addEventListener("resize", updateClip, { passive: true });
      this._mirrorActive = true;
    }
    _destroyMirrorCanvas() {
      if (!this._mirror) return;
      window.removeEventListener("resize", this._mirrorClipUpdater);
      this._mirror.remove();
      this._mirror = this._mirrorCtx = null;
      this._baseRect = null;
      this._mirrorActive = false;
    }
    /** Used when no capture engine is available: restore the element so it does
     *  not stay invisible, and let on.init fire so callers are not left hanging. */
    _revealWithoutTexture() {
      this.el.style.opacity = this.originalOpacity || 1;
      this.el.style.transition = this.originalTransition || "";
      this._TriggerInit();
    }
    _TriggerInit() {
      if (this._initCalled) return;
      this._initCalled = true;
      if (this.options.on && this.options.on.init) {
        this.options.on.init(this);
      }
    }
  };

  // src/renderer.js
  var liquidGLRenderer = class {
    constructor(snapshotSelector, snapshotResolution = 1, engine = "snapdom", allowFallback = true) {
      this._allowFallback = allowFallback !== false;
      this._engine = engine && typeof engine === "object" && typeof engine.capture === "function" ? engine : engine === "html2canvas" ? "html2canvas" : "snapdom";
      this.canvas = document.createElement("canvas");
      this.canvas.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;`;
      this.canvas.setAttribute("data-liquid-ignore", "");
      document.body.appendChild(this.canvas);
      const ctxAttribs = {
        alpha: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true
      };
      this.gl = this.canvas.getContext("webgl2", ctxAttribs) || this.canvas.getContext("webgl", ctxAttribs) || this.canvas.getContext("experimental-webgl", ctxAttribs);
      if (!this.gl) throw new Error("liquidGL: WebGL unavailable");
      this.lenses = [];
      this.texture = null;
      this.textureWidth = 0;
      this.textureHeight = 0;
      this.scaleFactor = 1;
      this.startTime = Date.now();
      this._scrollUpdateCounter = 0;
      this._initGL();
      this.snapshotTarget = document.querySelector(snapshotSelector) || document.body;
      if (!this.snapshotTarget) this.snapshotTarget = document.body;
      this._isScrolling = false;
      let lastScrollY = window.scrollY;
      let scrollTimeout;
      const scrollCheck = () => {
        if (window.scrollY !== lastScrollY) {
          this._isScrolling = true;
          lastScrollY = window.scrollY;
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            this._isScrolling = false;
          }, 200);
        }
        requestAnimationFrame(scrollCheck);
      };
      requestAnimationFrame(scrollCheck);
      const onResize = debounce(() => {
        if (this._capturing || this._isScrolling) return;
        if (window.visualViewport && window.visualViewport.scale !== 1) {
          return;
        }
        this._dynamicNodes.forEach((node) => {
          const meta = this._dynMeta.get(node.el);
          if (meta) {
            meta.needsRecapture = true;
            meta.prevDrawRect = null;
            meta.lastCapture = null;
          }
        });
        this._resizeCanvas();
        this.lenses.forEach((l) => l.updateMetrics());
        this.captureSnapshot();
      }, 250);
      window.addEventListener("resize", onResize, { passive: true });
      if ("ResizeObserver" in window) {
        new ResizeObserver(onResize).observe(this.snapshotTarget);
      }
      this._dynamicNodes = [];
      this._dynMeta = /* @__PURE__ */ new WeakMap();
      this._lastDynamicUpdate = 0;
      const styleEl = document.createElement("style");
      styleEl.id = "liquid-gl-dynamic-styles";
      document.head.appendChild(styleEl);
      this._dynamicStyleSheet = styleEl.sheet;
      this._snapshotResolution = Math.max(
        0.1,
        Math.min(3, snapshotResolution)
      );
      this._resizeCanvas();
      this._captureRequested = true;
      Promise.resolve().then(() => {
        this._captureRequested = false;
        this.captureSnapshot();
      });
      this._pendingReveal = [];
      this._videoNodes = Array.from(
        this.snapshotTarget.querySelectorAll("video")
      );
      this._videoNodes = this._videoNodes.filter((v) => !this._isIgnored(v));
      this._tmpCanvas = document.createElement("canvas");
      this._tmpCtx = this._tmpCanvas.getContext("2d");
      this.canvas.style.opacity = "0";
      this.useExternalTicker = false;
      this._workerEnabled = typeof OffscreenCanvas !== "undefined" && typeof Worker !== "undefined" && typeof ImageBitmap !== "undefined";
      if (this._workerEnabled) {
        const workerSrc = `
        /* dynamic-element worker (runs in its own thread) */
        self.onmessage = async (e) => {
          const { id, width, height, snap, dyn } = e.data;
          const off = new OffscreenCanvas(width, height);
          const ctx = off.getContext('2d');

          ctx.drawImage(snap, 0, 0, width, height);
          ctx.drawImage(dyn, 0, 0, width, height);

          const bmp = await off.transferToImageBitmap();
          self.postMessage({ id, bmp }, [bmp]);
        };
      `;
        const blob = new Blob([workerSrc], { type: "application/javascript" });
        this._dynWorker = new Worker(URL.createObjectURL(blob), {
          type: "module"
        });
        this._dynJobs = /* @__PURE__ */ new Map();
        this._dynWorker.onmessage = (e) => {
          const { id, bmp } = e.data;
          const meta = this._dynJobs.get(id);
          if (!meta) return;
          this._dynJobs.delete(id);
          const { x, y, w, h } = meta;
          const gl = this.gl;
          gl.bindTexture(gl.TEXTURE_2D, this.texture);
          gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            x,
            y,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            bmp
          );
        };
      }
    }
    /* ----------------------------- */
    _initGL() {
      const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main(){
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }`;
      const fsSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform vec2  u_resolution;
      uniform vec2  u_textureResolution;
      uniform vec4  u_bounds;
      uniform float u_refraction;
      uniform float u_bevelDepth;
      uniform float u_bevelWidth;
      uniform float u_frost;
      uniform float u_radius;
      uniform float u_time;
      uniform float u_specular;
      uniform float u_revealProgress;
      uniform int   u_revealType;
      uniform float u_tiltX;
      uniform float u_tiltY;
      uniform float u_magnify;
      uniform float u_texScale;
      uniform float u_dpr;
      uniform int   u_bendOn;
      uniform float u_bendEdge;
      uniform float u_bendFalloff;
      uniform float u_bendTail;
      uniform float u_bendTailFalloff;
      uniform vec2  u_bendDir;
      uniform float u_cap;
      uniform int   u_glassOn;
      uniform float u_blurMix;         /* 0 sharp .. 1 the frosted copy */
      uniform sampler2D u_sharp;
      uniform vec4  u_sharpBounds;
      uniform float u_faceWhite;
      uniform float u_faceBlack;
      uniform float u_faceSat;
      uniform vec4  u_faceFill;
      uniform float u_faceMaxLuma;

      float sdRoundBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
      }

      /* Outward unit normal of a rounded box. Straight sides give the
         axis, corners the arc's radial direction. */
      vec2 rbNormal(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        vec2 s = vec2(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0);
        vec2 n;
        if (q.x > 0.0 && q.y > 0.0) n = normalize(q);
        else if (q.x > q.y) n = vec2(1.0, 0.0);
        else n = vec2(0.0, 1.0);
        return n * s;
      }


      void main(){
        /* Pixel space of this lens (canvas px, y up). */
        vec2 b_px = 0.5 * u_resolution;
        vec2 p_px = (v_uv - 0.5) * u_resolution;
        float shortSide = min(u_resolution.x, u_resolution.y);
        float r = min(u_radius, min(b_px.x, b_px.y));
        float sd = sdRoundBox(p_px, b_px, r);
        float d = max(-sd, 0.0);                      /* px in from the edge */

        float band = max(u_bevelWidth * shortSide, 1.0);
        float t = clamp(1.0 - d / (2.0 * band), 0.0, 1.0);
        float t2 = t * t;
        float t4 = t2 * t2;
        float t8 = t4 * t4;

        /* Normal from a rounder box (radius >= 2 x band), so the
           direction is smooth everywhere the rim bends. */
        float rn = min(max(r, 2.0 * band), min(b_px.x, b_px.y));
        vec2 n = rbNormal(p_px, b_px, rn);

        /* ax = texture height / width. UV per longer-side unit, per axis.
           Kept as ratios so mediump never sees page-sized numbers. */
        float ax = (u_resolution.y * u_bounds.z) / max(u_resolution.x * u_bounds.w, 1e-6);
        vec2 k = vec2(max(1.0, ax), max(1.0, 1.0 / ax));

        float amt = u_refraction * t4 + u_bevelDepth * t8;  /* UV of longer side */
        /* Inward: against the outward normal. Texture y runs down. */
        vec2 offset = vec2(-n.x, n.y) * amt * k;
        if (u_bendOn == 1) {
          float dc = d / u_dpr;
          float facing = 1.0;
          if (dot(u_bendDir, u_bendDir) > 0.0) {
            vec2 dir = normalize(vec2(u_bendDir.x, -u_bendDir.y));
            facing = clamp(dot(n, dir) * 1.41421, 0.0, 1.0);
          }
          float px = u_bendEdge * facing * exp(-dc / max(u_bendFalloff, 0.01))
                   + u_bendTail * exp(-dc / max(u_bendTailFalloff, 0.01));
          offset = vec2(-n.x, n.y) * px * u_texScale / u_textureResolution;
        }
        float tiltRefractionScale = 0.05;
        vec2 tiltOffset = vec2(tan(radians(u_tiltY)), -tan(radians(u_tiltX))) * tiltRefractionScale;

        vec2 localUV = (v_uv - 0.5) / u_magnify + 0.5;
        vec2 flippedUV = vec2(localUV.x, 1.0 - localUV.y);
        vec2 mapped = u_bounds.xy + flippedUV * u_bounds.zw;
        vec2 refracted = mapped + offset - tiltOffset;

        float oob = max(max(-refracted.x, refracted.x - 1.0), max(-refracted.y, refracted.y - 1.0));
        float blend = 1.0 - smoothstep(0.0, 0.01, oob);
        vec2 sampleUV = mix(mapped, refracted, blend);

        vec4 baseCol   = texture2D(u_tex, mapped);

        vec2 texel = 1.0 / u_textureResolution;
        vec4 refrCol;

        if (u_frost > 0.0) {
            /* Frost before the lens, as Apple does (backdrop blur, then
               the glass filter): a Gaussian of sigma = u_frost CSS px,
               sampled on a fixed 7x7 grid at 0.75 sigma spacing (+-2.25 sigma). Fixed taps,
               so no grain crawls when the glass moves. */
            float sig = u_frost * u_texScale;               /* texels */
            vec4 sum = vec4(0.0);
            float wsum = 0.0;
            vec2 stepUV = texel * sig * 0.75;
            for (int i = -3; i <= 3; i++) {
              for (int j = -3; j <= 3; j++) {
                float w = exp(-0.28125 * float(i * i + j * j));
                sum += texture2D(u_tex, sampleUV + vec2(float(i), float(j)) * stepUV) * w;
                wsum += w;
              }
            }
            refrCol = sum / wsum;
        } else {
            refrCol = texture2D(u_tex, sampleUV);
        }

        if (refrCol.a < 0.1) {
            refrCol = baseCol;
        }

        if (u_glassOn == 1) {
          /* The same displaced point in the sharp snapshot. */
          vec2 rel = (sampleUV - u_bounds.xy) / u_bounds.zw;
          vec2 sharpUV = u_sharpBounds.xy + rel * u_sharpBounds.zw;
          vec4 sharpCol = texture2D(u_sharp, sharpUV);
          vec3 c = mix(sharpCol.rgb, refrCol.rgb, u_blurMix);
          vec3 y = vec3(u_faceBlack) + (u_faceWhite - u_faceBlack) * c;
          float luma = dot(y, vec3(0.2126, 0.7152, 0.0722));
          y = luma + (y - luma) * u_faceSat;
          if (u_faceMaxLuma < 1.0) {
            float L = 1.28 * u_faceMaxLuma;
            float t = luma / L;
            float e = exp(2.0 * t);
            float lumaOut = L * (e - 1.0) / (e + 1.0);
            y *= lumaOut / max(luma, 0.0001);
          }
          y = mix(y, u_faceFill.rgb, u_faceFill.a);
          refrCol = vec4(clamp(y, 0.0, 1.0), 1.0);
        }

        vec4 final = refrCol;
        if (u_cap < 1.0) {
          float knee = 0.6 * u_cap;
          float span = max(u_cap - knee, 0.001);
          vec3 over = max(final.rgb - knee, 0.0) / span;
          vec3 e = exp(2.0 * over);
          vec3 soft = knee + span * (e - 1.0) / (e + 1.0);
          final.rgb = mix(final.rgb, soft, step(knee, final.rgb));
        }
        float inShape = 1.0 - step(0.0, sd);

        if (u_specular > 0.0) {
          /* Two fixed edge lights, +45 deg (top right) and -135 deg
             (bottom left), on a ~1.5% of the short side rim (min 1.5px).
             Screen-blended so they lift the content rather than paint
             a stripe of white. */
          float w = max(1.5, 0.03 * shortSide);
          float rim = exp(-d / w);
          vec2 L = vec2(0.70710678, 0.70710678);
          float a1 = max(dot(n, L), 0.0);
          float a2 = max(dot(n, -L), 0.0);
          float h = u_specular * rim * (a1 * a1 * a1 + 0.7 * a2 * a2 * a2) * 0.55;
          final.rgb = 1.0 - (1.0 - final.rgb) * (1.0 - clamp(h, 0.0, 1.0));
        } else if (u_specular < 0.0) {
          vec2 lp1 = vec2(sin(u_time*0.2), cos(u_time*0.3))*0.6 + 0.5;
          vec2 lp2 = vec2(sin(u_time*-0.4+1.5), cos(u_time*0.25-0.5))*0.6 + 0.5;
          float h = 0.0;
          h += smoothstep(0.4,0.0,distance(v_uv, lp1))*0.1;
          h += smoothstep(0.5,0.0,distance(v_uv, lp2))*0.08;
          final.rgb += h * -u_specular;
        }

        if (u_revealType == 1) {
            final.rgb *= u_revealProgress;
            final.a  *= u_revealProgress;
        }

        final.rgb *= inShape;
        final.a   *= inShape;

        gl_FragColor = final;
      }`;
      this.program = createProgram(this.gl, vsSource, fsSource);
      const gl = this.gl;
      if (!this.program) throw new Error("liquidGL: Shader failed");
      const vBlitVs = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main(){
        v_uv = (a_pos + 1.0) * 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }`;
      const vBlitFs = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_src;
      void main(){
        gl_FragColor = texture2D(u_src, v_uv);
      }`;
      this._vBlitProgram = createProgram(gl, vBlitVs, vBlitFs);
      if (this._vBlitProgram) {
        this._vBlitPosLoc = gl.getAttribLocation(this._vBlitProgram, "a_pos");
        this._vBlitTexLoc = gl.getUniformLocation(this._vBlitProgram, "u_src");
        this._vBlitQuadBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vBlitQuadBuf);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
          gl.STATIC_DRAW
        );
        this._vBlitFbo = gl.createFramebuffer();
        this._vScratchTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this._vScratchTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      this._lensQuadBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._lensQuadBuf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );
      const frostVs = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main(){ v_uv = (a_pos + 1.0) * 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;
      const frostFs = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      varying vec2 v_uv;
      uniform sampler2D u_src;
      uniform vec4  u_srcRect;   /* region of u_src to read, in UV */
      uniform vec2  u_step;      /* one tap, in u_src UV */
      uniform float u_sigmaTaps; /* sigma, in taps */
      void main(){
        vec2 uv = u_srcRect.xy + v_uv * u_srcRect.zw;
        vec4 sum = vec4(0.0);
        float ws = 0.0;
        for (int k = -32; k <= 32; k++) {
          float t = float(k);
          float w = exp(-0.5 * t * t / (u_sigmaTaps * u_sigmaTaps));
          sum += texture2D(u_src, uv + u_step * t) * w;
          ws += w;
        }
        gl_FragColor = sum / ws;
      }`;
      this._frostProgram = createProgram(gl, frostVs, frostFs);
      if (this._frostProgram) {
        this._frostPosLoc = gl.getAttribLocation(this._frostProgram, "a_pos");
        this._frostU = {
          src: gl.getUniformLocation(this._frostProgram, "u_src"),
          srcRect: gl.getUniformLocation(this._frostProgram, "u_srcRect"),
          step: gl.getUniformLocation(this._frostProgram, "u_step"),
          sigmaTaps: gl.getUniformLocation(this._frostProgram, "u_sigmaTaps")
        };
        this._frostFbo = gl.createFramebuffer();
        this._frostTex = [gl.createTexture(), gl.createTexture()].map((t) => {
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          return t;
        });
        this._frostSize = [0, 0];
      }
      this._lensPosLoc = gl.getAttribLocation(this.program, "a_position");
      gl.enableVertexAttribArray(this._lensPosLoc);
      gl.vertexAttribPointer(this._lensPosLoc, 2, gl.FLOAT, false, 0, 0);
      this.u = {
        tex: gl.getUniformLocation(this.program, "u_tex"),
        res: gl.getUniformLocation(this.program, "u_resolution"),
        textureResolution: gl.getUniformLocation(
          this.program,
          "u_textureResolution"
        ),
        bounds: gl.getUniformLocation(this.program, "u_bounds"),
        refraction: gl.getUniformLocation(this.program, "u_refraction"),
        bevelDepth: gl.getUniformLocation(this.program, "u_bevelDepth"),
        bevelWidth: gl.getUniformLocation(this.program, "u_bevelWidth"),
        frost: gl.getUniformLocation(this.program, "u_frost"),
        radius: gl.getUniformLocation(this.program, "u_radius"),
        time: gl.getUniformLocation(this.program, "u_time"),
        specular: gl.getUniformLocation(this.program, "u_specular"),
        revealProgress: gl.getUniformLocation(this.program, "u_revealProgress"),
        revealType: gl.getUniformLocation(this.program, "u_revealType"),
        tiltX: gl.getUniformLocation(this.program, "u_tiltX"),
        tiltY: gl.getUniformLocation(this.program, "u_tiltY"),
        magnify: gl.getUniformLocation(this.program, "u_magnify"),
        texScale: gl.getUniformLocation(this.program, "u_texScale"),
        dpr: gl.getUniformLocation(this.program, "u_dpr"),
        bendOn: gl.getUniformLocation(this.program, "u_bendOn"),
        bendEdge: gl.getUniformLocation(this.program, "u_bendEdge"),
        bendFalloff: gl.getUniformLocation(this.program, "u_bendFalloff"),
        bendTail: gl.getUniformLocation(this.program, "u_bendTail"),
        bendTailFalloff: gl.getUniformLocation(this.program, "u_bendTailFalloff"),
        bendDir: gl.getUniformLocation(this.program, "u_bendDir"),
        cap: gl.getUniformLocation(this.program, "u_cap"),
        glassOn: gl.getUniformLocation(this.program, "u_glassOn"),
        blurMix: gl.getUniformLocation(this.program, "u_blurMix"),
        sharp: gl.getUniformLocation(this.program, "u_sharp"),
        sharpBounds: gl.getUniformLocation(this.program, "u_sharpBounds"),
        faceWhite: gl.getUniformLocation(this.program, "u_faceWhite"),
        faceBlack: gl.getUniformLocation(this.program, "u_faceBlack"),
        faceSat: gl.getUniformLocation(this.program, "u_faceSat"),
        faceFill: gl.getUniformLocation(this.program, "u_faceFill"),
        faceMaxLuma: gl.getUniformLocation(this.program, "u_faceMaxLuma")
      };
    }
    /* ----------------------------- */
    _resizeCanvas() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = innerWidth * dpr;
      this.canvas.height = innerHeight * dpr;
      this.canvas.style.width = `${innerWidth}px`;
      this.canvas.style.height = `${innerHeight}px`;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    /* ----------------------------- */
    async captureSnapshot() {
      if (!this._engineChecked) {
        this._engineChecked = true;
        if (this._engine !== "html2canvas" && !resolveEngine(this._engine)) {
          this._engineError = new GlassworksEngineError(noEngineMessage(
            typeof this._engine === "string" ? this._engine : "snapdom"
          ));
        }
      }
      if (this._engineError) {
        console.error(this._engineError.message);
        this.lenses.forEach((l) => l._revealWithoutTexture && l._revealWithoutTexture());
        throw this._engineError;
      }
      if (this._capturing) {
        this._captureQueued = true;
        return;
      }
      this._capturing = true;
      const undos = [];
      const attemptCapture = async (attempt = 1, maxAttempts = 3, delayMs = 500) => {
        const testInfo = TEST_ENABLED ? {
          attempt,
          engineRequested: this._engine,
          engine: null,
          fallbackRan: false,
          fallbackReason: null,
          fallbackSuppressed: false,
          timings: {}
        } : null;
        const tCap0 = testInfo ? performance.now() : 0;
        if (testInfo) window.__glassworks.capturing = true;
        try {
          const fullW = this.snapshotTarget.scrollWidth;
          const fullH = this.snapshotTarget.scrollHeight;
          const maxTex = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) || 8192;
          const MAX_MOBILE_DIM = 4096;
          const isMobileSafari = /iPad|iPhone|iPod/.test(navigator.userAgent);
          let scale = Math.min(
            this._snapshotResolution,
            maxTex / fullW,
            maxTex / fullH
          );
          if (isMobileSafari) {
            const over = Math.max(fullW, fullH) * scale / MAX_MOBILE_DIM;
            if (over > 1) scale = scale / over;
          }
          this.scaleFactor = Math.max(0.1, scale);
          this.canvas.style.visibility = "hidden";
          undos.push(() => this.canvas.style.visibility = "visible");
          const lensElements = this.lenses.flatMap((lens) => [lens.el, lens._shadowEl]).filter(Boolean);
          const dynamicElements = (this._dynamicNodes || []).map((n) => n && n.el).filter(Boolean);
          const ignoreElementsFunc = (element) => {
            if (!element || !element.hasAttribute) return false;
            if (element === this.canvas || lensElements.includes(element)) {
              return true;
            }
            for (let i = 0; i < dynamicElements.length; i++) {
              const dyn = dynamicElements[i];
              if (element === dyn || dyn.contains && dyn.contains(element)) {
                return true;
              }
            }
            const style = window.getComputedStyle(element);
            if (style.position === "fixed") {
              return true;
            }
            return element.hasAttribute("data-liquid-ignore") || element.closest("[data-liquid-ignore]");
          };
          const tSnapCall = testInfo ? performance.now() : 0;
          let snapEngineOptions;
          try {
            const cs = window.getComputedStyle(this.snapshotTarget);
            if (cs.transform && cs.transform !== "none") snapEngineOptions = { outerTransforms: false };
          } catch (_) {
          }
          const snapCanvas = await captureToCanvas(this.snapshotTarget, {
            scale,
            ignore: ignoreElementsFunc,
            engine: this._engine,
            engineOptions: snapEngineOptions,
            allowFallback: this._allowFallback,
            validateCompleteness: true,
            onEngineFallback: (next) => {
              this._engine = next;
            },
            testInfo
          });
          if (testInfo) testInfo.timings.preMs = tSnapCall - tCap0;
          if (testInfo) {
            const gw = window.__glassworks;
            testInfo.timings.captureMs = performance.now() - tCap0;
            testInfo.engineVersion = testEngineVersion(testInfo.engine, resolveEngine(this._engine));
            testInfo.scale = scale;
            testInfo.targetWidth = fullW;
            testInfo.targetHeight = fullH;
            testInfo.width = snapCanvas ? snapCanvas.width : 0;
            testInfo.height = snapCanvas ? snapCanvas.height : 0;
            testInfo.maxTextureSize = maxTex;
            gw.captureCount++;
            gw.canvas = snapCanvas;
            gw.engine = testInfo.engine;
            gw.engineVersion = testInfo.engineVersion;
            gw.fallbackRan = testInfo.fallbackRan;
            gw.fallbackReason = testInfo.fallbackReason;
            gw.timings = testInfo.timings;
            gw.last = testInfo;
            gw.history.push(testInfo);
          }
          this._uploadTexture(snapCanvas);
          return true;
        } catch (e) {
          if (testInfo) {
            testInfo.error = String(e && e.message || e);
            testInfo.timings.captureMs = performance.now() - tCap0;
            window.__glassworks.history.push(testInfo);
            if (attempt >= maxAttempts) window.__glassworks.failed = true;
          }
          console.error("liquidGL snapshot failed on attempt " + attempt, e);
          if (attempt < maxAttempts) {
            console.log(
              `Retrying snapshot capture (${attempt + 1}/${maxAttempts})...`
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return await attemptCapture(attempt + 1, maxAttempts, delayMs);
          } else {
            console.error("liquidGL: All snapshot attempts failed.", e);
            return false;
          }
        } finally {
          for (let i = undos.length - 1; i >= 0; i--) {
            undos[i]();
          }
          this._capturing = false;
          if (this._dynamicNodes && this._dynMeta) {
            for (let i = 0; i < this._dynamicNodes.length; i++) {
              const meta = this._dynMeta.get(this._dynamicNodes[i].el);
              if (meta) meta.needsRecapture = true;
            }
          }
          if (testInfo) window.__glassworks.capturing = false;
        }
      };
      const result = await attemptCapture();
      if (this._captureQueued) {
        this._captureQueued = false;
        this.captureSnapshot();
      }
      return result;
    }
    /* ----------------------------- */
    _uploadTexture(srcCanvas) {
      if (!srcCanvas) return;
      if (!(srcCanvas instanceof HTMLCanvasElement)) {
        const tmp = document.createElement("canvas");
        tmp.width = srcCanvas.width || 0;
        tmp.height = srcCanvas.height || 0;
        if (tmp.width === 0 || tmp.height === 0) return;
        try {
          const ctx = tmp.getContext("2d");
          ctx.drawImage(srcCanvas, 0, 0);
          srcCanvas = tmp;
        } catch (e) {
          console.warn(
            "liquidGL: Unable to convert OffscreenCanvas for upload",
            e
          );
          return;
        }
      }
      if (srcCanvas.width === 0 || srcCanvas.height === 0) return;
      const maxTex = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) || 8192;
      if (srcCanvas.width > maxTex || srcCanvas.height > maxTex) {
        const cw = Math.min(srcCanvas.width, maxTex);
        const ch = Math.min(srcCanvas.height, maxTex);
        const tmp = document.createElement("canvas");
        tmp.width = cw;
        tmp.height = ch;
        tmp.getContext("2d").drawImage(srcCanvas, 0, 0, cw, ch, 0, 0, cw, ch);
        srcCanvas = tmp;
      }
      this.staticSnapshotCanvas = srcCanvas;
      const gl = this.gl;
      if (!this.texture) this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        srcCanvas
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.textureWidth = srcCanvas.width;
      this.textureHeight = srcCanvas.height;
      if (this._dynMeta && this._dynamicNodes) {
        for (let i = 0; i < this._dynamicNodes.length; i++) {
          const meta = this._dynMeta.get(this._dynamicNodes[i].el);
          if (meta) meta.prevDrawRect = null;
        }
      }
      this.render();
      if (this._pendingReveal.length) {
        this._pendingReveal.forEach((ln) => ln._reveal());
        this._pendingReveal.length = 0;
      }
    }
    /* ----------------------------- */
    addLens(element, options) {
      const lens = new liquidGLLens(this, element, options);
      this.lenses.push(lens);
      const maxZ = this._getMaxLensZ();
      if (maxZ > 0) {
        this.canvas.style.zIndex = maxZ - 1;
      }
      if (!this.texture) {
        this._pendingReveal.push(lens);
      } else {
        lens._reveal();
      }
      return lens;
    }
    /* ----------------------------- */
    render() {
      const gl = this.gl;
      if (!this.texture) return;
      if (this._isScrolling) {
        this._scrollUpdateCounter++;
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(this.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(this.u.tex, 0);
      const time = (Date.now() - this.startTime) / 1e3;
      gl.uniform1f(this.u.time, time);
      this._updateDynamicVideos();
      this._updateDynamicNodes();
      this.lenses.forEach((lens) => {
        lens.updateMetrics();
        if (lens._mirrorActive && lens._mirrorClipUpdater) {
          lens._mirrorClipUpdater();
        }
        this._renderLens(lens);
      });
      this.lenses.forEach((ln) => {
        if (ln._mirrorActive && ln._mirrorCtx) {
          const mirror = ln._mirror;
          if (mirror.width !== this.canvas.width || mirror.height !== this.canvas.height) {
            mirror.width = this.canvas.width;
            mirror.height = this.canvas.height;
          }
          ln._mirrorCtx.drawImage(this.canvas, 0, 0);
        }
      });
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.lenses.forEach((ln) => {
        if (ln._mirrorActive && ln.rectPx) {
          const { left, top, width, height } = ln.rectPx;
          const expand = 2;
          const x = Math.max(0, Math.round(left * dpr) - expand);
          const y = Math.max(
            0,
            Math.round(this.canvas.height - (top + height) * dpr) - expand
          );
          const w = Math.min(
            this.canvas.width - x,
            Math.round(width * dpr) + expand * 2
          );
          const h = Math.min(
            this.canvas.height - y,
            Math.round(height * dpr) + expand * 2
          );
          if (w > 0 && h > 0) {
            gl.enable(gl.SCISSOR_TEST);
            gl.scissor(x, y, w, h);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.disable(gl.SCISSOR_TEST);
          }
        }
      });
    }
    /* ----------------------------- */
    /* Blurs the snapshot around a lens (in texture px: lx, ly, lw, lh)
       with a Gaussian of sigma texels. Returns the blurred region as
       { tex, x, y, w, h } in texture px, or null when it cannot. */
    _frostRegion(lx, ly, lw, lh, sigma) {
      const gl = this.gl;
      if (!this._frostProgram || sigma <= 0) return null;
      const pad = Math.ceil(sigma * 3.5);
      const x = Math.max(0, Math.floor(lx - pad));
      const y = Math.max(0, Math.floor(ly - pad));
      const w = Math.min(this.textureWidth - x, Math.ceil(lw + 2 * pad + 1));
      const h = Math.min(this.textureHeight - y, Math.ceil(lh + 2 * pad + 1));
      if (w <= 0 || h <= 0) return null;
      if (this._frostSize[0] !== w || this._frostSize[1] !== h) {
        this._frostTex.forEach((t) => {
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        });
        this._frostSize = [w, h];
      }
      const stepTexels = Math.max(1, sigma / 8);
      const sigmaTaps = sigma / stepTexels;
      gl.useProgram(this._frostProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._lensQuadBuf);
      gl.enableVertexAttribArray(this._frostPosLoc);
      gl.vertexAttribPointer(this._frostPosLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1i(this._frostU.src, 0);
      gl.uniform1f(this._frostU.sigmaTaps, sigmaTaps);
      gl.viewport(0, 0, w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._frostFbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._frostTex[0], 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this._restoreLensState();
        return null;
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform4f(this._frostU.srcRect, x / this.textureWidth, y / this.textureHeight, w / this.textureWidth, h / this.textureHeight);
      gl.uniform2f(this._frostU.step, stepTexels / this.textureWidth, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._frostTex[1], 0);
      gl.bindTexture(gl.TEXTURE_2D, this._frostTex[0]);
      gl.uniform4f(this._frostU.srcRect, 0, 0, 1, 1);
      gl.uniform2f(this._frostU.step, 0, stepTexels / h);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this._restoreLensState();
      return { tex: this._frostTex[1], x, y, w, h };
    }
    _restoreLensState() {
      const gl = this.gl;
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._lensQuadBuf);
      gl.enableVertexAttribArray(this._lensPosLoc);
      gl.vertexAttribPointer(this._lensPosLoc, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(this.u.tex, 0);
    }
    /* ----------------------------- */
    _renderLens(lens) {
      const gl = this.gl;
      const rect = lens.rectPx;
      if (!rect) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      let overscrollY = 0;
      let overscrollX = 0;
      if (window.visualViewport) {
        overscrollX = window.visualViewport.offsetLeft;
        overscrollY = window.visualViewport.offsetTop;
      }
      const x = (rect.left + overscrollX) * dpr;
      const y = this.canvas.height - (rect.top + overscrollY + rect.height) * dpr;
      const w = rect.width * dpr;
      const h = rect.height * dpr;
      gl.viewport(x, y, w, h);
      gl.uniform2f(this.u.res, w, h);
      const docX = rect.left - this.snapshotTarget.getBoundingClientRect().left;
      const docY = rect.top - this.snapshotTarget.getBoundingClientRect().top;
      const lx = docX * this.scaleFactor;
      const ly = docY * this.scaleFactor;
      const lw = rect.width * this.scaleFactor;
      const lh = rect.height * this.scaleFactor;
      let frost = lens.options.frost || 0;
      const region = frost > 0 ? this._frostRegion(lx, ly, lw, lh, frost * (this.scaleFactor || 1)) : null;
      let source = this.texture, sx = 0, sy = 0, sw = this.textureWidth, sh = this.textureHeight;
      if (region) {
        source = region.tex;
        sx = region.x;
        sy = region.y;
        sw = region.w;
        sh = region.h;
        frost = 0;
      }
      gl.viewport(x, y, w, h);
      gl.bindTexture(gl.TEXTURE_2D, source);
      gl.uniform4f(this.u.bounds, (lx - sx) / sw, (ly - sy) / sh, lw / sw, lh / sh);
      gl.uniform2f(this.u.textureResolution, sw, sh);
      gl.uniform1f(this.u.refraction, lens.options.refraction);
      gl.uniform1f(this.u.bevelDepth, lens.options.bevelDepth);
      gl.uniform1f(this.u.bevelWidth, lens.options.bevelWidth);
      gl.uniform1f(this.u.frost, frost);
      gl.uniform1f(this.u.texScale, this.scaleFactor || 1);
      gl.uniform1f(this.u.dpr, dpr);
      const bend = lens.options.bend;
      gl.uniform1i(this.u.bendOn, bend ? 1 : 0);
      gl.uniform1f(this.u.bendEdge, bend && bend.edge || 0);
      gl.uniform1f(this.u.bendFalloff, bend && bend.falloff || 1);
      gl.uniform1f(this.u.bendTail, bend && bend.tail || 0);
      gl.uniform1f(this.u.bendTailFalloff, bend && bend.tailFalloff || 1);
      const dir = bend && bend.direction || [0, 0];
      gl.uniform2f(this.u.bendDir, dir[0] || 0, dir[1] || 0);
      const cap = lens.options.cap;
      gl.uniform1f(this.u.cap, typeof cap === "number" ? Math.max(0, Math.min(1, cap)) : 1);
      const glass = lens.options.glass;
      gl.uniform1i(this.u.glassOn, glass ? 1 : 0);
      if (glass) {
        gl.uniform1f(this.u.blurMix, glass.blurMix === void 0 ? 1 : glass.blurMix);
        const face = glass.face || {};
        gl.uniform1f(this.u.faceWhite, face.white === void 0 ? 1 : face.white);
        gl.uniform1f(this.u.faceBlack, face.black || 0);
        gl.uniform1f(this.u.faceSat, face.saturation === void 0 ? 1 : face.saturation);
        const fill = face.fill || [1, 1, 1, 0];
        gl.uniform4f(this.u.faceFill, fill[0], fill[1], fill[2], fill[3] || 0);
        gl.uniform1f(this.u.faceMaxLuma, face.maxLuma === void 0 ? 1 : face.maxLuma);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.u.sharp, 1);
        gl.uniform4f(this.u.sharpBounds, lx / this.textureWidth, ly / this.textureHeight, lw / this.textureWidth, lh / this.textureHeight);
      }
      gl.uniform1f(this.u.radius, lens.radiusGl);
      const spec = lens.options.specular;
      gl.uniform1f(
        this.u.specular,
        spec === true ? 1 : spec === "drift" ? -1 : Number(spec) || 0
      );
      gl.uniform1f(this.u.revealProgress, lens._revealProgress || 1);
      gl.uniform1i(this.u.revealType, lens.revealTypeIndex || 0);
      const mag = Math.max(
        1e-3,
        Math.min(
          3,
          lens.options.magnify !== void 0 ? lens.options.magnify : 1
        )
      );
      gl.uniform1f(this.u.magnify, mag);
      gl.uniform1f(this.u.tiltX, lens.tiltX || 0);
      gl.uniform1f(this.u.tiltY, lens.tiltY || 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    /* ----------------------------- */
    _createRoundedRectPath(ctx, w, h, radii) {
      ctx.beginPath();
      ctx.moveTo(radii.tl, 0);
      ctx.lineTo(w - radii.tr, 0);
      ctx.arcTo(w, 0, w, radii.tr, radii.tr);
      ctx.lineTo(w, h - radii.br);
      ctx.arcTo(w, h, w - radii.br, h, radii.br);
      ctx.lineTo(radii.bl, h);
      ctx.arcTo(0, h, 0, h - radii.bl, radii.bl);
      ctx.lineTo(0, radii.tl);
      ctx.arcTo(0, 0, radii.tl, 0, radii.tl);
      ctx.closePath();
    }
    /* ----------------------------- */
    _blitVideoToRegion(vid, dstX, dstY, drawW, drawH) {
      const gl = this.gl;
      if (!this._vBlitProgram) return false;
      try {
        gl.bindTexture(gl.TEXTURE_2D, this._vScratchTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          vid
        );
      } catch (_) {
        return false;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._vBlitFbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        this.texture,
        0
      );
      const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (fbStatus !== gl.FRAMEBUFFER_COMPLETE) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return false;
      }
      gl.viewport(dstX, dstY, drawW, drawH);
      gl.disable(gl.SCISSOR_TEST);
      gl.useProgram(this._vBlitProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._vScratchTex);
      gl.uniform1i(this._vBlitTexLoc, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._vBlitQuadBuf);
      gl.enableVertexAttribArray(this._vBlitPosLoc);
      gl.vertexAttribPointer(this._vBlitPosLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._lensQuadBuf);
      gl.enableVertexAttribArray(this._lensPosLoc);
      gl.vertexAttribPointer(this._lensPosLoc, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(this.u.tex, 0);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      return true;
    }
    /* ----------------------------- */
    _updateDynamicVideos() {
      if (this._isScrolling && this._scrollUpdateCounter % 2 !== 0) return;
      if (!this.texture || !this.staticSnapshotCanvas || !this._videoNodes.length)
        return;
      const gl = this.gl;
      const snapRect = this.snapshotTarget.getBoundingClientRect();
      const maxLensZ = this._getMaxLensZ();
      const lensRectsForVid = this.lenses.map((ln) => ln.rectPx).filter(Boolean);
      this._videoNodes.forEach((vid) => {
        if (effectiveZ(vid) >= maxLensZ) {
          return;
        }
        if (this._isIgnored(vid) || vid.readyState < 2) return;
        const rect = vid.getBoundingClientRect();
        const intersectsAnyLens = lensRectsForVid.some(
          (lr) => rect.left < lr.left + lr.width && rect.left + rect.width > lr.left && rect.top < lr.top + lr.height && rect.top + rect.height > lr.top
        );
        if (!intersectsAnyLens) return;
        const texX = (rect.left - snapRect.left) * this.scaleFactor;
        const texY = (rect.top - snapRect.top) * this.scaleFactor;
        const texW = rect.width * this.scaleFactor;
        const texH = rect.height * this.scaleFactor;
        const drawW = Math.round(texW);
        const drawH = Math.round(texH);
        if (drawW <= 0 || drawH <= 0) return;
        const drawX = Math.round(texX);
        const drawY = Math.round(texY);
        const maxW = this.textureWidth;
        const maxH = this.textureHeight;
        let dstX = drawX;
        let dstY = drawY;
        let srcX = 0, srcY = 0, updW = drawW, updH = drawH;
        if (dstX < 0) {
          srcX = -dstX;
          updW += dstX;
          dstX = 0;
        }
        if (dstY < 0) {
          srcY = -dstY;
          updH += dstY;
          dstY = 0;
        }
        if (dstX + updW > maxW) {
          updW = maxW - dstX;
        }
        if (dstY + updH > maxH) {
          updH = maxH - dstY;
        }
        if (updW <= 0 || updH <= 0) return;
        const style = window.getComputedStyle(vid);
        const scaledRadii = {
          tl: parseFloat(style.borderTopLeftRadius) * this.scaleFactor,
          tr: parseFloat(style.borderTopRightRadius) * this.scaleFactor,
          br: parseFloat(style.borderBottomRightRadius) * this.scaleFactor,
          bl: parseFloat(style.borderBottomLeftRadius) * this.scaleFactor
        };
        const hasRadius = Object.values(scaledRadii).some((r) => r > 0);
        const fitsExactly = updW === drawW && updH === drawH;
        if (!hasRadius && fitsExactly) {
          if (this._blitVideoToRegion(vid, dstX, dstY, drawW, drawH)) {
            return;
          }
        }
        if (this._tmpCanvas.width !== drawW || this._tmpCanvas.height !== drawH) {
          this._tmpCanvas.width = drawW;
          this._tmpCanvas.height = drawH;
        }
        try {
          this._tmpCtx.save();
          this._tmpCtx.clearRect(0, 0, drawW, drawH);
          if (hasRadius) {
            this._createRoundedRectPath(
              this._tmpCtx,
              drawW,
              drawH,
              scaledRadii
            );
            this._tmpCtx.clip();
            this._tmpCtx.drawImage(
              this.staticSnapshotCanvas,
              texX,
              texY,
              texW,
              texH,
              0,
              0,
              drawW,
              drawH
            );
          }
          this._tmpCtx.drawImage(vid, 0, 0, drawW, drawH);
          this._tmpCtx.restore();
        } catch (e) {
          console.warn("liquidGL: Error drawing video frame", e);
          return;
        }
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        if (updW !== drawW || updH !== drawH) {
          if (!this._videoUploadCanvas) {
            this._videoUploadCanvas = document.createElement("canvas");
            this._videoUploadCtx = this._videoUploadCanvas.getContext("2d");
          }
          if (this._videoUploadCanvas.width !== updW || this._videoUploadCanvas.height !== updH) {
            this._videoUploadCanvas.width = updW;
            this._videoUploadCanvas.height = updH;
          }
          this._videoUploadCtx.clearRect(0, 0, updW, updH);
          this._videoUploadCtx.drawImage(
            this._tmpCanvas,
            srcX,
            srcY,
            updW,
            updH,
            0,
            0,
            updW,
            updH
          );
          gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            dstX,
            dstY,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            this._videoUploadCanvas
          );
        } else {
          gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            dstX,
            dstY,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            this._tmpCanvas
          );
        }
      });
    }
    /* ----------------------------- */
    _updateDynamicNodes() {
      if (this._isScrolling && this._scrollUpdateCounter % 2 !== 0) return;
      const gl = this.gl;
      if (!this.texture || !this._dynMeta) return;
      const snapRect = this.snapshotTarget.getBoundingClientRect();
      const maxLensZ = this._getMaxLensZ();
      const lensRects = this.lenses.map((ln) => ln.rectPx).filter(Boolean);
      const rectsIntersect = (a, b) => a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height && a.top + a.height > b.top;
      if (!this._compositeCtx) {
        this._compositeCtx = document.createElement("canvas").getContext("2d");
      }
      const compositeVideos = (compositeCtx, dynamicElRect) => {
        this._videoNodes.forEach((vid) => {
          if (effectiveZ(vid) >= maxLensZ) return;
          const vidRect = vid.getBoundingClientRect();
          if (dynamicElRect.left < vidRect.right && dynamicElRect.right > vidRect.left && dynamicElRect.top < vidRect.bottom && dynamicElRect.bottom > vidRect.top) {
            const xInComposite = (vidRect.left - dynamicElRect.left) * this.scaleFactor;
            const yInComposite = (vidRect.top - dynamicElRect.top) * this.scaleFactor;
            const wInComposite = vidRect.width * this.scaleFactor;
            const hInComposite = vidRect.height * this.scaleFactor;
            compositeCtx.drawImage(
              vid,
              xInComposite,
              yInComposite,
              wInComposite,
              hInComposite
            );
          }
        });
      };
      this._dynamicNodes.forEach((node) => {
        const el = node.el;
        const meta = this._dynMeta.get(el);
        if (!meta) return;
        const allowDuringScroll = !meta.lastCapture;
        if (meta.needsRecapture && !meta._capturing && !this._capturing && (allowDuringScroll || !this._isScrolling)) {
          meta._capturing = true;
          captureToCanvas(el, {
            scale: this.scaleFactor,
            ignore: (n) => n.tagName === "CANVAS" || n.hasAttribute("data-liquid-ignore"),
            engine: this._engine,
            /* Dynamic nodes carry live transforms; the compositor re-applies
               the element's own transform, so capture it normalised. */
            engineOptions: { outerTransforms: false },
            allowFallback: this._allowFallback,
            onEngineFallback: (next) => {
              this._engine = next;
            }
          }).then((cv) => {
            if (cv.width > 0 && cv.height > 0) {
              meta.lastCapture = cv;
              meta.needsRecapture = false;
            }
          }).catch((e) => {
            console.error("liquidGL: Dynamic element capture failed.", e);
          }).finally(() => {
            meta._capturing = false;
          });
        }
        if (meta.lastCapture) {
          if (meta.prevDrawRect && !(this._workerEnabled && meta._heavyAnim)) {
            const px = Math.max(0, Math.min(meta.prevDrawRect.x, this.textureWidth));
            const py = Math.max(0, Math.min(meta.prevDrawRect.y, this.textureHeight));
            const pw = Math.max(0, Math.min(meta.prevDrawRect.w, this.textureWidth - px));
            const ph = Math.max(0, Math.min(meta.prevDrawRect.h, this.textureHeight - py));
            if (pw > 0 && ph > 0) {
              const eraseCanvas = this._compositeCtx.canvas;
              if (eraseCanvas.width !== pw || eraseCanvas.height !== ph) {
                eraseCanvas.width = pw;
                eraseCanvas.height = ph;
              }
              this._compositeCtx.drawImage(
                this.staticSnapshotCanvas,
                px,
                py,
                pw,
                ph,
                0,
                0,
                pw,
                ph
              );
              gl.bindTexture(gl.TEXTURE_2D, this.texture);
              gl.texSubImage2D(
                gl.TEXTURE_2D,
                0,
                px,
                py,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                eraseCanvas
              );
            }
          }
          const rect = el.getBoundingClientRect();
          if (effectiveZ(el) >= maxLensZ || !document.contains(el) || rect.width === 0 || rect.height === 0) {
            meta.prevDrawRect = null;
            return;
          }
          if (!lensRects.some((lr) => rectsIntersect(rect, lr))) {
            meta.prevDrawRect = null;
            return;
          }
          const texX = (rect.left - snapRect.left) * this.scaleFactor;
          const texY = (rect.top - snapRect.top) * this.scaleFactor;
          const drawW = Math.round(rect.width * this.scaleFactor);
          const drawH = Math.round(rect.height * this.scaleFactor);
          const drawX = Math.round(texX);
          const drawY = Math.round(texY);
          if (drawW <= 0 || drawH <= 0) return;
          const maxW = this.textureWidth;
          const maxH = this.textureHeight;
          let dstX = drawX;
          let dstY = drawY;
          let srcX = 0, srcY = 0, updW = drawW, updH = drawH;
          if (dstX < 0) {
            srcX = -dstX;
            updW += dstX;
            dstX = 0;
          }
          if (dstY < 0) {
            srcY = -dstY;
            updH += dstY;
            dstY = 0;
          }
          if (dstX + updW > maxW) {
            updW = maxW - dstX;
          }
          if (dstY + updH > maxH) {
            updH = maxH - dstY;
          }
          if (updW <= 0 || updH <= 0) return;
          const compositeCanvas = this._compositeCtx.canvas;
          if (compositeCanvas.width !== drawW || compositeCanvas.height !== drawH) {
            compositeCanvas.width = drawW;
            compositeCanvas.height = drawH;
          }
          this._compositeCtx.clearRect(0, 0, drawW, drawH);
          this._compositeCtx.drawImage(
            this.staticSnapshotCanvas,
            texX,
            texY,
            rect.width * this.scaleFactor,
            rect.height * this.scaleFactor,
            0,
            0,
            drawW,
            drawH
          );
          compositeVideos(this._compositeCtx, rect);
          const style = window.getComputedStyle(el);
          this._compositeCtx.save();
          this._compositeCtx.translate(drawW / 2, drawH / 2);
          if (style.transform !== "none") {
            this._compositeCtx.transform(
              ...this._parseTransform(style.transform)
            );
          }
          this._compositeCtx.translate(-drawW / 2, -drawH / 2);
          this._compositeCtx.globalAlpha = parseFloat(style.opacity) || 1;
          this._compositeCtx.drawImage(meta.lastCapture, 0, 0, drawW, drawH);
          this._compositeCtx.restore();
          gl.bindTexture(gl.TEXTURE_2D, this.texture);
          if (updW !== drawW || updH !== drawH) {
            if (!this._uploadCanvas) {
              this._uploadCanvas = document.createElement("canvas");
              this._uploadCtx = this._uploadCanvas.getContext("2d");
            }
            if (this._uploadCanvas.width !== updW || this._uploadCanvas.height !== updH) {
              this._uploadCanvas.width = updW;
              this._uploadCanvas.height = updH;
            }
            this._uploadCtx.clearRect(0, 0, updW, updH);
            this._uploadCtx.drawImage(
              compositeCanvas,
              srcX,
              srcY,
              updW,
              updH,
              0,
              0,
              updW,
              updH
            );
            gl.texSubImage2D(
              gl.TEXTURE_2D,
              0,
              dstX,
              dstY,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              this._uploadCanvas
            );
          } else {
            gl.texSubImage2D(
              gl.TEXTURE_2D,
              0,
              dstX,
              dstY,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              compositeCanvas
            );
          }
          if (this._workerEnabled && meta._heavyAnim) {
            const jobId = `${Date.now()}_${Math.random()}`;
            this._dynJobs.set(jobId, {
              x: dstX,
              y: dstY,
              w: updW,
              h: updH
            });
            Promise.all([
              createImageBitmap(
                this.staticSnapshotCanvas,
                dstX,
                dstY,
                updW,
                updH
              ),
              createImageBitmap(meta.lastCapture)
            ]).then(([snapBmp, dynBmp]) => {
              this._dynWorker.postMessage(
                {
                  id: jobId,
                  width: updW,
                  height: updH,
                  snap: snapBmp,
                  dyn: dynBmp
                },
                [snapBmp, dynBmp]
              );
            });
            meta.prevDrawRect = { x: dstX, y: dstY, w: updW, h: updH };
            return;
          }
          meta.prevDrawRect = { x: dstX, y: dstY, w: updW, h: updH };
        }
      });
    }
    _parseTransform(transform) {
      if (transform === "none") return [1, 0, 0, 1, 0, 0];
      const matrixMatch = transform.match(/matrix\((.+)\)/);
      if (matrixMatch) {
        const values = matrixMatch[1].split(",").map(parseFloat);
        return values;
      }
      const matrix3dMatch = transform.match(/matrix3d\((.+)\)/);
      if (matrix3dMatch) {
        const v = matrix3dMatch[1].split(",").map(parseFloat);
        return [v[0], v[1], v[4], v[5], v[12], v[13]];
      }
      return [1, 0, 0, 1, 0, 0];
    }
    /* ----------------------------- */
    _getMaxLensZ() {
      let maxZ = 0;
      this.lenses.forEach((ln) => {
        const z = effectiveZ(ln.el);
        if (z > maxZ) maxZ = z;
      });
      return maxZ;
    }
    /* ----------------------------- */
    addDynamicElement(el) {
      if (!el) return;
      if (typeof el === "string") {
        this.snapshotTarget.querySelectorAll(el).forEach((n) => this.addDynamicElement(n));
        return;
      }
      if (NodeList.prototype.isPrototypeOf(el) || Array.isArray(el)) {
        Array.from(el).forEach((n) => this.addDynamicElement(n));
        return;
      }
      if (!el.getBoundingClientRect) return;
      if (el.closest && el.closest("[data-liquid-ignore]")) return;
      if (this._dynamicNodes.some((n) => n.el === el)) return;
      this._dynamicNodes = this._dynamicNodes.filter((n) => !el.contains(n.el));
      const meta = {
        _capturing: false,
        prevDrawRect: null,
        lastCapture: null,
        needsRecapture: true,
        hoverClassName: null,
        _animating: false,
        _rafId: null,
        _lastCaptureTs: 0,
        _heavyAnim: false
      };
      this._dynMeta.set(el, meta);
      if (typeof IntersectionObserver !== "undefined") {
        const io = new IntersectionObserver(
          (entries) => {
            const m = this._dynMeta.get(el);
            if (!m) return;
            for (let i = 0; i < entries.length; i++) {
              if (entries[i].isIntersecting) {
                m.needsRecapture = true;
                requestAnimationFrame(() => this.render());
                break;
              }
            }
          },
          { rootMargin: "200px" }
        );
        io.observe(el);
        meta._viewportObserver = io;
      }
      const setDirty = () => {
        const m = this._dynMeta.get(el);
        if (m && !m.needsRecapture) {
          m.needsRecapture = true;
          requestAnimationFrame(() => this.render());
        }
      };
      const findAppliedHoverStyles = (element) => {
        let cssText = "";
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (!rule.selectorText || !rule.selectorText.includes(":hover")) {
                continue;
              }
              const baseSelector = rule.selectorText.split(":hover")[0];
              if (element.matches(baseSelector)) {
                cssText += rule.style.cssText;
              }
            }
          } catch (e) {
          }
        }
        return cssText;
      };
      const handleLeave = () => {
        const m = this._dynMeta.get(el);
        if (!m || !m.hoverClassName) return;
        el.classList.remove(m.hoverClassName);
        for (let i = this._dynamicStyleSheet.cssRules.length - 1; i >= 0; i--) {
          const rule = this._dynamicStyleSheet.cssRules[i];
          if (rule.selectorText === `.${m.hoverClassName}`) {
            this._dynamicStyleSheet.deleteRule(i);
            break;
          }
        }
        m.hoverClassName = null;
        setDirty();
      };
      el.addEventListener(
        "mouseenter",
        () => {
          const m = this._dynMeta.get(el);
          if (!m) return;
          const hoverCss = findAppliedHoverStyles(el);
          if (hoverCss) {
            const className = `lqgl-h-${Math.random().toString(36).substr(2, 9)}`;
            const rule = `.${className} { ${hoverCss} }`;
            try {
              this._dynamicStyleSheet.insertRule(
                rule,
                this._dynamicStyleSheet.cssRules.length
              );
              m.hoverClassName = className;
              el.classList.add(className);
            } catch (e) {
              console.error("liquidGL: Failed to insert hover style rule.", e);
            }
          }
          setDirty();
        },
        { passive: true }
      );
      el.addEventListener("mouseleave", handleLeave, { passive: true });
      el.addEventListener("transitionend", setDirty, { passive: true });
      const startRealtime = () => {
        const m = this._dynMeta.get(el);
        if (!m || m._animating) return;
        m._animating = true;
        m._heavyAnim = false;
        const step = (ts) => {
          const meta2 = this._dynMeta.get(el);
          if (!meta2 || !meta2._animating) return;
          if (meta2._heavyAnim && !meta2._capturing && ts - meta2._lastCaptureTs > 33) {
            meta2._lastCaptureTs = ts;
            meta2.needsRecapture = true;
          }
          if (meta2._heavyAnim) {
            meta2._rafId = requestAnimationFrame(step);
          } else {
            meta2._rafId = null;
          }
        };
        m._rafId = requestAnimationFrame(step);
      };
      const trackProperty = (prop) => {
        const m = this._dynMeta.get(el);
        if (!m) return;
        const low = (prop || "").toLowerCase();
        if (!(low.includes("transform") || low.includes("opacity"))) {
          const wasHeavy = m._heavyAnim;
          m._heavyAnim = true;
          if (m._animating && !wasHeavy && !m._rafId) {
            m._animating = false;
            startRealtime();
          }
        }
      };
      const transitionRunHandler = (e) => {
        trackProperty(e.propertyName);
        startRealtime();
      };
      el.addEventListener("transitionrun", transitionRunHandler, {
        passive: true
      });
      el.addEventListener("transitionstart", transitionRunHandler, {
        passive: true
      });
      el.addEventListener(
        "animationstart",
        () => {
          const m = this._dynMeta.get(el);
          if (m) m._heavyAnim = true;
          startRealtime();
        },
        { passive: true }
      );
      el.addEventListener(
        "animationiteration",
        () => {
          const m = this._dynMeta.get(el);
          if (m) {
            m._heavyAnim = true;
            if (!m._animating) startRealtime();
          }
        },
        { passive: true }
      );
      const stopRealtime = () => {
        const m = this._dynMeta.get(el);
        if (!m || !m._animating) return;
        m._animating = false;
        if (m._rafId) {
          cancelAnimationFrame(m._rafId);
          m._rafId = null;
        }
        m._heavyAnim = false;
        setDirty();
      };
      el.addEventListener("transitionend", stopRealtime, { passive: true });
      el.addEventListener("transitioncancel", stopRealtime, { passive: true });
      el.addEventListener("animationend", stopRealtime, { passive: true });
      el.addEventListener("animationcancel", stopRealtime, { passive: true });
      if (typeof MutationObserver !== "undefined") {
        const removalObserver = new MutationObserver(() => {
          if (!document.contains(el)) {
            handleLeave();
            removalObserver.disconnect();
            this._dynamicNodes = this._dynamicNodes.filter((n) => n.el !== el);
            this._dynMeta.delete(el);
          }
        });
        removalObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
      this._dynamicNodes.push({ el });
    }
    /* ----------------------------- */
    _isIgnored(el) {
      return !!(el && typeof el.closest === "function" && el.closest("[data-liquid-ignore]"));
    }
  };

  // src/api.js
  function glassworks(userOptions = {}) {
    const defaults = {
      target: ".liquidGL",
      snapshot: "body",
      resolution: 2,
      refraction: 0.01,
      bevelDepth: 0.08,
      bevelWidth: 0.15,
      frost: 0,
      shadow: true,
      specular: true,
      reveal: "fade",
      tilt: false,
      tiltFactor: 5,
      magnify: 1,
      bend: null,
      cap: 1,
      glass: null,
      engine: "snapdom",
      on: {}
    };
    const options = { ...defaults, ...userOptions };
    if (typeof window.__liquidGLNoWebGL__ === "undefined") {
      const testCanvas = document.createElement("canvas");
      const testCtx = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      window.__liquidGLNoWebGL__ = !testCtx;
    }
    const noWebGL = window.__liquidGLNoWebGL__;
    if (noWebGL) {
      console.warn(
        "liquidGL: WebGL not available \u2013 falling back to CSS backdrop-filter."
      );
      const fallbackNodes = document.querySelectorAll(options.target);
      fallbackNodes.forEach((node) => {
        Object.assign(node.style, {
          background: "rgba(255, 255, 255, 0.07)",
          backdropFilter: "blur(12px)",
          webkitBackdropFilter: "blur(12px)"
        });
      });
      return fallbackNodes.length === 1 ? fallbackNodes[0] : Array.from(fallbackNodes);
    }
    let renderer = window.__liquidGLRenderer__;
    if (!renderer) {
      renderer = new liquidGLRenderer(
        options.snapshot,
        options.resolution,
        options.engine
      );
      window.__liquidGLRenderer__ = renderer;
    }
    const nodeList = document.querySelectorAll(options.target);
    if (!nodeList || nodeList.length === 0) {
      console.warn(
        `liquidGL: Target element(s) '${options.target}' not found.`
      );
      return;
    }
    const instances = Array.from(nodeList).map(
      (el) => renderer.addLens(el, options)
    );
    if (!renderer._rafId && !renderer.useExternalTicker) {
      const loop = () => {
        renderer.render();
        renderer._rafId = requestAnimationFrame(loop);
      };
      renderer._rafId = requestAnimationFrame(loop);
    }
    return instances.length === 1 ? instances[0] : instances;
  }
  glassworks.registerDynamic = function(elements) {
    const renderer = window.__liquidGLRenderer__;
    if (!renderer || !renderer.addDynamicElement) return;
    renderer.addDynamicElement(elements);
    if (!renderer.captureSnapshot) return;
    if (renderer._captureRequested) return;
    renderer._captureRequested = true;
    Promise.resolve().then(() => {
      renderer._captureRequested = false;
      renderer.captureSnapshot();
    });
  };
  glassworks.syncWith = function(config = {}) {
    const renderer = window.__liquidGLRenderer__;
    if (!renderer) {
      console.warn(
        "liquidGL: Please initialize liquidGL *before* calling syncWith()."
      );
      return;
    }
    const G = window.gsap;
    const L = window.Lenis;
    const LS = window.LocomotiveScroll;
    const ST = G ? G.ScrollTrigger : null;
    let lenis = config.lenis;
    let loco = config.locomotiveScroll;
    const useGSAP = config.gsap !== false && G && ST;
    if (config.lenis !== false && L && !lenis) {
      lenis = new L();
    }
    if (config.locomotiveScroll !== false && LS && !loco && document.querySelector("[data-scroll-container]")) {
      loco = new LS({
        el: document.querySelector("[data-scroll-container]"),
        smooth: true
      });
    }
    if (useGSAP && ST) {
      if (loco) {
        loco.on("scroll", ST.update);
        ST.scrollerProxy(loco.el, {
          scrollTop(value) {
            return arguments.length ? loco.scrollTo(value, { duration: 0, disableLerp: true }) : loco.scroll.instance.scroll.y;
          },
          getBoundingClientRect() {
            return {
              top: 0,
              left: 0,
              width: window.innerWidth,
              height: window.innerHeight
            };
          },
          pinType: loco.el.style.transform ? "transform" : "fixed"
        });
        ST.addEventListener("refresh", () => loco.update());
        ST.refresh();
      } else if (lenis) {
        lenis.on("scroll", ST.update);
      }
    }
    if (renderer._rafId) {
      cancelAnimationFrame(renderer._rafId);
      renderer._rafId = null;
    }
    renderer.useExternalTicker = true;
    if (useGSAP) {
      G.ticker.add((time) => {
        if (lenis) lenis.raf(time * 1e3);
        renderer.render();
      });
      G.ticker.lagSmoothing(0);
    } else {
      const loop = (time) => {
        if (lenis) lenis.raf(time);
        if (loco) loco.update();
        renderer.render();
        renderer._rafId = requestAnimationFrame(loop);
      };
      renderer._rafId = requestAnimationFrame(loop);
    }
    return { lenis, locomotiveScroll: loco };
  };

  // src/index.js
  var version = true ? "2.0.0" : "0.0.0-dev";
  glassworks.registerEngine = registerEngine;
  glassworks.getEngine = getRegisteredEngine;
  glassworks.createSnapdomEngine = createSnapdomEngine;
  glassworks.createHtml2canvasEngine = createHtml2canvasEngine;
  glassworks.resolveEngine = resolveEngine;
  glassworks.capture = captureToCanvas;
  glassworks.version = version;
  var index_default = glassworks;

  // src/umd-entry.js
  if (typeof window !== "undefined") {
    for (const k of Object.keys(index_exports)) {
      if (k !== "default" && k !== "glassworks") index_default[k] = index_exports[k];
    }
    window.glassworks = index_default;
    window.liquidGL = index_default;
  }
  var umd_entry_default = index_default;
})();
