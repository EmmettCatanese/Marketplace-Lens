(function () {
  const YEAR_RE = /\b(19[8-9]\d|20[0-3]\d)\b/;  // 1980–2039

  function extractYear(title) {
    const m = title.match(YEAR_RE);
    return m ? parseInt(m[1], 10) : null;
  }

  function buildIndex(data) {
    const makes = new Set();
    const modelsByMake = {};
    for (const make of Object.keys(data)) {
      makes.add(make.toLowerCase());
      modelsByMake[make.toLowerCase()] = new Set(
        Object.keys(data[make]).map(m => m.toLowerCase())
      );
    }
    return { makes, modelsByMake };
  }

  function norm(s) {
    return s.toLowerCase().replace(/[^a-z0-9-]/g, "");
  }

  function extractMakeModel(title, index) {
    const cleaned = title.toLowerCase().replace(YEAR_RE, " ").trim();
    const words = cleaned.split(/\s+/).filter(Boolean);

    for (let i = 0; i < words.length; i++) {
      const candidateMake = norm(words[i]);
      if (!index.makes.has(candidateMake)) continue;

      const models = index.modelsByMake[candidateMake];

      for (let span = 3; span >= 1; span--) {
        if (i + span > words.length) continue;
        const slice = words.slice(i + 1, i + 1 + span).map(norm);
        const candidates = [
          slice.join(""),
          slice.join("-"),
        ];
        for (const candidate of candidates) {
          if (models.has(candidate)) {

            const trimStart = i + 1 + span;
            const trimTokens = words.slice(trimStart)
              .filter(w => !YEAR_RE.test(w));
            return {
              make: candidateMake,
              model: candidate,
              trimHint: trimTokens.join(" ").trim() || null,
            };
          }
        }
      }
      return null;
    }
    return null;
  }

  function parseTitle(title, data) {
    if (!title) return null;
    const year = extractYear(title);
    const index = buildIndex(data);
    const mm = extractMakeModel(title, index);
    if (!mm) return null;
    return { year, ...mm };
  }

  function matchTrim(trimHint, availableTrims) {
    if (!trimHint || !availableTrims.length) return null;

    const hintTokens = new Set(
      trimHint.toLowerCase().split(/\s+/).map(t => t.replace(/[^a-z0-9]/g, ""))
        .filter(Boolean)
    );
    if (hintTokens.size === 0) return null;

    let best = null;
    let bestScore = 0;
    for (const t of availableTrims) {
      const trimTokens = new Set(
        t.trim.toLowerCase().split(/\s+/).map(s => s.replace(/[^a-z0-9]/g, ""))
          .filter(Boolean)
      );
      let score = 0;
      for (const ht of hintTokens) if (trimTokens.has(ht)) score++;
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    }
    return bestScore > 0 ? best : null;
  }


  function lookupPrices(parsed, data) {
    if (!parsed) return { type: "not_found", reason: "unparseable" };
    const { year, make, model, trimHint } = parsed;
    if (!year) return { type: "not_found", reason: "no year", parsed };

    const vehicleData = data[make]?.[model]?.[String(year)];
    if (!vehicleData) {
      return { type: "not_found", reason: "year not in data", parsed };
    }

    const match = matchTrim(trimHint, vehicleData);
    if (match) {
      return {
        type: "exact",
        vehicle: { make, model, year },
        trim: match.trim,
        prices: {
          trade_in: match.trade_in,
          private_party: match.private_party,
          fair_purchase_price: match.fair_purchase_price,
        },
        trimHint,
      };
    }

    const prices = vehicleData
      .map(t => t.fair_purchase_price)
      .filter(p => p != null);
    return {
      type: "range",
      vehicle: { make, model, year },
      trims: vehicleData,
      range: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
      trimHint,
    };
  }

  window.PARSER = { parseTitle, lookupPrices };
})();