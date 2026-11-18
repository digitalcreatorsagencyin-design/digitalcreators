/* Digital Creators — shared logic for the four sample websites.
   Reads window.DEMO_CFG (set in each page). No dependencies. */
(function () {
  'use strict';
  var C = window.DEMO_CFG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
  function mins(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function fmt(m) {
    var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap;
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function wa(msg) { return 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(msg); }
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  /* ---------- contact links ---------- */
  $$('[data-wa]').forEach(function (a) {
    a.setAttribute('href', wa(a.getAttribute('data-wa') || C.greeting)); a.target = '_blank'; a.rel = 'noopener';
  });
  $$('[data-ig]').forEach(function (a) { a.href = C.instagram; a.target = '_blank'; a.rel = 'noopener'; });
  $$('[data-fb]').forEach(function (a) { a.href = C.facebook; a.target = '_blank'; a.rel = 'noopener'; });
  $$('[data-map]').forEach(function (a) { a.href = C.map; a.target = '_blank'; a.rel = 'noopener'; });
  $$('[data-call]').forEach(function (a) { a.href = 'tel:+' + C.whatsapp; });
  $$('[data-scroll]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = $(a.getAttribute('data-scroll')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  /* ---------- hours: open badge + timetable ---------- */
  var H = C.hours || {};
  function status() {
    var now = new Date(), d = now.getDay(), m = now.getHours() * 60 + now.getMinutes(), h = H[d];
    if (h && m >= mins(h[0]) && m < mins(h[1])) return { open: true, text: 'Open now · closes ' + fmt(mins(h[1])) };
    if (h && m < mins(h[0])) return { open: false, text: 'Closed · opens today ' + fmt(mins(h[0])) };
    for (var i = 1; i <= 7; i++) {
      var nd = (d + i) % 7, nh = H[nd];
      if (nh) return { open: false, text: 'Closed · opens ' + (i === 1 ? 'tomorrow' : DAYS[nd]) + ' ' + fmt(mins(nh[0])) };
    }
    return { open: false, text: 'Closed' };
  }
  var badge = $('#open-badge');
  if (badge) {
    var st = status(); badge.textContent = st.text; badge.classList.add(st.open ? 'open' : 'closed');
  }
  var tt = $('#timetable');
  if (tt) {
    var today = new Date().getDay(), order = [1, 2, 3, 4, 5, 6, 0];
    tt.innerHTML = order.map(function (d) {
      var h = H[d];
      return '<tr class="' + (d === today ? 'today' : '') + (h ? '' : ' closed') + '"><td>' + DAYS[d] + (d === today ? ' · Today' : '') + '</td><td>' + (h ? fmt(mins(h[0])) + ' – ' + fmt(mins(h[1])) : 'Closed') + '</td></tr>';
    }).join('');
  }

  /* ---------- booking widget ---------- */
  var bookS = $('#book-services'), bookD = $('#book-dates'), bookT = $('#book-slots'), form = $('#book-form');
  if (form && bookD && bookT) {
    var sel = { services: [], date: null, time: null };
    var multi = !!C.multiService;
    var svcs = [];
    if (C.options) { svcs = C.options.map(function (o) { return { name: o, price: '' }; }); }
    else { svcs = $$('.svc').map(function (el) { return { name: el.getAttribute('data-service'), price: el.getAttribute('data-price') || '' }; }); }

    function summary() {
      var el = $('#book-summary'); if (!el) return;
      var parts = [];
      if (sel.services.length) parts.push('<b>' + (C.serviceLabel || 'Service') + ':</b> ' + esc(sel.services.join(', ')));
      if (sel.date) parts.push('<b>Day:</b> ' + esc(sel.date.label));
      if (sel.time) parts.push('<b>Time:</b> ' + esc(sel.time));
      el.innerHTML = parts.join('<br>');
      var total = 0, hasP = false;
      sel.services.forEach(function (n) { var s = svcs.filter(function (x) { return x.name === n; })[0]; if (s && s.price) { hasP = true; total += +s.price.replace(/[^\d]/g, ''); } });
      if (hasP) el.innerHTML += '<br><b>Estimated total:</b> ' + inr(total);
    }
    function paintServices() {
      if (!bookS) return;
      bookS.innerHTML = '';
      svcs.forEach(function (s) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (sel.services.indexOf(s.name) > -1 ? ' on' : '');
        b.innerHTML = esc(s.name) + (s.price ? ' <small>' + esc(s.price) + '</small>' : '');
        b.onclick = function () { toggleService(s.name); };
        bookS.appendChild(b);
      });
      $$('.svc').forEach(function (el) { el.classList.toggle('sel', sel.services.indexOf(el.getAttribute('data-service')) > -1); });
    }
    function toggleService(n) {
      var i = sel.services.indexOf(n);
      if (multi) { if (i > -1) sel.services.splice(i, 1); else sel.services.push(n); }
      else sel.services = i > -1 ? [] : [n];
      paintServices(); summary();
    }
    $$('.svc').forEach(function (el) {
      var btn = $('button', el); if (!btn) return;
      btn.addEventListener('click', function () {
        var n = el.getAttribute('data-service');
        if (sel.services.indexOf(n) < 0) toggleService(n);
        toast('Added: ' + n);
        if (!multi) { var bk = $('#book'); if (bk) bk.scrollIntoView({ behavior: 'smooth' }); }
      });
    });

    var dates = [], now = new Date();
    for (var i = 0; i < 8; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      dates.push({ d: d, dow: d.getDay(), label: (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : SHORT[d.getDay()]) + ' ' + d.getDate() + ' ' + MON[d.getMonth()] });
    }
    function slotsFor(dt) {
      var h = H[dt.dow]; if (!h) return [];
      var step = C.slotMinutes || 30, out = [], o = mins(h[0]), c = mins(h[1]);
      var nowM = new Date().getHours() * 60 + new Date().getMinutes(), isToday = dt.d.toDateString() === new Date().toDateString();
      for (var m = o; m + step <= c; m += step) { if (isToday && m < nowM + 30) continue; out.push(m); }
      return out;
    }
    function paintDates() {
      bookD.innerHTML = '';
      dates.forEach(function (dt) {
        var has = slotsFor(dt).length > 0;
        var b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (sel.date === dt ? ' on' : ''); b.textContent = dt.label; b.disabled = !has;
        b.onclick = function () { sel.date = dt; sel.time = null; paintDates(); paintSlots(); summary(); };
        bookD.appendChild(b);
      });
    }
    function paintSlots() {
      bookT.innerHTML = '';
      if (!sel.date) { bookT.innerHTML = '<span class="fine" style="margin:0">Choose a day first.</span>'; return; }
      slotsFor(sel.date).forEach(function (m) {
        var t = fmt(m), b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (sel.time === t ? ' on' : ''); b.textContent = t;
        b.onclick = function () { sel.time = t; paintSlots(); summary(); };
        bookT.appendChild(b);
      });
    }
    paintServices(); paintDates(); paintSlots();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('#form-err'), name = form.elements.name.value.trim(), phone = form.elements.phone.value.replace(/\D/g, '');
      var problem = '';
      if (!sel.services.length) problem = 'Please choose ' + (C.serviceLabel ? 'a ' + C.serviceLabel.toLowerCase() : 'a service') + '.';
      else if (!sel.date) problem = 'Please choose a day.';
      else if (!sel.time) problem = 'Please choose a time.';
      else if (!name) problem = 'Please enter your name.';
      else if (phone.length < 10) problem = 'Please enter a valid 10-digit mobile number.';
      if (problem) { err.textContent = problem; return; }
      err.textContent = '';
      var lines = [C.bookingIntro, '', (C.serviceLabel || 'Service') + ': ' + sel.services.join(', '), 'Day: ' + sel.date.label, 'Time: ' + sel.time];
      if (form.elements.mode) lines.push('Mode: ' + form.elements.mode.value);
      lines.push('Name: ' + name, 'Mobile: ' + phone);
      if (form.elements.note && form.elements.note.value.trim()) lines.push('Note: ' + form.elements.note.value.trim());
      window.open(wa(lines.join('\n')), '_blank');
      toast('Opening WhatsApp…');
    });
  }

  /* ---------- menu tabs ---------- */
  var tabs = $('#menu-tabs');
  if (tabs) {
    var cats = [];
    $$('[data-cat]').forEach(function (el) { var c = el.getAttribute('data-cat'); if (cats.indexOf(c) < 0) cats.push(c); });
    var cur = 'All';
    ['All'].concat(cats).forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (c === 'All' ? ' on' : ''); b.textContent = c;
      b.onclick = function () {
        cur = c; $$('.chip', tabs).forEach(function (x) { x.classList.toggle('on', x === b); });
        $$('[data-cat]').forEach(function (el) { el.style.display = (c === 'All' || el.getAttribute('data-cat') === c) ? '' : 'none'; });
      };
      tabs.appendChild(b);
    });
  }

  /* ---------- cart (restaurant orders and shop) ---------- */
  var cartBox = $('#cart');
  if (cartBox) {
    var cart = {}, items = {};
    $$('[data-item]').forEach(function (el) {
      var id = el.getAttribute('data-item');
      items[id] = { name: el.getAttribute('data-name'), price: +el.getAttribute('data-price') };
      var btn = $('.add', el);
      if (btn) btn.addEventListener('click', function () { cart[id] = (cart[id] || 0) + 1; render(); toast('Added: ' + items[id].name); });
    });
    var body = $('#cart-body'), totalEl = $('#cart-total'), count = $('#cart-count'), overlay = $('#cart-overlay');
    function openCart(o) { cartBox.classList.toggle('open', o); overlay.classList.toggle('open', o); }
    $$('[data-cart-open]').forEach(function (b) { b.addEventListener('click', function () { openCart(true); }); });
    $$('[data-cart-close]').forEach(function (b) { b.addEventListener('click', function () { openCart(false); }); });
    overlay.addEventListener('click', function () { openCart(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openCart(false); });
    function total() { return Object.keys(cart).reduce(function (t, id) { return t + items[id].price * cart[id]; }, 0); }
    function render() {
      var ids = Object.keys(cart), n = ids.reduce(function (t, id) { return t + cart[id]; }, 0);
      count.textContent = n;
      if (!ids.length) { body.innerHTML = '<div class="cart-empty">Your cart is empty.<br>Add something you like.</div>'; }
      else {
        body.innerHTML = ids.map(function (id) {
          return '<div class="cart-line"><b>' + esc(items[id].name) + '</b><b>' + inr(items[id].price * cart[id]) + '</b><div class="qty"><button data-m="' + id + '" aria-label="Less">−</button><span>' + cart[id] + '</span><button data-p="' + id + '" aria-label="More">+</button></div></div>';
        }).join('');
        $$('[data-m]', body).forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-m'); cart[id]--; if (cart[id] <= 0) delete cart[id]; render(); }; });
        $$('[data-p]', body).forEach(function (b) { b.onclick = function () { cart[b.getAttribute('data-p')]++; render(); }; });
      }
      totalEl.textContent = inr(total());
    }
    render();
    var cf = $('#cart-form');
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var ids = Object.keys(cart), er = $('#cart-err'), nm = cf.elements.name.value.trim(), ph = cf.elements.phone.value.replace(/\D/g, ''), ad = cf.elements.address ? cf.elements.address.value.trim() : '';
      if (!ids.length) { er.textContent = 'Your cart is empty.'; return; }
      if (!nm) { er.textContent = 'Please enter your name.'; return; }
      if (ph.length < 10) { er.textContent = 'Please enter a valid 10-digit mobile number.'; return; }
      if (cf.elements.address && C.needAddress && !ad) { er.textContent = 'Please enter your delivery address.'; return; }
      er.textContent = '';
      var lines = [C.orderIntro, ''];
      ids.forEach(function (id) { lines.push(cart[id] + ' x ' + items[id].name + ' = ' + inr(items[id].price * cart[id])); });
      lines.push('', 'Total: ' + inr(total()), 'Name: ' + nm, 'Mobile: ' + ph);
      if (ad) lines.push('Address: ' + ad);
      window.open(wa(lines.join('\n')), '_blank');
      toast('Opening WhatsApp…');
    });
  }

  /* ---------- reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }
})();
