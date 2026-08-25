/* Academic homepage renderer.
 * Reads content.xlsx (same folder) and fills the page.
 * Edit the Excel file to update your site -- no code changes needed.
 *
 * How sections work:
 *   - "Profile" sheet  -> the About + Contact blocks (key/value pairs).
 *   - Every other sheet -> one section + one tab, in workbook order.
 *       * "Publications", "Research", "News" use dedicated layouts.
 *       * Any other sheet (e.g. Teaching, Awards, Projects) is rendered
 *         generically. Add a sheet in Excel and it appears automatically.
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

  function slugify(s) {
    return String(s || "section")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
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
    if (!rows.length) {
      return `<p class="meta">No publications yet.</p>`;
    }
    return rows
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
    if (!rows.length) {
      return `<p class="meta">No research entries yet.</p>`;
    }
    return rows
      .map((r) => {
        return `<div class="item">
            <h3>${escapeHtml(r.Title || "")}</h3>
            ${r.Description ? `<p class="desc">${escapeHtml(r.Description)}</p>` : ""}
          </div>`;
      })
      .join("");
  }

  function renderNews(rows) {
    if (!rows.length) {
      return `<p class="meta">No news yet.</p>`;
    }
    return rows
      .map(
        (r) => `<div class="news-item">
            <span class="news-date">${escapeHtml(r.Date || "")}</span>
            <span>${escapeHtml(r.Text || "")}</span>
          </div>`
      )
      .join("");
  }

  // Generic renderer for any extra sheet (Teaching, Awards, Projects, ...).
  function renderGeneric(rows) {
    if (!rows.length) {
      return `<p class="meta">No entries yet.</p>`;
    }
    const skip = new Set(["Title", "Name", "Date", "Year", "Description", "Text", "Abstract", "Detail"]);
    return rows
      .map((r) => {
        const title = r.Title || r.Name || "";
        const date = r.Date || r.Year || "";
        const desc = r.Description || r.Text || r.Abstract || r.Detail || "";
        const extras = Object.keys(r)
          .filter((k) => !skip.has(k) && r[k])
          .map((k) => [k, r[k]]);
        return `<div class="item">
            ${title ? `<h3>${escapeHtml(title)}</h3>` : ""}
            ${date ? `<p class="meta">${escapeHtml(date)}</p>` : ""}
            ${desc ? `<p class="desc">${escapeHtml(desc)}</p>` : ""}
            ${
              extras.length
                ? `<p class="meta">${extras
                    .map(([k, v]) => `<strong>${escapeHtml(k)}:</strong> ${linkOrText(v)}`)
                    .join(" &middot; ")}</p>`
                : ""
            }
          </div>`;
      })
      .join("");
  }

  function renderContact(p) {
    const rows = [];
    if (p.email) rows.push(["Email", `<a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a>`]);
    if (p.googleScholar) rows.push(["Google Scholar", linkOrText(p.googleScholar)]);
    if (p.github) rows.push(["GitHub", linkOrText(p.github)]);
    if (p.linkedin) rows.push(["LinkedIn", linkOrText(p.linkedin)]);
    if (p.affiliation) rows.push(["Affiliation", escapeHtml(p.affiliation)]);
    if (!rows.length) {
      return `<p class="meta">No contact info provided.</p>`;
    }
    return rows
      .map(([k, v]) => `<div class="contact-row"><span class="k">${escapeHtml(k)}</span><span class="v">${v}</span></div>`)
      .join("");
  }

  // Dedicated layouts keyed by sheet name; anything else uses renderGeneric.
  const SPECIAL = {
    Publications: renderPublications,
    Research: renderResearch,
    News: renderNews,
  };

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

  // Build a tab + section for every non-profile data sheet.
  function buildDataSections(wb) {
    const tabsHost = document.getElementById("dataTabs");
    const sectionsHost = document.getElementById("dataSections");
    const dataSheets = wb.SheetNames.filter(
      (n) => !/^(profile|contact|about)$/i.test(n)
    );

    dataSheets.forEach((name) => {
      const id = slugify(name);

      const tab = document.createElement("a");
      tab.className = "tab";
      tab.href = "#" + id;
      tab.dataset.target = id;
      tab.textContent = name;
      tabsHost.appendChild(tab);

      const sec = document.createElement("section");
      sec.id = id;
      sec.className = "card section";
      sec.hidden = true;

      const h = document.createElement("h2");
      h.className = "section-title";
      h.textContent = name;
      sec.appendChild(h);

      const box = document.createElement("div");
      box.className = "stack";
      const rows = sheetToObjects(wb, name);
      const renderer = SPECIAL[name] || renderGeneric;
      box.innerHTML = renderer(rows);
      sec.appendChild(box);

      sectionsHost.appendChild(sec);
    });
  }

  // ---- Boot -------------------------------------------------------------
  async function main() {
    try {
      const resp = await fetch(CONTENT_FILE, { cache: "no-store" });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const buf = await resp.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buf), { type: "array" });

      const profile = sheetToDict(wb, "Profile");

      buildDataSections(wb); // must run before initTabs()
      initTabs();

      renderProfile(profile);
      document.getElementById("contactList").innerHTML = renderContact(profile);
      reveal();
    } catch (err) {
      fail(
        "Could not load " + CONTENT_FILE +
        ". Serve this folder over HTTP " +
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
