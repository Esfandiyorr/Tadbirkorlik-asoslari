/* Nonvisual compatibility adapter. Existing assessment/game rules stay in this
   isolated document; all visible content is rendered by the native application. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  if (parent === window || params.get('sqNative') !== '1') return;
  var mode = params.get('sqEmbed'),
    ids = new WeakMap(),
    nodes = new Map(),
    serial = 0;
  var last = '',
    pending = null,
    virtualFocus = null,
    currentAction = null,
    confirmation = null;
  var pointerTarget = null,
    elementFromPoint = document.elementFromPoint.bind(document);
  document.elementFromPoint = function (x, y) {
    return pointerTarget || elementFromPoint(x, y);
  };
  var hostFocused = true,
    clipboardRequests = new Map(),
    clipboardSerial = 0;
  document.hasFocus = function () {
    return hostFocused;
  };
  try {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: function (text) {
          return new Promise(function (resolve, reject) {
            var id = 'clip' + ++clipboardSerial;
            clipboardRequests.set(id, { resolve: resolve, reject: reject });
            emit('clipboard', { id: id, text: String(text).slice(0, 100000) });
            setTimeout(function () {
              if (clipboardRequests.has(id)) {
                clipboardRequests.delete(id);
                reject(new Error('Clipboard unavailable'));
              }
            }, 10000);
          });
        },
      },
    });
  } catch (_) {}
  var layoutKeys = [
    'width',
    'height',
    'min-width',
    'max-width',
    'min-height',
    'max-height',
    'display',
    'grid-template-columns',
    'grid-template-rows',
    'grid-auto-rows',
    'grid-auto-columns',
    'grid-column',
    'grid-row',
    'gap',
    'aspect-ratio',
    'flex',
    'flex-basis',
    'flex-grow',
    'flex-wrap',
    'order',
    'position',
    'top',
    'left',
    'right',
    'bottom',
  ];
  function emit(type, data) {
    parent.postMessage(
      Object.assign({ source: 'tadbirkorlik-native', type: type }, data || {}),
      location.origin,
    );
  }
  function visible(node) {
    return node && getComputedStyle(node).display !== 'none';
  }
  function root() {
    var protectedGate = document.querySelector('#rtRelog .rt-box, #rtAcc .rt-box');
    if (protectedGate && visible(protectedGate.parentElement)) return protectedGate;
    var overlay = document.querySelector('#rtOv .rt-box');
    if (overlay && visible(document.getElementById('rtOv'))) return overlay;
    var gate = document.querySelector('#rtMaint .rt-box, #rtWait .rt-box');
    if (gate && visible(gate.parentElement)) return gate;
    if (mode === 'login') return document.querySelector('#rtGate .rt-auth-content');
    if (mode === 'lesson') return document.querySelector('.slide.active .inner');
    if (mode === 'chat') return document.getElementById('chPanel');
    if (mode === 'arena') {
      var modals = Array.from(document.querySelectorAll('.pzs-big,.pzs-ov,.gp-ov,#gpick')).filter(
        visible,
      );
      return modals[modals.length - 1] || document.getElementById('app');
    }
    return overlay;
  }
  function key(node) {
    if (!ids.has(node)) ids.set(node, 'n' + ++serial);
    var id = ids.get(node);
    nodes.set(id, node);
    return id;
  }
  function asset(value) {
    try {
      var u = new URL(value, location.href);
      return /^(https?:|blob:|data:)$/.test(u.protocol) ? u.href : '';
    } catch (_) {
      return '';
    }
  }
  function serialize(source) {
    var assets = {},
      assetIds = new Map();
    var copy = source.cloneNode(true),
      from = [source].concat(Array.from(source.querySelectorAll('*')));
    var to = [copy].concat(Array.from(copy.querySelectorAll('*')));
    from.forEach(function (node, i) {
      var out = to[i];
      if (!out || !out.tagName) return;
      out.setAttribute('data-native-id', key(node));
      Array.from(out.attributes).forEach(function (attr) {
        if (
          /^on/i.test(attr.name) ||
          ['style', 'srcdoc', 'autofocus', 'formaction'].includes(attr.name)
        )
          out.removeAttribute(attr.name);
      });
      var computed = getComputedStyle(node);
      if (
        computed.display === 'none' ||
        computed.visibility === 'hidden' ||
        computed.opacity === '0' ||
        node.hidden
      )
        out.setAttribute('hidden', '');
      else out.removeAttribute('hidden');
      var layout = {};
      layoutKeys.forEach(function (property) {
        var value = node.style.getPropertyValue(property);
        if (value && !/url|expression|fixed|sticky/i.test(value) && value.length < 160)
          layout[property] = value;
      });
      if (mode === 'arena' && !node.children.length) {
        var background = getComputedStyle(node).backgroundColor;
        if (/^rgba?\(/.test(background) && !/rgba\(0, 0, 0, 0\)/.test(background))
          layout['background-color'] = background;
      }
      if (mode === 'arena') {
        var image = /^url\(["']?(.*?)["']?\)$/.exec(computed.backgroundImage);
        if (image) {
          var url = asset(image[1]);
          if (url) {
            if (!assetIds.has(url)) {
              var assetId = 'a' + assetIds.size;
              assetIds.set(url, assetId);
              assets[assetId] = url;
            }
            out.setAttribute('data-native-background', assetIds.get(url));
            layout['background-position'] = computed.backgroundPosition;
            layout['background-size'] = computed.backgroundSize;
            layout['background-repeat'] = computed.backgroundRepeat;
            if (computed.aspectRatio !== 'auto') layout['aspect-ratio'] = computed.aspectRatio;
            if (computed.opacity !== '1') layout['opacity'] = computed.opacity;
          }
        }
        if (node.closest('#dbd,#cbd')) {
          var color = computed.backgroundColor;
          if (color === 'rgb(160, 106, 63)') color = '#b59bcf';
          if (color === 'rgb(240, 217, 181)') color = '#f4ecff';
          if (color !== 'rgba(0, 0, 0, 0)') layout['background-color'] = color;
          layout['color'] = computed.color;
          layout['font-size'] = computed.fontSize;
          if (node.style.boxShadow) layout['box-shadow'] = node.style.boxShadow;
          if (node.style.textShadow) layout['text-shadow'] = node.style.textShadow;
          if (node.tagName === 'SPAN' && node.style.borderRadius === '50%')
            out.classList.add(
              'native-piece',
              computed.backgroundImage.includes('255, 255, 255')
                ? 'native-piece-white'
                : 'native-piece-black',
            );
        }
      }
      if (Object.keys(layout).length)
        out.setAttribute('data-native-layout', JSON.stringify(layout));
      if (node.tagName === 'INPUT') {
        if (['password', 'file'].includes(node.type)) out.removeAttribute('value');
        else out.setAttribute('value', node.value);
        if (node.checked) out.setAttribute('checked', '');
        else out.removeAttribute('checked');
      }
      if (node.tagName === 'TEXTAREA') out.textContent = node.value;
      if (node.tagName === 'OPTION') {
        if (node.selected) out.setAttribute('selected', '');
        else out.removeAttribute('selected');
      }
      if (node.matches('.qt-start,.xw-start,.ms-start,.xw-again,.ms-again')) {
        var generated = getComputedStyle(node, '::after').content;
        if (generated && !['none', 'normal', '""'].includes(generated)) {
          var note = document.createElement('p');
          note.className = 'native-reading-note';
          try {
            note.textContent = JSON.parse(generated);
          } catch (_) {
            note.textContent = generated.replace(/^['"]|['"]$/g, '');
          }
          out.appendChild(note);
        }
      }
      if (['IMG', 'VIDEO', 'SOURCE', 'IFRAME', 'AUDIO'].includes(node.tagName)) {
        if (node.getAttribute('src')) out.setAttribute('src', asset(node.getAttribute('src')));
        if (node.getAttribute('poster'))
          out.setAttribute('poster', asset(node.getAttribute('poster')));
      }
      if (node.tagName === 'A' && node.getAttribute('href')) {
        var href = node.getAttribute('href'),
          topic = /(?:^|\/)mavzu-(\d+)\.html/.exec(href);
        if (topic) out.setAttribute('href', '/#lesson/m' + topic[1]);
        else if (href[0] !== '#') out.setAttribute('href', asset(href));
      }
      if (node.tagName === 'CANVAS') {
        try {
          var image = document.createElement('img');
          image.src = node.toDataURL();
          image.setAttribute('data-native-id', key(node));
          image.alt = 'O‘yin maydoni';
          image.width = node.width;
          image.height = node.height;
          out.replaceWith(image);
        } catch (_) {}
      }
      if (node.classList.contains('terdu-logo')) {
        var logo = document.createElement('img');
        logo.src = new URL('logo_tersu.png', location.href).href;
        logo.alt = 'TerDU';
        logo.width = 64;
        logo.height = 64;
        logo.className = 'native-terdu';
        out.replaceWith(logo);
      }
    });
    copy
      .querySelectorAll(
        'script,style,link,meta,object,embed,.topbar,.navbar,.rt-auth-welcome,#rtAuthTitle,#rtGateTc,.rt-wm,.ms-wm',
      )
      .forEach(function (n) {
        n.remove();
      });
    return { html: copy.outerHTML, assets: assets };
  }
  function snapshot(force) {
    pending = null;
    var source = root();
    if (!source) return;
    var payload = serialize(source),
      html = payload.html,
      index = Math.max(0, parseInt(document.getElementById('cur')?.textContent || '1', 10) - 1);
    var signature = index + '|' + html + '|' + JSON.stringify(payload.assets);
    if (force || signature !== last) {
      last = signature;
      emit('render', {
        html: html,
        assets: payload.assets,
        index: index,
        title: document.querySelector('.slide.active')?.dataset.title || '',
      });
    }
    nodes.forEach(function (node, id) {
      if (!node.isConnected) nodes.delete(id);
    });
  }
  function schedule() {
    if (!pending)
      pending = setTimeout(function () {
        snapshot(false);
      }, 100);
  }
  function dialog(kind, text, value) {
    if (confirmation && confirmation.kind === kind) {
      var answer = confirmation.answer;
      confirmation = null;
      return answer;
    }
    emit('dialog', {
      kind: kind,
      text: String(text).slice(0, 4000),
      value: value || '',
      action: currentAction,
    });
    return kind === 'confirm' ? false : null;
  }
  window.confirm = function (text) {
    return dialog('confirm', text);
  };
  window.prompt = function (text, value) {
    return dialog('prompt', text, value);
  };
  window.alert = function (text) {
    emit('notice', { text: String(text).slice(0, 4000) });
  };
  Element.prototype.scrollIntoView = function (options) {
    if (root()?.contains(this)) emit('scroll', { id: key(this), options: options || {} });
  };
  var oldFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function () {
    if (!root()?.contains(this)) return;
    virtualFocus = this;
    emit('focus', { id: key(this), start: this.selectionStart, end: this.selectionEnd });
  };
  try {
    Object.defineProperty(document, 'activeElement', {
      configurable: true,
      get: function () {
        return virtualFocus || document.body;
      },
    });
  } catch (_) {
    HTMLElement.prototype.focus = oldFocus;
  }
  var oldClick = HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click = function () {
    if (this.type === 'file' && root()?.contains(this))
      emit('file', { id: key(this), accept: this.accept, multiple: this.multiple });
    else oldClick.call(this);
  };
  window.addEventListener('message', function (event) {
    if (
      event.origin !== location.origin ||
      event.source !== parent ||
      event.data?.source !== 'tadbirkorlik-native-parent'
    )
      return;
    var data = event.data;
    if (data.type === 'view-focus') {
      hostFocused = !!data.focused;
      window.dispatchEvent(new Event(hostFocused ? 'focus' : 'blur'));
      return;
    }
    if (data.type === 'clipboard-result') {
      var request = clipboardRequests.get(data.id);
      if (!request) return;
      clipboardRequests.delete(data.id);
      if (data.ok) request.resolve();
      else request.reject(new Error('Clipboard unavailable'));
      return;
    }
    if (data.type === 'snapshot') {
      snapshot(true);
      return;
    }
    if (data.type === 'language') {
      var language = data.lang === 'en' ? 'en' : 'uz';
      if (document.documentElement.lang !== language) document.getElementById('btnLang')?.click();
      schedule();
      return;
    }
    if (data.type === 'activity') {
      window.dispatchEvent(new Event('pointerdown'));
      return;
    }
    if (data.type === 'dialog-result') {
      if (!data.action || !['confirm', 'prompt'].includes(data.kind)) return;
      confirmation = { kind: data.kind, answer: data.answer };
      data = data.action;
    }
    if (data.type !== 'event' || typeof data.id !== 'string') return;
    var target = nodes.get(data.id),
      approved = root();
    if (!target || !target.isConnected || !approved?.contains(target)) return;
    if (target.disabled) return;
    currentAction = data;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      if (typeof data.value === 'string' && data.value.length <= 200000 && target.type !== 'file')
        target.value = data.value;
      if (typeof data.checked === 'boolean') target.checked = data.checked;
      if (target.type === 'file' && Array.isArray(data.files) && data.files.length <= 5) {
        var transfer = new DataTransfer();
        data.files.forEach(function (file) {
          if (file instanceof File && file.size <= 32 * 1024 * 1024) transfer.items.add(file);
        });
        target.files = transfer.files;
      }
    }
    if (data.event === 'click')
      target.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          detail: Number(data.detail) || 0,
          ctrlKey: !!data.ctrlKey,
          metaKey: !!data.metaKey,
          shiftKey: !!data.shiftKey,
          altKey: !!data.altKey,
        }),
      );
    else if (
      [
        'input',
        'change',
        'focus',
        'keydown',
        'keyup',
        'pointerdown',
        'pointerup',
        'pointermove',
        'mousedown',
        'mouseup',
        'mousemove',
        'submit',
      ].includes(data.event)
    ) {
      if (data.event === 'focus') virtualFocus = target;
      var options = {
        bubbles: true,
        cancelable: true,
        key: String(data.key || '').slice(0, 40),
        code: String(data.code || '').slice(0, 40),
        ctrlKey: !!data.ctrlKey,
        metaKey: !!data.metaKey,
        keyCode: Number(data.keyCode) || 0,
        which: Number(data.keyCode) || 0,
        pointerType: ['mouse', 'touch', 'pen'].includes(data.pointerType)
          ? data.pointerType
          : 'mouse',
        pointerId: Number(data.pointerId) || 1,
        shiftKey: !!data.shiftKey,
        altKey: !!data.altKey,
        button: Number(data.button) || 0,
      };
      if (/^(pointer|mouse)/.test(data.event)) {
        var rect = target.getBoundingClientRect();
        options.clientX = rect.left + Math.min(1, Math.max(0, Number(data.x) || 0)) * rect.width;
        options.clientY = rect.top + Math.min(1, Math.max(0, Number(data.y) || 0)) * rect.height;
      }
      var Constructor = /^key/.test(data.event)
        ? KeyboardEvent
        : /^pointer/.test(data.event)
          ? PointerEvent
          : /^mouse/.test(data.event)
            ? MouseEvent
            : Event;
      pointerTarget = /^(pointer|mouse)/.test(data.event) ? target : null;
      try {
        target.dispatchEvent(new Constructor(data.event, options));
      } finally {
        pointerTarget = null;
      }
    }
    currentAction = null;
    schedule();
  });
  function ready() {
    new MutationObserver(schedule).observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
    document.addEventListener('load', schedule, true);
    setInterval(schedule, 1000);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
