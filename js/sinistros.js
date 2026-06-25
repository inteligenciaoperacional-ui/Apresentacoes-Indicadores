// sinistros-constants.js — configurações do módulo Sinistros

var SIN_EMPRESAS = [
  {
    id: "1001",
    label: "1001",
    logo: "https://res.cloudinary.com/dln0ctawv/image/upload/v1779671790/1001_qisjtr_1_pzpzqw.png",
    cor: "#9e9e9e",
    corLabel: "#1d3061",
    segmentos: ["rodo", "fret", "urb"],
  },
  {
    id: "catarinense",
    label: "Catarinense",
    logo: "https://res.cloudinary.com/dln0ctawv/image/upload/v1779671813/AVC_zk4pe9_k4jgau.png",
    cor: "#03a5a5",
    corLabel: "#ffffff",
    segmentos: ["rodo", "fret"],
  },
  {
    id: "cometa",
    label: "Cometa",
    logo: "https://res.cloudinary.com/dln0ctawv/image/upload/v1779671826/COM_folzln_ddghpr.png",
    cor: "#4a90d9",
    corLabel: "#ffffff",
    segmentos: ["rodo", "fret"],
  },
];

var SIN_SEG_LABEL = { rodo: "Rodoviario", fret: "Fretamento", urb: "Urbano" };

// ── Inicialização do estado ───────────────────────────
function sinInitGeral() {
  return {
    sinistros: "", kmSinistro: "",
    meses: Object.fromEntries(MESES.map(function(m) {
      return [m, { operacao: "", manutencao: "", km: "", meta: "" }];
    })),
  };
}

function sinInitSegmento() {
  return {
    sinistros: "", kmSinistro: "", meta: "",
    meses: Object.fromEntries(MESES.map(function(m) {
      return [m, { sinistros: "", km: "", meta: "" }];
    })),
    gravidade: { leve: "", medio: "", grave: "", gravissimo: "" },
    tipos: Array.from({ length: 5 }, function() { return { tipo: "", qtd: "" }; }),
  };
}

function sinInitFretUrb() {
  var seg = sinInitSegmento();
  seg.ofensoresMes = Array.from({ length: 10 }, function() { return { nome: "", qtd: "", km: "" }; });
  seg.top5Ano      = Array.from({ length:  5 }, function() { return { nome: "", qtd: "", km: "" }; });
  return seg;
}

function sinInitEmpresa(emp) {
  var d = {
    geral:    sinInitGeral(),
    rodo:     sinInitSegmento(),
    fret:     sinInitFretUrb(),
    planoAcao: { principalOfensor: "", quantidade: "", texto: "" },
  };
  if (emp.segmentos.indexOf("urb") !== -1) d.urb = sinInitFretUrb();
  return d;
}

// ── Sequência de slides ───────────────────────────────
function buildSinistrosSlides() {
  var slides = [{ type: "sin-cover" }];
  SIN_EMPRESAS.forEach(function(emp) {
    slides.push({ type: "sin-geral",     empresa: emp.id });
    slides.push({ type: "sin-segmento",  empresa: emp.id, seg: "rodo" });
    slides.push({ type: "sin-segmento",  empresa: emp.id, seg: "fret" });
    slides.push({ type: "sin-ofensores", empresa: emp.id, seg: "fret" });
    if (emp.segmentos.indexOf("urb") !== -1) {
      slides.push({ type: "sin-segmento",  empresa: emp.id, seg: "urb" });
      slides.push({ type: "sin-ofensores", empresa: emp.id, seg: "urb" });
    }
    slides.push({ type: "sin-plano", empresa: emp.id });
  });
  slides.push({ type: "contra-capa" });
  return slides;
}

function sinGetEmpresa(id) {
  return SIN_EMPRESAS.filter(function(e) { return e.id === id; })[0] || SIN_EMPRESAS[0];
}// sinistros-chart.js — graficos do modulo Sinistros

Chart.register(ChartDataLabels);

var _sinMainChart  = null;
var _sinDonutChart = null;
var _sinHBarChart  = null;

function sinGetEmpCor(empId) {
  var emp = sinGetEmpresa(empId);
  return { bar: emp.cor, label: emp.corLabel };
}

// ── 1. Grafico principal: barras empilhadas + 2 linhas ──────────────────────
function _sinMakeMainConfig(mesesAtivos, opData, manutData, metaData, kmData, animOn, barColor, barLabel) {
  if (!barColor) barColor = "#9e9e9e";
  if (!barLabel) barLabel = "#1d3061";
  var withManut = manutData && manutData.some(function(v) { return v > 0; });

  var datasets = [];

  // 1. Manutencao SEMPRE (zeros = invisivel, mas indice fixo = ds[0])
  var zeroArr = mesesAtivos.map(function() { return 0; });
  datasets.push({
    type: "bar", label: "Sinistros Manutencao",
    data: (manutData && manutData.length > 0) ? manutData : zeroArr,
    backgroundColor: "#e57373",
    stack: "sin", order: 2, yAxisID: "yLeft",
    datalabels: {
      anchor: "center", align: "center",
      color: "#ffffff", font: { size: 9, weight: "bold" },
      formatter: function(v) { return v > 0 ? v.toLocaleString("pt-BR") : null; }
    }
  });

  // 2. Operacao por CIMA da Manutencao (cinza da empresa)
  datasets.push({
    type: "bar", label: "Sinistros Operacao",
    data: opData, backgroundColor: barColor,
    stack: "sin", order: 2, yAxisID: "yLeft",
    datalabels: {
      anchor: "center", align: "center",
      color: barLabel, font: { size: 9, weight: "bold" },
      formatter: function(v) { return v > 0 ? v.toLocaleString("pt-BR") : null; }
    }
  });

  // 3. Km/Sinistro — linha azul solida com labels ACIMA do ponto
  datasets.push({
    type: "line", label: "Km Sinistro",
    data: kmData,
    borderColor: "#1d3061", backgroundColor: "#1d3061",
    pointBackgroundColor: "#1d3061", pointRadius: 2, tension: 0.2,
    yAxisID: "yRight", order: 1,
    datalabels: {
      clip: false, anchor: "end", offset: 4,
      align: function(ctx) {
        var km   = ctx.dataset.data[ctx.dataIndex] || 0;
        var ds   = ctx.chart.data.datasets;
        var metaDs = ds[ds.length - 1];
        var meta = metaDs ? (metaDs.data[ctx.dataIndex] || 0) : 0;
        return km >= meta ? "top" : "bottom";
      },
      color: "#1d3061", font: { size: 9, weight: "bold" },
      formatter: function(v) { return v > 0 ? v.toLocaleString("pt-BR") : null; }
    }
  });

  // 4. Meta — linha vermelha solida com labels dinamicos (top/bottom conforme posicao)
  datasets.push({
    type: "line", label: "Meta",
    data: metaData,
    borderColor: "#c0392b", backgroundColor: "#c0392b",
    pointBackgroundColor: "#c0392b", pointRadius: 2, tension: 0,
    yAxisID: "yRight", order: 0,
    datalabels: {
      clip: false, anchor: "end", offset: 4,
      align: function(ctx) {
        var meta = ctx.dataset.data[ctx.dataIndex] || 0;
        var ds   = ctx.chart.data.datasets;
        var kmDs = ds[ds.length - 2];
        var km   = kmDs ? (kmDs.data[ctx.dataIndex] || 0) : 0;
        return meta >= km ? "top" : "bottom";
      },
      color: "#c0392b", font: { size: 9, weight: "bold" },
      formatter: function(v) { return v > 0 ? v.toLocaleString("pt-BR") : null; }
    }
  });

  return {
    type: "bar",
    data: { labels: mesesAtivos, datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: animOn ? undefined : false,
      plugins: {
        legend: {
          display: true, position: "bottom",
          labels: {
            font: { size: 8 },
            boxWidth: 5,
            boxHeight: 5,
            padding: 10,
            usePointStyle: true,
            pointStyle: "circle",
            color: "#999"
          }
        },
        datalabels: { display: function(ctx) { return ctx.dataset.data[ctx.dataIndex] > 0; } }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 }, color: "#777" } },
        yLeft: {
          type: "linear", position: "left",
          stacked: true, display: false,
          grid: { display: false }, ticks: { display: false },
          afterDataLimits: function(axis) { if (axis.max > 0) axis.max *= 1.35; }
        },
        yRight: {
          type: "linear", position: "right", display: false,
          grid: { display: false }, ticks: { display: false },
          afterDataLimits: function(axis) {
            if (axis.max <= 0) return;
            var range = Math.max(axis.max - axis.min, 1);
            axis.max += range * 0.15;   // pequena margem no topo
            axis.min -= range * 0.75;   // margem grande embaixo → empurra linhas para cima
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  };
}

// Extrai arrays de dados a partir do objeto de meses
function _sinExtractData(mesesObj, mesesAtivos, withManut) {
  return {
    manut: mesesAtivos.map(function(m) { return parseN((mesesObj[m] || {}).manutencao || "") || 0; }),
    op:    mesesAtivos.map(function(m) { var d = mesesObj[m] || {}; return parseN(d.operacao || d.sinistros || ""); }),
    km:    mesesAtivos.map(function(m) { return parseN((mesesObj[m] || {}).km   || ""); }),
    meta:  mesesAtivos.map(function(m) { return parseN((mesesObj[m] || {}).meta || ""); }),
  };
}

// Indice fixo: ds[0]=Manut, ds[1]=Op, ds[2]=Km, ds[3]=Meta
function sinInitMainChart(canvasId, mesesObj, mesesAtivos, empId, withManut, animOn) {
  if (_sinMainChart) { _sinMainChart.destroy(); _sinMainChart = null; }
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var bc = sinGetEmpCor(empId);
  var d  = _sinExtractData(mesesObj, mesesAtivos, withManut);
  var cfg = _sinMakeMainConfig(mesesAtivos, d.op, d.manut, d.meta, d.km, animOn !== false, bc.bar, bc.label);
  cfg.options.devicePixelRatio = window.devicePixelRatio * 2 || 2;
  _sinMainChart = new Chart(canvas, cfg);
}

// Atualiza datasets por indice fixo: ds[0]=Manut, ds[1]=Op, ds[2]=Km, ds[3]=Meta
function sinUpdateMainChart(mesesObj, mesesAtivos, withManut) {
  if (!_sinMainChart) return;
  var ds = _sinMainChart.data.datasets;
  var d  = _sinExtractData(mesesObj, mesesAtivos, withManut);
  if (ds[0]) ds[0].data = d.manut;  // Manutencao (sempre ds[0])
  if (ds[1]) ds[1].data = d.op;     // Operacao   (sempre ds[1])
  if (ds[2]) ds[2].data = d.km;     // Km/Sinistro (sempre ds[2])
  if (ds[3]) ds[3].data = d.meta;   // Meta        (sempre ds[3])
  _sinMainChart.update("none");
}

function sinCreateMainChartSync(canvas, mesesObj, mesesAtivos, empId, withManut) {
  var bc = sinGetEmpCor(empId);
  var d  = _sinExtractData(mesesObj, mesesAtivos, withManut);
  var cfg = _sinMakeMainConfig(mesesAtivos, d.op, d.manut, d.meta, d.km, false, bc.bar, bc.label);
  cfg.options.devicePixelRatio = 4;
  return new Chart(canvas, cfg);
}

// ── 2. Rosca de gravidade ────────────────────────────────────────────────────
function _sinDonutColors(cor) {
  var map = {
    "#9e9e9e": ["#d4d4d4", "#9e9e9e", "#5e5e5e", "#2e2e2e"],
    "#03a5a5": ["#a8e6e6", "#03a5a5", "#027070", "#014040"],
    "#4a90d9": ["#b8d4f0", "#4a90d9", "#2563a8", "#143566"]
  };
  return map[cor] || ["#d0d0d0", "#909090", "#505050", "#202020"];
}

function _sinMakeDonutConfig(gravidade, animOn, corEmpresa) {
  var l = parseN(gravidade.leve || "");
  var m = parseN(gravidade.medio || "");
  var g = parseN(gravidade.grave || "");
  var gg = parseN(gravidade.gravissimo || "");
  var total = l + m + g + gg || 1;
  var bgColors = _sinDonutColors(corEmpresa || "#9e9e9e");

  return {
    type: "doughnut",
    data: {
      labels: ["Leve", "Medio", "Grave", "Gravissimo"],
      datasets: [{
        data: [l, m, g, gg],
        backgroundColor: bgColors,
        borderWidth: 2, borderColor: "#ffffff"
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: animOn !== false ? undefined : false,
      cutout: "38%",
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: "center", align: "center",
          color: function(ctx) { return ctx.dataIndex >= 2 ? "#ffffff" : "#333333"; },
          font: { size: 12, weight: "bold" },
          formatter: function(v) { return v > 0 ? Math.round(v / total * 100) + "%" : ""; },
          display: function(ctx) { return ctx.dataset.data[ctx.dataIndex] > 0; }
        }
      }
    },
    plugins: [ChartDataLabels]
  };
}

function sinInitDonutChart(canvasId, gravidade, animOn, corEmpresa) {
  if (_sinDonutChart) { _sinDonutChart.destroy(); _sinDonutChart = null; }
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var cfg = _sinMakeDonutConfig(gravidade, animOn, corEmpresa);
  cfg.options.devicePixelRatio = window.devicePixelRatio * 2 || 2;
  _sinDonutChart = new Chart(canvas, cfg);
}

function sinCreateDonutChartSync(canvas, gravidade, corEmpresa) {
  var cfg = _sinMakeDonutConfig(gravidade, false, corEmpresa);
  cfg.options.devicePixelRatio = 4;
  return new Chart(canvas, cfg);
}

// ── 3. Barras horizontais ────────────────────────────────────────────────────
function _sinMakeHBarConfig(items, labelField, valueField, corBarra, animOn, kmField) {
  if (!labelField) labelField = "tipo";
  if (!valueField) valueField = "qtd";
  if (!corBarra)   corBarra   = "#9e9e9e";
  var validItems = items.filter(function(i) { return i[labelField]; });
  var labels = validItems.map(function(i) { return i[labelField] || ""; });
  var values = validItems.map(function(i) { return parseN(i[valueField] || ""); });
  var kmVals = kmField ? validItems.map(function(i) { return parseN(i[kmField] || ""); }) : [];

  var kmPlugin = {
    id: "kmLabel",
    afterDraw: function(chart) {
      if (!kmVals.length) return;
      var ctx   = chart.ctx;
      var yAxis = chart.scales.y;
      var xEnd  = chart.chartArea.left - 6;
      kmVals.forEach(function(km, i) {
        if (!km) return;
        var cy = yAxis.getPixelForTick(i);
        ctx.save();
        ctx.fillStyle    = "#1d3061";
        ctx.font         = "600 8px system-ui,sans-serif";
        ctx.textAlign    = "right";
        ctx.textBaseline = "top";
        ctx.fillText(km.toLocaleString("pt-BR"), xEnd, cy + 4);
        ctx.restore();
      });
    }
  };

  return {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        data: values, backgroundColor: corBarra,
        datalabels: {
          clip: false,
          anchor: "end", align: "start",
          color: "#ffffff", font: { size: 10, weight: "bold" },
          formatter: function(v) {
            return v > 0 ? v.toLocaleString("pt-BR") : null;
          }
        }
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true, maintainAspectRatio: false,
      animation: animOn !== false ? undefined : false,
      plugins: {
        legend: { display: false },
        datalabels: {
          display: function(ctx) { return ctx.dataset.data[ctx.dataIndex] > 0; }
        }
      },
      scales: {
        x: { display: false, grid: { display: false }, beginAtZero: true },
        y: { grid: { display: false }, ticks: { font: { size: 9 }, color: "#555" } }
      }
    },
    plugins: [kmPlugin]
  };
}

function sinInitHBarChart(canvasId, items, labelField, valueField, corBarra, animOn) {
  if (_sinHBarChart) { _sinHBarChart.destroy(); _sinHBarChart = null; }
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var cfg = _sinMakeHBarConfig(items, labelField, valueField, corBarra, animOn);
  cfg.options.devicePixelRatio = window.devicePixelRatio * 2 || 2;
  _sinHBarChart = new Chart(canvas, cfg);
}

function sinCreateHBarChartSync(canvas, items, labelField, valueField, corBarra, kmField) {
  var cfg = _sinMakeHBarConfig(items, labelField, valueField, corBarra, false, kmField);
  cfg.options.devicePixelRatio = 4;
  return new Chart(canvas, cfg);
}

function sinDestroyAllCharts() {
  if (_sinMainChart)  { _sinMainChart.destroy();  _sinMainChart  = null; }
  if (_sinDonutChart) { _sinDonutChart.destroy(); _sinDonutChart = null; }
  if (_sinHBarChart)  { _sinHBarChart.destroy();  _sinHBarChart  = null; }
}// sinistros-slides.js — HTML dos slides do modulo Sinistros

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
    + '<img src="' + LOGO_IO + '" class="slide-logo-io" crossorigin="anonymous" alt="IO">'
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
    +   '<img src="' + LOGO_IO_CAPA + '" class="slide-cover__logo-io" crossorigin="anonymous" alt="IO">'
    + '</div>'
    + '<div class="slide-cover__title">Sinistros</div>'
    + '<div class="slide-cover__period">' + MESES_FULL[MESES.indexOf(mes)] + ' / ' + ano + '</div>'
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
}// sinistros-screens.js — formularios do modulo Sinistros

// ── STEP 1 ────────────────────────────────────────────
function sinStepMonthHTML(mes, ano, analista) {
  var mOpts = MESES.map(function(m) { return '<option value="' + m + '"' + (m === mes ? " selected" : "") + ">" + m + "</option>"; }).join("");
  var aOpts = ANOS.map(function(a)  { return '<option value="' + a + '"' + (a === ano ? " selected" : "") + ">" + a + "</option>"; }).join("");

  return '<nav class="nav">'
    + '<div class="nav__left">'
    +   '<button class="btn btn--ghost" data-action="sin-go-home">&#8592; Inicio</button>'
    +   '<span class="nav__title">Sinistros</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:10px">'
    +   '<div class="nav__steps">'
    +     '<span class="nav__step nav__step--active">1</span>'
    +     '<span class="nav__step">2</span>'
    +     '<span class="nav__step">3</span>'
    +   '</div>'
    + '</div>'
    + '</nav>'
    + '<div style="min-height:calc(100vh - 50px);display:flex;align-items:center;justify-content:center;background:#f5f6fa">'
    +   '<div style="background:#fff;border-radius:16px;box-shadow:0 2px 24px rgba(0,0,0,.1);padding:40px 48px;width:400px;display:flex;flex-direction:column;gap:20px">'
    +     '<div>'
    +       '<h2 style="font-size:22px;font-weight:700;color:#1d3061;margin:0 0 4px">Configurar Apresentacao</h2>'
    +       '<p style="font-size:13px;color:#999;margin:0">Periodo e analista responsavel</p>'
    +     '</div>'
    +     '<div style="display:flex;flex-direction:column;gap:14px">'
    +       '<div>'
    +         '<label class="field-label">MES</label>'
    +         '<select class="field-input" data-sin-root="mes">' + mOpts + '</select>'
    +       '</div>'
    +       '<div>'
    +         '<label class="field-label">ANO</label>'
    +         '<select class="field-input" data-sin-root="ano">' + aOpts + '</select>'
    +       '</div>'
    +       '<div>'
    +         '<label class="field-label">ANALISTA RESPONSAVEL</label>'
    +         '<input class="field-input" type="text" value="' + analista + '" placeholder="Ex: Kelvin Santos" data-sin-root="analista">'
    +       '</div>'
    +     '</div>'
    +     '<button class="btn btn--primary" style="width:100%;padding:12px;font-size:15px" data-action="sin-go-step" data-step="2">Proximo &#8594;</button>'
    +   '</div>'
    + '</div>';
}

// KPI cards do preview (coluna direita Step 2)
function sinPreviewKpiBox(label, value, elId) {
  return '<div style="border:1px solid #e0e0e0;border-radius:8px;padding:8px 12px">'
    + '<div style="font-size:10px;color:#aaa;font-weight:600;margin-bottom:2px">' + label + '</div>'
    + '<div id="' + (elId||'') + '" style="font-size:18px;font-weight:700;color:#1d3061">' + (fmtBr(value) || '\u2014') + '</div>'
    + '</div>';
}

function sinPreviewKpiCards(subTab, dados) {
  if (!dados || !dados.geral) return "";
  var sin = "", km = "";
  if (subTab === "geral") {
    sin = dados.geral.sinistros;
    km  = dados.geral.kmSinistro;
  } else if (subTab !== "plano" && dados[subTab]) {
    sin = dados[subTab].sinistros;
    km  = dados[subTab].kmSinistro;
  } else {
    return "";
  }
  return '<div id="sin-kpi-preview-wrap" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0;flex-shrink:0">'
    + sinPreviewKpiBox("Sinistros:", sin, "sin-pkpi-sin")
    + sinPreviewKpiBox("Km/Sinistro:", km, "sin-pkpi-km")
    + '</div>';
}

// ── STEP 2 — formularios de dados ─────────────────────
function sinStepDataHTML(sinState) {
  var mes      = sinState.mes;
  var ano      = sinState.ano;
  var empresa  = sinState.empresa;
  var subTab   = sinState.subTab || "geral";
  var mesIdx   = MESES.indexOf(mes);
  var mesesAt  = MESES.slice(0, mesIdx + 1);
  var emp      = sinGetEmpresa(empresa === "plano" ? "1001" : empresa);
  var dados    = sinState.dados[empresa] || {};

  var subTabKeys   = empresa === "plano" ? [] : ["geral"].concat(emp.segmentos);
  var subTabLabels = { geral:"Geral", rodo:"Rodoviario", fret:"Fretamento", urb:"Urbano" };

  var empTabs = SIN_EMPRESAS.map(function(e) {
    var active = e.id === empresa;
    var styleAtivo   = 'background:' + e.cor + ';border-color:' + e.cor + ';color:' + e.corLabel + ';';
    var styleInativo = 'border-color:' + e.cor + ';color:' + e.cor + ';';
    return '<button class="sin-form-tab' + (active ? " sin-form-tab--active" : "") + '"'
      + ' style="' + (active ? styleAtivo : styleInativo) + '"'
      + ' data-action="sin-set-empresa" data-empresa="' + e.id + '">' + e.label + '</button>';
  }).join("")
  + '<button class="sin-form-tab' + (empresa === "plano" ? " sin-form-tab--active" : "") + '"'
  + ' data-action="sin-set-empresa" data-empresa="plano">&#128203; Plano de Acao</button>';

  var subTabs = empresa === "plano" ? "" : subTabKeys.map(function(k) {
    return '<span class="sin-sub-tab' + (k === subTab ? " sin-sub-tab--active" : "") + '"'
      + ' data-action="sin-set-subtab" data-subtab="' + k + '">' + subTabLabels[k] + '</span>';
  }).join("");

  var leftContent = "";
  if (empresa === "plano") {
    leftContent = sinFormPlanoGlobalHTML(sinState);
  } else if (subTab === "geral") {
    leftContent = sinFormGeralHTML(dados.geral, mesesAt);
  } else {
    leftContent = sinFormSegmentoHTML(subTab, dados[subTab], mesesAt, emp);
  }

  var nav = '<nav class="nav">'
    + '<div class="nav__left">'
    +   '<button class="btn btn--ghost" data-action="sin-go-step" data-step="1">&#8592; Voltar</button>'
    +   '<span class="nav__title">Sinistros</span>'
    +   '<span class="nav__period">' + mes + '/' + ano + '</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:8px">'
    +   '<button class="btn btn--ghost" data-action="sin-importar-planos" style="padding:3px 12px;font-size:11px">&#128203; Importar Planos</button>'
    +   '<button class="btn btn--ghost" onclick="_sinCopiarLinkPlano(this)" style="padding:3px 12px;font-size:11px" title="Copiar link do Plano de Ação">&#128279; Link Plano</button>'
    +   '<button class="btn btn--ghost" id="btn-sin-salvar-fb" data-action="sin-salvar-firebase" style="padding:3px 12px;font-size:11px">&#9729;&#65039; Salvar</button>'
    +   '<button class="btn btn--ghost" id="btn-sin-sheets" data-action="sin-gerar-sheets" title="Enviar para Sheets" style="padding:3px 8px;font-size:11px"><img src="' + LOGO_SHEETS + '" style="height:18px;vertical-align:middle" alt="Sheets"></button>'
    +   '<a href="' + SHEETS_URL + '" target="_blank" title="Abrir planilha" style="display:flex;align-items:center;opacity:.8" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.8"><img src="' + LOGO_SHEETS + '" style="height:24px;width:auto" alt="Abrir Sheets"></a>'
    +   '<div class="nav__steps">'
    +     '<span class="nav__step">1</span>'
    +     '<span class="nav__step nav__step--active">2</span>'
    +     '<span class="nav__step">3</span>'
    +   '</div>'
    + '</div>'
    + '</nav>';

  return nav
    + '<div style="display:flex;flex-direction:column;padding:20px 24px;height:calc(100vh - 50px);overflow:hidden;box-sizing:border-box">'
    +   '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-shrink:0">'
    +     '<div>'
    +       '<h3 class="step-data__title">Preenchimento de Dados</h3>'
    +       '<p class="step-data__sub">Preencha as informacoes de cada empresa</p>'
    +     '</div>'
    +     '<span style="background:var(--navy);color:#fff;font-weight:700;font-size:13px;padding:6px 14px;border-radius:8px">' + mes + '/' + ano + '</span>'
    +   '</div>'
    +   '<div style="margin:8px 0 4px"><span style="font-size:10px;font-weight:700;color:#aaa;letter-spacing:1px">EMPRESA</span></div>'
    +   '<div class="sin-form-tabs">' + empTabs + '</div>'
    +   '<div class="sin-sub-tabs">' + subTabs + '</div>'
    +   '<div style="display:flex;gap:20px;flex:1;min-height:0;margin-top:8px">'
    +     '<div style="flex:0 0 44%;overflow-y:auto;min-width:0">' + leftContent + '</div>'
    +     '<div style="flex:1;min-width:420px;background:#fff;border-radius:12px;padding:16px;border:1px solid #eee;display:flex;flex-direction:column">'
    +       (empresa === "plano"
          ? '<div class="preview-hd">Plano de Acao</div>'
          +   '<div class="preview-sub">Preencha o ofensor e quantidade de cada empresa</div>'
          +   '<div style="margin-top:16px;font-size:12px;color:#888;line-height:1.8">'
          +     '&#128204; Os dados preenchidos aqui ser&atilde;o exibidos automaticamente<br>'
          +     'no <b>plano-de-acao-sinistros.html</b> para o time regional.<br><br>'
          +     '&#128203; Ap&oacute;s o time preencher as a&ccedil;&otilde;es, clique em<br>'
          +     '<b>Importar Planos</b> na barra acima.'
          +   '</div>'
          : '<div class="preview-hd">Preview &mdash; ' + emp.label + ' &middot; ' + (subTabLabels[subTab] || subTab) + '</div>'
          +   '<div class="preview-sub">' + (subTabLabels[subTab] || subTab) + ' - ' + ano + '</div>'
          +   sinPreviewKpiCards(subTab, dados)
          +   '<div style="flex:1;min-height:220px;margin-top:8px"><canvas id="sin-preview-chart"></canvas></div>'
        )
    +     '</div>'
    +   '</div>'
    +   '<div style="display:flex;justify-content:space-between;padding-top:12px;margin-top:auto;flex-shrink:0;border-top:1px solid #eee">'
    +     '<button class="btn btn--ghost" data-action="sin-go-step" data-step="1">&#8592; Voltar</button>'
    +     '<button class="btn btn--primary" data-action="sin-go-step" data-step="3">Visualizar Apresenta&ccedil;&atilde;o &#8594;</button>'
    +   '</div>'
    + '</div>';
}
// Formulario Geral
function sinFormGeralHTML(geral, mesesAt) {
  var monthRows = mesesAt.map(function(m) {
    var d = geral.meses[m] || {};
    return '<div class="sin-monthly-label">' + m + '</div>'
      + '<input class="sin-monthly-input" type="text" value="' + (d.operacao || "") + '" placeholder="0" data-sin-geral-mes="' + m + '" data-sin-geral-field="operacao">'
      + '<input class="sin-monthly-input" type="text" value="' + (d.manutencao || "") + '" placeholder="0" data-sin-geral-mes="' + m + '" data-sin-geral-field="manutencao">'
      + '<input class="sin-monthly-input" type="text" value="' + (d.km || "") + '" placeholder="0" data-sin-geral-mes="' + m + '" data-sin-geral-field="km">'
      + '<input class="sin-monthly-input" type="text" value="' + (d.meta || "") + '" placeholder="0" data-sin-geral-mes="' + m + '" data-sin-geral-field="meta">';
  }).join("");

  return '<div class="card">'
    + '<div class="section-title">Totais do Ano</div>'
    + '<div class="kpi-grid">'
    +   '<div><label class="field-label">Total Sinistros</label>'
    +     '<input class="field-input" type="text" value="' + (geral.sinistros || "") + '" placeholder="0" data-sin-geral-total="sinistros"></div>'
    +   '<div><label class="field-label">Km/Sinistro</label>'
    +     '<input class="field-input" type="text" value="' + (geral.kmSinistro || "") + '" placeholder="0" data-sin-geral-total="kmSinistro"></div>'
    + '</div>'
    + '</div>'
    + '<div class="card">'
    + '<div class="section-title">Dados Mensais</div>'
    + '<div class="sin-monthly-grid">'
    +   '<div class="sin-monthly-hd">MES</div>'
    +   '<div class="sin-monthly-hd">OPERACAO</div>'
    +   '<div class="sin-monthly-hd sin-monthly-hd--red">MANUTENCAO</div>'
    +   '<div class="sin-monthly-hd">KM/SINISTRO</div>'
    +   '<div class="sin-monthly-hd sin-monthly-hd--red">META</div>'
    +   monthRows
    + '</div>'
    + '</div>';
}

// Formulario Segmento
function sinFormSegmentoHTML(seg, segData, mesesAt, emp) {
  var monthRows = mesesAt.map(function(m) {
    var d = (segData.meses && segData.meses[m]) || {};
    return '<div class="sin-monthly-label">' + m + '</div>'
      + '<input class="sin-monthly-input" type="text" value="' + (d.sinistros || "") + '" placeholder="0" data-sin-seg="' + seg + '" data-sin-seg-mes="' + m + '" data-sin-seg-field="sinistros">'
      + '<input class="sin-monthly-input" type="text" value="' + (d.km || "") + '" placeholder="0" data-sin-seg="' + seg + '" data-sin-seg-mes="' + m + '" data-sin-seg-field="km">'
      + '<input class="sin-monthly-input" type="text" value="' + (d.meta || "") + '" placeholder="0" data-sin-seg="' + seg + '" data-sin-seg-mes="' + m + '" data-sin-seg-field="meta">';
  }).join("");

  var tipos = (segData.tipos || []).map(function(t, i) {
    return '<input class="field-input" type="text" value="' + (t.tipo || "") + '" placeholder="Tipo de acidente" data-sin-seg="' + seg + '" data-sin-tipo-idx="' + i + '" data-sin-tipo-field="tipo">'
      + '<input class="sin-monthly-input" type="text" value="' + (t.qtd || "") + '" placeholder="0" data-sin-seg="' + seg + '" data-sin-tipo-idx="' + i + '" data-sin-tipo-field="qtd">';
  }).join("");

  var grav = segData.gravidade || {};
  var gravHTML = '<div class="kpi-grid">'
    + ['leve','medio','grave','gravissimo'].map(function(g) {
        return '<div><label class="field-label">' + g.charAt(0).toUpperCase() + g.slice(1) + '</label>'
          + '<input class="field-input" type="text" value="' + (grav[g] || "") + '" placeholder="0"'
          + ' data-sin-seg="' + seg + '" data-sin-grav="' + g + '"></div>';
      }).join("")
    + '</div>';

  var ofensoresHTML = "";
  if (seg === "fret" || seg === "urb") {
    var ofMes = (segData.ofensoresMes || []).map(function(o, i) {
      return '<input class="field-input" type="text" value="' + (o.nome || "") + '" placeholder="Nome do ofensor" style="font-size:11px"'
        + ' data-sin-seg="' + seg + '" data-sin-of-idx="' + i + '" data-sin-of-field="nome" data-sin-of-tipo="mes">'
        + '<input class="sin-monthly-input" type="text" value="' + (o.qtd || "") + '" placeholder="0"'
        + ' data-sin-seg="' + seg + '" data-sin-of-idx="' + i + '" data-sin-of-field="qtd" data-sin-of-tipo="mes">'
        + '<input class="sin-monthly-input" type="text" value="' + (o.km || "") + '" placeholder="0"'
        + ' data-sin-seg="' + seg + '" data-sin-of-idx="' + i + '" data-sin-of-field="km" data-sin-of-tipo="mes">';
    }).join("");
    var top5 = (segData.top5Ano || []).map(function(o, i) {
      return '<input class="field-input" type="text" value="' + (o.nome || "") + '" placeholder="Nome" style="font-size:11px"'
        + ' data-sin-seg="' + seg + '" data-sin-of-idx="' + i + '" data-sin-of-field="nome" data-sin-of-tipo="top5">'
        + '<input class="sin-monthly-input" type="text" value="' + (o.qtd || "") + '" placeholder="0"'
        + ' data-sin-seg="' + seg + '" data-sin-of-idx="' + i + '" data-sin-of-field="qtd" data-sin-of-tipo="top5">'
        + '<input class="sin-monthly-input" type="text" value="' + (o.km || "") + '" placeholder="0"'
        + ' data-sin-seg="' + seg + '" data-sin-of-idx="' + i + '" data-sin-of-field="km" data-sin-of-tipo="top5">';
    }).join("");
    ofensoresHTML = '<div class="card">'
      + '<div class="section-title">Ofensores do Mes</div>'
      + '<div style="margin-bottom:12px;background:#f0f4ff;border-radius:8px;padding:12px">'
      +   '<label class="field-label" style="margin-bottom:6px;display:block">&#128203; Cole os contratos copiados do Sheets (1 por linha):</label>'
      +   '<textarea id="sin-paste-of-' + seg + '" rows="4" style="width:100%;padding:8px;border:1px solid #d0d8f0;border-radius:6px;font-size:11px;font-family:monospace;resize:vertical" placeholder="Cole aqui..."></textarea>'
      +   '<button class="btn btn--primary" style="margin-top:8px;padding:5px 16px;font-size:12px"'
      +   ' data-action="sin-processar-ofensores" data-sin-seg="' + seg + '">&#9654; Processar e Preencher</button>'
      + '</div>'
      + '<div class="sin-ofensores-grid">'
      +   '<div class="sin-monthly-hd">NOME</div><div class="sin-monthly-hd">SINISTROS</div><div class="sin-monthly-hd">KM/SIN</div>'
      +   ofMes
      + '</div>'
      + '</div>'
      + '<div class="card">'
      + '<div class="section-title">Top 5 Ofensores do Ano</div>'
      + '<div style="margin-bottom:12px;background:#f0f4ff;border-radius:8px;padding:12px">'
      +   '<label class="field-label" style="margin-bottom:6px;display:block">&#128203; Cole os contratos do ano copiados do Sheets (1 por linha):</label>'
      +   '<textarea id="sin-paste-top5-' + seg + '" rows="4" style="width:100%;padding:8px;border:1px solid #d0d8f0;border-radius:6px;font-size:11px;font-family:monospace;resize:vertical" placeholder="Cole aqui..."></textarea>'
      +   '<button class="btn btn--primary" style="margin-top:8px;padding:5px 16px;font-size:12px"'
      +   ' data-action="sin-processar-top5" data-sin-seg="' + seg + '">&#9654; Processar e Preencher</button>'
      + '</div>'
      + '<div class="sin-ofensores-grid">'
      +   '<div class="sin-monthly-hd">NOME</div><div class="sin-monthly-hd">SINISTROS</div><div class="sin-monthly-hd">KM/SIN</div>'
      +   top5
      + '</div>'
      + '</div>';
  }

  return '<div class="card">'
    + '<div class="section-title">' + (SIN_SEG_LABEL[seg] || seg) + ' — Totais</div>'
    + '<div class="kpi-grid">'
    +   '<div><label class="field-label">Sinistros</label>'
    +     '<input class="field-input" type="text" value="' + (segData.sinistros || "") + '" placeholder="0" data-sin-seg="' + seg + '" data-sin-seg-total="sinistros"></div>'
    +   '<div><label class="field-label">Km/Sinistro</label>'
    +     '<input class="field-input" type="text" value="' + (segData.kmSinistro || "") + '" placeholder="0" data-sin-seg="' + seg + '" data-sin-seg-total="kmSinistro"></div>'
    + '</div>'
    + '</div>'
    + '<div class="card">'
    + '<div class="section-title">Dados Mensais</div>'
    + '<div class="sin-monthly-grid no-manut">'
    +   '<div class="sin-monthly-hd">MES</div>'
    +   '<div class="sin-monthly-hd">SINISTROS</div>'
    +   '<div class="sin-monthly-hd">KM/SINISTRO</div>'
    +   '<div class="sin-monthly-hd sin-monthly-hd--red">META</div>'
    +   monthRows
    + '</div>'
    + '</div>'
    + '<div class="card">'
    + '<div class="section-title">Gravidade dos Sinistros</div>'
    + gravHTML
    + '</div>'
    + '<div class="card">'
    + '<div class="section-title">Top 5 Tipos de Acidente</div>'
    + '<div class="sin-ofensores-grid" style="grid-template-columns:1fr 80px">'
    +   '<div class="sin-monthly-hd">TIPO</div><div class="sin-monthly-hd">QTDE</div>'
    +   tipos
    + '</div>'
    + '</div>'
    + ofensoresHTML;
}

// Formulario Plano de Acao Global (todas as empresas numa tela)
function sinFormPlanoGlobalHTML(sinState) {
  return SIN_EMPRESAS.map(function(emp) {
    var plano = sinState.dados[emp.id] ? sinState.dados[emp.id].planoAcao : {};
    return '<div class="card" style="margin-bottom:14px">'
      + '<div class="section-title" style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'
      +   '<img src="' + emp.logo + '" style="height:32px;object-fit:contain" alt="' + emp.label + '">'
      + '</div>'
      + '<div class="kpi-grid">'
      +   '<div><label class="field-label">Principal Ofensor</label>'
      +     '<input class="field-input" type="text" value="' + (plano.principalOfensor || "") + '"'
      +     ' placeholder="Nome do ofensor" data-sin-plano="principalOfensor" data-sin-plano-emp="' + emp.id + '"></div>'
      +   '<div><label class="field-label">Quantidade de Sinistros</label>'
      +     '<input class="field-input" type="text" value="' + (plano.quantidade || "") + '"'
      +     ' placeholder="0" data-sin-plano="quantidade" data-sin-plano-emp="' + emp.id + '"></div>'
      + '<div id="sin-plano-texto-' + emp.id + '" style="margin-top:12px">'
      +   '<div style="color:#bbb;font-size:12px;font-style:italic">&#9203; Carregando texto...</div>'
      + '</div>'
      + '</div>';
  }).join("")
  + '';
}

// Formulario Plano individual (mantido por compatibilidade)
function sinFormPlanoHTML(plano) {
  return '<div class="card">'
    + '<div class="section-title">Plano de Acao</div>'
    + '<div class="kpi-grid">'
    +   '<div><label class="field-label">Principal Ofensor</label>'
    +     '<input class="field-input" type="text" value="' + (plano.principalOfensor || "") + '" placeholder="Nome do ofensor" data-sin-plano="principalOfensor"></div>'
    +   '<div><label class="field-label">Quantidade de Sinistros</label>'
    +     '<input class="field-input" type="text" value="' + (plano.quantidade || "") + '" placeholder="0" data-sin-plano="quantidade"></div>'
    + '</div>'
    + '</div>';
}

// ── STEP 3 — preview ──────────────────────────────────
function sinStepPreviewHTML(slides, slideIdx, mes, ano) {
  var total = slides.length;
  var thumbLabel = function(s) {
    if (s.type === "sin-cover")     return "Capa";
    if (s.type === "contra-capa")   return "Contra\nCapa";
    if (s.type === "sin-geral")     return s.empresa + "\nGeral";
    if (s.type === "sin-segmento")  return s.empresa + "\n" + (SIN_SEG_LABEL[s.seg] || s.seg);
    if (s.type === "sin-ofensores") return s.empresa + "\nOfensores";
    if (s.type === "sin-plano")     return s.empresa + "\nPlano";
    return "";
  };

  var thumbsHTML = slides.map(function(s, i) {
    return "<div class=\"thumb" + (i === slideIdx ? " thumb--active" : "") + "\" data-action=\"sin-go-slide\" data-idx=\"" + i + "\">"
      + "<div class=\"thumb__preview\" style=\"white-space:pre-line\">" + thumbLabel(s) + "</div>"
      + "<div class=\"thumb__num\">" + (i + 1) + "</div>"
      + "</div>";
  }).join("");

  var nav = "<div class=\"preview-bar\">"
    + "<div class=\"preview-bar__left\">"
    +   "<button class=\"preview-bar__arrow\" style=\"font-size:13px;padding:4px 12px\" data-action=\"sin-go-step\" data-step=\"2\">&#8592; Voltar</button>"
    +   "<button class=\"preview-bar__arrow\" style=\"font-size:13px;padding:4px 12px\" data-action=\"sin-go-home\">Inicio</button>"
    +   "<span class=\"preview-bar__info\">Sinistros &nbsp;&mdash;&nbsp; Slide " + (slideIdx + 1) + " / " + total + " &nbsp;&mdash;&nbsp; " + mes + "/" + ano + "</span>"
    + "</div>"
    + "<div class=\"preview-bar__nav\">"
    +   "<button class=\"preview-bar__arrow\" data-action=\"sin-prev-slide\">&#8592;</button>"
    +   "<button class=\"preview-bar__arrow\" data-action=\"sin-next-slide\">&#8594;</button>"
    + "</div>"
    + "<button class=\"preview-bar__arrow\" id=\"btn-sin-pdf\" data-action=\"sin-gerar-pdf\" style=\"font-size:12px;padding:4px 14px\">&#128196; Gerar PDF</button>"
    + "<button class=\"preview-bar__arrow\" id=\"btn-sin-sheets3\" data-action=\"sin-gerar-sheets\" title=\"Enviar para Sheets\" style=\"padding:4px 8px;margin-left:4px\"><img src=\"" + LOGO_SHEETS + "\" style=\"height:20px;vertical-align:middle\" alt=\"Sheets\"></button>"
    + "<a href=\"" + SHEETS_URL + "\" target=\"_blank\" title=\"Abrir planilha\" style=\"display:flex;align-items:center;padding:4px 8px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.3);border-radius:6px;font-size:11px;color:#fff;text-decoration:none;margin-left:2px\">&#8599; Abrir</a>"
    + "</div>";

  var body = "<div style=\"display:flex;flex:1;overflow:hidden;min-height:0\">"
    + "<div class=\"thumbs\">" + thumbsHTML + "</div>"
    + "<div class=\"slide-canvas\">"
    +   "<div class=\"slide-frame\" id=\"sin-slide-frame\"></div>"
    + "</div>"
    + "</div>";

  return "<div style=\"height:100vh;background:#14141e;display:flex;flex-direction:column;overflow:hidden\">"
    + nav + body
    + "</div>";
}// sinistros-pdf.js — geracao de PDF do modulo Sinistros

async function sinGerarPDF(sinState) {
  var btn = document.getElementById("btn-sin-pdf");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Gerando..."; }

  try {
    var mesIdx  = MESES.indexOf(sinState.mes);
    var mesesAt = MESES.slice(0, mesIdx + 1);
    var slides  = sinState.slides || buildSinistrosSlides();
    var { jsPDF } = window.jspdf;
    var pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [960, 540], hotfixes: ["px_scaling"] });

    var box = document.createElement("div");
    box.style.cssText = "position:fixed;top:-600px;left:0;width:960px;height:540px;overflow:hidden;background:#fff;font-family:Arial,Helvetica,sans-serif;";
    // Garante que o .slide filho ocupa 100% sem bordas pretas
    var slideStyle = document.createElement("style");
    slideStyle.textContent = "#sin-pdf-box .slide { width:960px !important; height:540px !important; box-sizing:border-box; }";
    box.id = "sin-pdf-box";
    document.head.appendChild(slideStyle);
    document.body.appendChild(box);

    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var html = sinSlideHTMLForPDF(s, sinState, mesesAt);
      box.innerHTML = html;

      // Criar graficos
      var charts = [];
      var mainC = box.querySelector("#sin-main-chart");
      var donutC = box.querySelector("#sin-donut-chart");
      var hbarC  = box.querySelector("#sin-hbar-chart");
      var hbar2C = box.querySelector("#sin-hbar2-chart");

      if (s.type === "sin-geral" && mainC) {
        var geral = sinState.dados[s.empresa].geral;
        charts.push(sinCreateMainChartSync(mainC, geral.meses, mesesAt, s.empresa, true));
      }
      if (s.type === "sin-segmento" && mainC) {
        var seg = sinState.dados[s.empresa][s.seg];
        charts.push(sinCreateMainChartSync(mainC, seg.meses, mesesAt, s.empresa, false));
        if (donutC) charts.push(sinCreateDonutChartSync(donutC, seg.gravidade, sinGetEmpresa(s.empresa).cor));
        if (hbarC) {
          var tipos = (seg.tipos || []).filter(function(t) { return t.tipo; });
          charts.push(sinCreateHBarChartSync(hbarC, tipos, "tipo", "qtd", sinGetEmpresa(s.empresa).cor));
        }
      }
      if (s.type === "sin-ofensores") {
        var segOf = sinState.dados[s.empresa][s.seg];
        var emp   = sinGetEmpresa(s.empresa);
        var ofMes = (segOf.ofensoresMes || []).filter(function(o) { return o.nome; });
        var top5  = (segOf.top5Ano     || []).filter(function(o) { return o.nome; });
        if (hbarC)  charts.push(sinCreateHBarChartSync(hbarC,  ofMes, "nome", "qtd", emp.cor, "km"));
        if (hbar2C) charts.push(sinCreateHBarChartSync(hbar2C, top5,  "nome", "qtd", emp.cor, "km"));
      }

      await new Promise(function(r) { requestAnimationFrame(r); });
      await new Promise(function(r) { setTimeout(r, 250); });

      var canvas = await html2canvas(box, {
        scale: 4, useCORS: true, allowTaint: false,
        width: 960, height: 540, backgroundColor: "#ffffff",
        scrollX: 0, scrollY: 0, logging: false,
      });

      charts.forEach(function(c) { if (c) c.destroy(); });

      var img = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage([960, 540], "landscape");
      pdf.addImage(img, "JPEG", 0, 0, 960, 540);
    }

    document.body.removeChild(box);
    if (slideStyle.parentNode) slideStyle.parentNode.removeChild(slideStyle);
    pdf.save("Sinistros_" + sinState.mes + "_" + sinState.ano + ".pdf");

  } catch(err) {
    alert("Erro ao gerar PDF: " + err.message);
    console.error(err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "📄 Gerar PDF"; }
  }
}

function sinSlideHTMLForPDF(s, sinState, mesesAt) {
  var analista = sinState.analista;
  if (s.type === "sin-cover")    return sinSlideCoverHTML(sinState.mes, sinState.ano, analista);
  if (s.type === "contra-capa")  return slideContraCapaHTML(analista);
  if (s.type === "sin-geral")    return sinSlideGeralHTML(s.empresa, sinState.dados[s.empresa].geral, sinState.ano, analista);
  if (s.type === "sin-segmento") return sinSlideSegmentoHTML(s.empresa, s.seg, sinState.dados[s.empresa][s.seg], sinState.ano, analista);
  if (s.type === "sin-ofensores")return sinSlideOfensoresHTML(s.empresa, s.seg, sinState.dados[s.empresa][s.seg], sinState.mes, sinState.ano, analista);
  if (s.type === "sin-plano")    return sinSlidePlanoHTML(s.empresa, sinState.dados[s.empresa].planoAcao, sinState.mes, sinState.ano, analista);
  return "<div></div>";
}// sinistros-sheets.js — sincronizacao Google Sheets para Sinistros

async function sincronizarSheetsSinistros(sinState) {
  var btn = document.getElementById("btn-sin-sheets");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Enviando..."; }

  try {
    // Monta payload com uma linha por empresa+segmento
    var linhas = [];
    SIN_EMPRESAS.forEach(function(emp) {
      var dados = sinState.dados[emp.id];
      if (!dados) return;

      // Geral
      linhas.push(_sinBuildRow(sinState, emp.id, "geral", dados.geral || {}, true));

      // Segmentos
      emp.segmentos.forEach(function(seg) {
        if (dados[seg]) {
          linhas.push(_sinBuildRow(sinState, emp.id, seg, dados[seg], false));
        }
      });
    });

    var payload = {
      modulo:   "sinistros",
      periodo:  sinState.mes,
      ano:      String(sinState.ano),
      analista: sinState.analista,
      linhas:   linhas
    };

    var res = await fetch(APPS_SCRIPT_URL, {
      method:  "POST",
      body:    JSON.stringify(payload),
      headers: { "Content-Type": "text/plain" }
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    if (btn) {
      btn.textContent = "✅ Enviado!";
      setTimeout(function() { if (btn) { btn.disabled = false; btn.textContent = "📊 Sheets"; }}, 3000);
    }
  } catch (err) {
    console.error("Sheets Sinistros:", err);
    if (btn) {
      btn.textContent = "❌ Erro";
      setTimeout(function() { if (btn) { btn.disabled = false; btn.textContent = "📊 Sheets"; }}, 3000);
    }
  }
}

function _sinBuildRow(sinState, empId, seg, segData, isGeral) {
  var row = {
    empresa:    empId,
    segmento:   isGeral ? "Geral" : (SIN_SEG_LABEL[seg] || seg),
    sinistros:  segData.sinistros  || "",
    kmSinistro: segData.kmSinistro || "",
    meses:      {}
  };

  MESES.forEach(function(m) {
    var d = (segData.meses && segData.meses[m]) || {};
    row.meses[m] = {
      op:    d.operacao   || d.sinistros || "",
      manut: d.manutencao || "",
      km:    d.km         || "",
      meta:  d.meta       || ""
    };
  });

  // Gravidade (segmentos)
  if (!isGeral && segData.gravidade) {
    row.gravidade = segData.gravidade;
  }

  return row;
}
// sinistros-app.js — estado e logica do modulo Sinistros

// ── Estado ─────────────────────────────────────────────
var sinState = null;

function sinInit() {
  var now      = new Date();
  var prevIdx  = (now.getMonth() + 11) % 12;
  var prevAno  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  var dados    = {};
  SIN_EMPRESAS.forEach(function(emp) { dados[emp.id] = sinInitEmpresa(emp); });

  sinState = {
    step:     1,
    mes:      MESES[prevIdx],
    ano:      prevAno,
    analista: "Kelvin Santos",
    empresa:  "1001",
    subTab:   "geral",
    slideIdx: 0,
    slides:   null,
    dados:    dados,
  };
}

// ── Render ─────────────────────────────────────────────
function sinRender() {
  var app = document.getElementById("app");
  if (!app) return;
  sinDestroyAllCharts();

  if (sinState.step === 1) {
    app.innerHTML = sinStepMonthHTML(sinState.mes, sinState.ano, sinState.analista);
  } else if (sinState.step === 2) {
    app.innerHTML = sinStepDataHTML(sinState);
    sinInitPreviewForSubTab();
  } else if (sinState.step === 3) {
    if (!sinState.slides) sinState.slides = buildSinistrosSlides();
    app.innerHTML = sinStepPreviewHTML(sinState.slides, sinState.slideIdx, sinState.mes, sinState.ano);
    sinRenderCurrentSlide();
  }
}

// ── Preview Step 2 ────────────────────────────────────
function sinInitPreviewForSubTab() {
  var empresa = sinState.empresa;
  if (empresa === "plano") return; // aba plano não tem gráfico

  var mesIdx  = MESES.indexOf(sinState.mes);
  var mesesAt = MESES.slice(0, mesIdx + 1);
  var subTab  = sinState.subTab || "geral";
  var dados   = sinState.dados[empresa];
  if (!dados) return;

  setTimeout(function() {
    if (subTab === "geral") {
      sinInitMainChart("sin-preview-chart", dados.geral.meses, mesesAt, empresa, true);
    } else if (subTab !== "plano" && dados[subTab]) {
      sinInitMainChart("sin-preview-chart", dados[subTab].meses, mesesAt, empresa, false);
    }
  }, 50);
}

// ── Render slide ──────────────────────────────────────
function sinRenderCurrentSlide() {
  var frame = document.getElementById("sin-slide-frame");
  if (!frame) return;
  sinDestroyAllCharts();

  var slide    = sinState.slides[sinState.slideIdx];
  var mesIdx   = MESES.indexOf(sinState.mes);
  var mesesAt  = MESES.slice(0, mesIdx + 1);
  var analista = sinState.analista;

  try {
    if (slide.type === "sin-cover") {
      frame.innerHTML = sinSlideCoverHTML(sinState.mes, sinState.ano, analista);
      return;
    }
    if (slide.type === "contra-capa") {
      frame.innerHTML = slideContraCapaHTML(analista);
      return;
    }
    if (slide.type === "sin-geral") {
      var geral = sinState.dados[slide.empresa].geral;
      frame.innerHTML = sinSlideGeralHTML(slide.empresa, geral, sinState.ano, analista);
      setTimeout(function() { sinInitMainChart("sin-main-chart", geral.meses, mesesAt, slide.empresa, true); }, 50);
      return;
    }
    if (slide.type === "sin-segmento") {
      var seg = sinState.dados[slide.empresa][slide.seg];
      frame.innerHTML = sinSlideSegmentoHTML(slide.empresa, slide.seg, seg, sinState.ano, analista);
      setTimeout(function() {
        sinInitMainChart("sin-main-chart", seg.meses, mesesAt, slide.empresa, false);
        sinInitDonutChart("sin-donut-chart", seg.gravidade, true, sinGetEmpresa(slide.empresa).cor);
        var tipos = (seg.tipos || []).filter(function(t) { return t.tipo; });
        sinInitHBarChart("sin-hbar-chart", tipos, "tipo", "qtd", sinGetEmpresa(slide.empresa).cor);
      }, 50);
      return;
    }
    if (slide.type === "sin-ofensores") {
      var segOf = sinState.dados[slide.empresa][slide.seg];
      frame.innerHTML = sinSlideOfensoresHTML(slide.empresa, slide.seg, segOf, sinState.mes, sinState.ano, analista);
      setTimeout(function() {
        var emp = sinGetEmpresa(slide.empresa);
        var ofMes = (segOf.ofensoresMes || []).filter(function(o) { return o.nome; });
        var top5  = (segOf.top5Ano     || []).filter(function(o) { return o.nome; });
        if (_sinHBarChart) { _sinHBarChart.destroy(); _sinHBarChart = null; }
        var c1 = document.getElementById("sin-hbar-chart");
        if (c1) { var cfg1 = _sinMakeHBarConfig(ofMes, "nome", "qtd", emp.cor, false, "km"); cfg1.options.devicePixelRatio = window.devicePixelRatio * 2 || 2; new Chart(c1, cfg1); }
        var c2 = document.getElementById("sin-hbar2-chart");
        if (c2) { var cfg2 = _sinMakeHBarConfig(top5, "nome", "qtd", emp.cor, false, "km"); cfg2.options.devicePixelRatio = window.devicePixelRatio * 2 || 2; new Chart(c2, cfg2); }
      }, 50);
      return;
    }
    if (slide.type === "sin-plano") {
      var plano = sinState.dados[slide.empresa].planoAcao;
      frame.innerHTML = sinSlidePlanoHTML(slide.empresa, plano, sinState.mes, sinState.ano, analista);
      return;
    }
  } catch(err) {
    frame.innerHTML = '<div style="padding:20px;color:#c0392b;font-size:12px"><b>Erro:</b> ' + err.message + '</div>';
    console.error("sinRenderCurrentSlide:", err);
  }
}

// Atualiza grafico e KPI do preview ao vivo
function _sinUpdateChartAndKpi(withManut) {
  if (!sinState) return;
  var mesIdx  = MESES.indexOf(sinState.mes);
  var mesesAt = MESES.slice(0, mesIdx + 1);
  var subTab  = sinState.subTab || "geral";
  var dados   = sinState.dados[sinState.empresa];
  var mesesObj = subTab === "geral" ? dados.geral.meses : (dados[subTab] ? dados[subTab].meses : null);
  if (mesesObj) sinUpdateMainChart(mesesObj, mesesAt, withManut || false);
  _sinUpdatePreviewKpi();
}

// ── Atualiza KPI cards do preview ao vivo ────────────
function _sinUpdatePreviewKpi() {
  if (!sinState) return;
  var subTab = sinState.subTab || "geral";
  var dados  = sinState.dados[sinState.empresa];
  var sin = "", km = "";
  if (subTab === "geral") {
    sin = dados.geral.sinistros;
    km  = dados.geral.kmSinistro;
  } else if (subTab !== "plano" && dados[subTab]) {
    sin = dados[subTab].sinistros;
    km  = dados[subTab].kmSinistro;
  }
  // Tenta DOM direto primeiro (mais eficiente)
  var sinEl = document.getElementById("sin-pkpi-sin");
  var kmEl  = document.getElementById("sin-pkpi-km");
  if (sinEl) sinEl.textContent = fmtBr(sin) || "—";
  if (kmEl)  kmEl.textContent  = fmtBr(km)  || "—";
  // Fallback: re-renderiza o container
  if (!sinEl || !kmEl) {
    var wrap = document.getElementById("sin-kpi-preview-wrap");
    if (wrap) {
      wrap.innerHTML = sinPreviewKpiBox("Sinistros:", sin, "sin-pkpi-sin")
        + sinPreviewKpiBox("Km/Sinistro:", km, "sin-pkpi-km");
    }
  }
}

// ── Event handler ─────────────────────────────────────
function sinHandleAction(action, dataset, el) {
  var mesIdx  = MESES.indexOf(sinState.mes);
  var mesesAt = MESES.slice(0, mesIdx + 1);

  if (action === "sin-go-home") {
    sinState = null;
    state.screen = "home";  // volta para a home do app principal
    render();
    return;
  }
  if (action === "sin-go-step") {
    var step = Number(dataset.step);
    sinState.step = step;
    if (step === 3 && !sinState.slides) sinState.slides = buildSinistrosSlides();
    if (step === 3) { sinState.slideIdx = 0; _sinAutoSalvarFirebase(); sinRender(); return; }
    if (step === 2) {
      sinRender();
      _sinCarregarFirebase().then(function() { sinRender(); });
      return;
    }
    sinRender();
    return;
  }
  if (action === "sin-set-empresa") {
    sinState.empresa = dataset.empresa;
    if (dataset.empresa !== "plano") sinState.subTab = "geral";
    sinRender();
    if (dataset.empresa === "plano") setTimeout(_sinCarregarTextosPlano, 100);
    return;
  }
  if (action === "sin-set-subtab") {
    sinState.subTab = dataset.subtab;
    sinRender();
    return;
  }
  if (action === "sin-go-slide") {
    sinState.slideIdx = Number(dataset.idx);
    sinRenderCurrentSlide();
    sinUpdateSlideCounter();
    sinUpdateActiveThumbs();
    return;
  }
  if (action === "sin-prev-slide") {
    if (sinState.slideIdx > 0) {
      sinState.slideIdx--;
      sinRenderCurrentSlide();
      sinUpdateSlideCounter();
      sinUpdateActiveThumbs();
    }
    return;
  }
  if (action === "sin-next-slide") {
    if (sinState.slideIdx < sinState.slides.length - 1) {
      sinState.slideIdx++;
      sinRenderCurrentSlide();
      sinUpdateSlideCounter();
      sinUpdateActiveThumbs();
    }
    return;
  }
  if (action === "sin-processar-ofensores") {
    _sinProcessarPasteOfensores(dataset.sinSeg);
    return;
  }
  if (action === "sin-processar-top5") {
    _sinProcessarPasteTop5(dataset.sinSeg);
    return;
  }
  if (action === "sin-salvar-firebase") { _sinSalvarManual(); return; }
  if (action === "sin-gerar-sheets")    { sincronizarSheetsSinistros(sinState); return; }
  if (action === "sin-importar-planos") { _sinImportarPlanos(); return; }
  if (action === "sin-gerar-pdf")       { sinGerarPDF(sinState); return; }

  // Inputs root (mes, ano, analista)
  if (el && el.dataset.sinRoot) {
    var field = el.dataset.sinRoot;
    if (field === "ano") sinState.ano = Number(el.value);
    else sinState[field] = el.value;
    return;
  }

  // Geral total
  if (el && el.dataset.sinGeralTotal) {
    sinState.dados[sinState.empresa].geral[el.dataset.sinGeralTotal] = el.value;
    _sinUpdatePreviewKpi();
    return;
  }

  // Geral mensal
  if (el && el.dataset.sinGeralMes) {
    var emp = sinState.empresa;
    if (!sinState.dados[emp].geral.meses[el.dataset.sinGeralMes]) sinState.dados[emp].geral.meses[el.dataset.sinGeralMes] = {};
    sinState.dados[emp].geral.meses[el.dataset.sinGeralMes][el.dataset.sinGeralField] = el.value;
    _sinUpdateChartAndKpi(true);
    return;
  }

  // Segmento total
  if (el && el.dataset.sinSeg && el.dataset.sinSegTotal) {
    sinState.dados[sinState.empresa][el.dataset.sinSeg][el.dataset.sinSegTotal] = el.value;
    _sinUpdatePreviewKpi();
    return;
  }

  // Segmento mensal
  if (el && el.dataset.sinSeg && el.dataset.sinSegMes) {
    var s = el.dataset.sinSeg;
    var m = el.dataset.sinSegMes;
    var f = el.dataset.sinSegField;
    if (!sinState.dados[sinState.empresa][s]) return;
    if (!sinState.dados[sinState.empresa][s].meses[m]) sinState.dados[sinState.empresa][s].meses[m] = {};
    sinState.dados[sinState.empresa][s].meses[m][f] = el.value;
    _sinUpdateChartAndKpi(false);
    return;
  }

  // Gravidade
  if (el && el.dataset.sinSeg && el.dataset.sinGrav) {
    sinState.dados[sinState.empresa][el.dataset.sinSeg].gravidade[el.dataset.sinGrav] = el.value;
    return;
  }

  // Tipos de acidente
  if (el && el.dataset.sinSeg && el.dataset.sinTipoIdx !== undefined) {
    var idx = Number(el.dataset.sinTipoIdx);
    sinState.dados[sinState.empresa][el.dataset.sinSeg].tipos[idx][el.dataset.sinTipoField] = el.value;
    return;
  }

  // Ofensores
  if (el && el.dataset.sinSeg && el.dataset.sinOfIdx !== undefined) {
    var idx = Number(el.dataset.sinOfIdx);
    var tipo = el.dataset.sinOfTipo; // "mes" ou "top5"
    var arr  = tipo === "top5" ? "top5Ano" : "ofensoresMes";
    sinState.dados[sinState.empresa][el.dataset.sinSeg][arr][idx][el.dataset.sinOfField] = el.value;
    return;
  }

  // Plano (individual ou global)
  if (el && el.dataset.sinPlano) {
    var empTarget = el.dataset.sinPlanoEmp || sinState.empresa;
    if (sinState.dados[empTarget]) {
      sinState.dados[empTarget].planoAcao[el.dataset.sinPlano] = el.value;
      _sinSalvarPlanosLocalStorage(); // sincroniza com plano-de-acao-sinistros.html
    }
    return;
  }
}

function sinUpdateActiveThumbs() {
  var thumbs = document.querySelectorAll(".thumbs .thumb");
  thumbs.forEach(function(thumb, idx) {
    thumb.classList.toggle("thumb--active", idx === sinState.slideIdx);
    if (idx === sinState.slideIdx) {
      thumb.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
}

function sinUpdateSlideCounter() {
  var el = document.querySelector(".preview-bar__info");
  if (el && sinState && sinState.slides) {
    el.innerHTML = "Sinistros &nbsp;&mdash;&nbsp; Slide " + (sinState.slideIdx + 1) + " / " + sinState.slides.length + " &nbsp;&mdash;&nbsp; " + sinState.mes + "/" + sinState.ano;
  }
}


// ── Firebase: salvar em background ───────────────────
async function _sinAutoSalvarFirebase() {
  await salvarSinistrosNoFirebase(sinState);
}

// ── Firebase: salvar manual com feedback ─────────────
async function _sinSalvarManual() {
  var btn = document.getElementById("btn-sin-salvar-fb");
  if (btn) { btn.disabled = true; btn.textContent = "☁️ Salvando..."; }
  var ok = await salvarSinistrosNoFirebase(sinState);
  if (btn) {
    btn.textContent = ok ? "✅ Salvo!" : "❌ Erro";
    setTimeout(function() { if (btn) { btn.disabled = false; btn.textContent = "☁️ Salvar"; }}, 2500);
  }
}

// ── Firebase: carrega mês atual ou mês anterior como base ──
async function _sinCarregarFirebase() {
  var res = await carregarDadosSinistros(sinState.mes, sinState.ano);
  if (!res) return;

  var fb = res.dados;
  sinState.analista = fb.analista || sinState.analista;

  if (res.fonte === "atual" && fb.dados) {
    sinState.dados = fb.dados;
    return;
  }

  // Mês anterior — usa como base mas limpa dados mensais
  if (res.fonte === "anterior" && fb.dados) {
    var base = JSON.parse(JSON.stringify(fb.dados));
    SIN_EMPRESAS.forEach(function(emp) {
      var ed = base[emp.id];
      if (!ed) return;
      var segs = ["geral"].concat(emp.segmentos);
      segs.forEach(function(seg) {
        if (!ed[seg] || !ed[seg].meses) return;
        Object.keys(ed[seg].meses).forEach(function(m) {
          ed[seg].meses[m] = seg === "geral"
            ? { operacao: "", manutencao: "", km: "", meta: "" }
            : { sinistros: "", km: "", meta: "" };
        });
      });
    });
    sinState.dados = base;
  }
}


// ── Copiar link do Plano de Ação ─────────────────────────────────────
function _sinCopiarLinkPlano(btn) {
  var base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
  var link = base + "plano-de-acao-sinistros.html";
  navigator.clipboard.writeText(link).then(function() {
    var orig = btn.innerHTML;
    btn.innerHTML = "✅ Copiado!";
    btn.style.background = "rgba(26,122,60,.35)";
    setTimeout(function() { btn.innerHTML = orig; btn.style.background = ""; }, 2000);
  }).catch(function() {
    prompt("Copie o link abaixo:", link);
  });
}

// ── Salva Principal Ofensor + Quantidade no Firebase e localStorage ──
function _sinSalvarPlanosLocalStorage() {
  try {
    var data = {};
    SIN_EMPRESAS.forEach(function(emp) {
      var p = sinState.dados[emp.id] ? sinState.dados[emp.id].planoAcao : {};
      data[emp.id] = {
        principalOfensor: p.principalOfensor || "",
        quantidade:        p.quantidade       || ""
      };
    });
    // Firebase (merge para não sobrescrever o texto do time)
    var docId = sinState.ano + "-" + sinState.mes;
    var fbPayload = {};
    SIN_EMPRESAS.forEach(function(emp) {
      fbPayload[emp.id] = {
        principalOfensor: data[emp.id].principalOfensor,
        quantidade:        data[emp.id].quantidade
      };
    });
    _db.collection("planos_sinistros").doc(docId).set(fbPayload, { merge: true })
       .catch(function(e) { console.warn("Firebase plano save:", e); });
  } catch(e) {}
}

// ── Importar Planos do Firebase ───────────────────────
async function _sinImportarPlanos() {
  var btn = document.querySelector("[data-action='sin-importar-planos']");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Importando..."; }

  try {
    var docId = sinState.ano + "-" + sinState.mes;
    var doc   = await _db.collection("planos_sinistros").doc(docId).get();

    if (!doc.exists) {
      alert("Nenhum plano encontrado para " + sinState.mes + "/" + sinState.ano + ".\nAguarde o time regional enviar.");
      return;
    }

    var fbData = doc.data();
    var count  = 0;
    SIN_EMPRESAS.forEach(function(emp) {
      var p = fbData[emp.id];
      if (!p || !p.enviado) return;
      if (!sinState.dados[emp.id]) return;
      sinState.dados[emp.id].planoAcao.texto = p.texto || "";
      count++;
    });

    if (count > 0) {
      sinRender();
      if (btn) { btn.textContent = "✅ " + count + " importado(s)!"; }
      setTimeout(function() { if (btn) { btn.disabled = false; btn.textContent = "📋 Importar Planos"; }}, 3000);
    } else {
      alert("Nenhum plano enviado ainda pelo time regional para " + sinState.mes + "/" + sinState.ano + ".");
      if (btn) { btn.disabled = false; btn.textContent = "📋 Importar Planos"; }
    }
  } catch(e) {
    alert("Erro ao importar: " + e.message);
    if (btn) { btn.disabled = false; btn.textContent = "📋 Importar Planos"; }
  }
}

// ── Revisão e edição dos textos do Plano (Sinistros) ──
async function _sinCarregarTextosPlano() {
  try {
    const doc = await _db.collection("planos_sinistros").doc(sinState.ano + "-" + sinState.mes).get();
    const fb  = doc.exists ? doc.data() : {};
    SIN_EMPRESAS.forEach(function(emp) {
      var div = document.getElementById("sin-plano-texto-" + emp.id);
      if (!div) return;
      var p = fb[emp.id] || {};
      if (!p.enviado || !p.texto) {
        div.innerHTML = '<div style="color:#aaa;font-size:12px;font-style:italic">&#9203; Aguardando envio do time.</div>';
      } else {
        div.dataset.texto = p.texto;
        div.innerHTML     = _planoTextoReadHTML(emp.id, p.texto, "sin-plano-texto-");
      }
    });
  } catch(e) { console.warn("sin carregar textos:", e); }
}


// ── Processar paste de contratos e contar ocorrências ─
function _sinProcessarPasteOfensores(seg) {
  var textarea = document.getElementById("sin-paste-of-" + seg);
  if (!textarea || !textarea.value.trim()) {
    alert("Cole os dados do Sheets antes de processar.");
    return;
  }

  var linhas = textarea.value.split("\n").map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
  var contagem = {};
  linhas.forEach(function(l) {
    contagem[l] = (contagem[l] || 0) + 1;
  });

  var sorted = Object.keys(contagem).map(function(nome) {
    return { nome: nome, qtd: contagem[nome] };
  }).sort(function(a, b) { return b.qtd - a.qtd; });

  var emp       = sinState.empresa;
  var ofensores = sinState.dados[emp][seg].ofensoresMes;
  ofensores.forEach(function(o) { o.nome = ""; o.qtd = ""; });
  sorted.slice(0, ofensores.length).forEach(function(item, i) {
    ofensores[i].nome = item.nome;
    ofensores[i].qtd  = String(item.qtd);
  });

  var total      = sorted.length;
  var preenchidos = Math.min(sorted.length, ofensores.length);
  sinRender();

  setTimeout(function() {
    var ta = document.getElementById("sin-paste-of-" + seg);
    if (ta) ta.placeholder = "✅ " + preenchidos + " contratos preenchidos" + (total > preenchidos ? " (de " + total + " únicos)" : "") + ". Cole novos dados para reprocessar.";
  }, 100);
}

// ── Processar paste para Top 5 do Ano ─────────────────
function _sinProcessarPasteTop5(seg) {
  var textarea = document.getElementById("sin-paste-top5-" + seg);
  if (!textarea || !textarea.value.trim()) {
    alert("Cole os dados do Sheets antes de processar.");
    return;
  }

  var linhas = textarea.value.split("\n").map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
  var contagem = {};
  linhas.forEach(function(l) {
    contagem[l] = (contagem[l] || 0) + 1;
  });

  var sorted = Object.keys(contagem).map(function(nome) {
    return { nome: nome, qtd: contagem[nome] };
  }).sort(function(a, b) { return b.qtd - a.qtd; });

  var emp    = sinState.empresa;
  var top5   = sinState.dados[emp][seg].top5Ano;
  top5.forEach(function(o) { o.nome = ""; o.qtd = ""; });
  sorted.slice(0, top5.length).forEach(function(item, i) {
    top5[i].nome = item.nome;
    top5[i].qtd  = String(item.qtd);
  });

  var preenchidos = Math.min(sorted.length, top5.length);
  sinRender();

  setTimeout(function() {
    var ta = document.getElementById("sin-paste-top5-" + seg);
    if (ta) ta.placeholder = "✅ " + preenchidos + " contratos preenchidos. Cole novos dados para reprocessar.";
  }, 100);
}

function startSinistros() {
  sinInit();
  sinRender();
}