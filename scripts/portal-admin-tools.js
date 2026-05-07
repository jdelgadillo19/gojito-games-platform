/**
 * Hub-only admin shell — shares localStorage keys with game builds for dummy users + impersonation.
 * Dispatches CustomEvent("gojito-admin-change") after mutations (games listen for storage sync).
 */
(function () {
  var K_USERS = "gojito.admin.v1.dummyUsers";
  var K_IMP = "gojito.admin.v1.impersonation";

  function notify() {
    try {
      window.dispatchEvent(new CustomEvent("gojito-admin-change"));
    } catch (_) {}
  }

  function parse(raw, fb) {
    try {
      return raw ? JSON.parse(raw) : fb;
    } catch (_) {
      return fb;
    }
  }

  function loadUsersRaw() {
    var rows = parse(localStorage.getItem(K_USERS), []);
    return Array.isArray(rows) ? rows.filter(Boolean) : [];
  }

  function newId() {
    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "dummy_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  /** One-shot seed — matches game client logic (no upsert recursion). */
  function seedIfEmpty() {
    if (loadUsersRaw().length > 0) return;
    var ts = new Date().toISOString();
    var seeded = [
      {
        id: newId(),
        displayName: "Sam Bean",
        email: "sam.bean@example.test",
        tier: "bean",
        notes: "",
        createdAt: ts,
      },
      {
        id: newId(),
        displayName: "Riley Beef",
        email: "riley.beef@example.test",
        tier: "beef",
        notes: "",
        createdAt: ts,
      },
      {
        id: newId(),
        displayName: "Jordan Guac",
        email: "jordan.guac@example.test",
        tier: "guac",
        notes: "",
        createdAt: ts,
      },
    ];
    localStorage.setItem(K_USERS, JSON.stringify(seeded));
    notify();
  }

  function loadUsers() {
    seedIfEmpty();
    return loadUsersRaw();
  }

  function saveUsers(rows) {
    localStorage.setItem(K_USERS, JSON.stringify(rows));
    notify();
  }

  function loadImp() {
    return parse(localStorage.getItem(K_IMP), null);
  }

  function saveImp(o) {
    if (!o) localStorage.removeItem(K_IMP);
    else localStorage.setItem(K_IMP, JSON.stringify(o));
    notify();
  }

  function upsert(row) {
    seedIfEmpty();
    var rows = loadUsersRaw().slice();
    var id =
      row.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "dummy_" + Date.now() + "_" + Math.random().toString(16).slice(2));
    var next = {
      id: id,
      displayName: String(row.displayName || "Player").trim() || "Player",
      email: String(row.email || "").trim(),
      tier: row.tier === "guac" || row.tier === "beef" || row.tier === "bean" ? row.tier : "bean",
      notes: row.notes ? String(row.notes) : "",
      createdAt: row.createdAt || new Date().toISOString(),
    };
    var i = rows.findIndex(function (r) {
      return r.id === id;
    });
    if (i === -1) rows.push(next);
    else rows[i] = Object.assign({}, rows[i], next);
    saveUsers(rows);
    return next;
  }

  function remove(id) {
    seedIfEmpty();
    saveUsers(
      loadUsersRaw().filter(function (r) {
        return r.id !== id;
      }),
    );
    var imp = loadImp();
    if (imp && imp.dummyUserId === id) saveImp(null);
  }

  function activeDummy() {
    var imp = loadImp();
    if (!imp || !imp.dummyUserId) return null;
    return loadUsers().find(function (u) {
      return u.id === imp.dummyUserId;
    });
  }

  function refreshChrome() {
    var btn = document.getElementById("portal-admin-open");
    if (!btn) return;
    var d = activeDummy();
    btn.textContent = d ? "Back to admin" : "Admin";
    btn.setAttribute("aria-pressed", d ? "true" : "false");
  }

  refreshChrome();

  window.addEventListener("storage", refreshChrome);
  window.addEventListener("gojito-admin-change", refreshChrome);

  var adminModal = document.getElementById("portal-admin-modal");
  var adminClose = document.getElementById("portal-admin-close");
  var confirmModal = document.getElementById("portal-admin-confirm-exit");
  var confirmCancel = document.getElementById("portal-admin-confirm-cancel");
  var confirmOk = document.getElementById("portal-admin-confirm-ok");
  var viewAsConfirmModal = document.getElementById("portal-admin-viewas-confirm");
  var viewAsConfirmCancel = document.getElementById("portal-admin-viewas-cancel");
  var viewAsConfirmOk = document.getElementById("portal-admin-viewas-ok");
  var viewAsSummaryEl = document.getElementById("portal-admin-viewas-summary");
  var adminOpenBtn = document.getElementById("portal-admin-open");

  function scrollAdminPanelToTop() {
    var el = document.getElementById("portal-admin-modal-scroll");
    if (!el) return;
    el.scrollTop = 0;
    requestAnimationFrame(function () {
      el.scrollTop = 0;
      if (typeof window.portalRefreshModalScrollFades === "function") {
        window.portalRefreshModalScrollFades();
      }
    });
  }

  function focusAdminPrimaryControl() {
    var tab =
      document.getElementById("portal-admin-pane-view") &&
      !document.getElementById("portal-admin-pane-view").hidden
        ? document.getElementById("portal-admin-tab-view")
        : document.getElementById("portal-admin-tab-manage");
    if (!tab || !tab.focus) return;
    try {
      tab.focus({ preventScroll: true });
    } catch (_) {
      tab.focus();
    }
  }

  function openAdminModal() {
    adminModal.hidden = false;
    adminModal.setAttribute("aria-hidden", "false");
    renderAdminForm();
    scrollAdminPanelToTop();
    focusAdminPrimaryControl();
  }

  function closeAdminModal() {
    adminModal.hidden = true;
    adminModal.setAttribute("aria-hidden", "true");
    adminOpenBtn.focus();
  }

  function openExitConfirm() {
    confirmModal.hidden = false;
    confirmModal.setAttribute("aria-hidden", "false");
    confirmOk.focus();
  }

  function closeExitConfirm() {
    confirmModal.hidden = true;
    confirmModal.setAttribute("aria-hidden", "true");
    adminOpenBtn.focus();
  }

  function openViewAsConfirm() {
    var id = document.getElementById("portal-admin-viewas-select").value;
    var u = loadUsers().find(function (x) {
      return x.id === id;
    });
    if (!u || !viewAsConfirmModal || !viewAsSummaryEl) return;
    viewAsSummaryEl.textContent =
      u.displayName + " · tier " + u.tier + (u.email ? " · " + u.email : "");
    viewAsConfirmModal.hidden = false;
    viewAsConfirmModal.setAttribute("aria-hidden", "false");
    viewAsConfirmOk.focus();
  }

  function closeViewAsConfirm() {
    if (!viewAsConfirmModal) return;
    viewAsConfirmModal.hidden = true;
    viewAsConfirmModal.setAttribute("aria-hidden", "true");
  }

  function selectOptionById(selectEl, wantId) {
    if (!selectEl || !selectEl.options.length) return;
    if (wantId) {
      for (var i = 0; i < selectEl.options.length; i++) {
        if (selectEl.options[i].value === wantId) {
          selectEl.selectedIndex = i;
          return;
        }
      }
    }
    selectEl.selectedIndex = 0;
  }

  /**
   * @param {{ manageId?: string, viewAsId?: string } | undefined} prefs - optional ids to keep selected after rebuild
   */
  function renderAdminForm(prefs) {
    prefs = prefs || {};
    var sel = document.getElementById("portal-admin-user-select");
    var selView = document.getElementById("portal-admin-viewas-select");
    if (!sel || !selView) return;
    var prevManage =
      prefs.manageId !== undefined ? prefs.manageId : sel.value;
    var prevView =
      prefs.viewAsId !== undefined ? prefs.viewAsId : selView.value;
    sel.innerHTML = "";
    selView.innerHTML = "";
    loadUsers().forEach(function (u) {
      var opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.displayName + " (" + u.tier + ")";
      sel.appendChild(opt);
    });
    loadUsers().forEach(function (u) {
      var opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.displayName + " (" + u.tier + ")";
      selView.appendChild(opt);
    });
    if (sel.options.length) {
      selectOptionById(sel, prevManage);
      selectOptionById(selView, prevView);
    }
    if (typeof window.portalRefreshModalScrollFades === "function") {
      requestAnimationFrame(function () {
        window.portalRefreshModalScrollFades();
      });
    }
  }

  adminOpenBtn.addEventListener("click", function () {
    if (activeDummy()) openExitConfirm();
    else openAdminModal();
  });

  adminClose.addEventListener("click", closeAdminModal);
  adminModal.querySelector(".portal-modal__backdrop").addEventListener("click", closeAdminModal);

  confirmCancel.addEventListener("click", closeExitConfirm);
  confirmModal.querySelector(".portal-modal__backdrop").addEventListener("click", closeExitConfirm);
  confirmOk.addEventListener("click", function () {
    saveImp(null);
    refreshChrome();
    closeExitConfirm();
    location.reload();
  });

  if (viewAsConfirmCancel && viewAsConfirmModal) {
    viewAsConfirmCancel.addEventListener("click", closeViewAsConfirm);
    viewAsConfirmModal.querySelector(".portal-modal__backdrop").addEventListener("click", closeViewAsConfirm);
  }

  if (viewAsConfirmOk) {
    viewAsConfirmOk.addEventListener("click", function () {
      var id = document.getElementById("portal-admin-viewas-select").value;
      if (!id) return;
      saveImp({ dummyUserId: id, startedAt: new Date().toISOString() });
      location.reload();
    });
  }

  document.getElementById("portal-admin-tab-manage").addEventListener("click", function () {
    document.getElementById("portal-admin-pane-manage").hidden = false;
    document.getElementById("portal-admin-pane-view").hidden = true;
    document.getElementById("portal-admin-tab-manage").classList.add("is-active");
    document.getElementById("portal-admin-tab-view").classList.remove("is-active");
    scrollAdminPanelToTop();
    focusAdminPrimaryControl();
  });
  document.getElementById("portal-admin-tab-view").addEventListener("click", function () {
    document.getElementById("portal-admin-pane-manage").hidden = true;
    document.getElementById("portal-admin-pane-view").hidden = false;
    document.getElementById("portal-admin-tab-view").classList.add("is-active");
    document.getElementById("portal-admin-tab-manage").classList.remove("is-active");
    renderAdminForm();
    scrollAdminPanelToTop();
    focusAdminPrimaryControl();
  });

  document.getElementById("portal-admin-create").addEventListener("click", function () {
    var nameEl = adminModal.querySelector("#portal-admin-new-name");
    var emailEl = adminModal.querySelector("#portal-admin-new-email");
    var tierEl = adminModal.querySelector("#portal-admin-new-tier");
    var notesEl = adminModal.querySelector("#portal-admin-new-notes");
    var dn = String((nameEl && nameEl.value) || "").trim();
    if (!dn) {
      window.alert("Enter a display name for the new profile.");
      if (nameEl) nameEl.focus();
      return;
    }
    var selView = document.getElementById("portal-admin-viewas-select");
    var keepViewAs = selView && selView.value;
    var created = upsert({
      displayName: dn,
      email: String((emailEl && emailEl.value) || "").trim(),
      tier: tierEl && tierEl.value,
      notes: String((notesEl && notesEl.value) || "").trim(),
    });
    if (nameEl) nameEl.value = "";
    if (emailEl) emailEl.value = "";
    if (tierEl) tierEl.selectedIndex = 0;
    if (notesEl) notesEl.value = "";
    renderAdminForm({ manageId: created.id, viewAsId: keepViewAs });
  });

  document.getElementById("portal-admin-save-tier").addEventListener("click", function () {
    var sel = document.getElementById("portal-admin-user-select");
    var selView = document.getElementById("portal-admin-viewas-select");
    var id = sel.value;
    var keepViewAs = selView && selView.value;
    var u = loadUsers().find(function (x) {
      return x.id === id;
    });
    if (!u) return;
    upsert(
      Object.assign({}, u, {
        tier: document.getElementById("portal-admin-tier").value,
      }),
    );
    renderAdminForm({ manageId: id, viewAsId: keepViewAs });
  });

  document.getElementById("portal-admin-delete").addEventListener("click", function () {
    var sel = document.getElementById("portal-admin-user-select");
    var selView = document.getElementById("portal-admin-viewas-select");
    var id = sel.value;
    var keepViewAs = selView && selView.value;
    if (!id || !confirm("Delete this dummy profile?")) return;
    remove(id);
    renderAdminForm({ viewAsId: keepViewAs });
    refreshChrome();
  });

  document.getElementById("portal-admin-enter-view").addEventListener("click", openViewAsConfirm);

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (viewAsConfirmModal && !viewAsConfirmModal.hidden) closeViewAsConfirm();
    else if (!adminModal.hidden) closeAdminModal();
    else if (!confirmModal.hidden) closeExitConfirm();
  });
})();
