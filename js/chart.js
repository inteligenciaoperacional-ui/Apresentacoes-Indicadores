// chart.js — gráficos Chart.js

Chart.register(ChartDataLabels);

var _previewChart  = null;
var _slideChart    = null;
var _niGrupoChart  = null;   // segundo gráfico de preview (NI GRUPO na aba GRUPO)

// Retorna as cores de barra e label para cada regional
function _barCfg(regional) {
  var cfg = BAR_COLORS[regional] || BAR_COLORS.GRUPO;
  return cfg;
}

// ════════════════════════════════════════════════════
// GRAFICO DE TENDENCIA MENSAL (barras + linha)
// ════════════════════════════════════════════════════
function _makeChartConfig(labels, exData, k1Data, animOn, barColor, barLabelColor) {
  if (animOn === undefined)      animOn       = true;
  if (!barColor)                 barColor      = COLORS.coral;
  if (!barLabelColor)            barLabelColor = "#1d3061";

  return {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          type: "bar",
          label: "Excessos",
          data: exData,
          backgroundColor: barColor,
          borderRadius: 3,
          yAxisID: "yLeft",
          order: 1,
          datalabels: {
            anchor: "center", align: "center",
            color: barLabelColor,
            font: { size: 9 },
            formatter: function(v) { return v > 0 ? v.toLocaleString("pt-BR") : null; }
          }
        },
        {
          type: "line",
          label: "A cada 1000km",
          data: k1Data,
          borderColor: COLORS.red,
          backgroundColor: COLORS.red,
          pointBackgroundColor: COLORS.red,
          pointRadius: 4,
          tension: 0,
          yAxisID: "yRight",
          order: 0,
          z: 10,
          datalabels: {
            clip: false,
            anchor: "end", align: "top", offset: 4,
            color: COLORS.red, font: { size: 9, weight: "bold" },
            formatter: function(v) { return v > 0 ? v.toFixed(2).replace(".", ",") : null; }
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: animOn ? undefined : false,
      plugins: {
        legend: {
          display: true, position: "bottom",
          labels: { font: { size: 9 }, boxWidth: 12, padding: 8, usePointStyle: true }
        },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ctx.datasetIndex === 0
                ? "Excessos: " + ctx.raw.toLocaleString("pt-BR")
                : "A cada 1000km: " + ctx.raw.toFixed(2).replace(".", ",");
            }
          }
        },
        datalabels: { display: function(ctx) { return ctx.dataset.data[ctx.dataIndex] > 0; } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#777" } },
        yLeft: {
          type: "linear", position: "left",
          ticks: { display: false }, grid: { display: false }
        },
        yRight: {
          type: "linear", position: "right",
          display: false, grid: { display: false },
          afterDataLimits: function(axis) {
            var range = Math.max(axis.max - axis.min, 0.01);
            axis.max += range * 0.15;
            axis.min -= range * 2.8;
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  };
}

function initPreviewChart(regData, mesesAtivos, regional) {
  if (_previewChart) { _previewChart.destroy(); _previewChart = null; }
  var canvas = document.getElementById("preview-chart");
  if (!canvas) return;
  var bc = _barCfg(regional || "GRUPO");
  var cd = buildChartData(regData, mesesAtivos);
  _previewChart = new Chart(canvas, _makeChartConfig(
    mesesAtivos,
    cd.map(function(d) { return d.excessos; }),
    cd.map(function(d) { return d.cada1000; }),
    true, bc.bar, bc.label
  ));
}

function updatePreviewChart(regData, mesesAtivos) {
  if (!_previewChart) return;
  var cd = buildChartData(regData, mesesAtivos);
  _previewChart.data.labels           = mesesAtivos;
  _previewChart.data.datasets[0].data = cd.map(function(d) { return d.excessos; });
  _previewChart.data.datasets[1].data = cd.map(function(d) { return d.cada1000; });
  _previewChart.update("none");
}

function initSlideChart(canvasId, regData, mesesAtivos, regional) {
  if (_slideChart) { _slideChart.destroy(); _slideChart = null; }
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var bc = _barCfg(regional || "GRUPO");
  var cd = buildChartData(regData, mesesAtivos);
  _slideChart = new Chart(canvas, _makeChartConfig(
    mesesAtivos,
    cd.map(function(d) { return d.excessos; }),
    cd.map(function(d) { return d.cada1000; }),
    true, bc.bar, bc.label
  ));
}

function createChartSync(canvas, regData, mesesAtivos, regional) {
  var bc  = _barCfg(regional || "GRUPO");
  var cd  = buildChartData(regData, mesesAtivos);
  var cfg = _makeChartConfig(
    mesesAtivos,
    cd.map(function(d) { return d.excessos; }),
    cd.map(function(d) { return d.cada1000; }),
    false, bc.bar, bc.label
  );
  cfg.options.devicePixelRatio = 4;
  return new Chart(canvas, cfg);
}

function destroyAllCharts() {
  if (_previewChart) { _previewChart.destroy(); _previewChart = null; }
  if (_slideChart)   { _slideChart.destroy();   _slideChart   = null; }
  if (_niGrupoChart) { _niGrupoChart.destroy(); _niGrupoChart = null; }
}

// Gráfico de preview do NI GRUPO (canvas #preview-chart-ni)
function initNIGrupoPreviewChart(naoId, mesesAtivos) {
  if (_niGrupoChart) { _niGrupoChart.destroy(); _niGrupoChart = null; }
  var canvas = document.getElementById("preview-chart-ni");
  if (!canvas) return;
  var bc = BAR_COLORS.GRUPO;
  var cd = buildChartData(naoId, mesesAtivos);
  _niGrupoChart = new Chart(canvas, _makeChartConfig(
    mesesAtivos,
    cd.map(function(d) { return d.excessos; }),
    cd.map(function(d) { return d.cada1000; }),
    true, bc.bar, bc.label
  ));
}

function updateNIGrupoPreviewChart(naoId, mesesAtivos) {
  if (!_niGrupoChart) { initNIGrupoPreviewChart(naoId, mesesAtivos); return; }
  var cd = buildChartData(naoId, mesesAtivos);
  _niGrupoChart.data.labels           = mesesAtivos;
  _niGrupoChart.data.datasets[0].data = cd.map(function(d) { return d.excessos; });
  _niGrupoChart.data.datasets[1].data = cd.map(function(d) { return d.cada1000; });
  _niGrupoChart.update("none");
}

// ════════════════════════════════════════════════════
// GRAFICO DE SETORES (Não Identificados regionais)
// ════════════════════════════════════════════════════
function _makeSectorConfig(setores, animOn, barColor, barLabelColor) {
  if (animOn === undefined) animOn = true;
  if (!barColor)      barColor      = COLORS.navy;
  if (!barLabelColor) barLabelColor = "#ffffff";

  var labels   = setores.map(function(s, i) { return s.nome || ("Setor " + (i + 1)); });
  var excessos = setores.map(function(s) { return parseN(s.excessos); });
  var cada1000 = setores.map(function(s) { return parseN(s.cada1000); });

  return {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Excessos",
          data: excessos,
          backgroundColor: barColor,
          datalabels: {
            anchor: "center", align: "center",
            color: barLabelColor, font: { size: 10, weight: "bold" },
            formatter: function(v) { return v > 0 ? v.toLocaleString("pt-BR") : null; }
          }
        },
        {
          label: "A cada 1000km",
          data: cada1000,
          backgroundColor: COLORS.red,
          datalabels: {
            clip: false, anchor: "end", align: "top",
            color: COLORS.red, font: { size: 9, weight: "bold" },
            formatter: function(v) { return v > 0 ? v.toFixed(2).replace(".", ",") : null; }
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: animOn ? undefined : false,
      plugins: {
        legend: {
          display: true, position: "bottom",
          labels: { font: { size: 9 }, boxWidth: 12, padding: 8, usePointStyle: true }
        },
        datalabels: { display: function(ctx) { return ctx.dataset.data[ctx.dataIndex] > 0; } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: "#555", maxRotation: 25 } },
        y: { display: false, grid: { display: false }, beginAtZero: true }
      }
    },
    plugins: [ChartDataLabels]
  };
}

function initPreviewSectorChart(setores, regional) {
  if (_previewChart) { _previewChart.destroy(); _previewChart = null; }
  var canvas = document.getElementById("preview-chart");
  if (!canvas) return;
  var bc = _barCfg(regional || "GRUPO");
  _previewChart = new Chart(canvas, _makeSectorConfig(setores, true, bc.bar, bc.label));
}

function initSectorChart(canvasId, setores, regional) {
  if (_slideChart) { _slideChart.destroy(); _slideChart = null; }
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var bc = _barCfg(regional || "GRUPO");
  _slideChart = new Chart(canvas, _makeSectorConfig(setores, true, bc.bar, bc.label));
}

function createSectorChartSync(canvas, setores, regional) {
  var bc  = _barCfg(regional || "GRUPO");
  var cfg = _makeSectorConfig(setores, false, bc.bar, bc.label);
  cfg.options.devicePixelRatio = 4;
  return new Chart(canvas, cfg);
}