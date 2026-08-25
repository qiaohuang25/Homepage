/* Academic homepage renderer.
 * Reads content.xlsx (same folder) and fills the page.
 * Edit the Excel file to update your site -- no code changes needed.
 */
(function () {
  "use strict";

  const CONTENT_FILE = "content.xlsx";
  const loadStatus = document.getElementById("loadStatus");

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isUrl(s) {
    return /^https?:\/\//i.test(String(s || "").trim());
  }

  function linkOrText(value) {
    const v = String(value || "").trim();
    if (!v) return "";
    if (isUrl(v)) {
      return `<a href="${escapeHtml(v)}" target="_blank" rel="noopener">${escapeHtml(v)}</a>`;
    }
    return escapeHtml(v);
  }

  // ---- Excel helpers ----------------------------------------------------
  function rowsToObjects(rows) {
    if (!rows || !rows.length) return [];
    const headers = rows[0].map((h) => String(h == null ? "" : h).trim());
    const out = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.every((c) => c === "" || c == null)) continue;
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx] != null ? String(r[idx]).trim() : "";
      });
      out.push(obj);
    }
    return out;
  }

  function sheetToObjects(wb, name) {
    const ws = wb.Sheets[name];
    if (!ws) return [];
    return rowsToObjects(XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }));
  }

  function sheetToDict(wb, name) {
    const dict = {};
    sheetToObjects(wb, name).forEach((o) => {
      const k = String(o.Key || "").trim();
      if (k) dict[k] = o.Value != null ? String(o.Value).trim() : "";
    });
    return dict;
  }

  // ---- Renderers --------------------------------------------------------
  function renderProfile(p) {
    if (p.name) {
      document.getElementById("brand").textContent = p.name;
      document.title = p.name + " | Academic Homepage";
      document.getElementById("name").textContent = p.name;
    }
    document.getElementById("title").textContent = p.title || "";
    document.getElementById("affiliation").textContent = p.affiliation || "";
    document.getElementById("bio").textContent = p.bio || "";

    if (p.photo) {
      document.getElementById("photo").src = p.photo;
    }

    const cv = document.getElementById("cvLink");
    if (p.cv) {
      cv.href = p.cv;
      cv.hidden = false;
    }

    const socials = document.getElementById("socials");
    const links = [
      ["googleScholar", "Google Scholar"],
      ["github", "GitHub"],
      ["linkedin", "LinkedIn"],
    ];
    socials.innerHTML = links
      .filter(([k]) => p[k])
      .map(([k, label]) => `<a href="${escapeHtml(p[k])}" target="_blank" rel="noopener">${label}</a>`)
      .join("");
  }

  function renderPublications(rows) {
    const box = document.getElementById("pubList");
    if (!rows.length) {
      box.innerHTML = `<p class="meta">No publications yet.</p>`;
      return;
    }
    box.innerHTML = rows
      .map((r) => {
        const title = linkOrText(r.Title) || escapeHtml(r.Title || "Untitled");
        const meta = [r.Year, r.Authors, r.Venue].filter(Boolean).join(" · ");
        return `<div class="item">
            <h3>${title}</h3>
            ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ""}
          </div>`;
      })
      .join("");
  }

  function renderResearch(rows) {
    const box = document.getElementById("researchList");
    if (!rows.length) {
      box.innerHTML = `<p class="meta">No research entries yet.</p>`;
      return;
    }
    box.innerHTML = rows
      .map((r) => {
        return `<div class="item">
            <h3>${escapeHtml(r.Title || "")}</h3>
            ${r.Description ? `<p class="desc">${escapeHtml(r.Description)}</p>` : ""}
          </div>`;
      })
      .join("");
  }

  function renderNews(rows) {
    const box = document.getElementById("newsList");
    if (!rows.length) {
      box.innerHTML = `<p class="meta">No news yet.</p>`;
      return;
    }
    box.innerHTML = rows
      .map(
        (r) => `<div class="news-item">
            <span class="news-date">${escapeHtml(r.Date || "")}</span>
            <span>${escapeHtml(r.Text || "")}</span>
          </div>`
      )
      .join("");
  }

  function renderContact(p) {
    const box = document.getElementById("contactList");
    const rows = [];
    if (p.email) rows.push(["Email", `<a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a>`]);
    if (p.googleScholar) rows.push(["Google Scholar", linkOrText(p.googleScholar)]);
    if (p.github) rows.push(["GitHub", linkOrText(p.github)]);
    if (p.linkedin) rows.push(["LinkedIn", linkOrText(p.linkedin)]);
    if (p.affiliation) rows.push(["Affiliation", escapeHtml(p.affiliation)]);
    if (!rows.length) {
      box.innerHTML = `<p class="meta">No contact info provided.</p>`;
      return;
    }
    box.innerHTML = rows
      .map(([k, v]) => `<div class="contact-row"><span class="k">${escapeHtml(k)}</span><span class="v">${v}</span></div>`)
      .join("");
  }

  function reveal() {
    document.querySelectorAll(".section").forEach((s) => (s.hidden = false));
    if (loadStatus) loadStatus.style.display = "none";
  }

  function fail(msg) {
    if (loadStatus) {
      loadStatus.className = "card status error";
      loadStatus.textContent = msg;
    }
    console.error(msg);
  }

  // ---- Tab navigation ---------------------------------------------------
  function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    const setActive = (id) =>
      tabs.forEach((t) => t.classList.toggle("active", t.dataset.target === id));
    tabs.forEach((t) => t.addEventListener("click", () => setActive(t.dataset.target)));
    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
        { rootMargin: "-40% 0px -55% 0px" }
      );
      document.querySelectorAll(".section").forEach((s) => obs.observe(s));
    }
  }

  // ---- Boot -------------------------------------------------------------
  async function main() {
    initTabs();
    try {
      const resp = await fetch(CONTENT_FILE, { cache: "no-store" });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const buf = await resp.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buf), { type: "array" });

      const profile = sheetToDict(wb, "Profile");
      renderProfile(profile);
      renderPublications(sheetToObjects(wb, "Publications"));
      renderResearch(sheetToObjects(wb, "Research"));
      renderNews(sheetToObjects(wb, "News"));
      renderContact(profile);
      reveal();
    } catch (err) {
      fail(
        "Could not load " + CONTENT_FILE + ". Serve this folder over HTTP " +
        "(e.g. `python -m http.server`) and make sure the file is present. " +
        "Details: " + err.message
      );
    }
  }

  if (typeof XLSX === "undefined") {
    fail("SheetJS library failed to load (check your network / CDN access).");
  } else {
    main();
  }
})();
