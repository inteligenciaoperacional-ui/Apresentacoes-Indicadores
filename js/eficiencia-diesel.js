// ═══════════════════════════════════════════════════════════════
// eficiencia-diesel.js — Módulo Eficiência Diesel
// Prefixo: diesel  |  Coleção: eficiencia_diesel
// Empresas: grupo, 1001, cat, com
// Slides por empresa: UTP (combo chart) + Segmentos + Fretamento (contratos)
// ═══════════════════════════════════════════════════════════════

// ── Constantes ────────────────────────────────────────────────
var DIESEL_LOGOS = {
  grupo:  'https://res.cloudinary.com/dln0ctawv/image/upload/v1779238658/JCA_1_mp1ic7.png',
  '1001': 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671790/1001_qisjtr_1_pzpzqw.png',
  cat:    'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671813/AVC_zk4pe9_k4jgau.png',
  com:    'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671826/COM_folzln_ddghpr.png',
};

var DIESEL_LOGO_JCA     = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779238658/JCA_1_mp1ic7.png';
var DIESEL_LOGO_IO      = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779238606/Intelig%C3%AAncia_preto_2_y6idqg.png';
var DIESEL_LOGO_IO_CAPA = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1781283106/Intelig%C3%AAncia_horizontal_preto_p6gikp_mwb3ts.png';
var DIESEL_LOGO_SHEETS  = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779587158/Lgo_sheets_krlipc.png';

// ── Apps Script — Eficiência Diesel ──────────────────────────
var DIESEL_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzVY1VyrD-gUGa8PRXU6jlLEUwI8T0dnCW-risG2ldXuvfyOZeO5cXKyawb99eg0wFq9A/exec';

var DIESEL_EMP_LABEL = {
  grupo: 'Grupo JCA',
  '1001': '1001',
  cat:    'Catarinense',
  com:    'Cometa',
};

// Cores das barras KM por empresa (seguindo padrão JCA)
var DIESEL_BAR_COLORS = {
  grupo:  'rgba(236,152,152,.55)',
  '1001': 'rgba(165,165,165,.70)',
  cat:    'rgba(0,168,168,.45)',
  com:    'rgba(52,130,210,.45)',
};

// Cor sólida (linha orçado)
var DIESEL_SOLID_COLORS = {
  grupo:  '#c08080',
  '1001': '#888888',
  cat:    '#007a7a',
  com:    '#1a5fa0',
};

// Segmentos disponíveis por empresa
var DIESEL_SEGS = {
  grupo:  ['rodoviario', 'fretamento', 'urbano'],
  '1001': ['rodoviario', 'fretamento', 'urbano'],
  cat:    ['rodoviario', 'fretamento'],
  com:    ['rodoviario', 'fretamento'],
};

var DIESEL_SEG_LABEL = {
  rodoviario: 'Rodoviário',
  fretamento: 'Fretamento',
  urbano:     'Urbano',
};

var DIESEL_EMPRESAS = ['1001', 'cat', 'com'];
var dieselState  = null;
var dieselCharts = {};

// ── Estado inicial de uma empresa ────────────────────────────
function _dieselInitEmpresa(empId) {
  var segs = {};
  (DIESEL_SEGS[empId] || ['rodoviario', 'fretamento']).forEach(function(s) {
    segs[s] = {
      orcado_acum:    '',
      realizado_acum: '',
      orcado_mensal:    Array(12).fill(''),
      realizado_mensal: Array(12).fill(''),
      km_mensal:        Array(12).fill(''),
    };
  });
  return {
    // KPIs acumulados
    media_orcado:    '',
    media_real:      '',
    km_orcado:       '',
    km_real:         '',
    abas_orcado:     '',
    abas_real:       '',
    vs_orcado_pct:   '',   // ex: "-0,9"  (sem %)
    // Evolução mensal (12 posições)
    orcado_mensal:    Array(12).fill(''),   // eficiência orçada por mês
    realizado_mensal: Array(12).fill(''),   // eficiência realizada por mês
    km_mensal:        Array(12).fill(''),   // km realizado por mês
    // Segmentos
    segmentos: segs,
    // Contratos de fretamento
    contratos: [],  // [{nome, km_total, abast, eficiencia}]
  };
}

function _dieselInitState() {
  var now      = new Date();
  var mesAtual = now.getMonth(); // 0-based
  var mesPadrao = mesAtual === 0 ? 11 : mesAtual - 1;
  var anoPadrao = mesAtual === 0 ? now.getFullYear() - 1 : now.getFullYear();

  var dados = { grupo: _dieselInitEmpresa('grupo') };
  DIESEL_EMPRESAS.forEach(function(id) { dados[id] = _dieselInitEmpresa(id); });
  return {
    step:     1,
    mes:      mesPadrao,
    ano:      anoPadrao,
    analista: '',
    tabAtiva: 'grupo',
    slideIdx: 0,
    slides:   [],
    dados:    dados,
    _fbNotif: null,
  };
}

// ── Lista de slides ───────────────────────────────────────────
function _dieselBuildSlides() {
  var slides = [{ type: 'capa' }];

  // Grupo: UTP + Segmentos
  slides.push({ type: 'utp',       emp: 'grupo' });
  slides.push({ type: 'segmentos', emp: 'grupo' });

  // Cada empresa: UTP + Segmentos + Contratos fretamento
  DIESEL_EMPRESAS.forEach(function(id) {
    slides.push({ type: 'utp',       emp: id });
    slides.push({ type: 'segmentos', emp: id });
    slides.push({ type: 'contratos', emp: id });
  });

  slides.push({ type: 'contra-capa' });
  return slides;
}

// ── Ponto de entrada ──────────────────────────────────────────
function startEficienciaDiesel() {
  dieselState = _dieselInitState();
  dieselState.slides = _dieselBuildSlides();
  _dieselRender();
}

// ── Render principal ──────────────────────────────────────────
function _dieselRender() {
  var app = document.getElementById('app');
  _dieselDestroyAllCharts();
  if (dieselState.step === 1) { app.innerHTML = _dieselStep1HTML(); return; }
  if (dieselState.step === 2) {
    app.innerHTML = _dieselStep2HTML();
    _dieselRenderStep2Panel();
    return;
  }
  if (dieselState.step === 3) {
    app.innerHTML = _dieselStep3HTML();
    _dieselRenderCurrentSlide();
    return;
  }
}

// ═══════════════════════════════════════════════
// STEP 1 — Seleção de período
// ═══════════════════════════════════════════════
function _dieselStep1HTML() {
  var mesOpts = MESES_FULL.map(function(m, i) {
    return '<option value="' + i + '"' + (i === dieselState.mes ? ' selected' : '') + '>' + m + '</option>';
  }).join('');
  var anoOpts = ANOS.map(function(a) {
    return '<option value="' + a + '"' + (a === dieselState.ano ? ' selected' : '') + '>' + a + '</option>';
  }).join('');

  return '<nav class="nav">'
    + '<div class="nav__left">'
    +   '<button class="btn btn--ghost" data-diesel-action="go-home">&#8592; In&iacute;cio</button>'
    +   '<span class="nav__title">Efici&ecirc;ncia Diesel</span>'
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
    +       '<h2 style="font-size:22px;font-weight:700;color:#1d3061;margin:0 0 4px">Efici&ecirc;ncia Diesel</h2>'
    +       '<p style="font-size:13px;color:#999;margin:0">M&ecirc;s de refer&ecirc;ncia, ano e analista</p>'
    +     '</div>'
    +     '<div style="display:flex;flex-direction:column;gap:14px">'
    +       '<div>'
    +         '<label class="field-label">M&Ecirc;S</label>'
    +         '<select class="field-input" data-diesel-root="mes">' + mesOpts + '</select>'
    +       '</div>'
    +       '<div>'
    +         '<label class="field-label">ANO</label>'
    +         '<select class="field-input" data-diesel-root="ano">' + anoOpts + '</select>'
    +       '</div>'
    +       '<div>'
    +         '<label class="field-label">ANALISTA RESPONS&Aacute;VEL</label>'
    +         '<input class="field-input" type="text" placeholder="Ex: Kelvin Santos" value="' + (dieselState.analista || '') + '" data-diesel-root="analista">'
    +       '</div>'
    +     '</div>'
    +     '<button class="btn btn--primary" style="width:100%;padding:12px;font-size:15px" data-diesel-action="go-step" data-diesel-step="2">Pr&oacute;ximo &#8594;</button>'
    +   '</div>'
    + '</div>';
}

// ═══════════════════════════════════════════════
// STEP 2 — Preenchimento de dados
// ═══════════════════════════════════════════════
function _dieselStep2HTML() {
  var mesLabel = MESES_FULL[dieselState.mes] + '/' + dieselState.ano;
  var tabs = [
    { id: 'grupo', label: 'Grupo'        },
    { id: '1001',  label: '1001'         },
    { id: 'cat',   label: 'Catarinense'  },
    { id: 'com',   label: 'Cometa'       },
  ];
  var tabsHTML = tabs.map(function(t) {
    var cls = 'diesel-tab-btn diesel-tab-btn--' + t.id + (dieselState.tabAtiva === t.id ? ' active' : '');
    return '<button class="' + cls + '" data-diesel-action="set-tab" data-diesel-tab="' + t.id + '">' + t.label + '</button>';
  }).join('');

  return '<nav class="nav">'
    + '<div class="nav__left">'
    +   '<button class="btn btn--ghost" data-diesel-action="go-step" data-diesel-step="1">&#8592; Voltar</button>'
    +   '<span class="nav__title">Efici&ecirc;ncia Diesel</span>'
    +   '<span class="nav__period">' + mesLabel + '</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:8px">'
    +   '<button class="btn btn--ghost" data-diesel-action="diesel-salvar-firebase" style="padding:3px 12px;font-size:11px;background:rgba(66,133,244,.25)">&#9729;&#65039; Salvar</button>'
    +   '<button id="diesel-btn-sheets" class="btn btn--ghost" data-diesel-action="diesel-importar-sheets" style="padding:2px 8px;background:rgba(255,255,255,.1)" title="Importar dados do Sheets"><img src="' + DIESEL_LOGO_SHEETS + '" style="height:20px;width:auto;vertical-align:middle" alt="Sheets"></button>'
    +   '<div class="nav__steps">'
    +     '<span class="nav__step nav__step--done" data-diesel-action="go-step" data-diesel-step="1">1</span>'
    +     '<span class="nav__step nav__step--active">2</span>'
    +     '<span class="nav__step">3</span>'
    +   '</div>'
    + '</div>'
    + '</nav>'
    + '<div style="display:flex;flex-direction:column;padding:16px 20px;height:calc(100vh - 50px);overflow:hidden;box-sizing:border-box;background:var(--bg)">'
    +   '<div class="diesel-tabs" style="flex-shrink:0;margin-bottom:10px">' + tabsHTML + '</div>'
    +   '<div style="display:flex;gap:16px;flex:1;min-height:0">'
    +     '<div id="diesel-step2-content" style="flex:0 0 48%;overflow-y:auto;min-width:0;padding-right:4px;padding-bottom:16px"></div>'
    +     '<div style="flex:1;min-width:0;background:#fff;border-radius:12px;border:1px solid #eee;display:flex;flex-direction:column;padding:14px;overflow:hidden">'
    +       '<div class="preview-hd">Preview — Slide Atual</div>'
    +       '<div class="preview-sub" style="margin-bottom:10px">Visualiza&ccedil;&atilde;o em tempo real</div>'
    +       '<div id="diesel-preview-frame" style="flex:1;min-height:0;overflow-y:auto;padding:4px 2px">'
    +       '</div>'
    +       '<div style="margin-top:10px;display:flex;justify-content:space-between;flex-shrink:0">'
    +         '<button class="btn btn--secondary" data-diesel-action="go-step" data-diesel-step="1" style="font-size:12px;padding:6px 14px">&#8592; Voltar</button>'
    +         '<button class="btn btn--primary" data-diesel-action="go-step" data-diesel-step="3" style="font-size:12px;padding:6px 18px">Visualizar Apresenta&ccedil;&atilde;o &#8594;</button>'
    +       '</div>'
    +     '</div>'
    +   '</div>'
    + '</div>';
}

function _dieselRenderStep2Panel() {
  var el = document.getElementById('diesel-step2-content');
  if (!el) return;
  var emp = dieselState.tabAtiva;
  var d   = dieselState.dados[emp];
  var mes = dieselState.mes;
  var segs = DIESEL_SEGS[emp] || ['rodoviario', 'fretamento'];

  // KPIs acumulados
  var html = '<div class="card" style="margin-bottom:14px">'
    + '<div class="section-title">KPIs Acumulados (' + MESES_FULL[mes] + '/' + dieselState.ano + ')</div>'
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px">'
    + _dieselKpiField('M&eacute;dia Or&ccedil;ado (km/L)', d.media_orcado,    'media_orcado',    emp)
    + _dieselKpiField('M&eacute;dia Real (km/L)',          d.media_real,       'media_real',      emp)
    + _dieselKpiField('% vs Or&ccedil;ado',               d.vs_orcado_pct,    'vs_orcado_pct',   emp)
    + _dieselKpiField('KM Or&ccedil;ado',                 d.km_orcado,        'km_orcado',       emp)
    + _dieselKpiField('KM Real',                          d.km_real,          'km_real',         emp)
    + '<div></div>'
    + _dieselKpiField('Abastecimentos Or&ccedil;ado',     d.abas_orcado,      'abas_orcado',     emp)
    + _dieselKpiField('Abastecimentos Real',              d.abas_real,        'abas_real',       emp)
    + '</div>'
    + '</div>';

  // Evolução mensal
  html += '<div class="card" style="margin-bottom:14px">'
    + '<div class="section-title">Evolu&ccedil;&atilde;o Mensal — Efici&ecirc;ncia & KM</div>'
    + '<div style="display:grid;grid-template-columns:38px repeat(12,1fr);gap:5px 6px;align-items:center;font-size:10px;margin-bottom:6px">'
    + '<div></div>'
    + MESES.map(function(m) { return '<div style="text-align:center;font-weight:700;color:#888">' + m + '</div>'; }).join('')
    + '<div style="font-size:10px;font-weight:700;color:#1d3061">Or&ccedil;ado</div>'
    + MESES.map(function(m, i) {
        var cls = i === mes ? ' class="mes-atual"' : '';
        return '<input type="text"' + cls + ' style="width:100%;padding:4px 3px;border:1.5px solid #ddd;border-radius:4px;font-size:10px;text-align:center;font-family:inherit"'
          + ' value="' + (d.orcado_mensal[i] || '') + '"'
          + ' data-diesel-emp="' + emp + '" data-diesel-field="orcado_mensal" data-diesel-idx="' + i + '">';
      }).join('')
    + '<div style="font-size:10px;font-weight:700;color:#c0392b">Real</div>'
    + MESES.map(function(m, i) {
        var cls = i === mes ? ' class="mes-atual"' : '';
        return '<input type="text"' + cls + ' style="width:100%;padding:4px 3px;border:1.5px solid #ddd;border-radius:4px;font-size:10px;text-align:center;font-family:inherit"'
          + ' value="' + (d.realizado_mensal[i] || '') + '"'
          + ' data-diesel-emp="' + emp + '" data-diesel-field="realizado_mensal" data-diesel-idx="' + i + '">';
      }).join('')
    + '<div style="font-size:10px;font-weight:700;color:#555">KM</div>'
    + MESES.map(function(m, i) {
        var cls = i === mes ? ' class="mes-atual"' : '';
        return '<input type="text"' + cls + ' style="width:100%;padding:4px 3px;border:1.5px solid #ddd;border-radius:4px;font-size:10px;text-align:center;font-family:inherit"'
          + ' value="' + (d.km_mensal[i] || '') + '"'
          + ' data-diesel-emp="' + emp + '" data-diesel-field="km_mensal" data-diesel-idx="' + i + '">';
      }).join('')
    + '</div>'
    + '</div>';

  // Segmentos
  html += '<div class="card" style="margin-bottom:14px">'
    + '<div class="section-title">Segmentos — Or&ccedil;ado vs Realizado</div>';
  segs.forEach(function(seg) {
    var s = d.segmentos[seg] || {};
    html += '<div style="margin-bottom:14px">'
      + '<div style="font-size:11px;font-weight:700;color:#1d3061;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px">' + DIESEL_SEG_LABEL[seg] + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px">'
      + _dieselKpiField('M&eacute;dia Or&ccedil;ada',    s.orcado_acum,    'seg_orcado_acum',    emp, seg)
      + _dieselKpiField('M&eacute;dia Realizada',         s.realizado_acum, 'seg_realizado_acum', emp, seg)
      + '</div>'
      + '<div style="display:grid;grid-template-columns:38px repeat(12,1fr);gap:4px 5px;align-items:center;font-size:10px">'
      + '<div style="font-weight:700;color:#888">Or&ccedil;</div>'
      + MESES.map(function(m, i) {
          var cls = i === dieselState.mes ? ' class="mes-atual"' : '';
          return '<input type="text"' + cls + ' style="width:100%;padding:3px 2px;border:1px solid #ddd;border-radius:4px;font-size:10px;text-align:center;font-family:inherit"'
            + ' value="' + ((s.orcado_mensal || [])[i] || '') + '"'
            + ' data-diesel-emp="' + emp + '" data-diesel-seg="' + seg + '" data-diesel-field="seg_orcado_mensal" data-diesel-idx="' + i + '">';
        }).join('')
      + '<div style="font-weight:700;color:#c0392b">Real</div>'
      + MESES.map(function(m, i) {
          var cls = i === dieselState.mes ? ' class="mes-atual"' : '';
          return '<input type="text"' + cls + ' style="width:100%;padding:3px 2px;border:1px solid #ddd;border-radius:4px;font-size:10px;text-align:center;font-family:inherit"'
            + ' value="' + ((s.realizado_mensal || [])[i] || '') + '"'
            + ' data-diesel-emp="' + emp + '" data-diesel-seg="' + seg + '" data-diesel-field="seg_realizado_mensal" data-diesel-idx="' + i + '">';
        }).join('')
      + '</div>'
      + '</div>';
  });
  html += '</div>';

  // Contratos de fretamento (apenas 1001, cat, com)
  if (emp !== 'grupo') {
    var contratos = d.contratos || [];
    html += '<div class="card" style="margin-bottom:14px">'
      + '<div class="section-title" style="margin-bottom:8px">Contratos de Fretamento</div>'
      + '<p class="diesel-contratos-hint">Liste os contratos por efici&ecirc;ncia decrescente</p>'
      + '<div class="diesel-contratos-grid">'
      + '<div class="hd">Contrato</div><div class="hd" style="text-align:center">KM Total</div><div class="hd" style="text-align:center">Abast.</div><div class="hd" style="text-align:center">Efici&ecirc;ncia</div><div></div>'
      + contratos.map(function(c, i) {
          return '<input type="text" value="' + (c.nome || '') + '" placeholder="Nome do contrato"'
            + ' data-diesel-emp="' + emp + '" data-diesel-contrato-idx="' + i + '" data-diesel-contrato-field="nome">'
            + '<input type="text" value="' + (c.km_total || '') + '" placeholder="0"'
            + ' data-diesel-emp="' + emp + '" data-diesel-contrato-idx="' + i + '" data-diesel-contrato-field="km_total">'
            + '<input type="text" value="' + (c.abast || '') + '" placeholder="0"'
            + ' data-diesel-emp="' + emp + '" data-diesel-contrato-idx="' + i + '" data-diesel-contrato-field="abast">'
            + '<input type="text" value="' + (c.eficiencia || '') + '" placeholder="0,00"'
            + ' data-diesel-emp="' + emp + '" data-diesel-contrato-idx="' + i + '" data-diesel-contrato-field="eficiencia">'
            + '<button class="diesel-btn-remove" data-diesel-action="rm-contrato" data-diesel-emp="' + emp + '" data-diesel-idx="' + i + '">&times;</button>';
        }).join('')
      + '</div>'
      + '<button class="diesel-btn-add-contrato" data-diesel-action="add-contrato" data-diesel-emp="' + emp + '">+ Adicionar Contrato</button>'
      + '</div>';
  }

  el.innerHTML = html;

  // ── Renderiza preview do slide UTP da empresa ativa ──────
  _dieselRenderPreviewStep2();
}

function _dieselRenderPreviewStep2() {
  var el = document.getElementById('diesel-preview-frame');
  if (!el) return;

  var emp  = dieselState.tabAtiva;
  var d    = dieselState.dados[emp];
  var mes  = dieselState.mes;
  var segs = (DIESEL_SEGS[emp] || []).filter(function(s){ return s !== 'agrupado'; });

  // Destrói charts de preview anteriores
  Object.keys(dieselCharts).forEach(function(k) {
    if (k.indexOf('prev-') === 0) {
      try { dieselCharts[k].destroy(); } catch(e) {}
      delete dieselCharts[k];
    }
  });

  var barColor = DIESEL_BAR_COLORS[emp] || 'rgba(200,200,200,.5)';

  // ── Monta HTML do preview ──────────────────────────────────
  // 1) Gráfico de evolução UTP
  var utpHTML = '<div style="margin-bottom:10px">'
    + '<div style="font-size:11px;font-weight:700;color:#1d3061;margin-bottom:4px">Evolu&ccedil;&atilde;o — Efici&ecirc;ncia km/L</div>'
    + '<div style="height:180px"><canvas id="prev-utp-' + emp + '"></canvas></div>'
    + '</div>';

  // 2) Gráficos de segmentos
  var segsHTML = segs.map(function(seg) {
    return '<div style="margin-bottom:6px">'
      + '<div style="font-size:11px;font-weight:700;color:#1d3061;margin-bottom:2px">' + DIESEL_SEG_LABEL[seg] + '</div>'
      + '<div style="height:120px"><canvas id="prev-seg-' + emp + '-' + seg + '"></canvas></div>'
      + '</div>';
  }).join('');

  el.innerHTML = utpHTML + segsHTML;

  // ── Chart UTP ─────────────────────────────────────────────
  function _parseEfic(v) {
    if (!v || v === '') return null;
    return parseFloat(String(v).replace(',','.')) || null;
  }
  function _parseKm(v) {
    if (!v || v === '') return null;
    // Aceita "17.342.429" (pt-BR) ou "17342429" ou "17342429.0"
    var s = String(v).trim();
    // Se tem vírgula, é decimal pt-BR: remove pontos e troca vírgula
    if (s.indexOf(',') !== -1) {
      s = s.replace(/\./g,'').replace(',','.');
    } else {
      // Sem vírgula: remove pontos de milhar (se mais de 3 dígitos após o ponto)
      s = s.replace(/\./g,'');
    }
    return parseFloat(s) || null;
  }

  var realData = MESES.map(function(m, i) {
    return i <= mes ? _parseEfic(d.realizado_mensal[i]) : null;
  });
  var orcData = MESES.map(function(m, i) {
    return _parseEfic(d.orcado_mensal[i]);
  });
  var kmData = MESES.map(function(m, i) {
    return i <= mes ? _parseKm(d.km_mensal[i]) : null;
  });

  var utpCanvas = document.getElementById('prev-utp-' + emp);
  if (utpCanvas) {
    dieselCharts['prev-utp-' + emp] = new Chart(utpCanvas, {
      data: {
        labels: MESES,
        datasets: [
          { type:'bar',  label:'Km Realizado', data:kmData,   backgroundColor:barColor, borderColor:DIESEL_SOLID_COLORS[emp]||'#888', borderWidth:0, yAxisID:'yKm', order:3 },
          { type:'line', label:'Efic. Real',    data:realData, borderColor:'#4a7de8', backgroundColor:'#4a7de8', borderWidth:2, pointRadius:3, pointBackgroundColor:'#4a7de8', tension:0, yAxisID:'yEff', order:1, spanGaps:false },
          { type:'line', label:'Efic. Orç.',     data:orcData,  borderColor:'#c0392b', backgroundColor:'#c0392b', borderWidth:1.5, pointRadius:2, pointBackgroundColor:'#c0392b', tension:0, yAxisID:'yEff', order:2 },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins: {
          legend:{ position:'bottom', labels:{ font:{size:9}, boxWidth:8, padding:6 } },
          datalabels:{
            display:function(ctx){ return ctx.datasetIndex > 0 && ctx.dataset.data[ctx.dataIndex] !== null; },
            formatter:function(v){ return v ? String(v).replace('.',',') : ''; },
            color:function(ctx){ return ctx.datasetIndex===1 ? '#1d3061' : '#c0392b'; },
            anchor:'end',
            align:function(ctx){
              var ds = ctx.chart.data.datasets;
              var real = ds[1] ? ds[1].data[ctx.dataIndex] : null;
              var orc  = ds[2] ? ds[2].data[ctx.dataIndex] : null;
              if (ctx.datasetIndex===1) return (real!==null && orc!==null && real>=orc) ? 'top' : 'bottom';
              return (real!==null && orc!==null && orc>real) ? 'top' : 'bottom';
            },
            font:{size:8, weight:'600'},
          },
          tooltip:{ enabled:true },
        },
        scales:{
          x:{ grid:{display:false}, ticks:{font:{size:8}} },
          yKm:{ display:false, min:0, max:(function(){ var m=0; kmData.forEach(function(v){if(v&&v>m)m=v;}); return m*1.4; })() },
          yEff:{ display:false, min:0 },
        },
        layout:{ padding:{top:28, bottom:2} },
      },
      plugins:[ChartDataLabels],
    });
  }

  // ── Charts de segmentos ───────────────────────────────────
  segs.forEach(function(seg) {
    var s = d.segmentos[seg] || {};
    var segReal = MESES.map(function(m, i) {
      return i < mes ? (parseFloat(String((s.realizado_mensal||[])[i] || '').replace(',','.')) || null) : null;
    });
    var segOrc = MESES.map(function(m, i) {
      return parseFloat(String((s.orcado_mensal||[])[i] || '').replace(',','.')) || null;
    });
    var segKm = MESES.map(function(m, i) {
      if (i >= mes) return null;
      var v = String((s.km_mensal||[])[i] || '').trim();
      if (!v) return null;
      if (v.indexOf(',') !== -1) { v = v.replace(/\./g,'').replace(',','.'); }
      else { v = v.replace(/\./g,''); }
      return parseFloat(v) || null;
    });

    var segCanvas = document.getElementById('prev-seg-' + emp + '-' + seg);
    if (!segCanvas) return;

    dieselCharts['prev-seg-' + emp + '-' + seg] = new Chart(segCanvas, {
      data: {
        labels: MESES,
        datasets: [
          { type:'bar',  label:'KM Real', data:segKm,   backgroundColor:barColor, borderColor:DIESEL_SOLID_COLORS[emp]||'#888', borderWidth:0, yAxisID:'yKm', order:3 },
          { type:'line', label:'Real',    data:segReal,  borderColor:'#4a7de8', backgroundColor:'#4a7de8', borderWidth:1.5, pointRadius:2, pointBackgroundColor:'#4a7de8', tension:0, yAxisID:'yEff', order:1, spanGaps:false },
          { type:'line', label:'Orç.',    data:segOrc,   borderColor:'#c0392b', backgroundColor:'#c0392b', borderWidth:1.5, pointRadius:2, pointBackgroundColor:'#c0392b', tension:0, yAxisID:'yEff', order:2 },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins: {
          legend:{ position:'bottom', labels:{ font:{size:8}, boxWidth:7, padding:4,
            generateLabels: function(chart) {
              return chart.data.datasets.map(function(ds, i) {
                var isBar = ds.type === 'bar';
                return {
                  text: ds.label,
                  fillStyle: isBar ? (ds.borderColor||ds.backgroundColor) : ds.backgroundColor,
                  strokeStyle: isBar ? (ds.borderColor||ds.backgroundColor) : ds.borderColor,
                  lineWidth: isBar ? 0 : 2,
                  pointStyle: isBar ? 'rect' : 'circle',
                  hidden: false, datasetIndex: i,
                };
              });
            }
          } },
          datalabels:{
            display:function(ctx){ return ctx.datasetIndex > 0 && ctx.dataset.data[ctx.dataIndex] !== null; },
            formatter:function(v){ return v ? String(v).replace('.',',') : ''; },
            color:function(ctx){ return ctx.datasetIndex===1 ? '#1d3061' : '#c0392b'; },
            anchor:'end',
            align:function(ctx){
              var ds = ctx.chart.data.datasets;
              var real = ds[1] ? ds[1].data[ctx.dataIndex] : null;
              var orc  = ds[2] ? ds[2].data[ctx.dataIndex] : null;
              if (ctx.datasetIndex===1) return (real!==null && orc!==null && real>=orc) ? 'top' : 'bottom';
              return (real!==null && orc!==null && orc>real) ? 'top' : 'bottom';
            },
            font:{size:7, weight:'600'},
          },
          tooltip:{ enabled:false },
        },
        scales:{
          x:{ grid:{display:false}, ticks:{font:{size:7}} },
          yKm:{ display:false, position:'left', min:0, max:(function(){ var m=0; segKm.forEach(function(v){if(v&&v>m)m=v;}); return m*1.4; })() },
          yEff:{ display:false, position:'right', min:0 },
        },
        layout:{ padding:{top:22, bottom:2} },
      },
      plugins:[ChartDataLabels],
    });
  });
}

function _dieselKpiField(label, value, field, emp, seg) {
  var attrs = seg
    ? 'data-diesel-emp="' + emp + '" data-diesel-field="' + field + '" data-diesel-seg="' + seg + '"'
    : 'data-diesel-emp="' + emp + '" data-diesel-field="' + field + '"';
  return '<div>'
    + '<label class="field-label">' + label + '</label>'
    + '<input class="field-input" type="text" value="' + (value || '') + '" ' + attrs + '>'
    + '</div>';
}

// ═══════════════════════════════════════════════
// STEP 3 — Visualizador de slides
// ═══════════════════════════════════════════════
function _dieselStep3HTML() {
  var slides = dieselState.slides;
  var idx    = dieselState.slideIdx;
  var mesLabel = MESES_FULL[dieselState.mes] + ' / ' + dieselState.ano;

  var thumbs = slides.map(function(s, i) {
    var label = _dieselSlideThumbLabel(s);
    var cls   = 'thumb' + (i === idx ? ' thumb--active' : '');
    return '<div class="' + cls + '" data-diesel-action="go-slide" data-diesel-idx="' + i + '">'
      + '<div class="thumb__preview" style="font-size:8px;line-height:1.3">' + label + '</div>'
      + '<div class="thumb__num">' + (i + 1) + '</div>'
      + '</div>';
  }).join('');

  return '<div class="preview-page" style="height:100vh;overflow:hidden">'
    + '<div class="preview-bar">'
    +   '<div class="preview-bar__left">'
    +     '<button class="btn btn--ghost" data-diesel-action="go-step" data-diesel-step="2">&#8592; Dados</button>'
    +     '<button class="btn btn--ghost" data-diesel-action="go-home" style="font-size:11px">In&iacute;cio</button>'
    +   '</div>'
    +   '<span class="preview-bar__info" id="diesel-slide-counter">Slide ' + (idx + 1) + ' / ' + slides.length + ' &mdash; ' + mesLabel + '</span>'
    +   '<div class="preview-bar__nav">'
    +     '<button class="preview-bar__arrow" data-diesel-action="prev-slide" ' + (idx === 0 ? 'disabled' : '') + '>&#8249;</button>'
    +     '<button class="preview-bar__arrow" data-diesel-action="next-slide" ' + (idx === slides.length - 1 ? 'disabled' : '') + '>&#8250;</button>'
    +     '<button class="btn btn--ghost" id="diesel-btn-pdf" data-diesel-action="diesel-gerar-pdf" style="padding:3px 14px;font-size:12px;margin-left:8px">Gerar PDF</button>'
    +   '</div>'
    + '</div>'
    + '<div class="preview-body">'
    +   '<div class="thumbs" id="diesel-thumbs">' + thumbs + '</div>'
    +   '<div class="slide-canvas">'
    +     '<div class="slide-frame" id="diesel-slide-frame"></div>'
    +   '</div>'
    + '</div>'
    + '</div>';
}

function _dieselSlideThumbLabel(s) {
  if (s.type === 'capa')        return 'Capa';
  if (s.type === 'contra-capa') return 'Encerramento';
  var emp = DIESEL_EMP_LABEL[s.emp] || s.emp;
  if (s.type === 'utp')         return emp + '\nEvolu&ccedil;&atilde;o';
  if (s.type === 'segmentos')   return emp + '\nSegmentos';
  if (s.type === 'contratos')   return emp + '\nFretamento';
  return s.type;
}

function _dieselRenderCurrentSlide() {
  var frame = document.getElementById('diesel-slide-frame');
  if (!frame) return;
  _dieselDestroyAllCharts();

  var s   = dieselState.slides[dieselState.slideIdx];
  var mes = dieselState.mes;

  try {
    if (s.type === 'capa')        { frame.innerHTML = _dieselSlideCapa(); return; }
    if (s.type === 'contra-capa') { frame.innerHTML = _dieselSlideContraCapa(); return; }
    if (s.type === 'utp') {
      frame.innerHTML = _dieselSlideUTP(s.emp);
      _dieselInitUTPChart(s.emp);
      return;
    }
    if (s.type === 'segmentos') {
      frame.innerHTML = _dieselSlideSegmentos(s.emp);
      _dieselInitSegCharts(s.emp);
      return;
    }
    if (s.type === 'contratos') {
      frame.innerHTML = _dieselSlideContratos(s.emp);
      return;
    }
  } catch(err) {
    frame.innerHTML = '<div style="padding:24px;font-family:monospace;font-size:12px;color:#c0392b"><strong>Erro:</strong><br>' + err.message + '</div>';
    console.error('diesel slide error:', err);
  }
}

function _dieselUpdateActiveThumbs() {
  var thumbs = document.querySelectorAll('#diesel-thumbs .thumb');
  thumbs.forEach(function(t, i) {
    t.classList.toggle('thumb--active', i === dieselState.slideIdx);
    var num = t.querySelector('.thumb__num');
    if (num) num.style.background = i === dieselState.slideIdx ? '#5b9df9' : '#1a1a2e';
  });
}

function _dieselUpdateSlideCounter() {
  var el = document.getElementById('diesel-slide-counter');
  if (!el) return;
  var mesLabel = MESES_FULL[dieselState.mes] + ' / ' + dieselState.ano;
  el.innerHTML = 'Slide ' + (dieselState.slideIdx + 1) + ' / ' + dieselState.slides.length + ' &mdash; ' + mesLabel;
  // Atualiza arrows
  var prev = document.querySelector('[data-diesel-action="prev-slide"]');
  var next = document.querySelector('[data-diesel-action="next-slide"]');
  if (prev) prev.disabled = dieselState.slideIdx === 0;
  if (next) next.disabled = dieselState.slideIdx === dieselState.slides.length - 1;
}

// ═══════════════════════════════════════════════
// SLIDES HTML
// ═══════════════════════════════════════════════

function _dieselMesAnoLabel() {
  return MESES_FULL[dieselState.mes] + ' / ' + dieselState.ano;
}

// ── Header padrão ──────────────────────────────
function _dieselSlideHeaderHTML(empId) {
  return '<div class="diesel-slide-header">'
    + '<div class="diesel-slide-header__row">'
    +   '<img src="' + DIESEL_LOGO_JCA + '" style="height:30px;object-fit:contain" alt="JCA">'
    +   '<span class="diesel-slide-header__modulo">Efici&ecirc;ncia Diesel</span>'
    + '</div>'
    + '<div class="diesel-slide-header__line"></div>'
    + '</div>'
    + (empId && empId !== 'grupo'
        ? '<img src="' + DIESEL_LOGOS[empId] + '" class="diesel-emp-logo" alt="' + empId + '">'
        : '');
}

// ── Footer padrão ──────────────────────────────
function _dieselSlideFooterHTML() {
  return '<div class="diesel-slide-footer">'
    + '<span class="diesel-slide-footer__text">DO.ACT.IOP &ndash; ' + (dieselState.analista || '') + '</span>'
    + '<img src="' + DIESEL_LOGO_IO + '" style="height:22px;object-fit:contain" alt="IO">'
    + '</div>';
}

// ── CAPA ───────────────────────────────────────
function _dieselSlideCapa() {
  return '<div class="diesel-slide">'
    + '<div class="diesel-slide-capa">'
    +   '<div class="logos-row">'
    +     '<img src="' + DIESEL_LOGO_JCA + '" alt="JCA">'
    +     '<div class="sep"></div>'
    +     '<img src="' + DIESEL_LOGO_IO_CAPA + '" alt="IO">'
    +   '</div>'
    +   '<div class="titulo">Efici&ecirc;ncia Diesel</div>'
    +   '<div class="subtitulo">' + _dieselMesAnoLabel() + '</div>'
    + '</div>'
    + '<div class="diesel-rodape-autor">DO.ACT.IOP &mdash; ' + (dieselState.analista || '') + '</div>'
    + '</div>';
}

// ── CONTRA-CAPA ────────────────────────────────
function _dieselSlideContraCapa() {
  return '<div class="diesel-slide">'
    + '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center">'
    +   '<div class="logos-row" style="display:flex;align-items:center;gap:32px">'
    +     '<img src="' + DIESEL_LOGO_JCA + '" style="height:60px;object-fit:contain" alt="JCA">'
    +     '<div style="width:2px;height:70px;background:#333"></div>'
    +     '<img src="' + DIESEL_LOGO_IO_CAPA + '" style="height:60px;object-fit:contain" alt="IO">'
    +   '</div>'
    + '</div>'
    + '</div>';
}

// ── SLIDE UTP (evolução + KPIs) ─────────────────
function _dieselSlideUTP(empId) {
  var d    = dieselState.dados[empId];
  var mes  = dieselState.mes;

  function fmtN(v) { return (v && v !== '') ? v : '—'; }
  function vsClass(v) {
    if (!v || v === '') return '';
    var n = parseFloat(String(v).replace(',', '.'));
    return n >= 0 ? 'diesel-badge-vs--green' : 'diesel-badge-vs--red';
  }
  function vsLabel(v) {
    if (!v || v === '') return '';
    var n = parseFloat(String(v).replace(',', '.'));
    var abs = Math.abs(n).toFixed(1).replace('.', ',');
    return (n >= 0 ? '+' : '-') + abs + '% ' + (n >= 0 ? 'Acima do Or&ccedil;ado' : 'Abaixo do Or&ccedil;ado');
  }

  return '<div class="diesel-slide">'
    + _dieselSlideHeaderHTML(empId === 'grupo' ? null : empId)
    + '<div class="diesel-slide-body">'
    +   '<div class="diesel-slide-secao">Efici&ecirc;ncia Diesel | ' + dieselState.ano + '</div>'
    +   '<div class="diesel-kpis-row">'
    +     _dieselKpiCardHTML('M&eacute;dia Or&ccedil;ado', fmtN(d.media_orcado), '#8B2020')
    +     _dieselKpiCardHTML('Km Or&ccedil;ado',          fmtN(d.km_orcado),    '#8B2020')
    +     _dieselKpiCardHTML('Abas Or&ccedil;ado',        fmtN(d.abas_orcado),  '#8B2020')
    +     _dieselKpiCardHTML('M&eacute;dia Real',          fmtN(d.media_real),   '#1d3061')
    +     _dieselKpiCardHTML('Km Real',                   fmtN(d.km_real),      '#1d3061')
    +     _dieselKpiCardHTML('Abas Real',                 fmtN(d.abas_real),    '#1d3061')
    +   '</div>'
    +   (d.vs_orcado_pct
        ? '<div class="diesel-badge-vs ' + vsClass(d.vs_orcado_pct) + '">' + vsLabel(d.vs_orcado_pct) + '</div>'
        : '')
    +   '<div class="diesel-utp-chart-wrap">'
    +     '<canvas id="diesel-utp-chart-' + empId + '"></canvas>'
    +   '</div>'
    + '</div>'
    + _dieselSlideFooterHTML()
    + '</div>';
}

function _dieselKpiCardHTML(label, value, cor) {
  var valueColor = cor || '#1d3061';
  return '<div class="diesel-kpi-card">'
    + '<div class="diesel-kpi-card__label">' + label + '</div>'
    + '<div class="diesel-kpi-card__value" style="color:' + valueColor + '">' + value + '</div>'
    + '</div>';
}

// ── SLIDE SEGMENTOS ────────────────────────────
function _dieselSlideSegmentos(empId) {
  var d    = dieselState.dados[empId];
  var segs = DIESEL_SEGS[empId] || ['rodoviario', 'fretamento'];

  function vsClass(orc, real) {
    if (!orc || !real || orc === '' || real === '') return '';
    var o = parseFloat(String(orc).replace(',', '.'));
    var r = parseFloat(String(real).replace(',', '.'));
    return r >= o ? 'diesel-seg-vs--green' : 'diesel-seg-vs--red';
  }
  function vsLabel(orc, real) {
    if (!orc || !real || orc === '' || real === '') return '';
    var o = parseFloat(String(orc).replace(',', '.'));
    var r = parseFloat(String(real).replace(',', '.'));
    var pct = o > 0 ? (((r - o) / o) * 100).toFixed(1).replace('.', ',') : '0,0';
    var abs = Math.abs(parseFloat(pct.replace(',', '.'))).toFixed(1).replace('.', ',');
    return (r >= o ? '+' : '-') + abs + '% ' + (r >= o ? 'Acima do Or&ccedil;ado' : 'Abaixo do Or&ccedil;ado');
  }

  var segItemsHTML = segs.map(function(seg, si) {
    var s = d.segmentos[seg] || {};
    var canvasId = 'diesel-seg-chart-' + empId + '-' + seg;
    var isLast = si === segs.length - 1;
    return '<div class="diesel-seg-item" style="flex:1;min-height:0;display:flex;gap:10px;align-items:stretch">'
      + '<div style="font-size:13px;font-weight:700;color:#1d3061;width:90px;display:flex;align-items:center;flex-shrink:0">'
      +   DIESEL_SEG_LABEL[seg]
      + '</div>'
      + '<div style="flex:1;min-width:0;min-height:0;display:flex;flex-direction:column">'
      + '<div style="flex:1;min-height:0"><canvas id="' + canvasId + '"></canvas></div>'
      + (isLast ? '<div style="display:flex;justify-content:center;gap:16px;padding-top:4px;flex-shrink:0">'
        + '<span style="display:flex;align-items:center;gap:4px;font-size:8px;color:#555"><span style="width:8px;height:8px;border-radius:50%;background:#4a7de8;display:inline-block"></span>Eficiência Realizada</span>'
        + '<span style="display:flex;align-items:center;gap:4px;font-size:8px;color:#555"><span style="width:8px;height:8px;border-radius:50%;background:#c0392b;display:inline-block"></span>Eficiência Orçada</span>'
        + '<span style="display:flex;align-items:center;gap:4px;font-size:8px;color:#555"><span style="width:10px;height:8px;background:' + (DIESEL_SOLID_COLORS[empId]||'#888') + ';display:inline-block;opacity:0.7"></span>Km Realizado</span>'
        + '</div>' : '')
      + '</div>'
      + '<div style="display:flex;flex-direction:column;gap:4px;width:150px;flex-shrink:0;justify-content:center">'
      +   '<div style="display:flex;gap:6px">'
      +     '<div class="diesel-seg-card" style="flex:1">'
      +       '<div><div class="diesel-seg-card__label">Or&ccedil;ado</div>'
      +       '<div class="diesel-seg-card__value">' + (s.orcado_acum || '—') + '</div></div>'
      +     '</div>'
      +     '<div class="diesel-seg-card" style="flex:1">'
      +       '<div><div class="diesel-seg-card__label">Realizado</div>'
      +       '<div class="diesel-seg-card__value" style="color:' + (s.orcado_acum && s.realizado_acum ? (parseFloat(String(s.realizado_acum).replace(',','.')) >= parseFloat(String(s.orcado_acum).replace(',','.')) ? '#1a7a3c' : '#c0392b') : '#1d3061') + '">' + (s.realizado_acum || '—') + '</div></div>'
      +     '</div>'
      +   '</div>'
      +   '<div class="diesel-seg-vs ' + vsClass(s.orcado_acum, s.realizado_acum) + '">' + vsLabel(s.orcado_acum, s.realizado_acum) + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  return '<div class="diesel-slide">'
    + _dieselSlideHeaderHTML(empId === 'grupo' ? null : empId)
    + '<div class="diesel-slide-body">'
    +   '<div class="diesel-slide-secao">Efici&ecirc;ncia Diesel | ' + dieselState.ano + '</div>'
    +   '<div class="diesel-segs-layout" style="flex:1;display:flex;flex-direction:column;gap:8px;min-height:0">'
    +     segItemsHTML
    +   '</div>'
    + '</div>'
    + _dieselSlideFooterHTML()
    + '</div>';
}

// ── SLIDE CONTRATOS FRETAMENTO ──────────────────
function _dieselSlideContratos(empId) {
  var d = dieselState.dados[empId];
  var contratos = (d.contratos || []).filter(function(c) { return c.nome && c.nome !== ''; });

  // Split em duas colunas só se tiver mais de 10 contratos
  var usarDuasColunas = contratos.length > 10;
  var mid  = usarDuasColunas ? Math.ceil(contratos.length / 2) : contratos.length;
  var col1 = contratos.slice(0, mid);
  var col2 = usarDuasColunas ? contratos.slice(mid) : [];

  var color = DIESEL_SOLID_COLORS[empId] || '#1d3061';

  function tabelaHTML(list) {
    if (!list.length) return '<div style="color:#bbb;font-style:italic;font-size:12px">—</div>';
    return '<table class="diesel-contratos-slide-table">'
      + '<thead><tr style="background:' + color + '">'
      +   '<th>Contrato</th>'
      +   '<th class="col-num">KM Total</th>'
      +   '<th class="col-num">Abast.</th>'
      +   '<th class="col-num">Efici&ecirc;ncia</th>'
      + '</tr></thead>'
      + '<tbody>'
      + list.map(function(c) {
          return '<tr><td>' + (c.nome || '') + '</td>'
            + '<td class="num-cell">' + (c.km_total ? Number(String(c.km_total).replace(/\./g,'').replace(',','.')).toLocaleString('pt-BR') : '—') + '</td>'
            + '<td class="num-cell">' + (c.abast ? Number(String(c.abast).replace(/\./g,'').replace(',','.')).toLocaleString('pt-BR') : '—') + '</td>'
            + '<td class="eff-cell">' + (c.eficiencia || '—') + '</td>'
            + '</tr>';
        }).join('')
      + '</tbody></table>';
  }

  return '<div class="diesel-slide">'
    + _dieselSlideHeaderHTML(empId)
    + '<div class="diesel-slide-body">'
    +   '<div class="diesel-slide-secao">Efici&ecirc;ncia Diesel | ' + dieselState.ano + '</div>'
    +   '<div style="font-size:12px;font-weight:600;color:#888;margin-bottom:6px;flex-shrink:0">Fretamento &mdash; ' + MESES_FULL[dieselState.mes] + ' ' + dieselState.ano + '</div>'
    +   '<div style="flex:1;min-height:0;overflow:hidden;display:flex;gap:14px">'
    +     '<div style="flex:1;overflow:hidden">' + tabelaHTML(col1) + '</div>'
    +     (col2.length ? '<div style="flex:1;overflow:hidden">' + tabelaHTML(col2) + '</div>' : '')
    +   '</div>'
    + '</div>'
    + _dieselSlideFooterHTML()
    + '</div>';
}

// ═══════════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════════

function _dieselDestroyAllCharts() {
  Object.keys(dieselCharts).forEach(function(k) {
    try { dieselCharts[k].destroy(); } catch(e) {}
  });
  dieselCharts = {};
}

// Chart UTP: barras (KM) + linhas (eficiência real e orçada)
function _dieselInitUTPChart(empId) {
  var d   = dieselState.dados[empId];
  var mes = dieselState.mes;
  var canvas = document.getElementById('diesel-utp-chart-' + empId);
  if (!canvas) return;

  var meses  = MESES;
  var labels = meses;

  // Dados completos: meses passados preenchidos, futuros (após mes) → orçado como linha tracejada
  var realData = meses.map(function(m, i) {
    return i <= mes ? (parseFloat(String(d.realizado_mensal[i] || '').replace(',', '.')) || null) : null;
  });
  var orcFull  = meses.map(function(m, i) {
    return parseFloat(String(d.orcado_mensal[i] || '').replace(',', '.')) || null;
  });
  var kmData  = meses.map(function(m, i) {
    if (i > mes) return null;
    var v = String(d.km_mensal[i] || '').trim();
    if (!v) return null;
    // pt-BR com pontos de milhar: "17.342.429" ou sem vírgula
    if (v.indexOf(',') !== -1) {
      v = v.replace(/\./g,'').replace(',','.');
    } else {
      v = v.replace(/\./g,'');
    }
    return parseFloat(v) || null;
  });

  var barColor = DIESEL_BAR_COLORS[empId] || 'rgba(200,200,200,.5)';
  var lineColor = DIESEL_SOLID_COLORS[empId] || '#1d3061';

  var chart = new Chart(canvas, {
    data: {
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: 'Km Realizado',
          data: kmData,
          backgroundColor: barColor,
          yAxisID: 'yKm',
          order: 3,
        },
        {
          type: 'line',
          label: 'Eficiência Realizada',
          data: realData,
          borderColor: '#4a7de8',
          backgroundColor: '#4a7de8',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#4a7de8',
          tension: 0,
          yAxisID: 'yEff',
          order: 1,
          spanGaps: false,
        },
        {
          type: 'line',
          label: 'Eficiência Orçada',
          data: orcFull,
          borderColor: '#c0392b',
          backgroundColor: '#c0392b',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#c0392b',
          tension: 0,
          yAxisID: 'yEff',
          order: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            font: { size: 8 },
            boxWidth: 7,
            padding: 8,
            generateLabels: function(chart) {
              var datasets = chart.data.datasets;
              return datasets.map(function(ds, i) {
                var isBar = ds.type === 'bar';
                // Para barra: pega a cor sólida correspondente (sem transparência)
                var fillColor = isBar ? ds.borderColor || ds.backgroundColor : ds.backgroundColor;
                return {
                  text: ds.label,
                  fillStyle: fillColor,
                  strokeStyle: fillColor,
                  lineWidth: isBar ? 0 : 2,
                  pointStyle: isBar ? 'rect' : 'circle',
                  hidden: false,
                  datasetIndex: i,
                };
              });
            },
          },
        },
        datalabels: {
          display: function(ctx) { return ctx.dataset.data[ctx.dataIndex] !== null; },
          formatter: function(v, ctx) {
            if (v === null || v === undefined) return '';
            // KM (dataset 0): mostra valor centralizado na barra
            if (ctx.datasetIndex === 0) {
              if (!v || v <= 0) return '';
              // Formata com separador de milhar pt-BR
              return Math.round(v).toLocaleString('pt-BR');
            }
            return typeof v === 'number' ? v.toFixed(2).replace('.', ',') : '';
          },
          color: function(ctx) {
            if (ctx.datasetIndex === 0) return '#555';
            return ctx.datasetIndex === 1 ? '#1d3061' : '#c0392b';
          },
          anchor: function(ctx) { return ctx.datasetIndex === 0 ? 'center' : 'end'; },
          align: function(ctx) {
            if (ctx.datasetIndex === 0) return 'center';
            var datasets = ctx.chart.data.datasets;
            var real = datasets[1] ? datasets[1].data[ctx.dataIndex] : null;
            var orc  = datasets[2] ? datasets[2].data[ctx.dataIndex] : null;
            if (ctx.datasetIndex === 1) {
              return (real !== null && orc !== null && real >= orc) ? 'top' : 'bottom';
            } else {
              return (real !== null && orc !== null && orc > real) ? 'top' : 'bottom';
            }
          },
          font: function(ctx) {
            return ctx.datasetIndex === 0
              ? { size: 8, weight: '600' }
              : { size: 9, weight: '600' };
          },
        },
        tooltip: { enabled: true },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 } } },
        yKm: {
          display: false,
          position: 'left',
          min: 0,
          max: (function() {
            var maxKm = 0;
            kmData.forEach(function(v) { if (v && v > maxKm) maxKm = v; });
            return maxKm * 1.4;
          })(),
          grid: { display: false },
          ticks: { display: false },
        },
        yEff: {
          display: false,
          position: 'right',
          min: 0,
          grid: { display: false },
          ticks: { display: false },
        },
      },
    },
    plugins: [ChartDataLabels],
  });

  dieselCharts['utp-' + empId] = chart;
}

// Chart de segmento (mini combo: barra KM + linhas real/orçado)
function _dieselInitSegCharts(empId) {
  var d    = dieselState.dados[empId];
  var segs = DIESEL_SEGS[empId] || ['rodoviario', 'fretamento'];
  var mes  = dieselState.mes;
  var barColor  = DIESEL_BAR_COLORS[empId]  || 'rgba(200,200,200,.5)';
  var lineColor = DIESEL_SOLID_COLORS[empId] || '#1d3061';

  segs.forEach(function(seg) {
    var canvasId = 'diesel-seg-chart-' + empId + '-' + seg;
    var canvas   = document.getElementById(canvasId);
    if (!canvas) return;

    var s = d.segmentos[seg] || {};
    var realData = MESES.map(function(m, i) {
      return i <= mes ? (parseFloat(String((s.realizado_mensal || [])[i] || '').replace(',', '.')) || null) : null;
    });
    var orcData = MESES.map(function(m, i) {
      return parseFloat(String((s.orcado_mensal || [])[i] || '').replace(',', '.')) || null;
    });
    var kmSegData = MESES.map(function(m, i) {
      if (i > mes) return null;
      var v = String((s.km_mensal || [])[i] || '').trim();
      if (!v) return null;
      if (v.indexOf(',') !== -1) { v = v.replace(/\./g,'').replace(',','.'); }
      else { v = v.replace(/\./g,''); }
      return parseFloat(v) || null;
    });

    var chart = new Chart(canvas, {
      data: {
        labels: MESES,
        datasets: [
          {
            type: 'bar',
            label: 'KM Real',
            data: kmSegData,
            backgroundColor: barColor,
            borderColor: DIESEL_SOLID_COLORS[empId] || '#888888',
            borderWidth: 0,
            yAxisID: 'yKm',
            order: 3,
          },
          {
            type: 'line',
            label: 'Efic. Realizada',
            data: realData,
            borderColor: '#4a7de8',
            backgroundColor: '#4a7de8',
            borderWidth: 1.5,
            pointRadius: 3,
            pointBackgroundColor: '#4a7de8',
            tension: 0,
            yAxisID: 'yEff',
            order: 1,
            spanGaps: false,
          },
          {
            type: 'line',
            label: 'Efic. Or\u00e7ada',
            data: orcData,
            borderColor: '#c0392b',
            backgroundColor: '#c0392b',
            borderWidth: 1.5,
            pointRadius: 2,
            pointBackgroundColor: '#c0392b',
            tension: 0,
            yAxisID: 'yEff',
            order: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false, labels: { generateLabels: function(chart) {
            return chart.data.datasets.map(function(ds, i) {
              var isBar = ds.type === 'bar';
              return { text:ds.label, fillStyle:isBar?(ds.borderColor||ds.backgroundColor):ds.backgroundColor, strokeStyle:isBar?(ds.borderColor||ds.backgroundColor):ds.borderColor, lineWidth:isBar?0:2, pointStyle:isBar?'rect':'circle', hidden:false, datasetIndex:i };
            });
          } } },
          datalabels: {
            display: function(ctx) { return ctx.datasetIndex > 0 && ctx.dataset.data[ctx.dataIndex] !== null; },
            formatter: function(v) { return v !== null ? String(v).replace('.', ',') : ''; },
            color: function(ctx) { return ctx.datasetIndex === 1 ? '#1d3061' : '#c0392b'; },
            anchor: 'end',
            align: function(ctx) {
              var ds = ctx.chart.data.datasets;
              var real = ds[1] ? ds[1].data[ctx.dataIndex] : null;
              var orc  = ds[2] ? ds[2].data[ctx.dataIndex] : null;
              if (ctx.datasetIndex === 1) return (real !== null && orc !== null && real >= orc) ? 'top' : 'bottom';
              return (real !== null && orc !== null && orc > real) ? 'top' : 'bottom';
            },
            font: { size: 8, weight: '600' },
          },
          tooltip: { enabled: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 8 } } },
          yKm:  { display: false, position: 'left', min: 0,
            max: (function() {
              var maxKm = 0;
              kmSegData.forEach(function(v) { if (v && v > maxKm) maxKm = v; });
              return maxKm * 1.4;
            })()
          },
          yEff: { display: false, position: 'right', min: 0 },
        },
        layout: { padding: { top: 28, bottom: 8 } },
      },
      plugins: [ChartDataLabels],
    });

    dieselCharts['seg-' + empId + '-' + seg] = chart;
  });
}

// ═══════════════════════════════════════════════
// FIREBASE
// ═══════════════════════════════════════════════
var DIESEL_COL = 'eficiencia_diesel';

function _dieselDocId() {
  return dieselState.ano + '-' + String(dieselState.mes + 1).padStart(2, '0');
}

function _dieselClean(obj) {
  return JSON.parse(JSON.stringify(obj, function(k, v) { return v === undefined ? null : v; }));
}

function _dieselSalvarFirebase(onSuccess) {
  if (typeof _db === 'undefined') { if (onSuccess) onSuccess(); return; }
  _db.collection(DIESEL_COL).doc(_dieselDocId()).set(_dieselClean({
    mes:      dieselState.mes,
    ano:      dieselState.ano,
    analista: dieselState.analista,
    dados:    dieselState.dados,
    savedAt:  firebase.firestore.FieldValue.serverTimestamp(),
  })).then(function() {
    if (onSuccess) onSuccess();
  }).catch(function(e) { console.error('[diesel] Firebase save:', e); });
}

function _dieselSalvarManual() {
  var btn = document.querySelector('[data-diesel-action="diesel-salvar-firebase"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
  _dieselSalvarFirebase(function() {
    if (btn) { btn.disabled = false; btn.textContent = '☁️ Salvar'; }
    alert('✅ Dados salvos com sucesso!');
  });
}

function _dieselCarregarFirebase(callback) {
  if (typeof _db === 'undefined') { callback(); return; }
  _db.collection(DIESEL_COL).doc(_dieselDocId()).get().then(function(doc) {
    if (doc.exists) {
      var d = doc.data();
      if (d.dados) dieselState.dados = JSON.parse(JSON.stringify(d.dados));
      if (d.analista) dieselState.analista = d.analista;
    }
    callback();
  }).catch(function(e) { console.warn('[diesel] Firebase load:', e); callback(); });
}

function _dieselAvancarParaStep2() {
  var btn = document.querySelector('[data-diesel-action="go-step"][data-diesel-step="2"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Carregando...'; }
  _dieselCarregarFirebase(function() {
    dieselState.step = 2;
    _dieselRender();
  });
}

// ═══════════════════════════════════════════════
// PDF
// ═══════════════════════════════════════════════
function _dieselGerarPDF() {
  var btn = document.getElementById('diesel-btn-pdf');
  if (btn) { btn.disabled = true; btn.textContent = 'Gerando...'; }

  var jsPDFLib = window.jspdf;
  var pdf = new jsPDFLib.jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540], hotfixes: ['px_scaling'] });
  var container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:960px;height:540px;overflow:hidden;background:#fff';
  document.body.appendChild(container);
  var slides = dieselState.slides;
  var i = 0;

  function _finalizarPDF() {
    try { document.body.removeChild(container); } catch(e) {}
    pdf.save('Eficiencia_Diesel_' + MESES_FULL[dieselState.mes] + '_' + dieselState.ano + '.pdf');
    dieselState.slideIdx = 0;
    _dieselRenderCurrentSlide();
    _dieselUpdateActiveThumbs();
    _dieselUpdateSlideCounter();
    if (btn) { btn.disabled = false; btn.textContent = 'Gerar PDF'; }
  }

  function _erroPDF(e) {
    alert('Erro ao gerar PDF: ' + e.message);
    console.error('[diesel PDF]', e);
    try { document.body.removeChild(container); } catch(ex) {}
    if (btn) { btn.disabled = false; btn.textContent = 'Gerar PDF'; }
  }

  function _processarSlide() {
    if (i >= slides.length) { _finalizarPDF(); return; }
    if (i > 0) pdf.addPage();
    dieselState.slideIdx = i;
    _dieselDestroyAllCharts();
    var s = slides[i];
    var html = '';
    if      (s.type === 'capa')        html = _dieselSlideCapa();
    else if (s.type === 'contra-capa') html = _dieselSlideContraCapa();
    else if (s.type === 'utp')         html = _dieselSlideUTP(s.emp);
    else if (s.type === 'segmentos')   html = _dieselSlideSegmentos(s.emp);
    else if (s.type === 'contratos')   html = _dieselSlideContratos(s.emp);
    container.innerHTML = html;
    var slide = container.querySelector('.diesel-slide');
    if (slide) { slide.style.width='960px'; slide.style.height='540px'; slide.style.boxShadow='none'; slide.style.borderRadius='0'; }
    var dpr = window.devicePixelRatio;
    window.devicePixelRatio = 4;
    if (s.type === 'utp')       _dieselInitUTPChart(s.emp);
    if (s.type === 'segmentos') _dieselInitSegCharts(s.emp);
    var delay = (s.type === 'capa' || s.type === 'contra-capa') ? 60 : 260;
    setTimeout(function() {
      window.devicePixelRatio = dpr;
      html2canvas(container, { scale:4, useCORS:true, allowTaint:true, backgroundColor:'#fff', logging:false })
        .then(function(canvas) {
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, 960, 540);
          i++;
          _processarSlide();
        })
        .catch(_erroPDF);
    }, delay);
  }

  try { _processarSlide(); } catch(e) { _erroPDF(e); }
}

// ═══════════════════════════════════════════════
// HANDLER DE AÇÕES
// ═══════════════════════════════════════════════
function dieselHandleAction(action, dataset, el) {
  switch (action) {
    case 'go-home':
      dieselState = null;
      state.screen = 'home';
      render();
      break;

    case 'go-step':
      var step = Number(dataset.dieselStep);
      if (step === 2 && dieselState.step === 1) { _dieselAvancarParaStep2(); break; }
      dieselState.step = step;
      if (step === 3) { dieselState.slideIdx = 0; _dieselSalvarFirebase(null); }
      _dieselRender();
      break;

    case 'set-tab':
      dieselState.tabAtiva = dataset.dieselTab;
      // Atualiza classes das abas sem re-renderizar a página toda
      document.querySelectorAll('.diesel-tab-btn').forEach(function(btn) {
        var t = btn.dataset.dieselTab;
        btn.className = 'diesel-tab-btn diesel-tab-btn--' + t + (t === dieselState.tabAtiva ? ' active' : '');
      });
      _dieselRenderStep2Panel();
      break;

    case 'go-slide':
      dieselState.slideIdx = Number(dataset.dieselIdx);
      _dieselRenderCurrentSlide();
      _dieselUpdateActiveThumbs();
      _dieselUpdateSlideCounter();
      break;

    case 'prev-slide':
      if (dieselState.slideIdx > 0) {
        dieselState.slideIdx--;
        _dieselRenderCurrentSlide();
        _dieselUpdateActiveThumbs();
        _dieselUpdateSlideCounter();
      }
      break;

    case 'next-slide':
      if (dieselState.slideIdx < dieselState.slides.length - 1) {
        dieselState.slideIdx++;
        _dieselRenderCurrentSlide();
        _dieselUpdateActiveThumbs();
        _dieselUpdateSlideCounter();
      }
      break;

    case 'add-contrato':
      var empAdd = dataset.dieselEmp;
      if (!dieselState.dados[empAdd].contratos) dieselState.dados[empAdd].contratos = [];
      dieselState.dados[empAdd].contratos.push({ nome: '', km_total: '', abast: '', eficiencia: '' });
      _dieselRenderStep2Panel();
      break;

    case 'rm-contrato':
      var empRm  = dataset.dieselEmp;
      var idxRm  = Number(dataset.dieselIdx);
      dieselState.dados[empRm].contratos.splice(idxRm, 1);
      _dieselRenderStep2Panel();
      break;

    case 'diesel-salvar-firebase':
      _dieselSalvarManual();
      break;

    case 'diesel-importar-sheets':
      _dieselImportarSheets();
      break;

    case 'diesel-gerar-pdf':
      _dieselGerarPDF();
      break;
  }
}

// ── Handler de inputs ─────────────────────────────────────────
function dieselHandleInput(el) {
  var emp   = el.dataset.dieselEmp;
  var field = el.dataset.dieselField;
  var seg   = el.dataset.dieselSeg;
  var idx   = el.dataset.dieselIdx;

  if (!emp || !field) return;

  var d = dieselState.dados[emp];
  if (!d) return;

  // KPI simples
  if (!seg && idx === undefined) {
    d[field] = el.value;
    return;
  }

  // Array mensal direto (orcado_mensal, realizado_mensal, km_mensal)
  if (!seg && idx !== undefined) {
    d[field][Number(idx)] = el.value;
    return;
  }

  // Segmento KPI
  if (seg && idx === undefined) {
    if (field === 'seg_orcado_acum')    { d.segmentos[seg].orcado_acum    = el.value; return; }
    if (field === 'seg_realizado_acum') { d.segmentos[seg].realizado_acum = el.value; return; }
  }

  // Segmento mensal
  if (seg && idx !== undefined) {
    if (field === 'seg_orcado_mensal')    { d.segmentos[seg].orcado_mensal[Number(idx)]    = el.value; return; }
    if (field === 'seg_realizado_mensal') { d.segmentos[seg].realizado_mensal[Number(idx)] = el.value; return; }
  }
}

function dieselHandleContratoInput(el) {
  var emp   = el.dataset.dieselEmp;
  var idx   = Number(el.dataset.dieselContratoIdx);
  var field = el.dataset.dieselContratoField;
  if (!emp || isNaN(idx) || !field) return;
  if (!dieselState.dados[emp].contratos[idx]) return;
  dieselState.dados[emp].contratos[idx][field] = el.value;
}

// ═══════════════════════════════════════════════════════════════
// IMPORTAÇÃO DO GOOGLE SHEETS VIA APPS SCRIPT
// ═══════════════════════════════════════════════════════════════
function _dieselImportarSheets() {
  var btn = document.getElementById('diesel-btn-sheets');
  if (btn) { btn.disabled = true; btn.title = 'Importando...'; }

  var mes = dieselState.mes + 1;
  var ano = dieselState.ano;
  var url = DIESEL_APPS_SCRIPT_URL + '?acao=getDiesel&mes=' + mes + '&ano=' + ano;

  function _aplicarDados(json) {
    if (!json.ok) throw new Error(json.erro || 'Erro no Apps Script');
    var dados = json.dados;
    var emps  = ['grupo', '1001', 'cat', 'com'];
    emps.forEach(function(emp) {
      if (!dados[emp]) return;
      var d  = dados[emp];
      var ds = dieselState.dados[emp];
      if (d.media_orcado)              ds.media_orcado  = d.media_orcado;
      if (d.media_real)                ds.media_real    = d.media_real;
      if (d.km_orcado)                 ds.km_orcado     = d.km_orcado;
      if (d.km_real)                   ds.km_real       = d.km_real;
      if (d.abas_orcado)               ds.abas_orcado   = d.abas_orcado;
      if (d.abas_real)                 ds.abas_real     = d.abas_real;
      if (d.vs_orcado_pct !== undefined) ds.vs_orcado_pct = d.vs_orcado_pct;
      if (d.orcado_mensal)             ds.orcado_mensal    = d.orcado_mensal;
      if (d.realizado_mensal)          ds.realizado_mensal = d.realizado_mensal;
      if (d.km_mensal)                 ds.km_mensal        = d.km_mensal;
      if (d.segmentos) {
        Object.keys(d.segmentos).forEach(function(seg) {
          if (!ds.segmentos[seg]) ds.segmentos[seg] = { orcado_acum:'', realizado_acum:'', orcado_mensal:Array(12).fill(''), realizado_mensal:Array(12).fill('') };
          var s = d.segmentos[seg];
          if (s.orcado_acum    !== undefined) ds.segmentos[seg].orcado_acum    = s.orcado_acum;
          if (s.realizado_acum !== undefined) ds.segmentos[seg].realizado_acum = s.realizado_acum;
          if (s.orcado_mensal)    ds.segmentos[seg].orcado_mensal    = s.orcado_mensal;
          if (s.realizado_mensal) ds.segmentos[seg].realizado_mensal = s.realizado_mensal;
          if (s.km_mensal && s.km_mensal.length) ds.segmentos[seg].km_mensal = s.km_mensal;
        });
      }
      if (d.contratos && d.contratos.length) {
        ds.contratos = d.contratos.map(function(c) {
          return { nome: c.nome||'', km_total: c.km_total||'', abast: c.abast||'', eficiencia: c.eficiencia||'' };
        });
      }
    });
    console.log('[diesel import] segmentos grupo:', JSON.stringify(dieselState.dados['grupo'].segmentos));
    _dieselRenderStep2Panel();
    _dieselSalvarFirebase(null);
    alert('Dados importados com sucesso! ' + mes + '/' + ano);
    if (btn) { btn.disabled = false; btn.title = 'Importar dados do Sheets'; }
  }

  fetch(url)
    .then(function(resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.json();
    })
    .then(function(json) {
      _aplicarDados(json);
    })
    .catch(function(err) {
      alert('Erro ao importar: ' + err.message);
      console.error('[diesel sheets import]', err);
      if (btn) { btn.disabled = false; btn.title = 'Importar dados do Sheets'; }
    });
}