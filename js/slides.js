// slides.js — HTML de cada slide da apresentacao

// Retorna o logo correto por regional
function _logoRegional(regional) {
  if (regional === "RIO") return LOGO_RIO;
  if (regional === "SUL") return LOGO_SUL;
  if (regional === "SAO") return LOGO_SAO;
  return LOGO_JCA;
}

// Quebra o texto em spans por palavra (resolve bug de espacos no html2canvas)
function fw(text) {
  const spans = String(text).split(" ").map(function(w) {
    return "<span>" + w + "</span>";
  }).join("");
  return '<span style="display:inline-flex;flex-wrap:wrap;gap:0.28em;align-items:baseline">' + spans + "</span>";
}

// ── Cabecalho padrao ──────────────────────────────────────────────────────────
function _header(regional) {
  return '<div class="slide-header">'
    + '<img src="' + LOGO_JCA + '" class="slide-logo-sm" crossorigin="anonymous" alt="JCA">'
    + '<span class="slide-header__bc" style="display:inline-flex;gap:0.25em;margin-left:auto">'
    +   '<span>Excessos</span><span>de</span><span>Velocidade</span>'
    + '</span>'
    + '</div>';
}

// ── Rodape ────────────────────────────────────────────────────────────────────
function _footer(analista) {
  var txt = analista ? "DO.ACT.IOP - " + analista : "DO.ACT.IOP";
  var spans = txt.split(" ").map(function(w) { return "<span>" + w + "</span>"; }).join("");
  return '<div class="slide__footer-row">'
    + '<span class="slide__footer-text" style="display:inline-flex;flex-wrap:wrap;gap:0.25em">' + spans + '</span>'
    + '<img src="' + LOGO_IO + '" class="slide-logo-io" crossorigin="anonymous" alt="IO">'
    + '</div>';
}

// ── Cards de KPI ──────────────────────────────────────────────────────────────
function _kpiCards(cards) {
  var cols = cards.length;
  var html = '<div class="kpi-cards" style="grid-template-columns:repeat(' + cols + ',1fr)">';
  cards.forEach(function(c) {
    html += '<div class="kpi-card">'
      + '<div class="kpi-card__label">' + fw(c.label) + '</div>'
      + '<div class="kpi-card__value">' + fmtBr(c.val) + '</div>'
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ── Meta / Realizado ──────────────────────────────────────────────────────────
function _metaReal(regData) {
  var meta      = regData.meta      || "";
  var realizado = regData.realizado || "";
  var cor       = realizadoColor(meta, realizado);
  var realizadoStyle = cor
    ? 'style="color:' + cor + '"'
    : 'style="color:#1d3061"';

  return '<div class="slide-meta-real">'
    + '<div class="slide-meta-box">'
    +   '<div class="slide-meta-box__label">Meta</div>'
    +   '<div class="slide-meta-box__val slide-meta-box__val--navy">' + (meta || "---") + '</div>'
    + '</div>'
    + '<div class="slide-meta-box">'
    +   '<div class="slide-meta-box__label">Realizado</div>'
    +   '<div class="slide-meta-box__val" ' + realizadoStyle + '>' + (realizado || "---") + '</div>'
    + '</div>'
    + '</div>';
}

// ── CAPA ──────────────────────────────────────────────────────────────────────
function slideCoverHTML(mes, ano, analista) {
  var footerTxt = analista ? "DO.ACT.IOP - " + analista : "DO.ACT.IOP";
  var footerSpans = footerTxt.split(" ").map(function(w) { return "<span>" + w + "</span>"; }).join("");
  return '<div class="slide slide-cover">'
    + '<div class="slide-cover__logos">'
    +   '<img src="' + LOGO_JCA + '" class="slide-cover__logo-jca" crossorigin="anonymous" alt="JCA">'
    +   '<div class="slide-cover__sep"></div>'
    +   '<img src="' + LOGO_IO  + '" class="slide-cover__logo-io"  crossorigin="anonymous" alt="IO">'
    + '</div>'
    + '<div class="slide-cover__title">' + fw("Excessos de Velocidade") + '</div>'
    + '<div class="slide-cover__period">' + fw(mes + " de " + ano) + '</div>'
    + '<div class="slide__footer-row" style="position:absolute;bottom:12px;left:24px;right:24px">'
    +   '<span class="slide__footer-text" style="display:inline-flex;flex-wrap:wrap;gap:0.25em">' + footerSpans + '</span>'
    + '</div>'
    + '</div>';
}

// ── REGIONAL IDENTIFICADOS ────────────────────────────────────────────────────
function slideRegionalHTML(regional, regData, ano, analista) {
  var cards = [
    { label: "Excessos de Velocidade:", val: regData.excessos   },
    { label: "Condutores c/ Excesso:",  val: regData.condutores },
    { label: "Km Percorrido:",          val: regData.km         },
    { label: "Excessos a cada 1000km:", val: regData.cada1000   }
  ];
  var logoLg = regional !== "GRUPO"
    ? '<img src="' + _logoRegional(regional) + '" class="slide-logo-lg" crossorigin="anonymous" alt="' + regional + '">'
    : "";
  return '<div class="slide">'
    + _header(regional)
    + '<div class="slide-title-row">'
    +   '<div class="slide-regional__title">' + fw("Excessos de Velocidade | Identificados - " + ano) + '</div>'
    +   logoLg
    + '</div>'
    + _kpiCards(cards)
    + '<div class="slide-regional__chart-area">'
    +   '<div class="slide-regional__chart"><canvas id="slide-chart"></canvas></div>'
    +   (regional !== "GRUPO" ? _metaReal(regData) : "")
    + '</div>'
    + _footer(analista)
    + '</div>';
}

// ── NAO IDENTIFICADOS GRUPO (grafico mensal) ──────────────────────────────────
function slideNaoIdHTML(regional, naoIdData, ano, analista) {
  if (regional !== "GRUPO") {
    return _slideNaoIdRegional(regional, naoIdData, ano, analista);
  }
  // 4 cards, sem Meta/Realizado (GRUPO NI nao tem)
  var cards = [
    { label: "Excessos de Velocidade:", val: naoIdData.excessos   },
    { label: "Condutores c/ Excesso:",  val: naoIdData.condutores },
    { label: "Km Percorrido:",          val: naoIdData.km         },
    { label: "Excessos a cada 1000km:", val: naoIdData.cada1000   }
  ];
  return '<div class="slide">'
    + _header(null)
    + '<div class="slide-title-row">'
    +   '<div class="slide-regional__title">' + fw("Excessos de Velocidade | Nao Identificados - " + ano) + '</div>'
    + '</div>'
    + _kpiCards(cards)
    + '<div class="slide-regional__chart-area">'
    +   '<div class="slide-regional__chart"><canvas id="slide-chart"></canvas></div>'
    + '</div>'
    + _footer(analista)
    + '</div>';
}

// ── NAO IDENTIFICADOS REGIONAL (grafico de setores) ───────────────────────────
function _slideNaoIdRegional(regional, naoIdData, ano, analista) {
  var cards = [
    { label: "Excessos de Velocidade:", val: naoIdData.excessos   },
    { label: "Condutores c/ Excesso:",  val: naoIdData.condutores },
    { label: "Km Percorrido:",          val: naoIdData.km         },
    { label: "Excessos a cada 1000km:", val: naoIdData.cada1000   }
  ];
  return '<div class="slide">'
    + _header(regional)
    + '<div class="slide-title-row">'
    +   '<div class="slide-regional__title">' + fw("Excessos de Velocidade | Nao Identificados " + regional + " - " + ano) + '</div>'
    +   '<img src="' + _logoRegional(regional) + '" class="slide-logo-lg" crossorigin="anonymous" alt="' + regional + '">'
    + '</div>'
    + _kpiCards(cards)
    + '<div class="slide-regional__chart-area">'
    +   '<div class="slide-regional__chart"><canvas id="slide-chart"></canvas></div>'
    +   _metaReal(naoIdData)
    + '</div>'
    + _footer(analista)
    + '</div>';
}

// ── CONTRA CAPA ───────────────────────────────────────────────────────────────
function slideContraCapaHTML(analista) {
  var footerTxt   = analista ? "DO.ACT.IOP - " + analista : "DO.ACT.IOP";
  var footerSpans = footerTxt.split(" ").map(function(w) { return "<span>" + w + "</span>"; }).join("");
  return '<div class="slide slide-cover">'
    + '<div class="slide-cover__logos">'
    +   '<img src="' + LOGO_JCA + '" class="slide-cover__logo-jca" crossorigin="anonymous" alt="JCA">'
    +   '<div class="slide-cover__sep"></div>'
    +   '<img src="' + LOGO_IO  + '" class="slide-cover__logo-io"  crossorigin="anonymous" alt="IO">'
    + '</div>'
    + '<div class="slide__footer-row" style="position:absolute;bottom:12px;left:24px;right:24px">'
    +   '<span class="slide__footer-text" style="display:inline-flex;flex-wrap:wrap;gap:0.25em">' + footerSpans + '</span>'
    + '</div>'
    + '</div>';
}
function slidePlanoHTML(regional, regData, mes, mesIdx, analista) {
  var mesDado = regData.meses[mes] || {};
  var prox    = mes;
  var linhas  = regData.planoAcao.split("\n").filter(function(l) { return l.trim(); });
  var bullets = linhas.length === 0
    ? '<span class="slide-plano__empty">Nenhum plano preenchido.</span>'
    : '<ul>' + linhas.map(function(l) { return "<li>" + l + "</li>"; }).join("") + '</ul>';

  return '<div class="slide">'
    + _header(regional)
    + '<div class="slide-plano__title">' + fw("Plano de Acao") + '</div>'
    + '<div class="slide-plano__table">'
    +   '<div class="slide-plano__table-hd">' + fw("Tipo da Ocorrencia") + '</div>'
    +   '<div class="slide-plano__table-type">' + fw("Excessos de Velocidade") + '</div>'
    +   '<div class="slide-plano__table-row">'
    +     '<div class="slide-plano__table-cell"><strong>Quantidade:</strong> ' + (mesDado.q || "---") + '</div>'
    +     '<div class="slide-plano__table-cell"><strong>A cada 1000km:</strong> ' + (mesDado.k1000 || "---") + '</div>'
    +     '<div class="slide-plano__table-cell"><strong>Meta:</strong> ' + (regData.meta || "---") + '</div>'
    +   '</div>'
    +   '<div class="slide-plano__table-sub">' + fw("Plano de Acao " + prox) + '</div>'
    + '</div>'
    + '<div class="slide-plano__actions">' + bullets + '</div>'
    + _footer(analista)
    + '</div>';
}