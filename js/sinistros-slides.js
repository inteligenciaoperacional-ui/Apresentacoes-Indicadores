// sinistros-slides.js — HTML dos slides do modulo Sinistros

// ── Header padrao Sinistros ───────────────────────────────────────────────────
function sinHeader() {
  return '<div class="sin-header">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4px">'
    +   '<img src="' + LOGO_JCA + '" class="slide-logo-sm" crossorigin="anonymous" alt="JCA">'
    +   '<span style="font-size:10px;color:#bbb;letter-spacing:1.5px;font-weight:500">Sinistros</span>'
    + '</div>'
    + '<div style="height:3px;background:var(--navy);width:100%;flex-shrink:0"></div>'
    + '</div>';
}

// ── Footer ────────────────────────────────────────────────────────────────────
function sinFooter(analista, dataAtu) {
  var txt = analista ? "DO.ACT.IOP - " + analista : "DO.ACT.IOP";
  var spans = txt.split(" ").map(function(w) { return "<span>" + w + "</span>"; }).join("");
  var direita = dataAtu ? '<span class="sin-footer__data">Dados atualizados em ' + dataAtu + '</span>' : "";
  return '<div class="sin-footer">'
    + '<span class="slide__footer-text" style="display:inline-flex;flex-wrap:wrap;gap:0.25em">' + spans + '</span>'
    + direita
    + '</div>';
}

// ── KPI card Sinistros ────────────────────────────────────────────────────────
function sinKpiCards(sinistros, kmSinistro) {
  return '<div class="sin-kpi-row">'
    + '<div class="sin-kpi-card"><div class="sin-kpi-label">Sinistros:</div><div class="sin-kpi-val">' + (fmtBr(sinistros) || "---") + '</div></div>'
    + '<div class="sin-kpi-card"><div class="sin-kpi-label">Km/Sinistro:</div><div class="sin-kpi-val">' + (fmtBr(kmSinistro) || "---") + '</div></div>'
    + '</div>';
}

// ── CAPA ──────────────────────────────────────────────────────────────────────
function sinSlideCoverHTML(mes, ano, analista) {
  var footerTxt = analista ? "DO.ACT.IOP - " + analista : "DO.ACT.IOP";
  var fSpans = footerTxt.split(" ").map(function(w) { return "<span>" + w + "</span>"; }).join("");
  return '<div class="slide slide-cover">'
    + '<div class="slide-cover__logos">'
    +   '<img src="' + LOGO_JCA + '" class="slide-cover__logo-jca" crossorigin="anonymous" alt="JCA">'
    +   '<div class="slide-cover__sep"></div>'
    +   '<img src="' + LOGO_IO + '" class="slide-cover__logo-io" crossorigin="anonymous" alt="IO">'
    + '</div>'
    + '<div class="slide-cover__title">Sinistros</div>'
    + '<div class="slide-cover__period">' + mes + ' ' + ano + '</div>'
    + '<div class="slide__footer-row" style="position:absolute;bottom:12px;left:24px;right:24px">'
    +   '<span class="slide__footer-text" style="display:inline-flex;flex-wrap:wrap;gap:0.25em">' + fSpans + '</span>'
    + '</div>'
    + '</div>';
}

// ── GERAL por empresa ─────────────────────────────────────────────────────────
function sinSlideGeralHTML(empId, geralData, ano, analista) {
  var emp = sinGetEmpresa(empId);
  return '<div class="slide">'
    + sinHeader()
    + '<div class="sin-geral-title-row">'
    +   '<div class="sin-section-title">Sinistros | ' + ano + '</div>'
    +   '<img src="' + emp.logo + '" class="sin-emp-logo" crossorigin="anonymous" alt="' + emp.label + '">'
    + '</div>'
    + sinKpiCards(geralData.sinistros, geralData.kmSinistro)
    + '<div class="sin-chart-full"><canvas id="sin-main-chart"></canvas></div>'
    + sinFooter(analista)
    + '</div>';
}

// ── SEGMENTO (Rodo / Fret / Urb) ─────────────────────────────────────────────
function sinSlideSegmentoHTML(empId, seg, segData, ano, analista) {
  var emp      = sinGetEmpresa(empId);
  var segLabel = SIN_SEG_LABEL[seg] || seg;
  var total    = parseN(segData.gravidade.leve || "") + parseN(segData.gravidade.medio || "") +
                 parseN(segData.gravidade.grave || "") + parseN(segData.gravidade.gravissimo || "");

  var gravColors = {
    "#9e9e9e": ["#d4d4d4", "#9e9e9e", "#5e5e5e", "#2e2e2e"],
    "#03a5a5": ["#a8e6e6", "#03a5a5", "#027070", "#014040"],
    "#4a90d9": ["#b8d4f0", "#4a90d9", "#2563a8", "#143566"]
  }[sinGetEmpresa(empId).cor] || ["#d0d0d0", "#909090", "#505050", "#202020"];

  var gravLegenda = "";
  [["leve",0],["medio",1],["grave",2],["gravissimo",3]].forEach(function(g) {
    if (parseN(segData.gravidade[g[0]] || "") > 0) {
      gravLegenda += '<div class="sin-grav-item">'
        + '<span class="sin-grav-dot" style="background:' + gravColors[g[1]] + '"></span>'
        + '<span>' + g[0].charAt(0).toUpperCase() + g[0].slice(1) + '</span>'
        + '</div>';
    }
  });
  if (!gravLegenda) {
    gravLegenda = [["Leve",0],["Medio",1],["Grave",2],["Gravissimo",3]].map(function(g) {
      return '<div class="sin-grav-item"><span class="sin-grav-dot" style="background:' + gravColors[g[1]] + '"></span><span>' + g[0] + '</span></div>';
    }).join("");
  }

  return '<div class="slide">'
    + sinHeader()
    + '<div class="sin-seg-layout">'
    +   '<div class="sin-seg-left">'
    +     '<div class="sin-section-title">' + segLabel + '</div>'
    +     sinKpiCards(segData.sinistros, segData.kmSinistro)
    +     '<div class="sin-chart-seg"><canvas id="sin-main-chart"></canvas></div>'
    +   '</div>'
    +   '<div class="sin-divider"></div>'
    +   '<div class="sin-seg-right">'
    +     '<div class="sin-det-header">'
    +       '<div class="sin-section-title">Detalhamento</div>'
    +       '<img src="' + emp.logo + '" class="sin-emp-logo-sm" crossorigin="anonymous" alt="' + emp.label + '">'
    +     '</div>'
    +     '<div class="sin-grav-legenda">' + gravLegenda + '</div>'
    +     '<div class="sin-donut-wrap"><canvas id="sin-donut-chart"></canvas></div>'
    +     '<div class="sin-hbar-wrap"><canvas id="sin-hbar-chart"></canvas></div>'
    +   '</div>'
    + '</div>'
    + sinFooter(analista)
    + '</div>';
}

// ── OFENSORES (Fret / Urb) ────────────────────────────────────────────────────
function sinSlideOfensoresHTML(empId, seg, segData, mes, ano, analista) {
  var emp      = sinGetEmpresa(empId);
  var segLabel = SIN_SEG_LABEL[seg] || seg;
  var ofMes    = (segData.ofensoresMes || []).filter(function(o) { return o.nome; });
  var top5     = (segData.top5Ano     || []).filter(function(o) { return o.nome; });

  return '<div class="slide">'
    + sinHeader()
    + '<div class="sin-ofensores-layout">'
    +   '<div class="sin-seg-left">'
    +     '<div class="sin-section-title">' + segLabel + ' - ' + mes + ' ' + ano + '</div>'
    +     '<div class="sin-hbar-full"><canvas id="sin-hbar-chart"></canvas></div>'
    +   '</div>'
    +   '<div class="sin-divider"></div>'
    +   '<div class="sin-seg-right">'
    +     '<div class="sin-det-header">'
    +       '<div class="sin-section-title-navy">Top 05 Ofensores - ' + ano + '</div>'
    +       '<img src="' + emp.logo + '" class="sin-emp-logo-sm" crossorigin="anonymous" alt="' + emp.label + '">'
    +     '</div>'
    +     '<div class="sin-hbar-full"><canvas id="sin-hbar2-chart"></canvas></div>'
    +   '</div>'
    + '</div>'
    + sinFooter(analista)
    + '</div>';
}

// ── PLANO DE ACAO ─────────────────────────────────────────────────────────────
function sinSlidePlanoHTML(empId, planoData, mes, ano, analista) {
  var emp   = sinGetEmpresa(empId);
  var mesIdx = MESES.indexOf(mes);
  var prox   = mes;
  var sinQt  = planoData.quantidade       || "---";
  var tipo   = planoData.principalOfensor || "---";
  var texto  = planoData.texto          || "";

  var linhas  = texto.split("\n").filter(function(l) { return l.trim(); });
  var bullets = linhas.length === 0
    ? '<span class="slide-plano__empty">Nenhum plano preenchido.</span>'
    : '<ul>' + linhas.map(function(l) { return "<li>" + l + "</li>"; }).join("") + '</ul>';

  return '<div class="slide">'
    + sinHeader()
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-shrink:0">'
    +   '<div class="slide-plano__title">Plano de Acao</div>'
    +   '<img src="' + emp.logo + '" style="height:36px;width:auto;object-fit:contain" crossorigin="anonymous" alt="' + emp.label + '">'
    + '</div>'
    + '<div class="slide-plano__table">'
    +   '<div class="slide-plano__table-hd">' + fw("Principal Ofensor") + '</div>'
    +   '<div class="slide-plano__table-type">' + fw(tipo) + '</div>'
    +   '<div class="slide-plano__table-row">'
    +     '<div class="slide-plano__table-cell"><strong>Sinistros:</strong> ' + sinQt + '</div>'
    +   '</div>'
    +   '<div class="slide-plano__table-sub">' + fw("Plano de Acao " + prox) + '</div>'
    + '</div>'
    + '<div class="slide-plano__actions">' + bullets + '</div>'
    + sinFooter(analista)
    + '</div>';
}