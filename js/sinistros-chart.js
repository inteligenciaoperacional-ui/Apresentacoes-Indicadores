// sinistros-chart.js — graficos do modulo Sinistros

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
    pointBackgroundColor: "#1d3061", pointRadius: 4, tension: 0.2,
    yAxisID: "yRight", order: 1,
    datalabels: {
      clip: false, anchor: "end", align: "top", offset: 4,
      color: "#1d3061", font: { size: 9, weight: "bold" },
      formatter: function(v) { return v > 0 ? v.toLocaleString("pt-BR") : null; }
    }
  });

  // 4. Meta — linha vermelha tracejada com labels ACIMA (mais afastado)
  datasets.push({
    type: "line", label: "Meta",
    data: metaData, borderDash: [5, 5],
    borderColor: "#c0392b", backgroundColor: "#c0392b",
    pointBackgroundColor: "#c0392b", pointRadius: 4, tension: 0,
    yAxisID: "yRight", order: 0,
    datalabels: {
      clip: false, anchor: "end", align: "top", offset: 14,
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
  _sinMainChart = new Chart(canvas, _sinMakeMainConfig(mesesAtivos, d.op, d.manut, d.meta, d.km, animOn !== false, bc.bar, bc.label));
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
  _sinDonutChart = new Chart(canvas, _sinMakeDonutConfig(gravidade, animOn, corEmpresa));
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
  _sinHBarChart = new Chart(canvas, _sinMakeHBarConfig(items, labelField, valueField, corBarra, animOn));
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
}