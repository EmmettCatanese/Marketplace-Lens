(function () {
  const { parseTitle, lookupPrices } = window.PARSER;
  const DATA = window.DATA;

  if (!DATA) {
    console.warn("[MPO] pricing data not loaded");
    return;
  }
  console.log("[MPO] loaded with", Object.keys(DATA).length, "manufacturers");

  const PROCESSED = "data-mpo-processed";

  function findCards() {
    const links = document.querySelectorAll('a[href*="/marketplace/item/"]');
    const cards = new Set();
    for (const link of links) {

      let card = link;
      for (let i = 0; i < 6 && card.parentElement; i++) {
        card = card.parentElement;
        if (card.children.length >= 2) break;
      }
      if (!card.hasAttribute(PROCESSED)) cards.add(card);
    }
    return Array.from(cards);
  }

  function extractCardData(card) {
    const text = card.innerText || "";
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    const priceLine = lines.find(l => /^\$[\d,]+/.test(l));
    const listedPrice = priceLine
      ? parseInt(priceLine.replace(/[^0-9]/g, ""), 10)
      : null;


    let title = null, parsed = null;
    for (const line of lines) {
      if (line === priceLine) continue;
      const p = parseTitle(line, DATA);
      if (p && p.year && p.make && p.model) {
        title = line;
        parsed = p;
        break;
      }
    }
    return { title, parsed, listedPrice };
  }

  function buildBadge(result, listedPrice) {
    const badge = document.createElement("div");
    badge.className = "mpo-overlay";

    if (result.type === "not_found") {
      badge.classList.add("mpo-not-found");
      badge.innerHTML = `<span class="mpo-label">Ref</span><span class="mpo-msg">No data</span>`;
      return badge;
    }

    const fmt = n => (n == null ? "—" : "$" + n.toLocaleString());

    if (result.type === "exact") {
      const headline = result.prices.private_party;
      const diff = listedPrice != null && headline != null ? listedPrice - headline : null;
      const pct = diff != null && headline ? (diff / headline) * 100 : null;
      const diffClass = diff == null ? "" : diff > 0 ? "mpo-over" : "mpo-under";

      let diffStr = "";
      if (diff != null) {
        const dollars = fmt(Math.abs(diff));
        const pctStr = pct != null ? `${Math.abs(pct).toFixed(0)}%` : "";
        diffStr = diff > 0
          ? `+${dollars} (${pctStr}) over`
          : `${dollars} (${pctStr}) under`;
      }

      badge.innerHTML = `
        <div class="mpo-row">
          <span class="mpo-label">Private Party</span>
          <span class="mpo-value">${fmt(headline)}</span>
        </div>
        <div class="mpo-row mpo-secondary">
          <span>Trade-in ${fmt(result.prices.trade_in)}</span>
          <span>Fair ${fmt(result.prices.fair_purchase_price)}</span>
        </div>
        ${diff != null ? `<div class="mpo-diff ${diffClass}">${diffStr}</div>` : ""}
        <div class="mpo-trim" title="Matched trim">${result.trim}</div>
      `;
      return badge;
    }

    badge.classList.add("mpo-range");
    const prices = result.trims
      .map(t => t.private_party)
      .filter(p => p != null);
    const r = prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
    badge.innerHTML = `
      <div class="mpo-row">
        <span class="mpo-label">Private Party (range)</span>
        <span class="mpo-value">${r ? `${fmt(r.min)}–${fmt(r.max)}` : "—"}</span>
      </div>
      <div class="mpo-trim">${result.trims.length} trims, no specific match</div>
    `;
    return badge;
  }

  function processCard(card) {
    if (card.hasAttribute(PROCESSED)) return;
    card.setAttribute(PROCESSED, "true");

    const { title, parsed, listedPrice } = extractCardData(card);
    if (!title) return; 

    const result = lookupPrices(parsed, DATA);
    const badge = buildBadge(result, listedPrice);

    if (getComputedStyle(card).position === "static") {
      card.style.position = "relative";
    }
    card.appendChild(badge);
  }

  function scan() {
    const cards = findCards();
    for (const card of cards) processCard(card);
  }

  scan();

  let scanScheduled = false;
  const observer = new MutationObserver(() => {
    if (scanScheduled) return;
    scanScheduled = true;
    setTimeout(() => {
      scanScheduled = false;
      scan();
    }, 500);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();