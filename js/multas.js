// ============================================================
//  multas-constants.js — Constantes e estrutura do módulo Multas Regulatórias
// ============================================================

var MULTAS_EMPRESAS = [
  { id: 'grupo',    label: 'Grupo JCA',   cor: '#1d3061' },
  { id: '1001',     label: '1001',        cor: '#9e9e9e' },
  { id: '1001u',    label: '1001 Urbano', cor: '#bdbdbd' },
  { id: 'cat',      label: 'Catarinense', cor: '#03a5a5' },
  { id: 'com',      label: 'Cometa',      cor: '#4a90d9' },
];

// Meses abreviados
var MULTAS_MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
var MULTAS_MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// Cria estado inicial vazio
function multasCreateState() {
  // Estrutura de dados por empresa: meses (array 12 posições)
  const emptyEmpresa = () => ({
    // Multas Recebidas UTP
    utp_valores:  Array(12).fill(0),   // valor R$
    utp_qtde:     Array(12).fill(0),   // quantidade
    utp_orcado:   Array(12).fill(0),   // linha orçado
    utp_acum:     0,
    utp_cpk:      0,
    // Multas Regulatórias Operação
    op_valores:   Array(12).fill(0),
    op_qtde:      Array(12).fill(0),
    op_acum:      0,
    op_cpk:       0,
    // Motivos do mês (tabela operação)
    motivos: [],   // [{qtde, descricao, valor}]
    // Plano de ação
    planoAcao: {
      motivo: '',
      texto:  '',
      enviado: false,
    },
  });

  // Tabela custos por área (slide grupo)
  const emptyCustoArea = () => ({
    operacao:   0,
    comercial:  0,
    manutencao: 0,
    extrato:    0,
    geral:      0,
  });

  return {
    mes: new Date().getMonth(), // 0-based
    ano: new Date().getFullYear(),
    analista: "Kelvin Santos",
    dados: {
      grupo: {
        utp_valores: Array(12).fill(0),
        utp_qtde:    Array(12).fill(0),
        utp_orcado:  Array(12).fill(0),
        utp_acum:    0,
        utp_cpk:     0,
        op_valores:  Array(12).fill(0),
        op_qtde:     Array(12).fill(0),
        op_acum:     0,
        op_cpk:      0,
        custos: {
          grupo: emptyCustoArea(),
          '1001':  emptyCustoArea(),
          '1001u': emptyCustoArea(),
          cat:     emptyCustoArea(),
          com:     emptyCustoArea(),
        },
      },
      '1001':  emptyEmpresa(),
      '1001u': emptyEmpresa(),
      cat:     emptyEmpresa(),
      com:     emptyEmpresa(),
    },
  };
}

// Formata valor monetário: R$ 1.234.567
function multasFmtMoeda(val) {
  if (!val && val !== 0) return 'R$ -';
  return 'R$ ' + Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Formata CPK com 2 casas
function multasFmtCpk(val) {
  if (!val && val !== 0) return 'R$ -';
  return 'R$ ' + Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Retorna label do mês (0-based)
function multasMesLabel(idx) {
  return MULTAS_MESES_ABREV[idx] || '';
}
function multasMesFull(idx) {
  return MULTAS_MESES_FULL[idx] || '';
}

// Logo URLs por empresa
var MULTAS_LOGOS = {
  grupo:  'https://res.cloudinary.com/dln0ctawv/image/upload/v1779238658/JCA_1_mp1ic7.png',
  '1001': 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671790/1001_qisjtr_1_pzpzqw.png',
  '1001u':'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671790/1001_qisjtr_1_pzpzqw.png',
  cat:    'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671813/AVC_zk4pe9_k4jgau.png',
  com:    'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671826/COM_folzln_ddghpr.png',
};

// Label empresa no slide
var MULTAS_EMP_LABEL = {
  grupo:  'Grupo JCA',
  '1001': '1001',
  '1001u':'1001 Urbano',
  cat:    'Catarinense',
  com:    'Cometa',
};
// ============================================================
//  multas-chart.js — Gráficos do módulo Multas Regulatórias
// ============================================================

// Instâncias de charts ativos (para destruir antes de recriar)
var multasChartInstances = {};

function multasDestroyChart(id) {
  if (multasChartInstances[id]) {
    multasChartInstances[id].destroy();
    delete multasChartInstances[id];
  }
}

// Cores dos orçados
var COR_ORCADO  = '#1d3061';
var COR_MULTAS_LINE = '#aab0c0';  // linha quantidade (cinza claro)
var COR_VALOR_LABEL = '#c0392b';

// ---------------------------------------------------------------
// GRÁFICO UTP — barras (valor) + linha (orçado) + linha (multas)
// ---------------------------------------------------------------
function multasCreateUTPChart(canvasId, empId, dados, mesesVisiveis, dpr) {
  multasDestroyChart(canvasId);
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;

  var d      = empId === 'grupo' ? dados.grupo : dados[empId];
  var meses  = mesesVisiveis;
  var labels = meses.map(function(i){ return MULTAS_MESES_ABREV[i]; });
  var qtdes  = meses.map(function(i){ return (d.utp_qtde    || [])[i] || 0; });
  var vals   = meses.map(function(i){ return (d.utp_valores || [])[i] || 0; });
  var orcs   = meses.map(function(i){ return (d.utp_orcado  || [])[i] || 0; });
  var barColor = empId === 'grupo' ? 'rgba(236,152,152,.85)' : _multasEmpBarColor(empId);

  var labelPlugin = {
    id: 'multasUTPLabels',
    afterDatasetsDraw: function(chart) {
      var ctx = chart.ctx;
      var barMeta = chart.getDatasetMeta(0);
      ctx.save();
      barMeta.data.forEach(function(bar, i) {
        var v = qtdes[i];
        if (!v) return;
        ctx.fillStyle = '#1d3061';
        ctx.font = 'bold 11px Calibri, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(v < 10 ? '0' + v : v, bar.x, bar.y + bar.height / 2 + 4);
      });
      ctx.restore();
    }
  };

  var datasets = [
    {
      type: 'bar',
      label: 'Multas',
      data: qtdes,
      backgroundColor: barColor,
      borderWidth: 0,
      barPercentage: 0.6,
      yAxisID: 'yLeft',
      pointStyle: 'circle', pointBackgroundColor: barColor,
      datalabels: { display: false },
    },
    {
      type: 'line',
      label: 'Valor',
      data: vals,
      borderColor: COR_VALOR_LABEL,
      backgroundColor: COR_VALOR_LABEL,
      pointBackgroundColor: COR_VALOR_LABEL,
      pointRadius: 3,
      tension: 0,
      borderWidth: 2,
      yAxisID: 'yRight',
      datalabels: {
        display: true,
        clip: false,
        anchor: 'end',
        align: 'bottom',
        offset: 4,
        color: COR_VALOR_LABEL,
        font: { weight: 'bold', size: 10 },
        formatter: function(v) { return v > 0 ? multasFmtMoeda(v) : null; }
      }
    }
  ];

  if (orcs.some(function(v){ return v > 0; })) {
    datasets.push({
      type: 'line',
      label: 'Or\u00e7ado',
      data: orcs,
      borderColor: COR_ORCADO,
      backgroundColor: COR_ORCADO,
      pointBackgroundColor: COR_ORCADO,
      pointRadius: 3,
      tension: 0,
      borderWidth: 2,
      yAxisID: 'yRight',
      datalabels: {
        display: true,
        clip: false,
        anchor: 'end',
        align: 'top',
        offset: 4,
        color: COR_ORCADO,
        font: { weight: 'bold', size: 9 },
        formatter: function(v) { return v > 0 ? multasFmtMoeda(v) : null; }
      }
    });
  }

  var chart = new Chart(canvas, {
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: dpr || (window.devicePixelRatio * 2) || 2,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 5, boxHeight: 5, font: { size: 9 }, usePointStyle: true, pointStyle: 'circle' } },
        datalabels: { display: function(ctx) { return ctx.datasetIndex > 0; } }
      },
      scales: {
        yLeft: {
          display: false,
          beginAtZero: true,
          grid: { display: false },
          afterDataLimits: function(axis) { if (axis.max > 0) axis.max *= 2.4; }
        },
        yRight: {
          display: false,
          grid: { display: false },
          afterDataLimits: function(axis) {
            if (axis.max <= 0) return;
            var range = Math.max(axis.max - axis.min, 1);
            axis.max += range * 0.15;
            axis.min -= range * 0.75;
          }
        },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    },
    plugins: [ChartDataLabels, labelPlugin]
  });

  multasChartInstances[canvasId] = chart;
  return chart;
}

// ---------------------------------------------------------------
// GRÁFICO OPERAÇÃO — apenas barras (sem linha orçado p/ algumas empresas)
// ---------------------------------------------------------------
function multasCreateOpChart(canvasId, empId, dados, mesesVisiveis, dpr) {
  multasDestroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const d       = dados[empId] || dados.grupo;
  const meses   = mesesVisiveis;
  const labels  = meses.map(i => MULTAS_MESES_ABREV[i]);
  const valores = meses.map(i => d.op_valores[i] || 0);
  const qtdes   = meses.map(i => d.op_qtde[i]    || 0);
  const barColor = _multasEmpBarColor(empId);

  const labelPlugin = {
    id: 'multasOpLabels',
    afterDatasetsDraw(chart) {
      const { ctx, data, chartArea } = chart;
      const ds0 = chart.getDatasetMeta(0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(chartArea.left, 0, chartArea.right - chartArea.left, chart.height);
      ctx.clip();
      ds0.data.forEach((bar, i) => {
        const val = data.datasets[0].data[i];
        ctx.fillStyle = COR_VALOR_LABEL;
        ctx.font = 'bold 11px Calibri, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(multasFmtMoeda(val), bar.x, bar.y - 4);
        if (qtdes[i]) {
          ctx.fillStyle = '#1d3061';
          ctx.font = 'bold 11px Calibri, Arial';
          ctx.fillText(_multasPadZero(qtdes[i]), bar.x, bar.y + (bar.height / 2) + 4);
        }
      });
      ctx.restore();
    }
  };

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Valor',
        data: valores,
        backgroundColor: barColor,
        borderWidth: 0,
        barPercentage: 0.6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: dpr || (window.devicePixelRatio * 2) || 2,
      plugins: {
        tooltip: { enabled: true },
        datalabels: { display: false },
        legend: { position: 'bottom', labels: { boxWidth: 5, boxHeight: 5, font: { size: 9 }, usePointStyle: true, pointStyle: 'circle' } },
      },
      scales: {
        y: {
          display: false, beginAtZero: true,
          afterDataLimits: function(axis) { if (axis.max > 0) axis.max *= 1.5; }
        },
        x:  { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    },
    plugins: [labelPlugin]
  });

  multasChartInstances[canvasId] = chart;
  return chart;
}

// ---------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------
function _multasEmpBarColor(empId) {
  const map = {
    grupo:  'rgba(236,152,152,.85)',
    '1001': 'rgba(176,176,176,.85)',   // cinza igual ao RIO (#b0b0b0)
    '1001u':'rgba(176,176,176,.70)',   // cinza ligeiramente mais claro
    cat:    'rgba(3,165,165,.55)',
    com:    'rgba(74,144,217,.55)',
  };
  return map[empId] || 'rgba(158,158,158,.5)';
}

function _multasPadZero(n) {
  if (!n && n !== 0) return '';
  return n < 10 ? '0' + n : String(n);
}

// Retorna array de índices de meses com pelo menos 1 valor (UTP ou Op)
function multasMesesComDados(dados, empId) {
  const d = empId === 'grupo' ? dados.grupo : dados[empId];
  if (!d) return [0,1,2,3];
  const idxs = [];
  for (let i = 0; i < 12; i++) {
    if ((d.utp_valores && d.utp_valores[i]) || (d.op_valores && d.op_valores[i]) || (d.utp_orcado && d.utp_orcado[i])) {
      idxs.push(i);
    }
  }
  return idxs.length ? idxs : [0,1,2,3];
}
// ============================================================
//  multas-slides.js — HTML dos slides do módulo Multas Regulatórias
// ============================================================

var LOGO_JCA_URL   = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779238658/JCA_1_mp1ic7.png';
var LOGO_IO_URL    = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779238606/Intelig%C3%AAncia_preto_2_y6idqg.png';
var LOGO_IO_CAPA_URL = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1781283106/Intelig%C3%AAncia_horizontal_preto_p6gikp_mwb3ts.png';

// Cabeçalho padrão dos slides
function multasSlideHeader() {
  return '<div class="multas-slide-header">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4px">'
    +   '<img src="' + LOGO_JCA_URL + '" class="logo-jca" alt="JCA" style="height:30px;width:auto;object-fit:contain;">'
    +   '<span style="font-size:10px;color:#bbb;letter-spacing:1.5px;font-weight:500">Multas Regulat&oacute;rias</span>'
    + '</div>'
    + '<div style="height:3px;background:#1d3061;width:100%;flex-shrink:0"></div>'
    + '</div>';
}

// Rodapé padrão
function multasSlideFooter(dataAtualizacao, analista) {
  var txt = analista ? "DO.ACT.IOP - " + analista : "DO.ACT.IOP";
  var spans = txt.split(" ").map(function(w) { return "<span>" + w + "</span>"; }).join("");
  var dataSpan = dataAtualizacao ? '<span class="data-atualizacao">Dados atualizados em ' + dataAtualizacao + '</span>' : '';
  return '<div class="multas-slide-footer" style="position:absolute;bottom:8px;left:18px;right:18px;display:flex;justify-content:space-between;align-items:center;">'
    + '<span class="slide__footer-text" style="display:inline-flex;flex-wrap:wrap;gap:0.25em;font-size:9px;color:#bbb;">' + spans + '</span>'
    + (dataSpan ? dataSpan : '')
    + '<img src="' + LOGO_IO_URL + '" class="logo-io" alt="IO" style="height:28px;">'
    + '</div>';
}

// ---------------------------------------------------------------
// SLIDE 1 — CAPA
// ---------------------------------------------------------------
function multasSlideCapa(state) {
  const mesLabel = MULTAS_MESES_FULL[state.mes] || '';
  const ano      = state.ano || new Date().getFullYear();
  return `
    <div class="multas-slide" id="multas-slide-capa">
      <div class="multas-slide-capa">
        <div class="logos-row">
          <img src="${LOGO_JCA_URL}" alt="JCA">
          <div class="sep"></div>
          <img src="${LOGO_IO_CAPA_URL}" alt="IO" style="opacity:.9">
        </div>
        <div class="titulo">Multas Regulatórias</div>
        <div class="subtitulo">${mesLabel} / ${ano}</div>
      </div>
      <div class="multas-rodape-autor">${state.analista ? 'DO.ACT.IOP - ' + state.analista : 'DO.ACT.IOP'}</div>
    </div>`;
}

// ---------------------------------------------------------------
// SLIDE 2 — Total Multas Recebidas UTP (Grupo JCA)
// ---------------------------------------------------------------
function multasSlideUTPGrupo(state) {
  const d = state.dados.grupo;
  const mesesVis = multasMesesComDados(state.dados, 'grupo');
  return `
    <div class="multas-slide" id="multas-slide-utp-grupo">
      ${multasSlideHeader()}
      <div class="multas-slide-body">
        <div class="multas-slide-secao">Total Multas Recebidas UTP – ${state.ano}</div>
        <div class="sin-kpi-row">
          <div class="sin-kpi-card">
            <div class="sin-kpi-label">Acumulado:</div>
            <div class="sin-kpi-val">${multasFmtMoeda(d.utp_acum)} <span style="font-weight:400;font-size:0.85em;opacity:.75">(${_multasPadZero2(d.utp_qtde ? d.utp_qtde.reduce((a,b)=>a+b,0) : 0)})</span></div>
          </div>
          <div class="sin-kpi-card">
            <div class="sin-kpi-label">CPK 1.000 km:</div>
            <div class="sin-kpi-val">${multasFmtCpk(d.utp_cpk)}</div>
          </div>
        </div>
        <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:6px;">Evolução Anual</div>
        <div class="multas-chart-area" style="height:300px;position:relative;">
          <canvas id="chart-utp-grupo-slide"></canvas>
        </div>
      </div>
      ${multasSlideFooter(state.dataAtualizacao, state.analista)}
    </div>`;
}

// ---------------------------------------------------------------
// SLIDE — Multas Regulatórias Operação (Grupo JCA)
// ---------------------------------------------------------------
function multasSlideOpGrupo(state) {
  const d = state.dados.grupo;
  const qtdeAcum = (d.op_qtde || []).reduce((a,b)=>a+b,0);
  return `
    <div class="multas-slide" id="multas-slide-op-grupo">
      ${multasSlideHeader()}
      <div class="multas-slide-body">
        <div class="multas-slide-secao">Multas Regulatórias <span class="sub">(Operação)</span></div>
        <div class="sin-kpi-row">
          <div class="sin-kpi-card">
            <div class="sin-kpi-label">Acumulado:</div>
            <div class="sin-kpi-val">${multasFmtMoeda(d.op_acum||0)} <span style="font-weight:400;font-size:0.85em;opacity:.75">(${_multasPadZero2(qtdeAcum)})</span></div>
          </div>
          <div class="sin-kpi-card">
            <div class="sin-kpi-label">CPK 1.000 km:</div>
            <div class="sin-kpi-val">${multasFmtCpk(d.op_cpk||0)}</div>
          </div>
        </div>
        <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:6px;">Evolução Anual</div>
        <div class="multas-chart-area" style="height:300px;position:relative;">
          <canvas id="chart-op-grupo-slide"></canvas>
        </div>
      </div>
      ${multasSlideFooter(state.dataAtualizacao, state.analista)}
    </div>`;
}

// ---------------------------------------------------------------
// SLIDE 3 — Custos por Áreas
// ---------------------------------------------------------------
function multasSlideCustos(state) {
  const C = state.dados.grupo.custos;
  const rows = [
    { id: 'grupo' },
    { id: '1001'  },
    { id: '1001u' },
    { id: 'cat'   },
    { id: 'com'   },
  ];

  const BG_DARK    = '#b8b8b8';   // cinza escuro — 1ª linha e última coluna
  const BG_LIGHT   = '#f0f0f0';   // cinza claro — demais linhas
  const TXT_OP     = '#c0392b';   // vermelho operação
  const TXT_NAVY   = '#1d3061';   // navy — geral
  const TXT_BODY   = '#444';
  const SEP        = '2px solid #fff'; // divisória branca

  const headerRow = `
    <tr style="background:${BG_DARK};">
      <th style="padding:9px 12px;border-right:${SEP};width:110px;"></th>
      <th style="padding:9px 10px;text-align:center;font-size:10px;letter-spacing:.5px;color:${TXT_OP};border-right:${SEP};">OPERAÇÃO</th>
      <th style="padding:9px 10px;text-align:center;font-size:10px;letter-spacing:.5px;color:#555;border-right:${SEP};">COMERCIAL</th>
      <th style="padding:9px 10px;text-align:center;font-size:10px;letter-spacing:.5px;color:#555;border-right:${SEP};">MANUTENÇÃO</th>
      <th style="padding:9px 10px;text-align:center;font-size:10px;letter-spacing:.5px;color:#555;border-right:${SEP};">EXTRATO</th>
      <th style="padding:9px 10px;text-align:center;font-size:10px;letter-spacing:.5px;color:${TXT_NAVY};background:${BG_DARK};">GERAL</th>
    </tr>`;

  const bodyRows = rows.map((r) => {
    const c = C[r.id] || {};
    return `
      <tr style="border-bottom:${SEP};">
        <td style="padding:8px 12px;border-right:${SEP};border-bottom:${SEP};background:${BG_LIGHT};text-align:center;vertical-align:middle;">
          <img src="${MULTAS_LOGOS[r.id]}" style="max-height:22px;max-width:90px;object-fit:contain;display:block;margin:0 auto;" alt="">
        </td>
        <td style="padding:7px 10px;text-align:center;font-size:12px;font-weight:700;color:${TXT_OP};border-right:${SEP};border-bottom:${SEP};background:${BG_LIGHT};">${multasFmtMoeda(c.operacao)}</td>
        <td style="padding:7px 10px;text-align:center;font-size:12px;color:${TXT_BODY};border-right:${SEP};border-bottom:${SEP};background:${BG_LIGHT};">${multasFmtMoeda(c.comercial)}</td>
        <td style="padding:7px 10px;text-align:center;font-size:12px;color:${TXT_BODY};border-right:${SEP};border-bottom:${SEP};background:${BG_LIGHT};">${multasFmtMoeda(c.manutencao)}</td>
        <td style="padding:7px 10px;text-align:center;font-size:12px;color:${TXT_BODY};border-right:${SEP};border-bottom:${SEP};background:${BG_LIGHT};">${multasFmtMoeda(c.extrato)}</td>
        <td style="padding:7px 10px;text-align:center;font-size:12px;font-weight:700;color:${TXT_NAVY};border-bottom:${SEP};background:${BG_DARK};">${multasFmtMoeda(c.geral)}</td>
      </tr>`;
  }).join('');

  return `
    <div class="multas-slide" id="multas-slide-custos">
      ${multasSlideHeader()}
      <div class="multas-slide-body" style="display:flex;flex-direction:column;justify-content:center;">
        <div class="multas-slide-secao">Valores – ${state.ano} <span class="sub">| Custos por Áreas</span></div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;">
          <table style="width:92%;border-collapse:separate;border-spacing:0;border-radius:8px;overflow:hidden;
            box-shadow:0 4px 16px rgba(0,0,0,.15);">
            <thead>${headerRow}</thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>
      </div>
      ${multasSlideFooter(state.dataAtualizacao, state.analista)}
    </div>`;
}

// ---------------------------------------------------------------
// SLIDE — Multas Recebidas UTP por empresa
// ---------------------------------------------------------------
function multasSlideUTPEmpresa(state, empId) {
  const d = state.dados[empId] || {};
  const qtdeAcum = (d.utp_qtde || []).reduce((a,b)=>a+b,0);
  return `
    <div class="multas-slide" id="multas-slide-utp-${empId}">
      ${multasSlideHeader()}
      <div class="multas-slide-body">
        <div style="position:relative;">
          <div class="multas-slide-secao">Multas Recebidas UTP – ${state.ano}</div>
          <img src="${empId === '1001u' ? MULTAS_LOGO_1001U : MULTAS_LOGOS[empId]}" class="multas-emp-logo" alt="${MULTAS_EMP_LABEL[empId]}">
        </div>
        <div class="sin-kpi-row">
          <div class="sin-kpi-card">
            <div class="sin-kpi-label">Acumulado:</div>
            <div class="sin-kpi-val">${multasFmtMoeda(d.utp_acum)} <span style="font-weight:400;font-size:0.85em;opacity:.75">(${_multasPadZero2(qtdeAcum)})</span></div>
          </div>
          <div class="sin-kpi-card">
            <div class="sin-kpi-label">CPK 1.000 km:</div>
            <div class="sin-kpi-val">${multasFmtCpk(d.utp_cpk)}</div>
          </div>
        </div>
        <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:6px;">Evolução Anual</div>
        <div class="multas-chart-area" style="height:280px;position:relative;">
          <canvas id="chart-utp-${empId}-slide"></canvas>
        </div>
      </div>
      ${multasSlideFooter(state.dataAtualizacao, state.analista)}
    </div>`;
}

// ---------------------------------------------------------------
// SLIDE — Multas Regulatórias Operação por empresa
// ---------------------------------------------------------------
function multasSlideOpEmpresa(state, empId) {
  const d = state.dados[empId] || {};
  const qtdeAcum = (d.op_qtde || []).reduce((a,b)=>a+b,0);
  return `
    <div class="multas-slide" id="multas-slide-op-${empId}">
      ${multasSlideHeader()}
      <div class="multas-slide-body">
        <div style="position:relative;">
          <div class="multas-slide-secao">Multas Regulatórias <span class="sub">(Operação)</span></div>
          <img src="${empId === '1001u' ? MULTAS_LOGO_1001U : MULTAS_LOGOS[empId]}" class="multas-emp-logo" alt="${MULTAS_EMP_LABEL[empId]}">
        </div>
        <div class="sin-kpi-row">
          <div class="sin-kpi-card">
            <div class="sin-kpi-label">Acumulado:</div>
            <div class="sin-kpi-val">${multasFmtMoeda(d.op_acum)} <span style="font-weight:400;font-size:0.85em;opacity:.75">(${_multasPadZero2(qtdeAcum)})</span></div>
          </div>
          <div class="sin-kpi-card">
            <div class="sin-kpi-label">CPK 1.000 km:</div>
            <div class="sin-kpi-val">${multasFmtCpk(d.op_cpk)}</div>
          </div>
        </div>
        <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:6px;">Evolução Anual</div>
        <div class="multas-chart-area" style="height:280px;position:relative;">
          <canvas id="chart-op-${empId}-slide"></canvas>
        </div>
      </div>
      ${multasSlideFooter(state.dataAtualizacao, state.analista)}
    </div>`;
}

// ---------------------------------------------------------------
// SLIDE — Motivos do mês (Operação)
// ---------------------------------------------------------------
function multasSlideMotivos(state, empId) {
  const d = state.dados[empId] || {};
  const motivos = d.motivos || [];
  const mesLabel = MULTAS_MESES_FULL[state.mes] || '';
  const recebido = motivos.reduce((a,m)=>a+(parseFloat(m.valor)||0), 0);
  const qtdeTotal = motivos.reduce((a,m)=>a+(parseInt(m.qtde)||0), 0);

  // Cor do header da tabela por empresa
  const headerBg = {
    '1001':  '#b0b0b0',
    '1001u': '#b0b0b0',
    cat:     '#03a5a5',
    com:     '#1d3061',
  }[empId] || '#e05c5c';

  const valorCor  = '#1d3061';
  const rowBg     = { '1001':'#f5f5f5','1001u':'#f5f5f5', cat:'#f0fafa', com:'#f0f2f8' }[empId] || '#fdf5f5';

  const trs = motivos.length
    ? motivos.map((m, i) => `
        <tr style="${i % 2 === 0 ? 'background:'+rowBg : 'background:#fff'}">
          <td class="td-qtde">${_multasPadZero2(m.qtde)}</td>
          <td style="font-weight:600">${m.descricao || ''}</td>
          <td class="td-valor" style="color:${valorCor}">${multasFmtMoeda(m.valor)}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="text-align:center;color:#aaa;padding:16px;">Sem registros</td></tr>`;

  return `
    <div class="multas-slide" id="multas-slide-motivos-${empId}">
      ${multasSlideHeader()}
      <div class="multas-slide-body">
        <div style="position:relative;">
          <div class="multas-slide-secao">Multas Recebidas <span class="sub">| Operação – ${mesLabel}/${state.ano}</span></div>
          <img src="${empId === '1001u' ? MULTAS_LOGO_1001U : MULTAS_LOGOS[empId]}" class="multas-emp-logo" alt="${MULTAS_EMP_LABEL[empId]}">
        </div>
        <div class="sin-kpi-row" style="margin:8px 0 14px;">
          <div class="sin-kpi-card">
            <div class="sin-kpi-label">Recebidas:</div>
            <div class="sin-kpi-val">${multasFmtMoeda(recebido)} <span style="font-weight:400;font-size:0.85em;opacity:.75">(${_multasPadZero2(qtdeTotal)})</span></div>
          </div>
        </div>
        <table class="multas-motivos-slide-table">
          <thead style="background:${headerBg};">
            <tr>
              <th class="col-qtde">QTDE</th>
              <th>MOTIVOS</th>
              <th class="col-valor">VALOR</th>
            </tr>
          </thead>
          <tbody>${trs}</tbody>
        </table>
      </div>
      ${multasSlideFooter(state.dataAtualizacao, state.analista)}
    </div>`;
}

// ---------------------------------------------------------------
// SLIDE — Plano de Ação
// ---------------------------------------------------------------
function multasSlidePlanoAcao(state, empId) {
  const d        = state.dados[empId] || {};
  const plano    = d.planoAcao || {};
  const motivos  = (d.motivos || []).filter(m => m.descricao);
  const mesLabel = MULTAS_MESES_ABREV[state.mes] || '';
  const logoUrl  = empId === '1001u' ? MULTAS_LOGO_1001U : MULTAS_LOGOS[empId];
  const corEmp   = { '1001':'#b0b0b0','1001u':'#b0b0b0', cat:'#03a5a5', com:'#1d3061' }[empId] || '#c0392b';

  // KPIs: total de multas Op e valor
  const totalQtde  = motivos.reduce(function(s,m){ return s + (parseInt(m.qtde)||0); }, 0);
  const totalValor = motivos.reduce(function(s,m){ return s + (parseFloat(m.valor)||0); }, 0);

  // Plano de ação em bullets
  const texto   = plano.resposta || plano.texto || '';
  const linhas  = texto.split('\n').filter(function(l){ return l.trim(); });
  const bullets = linhas.length === 0
    ? '<span class="slide-plano__empty">Nenhum plano preenchido.</span>'
    : '<ul style="padding-left:18px;margin:0;line-height:1.8;">'
      + linhas.map(function(l){ return '<li>' + l + '</li>'; }).join('')
      + '</ul>';

  return '<div class="multas-slide" id="multas-slide-plano-' + empId + '">'
    + multasSlideHeader()
    + '<div class="multas-slide-body" style="display:flex;flex-direction:column;">'
    +   '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-shrink:0;">'
    +     '<div class="multas-slide-secao" style="margin-bottom:0;">Plano de Ação — ' + mesLabel + '</div>'
    +     '<img src="' + logoUrl + '" style="height:30px;object-fit:contain;" alt="' + (MULTAS_EMP_LABEL[empId]||'') + '">'
    +   '</div>'
    +   '<div style="display:flex;gap:10px;flex-shrink:0;margin-bottom:14px;">'
    +     '<div style="display:flex;align-items:center;gap:12px;background:#f8f9fb;border-left:4px solid ' + corEmp + ';border-radius:6px;padding:8px 16px;">'
    +       '<div style="font-size:22px;font-weight:700;color:' + corEmp + ';min-width:28px;text-align:center;">' + totalQtde + '</div>'
    +       '<div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.4px;line-height:1.3;">Multas<br>Operação</div>'
    +     '</div>'
    +     '<div style="display:flex;align-items:center;gap:12px;background:#fdf5f5;border-left:4px solid #c0392b;border-radius:6px;padding:8px 16px;">'
    +       '<div style="font-size:18px;font-weight:700;color:#c0392b;white-space:nowrap;">' + multasFmtMoeda(totalValor) + '</div>'
    +       '<div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.4px;line-height:1.3;">Valor<br>Total</div>'
    +     '</div>'
    +   '</div>'
    +   '<div style="background:' + corEmp + ';color:#fff;font-weight:700;font-size:11px;padding:7px 0;border-radius:4px;letter-spacing:1px;flex-shrink:0;margin-bottom:10px;text-align:center;width:100%;">PLANO DE AÇÃO</div>'
    +   '<div style="flex:1;overflow:hidden;font-size:13px;color:#333;line-height:1.8;padding-bottom:36px;">'
    +     bullets
    +   '</div>'
    + '</div>'
    + multasSlideFooter(state.dataAtualizacao, state.analista)
    + '</div>';
}
// ---------------------------------------------------------------
// Helper
// ---------------------------------------------------------------
function _multasPadZero2(n) {
  if (!n && n !== 0) return '000';
  return n < 10 ? '0' + n : String(n);
}

// ---------------------------------------------------------------
// Renderiza TODOS os slides e insere no container
// ---------------------------------------------------------------
function multasRenderAllSlides(state, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const empresasDetalhe = ['1001','1001u','cat','com'];

  let html = '';
  html += multasSlideCapa(state);
  html += multasSlideUTPGrupo(state);
  html += multasSlideCustos(state);
  html += multasSlideOpGrupo(state);

  for (const empId of empresasDetalhe) {
    html += multasSlideUTPEmpresa(state, empId);
    html += multasSlideOpEmpresa(state, empId);
    html += multasSlideMotivos(state, empId);
    html += multasSlidePlanoAcao(state, empId);
  }

  container.innerHTML = html;

  // Aguarda DOM e renderiza gráficos
  requestAnimationFrame(() => {
    const mesesGrupo = multasMesesComDados(state.dados, 'grupo');
    multasCreateUTPChart('chart-utp-grupo-slide', 'grupo', state.dados, mesesGrupo);
    multasCreateOpChart('chart-op-grupo-slide', 'grupo', state.dados, mesesGrupo);

    for (const empId of empresasDetalhe) {
      const mesesUTP = multasMesesComDados(state.dados, empId);
      multasCreateUTPChart(`chart-utp-${empId}-slide`, empId, state.dados, mesesUTP);
      multasCreateOpChart(`chart-op-${empId}-slide`,   empId, state.dados, mesesUTP);
    }
  });
}
// ============================================================
//  multas-screens.js — UI do Step 2 (formulários) do módulo Multas
// ============================================================

// Renderiza o conteúdo completo do Step 2
function multasRenderStep2(state, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var tabAtiva = state._tabAtiva || 'grupo';

  // Tabs empresa
  var empTabs = ['grupo','1001','1001u','cat','com'].map(function(id) {
    var label = MULTAS_EMP_LABEL[id];
    var active = id === tabAtiva;
    return '<button class="sin-form-tab' + (active ? ' sin-form-tab--active' : '') + '"'
      + ' data-action="multas-set-tab" data-multas-tab="' + id + '">' + label + '</button>';
  }).join('')
  + '<button class="sin-form-tab' + (tabAtiva === 'plano' ? ' sin-form-tab--active' : '') + '"'
  + ' data-action="multas-set-tab" data-multas-tab="plano">&#128203; Plano de A&ccedil;&atilde;o</button>';

  // Conteúdo esquerdo
  var leftContent = '';
  if (tabAtiva === 'plano') {
    leftContent = multasPanelPlano(state);
  } else if (tabAtiva === 'grupo') {
    leftContent = multasPanelGrupo(state);
  } else {
    leftContent = multasPanelEmpresa(state, tabAtiva);
  }

  // Preview direito
  var rightContent = multasPreviewHTML(state, tabAtiva);

  container.innerHTML = '<div class="sin-form-tabs">' + empTabs + '</div>'
    + '<div style="display:flex;gap:20px;flex:1;min-height:0;margin-top:8px;overflow:hidden">'
    +   '<div style="flex:0 0 55%;overflow-y:auto;min-width:0">' + leftContent + '</div>'
    +   '<div style="flex:1;min-width:320px;background:#fff;border-radius:12px;padding:16px;border:1px solid #eee;display:flex;flex-direction:column;overflow-y:auto">'
    +     rightContent
    +   '</div>'
    + '</div>';

  multasBindStep2Events(state);

  // Renderiza gráfico preview
  setTimeout(function() { multasUpdatePreviewChart(state, tabAtiva); }, 60);
}

// ── Preview coluna direita ─────────────────────────────
function multasPreviewHTML(state, tabAtiva) {
  if (tabAtiva === 'plano') {
    return '<div class="preview-hd">Plano de A&ccedil;&atilde;o</div>'
      + '<div class="preview-sub">Preencha o motivo e plano de cada empresa</div>'
      + '<div style="margin-top:16px;font-size:12px;color:#888;line-height:1.8">'
      + '&#128204; Os dados preenchidos aqui ser&atilde;o exibidos no slide de Plano de A&ccedil;&atilde;o por empresa.'
      + '</div>';
  }
  var empLabel = MULTAS_EMP_LABEL[tabAtiva] || 'Grupo JCA';
  var d = tabAtiva === 'grupo' ? state.dados.grupo : (state.dados[tabAtiva] || {});
  var qtdeUTP = (d.utp_qtde || []).reduce(function(a,b){return a+b;},0);
  var qtdeOp  = (d.op_qtde  || []).reduce(function(a,b){return a+b;},0);

  return '<div class="preview-hd">Preview &mdash; ' + empLabel + '</div>'
    + '<div class="preview-sub">' + MULTAS_MESES_FULL[state.mes] + '/' + state.ano + '</div>'
    + '<div style="font-size:10px;font-weight:700;color:#aaa;letter-spacing:1px;margin:10px 0 4px">MULTAS RECEBIDAS UTP</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">'
    +   _multasKpiMini('Acumulado', multasFmtMoeda(d.utp_acum||0), 'multas-pv-utp-acum')
    +   _multasKpiMini('CPK 1.000 km', multasFmtCpk(d.utp_cpk||0), 'multas-pv-utp-cpk', '#e05c5c')
    +   _multasKpiMini('Qtde', qtdeUTP, 'multas-pv-utp-qtde')
    + '</div>'
    + '<div style="height:150px;margin-bottom:12px"><canvas id="multas-preview-chart-utp"></canvas></div>'
    + '<div style="font-size:10px;font-weight:700;color:#aaa;letter-spacing:1px;margin:4px 0">MULTAS REGULAT&Oacute;RIAS (OPERA&Ccedil;&Atilde;O)</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">'
    +   _multasKpiMini('Acumulado', multasFmtMoeda(d.op_acum||0), 'multas-pv-op-acum')
    +   _multasKpiMini('CPK 1.000 km', multasFmtCpk(d.op_cpk||0), 'multas-pv-op-cpk', '#e05c5c')
    +   _multasKpiMini('Qtde', qtdeOp, 'multas-pv-op-qtde')
    + '</div>'
    + '<div style="height:150px"><canvas id="multas-preview-chart-op"></canvas></div>';
}

function _multasKpiMini(lbl, val, id, cor) {
  return '<div style="border:1px solid #e8e8e8;border-radius:6px;padding:6px 8px">'
    + '<div style="font-size:9px;color:#aaa;font-weight:600;margin-bottom:2px">' + lbl + '</div>'
    + '<div id="' + id + '" style="font-size:12px;font-weight:700;color:' + (cor||'#1d3061') + '">' + val + '</div>'
    + '</div>';
}

var _multasPreviewChartUTP = null;
var _multasPreviewChartOp  = null;

function multasUpdatePreviewChart(state, tabAtiva) {
  if (tabAtiva === 'plano') return;
  var d        = tabAtiva === 'grupo' ? state.dados.grupo : (state.dados[tabAtiva] || {});
  var ate      = state.mes + 1;
  var labels   = MULTAS_MESES_ABREV.slice(0, ate);
  var barColor = _multasEmpBarColor(tabAtiva);

  if (_multasPreviewChartUTP) { _multasPreviewChartUTP.destroy(); _multasPreviewChartUTP = null; }
  var cUTP = document.getElementById('multas-preview-chart-utp');
  if (cUTP) {
    var utpQ = (d.utp_qtde    || Array(12).fill(0)).slice(0, ate);
    var utpV = (d.utp_valores || Array(12).fill(0)).slice(0, ate);
    var utpO = (d.utp_orcado  || Array(12).fill(0)).slice(0, ate);
    _multasPreviewChartUTP = _multasBuildPreviewChart(cUTP, labels, utpQ, utpV,
      utpO.some(function(v){return v>0;}) ? utpO : null, barColor);
  }

  if (_multasPreviewChartOp) { _multasPreviewChartOp.destroy(); _multasPreviewChartOp = null; }
  var cOp = document.getElementById('multas-preview-chart-op');
  if (cOp) {
    var opQ = (d.op_qtde    || Array(12).fill(0)).slice(0, ate);
    var opV = (d.op_valores || Array(12).fill(0)).slice(0, ate);
    _multasPreviewChartOp = _multasBuildPreviewChart(cOp, labels, opQ, opV, null, barColor);
  }

  _multasAtualizaKpisMini(state, tabAtiva);
}

function _multasBuildPreviewChart(canvas, labels, qtdes, valores, orcados, barColor) {
  var datasets = [
    {
      type: 'bar', label: 'Multas',
      data: qtdes,
      backgroundColor: barColor, borderWidth: 0, barPercentage: 0.6,
      yAxisID: 'yLeft',
      pointStyle: 'circle', pointBackgroundColor: barColor,
      datalabels: {
        display: true, anchor: 'center', align: 'center',
        color: '#1d3061', font: { size: 9, weight: 'bold' },
        formatter: function(v) { return v > 0 ? v : null; }
      }
    },
    {
      type: 'line', label: 'Valor (R$)',
      data: valores,
      borderColor: '#e05c5c', backgroundColor: '#e05c5c',
      pointRadius: 3, borderWidth: 2, tension: 0,
      yAxisID: 'yRight',
      pointStyle: 'circle', pointBackgroundColor: '#e05c5c',
      datalabels: {
        display: true, anchor: 'end', align: 'bottom', offset: 4, clip: false,
        color: '#c0392b', font: { size: 8, weight: 'bold' },
        formatter: function(v) { return v > 0 ? multasFmtMoeda(v) : null; }
      }
    }
  ];
  if (orcados) {
    datasets.push({
      type: 'line', label: 'Or\u00e7ado',
      data: orcados,
      borderColor: '#1d3061', backgroundColor: '#1d3061',
      pointRadius: 3, borderWidth: 2, borderDash: [4,3], tension: 0,
      yAxisID: 'yRight',
      pointStyle: 'circle', pointBackgroundColor: '#1d3061',
      datalabels: {
        display: true, anchor: 'end', align: 'top', offset: 4, clip: false,
        color: '#1d3061', font: { size: 8, weight: 'bold' },
        formatter: function(v) { return v > 0 ? multasFmtMoeda(v) : null; }
      }
    });
  }
  return new Chart(canvas, {
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 5, boxHeight: 5, font: { size: 9 }, usePointStyle: true, pointStyle: 'circle' } },
        datalabels: { clip: false },
      },
      scales: {
        yLeft: {
          display: false, beginAtZero: true,
          afterDataLimits: function(axis) { if (axis.max > 0) axis.max *= 2.4; }
        },
        yRight: {
          display: false,
          afterDataLimits: function(axis) {
            if (axis.max <= 0) return;
            var r = Math.max(axis.max - axis.min, 1);
            axis.max += r * 0.15;
            axis.min -= r * 0.75;
          }
        },
        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#777' } }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function _multasAtualizaKpisMini(state, tabAtiva) {
  var d = tabAtiva === 'grupo' ? state.dados.grupo : (state.dados[tabAtiva] || {});
  var el;
  el = document.getElementById('multas-pv-utp-acum'); if (el) el.textContent = multasFmtMoeda(d.utp_acum||0);
  el = document.getElementById('multas-pv-utp-cpk');  if (el) el.textContent = multasFmtCpk(d.utp_cpk||0);
  el = document.getElementById('multas-pv-utp-qtde'); if (el) el.textContent = (d.utp_qtde||[]).reduce(function(a,b){return a+b;},0);
  el = document.getElementById('multas-pv-op-acum');  if (el) el.textContent = multasFmtMoeda(d.op_acum||0);
  el = document.getElementById('multas-pv-op-cpk');   if (el) el.textContent = multasFmtCpk(d.op_cpk||0);
  el = document.getElementById('multas-pv-op-qtde');  if (el) el.textContent = (d.op_qtde||[]).reduce(function(a,b){return a+b;},0);
}

// ---------------------------------------------------------------
// Painel Grupo JCA — UTP Geral + Tabela Custos por Área
// ---------------------------------------------------------------
function multasPanelGrupo(state) {
  const d = state.dados.grupo;
  // Recalcula GERAL de cada empresa e soma na linha Grupo JCA
  if (d.custos) {
    ['1001','1001u','cat','com'].forEach(eid => {
      const c = d.custos[eid] || {};
      c.geral = (c.operacao||0) + (c.comercial||0) + (c.manutencao||0) + (c.extrato||0);
    });
    // Grupo JCA = soma das empresas
    ['operacao','comercial','manutencao','extrato','geral'].forEach(col => {
      d.custos.grupo[col] = ['1001','1001u','cat','com'].reduce((acc, eid) => {
        return acc + ((d.custos[eid] && d.custos[eid][col]) || 0);
      }, 0);
    });
  }
  return `
    <!-- UTP Grupo -->
    <div class="multas-secao-titulo">Total Multas Recebidas UTP – Grupo JCA</div>
    <div class="multas-totais-row">
      <div class="multas-total-box">
        <div class="lbl">Acumulado (R$)</div>
        <div class="val" id="multas-grupo-acum-val">R$ 0</div>
      </div>
      <div class="multas-total-box">
        <div class="lbl">Qtde total</div>
        <div class="val" id="multas-grupo-acum-qtde">0</div>
      </div>
      <div class="multas-total-box">
        <div class="lbl">CPK 1.000 km</div>
        <input id="multas-grupo-cpk" type="number" step="0.01" value="${d.utp_cpk||0}"
          style="width:100px;padding:4px 8px;border:1.5px solid #ddd;border-radius:5px;font-size:13px;" placeholder="0,00">
      </div>
    </div>

    <div style="margin-bottom:8px;font-size:12px;font-weight:600;color:#666;">Valores UTP por mês (R$)</div>
    ${multasMesesInputRow('grupo', 'utp_valores', d.utp_valores, state.mes)}
    <div style="margin:8px 0 4px;font-size:12px;font-weight:600;color:#666;">Quantidade por mês</div>
    ${multasMesesInputRow('grupo', 'utp_qtde', d.utp_qtde, state.mes, true)}
    <div style="margin:8px 0 4px;font-size:12px;font-weight:600;color:#666;">Orçado por mês (R$)</div>
    ${multasMesesInputRow('grupo', 'utp_orcado', d.utp_orcado, state.mes)}

    <!-- Operação Grupo -->
    <div class="multas-secao-titulo" style="margin-top:24px;">Multas Regulatórias (Operação) – Grupo JCA</div>
    <div class="multas-totais-row">
      <div class="multas-total-box">
        <div class="lbl">Acumulado (R$)</div>
        <div class="val" id="multas-grupo-op-acum-val">${multasFmtMoeda(d.op_acum||0)}</div>
      </div>
      <div class="multas-total-box">
        <div class="lbl">CPK 1.000 km</div>
        <input id="multas-grupo-op-cpk" type="number" step="0.01" value="${d.op_cpk||0}"
          style="width:100px;padding:4px 8px;border:1.5px solid #ddd;border-radius:5px;font-size:13px;" placeholder="0,00">
      </div>
    </div>
    <div style="margin-bottom:4px;font-size:12px;font-weight:600;color:#666;">Valores Operação por mês (R$)</div>
    ${multasMesesInputRow('grupo', 'op_valores', d.op_valores||Array(12).fill(0), state.mes)}
    <div style="margin:6px 0 4px;font-size:12px;font-weight:600;color:#666;">Quantidade Operação por mês</div>
    ${multasMesesInputRow('grupo', 'op_qtde', d.op_qtde||Array(12).fill(0), state.mes, true)}

    <!-- Tabela Custos por Área -->
    <div class="multas-secao-titulo" style="margin-top:24px;">Custos por Áreas – Acumulado ${state.ano}</div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f0f3fb;">
            <th style="padding:8px;text-align:left;font-size:11px;color:#888;">EMPRESA</th>
            <th style="padding:8px;color:#e05c5c;font-size:11px;">OPERAÇÃO</th>
            <th style="padding:8px;font-size:11px;">COMERCIAL</th>
            <th style="padding:8px;font-size:11px;">MANUTENÇÃO</th>
            <th style="padding:8px;font-size:11px;">EXTRATO</th>
            <th style="padding:8px;font-size:11px;color:#1d3061;">GERAL</th>
          </tr>
        </thead>
        <tbody>
          ${['grupo','1001','1001u','cat','com'].map(eid => {
            const c = (d.custos && d.custos[eid]) || {};
            return `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:6px 8px;font-weight:600;font-size:12px;">${MULTAS_EMP_LABEL[eid]}</td>
                ${['operacao','comercial','manutencao','extrato','geral'].map(campo => {
                  var isReadonly = campo === 'geral' || eid === 'grupo';
                  var val = c[campo] || 0;
                  var fmtVal = val > 0 ? Number(val).toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:2}) : '';
                  return `
                  <td style="text-align:center;padding:4px 6px;">
                    <input type="text" value="${fmtVal}"
                      data-custo="${eid}" data-campo="${campo}"
                      class="multas-custo-inp"
                      ${isReadonly
                        ? `id="multas-custo-${campo}-${eid}" readonly style="width:90px;padding:4px 6px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:right;background:#f5f6fa;font-weight:700;color:#1d3061;"`
                        : `style="width:90px;padding:4px 6px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:right;"`}>
                  </td>`;
                }).join('')}
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

// ---------------------------------------------------------------
// Painel por empresa (1001, 1001u, cat, com)
// ---------------------------------------------------------------
function multasPanelEmpresa(state, empId) {
  const d = state.dados[empId] || {};
  const label = MULTAS_EMP_LABEL[empId];

  return `
    <!-- UTP -->
    <div class="multas-secao-titulo">Multas Recebidas UTP – ${label}</div>
    <div class="multas-totais-row">
      <div class="multas-total-box">
        <div class="lbl">Acumulado (R$)</div>
        <div class="val" id="multas-${empId}-utp-acum-val">R$ 0</div>
      </div>
      <div class="multas-total-box">
        <div class="lbl">CPK 1.000 km (UTP)</div>
        <input id="multas-${empId}-utp-cpk" type="number" step="0.01" value="${d.utp_cpk||0}"
          style="width:100px;padding:4px 8px;border:1.5px solid #ddd;border-radius:5px;font-size:13px;" placeholder="0,00">
      </div>
    </div>
    <div style="margin-bottom:4px;font-size:12px;font-weight:600;color:#666;">Valores UTP por mês (R$)</div>
    ${multasMesesInputRow(empId, 'utp_valores', d.utp_valores, state.mes)}
    <div style="margin:6px 0 4px;font-size:12px;font-weight:600;color:#666;">Quantidade UTP por mês</div>
    ${multasMesesInputRow(empId, 'utp_qtde', d.utp_qtde, state.mes, true)}
    <div style="margin:6px 0 4px;font-size:12px;font-weight:600;color:#666;">Orçado UTP por mês (R$)</div>
    ${multasMesesInputRow(empId, 'utp_orcado', d.utp_orcado, state.mes)}

    <!-- Operação -->
    <div class="multas-secao-titulo" style="margin-top:22px;">Multas Regulatórias (Operação) – ${label}</div>
    <div class="multas-totais-row">
      <div class="multas-total-box">
        <div class="lbl">Acumulado (R$)</div>
        <div class="val" id="multas-${empId}-op-acum-val">R$ 0</div>
      </div>
      <div class="multas-total-box">
        <div class="lbl">CPK 1.000 km (Op)</div>
        <input id="multas-${empId}-op-cpk" type="number" step="0.01" value="${d.op_cpk||0}"
          style="width:100px;padding:4px 8px;border:1.5px solid #ddd;border-radius:5px;font-size:13px;" placeholder="0,00">
      </div>
    </div>
    <div style="margin-bottom:4px;font-size:12px;font-weight:600;color:#666;">Valores Operação por mês (R$)</div>
    ${multasMesesInputRow(empId, 'op_valores', d.op_valores, state.mes)}
    <div style="margin:6px 0 4px;font-size:12px;font-weight:600;color:#666;">Quantidade Operação por mês</div>
    ${multasMesesInputRow(empId, 'op_qtde', d.op_qtde, state.mes, true)}

    <!-- Motivos do mês -->
    <div class="multas-secao-titulo" style="margin-top:22px;">Motivos – ${MULTAS_MESES_FULL[state.mes]}/${state.ano}</div>
    <table class="multas-motivos-table" id="multas-motivos-table-${empId}">
      <thead>
        <tr>
          <th style="width:60px;">QTDE</th>
          <th>DESCRIÇÃO</th>
          <th style="width:120px;">VALOR (R$)</th>
          <th style="width:36px;"></th>
        </tr>
      </thead>
      <tbody>
        ${(d.motivos||[]).map((m,i)=>multasMotivoRow(empId,i,m)).join('')}
      </tbody>
    </table>
    <button class="multas-add-motivo-btn" data-emp="${empId}" id="multas-add-motivo-${empId}">+ Adicionar motivo</button>
  `;
}

// ---------------------------------------------------------------
// Painel Plano de Ação (todas as empresas)
var MULTAS_LOGO_1001U = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1781307419/1001_URB_m1lbdu.png';

// ---------------------------------------------------------------
function multasPanelPlano(state) {
  const empresas = ['1001','1001u','cat','com'];
  const logoMap = {
    '1001':  MULTAS_LOGOS['1001'],
    '1001u': MULTAS_LOGO_1001U,
    cat:     MULTAS_LOGOS['cat'],
    com:     MULTAS_LOGOS['com'],
  };
  const corMap = { '1001':'#b0b0b0','1001u':'#b0b0b0','cat':'#03a5a5','com':'#1d3061' };

  const cards = empresas.map(empId => {
    const p      = (state.dados[empId] || {}).planoAcao || {};
    const cor    = corMap[empId] || '#b0b0b0';
    const motivos = ((state.dados[empId] || {}).motivos || []).filter(m => m.descricao);

    const fbStatus = p.resposta
      ? `<span style="font-size:11px;color:#27ae60;font-weight:600;">✓ Resposta recebida</span>`
      : p.enviado
      ? `<span style="font-size:11px;color:#f39c12;font-weight:600;">⏳ Aguardando resposta</span>`
      : `<span style="font-size:11px;color:#aaa;">Aguardando envio do link</span>`;

    // Lista de motivos
    const motivosHTML = motivos.length
      ? `<div style="background:#f8f8f8;border:1px solid var(--border);border-radius:6px;padding:8px 10px;margin-bottom:10px;">
           <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:6px;">Motivos do Mês</div>
           ${motivos.map(m => `
             <div style="display:flex;align-items:baseline;gap:8px;padding:3px 0;border-bottom:1px solid #eee;font-size:12px;">
               <span style="background:${cor};color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;flex-shrink:0;">${(m.qtde||0) < 10 ? '0'+(m.qtde||0) : (m.qtde||0)}</span>
               <span style="flex:1;font-weight:500;">${m.descricao}</span>
               <span style="color:#c0392b;font-weight:700;font-size:11px;">${m.valor > 0 ? 'R$ '+Number(m.valor).toLocaleString('pt-BR',{minimumFractionDigits:2}) : ''}</span>
             </div>`).join('')}
         </div>`
      : `<div style="font-size:11px;color:#bbb;margin-bottom:10px;font-style:italic;">Sem motivos registrados</div>`;

    return `
      <div class="multas-plano-card">
        <div class="card-titulo" style="border-bottom:2px solid ${cor};padding-bottom:8px;margin-bottom:10px;">
          <img src="${logoMap[empId]}" style="height:24px;object-fit:contain;" alt="">
        </div>
        ${motivosHTML}
        <label>Plano de Ação <span style="color:#aaa;font-weight:400;font-size:11px;">(preenchido pela empresa)</span></label>
        ${p.resposta
          ? `<div style="position:relative;">
               <div id="multas-plano-preview-${empId}"
                 style="background:#f8f8f8;border:1px solid ${cor};border-radius:6px;padding:10px 12px;font-size:12px;color:#333;line-height:1.6;min-height:50px;white-space:pre-wrap;">${p.resposta}</div>
               <button onclick="multasEditarPlano('${empId}')"
                 style="position:absolute;top:6px;right:8px;font-size:11px;padding:2px 8px;border-radius:4px;border:1px solid #ccc;background:#fff;cursor:pointer;">✏️ Editar</button>
             </div>
             <textarea id="multas-plano-texto-${empId}" rows="4" style="display:none;" placeholder="Descreva as ações...">${p.resposta||''}</textarea>`
          : `<textarea id="multas-plano-texto-${empId}" rows="4" placeholder="Descreva as ações...">${p.texto||''}</textarea>`
        }
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
          ${fbStatus}
          <button onclick="multasCopiarLinkPlano('${empId}')"
            style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid ${cor};color:${cor};background:#fff;cursor:pointer;">
            🔗 Copiar link
          </button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="multas-secao-titulo">Plano de Ação por Empresa</div>
    <div style="margin-bottom:12px;display:flex;align-items:center;gap:10px;">
      <button class="btn btn--secondary" data-action="multas-importar-planos"
        style="font-size:12px;padding:5px 14px;">📥 Importar Planos das Empresas</button>
      <span style="font-size:11px;color:#888;">Clique após as empresas responderem pelo link</span>
    </div>
    <div class="multas-plano-cards">${cards}</div>
    <div style="margin-top:8px;font-size:11px;color:#888;">
      💡 Compartilhe o link com cada empresa. As respostas aparecem automaticamente aqui.
    </div>
  `;
}

function multasEditarPlano(empId) {
  var preview = document.getElementById('multas-plano-preview-' + empId);
  var textarea = document.getElementById('multas-plano-texto-' + empId);
  if (preview) preview.parentElement.style.display = 'none';
  if (textarea) textarea.style.display = 'block';
}

function multasCopiarLinkPlano(empId) {
  var base = window.location.origin + window.location.pathname.replace('index.html','');
  var mes  = multasState.mes;
  var ano  = multasState.ano;
  var url  = base + 'plano-de-acao-multas.html?emp=' + empId + '&mes=' + mes + '&ano=' + ano;
  navigator.clipboard.writeText(url).then(function() {
    alert('Link copiado!\n\n' + url);
  }).catch(function() {
    prompt('Copie o link abaixo:', url);
  });
}
function multasMesesInputRow(empId, campo, valores, mesAtual, isInt) {
  const vals = valores || Array(12).fill(0);
  const inputs = MULTAS_MESES_ABREV.map((m, i) => `
    <label>
      ${m}
      <input type="number" ${isInt?'step="1"':'step="0.01"'} value="${vals[i]||0}"
        class="${i===mesAtual?'mes-atual':''}"
        data-emp="${empId}" data-campo="${campo}" data-mes="${i}">
    </label>`).join('');
  return `<div class="multas-meses-grid">${inputs}</div>`;
}

function multasMotivoRow(empId, idx, m) {
  m = m || {};
  return `
    <tr data-idx="${idx}">
      <td><input type="number" step="1" min="0" value="${m.qtde||''}" data-emp="${empId}" data-motivo-campo="qtde" data-motivo-idx="${idx}" placeholder="00"></td>
      <td><input type="text" value="${m.descricao||''}" data-emp="${empId}" data-motivo-campo="descricao" data-motivo-idx="${idx}" placeholder="Descrição do motivo"></td>
      <td><input type="text" value="${m.valor > 0 ? Number(m.valor).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) : ''}" data-emp="${empId}" data-motivo-campo="valor" data-motivo-idx="${idx}" placeholder="0,00" class="multas-motivo-valor-inp"></td>
      <td><button class="multas-remove-btn" data-emp="${empId}" data-motivo-rm="${idx}">✕</button></td>
    </tr>`;
}

// ---------------------------------------------------------------
// Bind de eventos do Step 2
// ---------------------------------------------------------------
function multasBindStep2Events(state) {
  var tabAtiva = state._tabAtiva || 'grupo';

  // CPK campos manuais
  ['grupo','1001','1001u','cat','com'].forEach(empId => {
    const utpCpk = document.getElementById(`multas-${empId}-utp-cpk`);
    if (utpCpk) utpCpk.addEventListener('input', e => {
      if (empId === 'grupo') state.dados.grupo.utp_cpk = parseFloat(e.target.value)||0;
      else state.dados[empId].utp_cpk = parseFloat(e.target.value)||0;
    });
    const opCpk = document.getElementById(`multas-${empId}-op-cpk`);
    if (opCpk) opCpk.addEventListener('input', e => {
      if (state.dados[empId]) state.dados[empId].op_cpk = parseFloat(e.target.value)||0;
    });
  });

  // CPK grupo
  document.getElementById('multas-grupo-cpk')?.addEventListener('input', e => {
    state.dados.grupo.utp_cpk = parseFloat(e.target.value)||0;
  });
  document.getElementById('multas-grupo-op-cpk')?.addEventListener('input', e => {
    if (!state.dados.grupo.op_cpk === undefined) state.dados.grupo.op_cpk = 0;
    state.dados.grupo.op_cpk = parseFloat(e.target.value)||0;
  });

  // Inputs de meses (delegação)
  document.querySelectorAll('.multas-meses-grid input').forEach(inp => {
    inp.addEventListener('input', e => {
      const { emp, campo, mes } = e.target.dataset;
      const val = e.target.step === '1' ? parseInt(e.target.value)||0 : parseFloat(e.target.value)||0;
      const target = emp === 'grupo' ? state.dados.grupo : state.dados[emp];
      if (target && target[campo] !== undefined) {
        target[campo][parseInt(mes)] = val;
        // Recalcula acumulados
        multasRecalcTotais(state, emp);
        multasAtualizaTotaisUI(state, emp);
        // Atualiza preview (KPIs + ambos os gráficos)
        multasUpdatePreviewChart(state, state._tabAtiva || 'grupo');
      }
    });
  });

  // Inputs custos
  document.querySelectorAll('.multas-custo-inp').forEach(inp => {
    if (inp.readOnly) return;

    // Ao focar: remove formatação para edição limpa
    inp.addEventListener('focus', function() {
      var raw = parseN(this.value);
      this.value = raw > 0 ? String(raw) : '';
    });

    // Ao sair: formata e recalcula
    inp.addEventListener('blur', function() {
      var raw = parseN(this.value);
      this.value = raw > 0 ? raw.toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:2}) : '';
    });

    inp.addEventListener('input', e => {
      const { custo, campo } = e.target.dataset;
      if (campo === 'geral') return;
      if (!state.dados.grupo.custos[custo]) state.dados.grupo.custos[custo] = {};
      var val = parseN(e.target.value);
      state.dados.grupo.custos[custo][campo] = val;

      // Recalcula GERAL da empresa
      var c = state.dados.grupo.custos[custo];
      c.geral = (c.operacao||0) + (c.comercial||0) + (c.manutencao||0) + (c.extrato||0);
      var geralEl = document.getElementById('multas-custo-geral-' + custo);
      if (geralEl) geralEl.value = c.geral > 0 ? c.geral.toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:2}) : '';

      // Recalcula linha Grupo JCA como soma das 4 empresas
      if (custo !== 'grupo') {
        var custos = state.dados.grupo.custos;
        ['operacao','comercial','manutencao','extrato','geral'].forEach(function(col) {
          var soma = ['1001','1001u','cat','com'].reduce(function(acc, eid) {
            return acc + ((custos[eid] && custos[eid][col]) || 0);
          }, 0);
          custos.grupo[col] = soma;
          var el = document.getElementById('multas-custo-' + col + '-grupo')
                || document.querySelector('[data-custo="grupo"][data-campo="' + col + '"]');
          if (el) el.value = soma > 0 ? soma.toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:2}) : '';
        });
      }
    });
  });

  // Motivos
  document.querySelectorAll('[data-motivo-campo]').forEach(inp => {
    // Formatação pt-BR só para campo valor
    if (inp.dataset.motivoCampo === 'valor') {
      inp.addEventListener('focus', function() {
        var raw = parseN(this.value);
        this.value = raw > 0 ? String(raw).replace('.', ',') : '';
      });
      inp.addEventListener('blur', function() {
        var raw = parseN(this.value);
        this.value = raw > 0 ? raw.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) : '';
      });
    }
    inp.addEventListener('input', e => {
      const { emp, motivoCampo, motivoIdx } = e.target.dataset;
      const idx = parseInt(motivoIdx);
      if (!state.dados[emp].motivos) state.dados[emp].motivos = [];
      if (!state.dados[emp].motivos[idx]) state.dados[emp].motivos[idx] = {};
      const val = motivoCampo === 'qtde'   ? parseInt(e.target.value)||0
                : motivoCampo === 'valor'  ? parseN(e.target.value)
                : e.target.value;
      state.dados[emp].motivos[idx][motivoCampo] = val;
    });
    // Auto-save na coleção planos_multas ao sair do campo
    inp.addEventListener('blur', () => { _multasSalvarPlanos(); });
  });

  // Add motivo
  document.querySelectorAll('[id^="multas-add-motivo-"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const empId = btn.dataset.emp;
      if (!state.dados[empId].motivos) state.dados[empId].motivos = [];
      const idx = state.dados[empId].motivos.length;
      state.dados[empId].motivos.push({ qtde: 0, descricao: '', valor: 0 });
      const tbody = document.querySelector(`#multas-motivos-table-${empId} tbody`);
      if (tbody) {
        const tr = document.createElement('tr');
        tr.dataset.idx = idx;
        tr.innerHTML = multasMotivoRow(empId, idx, {}).replace(/^<tr[^>]*>/,'').replace(/<\/tr>$/,'');
        tbody.appendChild(tr);
        // re-bind os novos inputs
        tr.querySelectorAll('[data-motivo-campo]').forEach(inp => {
          if (inp.dataset.motivoCampo === 'valor') {
            inp.addEventListener('focus', function() {
              var raw = parseN(this.value);
              this.value = raw > 0 ? String(raw).replace('.', ',') : '';
            });
            inp.addEventListener('blur', function() {
              var raw = parseN(this.value);
              this.value = raw > 0 ? raw.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) : '';
            });
          }
          inp.addEventListener('input', e => {
            const { emp, motivoCampo, motivoIdx } = e.target.dataset;
            const i2 = parseInt(motivoIdx);
            if (!state.dados[emp].motivos[i2]) state.dados[emp].motivos[i2] = {};
            state.dados[emp].motivos[i2][motivoCampo] =
              motivoCampo === 'qtde'  ? parseInt(e.target.value)||0
              : motivoCampo === 'valor' ? parseN(e.target.value)
              : e.target.value;
          });
        });
        tr.querySelector('.multas-remove-btn')?.addEventListener('click', ev => {
          _multasRemoveMotivo(state, ev.target.dataset.emp, parseInt(ev.target.dataset.motivoRm));
        });
      }
    });
  });

  // Remove motivo
  document.querySelectorAll('.multas-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _multasRemoveMotivo(state, btn.dataset.emp, parseInt(btn.dataset.motivoRm));
    });
  });

  // Plano de ação
  ['1001','1001u','cat','com'].forEach(empId => {
    document.getElementById(`multas-plano-motivo-${empId}`)?.addEventListener('input', e => {
      if (!state.dados[empId].planoAcao) state.dados[empId].planoAcao = {};
      state.dados[empId].planoAcao.motivo = e.target.value;
    });
    document.getElementById(`multas-plano-texto-${empId}`)?.addEventListener('input', e => {
      if (!state.dados[empId].planoAcao) state.dados[empId].planoAcao = {};
      state.dados[empId].planoAcao.texto = e.target.value;
      // Atualiza também a resposta (edição manual)
      state.dados[empId].planoAcao.resposta = e.target.value;
    });
  });

  // Atualiza totais iniciais
  ['grupo','1001','1001u','cat','com'].forEach(empId => multasAtualizaTotaisUI(state, empId));
}

// ---------------------------------------------------------------
// Recalcula acumulados
// ---------------------------------------------------------------
function multasRecalcTotais(state, empId) {
  const d = empId === 'grupo' ? state.dados.grupo : state.dados[empId];
  if (!d) return;
  if (d.utp_valores) d.utp_acum = d.utp_valores.reduce((a,b)=>a+b,0);
  if (d.op_valores)  d.op_acum  = d.op_valores.reduce((a,b)=>a+b,0);
}

function multasAtualizaTotaisUI(state, empId) {
  multasRecalcTotais(state, empId);
  const d = empId === 'grupo' ? state.dados.grupo : state.dados[empId];
  if (!d) return;

  const utpAcumEl = document.getElementById(`multas-${empId}-utp-acum-val`) ||
                    document.getElementById('multas-grupo-acum-val');
  if (utpAcumEl) utpAcumEl.textContent = multasFmtMoeda(d.utp_acum||0);

  const qtdeEl = document.getElementById('multas-grupo-acum-qtde');
  if (qtdeEl && empId === 'grupo') {
    qtdeEl.textContent = (d.utp_qtde||[]).reduce((a,b)=>a+b,0);
  }

  // Op acum (grupo e empresas)
  const opAcumEl = document.getElementById('multas-grupo-op-acum-val') ||
                   document.getElementById(`multas-${empId}-op-acum-val`);
  if (opAcumEl && d.op_acum !== undefined) opAcumEl.textContent = multasFmtMoeda(d.op_acum||0);
}

function _multasRemoveMotivo(state, empId, idx) {
  if (state.dados[empId] && state.dados[empId].motivos) {
    state.dados[empId].motivos.splice(idx, 1);
  }
  // Re-renderiza só o painel da empresa
  const panel = document.getElementById(`multas-panel-${empId}`);
  if (panel) {
    panel.innerHTML = multasPanelEmpresa(state, empId);
    // Re-bind motivo events
    multasBindStep2Events(state);
  }
}
// ============================================================
//  multas-pdf.js — Geração de PDF do módulo Multas Regulatórias
// ============================================================

// Versão isolada do gerador de PDF (sem depender de multasGerarPdf em multas-app.js)
// Chamado pelo botão no Step 3

function multasGerarPdfCompleto(state) {
  var btn = document.getElementById('multas-btn-pdf');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Gerando...'; }

  var mes      = MULTAS_MESES_FULL[state.mes] || '';
  var ano      = state.ano;
  var filename = 'Multas_Regulatorias_' + mes + '_' + ano + '.pdf';
  var slides   = state.slides || multasBuildSlidesList();

  var { jsPDF } = window.jspdf;
  var pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540], hotfixes: ['px_scaling'] });

  var box = document.createElement('div');
  box.style.cssText = 'position:fixed;top:-600px;left:0;width:960px;height:540px;overflow:hidden;background:#fff;z-index:9999;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;';
  var pdfStyle = document.createElement('style');
  pdfStyle.textContent = '#multas-pdf-box .multas-slide{width:960px!important;height:540px!important;box-shadow:none!important;border-radius:0!important;font-family:Arial,Helvetica,sans-serif!important;}';
  box.id = 'multas-pdf-box';
  document.head.appendChild(pdfStyle);
  document.body.appendChild(box);

  (function processSlide(i) {
    if (i >= slides.length) {
      document.body.removeChild(box);
      if (pdfStyle.parentNode) pdfStyle.parentNode.removeChild(pdfStyle);
      pdf.save(filename);
      if (btn) { btn.disabled = false; btn.textContent = '📄 Gerar PDF'; }
      return;
    }

    var s    = slides[i];
    var meses = multasMesesComDados(state.dados, s.empId || 'grupo');
    var html = '';
    if (s.type === 'capa')            html = multasSlideCapa(state);
    else if (s.type === 'utp-grupo')  html = multasSlideUTPGrupo(state);
    else if (s.type === 'custos')     html = multasSlideCustos(state);
    else if (s.type === 'op-grupo')   html = multasSlideOpGrupo(state);
    else if (s.type === 'utp-emp')    html = multasSlideUTPEmpresa(state, s.empId);
    else if (s.type === 'op-emp')     html = multasSlideOpEmpresa(state, s.empId);
    else if (s.type === 'motivos')    html = multasSlideMotivos(state, s.empId);
    else if (s.type === 'plano')      html = multasSlidePlanoAcao(state, s.empId);
    else if (s.type === 'contra-capa') html = multasSlideContraCapa(state);

    box.innerHTML = html;

    var charts = [];
    setTimeout(function() {
      if (s.type === 'utp-grupo') charts.push(multasCreateUTPChart('chart-utp-grupo-slide', 'grupo', state.dados, meses, 4));
      if (s.type === 'op-grupo')  charts.push(multasCreateOpChart('chart-op-grupo-slide',   'grupo', state.dados, meses, 4));
      if (s.type === 'utp-emp')   charts.push(multasCreateUTPChart('chart-utp-' + s.empId + '-slide', s.empId, state.dados, meses, 4));
      if (s.type === 'op-emp')    charts.push(multasCreateOpChart('chart-op-'   + s.empId + '-slide', s.empId, state.dados, meses, 4));

      setTimeout(function() {
        html2canvas(box, {
          scale: 4, useCORS: true, allowTaint: false,
          width: 960, height: 540, backgroundColor: '#ffffff',
          scrollX: 0, scrollY: 0, logging: false,
        }).then(function(canvas) {
          charts.forEach(function(c) { if (c) c.destroy(); });
          var img = canvas.toDataURL('image/jpeg', 0.97);
          if (i > 0) pdf.addPage([960, 540], 'landscape');
          pdf.addImage(img, 'JPEG', 0, 0, 960, 540);
          processSlide(i + 1);
        });
      }, 400);
    }, 80);
  })(0);
}
// ============================================================
//  multas-app.js — Lógica principal do módulo Multas Regulatórias
//  Padrão: mesmo que sinistros-app.js
// ============================================================

var multasState = null;

// ── Ponto de entrada (chamado pelo _handleAction "start-multas") ──
function startMultas() {
  multasState = multasCreateState();
  multasState.mes = _prevIdx;
  multasState.ano = _prevAno;
  multasRenderStep(1);
}

// ── Renderiza o step correto no #app ──────────────────────
function multasRenderStep(step) {
  multasState.step = step;
  var app = document.getElementById("app");

  if (step === 1) {
    app.innerHTML = multasBuildStep1HTML();
    return;
  }
  if (step === 2) {
    app.innerHTML = multasBuildStep2HTML();
    multasRenderStep2(multasState, "multas-step2-content");
    _multasCarregarFirebase(function() {
      multasRenderStep2(multasState, "multas-step2-content");
      _multasSalvarPlanos(); // sincroniza motivos com planos_multas
    });
    return;
  }
  if (step === 3) {
    multasState.slides   = multasBuildSlidesList();
    multasState.slideIdx = 0;
    app.innerHTML = multasBuildStep3HTML();
    multasRenderCurrentSlide();
    _multasSalvarFirebase();
    _multasSalvarPlanos(); // salva motivos em planos_multas
    return;
  }
}

// ── HTML Step 1 — mesmo padrão visual do Sinistros ────────
function multasBuildStep1HTML() {
  var mes = multasState.mes;
  var ano = multasState.ano;
  var mOpts = MULTAS_MESES_FULL.map(function(m, i) {
    return '<option value="' + i + '"' + (i === mes ? " selected" : "") + ">" + m + "</option>";
  }).join("");
  var aOpts = ANOS.map(function(a) {
    return '<option value="' + a + '"' + (a === ano ? " selected" : "") + ">" + a + "</option>";
  }).join("");

  return '<nav class="nav">'
    + '<div class="nav__left">'
    +   '<button class="btn btn--ghost" data-action="go-home">&#8592; In&iacute;cio</button>'
    +   '<span class="nav__title">Multas Regulat&oacute;rias</span>'
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
    +       '<h2 style="font-size:22px;font-weight:700;color:#1d3061;margin:0 0 4px">Configurar Apresenta&ccedil;&atilde;o</h2>'
    +       '<p style="font-size:13px;color:#999;margin:0">M&ecirc;s de refer&ecirc;ncia, ano e analista respons&aacute;vel</p>'
    +     '</div>'
    +     '<div style="display:flex;flex-direction:column;gap:14px">'
    +       '<div>'
    +         '<label class="field-label">M&Ecirc;S</label>'
    +         '<select class="field-input" data-multas-root="mes">' + mOpts + '</select>'
    +       '</div>'
    +       '<div>'
    +         '<label class="field-label">ANO</label>'
    +         '<select class="field-input" data-multas-root="ano">' + aOpts + '</select>'
    +       '</div>'
    +       '<div>'
    +         '<label class="field-label">ANALISTA RESPONS&Aacute;VEL</label>'
    +         '<input class="field-input" type="text" value="' + (multasState.analista || "Kelvin Santos") + '" placeholder="Ex: Kelvin Santos" data-multas-root="analista">'
    +       '</div>'
    +     '</div>'
    +     '<button class="btn btn--primary" style="width:100%;padding:12px;font-size:15px" data-action="multas-go-step" data-step="2">Pr&oacute;ximo &#8594;</button>'
    +   '</div>'
    + '</div>';
}

// ── HTML Step 2 — mesmo padrão visual do Sinistros ────────
function multasBuildStep2HTML() {
  var mes = MULTAS_MESES_FULL[multasState.mes];
  var ano = multasState.ano;
  return '<nav class="nav">'
    + '<div class="nav__left">'
    +   '<button class="btn btn--ghost" data-action="multas-go-step" data-step="1">&#8592; Voltar</button>'
    +   '<span class="nav__title">Multas Regulat&oacute;rias</span>'
    +   '<span class="nav__period">' + mes + '/' + ano + '</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:8px">'
    +   '<button class="btn btn--ghost" id="multas-btn-sheets" data-action="multas-importar-sheets" style="padding:3px 12px;font-size:11px">&#128202; Importar Sheets</button>'
    +   '<button class="btn btn--ghost" onclick="multasCopiarLinkGeral()" style="padding:3px 12px;font-size:11px">&#128279; Link do Plano de A&ccedil;&atilde;o</button>'
    +   '<button class="btn btn--ghost" data-action="multas-importar-planos" style="padding:3px 12px;font-size:11px">&#128203; Importar Planos de A&ccedil;&atilde;o</button>'
    +   '<button class="btn btn--ghost" id="multas-btn-salvar-fb" data-action="multas-salvar-firebase" style="padding:3px 12px;font-size:11px">&#9729;&#65039; Salvar</button>'
    +   '<div class="nav__steps">'
    +     '<span class="nav__step">1</span>'
    +     '<span class="nav__step nav__step--active">2</span>'
    +     '<span class="nav__step">3</span>'
    +   '</div>'
    + '</div>'
    + '</nav>'
    + '<div style="display:flex;flex-direction:column;padding:20px 24px;height:calc(100vh - 50px);overflow:hidden;box-sizing:border-box">'
    +   '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-shrink:0">'
    +     '<div>'
    +       '<h3 class="step-data__title">Preenchimento de Dados</h3>'
    +       '<p class="step-data__sub">Preencha as informa&ccedil;&otilde;es de cada empresa</p>'
    +     '</div>'
    +     '<span style="background:var(--navy);color:#fff;font-weight:700;font-size:13px;padding:6px 14px;border-radius:8px">' + mes + '/' + ano + '</span>'
    +   '</div>'
    +   '<div style="margin:8px 0 4px"><span style="font-size:10px;font-weight:700;color:#aaa;letter-spacing:1px">EMPRESA</span></div>'
    +   '<div id="multas-step2-content" style="flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column"></div>'
    +   '<div style="display:flex;justify-content:space-between;padding-top:12px;margin-top:auto;flex-shrink:0;border-top:1px solid #eee">'
    +     '<button class="btn btn--ghost" data-action="multas-go-step" data-step="1">&#8592; Voltar</button>'
    +     '<button class="btn btn--primary" data-action="multas-go-step" data-step="3">Visualizar Apresenta&ccedil;&atilde;o &#8594;</button>'
    +   '</div>'
    + '</div>';
}

// ── HTML Step 3 — mesmo padrão visual do Sinistros ────────
function multasBuildStep3HTML() {
  var mes  = MULTAS_MESES_FULL[multasState.mes];
  var ano  = multasState.ano;
  if (!multasState.slides) multasState.slides = multasBuildSlidesList();
  var slides   = multasState.slides;
  var slideIdx = multasState.slideIdx || 0;
  var total    = slides.length;

  var thumbLabel = function(s) {
    if (s.type === 'capa')    return 'Capa';
    if (s.type === 'utp-grupo')  return 'UTP\nGrupo JCA';
    if (s.type === 'op-grupo')   return 'Operação\nGrupo JCA';
    if (s.type === 'custos')     return 'Custos\npor Áreas';
    if (s.type === 'utp-emp')    return 'UTP\n' + MULTAS_EMP_LABEL[s.empId];
    if (s.type === 'op-emp')     return 'Operação\n' + MULTAS_EMP_LABEL[s.empId];
    if (s.type === 'motivos')    return 'Motivos\n' + MULTAS_EMP_LABEL[s.empId];
    if (s.type === 'plano')      return 'Plano\n' + MULTAS_EMP_LABEL[s.empId];
    if (s.type === 'contra-capa') return 'Contra\nCapa';
    return 'Slide';
  };

  var thumbsHTML = slides.map(function(s, i) {
    return '<div class="thumb' + (i === slideIdx ? ' thumb--active' : '') + '"'
      + ' data-action="multas-go-slide" data-idx="' + i + '">'
      + '<div class="thumb__preview" style="white-space:pre-line">' + thumbLabel(s) + '</div>'
      + '<div class="thumb__num">' + (i + 1) + '</div>'
      + '</div>';
  }).join('');

  var nav = '<div class="preview-bar">'
    + '<div class="preview-bar__left">'
    +   '<button class="preview-bar__arrow" style="font-size:13px;padding:4px 12px" data-action="multas-go-step" data-step="2">&#8592; Voltar</button>'
    +   '<button class="preview-bar__arrow" style="font-size:13px;padding:4px 12px" data-action="go-home">In&iacute;cio</button>'
    +   '<span class="preview-bar__info">Multas Regulat&oacute;rias &nbsp;&mdash;&nbsp; Slide ' + (slideIdx + 1) + ' / ' + total + ' &nbsp;&mdash;&nbsp; ' + mes + '/' + ano + '</span>'
    + '</div>'
    + '<div class="preview-bar__nav">'
    +   '<button class="preview-bar__arrow" data-action="multas-prev-slide">&#8592;</button>'
    +   '<button class="preview-bar__arrow" data-action="multas-next-slide">&#8594;</button>'
    + '</div>'
    + '<button class="preview-bar__arrow" id="multas-btn-pdf" data-action="multas-gerar-pdf" style="font-size:12px;padding:4px 14px">&#128196; Gerar PDF</button>'
    + '</div>';

  return '<div class="preview-page" style="height:100vh;overflow:hidden;">'
    + nav
    + '<div class="preview-body" style="flex:1;min-height:0;overflow:hidden;display:flex;">'
    +   '<div class="thumbs" style="overflow-y:auto;overflow-x:hidden;flex-shrink:0;">' + thumbsHTML + '</div>'
    +   '<div class="slide-canvas" style="flex:1;display:flex;align-items:center;justify-content:center;padding:28px;min-height:0;overflow:hidden;">'
    +     '<div class="slide-frame" id="multas-slide-frame" style="overflow:hidden;flex-shrink:0;"></div>'
    +   '</div>'
    + '</div>'
    + '</div>';
}

// ── Lista de slides para o Step 3 ─────────────────────
// ---------------------------------------------------------------
// SLIDE CONTRA-CAPA
// ---------------------------------------------------------------
function multasSlideContraCapa(state) {
  var analista = state.analista || '';
  var footerTxt = analista ? 'DO.ACT.IOP - ' + analista : 'DO.ACT.IOP';
  return '<div class="multas-slide" id="multas-slide-contra-capa" style="position:relative;">'
    + '<div class="multas-slide-capa" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">'
    +   '<div class="logos-row" style="display:flex;align-items:center;gap:32px;">'
    +     '<img src="' + LOGO_JCA_URL + '" style="height:60px;object-fit:contain;" crossorigin="anonymous" alt="JCA">'
    +     '<div style="width:2px;height:70px;background:#333;"></div>'
    +     '<img src="' + LOGO_IO_CAPA_URL + '" style="height:60px;object-fit:contain;" crossorigin="anonymous" alt="IO">'
    +   '</div>'
    + '</div>'
    + '<div class="multas-rodape-autor">' + footerTxt + '</div>'
    + '</div>';
}

// ---------------------------------------------------------------
function multasBuildSlidesList() {
  var list = [
    { type: 'capa' },
    { type: 'utp-grupo' },
    { type: 'custos' },
    { type: 'op-grupo' },
  ];
  ['1001','1001u','cat','com'].forEach(function(empId) {
    var d = multasState.dados[empId] || {};
    var temUTP     = (d.utp_valores || []).some(function(v){ return v > 0; });
    var temOp      = (d.op_valores  || []).some(function(v){ return v > 0; });
    var temMotivos = (d.motivos     || []).some(function(m){ return m.descricao; });

    // Se não tiver nenhum dado de UTP nem Operação, pula a empresa toda
    if (!temUTP && !temOp) return;

    list.push({ type: 'utp-emp', empId: empId });
    if (temOp) list.push({ type: 'op-emp', empId: empId });
    if (temMotivos) list.push({ type: 'motivos', empId: empId });
    if (temMotivos) list.push({ type: 'plano',   empId: empId });
  });
  list.push({ type: 'contra-capa' });
  return list;
}

// ── Renderiza o slide atual no frame ──────────────────
function multasRenderCurrentSlide() {
  var frame = document.getElementById('multas-slide-frame');
  if (!frame || !multasState.slides) return;

  if (_multasPreviewChartUTP) { _multasPreviewChartUTP.destroy(); _multasPreviewChartUTP = null; }
  if (_multasPreviewChartOp)  { _multasPreviewChartOp.destroy();  _multasPreviewChartOp  = null; }

  var s     = multasState.slides[multasState.slideIdx || 0];
  var meses = multasMesesComDados(multasState.dados, s.empId || 'grupo');

  var html = '';
  if (s.type === 'capa')       html = multasSlideCapa(multasState);
  else if (s.type === 'utp-grupo')  html = multasSlideUTPGrupo(multasState);
  else if (s.type === 'custos')     html = multasSlideCustos(multasState);
  else if (s.type === 'op-grupo')   html = multasSlideOpGrupo(multasState);
  else if (s.type === 'utp-emp')    html = multasSlideUTPEmpresa(multasState, s.empId);
  else if (s.type === 'op-emp')     html = multasSlideOpEmpresa(multasState, s.empId);
  else if (s.type === 'motivos')    html = multasSlideMotivos(multasState, s.empId);
  else if (s.type === 'plano')      html = multasSlidePlanoAcao(multasState, s.empId);
  else if (s.type === 'contra-capa') html = multasSlideContraCapa(multasState);

  frame.innerHTML = html;

  // .slide-frame + .slide-canvas do preview.css cuidam do tamanho
  requestAnimationFrame(function() {
    var slide = frame.querySelector('.multas-slide');
    if (slide) {
      slide.style.width        = '100%';
      slide.style.height       = '100%';
      slide.style.boxShadow    = 'none';
      slide.style.borderRadius = '0';
    }
  });

  // Gráficos após scale
  setTimeout(function() {
    if (s.type === 'utp-grupo') multasCreateUTPChart('chart-utp-grupo-slide', 'grupo', multasState.dados, meses);
    if (s.type === 'op-grupo')  multasCreateOpChart('chart-op-grupo-slide',  'grupo', multasState.dados, meses);
    if (s.type === 'utp-emp')   multasCreateUTPChart('chart-utp-' + s.empId + '-slide', s.empId, multasState.dados, meses);
    if (s.type === 'op-emp')    multasCreateOpChart('chart-op-'  + s.empId + '-slide', s.empId, multasState.dados, meses);
  }, 60);
}

function multasUpdateSlideCounter() {
  var el = document.querySelector('.preview-bar__info');
  if (el && multasState && multasState.slides) {
    el.innerHTML = 'Multas Regulat&oacute;rias &nbsp;&mdash;&nbsp; Slide '
      + (multasState.slideIdx + 1) + ' / ' + multasState.slides.length
      + ' &nbsp;&mdash;&nbsp; ' + MULTAS_MESES_FULL[multasState.mes] + '/' + multasState.ano;
  }
}

function multasUpdateActiveThumbs() {
  document.querySelectorAll('.thumb').forEach(function(t, i) {
    t.classList.toggle('thumb--active', i === multasState.slideIdx);
    if (i === multasState.slideIdx) t.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

// ── Bind de eventos Step 1 — via data-multas-root (mesmo padrão sin-root) ──
function _multasBindStep1() {
  // não necessário — eventos são capturados pelo listener global no app.js
}

// ── Firebase — Salvar ─────────────────────────────────────

// ── Apps Script — Importação do Sheets ───────────────────────────
var MULTAS_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzRgkbEdBXd_rUgUwEJczTUQYIKQqTGnWjOQnTJ7jLgvDFsePMFPmSjoyGJQWxs7Hw4iw/exec';
var MULTAS_ORC_URL    = 'https://script.google.com/macros/s/AKfycbxCYkS56em1DerzN9RG_vAoRpMn3oIbmNDESPFbmc4hB1dXRqM9fmT1thMKkc54gmVc/exec';

var MESES_FULL_MULTAS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                          "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

async function _multasImportarSheets() {
  var btn = document.getElementById('multas-btn-sheets');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Importando...'; }
  try {
    var mes = MESES_FULL_MULTAS[multasState.mes];
    var ano = multasState.ano;
    var idx = multasState.mes;

    // 1. Garante que o Firebase está carregado antes de importar
    await new Promise(function(resolve) {
      _multasCarregarFirebase(resolve);
    });

    // 2. Busca dados e orçamento em paralelo
    var results = await Promise.all([
      fetch(MULTAS_SHEETS_URL + '?acao=getMultas&mes=' + encodeURIComponent(mes) + '&ano=' + ano).then(function(r){ return r.json(); }),
      fetch(MULTAS_ORC_URL + '?tipo=regulatoria&ano=' + ano).then(function(r){ return r.json(); })
    ]);

    var data = results[0];
    var orc  = results[1];

    if (data.erro) { alert('Erro nos dados: ' + data.erro); return; }
    var orcDados = (orc.ok && orc.dados) ? orc.dados : {};

    ['1001','1001u','cat','com'].forEach(function(empId) {
      var d   = data[empId];
      var o   = orcDados[empId];
      var emp = multasState.dados[empId];
      if (!emp) return;
      // Sempre limpa motivos antes de importar
      emp.motivos = [];
      if (d) {
        // Preserva arrays existentes, só atualiza o mês importado
        if (!emp.utp_valores) emp.utp_valores = Array(12).fill(0);
        if (!emp.utp_qtde)    emp.utp_qtde    = Array(12).fill(0);
        if (!emp.utp_orcado)  emp.utp_orcado  = Array(12).fill(0);
        if (!emp.op_valores)  emp.op_valores  = Array(12).fill(0);
        if (!emp.op_qtde)     emp.op_qtde     = Array(12).fill(0);
        emp.utp_valores[idx] = d.utp_valor_mes || 0;
        emp.utp_qtde[idx]    = d.utp_qtde_mes  || 0;
        emp.utp_acum         = d.utp_acum       || 0;
        emp.op_valores[idx]  = d.op_valor_mes   || 0;
        emp.op_qtde[idx]     = d.op_qtde_mes    || 0;
        emp.op_acum          = d.op_acum        || 0;
        // Substitui motivos apenas do mês importado
        emp.motivos = (d.motivos || []).map(function(m){ return { descricao: m.descricao, qtde: m.qtde, valor: m.valor }; });
        // Custos por área — preenche na estrutura grupo.custos[empId]
        if (d.custos) {
          var gc = multasState.dados.grupo.custos;
          if (!gc[empId]) gc[empId] = {};
          gc[empId].operacao   = d.custos.operacao   || 0;
          gc[empId].comercial  = d.custos.comercial  || 0;
          gc[empId].manutencao = d.custos.manutencao || 0;
          gc[empId].extrato    = d.custos.extrato    || 0;
          gc[empId].geral      = d.custos.geral      || 0;
        }
      }
      if (o && o.orcado && o.orcado[idx] !== undefined) {
        emp.utp_orcado[idx] = o.orcado[idx];
      }
    });

    var g = data['grupo'];
    if (g && multasState.dados.grupo) {
      multasState.dados.grupo.utp_valores[idx] = g.utp_valor_mes || 0;
      multasState.dados.grupo.utp_qtde[idx]    = g.utp_qtde_mes  || 0;
      multasState.dados.grupo.utp_acum         = g.utp_acum      || 0;
      multasState.dados.grupo.op_valores[idx]  = g.op_valor_mes  || 0;
      multasState.dados.grupo.op_qtde[idx]     = g.op_qtde_mes   || 0;
      multasState.dados.grupo.op_acum          = g.op_acum       || 0;
      if (g.custos) {
        var gc = multasState.dados.grupo.custos;
        // Recalcula grupo somando as 4 empresas
        ['operacao','comercial','manutencao','extrato','geral'].forEach(function(col) {
          gc.grupo[col] = ['1001','1001u','cat','com'].reduce(function(acc, eid) {
            return acc + ((gc[eid] && gc[eid][col]) || 0);
          }, 0);
        });
      }
      var grupoOrc = 0;
      ['1001','1001u','cat','com','sul','rapido'].forEach(function(empId) {
        var o = orcDados[empId];
        if (o && o.orcado && o.orcado[idx]) grupoOrc += o.orcado[idx];
      });
      multasState.dados.grupo.utp_orcado[idx] = grupoOrc;
    }

    multasRenderStep2(multasState, 'multas-step2-content');
    _multasSalvarFirebase();
    _multasSalvarPlanos();
    alert('✅ Dados de ' + mes + '/' + ano + ' importados!\n\nAjuste CPK manualmente se necessário.');
  } catch(e) {
    alert('Erro ao importar: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📊 Importar Sheets'; }
  }
}

function multasCopiarLinkGeral() {
  var base = window.location.origin + window.location.pathname.replace('index.html','');
  var url  = base + 'plano-de-acao-multas.html?mes=' + multasState.mes + '&ano=' + multasState.ano;
  navigator.clipboard.writeText(url).then(function() {
    alert('Link copiado!\n\n' + url);
  }).catch(function() {
    prompt('Copie o link abaixo:', url);
  });
}

function _multasSalvarFirebase() {
  if (typeof _db === "undefined") return;
  const docId = multasState.ano + "-" + String(multasState.mes + 1).padStart(2, "0");
  // Usar set() sem merge para garantir que arrays (motivos) sejam salvos corretamente
  _db.collection("multas_regulatorias").doc(docId)
    .set({
      mes:              multasState.mes,
      ano:              multasState.ano,
      analista:         multasState.analista || "",
      dados:            multasState.dados,
      dataAtualizacao:  multasState.dataAtualizacao || "",
      savedAt:          firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => console.log("[Multas] Salvo:", docId))
    .catch(e => console.warn("[Multas] Erro ao salvar:", e));
}

// ── Firebase — Carregar ───────────────────────────────────
function _multasCarregarFirebase(callback) {
  if (typeof _db === "undefined") { if (callback) callback(); return; }
  const docId = multasState.ano + "-" + String(multasState.mes + 1).padStart(2, "0");
  _db.collection("multas_regulatorias").doc(docId).get()
    .then(doc => {
      if (doc.exists) {
        const d = doc.data();
        if (d.dados)            multasState.dados           = d.dados;
        if (d.dataAtualizacao)  multasState.dataAtualizacao = d.dataAtualizacao;
        console.log("[Multas] Carregado:", docId);
      }
      if (callback) callback();
    })
    .catch(e => {
      console.warn("[Multas] Erro ao carregar:", e);
      if (callback) callback();
    });
  // Listener em tempo real — atualiza painel quando empresa responde
  _db.collection("multas_regulatorias").doc(docId).onSnapshot(doc => {
    if (!doc.exists) return;
    const d = doc.data();
    if (!d.dados) return;
    // Verificar se houve nova resposta
    var novaResposta = false;
    ['1001','1001u','cat','com'].forEach(empId => {
      var empNovo = (d.dados[empId] || {}).planoAcao || {};
      var empAtual = (multasState.dados[empId] || {}).planoAcao || {};
      if (empNovo.resposta && empNovo.resposta !== empAtual.resposta) novaResposta = true;
    });
    if (novaResposta) {
      multasState.dados = d.dados;
      // Re-renderizar só o painel de plano se estiver visível
      var container = document.getElementById('multas-step2-content');
      if (container && multasState.tab === 'PLANO') {
        multasRenderStep2(multasState, 'multas-step2-content');
        console.log('[Multas] Nova resposta recebida — painel atualizado');
      }
    }
  });
}

// ── Salvar manual (botão ☁️ no step 2) ───────────────────
async function _multasSalvarManual() {
  const btn = document.getElementById("multas-btn-salvar-fb");
  if (btn) { btn.disabled = true; btn.textContent = "⏳"; }
  try {
    _multasSalvarFirebase();
    _multasSalvarPlanos(); // salva motivos em planos_multas
    if (btn) { btn.textContent = "☁️ Salvo!"; }
  } catch(e) {
    if (btn) { btn.textContent = "❌ Erro"; }
  }
  setTimeout(() => { if (btn) { btn.disabled = false; btn.textContent = "☁️ Salvar"; } }, 2500);
}

// ── Firebase — Salvar planos na coleção separada (igual sinistros) ──────────
function _multasSalvarPlanos() {
  if (typeof _db === "undefined") return;
  var docId = multasState.ano + "-" + String(multasState.mes + 1).padStart(2, "0");
  var payload = {};
  ['1001','1001u','cat','com'].forEach(function(empId) {
    var d = multasState.dados[empId] || {};
    var motivos = (d.motivos || []).filter(function(m) { return m.descricao; });
    payload[empId] = {
      motivos:  motivos,   // lista de {qtde, descricao, valor}
      analista: multasState.analista || ""
    };
  });
  // merge:true para não sobrescrever respostas das empresas
  _db.collection("planos_multas").doc(docId)
    .set(payload, { merge: true })
    .then(function() { console.log("[Multas] Planos salvos em planos_multas:", docId); })
    .catch(function(e) { console.warn("[Multas] Erro ao salvar planos:", e); });
}

// ── Firebase — Importar respostas das empresas ───────────────────────────────
async function _multasImportarPlanos() {
  var btn = document.querySelector("[data-action='multas-importar-planos']");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Importando..."; }
  try {
    var docId = multasState.ano + "-" + String(multasState.mes + 1).padStart(2, "0");
    var doc   = await _db.collection("planos_multas").doc(docId).get();
    if (!doc.exists) {
      alert("Nenhuma resposta encontrada para este período.\nAguarde as empresas enviarem.");
      return;
    }
    var fbData = doc.data();
    var count  = 0;
    ['1001','1001u','cat','com'].forEach(function(empId) {
      // Firestore pode armazenar como objeto aninhado OU como campos dot notation
      // Tenta as duas formas
      var p = fbData[empId] || {};
      var resposta = p.resposta || fbData[empId + '.resposta'] || '';
      var enviado  = p.enviado  || fbData[empId + '.enviado']  || false;
      if (!resposta && !enviado) return;
      if (!multasState.dados[empId]) return;
      if (!multasState.dados[empId].planoAcao) multasState.dados[empId].planoAcao = {};
      multasState.dados[empId].planoAcao.resposta = resposta;
      multasState.dados[empId].planoAcao.texto    = resposta;
      multasState.dados[empId].planoAcao.enviado  = true;
      count++;
    });
    if (count === 0) {
      alert("Nenhuma empresa respondeu ainda.");
    } else {
      alert("✅ " + count + " plano(s) importado(s) com sucesso!");
      multasRenderStep2(multasState, "multas-step2-content");
    }
  } catch(e) {
    alert("Erro ao importar: " + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "📥 Importar Planos"; }
  }
}