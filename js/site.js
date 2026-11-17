(function () {
  var PHONE = "919987056334";
  function wa(msg) { return "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(msg); }

  // Prefill WhatsApp messages from data-wa
  document.querySelectorAll("[data-wa]").forEach(function (a) { a.href = wa(a.getAttribute("data-wa")); });

  var yr = document.getElementById("year"); if (yr) yr.textContent = new Date().getFullYear();

  // Mobile menu
  var toggle = document.getElementById("navToggle"), nav = document.getElementById("site-nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // Demo tabs
  var DEMOS = {
    advisor:   { name: "Clear Path Advisory", cap: "Consultation topics, a weekly timetable and a booking request in under a minute.", alt: "advisor" },
    salon:     { name: "Urban Edge Salon", cap: "Services with prices, an open-now badge and slot booking sent to WhatsApp.", alt: "salon" },
    restaurant:{ name: "Spice & Brew Café", cap: "A menu with order-on-WhatsApp, table reservations and opening hours.", alt: "restaurant" },
    ecommerce: { name: "Aurelle Store", cap: "A product catalogue, cart and order request sent to WhatsApp.", alt: "online store" }
  };
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var panel = document.getElementById("demo-panel");
  function showDemo(key) {
    var d = DEMOS[key]; if (!d) return;
    tabs.forEach(function (t) {
      var on = t.dataset.demo === key;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", "tab-" + key);
    var dsk = document.getElementById("demo-desktop"), mob = document.getElementById("demo-mobile");
    dsk.src = "img/demo-" + key + "-desktop.jpg"; dsk.alt = "Desktop view of the sample " + d.alt + " website";
    mob.src = "img/demo-" + key + "-mobile.jpg"; mob.alt = "Mobile view of the sample " + d.alt + " website";
    document.getElementById("demo-url").textContent = d.name;
    document.getElementById("demo-caption").textContent = d.cap;
    document.getElementById("demo-link").href = "demo-" + key + ".html";
  }
  tabs.forEach(function (t, i) {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener("click", function () { showDemo(t.dataset.demo); });
    t.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (n) { e.preventDefault(); n.focus(); showDemo(n.dataset.demo); }
    });
  });

  // Enquiry form
  var form = document.getElementById("enquiryForm"), status = document.getElementById("formStatus"), btn = document.getElementById("submitBtn");
  function setErr(name, msg) {
    var el = form.querySelector('[data-err="' + name + '"]'); if (el) el.textContent = msg || "";
    var input = form.elements[name] || document.getElementById(name);
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  function showStatus(kind, text) { status.className = "form-status show " + kind; status.textContent = text; }
  function validate(v) {
    var ok = true;
    [["fullName", "Enter your name."], ["businessName", "Enter your business name."], ["serviceRequired", "Choose a service."], ["message", "Tell us briefly what you need."]].forEach(function (f) {
      if (!v[f[0]].trim()) { setErr(f[0], f[1]); ok = false; } else setErr(f[0]);
    });
    var digits = v.mobileNumber.replace(/\D/g, "");
    if (digits.length < 10) { setErr("mobileNumber", "Enter a 10-digit mobile number."); ok = false; } else setErr("mobileNumber");
    if (v.emailAddress && !/^\S+@\S+\.\S+$/.test(v.emailAddress)) { setErr("emailAddress", "Check the email address."); ok = false; } else setErr("emailAddress");
    if (!document.getElementById("consent").checked) { setErr("consent", "Please tick the box so we can contact you."); ok = false; } else setErr("consent");
    return ok;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.className = "form-status";
    var v = {
      fullName: form.fullName.value, businessName: form.businessName.value, mobileNumber: form.mobileNumber.value,
      emailAddress: form.emailAddress.value, serviceRequired: form.serviceRequired.value, budgetRange: form.budgetRange.value,
      message: form.message.value, company: form.company.value
    };
    if (!validate(v)) { var bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
    btn.disabled = true; btn.textContent = "Sending…";
    var fallback = "Hi Digital Creators, I'm " + v.fullName + " from " + v.businessName + ". I need help with: " + v.serviceRequired + ". " + v.message + (v.budgetRange ? " Budget: " + v.budgetRange + "." : "") + " My number: " + v.mobileNumber + ".";
    fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && j.success; }); })
      .catch(function () { return false; })
      .then(function (delivered) {
        btn.disabled = false; btn.textContent = "Send enquiry";
        if (delivered) {
          form.reset();
          showStatus("ok", "Thanks, we have your enquiry and will reply within 24 business hours.");
        } else {
          showStatus("warn", "We could not send this from the page, so we opened WhatsApp with your details filled in. Press send there and we will get it.");
          window.open(wa(fallback), "_blank", "noopener");
        }
      });
  });
})();
