// ═══════════════════════════════════════════════════════════════
// multas-transito.js — Módulo Multas de Trânsito
// Prefixo: mt  |  Coleções: multas_transito / planos_multas_transito
// ═══════════════════════════════════════════════════════════════

// ── Constantes ────────────────────────────────────────────────
var MT_LOGOS = {
  grupo:  'https://res.cloudinary.com/dln0ctawv/image/upload/v1779238658/JCA_1_mp1ic7.png',
  '1001': 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671790/1001_qisjtr_1_pzpzqw.png',
  '1001u':'https://res.cloudinary.com/dln0ctawv/image/upload/v1781307419/1001_URB_m1lbdu.png',
  cat:    'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671813/AVC_zk4pe9_k4jgau.png',
  com:    'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671826/COM_folzln_ddghpr.png',
};

var MT_LOGO_JCA     = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779238658/JCA_1_mp1ic7.png';
var MT_LOGO_IO      = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779238606/Intelig%C3%AAncia_preto_2_y6idqg.png';
var MT_LOGO_IO_CAPA = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1781283106/Intelig%C3%AAncia_horizontal_preto_p6gikp_mwb3ts.png';

var MT_EMP_LABEL = {
  grupo:  'Grupo JCA',
  '1001': '1001',
  '1001u':'1001 Urbano',
  cat:    'Catarinense',
  com:    'Cometa',
};

// Cores das barras por empresa
var MT_BAR_COLORS = {
  grupo:  'rgba(236,152,152,.85)',
  '1001': 'rgba(158,158,158,.85)',
  '1001u':'rgba(176,176,176,.70)',
  cat:    'rgba(3,165,165,.85)',
  com:    'rgba(74,144,217,.55)',
};

var MT_EMPRESAS_DETALHE = ['1001','1001u','cat','com'];

// ── Estado global ─────────────────────────────────────────────
var mtState = null;
var mtCharts = {};

// ── Estado inicial de uma empresa ────────────────────────────
function _mtInitEmpresa() {
  return {
    // Evolução mensal: valores e qtde (arrays 12 posições)
    utp_valores:  Array(12).fill(0),
    utp_qtde:     Array(12).fill(0),
    utp_orcado:   Array(12).fill(0),
    utp_acum:     0,
    utp_qtde_acum: 0,
    utp_orcado_acum: 0,
    // Análise do mês
    multas_recebidas_val:  0,
    multas_recebidas_qtde: 0,
    nics_val:  0,
    nics_qtde: 0,
    // Motivos do mês (barras horizontais): [{descricao, qtde}]
    motivos: [],
    // Principais locais do motivo principal: [{endereco, qtde}]
    locais: [],
    // UTP Custos (só no grupo): {valor_total, ressarcimento, custo_empresa, em_aberto}
    utp_custo: { valor_total: 0, ressarcimento: 0, custo_empresa: 0, em_aberto: 0 },
    // Plano de ação
    planoAcao: { causa: '', texto: '', enviado: false },
  };
}

// ── Estado inicial do GRUPO (dados agregados) ─────────────────
function _mtInitGrupo() {
  return {
    // Tabela comparativa 2025 vs 2026
    comp2025: Array(12).fill(null).map(function() { return { qtde: 0, valor: 0 }; }),
    comp2026: Array(12).fill(null).map(function() { return { qtde: 0, valor: 0, orcado: 0 }; }),
    // Causa raiz acumulado anual: [{descricao, qtde, pct}]
    causa_raiz: [],
    // Dias ofensores: [{dia, criticidade, qtde, pct, horas}]
    dias_ofensores: [],
    // Endereços acumulado: [{endereco, qtde}]
    enderecos_acum: [],
    // Endereços do mês: [{endereco, qtde}]
    enderecos_mes: [],
    // Excesso de velocidade: qtde_total, vel20_qtde, vel20_pct, vel50_qtde, vel50_pct
    vel_total: 0, vel20_qtde: 0, vel20_pct: 0, vel50_qtde: 0, vel50_pct: 0, vel50mais_qtde: 0, vel50mais_pct: 0,
    // Por empresa (velocidade): [{empId, qtde}]
    vel_por_empresa: [], // [{empId, qtde, qtdeMes}]
    // Locais velocidade: [{endereco, qtde}]
    vel_locais: [],
    // Evolução UTP Grupo (soma das empresas): arrays 12
    utp_valores:  Array(12).fill(0),
    utp_qtde:     Array(12).fill(0),
    utp_orcado:   Array(12).fill(0),
    utp_acum:     0,
    utp_qtde_acum: 0,
    utp_orcado_acum: 0,
  };
}

function _mtInitState() {
  var dados = { grupo: _mtInitGrupo() };
  MT_EMPRESAS_DETALHE.forEach(function(id) { dados[id] = _mtInitEmpresa(); });
  return {
    step:     1,
    mes:      _prevIdx,        // 0-based
    ano:      _prevAno,
    analista: (typeof state !== 'undefined' ? state.analista : '') || '',
    tabAtiva: 'grupo',
    slideIdx: 0,
    slides:   [],
    dados:    dados,
    _fbNotif: null,
  };
}

// ── Lista de slides ───────────────────────────────────────────
function _mtBuildSlides() {
  var slides = [
    { type: 'capa' },
    { type: 'acomp-utp' },
    { type: 'causa-raiz' },
    { type: 'enderecos' },
    { type: 'custos-empresa' },
    { type: 'evolucao-grupo' },
    { type: 'vel-grupo' },
  ];
  MT_EMPRESAS_DETALHE.forEach(function(id) {
    slides.push({ type: 'evolucao-emp', emp: id });
    slides.push({ type: 'mes-emp',      emp: id });
    slides.push({ type: 'plano',        emp: id });
  });
  slides.push({ type: 'contra-capa' });
  return slides;
}

// ── Ponto de entrada ──────────────────────────────────────────
function startMultasTransito() {
  mtState = _mtInitState();
  mtState.slides = _mtBuildSlides();
  _mtRender();
}

// ── Render principal ──────────────────────────────────────────
function _mtRender() {
  var app = document.getElementById('app');
  _mtDestroyAllCharts();
  if (mtState.step === 1) { app.innerHTML = _mtStep1HTML(); return; }
  if (mtState.step === 2) {
    app.innerHTML = _mtStep2HTML();
    _mtRenderStep2Panel();
    return;
  }
  if (mtState.step === 3) {
    app.innerHTML = _mtStep3HTML();
    _mtRenderCurrentSlide();
    return;
  }
}

// ═══════════════════════════════════════════════
// STEP 1 — Seleção de período
// ═══════════════════════════════════════════════
function _mtStep1HTML() {
  var mesOpts = MESES_FULL.map(function(m, i) {
    return '<option value="' + i + '"' + (i === mtState.mes ? ' selected' : '') + '>' + m + '</option>';
  }).join('');
  var anoOpts = ANOS.map(function(a) {
    return '<option value="' + a + '"' + (a === mtState.ano ? ' selected' : '') + '>' + a + '</option>';
  }).join('');

  return '<nav class="nav">'
    + '<div class="nav__left">'
    +   '<button class="btn btn--ghost" data-mt-action="go-home">&#8592; In&iacute;cio</button>'
    +   '<span class="nav__title">Multas de Tr&acirc;nsito</span>'
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
    +       '<h2 style="font-size:22px;font-weight:700;color:#1d3061;margin:0 0 4px">Multas de Tr&acirc;nsito</h2>'
    +       '<p style="font-size:13px;color:#999;margin:0">M&ecirc;s de refer&ecirc;ncia, ano e analista</p>'
    +     '</div>'
    +     '<div style="display:flex;flex-direction:column;gap:14px">'
    +       '<div>'
    +         '<label class="field-label">M&Ecirc;S</label>'
    +         '<select class="field-input" data-mt-root="mes">' + mesOpts + '</select>'
    +       '</div>'
    +       '<div>'
    +         '<label class="field-label">ANO</label>'
    +         '<select class="field-input" data-mt-root="ano">' + anoOpts + '</select>'
    +       '</div>'
    +       '<div>'
    +         '<label class="field-label">ANALISTA RESPONS&Aacute;VEL</label>'
    +         '<input class="field-input" type="text" placeholder="Ex: Kelvin Santos" value="' + (mtState.analista || '') + '" data-mt-root="analista">'
    +       '</div>'
    +     '</div>'
    +     '<button class="btn btn--primary" style="width:100%;padding:12px;font-size:15px" data-mt-action="go-step" data-mt-step="2">Pr&oacute;ximo &#8594;</button>'
    +   '</div>'
    + '</div>';
}

// ═══════════════════════════════════════════════
// STEP 2 — Preenchimento de dados
// ═══════════════════════════════════════════════
function _mtStep2HTML() {
  var mesLabel = MESES_FULL[mtState.mes] + '/' + mtState.ano;
  return '<nav class="nav">'
    + '<div class="nav__left">'
    +   '<button class="btn btn--ghost" data-mt-action="go-step" data-mt-step="1">&#8592; Voltar</button>'
    +   '<span class="nav__title">Multas de Tr&acirc;nsito</span>'
    +   '<span class="nav__period">' + MESES_FULL[mtState.mes] + '/' + mtState.ano + '</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:8px">'
    +   '<button class="btn btn--ghost" data-mt-action="mt-importar-sheets" style="padding:3px 12px;font-size:11px;background:rgba(255,255,255,.15)">&#128202; Importar Sheets</button>'
    +   '<button class="btn btn--ghost" data-mt-action="mt-importar-planos" style="padding:3px 12px;font-size:11px">&#128203; Importar Planos</button>'
    +   '<button class="btn btn--ghost" id="mt-btn-salvar" data-mt-action="mt-salvar-firebase" style="padding:3px 12px;font-size:11px;background:rgba(66,133,244,.25)">&#9729;&#65039; Salvar</button>'
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
    +       '<h3 style="font-size:19px;font-weight:700;color:#1d3061;margin:0 0 2px">Preenchimento de Dados</h3>'
    +       '<p style="font-size:12px;color:#888;margin:0">Preencha as informa&ccedil;&otilde;es de cada empresa</p>'
    +     '</div>'
    +     '<span style="background:var(--navy);color:#fff;font-weight:700;font-size:13px;padding:6px 14px;border-radius:8px">' + mesLabel + '</span>'
    +   '</div>'
    +   '<div id="mt-step2-content" style="flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column"></div>'
    +   '<div style="display:flex;justify-content:flex-end;padding-top:12px;margin-top:auto;flex-shrink:0;border-top:1px solid #eee">'
    +     '<button class="btn btn--primary" data-mt-action="go-step" data-mt-step="3">Visualizar Apresenta&ccedil;&atilde;o &#8594;</button>'
    +   '</div>'
    + '</div>';
}

function _mtRenderStep2Panel() {
  var container = document.getElementById('mt-step2-content');
  if (!container) return;

  // Preservar posição de scroll do painel esquerdo entre re-renders
  var prevLeft = document.getElementById('mt-left-panel');
  var prevScroll = prevLeft ? prevLeft.scrollTop : 0;

  // Tabs
  var tabs = ['grupo','1001','1001u','cat','com'].map(function(id) {
    var active = id === mtState.tabAtiva ? ' active' : '';
    var cls = 'mt-tab-btn';
    if (id !== 'grupo') cls += ' mt-tab-btn--' + id.replace('u','u');
    return '<button class="' + cls + active + '" data-mt-action="set-tab" data-mt-tab="' + id + '">' + MT_EMP_LABEL[id] + '</button>';
  }).join('');
  tabs += '<button class="mt-tab-btn' + (mtState.tabAtiva === 'plano' ? ' active' : '') + '" data-mt-action="set-tab" data-mt-tab="plano">&#128203; Plano de A&ccedil;&atilde;o</button>';

  // Painel esquerdo
  var leftPanel = '';
  if (mtState.tabAtiva === 'plano')      leftPanel = _mtPanelPlano();
  else if (mtState.tabAtiva === 'grupo') leftPanel = _mtPanelGrupo();
  else                                    leftPanel = _mtPanelEmpresa(mtState.tabAtiva);

  // Preview direito
  var rightPanel = _mtPreviewHTML(mtState.tabAtiva);

  container.innerHTML = '<div class="mt-tabs">' + tabs + '</div>'
    + '<div style="display:flex;gap:20px;flex:1;min-height:0;margin-top:8px;overflow:hidden">'
    +   '<div id="mt-left-panel" style="flex:0 0 55%;overflow-y:auto;min-width:0;padding-right:4px">' + leftPanel + '</div>'
    +   '<div style="flex:1;min-width:280px;background:#fff;border-radius:12px;padding:16px;border:1px solid #eee;display:flex;flex-direction:column;overflow-y:auto">'
    +     rightPanel
    +   '</div>'
    + '</div>';

  // Restaurar scroll (sem animação, após o DOM ser montado)
  var newLeft = document.getElementById('mt-left-panel');
  if (newLeft && prevScroll) newLeft.scrollTop = prevScroll;

  _mtBindStep2Events();
  setTimeout(function() { _mtUpdatePreviewChart(); _mtUpdateGrupoPreview(); }, 80);
}

// ── Painel Grupo ─────────────────────────────────────────────
function _mtPanelGrupo() {
  var d = mtState.dados.grupo;
  var mesAtual = mtState.mes;

  // Tabela comparativa 2025 vs 2026
  var compRows = MESES.map(function(m, i) {
    var c25 = d.comp2025[i] || { qtde: 0, valor: 0 };
    var c26 = d.comp2026[i] || { qtde: 0, valor: 0, orcado: 0 };
    var isCurrent = i <= mesAtual;
    return '<tr>'
      + '<td style="font-weight:700;font-size:11px;color:#555;padding:4px 6px">' + m + '</td>'
      + '<td><input type="number" step="1" value="' + (c25.qtde||'') + '" data-mt-grupo="comp2025" data-mt-gi="' + i + '" data-mt-gf="qtde" class="' + (i===mesAtual?'mes-atual':'') + '" style="width:70px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      + '<td><input type="text" value="' + _mtFmtInput(c25.valor) + '" data-mt-grupo="comp2025" data-mt-gi="' + i + '" data-mt-gf="valor" class="' + (i===mesAtual?'mes-atual':'') + '" style="width:90px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:right;font-family:inherit"></td>'
      + '<td><input type="number" step="1" value="' + (c26.qtde||'') + '" data-mt-grupo="comp2026" data-mt-gi="' + i + '" data-mt-gf="qtde" class="' + (i===mesAtual?'mes-atual':'') + '" style="width:70px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      + '<td><input type="text" value="' + _mtFmtInput(c26.valor) + '" data-mt-grupo="comp2026" data-mt-gi="' + i + '" data-mt-gf="valor" class="' + (i===mesAtual?'mes-atual':'') + '" style="width:90px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:right;font-family:inherit"></td>'
      + '<td><input type="text" value="' + _mtFmtInput(c26.orcado) + '" data-mt-grupo="comp2026" data-mt-gi="' + i + '" data-mt-gf="orcado" class="' + (i===mesAtual?'mes-atual':'') + '" style="width:90px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:right;font-family:inherit"></td>'
      + '</tr>';
  }).join('');

  // Causas raiz
  var causaRows = (d.causa_raiz || []).map(function(c, i) {
    return '<tr data-idx="' + i + '">'
      + '<td><input type="text" value="' + (c.descricao||'') + '" data-mt-causa-idx="' + i + '" data-mt-causa-f="descricao" placeholder="Descrição"></td>'
      + '<td><input type="number" step="1" value="' + (c.qtde||'') + '" data-mt-causa-idx="' + i + '" data-mt-causa-f="qtde" placeholder="0" style="text-align:center"></td>'
      + '<td><input type="text" value="' + (c.pct||'') + '" data-mt-causa-idx="' + i + '" data-mt-causa-f="pct" placeholder="49,3%" style="text-align:center"></td>'
      + '<td><button class="mt-btn-rm" data-mt-action="rm-causa" data-mt-idx="' + i + '">✕</button></td>'
      + '</tr>';
  }).join('');

  // Dias ofensores — com dropdowns estruturados
  var _DIAS_SEMANA = ['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'];
  var _HORAS_OPTS  = Array.from({length:23}, function(_,h) {
    var s = String(h).padStart(2,'0'), e = String(h+2).padStart(2,'0');
    return '<option value="' + s + '">' + s + 'h às ' + e + 'h</option>';
  }).join('');

  function _diaSelect(i, val) {
    return '<select data-mt-dia-idx="' + i + '" data-mt-dia-f="dia" style="border:1px solid #ddd;border-radius:4px;padding:4px 5px;font-size:12px;font-family:inherit;width:100%">'
      + '<option value="">Selecione...</option>'
      + _DIAS_SEMANA.map(function(d2){ return '<option value="' + d2 + '"' + (val===d2?' selected':'') + '>' + d2 + '</option>'; }).join('')
      + '</select>';
  }
  function _critiSelect(i, val) {
    return '<select data-mt-dia-idx="' + i + '" data-mt-dia-f="criticidade" style="border:1px solid #ddd;border-radius:4px;padding:4px 5px;font-size:12px;font-family:inherit;width:100%">'
      + ['Muito alto','Alto','Médio','Baixo'].map(function(c){ return '<option value="' + c + '"' + (val===c?' selected':'') + '>' + c + '</option>'; }).join('')
      + '</select>';
  }
  function _horaSelect(i, per, val) {
    return '<select data-mt-dia-idx="' + i + '" data-mt-dia-f="' + per + 'hora">'
      + '<option value="">—</option>'
      + _HORAS_OPTS.replace('value="' + val + '"', 'value="' + val + '" selected')
      + '</select>';
  }

  var diasRows = (d.dias_ofensores || []).map(function(d2, i) {
    return '<tr>'
      + '<td>' + _diaSelect(i, d2.dia||'') + '</td>'
      + '<td>' + _critiSelect(i, d2.criticidade||'Alto') + '</td>'
      + '<td><input type="number" step="1" min="0" value="' + (d2.qtde||'') + '" data-mt-dia-idx="' + i + '" data-mt-dia-f="qtde" placeholder="514" style="text-align:center"></td>'
      + '<td><input type="text" readonly value="' + _mtDiaPctAuto(d, i) + '" id="mt-dia-pct-' + i + '" placeholder="—" style="text-align:center;background:#f4f6fb;color:#1d3061;font-weight:700;border:1px solid #e0e4ed;border-radius:4px;padding:5px 6px;width:100%;font-size:12px;font-family:inherit;cursor:default"></td>'
      + '<td><div class="periodo-wrap">'
      +   _horaSelect(i,'p1',d2.p1hora||'')
      +   '<input type="number" min="0" value="' + (d2.p1qtde||'') + '" data-mt-dia-idx="' + i + '" data-mt-dia-f="p1qtde" placeholder="73" style="width:52px">'
      + '</div></td>'
      + '<td><div class="periodo-wrap">'
      +   _horaSelect(i,'p2',d2.p2hora||'')
      +   '<input type="number" min="0" value="' + (d2.p2qtde||'') + '" data-mt-dia-idx="' + i + '" data-mt-dia-f="p2qtde" placeholder="56" style="width:52px">'
      + '</div></td>'
      + '<td><button class="mt-btn-rm" data-mt-action="rm-dia" data-mt-idx="' + i + '">✕</button></td>'
      + '</tr>';
  }).join('');

  // Endereços
  function endListHTML(arr, prefix) {
    return (arr || []).map(function(e2, i) {
      return '<tr>'
        + '<td><input type="text" value="' + (e2.endereco||'') + '" data-mt-end-prefix="' + prefix + '" data-mt-end-idx="' + i + '" data-mt-end-f="endereco" placeholder="BR 101 KM 321..."></td>'
        + '<td><input type="number" step="1" value="' + (e2.qtde||'') + '" data-mt-end-prefix="' + prefix + '" data-mt-end-idx="' + i + '" data-mt-end-f="qtde" style="text-align:center"></td>'
        + '<td><button class="mt-btn-rm" data-mt-action="rm-end" data-mt-end-prefix="' + prefix + '" data-mt-idx="' + i + '">✕</button></td>'
        + '</tr>';
    }).join('');
  }

  // Velocidade por empresa
  var mesFechLabel = MESES_FULL[mtState.mes] || '';
  var velEmpRows = MT_EMPRESAS_DETALHE.map(function(id) {
    var v = (d.vel_por_empresa || []).find(function(x){ return x.empId===id; }) || { empId: id, qtde: 0, qtdeMes: 0 };
    return '<tr>'
      + '<td style="padding:5px 8px;width:120px"><img src="' + MT_LOGOS[id] + '" style="max-height:24px;max-width:100px;object-fit:contain" alt="' + MT_EMP_LABEL[id] + '"></td>'
      + '<td><input type="number" step="1" value="' + (v.qtde||'') + '" data-mt-vel-emp="' + id + '" style="width:80px;border:1px solid #ddd;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit;text-align:center"></td>'
      + '<td><input type="number" step="1" value="' + (v.qtdeMes||'') + '" data-mt-vel-emp-mes="' + id + '" style="width:80px;border:1px solid #ddd;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit;text-align:center"></td>'
      + '</tr>';
  }).join('');

  return '<div class="mt-secao-titulo">Acompanhamento UTP — Comparativo 2025 vs 2026</div>'
    + '<div style="overflow-x:auto;margin-bottom:12px">'
    + '<table style="border-collapse:collapse;font-size:11px;width:100%">'
    + '<thead><tr style="background:#f0f3fb">'
    +   '<th style="padding:6px 8px;text-align:left;font-size:10px;color:#888">MÊS</th>'
    +   '<th colspan="2" style="padding:6px 8px;text-align:center;font-size:10px;color:#888;background:#e8e8e8">2025</th>'
    +   '<th colspan="3" style="padding:6px 8px;text-align:center;font-size:10px;color:#888">2026</th>'
    + '</tr>'
    + '<tr style="background:#f0f3fb">'
    +   '<th style="padding:4px 6px"></th>'
    +   '<th style="padding:4px 6px;font-size:9px;color:#888;background:#e8e8e8">QTDE</th>'
    +   '<th style="padding:4px 6px;font-size:9px;color:#888;background:#e8e8e8">VALOR</th>'
    +   '<th style="padding:4px 6px;font-size:9px;color:#888">QTDE</th>'
    +   '<th style="padding:4px 6px;font-size:9px;color:#888">VALOR</th>'
    +   '<th style="padding:4px 6px;font-size:9px;color:#888">ORÇADO</th>'
    + '</tr></thead>'
    + '<tbody>' + compRows + '</tbody>'
    + '</table></div>'

    + '<div class="mt-secao-titulo" style="display:flex;align-items:center;justify-content:space-between">Causa Raiz — Acumulado Anual<button class="mt-btn-add" data-mt-action="mt-colar-causa" style="font-size:11px;padding:4px 10px;background:#f0f3fb;border-color:#c0c8d8;color:#1d3061">&#128203; Colar do Power BI</button></div>'
    + '<table class="mt-form-table causa">'
    + '<colgroup><col><col class="col-qtde"><col class="col-pct"><col class="col-rm"></colgroup>'
    + '<thead><tr><th>Causa</th><th class="th-center">Qtde</th><th class="th-center">%</th><th></th></tr></thead>'
    + '<tbody id="mt-causa-tbody">' + causaRows + '</tbody>'
    + '</table>'
    + '<button class="mt-btn-add" data-mt-action="add-causa">+ Causa</button>'

    + '<div class="mt-secao-titulo" style="display:flex;align-items:center;justify-content:space-between">Dias Ofensores<button class="mt-btn-add" data-mt-action="mt-colar-dias" style="font-size:11px;padding:4px 10px;background:#f0f3fb;border-color:#c0c8d8;color:#1d3061">&#128203; Colar do Power BI</button></div>'
    + '<table class="mt-form-table dias">'
    + '<colgroup><col class="col-dia"><col class="col-crit"><col class="col-qtde"><col class="col-pct-dia"><col class="col-p1"><col class="col-p2"><col class="col-rm"></colgroup>'
    + '<thead><tr><th class="col-dia">Dia</th><th class="col-crit">Criticidade</th><th class="th-center">Qtde</th><th class="th-center">%</th><th class="th-center">Período 1</th><th class="th-center">Período 2</th><th></th></tr></thead>'
    + '<tbody id="mt-dias-tbody">' + diasRows + '</tbody>'
    + '</table>'
    + '<button class="mt-btn-add" data-mt-action="add-dia">+ Dia</button>'

    + '<div class="mt-secao-titulo" style="display:flex;align-items:center;justify-content:space-between">Endereços — Acumulado Anual<button class="mt-btn-add" data-mt-action="mt-colar-end-acum" style="font-size:11px;padding:4px 10px;background:#f0f3fb;border-color:#c0c8d8;color:#1d3061">&#128203; Colar do Power BI</button></div>'
    + '<table class="mt-form-table end">'
    + '<colgroup><col><col class="col-qtde"><col class="col-rm"></colgroup>'
    + '<thead><tr><th>Endereço</th><th class="th-center">Qtde</th><th></th></tr></thead>'
    + '<tbody id="mt-end-acum-tbody">' + endListHTML(d.enderecos_acum, 'acum') + '</tbody>'
    + '</table>'
    + '<button class="mt-btn-add" data-mt-action="add-end-acum">+ Endereço</button>'

    + '<div class="mt-secao-titulo" style="display:flex;align-items:center;justify-content:space-between">Endereços — ' + MESES_FULL[mtState.mes] + '<button class="mt-btn-add" data-mt-action="mt-colar-end-mes" style="font-size:11px;padding:4px 10px;background:#f0f3fb;border-color:#c0c8d8;color:#1d3061">&#128203; Colar do Power BI</button></div>'
    + '<table class="mt-form-table end">'
    + '<colgroup><col><col class="col-qtde"><col class="col-rm"></colgroup>'
    + '<thead><tr><th>Endereço</th><th class="th-center">Qtde</th><th></th></tr></thead>'
    + '<tbody id="mt-end-mes-tbody">' + endListHTML(d.enderecos_mes, 'mes') + '</tbody>'
    + '</table>'
    + '<button class="mt-btn-add" data-mt-action="add-end-mes">+ Endereço</button>'

    + '<div class="mt-secao-titulo">Excesso de Velocidade — Acumulado Anual</div>'
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px">'
    +   _mtInputBox('Total velocidade', d.vel_total||'', 'mt-vel-f', 'vel_total', 'number')
    +   _mtInputBox('Vel. 20% — Qtde', d.vel20_qtde||'', 'mt-vel-f', 'vel20_qtde', 'number')
    +   _mtInputBox('Vel. 20% — %', d.vel20_pct||'', 'mt-vel-f', 'vel20_pct', 'text', '97%')
    +   _mtInputBox('Vel. até 50% — Qtde', d.vel50_qtde||'', 'mt-vel-f', 'vel50_qtde', 'number')
    +   _mtInputBox('Vel. até 50% — %', d.vel50_pct||'', 'mt-vel-f', 'vel50_pct', 'text', '3%')
    +   _mtInputBox('Vel. +50% — Qtde', d.vel50mais_qtde||'', 'mt-vel-f', 'vel50mais_qtde', 'number')
    +   _mtInputBox('Vel. +50% — %', d.vel50mais_pct||'', 'mt-vel-f', 'vel50mais_pct', 'text', '1%')
    + '</div>'
    + '<div style="font-size:11px;font-weight:700;color:#888;margin-bottom:6px;text-transform:uppercase">Qtde por Empresa</div>'
    + '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:6px">'
    + '<thead><tr style="background:#f0f3fb"><th style="padding:5px 8px;font-size:10px;color:#888;text-align:left">EMPRESA</th><th style="padding:5px 8px;font-size:10px;color:#888;text-align:center">QTDE ANUAL</th><th style="padding:5px 8px;font-size:10px;color:#888;text-align:center">QTDE ' + mesFechLabel.toUpperCase() + '</th></tr></thead>'
    + '<tbody>' + velEmpRows + '</tbody></table>'

    + '<div style="font-size:11px;font-weight:700;color:#888;margin:10px 0 6px;text-transform:uppercase">Locais — Velocidade</div>'
    + '<table class="mt-form-table end">'
    + '<colgroup><col><col class="col-qtde"><col class="col-rm"></colgroup>'
    + '<thead><tr><th>Endereço</th><th class="th-center">Qtde</th><th></th></tr></thead>'
    + '<tbody id="mt-vel-locais-tbody">' + endListHTML(d.vel_locais, 'vel') + '</tbody>'
    + '</table>'
    + '<button class="mt-btn-add" data-mt-action="add-vel-local">+ Local</button>';
}

function _mtInputBox(lbl, val, dataAttr, field, type, placeholder) {
  return '<div><label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">' + lbl + '</label>'
    + '<input type="' + (type||'text') + '" step="any" value="' + (val||'') + '" data-' + dataAttr + '="' + field + '" placeholder="' + (placeholder||'0') + '"'
    + ' style="width:100%;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;font-family:inherit;box-sizing:border-box"></div>';
}

function _mtFmtInput(v) {
  if (!v) return '';
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Painel por empresa ────────────────────────────────────────
function _mtPanelEmpresa(empId) {
  var d = mtState.dados[empId] || {};
  var lbl = MT_EMP_LABEL[empId];
  var mesAtual = mtState.mes;

  var mesesRows = MESES.map(function(m, i) {
    var v = (d.utp_valores || [])[i] || 0;
    var q = (d.utp_qtde   || [])[i] || 0;
    var o = (d.utp_orcado || [])[i] || 0;
    return '<label>' + m
      + '<input type="text" value="' + (v?_mtFmtInput(v):'') + '" data-mt-emp="' + empId + '" data-mt-campo="utp_valores" data-mt-mes="' + i + '" class="' + (i===mesAtual?'mes-atual':'') + '">'
      + '</label>';
  }).join('');
  var qtdeRows = MESES.map(function(m, i) {
    var q = (d.utp_qtde || [])[i] || 0;
    return '<label>' + m
      + '<input type="number" step="1" value="' + (q||'') + '" data-mt-emp="' + empId + '" data-mt-campo="utp_qtde" data-mt-mes="' + i + '" class="' + (i===mesAtual?'mes-atual':'') + '">'
      + '</label>';
  }).join('');
  var orcRows = MESES.map(function(m, i) {
    var o = (d.utp_orcado || [])[i] || 0;
    return '<label>' + m
      + '<input type="text" value="' + (o?_mtFmtInput(o):'') + '" data-mt-emp="' + empId + '" data-mt-campo="utp_orcado" data-mt-mes="' + i + '" class="' + (i===mesAtual?'mes-atual':'') + '">'
      + '</label>';
  }).join('');

  // Motivos do mês
  var motivosRows = (d.motivos || []).map(function(m2, i) {
    return '<tr><td><input type="text" value="' + (m2.descricao||'') + '" data-mt-emp="' + empId + '" data-mt-motivo-idx="' + i + '" data-mt-motivo-f="descricao" placeholder="Ex: VELOCIDADE 20%" style="width:100%;border:1px solid #ddd;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit"></td>'
      + '<td><input type="number" step="1" value="' + (m2.qtde||'') + '" data-mt-emp="' + empId + '" data-mt-motivo-idx="' + i + '" data-mt-motivo-f="qtde" style="width:70px;border:1px solid #ddd;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit;text-align:center"></td>'
      + '<td><button class="mt-btn-rm" data-mt-action="rm-motivo" data-mt-emp="' + empId + '" data-mt-idx="' + i + '">✕</button></td></tr>';
  }).join('');

  // Locais principais
  var locaisRows = (d.locais || []).map(function(l, i) {
    return '<tr><td><input type="text" value="' + (l.endereco||'') + '" data-mt-emp="' + empId + '" data-mt-local-idx="' + i + '" data-mt-local-f="endereco" placeholder="BR 101 KM 323..." style="width:100%;border:1px solid #ddd;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit"></td>'
      + '<td><input type="number" step="1" value="' + (l.qtde||'') + '" data-mt-emp="' + empId + '" data-mt-local-idx="' + i + '" data-mt-local-f="qtde" style="width:70px;border:1px solid #ddd;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit;text-align:center"></td>'
      + '<td><button class="mt-btn-rm" data-mt-action="rm-local" data-mt-emp="' + empId + '" data-mt-idx="' + i + '">✕</button></td></tr>';
  }).join('');

  // UTP Custo
  var custo = d.utp_custo || {};

  return '<div class="mt-secao-titulo">Evolução UTP — ' + lbl + '</div>'
    + '<div class="mt-totais-row">'
    +   '<div class="mt-total-box"><div class="lbl">Acumulado (R$)</div><div class="val" id="mt-acum-' + empId + '">' + _mtFmtMoeda(d.utp_acum||0) + '</div></div>'
    +   '<div class="mt-total-box"><div class="lbl">Qtde acumulada</div><div class="val" id="mt-qtde-acum-' + empId + '">' + (d.utp_qtde_acum||0) + '</div></div>'
    +   '<div class="mt-total-box"><div class="lbl">Orçado acumulado</div><div class="val" id="mt-orc-acum-' + empId + '">' + _mtFmtMoeda(d.utp_orcado_acum||0) + '</div></div>'
    + '</div>'
    + '<div style="font-size:11px;font-weight:700;color:#888;margin-bottom:4px;text-transform:uppercase">Valores por mês (R$)</div>'
    + '<div class="mt-meses-grid">' + mesesRows + '</div>'
    + '<div style="font-size:11px;font-weight:700;color:#888;margin:6px 0 4px;text-transform:uppercase">Quantidade por mês</div>'
    + '<div class="mt-meses-grid">' + qtdeRows + '</div>'
    + '<div style="font-size:11px;font-weight:700;color:#888;margin:6px 0 4px;text-transform:uppercase">Orçado por mês (R$)</div>'
    + '<div class="mt-meses-grid">' + orcRows + '</div>'

    + '<div class="mt-secao-titulo" style="background:#fdf0f0;padding:8px 10px;border-radius:6px;border-bottom:2px solid #c0392b;color:#c0392b">&#128176; Custos UTP (alimenta o slide "Custos por Empresa") — ' + MESES_FULL[mtState.mes] + '/' + mtState.ano + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px">'
    +   _mtInputBox('Multas Recebidas (R$)', d.multas_recebidas_val||'', 'mt-emp-f', 'multas_recebidas_val', 'text', '0')
    +   _mtInputBox('Multas Recebidas (Qtde)', d.multas_recebidas_qtde||'', 'mt-emp-f', 'multas_recebidas_qtde', 'number')
    +   _mtInputBox('NICs Recebidas (R$)', d.nics_val||'', 'mt-emp-f', 'nics_val', 'text', '0')
    +   _mtInputBox('NICs Recebidas (Qtde)', d.nics_qtde||'', 'mt-emp-f', 'nics_qtde', 'number')
    + '</div>'

    + '<div style="font-size:11px;font-weight:700;color:#c0392b;margin-bottom:4px;text-transform:uppercase">&#9656; Análise Consolidada de Custos (vai para a tabela "Custos por Empresa")</div>'
    + '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px;background:#fdf5f5;padding:10px;border-radius:8px;border:1px dashed #e8b4b4">'
    +   _mtInputBox('Valor Total Multas', custo.valor_total||'', 'mt-custo-f', 'valor_total', 'text', '0')
    +   _mtInputBox('Ressarcimento', custo.ressarcimento||'', 'mt-custo-f', 'ressarcimento', 'text', '0')
    +   _mtInputBox('Custo Empresa', custo.custo_empresa||'', 'mt-custo-f', 'custo_empresa', 'text', '0')
    +   _mtInputBox('Valor em Aberto', custo.em_aberto||'', 'mt-custo-f', 'em_aberto', 'text', '0')
    + '</div>'

    + '<div class="mt-secao-titulo" style="display:flex;align-items:center;justify-content:space-between">Principais Motivos — ' + MESES_FULL[mtState.mes] + '<button class="mt-btn-add" data-mt-action="mt-colar-motivos" data-mt-emp="' + empId + '" style="font-size:11px;padding:4px 10px;background:#f0f3fb;border-color:#c0c8d8;color:#1d3061">&#128203; Colar do Power BI</button></div>'
    + '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:6px">'
    + '<thead><tr style="background:#f0f3fb"><th style="padding:6px 8px;text-align:left;font-size:10px;color:#888">MOTIVO</th><th style="padding:6px 8px;font-size:10px;color:#888;text-align:center">QTDE</th><th></th></tr></thead>'
    + '<tbody id="mt-motivos-tbody-' + empId + '">' + motivosRows + '</tbody></table>'
    + '<button class="mt-btn-add" data-mt-action="add-motivo" data-mt-emp="' + empId + '">+ Motivo</button>'

    + '<div class="mt-secao-titulo" style="display:flex;align-items:center;justify-content:space-between">Principais Locais — ' + MESES_FULL[mtState.mes] + '<button class="mt-btn-add" data-mt-action="mt-colar-locais" data-mt-emp="' + empId + '" style="font-size:11px;padding:4px 10px;background:#f0f3fb;border-color:#c0c8d8;color:#1d3061">&#128203; Colar do Power BI</button></div>'
    + '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:6px">'
    + '<thead><tr style="background:#f0f3fb"><th style="padding:6px 8px;text-align:left;font-size:10px;color:#888">ENDEREÇO</th><th style="padding:6px 8px;font-size:10px;color:#888;text-align:center">QTDE</th><th></th></tr></thead>'
    + '<tbody id="mt-locais-tbody-' + empId + '">' + locaisRows + '</tbody></table>'
    + '<button class="mt-btn-add" data-mt-action="add-local" data-mt-emp="' + empId + '">+ Local</button>';
}

// ── Painel Plano de Ação ──────────────────────────────────────
function _mtPanelPlano() {
  var cards = MT_EMPRESAS_DETALHE.map(function(empId) {
    var d  = mtState.dados[empId] || {};
    var p  = d.planoAcao || {};
    var cor = MT_BAR_COLORS[empId];
    var motivos = (d.motivos || []).filter(function(m) { return m.descricao; });

    var motivosHTML = motivos.length
      ? motivos.map(function(m) {
          return '<div style="display:flex;align-items:baseline;gap:8px;padding:3px 0;border-bottom:1px solid #eee;font-size:12px">'
            + '<span style="background:var(--navy);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;flex-shrink:0">' + (parseInt(m.qtde)||0) + '</span>'
            + '<span style="flex:1">' + m.descricao + '</span>'
            + '</div>';
        }).join('')
      : '<div style="font-size:11px;color:#bbb;font-style:italic">Sem motivos registrados</div>';

    var fbStatus = p.resposta
      ? '<span style="font-size:11px;color:#27ae60;font-weight:600">✓ Resposta recebida</span>'
      : p.enviado
        ? '<span style="font-size:11px;color:#f39c12;font-weight:600">⏳ Aguardando resposta</span>'
        : '<span style="font-size:11px;color:#aaa">Aguardando envio</span>';

    return '<div class="mt-plano-card">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid ' + cor + ';padding-bottom:8px;margin-bottom:10px">'
      +   '<img src="' + MT_LOGOS[empId] + '" style="height:24px;object-fit:contain" alt="">'
      +   '<button onclick="mtCopiarLinkPlano(\'' + empId + '\')" style="font-size:11px;padding:3px 10px;border-radius:6px;border:1px solid ' + cor + ';background:#fff;cursor:pointer;color:#555">🔗 Copiar link</button>'
      + '</div>'
      + '<div style="background:#f8f8f8;border:1px solid #eee;border-radius:6px;padding:8px 10px;margin-bottom:10px">'
      +   '<div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:6px">Motivos do mês</div>'
      +   motivosHTML
      + '</div>'
      + '<div class="mt-plano-field">'
      +   '<label>Plano de Ação <span style="color:#aaa;font-weight:400;font-size:11px">(preenchido pela empresa)</span></label>'
      +   '<textarea id="mt-plano-txt-' + empId + '" placeholder="Ações da empresa...">' + (p.resposta || p.texto || '') + '</textarea>'
      + '</div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">'
      +   fbStatus
      + '</div>'
      + '</div>';
  }).join('');

  return '<div class="mt-secao-titulo">Plano de Ação por Empresa</div>'
    + '<div style="margin-bottom:12px;display:flex;align-items:center;gap:10px">'
    +   '<button class="btn btn--secondary" data-mt-action="mt-importar-planos" style="font-size:12px;padding:5px 14px">&#128229; Importar Planos</button>'
    +   '<span style="font-size:11px;color:#888">Clique após as empresas responderem pelo link</span>'
    + '</div>'
    + cards;
}

// ── Preview coluna direita ────────────────────────────────────
function _mtPreviewHTML(tabAtiva) {
  if (tabAtiva === 'plano') {
    return '<div class="preview-hd">Plano de A&ccedil;&atilde;o</div>'
      + '<div class="preview-sub">Preencha os dados de cada empresa e compartilhe o link</div>';
  }
  if (tabAtiva === 'grupo') {
    return '<div class="preview-hd">Preview — Grupo JCA</div>'
      + '<div class="preview-sub">' + MESES_FULL[mtState.mes] + '/' + mtState.ano + '</div>'
      + '<div id="mt-grupo-preview" style="margin-top:10px;font-size:11px"></div>';
  }
  var d = mtState.dados[tabAtiva] || {};
  var qtdeAcum = (d.utp_qtde || []).reduce(function(a, b) { return a + (parseFloat(b)||0); }, 0);
  var custo = d.utp_custo || {};
  return '<div class="preview-hd">Preview — ' + MT_EMP_LABEL[tabAtiva] + '</div>'
    + '<div class="preview-sub">' + MESES_FULL[mtState.mes] + '/' + mtState.ano + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0 10px">'
    +   _mtKpiMini('Acumulado', _mtFmtMoeda(d.utp_acum||0), 'mt-pv-acum-' + tabAtiva)
    +   _mtKpiMini('Qtde Total', qtdeAcum, 'mt-pv-qtde-' + tabAtiva)
    +   _mtKpiMini('Orçado', _mtFmtMoeda(d.utp_orcado_acum||0), 'mt-pv-orc-' + tabAtiva)
    +   _mtKpiMini('Recebidas/' + MESES[mtState.mes], _mtFmtMoeda(d.multas_recebidas_val||0), 'mt-pv-rec-' + tabAtiva, '#c0392b')
    + '</div>'
    + '<div style="height:180px"><canvas id="mt-preview-chart"></canvas></div>'
    + '<div style="margin-top:12px;padding-top:10px;border-top:1px solid #eee">'
    +   '<div style="font-size:10px;font-weight:700;color:#c0392b;text-transform:uppercase;margin-bottom:6px">&#128176; Custos UTP — slide "Custos por Empresa"</div>'
    +   '<table style="width:100%;border-collapse:collapse;font-size:11px">'
    +     '<tr><td style="padding:3px 4px;color:#888">Valor Total Multas</td><td id="mt-pv-custo-vt-' + tabAtiva + '" style="padding:3px 4px;text-align:right;font-weight:700;color:#1d3061">' + (custo.valor_total ? _mtFmtMoeda(custo.valor_total) : '—') + '</td></tr>'
    +     '<tr><td style="padding:3px 4px;color:#888">Ressarcimento</td><td id="mt-pv-custo-rs-' + tabAtiva + '" style="padding:3px 4px;text-align:right;font-weight:700;color:#1d3061">' + (custo.ressarcimento ? _mtFmtMoeda(custo.ressarcimento) : '—') + '</td></tr>'
    +     '<tr><td style="padding:3px 4px;color:#888">Custo Empresa</td><td id="mt-pv-custo-ce-' + tabAtiva + '" style="padding:3px 4px;text-align:right;font-weight:700;color:#1d3061">' + (custo.custo_empresa ? _mtFmtMoeda(custo.custo_empresa) : '—') + '</td></tr>'
    +     '<tr><td style="padding:3px 4px;color:#888">Valor em Aberto</td><td id="mt-pv-custo-ea-' + tabAtiva + '" style="padding:3px 4px;text-align:right;font-weight:700;color:#1d3061">' + (custo.em_aberto ? _mtFmtMoeda(custo.em_aberto) : '—') + '</td></tr>'
    +   '</table>'
    +   (!custo.valor_total ? '<div style="font-size:10px;color:#e67e22;margin-top:6px;font-style:italic">&#9888;&#65039; Ainda não preenchido — role o painel à esquerda até "Análise Consolidada de Custos"</div>' : '')
    + '</div>';
}

function _mtUpdateGrupoPreview() {
  if (mtState.tabAtiva !== 'grupo') return;
  var el = document.getElementById('mt-grupo-preview');
  if (!el) return;
  var d = mtState.dados.grupo;

  function miniTable(title, rows, cols) {
    if (!rows.length) return '<div style="margin-bottom:14px"><div style="font-weight:700;color:#1d3061;font-size:11px;margin-bottom:4px">' + title + '</div><div style="color:#bbb;font-style:italic;font-size:11px">Sem dados ainda</div></div>';
    var head = '<tr>' + cols.map(function(c) { return '<th style="text-align:left;padding:3px 5px;font-size:9px;color:#888;border-bottom:1px solid #eee">' + c + '</th>'; }).join('') + '</tr>';
    var body = rows.map(function(r) {
      return '<tr>' + r.map(function(v) { return '<td style="padding:3px 5px;font-size:10px;color:#333;border-bottom:1px solid #f5f5f5">' + (v||'—') + '</td>'; }).join('') + '</tr>';
    }).join('');
    return '<div style="margin-bottom:14px">'
      + '<div style="font-weight:700;color:#1d3061;font-size:11px;margin-bottom:4px">' + title + '</div>'
      + '<table style="width:100%;border-collapse:collapse">' + head + body + '</table>'
      + '</div>';
  }

  // Comparativo (só mês atual e total)
  var mesAtual = mtState.mes;
  var c25 = d.comp2025[mesAtual] || {};
  var c26 = d.comp2026[mesAtual] || {};
  var compHTML = '<div style="margin-bottom:14px">'
    + '<div style="font-weight:700;color:#1d3061;font-size:11px;margin-bottom:4px">Comparativo — ' + MESES[mesAtual] + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'
    +   '<div style="border:1px solid #eee;border-radius:6px;padding:6px 8px"><div style="font-size:9px;color:#aaa">' + (mtState.ano-1) + '</div><div style="font-size:12px;font-weight:700;color:#1d3061">' + (c25.qtde||0) + ' &middot; ' + (c25.valor?_mtFmtMoeda(c25.valor):'—') + '</div></div>'
    +   '<div style="border:1px solid #eee;border-radius:6px;padding:6px 8px"><div style="font-size:9px;color:#aaa">' + mtState.ano + '</div><div style="font-size:12px;font-weight:700;color:#1d3061">' + (c26.qtde||0) + ' &middot; ' + (c26.valor?_mtFmtMoeda(c26.valor):'—') + '</div></div>'
    + '</div></div>';

  var causaRows = (d.causa_raiz||[]).filter(function(c){return c.descricao;}).map(function(c){ return [c.descricao, (c.qtde||0)+(c.pct?' ('+c.pct+')':'')]; });
  var diasRows  = (d.dias_ofensores||[]).filter(function(x){return x.dia;}).map(function(x){
    function fp(hora, qtde) {
      if (!hora) return '';
      return hora + 'h às ' + String(parseInt(hora)+2).padStart(2,'0') + 'h' + (qtde?' ('+qtde+')':'');
    }
    var horas = [fp(x.p1hora,x.p1qtde), fp(x.p2hora,x.p2qtde)].filter(Boolean).join(' e ');
    return [x.dia, x.criticidade, x.qtde, horas];
  });
  var endAcumRows = (d.enderecos_acum||[]).filter(function(x){return x.endereco;}).map(function(x){ return [x.endereco, x.qtde]; });
  var endMesRows  = (d.enderecos_mes||[]).filter(function(x){return x.endereco;}).map(function(x){ return [x.endereco, x.qtde]; });
  var velRows = MT_EMPRESAS_DETALHE.map(function(id) {
    var v = (d.vel_por_empresa||[]).find(function(x){return x.empId===id;});
    return [MT_EMP_LABEL[id], v ? v.qtde : 0];
  });

  el.innerHTML = compHTML
    + miniTable('Causa Raiz', causaRows, ['Causa','Qtde'])
    + miniTable('Dias Ofensores', diasRows, ['Dia','Criticidade','Qtde','Horas'])
    + miniTable('Endereços — Acumulado', endAcumRows, ['Endereço','Qtde'])
    + miniTable('Endereços — ' + MESES_FULL[mtState.mes], endMesRows, ['Endereço','Qtde'])
    + miniTable('Velocidade por Empresa', velRows, ['Empresa','Qtde'])
    + '<div style="margin-top:10px;padding-top:10px;border-top:1px solid #eee;font-size:10px;color:#aaa">'
    +   'Velocidade total: <b style="color:#1d3061">' + (d.vel_total||'—') + '</b> &middot; '
    +   'Custo Grupo (auto): <b style="color:#1d3061">' + _mtFmtMoeda(_mtSomaCustoEmpresas('valor_total')) + '</b>'
    + '</div>';
}

function _mtUpdateCustoPreview(empId) {
  var d = mtState.dados[empId] || {};
  var custo = d.utp_custo || {};
  var map = { vt: 'valor_total', rs: 'ressarcimento', ce: 'custo_empresa', ea: 'em_aberto' };
  Object.keys(map).forEach(function(short) {
    var el = document.getElementById('mt-pv-custo-' + short + '-' + empId);
    if (el) el.textContent = custo[map[short]] ? _mtFmtMoeda(custo[map[short]]) : '—';
  });
}

function _mtKpiMini(lbl, val, id, cor) {
  return '<div style="border:1px solid #e8e8e8;border-radius:6px;padding:6px 8px">'
    + '<div style="font-size:9px;color:#aaa;font-weight:600;margin-bottom:2px">' + lbl + '</div>'
    + '<div id="' + id + '" style="font-size:12px;font-weight:700;color:' + (cor||'#1d3061') + '">' + val + '</div>'
    + '</div>';
}

var _mtPreviewChart = null;
function _mtUpdatePreviewChart() {
  if (mtState.tabAtiva === 'plano' || mtState.tabAtiva === 'grupo') return;
  var d       = mtState.dados[mtState.tabAtiva] || {};
  var ate     = mtState.mes + 1;
  var labels  = MESES.slice(0, ate);
  var vals    = (d.utp_valores || Array(12).fill(0)).slice(0, ate);
  var qtdes   = (d.utp_qtde   || Array(12).fill(0)).slice(0, ate);
  var orcs    = (d.utp_orcado || Array(12).fill(0)).slice(0, ate);
  var barColor = MT_BAR_COLORS[mtState.tabAtiva] || 'rgba(236,152,152,.85)';

  if (_mtPreviewChart) { _mtPreviewChart.destroy(); _mtPreviewChart = null; }
  var canvas = document.getElementById('mt-preview-chart');
  if (!canvas) return;

  var datasets = [
    {
      type: 'bar', label: 'Qtde Multas',
      data: qtdes,
      backgroundColor: barColor,
      borderWidth: 0, barPercentage: 0.6, yAxisID: 'yRight',
      datalabels: {
        display: true, anchor: 'center', align: 'center',
        color: '#333', font: { size: 9, weight: 'bold' },
        formatter: function(v) { return v > 0 ? v : null; }
      }
    },
    {
      type: 'line', label: 'Valor (R$)',
      data: vals,
      borderColor: '#c0392b', backgroundColor: '#c0392b',
      pointRadius: 3, borderWidth: 2, tension: 0, yAxisID: 'yLeft',
      pointStyle: 'circle', pointBackgroundColor: '#c0392b',
      datalabels: {
        display: true, anchor: 'end', offset: 4, clip: false,
        color: '#c0392b', font: { size: 8, weight: 'bold' },
        // Se valor > orçado: fica acima do ponto; senão, abaixo.
        align: function(ctx) {
          var i = ctx.dataIndex;
          var o = orcs[i];
          return (o && vals[i] > o) ? 'top' : 'bottom';
        },
        formatter: function(v) { return v > 0 ? _mtFmtMoeda(v) : null; }
      }
    }
  ];
  if (orcs.some(function(v) { return v > 0; })) {
    datasets.push({
      type: 'line', label: 'Orçado',
      data: orcs,
      borderColor: '#1d3061', backgroundColor: '#1d3061',
      pointRadius: 3, borderWidth: 2, tension: 0, yAxisID: 'yLeft',
      pointStyle: 'circle',
      datalabels: {
        display: true, anchor: 'end', offset: 4, clip: false,
        color: '#1d3061', font: { size: 8, weight: 'bold' },
        // Se orçado >= valor: fica acima do ponto; senão, abaixo.
        align: function(ctx) {
          var i = ctx.dataIndex;
          var v = vals[i];
          return (!v || orcs[i] >= v) ? 'top' : 'bottom';
        },
        formatter: function(v) { return v > 0 ? _mtFmtMoeda(v) : null; }
      }
    });
  }

  var maxQtde  = Math.max.apply(null, qtdes.concat([1]));
  var maxValor = Math.max.apply(null, vals.concat(orcs).concat([1]));

  _mtPreviewChart = new Chart(canvas, {
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      layout: { padding: { top: 26 } },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 5, boxHeight: 5, font: { size: 9 }, usePointStyle: true, pointStyle: 'circle' } },
        datalabels: { clip: false }
      },
      scales: {
        // yRight (barras de Qtde): barras ocupam só a parte inferior do gráfico
        yRight: { display: false, min: 0, max: maxQtde * 2.6 },
        // yLeft (linhas de Valor/Orçado): min negativo "empurra" as linhas
        // para a faixa superior do gráfico, sempre acima das barras
        yLeft:  { display: false, min: -maxValor * 2.4, max: maxValor * 1.25 },
        x: { grid: { display: false }, ticks: { font: { size: 9 } } }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// ── Bind de eventos do Step 2 ─────────────────────────────────
function _mtBindStep2Events() {
  // Inputs de comparativo grupo
  document.querySelectorAll('[data-mt-grupo]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var grupo  = this.dataset.mtGrupo;
      var i      = parseInt(this.dataset.mtGi);
      var field  = this.dataset.mtGf;
      if (!mtState.dados.grupo[grupo][i]) mtState.dados.grupo[grupo][i] = {};
      mtState.dados.grupo[grupo][i][field] = field === 'qtde' ? parseInt(this.value)||0 : parseN(this.value);
      _mtUpdateGrupoPreview();
    });
  });

  // Causa raiz
  document.querySelectorAll('[data-mt-causa-idx]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var i = parseInt(this.dataset.mtCausaIdx);
      var f = this.dataset.mtCausaF;
      if (!mtState.dados.grupo.causa_raiz[i]) mtState.dados.grupo.causa_raiz[i] = {};
      mtState.dados.grupo.causa_raiz[i][f] = f === 'qtde' ? parseInt(this.value)||0 : this.value;
      _mtUpdateGrupoPreview();
    });
  });

  // Dias ofensores
  document.querySelectorAll('[data-mt-dia-idx]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var i = parseInt(this.dataset.mtDiaIdx);
      var f = this.dataset.mtDiaF;
      if (!mtState.dados.grupo.dias_ofensores[i]) mtState.dados.grupo.dias_ofensores[i] = {};
      mtState.dados.grupo.dias_ofensores[i][f] = this.value;
      if (f === 'qtde') {
        mtState.dados.grupo.dias_ofensores.forEach(function(_, j) {
          var el = document.getElementById('mt-dia-pct-' + j);
          if (el) el.value = _mtDiaPctAuto(mtState.dados.grupo, j);
        });
      }
      _mtUpdateGrupoPreview();
    });
    inp.addEventListener('change', function() {
      var i = parseInt(this.dataset.mtDiaIdx);
      var f = this.dataset.mtDiaF;
      if (!mtState.dados.grupo.dias_ofensores[i]) mtState.dados.grupo.dias_ofensores[i] = {};
      mtState.dados.grupo.dias_ofensores[i][f] = this.value;
      if (f === 'qtde') {
        mtState.dados.grupo.dias_ofensores.forEach(function(_, j) {
          var el = document.getElementById('mt-dia-pct-' + j);
          if (el) el.value = _mtDiaPctAuto(mtState.dados.grupo, j);
        });
      }
      _mtUpdateGrupoPreview();
    });
  });

  // Endereços
  document.querySelectorAll('[data-mt-end-prefix]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var prefix = this.dataset.mtEndPrefix;
      var i = parseInt(this.dataset.mtEndIdx);
      var f = this.dataset.mtEndF;
      var arr = prefix === 'acum' ? mtState.dados.grupo.enderecos_acum
              : prefix === 'mes'  ? mtState.dados.grupo.enderecos_mes
              :                     mtState.dados.grupo.vel_locais;
      if (!arr[i]) arr[i] = {};
      arr[i][f] = f === 'qtde' ? parseInt(this.value)||0 : this.value;
      _mtUpdateGrupoPreview();
    });
  });

  // Velocidade grupo
  document.querySelectorAll('[data-mt-vel-f]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var f = this.dataset.mtVelF;
      mtState.dados.grupo[f] = parseFloat(this.value) || this.value;
      _mtUpdateGrupoPreview();
    });
  });
  document.querySelectorAll('[data-mt-vel-emp]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var empId = this.dataset.mtVelEmp;
      var arr = mtState.dados.grupo.vel_por_empresa;
      var idx = arr.findIndex(function(x) { return x.empId === empId; });
      if (idx < 0) { arr.push({ empId: empId, qtde: 0, qtdeMes: 0 }); idx = arr.length - 1; }
      arr[idx].qtde = parseInt(this.value) || 0;
      _mtUpdateGrupoPreview();
    });
  });

  document.querySelectorAll('[data-mt-vel-emp-mes]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var empId = this.dataset.mtVelEmpMes;
      var arr = mtState.dados.grupo.vel_por_empresa;
      var idx = arr.findIndex(function(x) { return x.empId === empId; });
      if (idx < 0) { arr.push({ empId: empId, qtde: 0, qtdeMes: 0 }); idx = arr.length - 1; }
      arr[idx].qtdeMes = parseInt(this.value) || 0;
      _mtUpdateGrupoPreview();
    });
  });

  // Empresa meses
  document.querySelectorAll('[data-mt-emp][data-mt-campo][data-mt-mes]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var empId = this.dataset.mtEmp;
      var campo = this.dataset.mtCampo;
      var mes   = parseInt(this.dataset.mtMes);
      if (!mtState.dados[empId]) return;
      mtState.dados[empId][campo][mes] = campo === 'utp_qtde' ? parseInt(this.value)||0 : parseN(this.value);
      _mtRecalcEmpresa(empId);
      _mtUpdatePreviewKpis(empId);
      _mtUpdatePreviewChart();
    });
  });

  // Empresa campos básicos
  document.querySelectorAll('[data-mt-emp-f]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var empId = mtState.tabAtiva;
      var f     = this.dataset.mtEmpF;
      if (!mtState.dados[empId]) return;
      mtState.dados[empId][f] = f.endsWith('_qtde') || f.endsWith('_qtde_acum') ? parseInt(this.value)||0 : parseN(this.value);
    });
  });

  // Custos empresa
  document.querySelectorAll('[data-mt-custo-f]').forEach(function(inp) {
    inp.addEventListener('focus', function() {
      var raw = parseN(this.value);
      this.value = raw > 0 ? String(raw) : '';
    });
    inp.addEventListener('blur', function() {
      var raw = parseN(this.value);
      this.value = raw > 0 ? raw.toLocaleString('pt-BR', { minimumFractionDigits: 0 }) : '';
    });
    inp.addEventListener('input', function() {
      var empId = mtState.tabAtiva;
      var f     = this.dataset.mtCustoF;
      if (!mtState.dados[empId]) return;
      if (!mtState.dados[empId].utp_custo) mtState.dados[empId].utp_custo = {};
      mtState.dados[empId].utp_custo[f] = parseN(this.value);
      _mtUpdateCustoPreview(empId);
    });
  });

  // Motivos empresa
  document.querySelectorAll('[data-mt-motivo-idx]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var empId = this.dataset.mtEmp;
      var i     = parseInt(this.dataset.mtMotivoIdx);
      var f     = this.dataset.mtMotivoF;
      if (!mtState.dados[empId].motivos[i]) mtState.dados[empId].motivos[i] = {};
      mtState.dados[empId].motivos[i][f] = f === 'qtde' ? parseInt(this.value)||0 : this.value;
    });
  });

  // Locais empresa
  document.querySelectorAll('[data-mt-local-idx]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var empId = this.dataset.mtEmp;
      var i     = parseInt(this.dataset.mtLocalIdx);
      var f     = this.dataset.mtLocalF;
      if (!mtState.dados[empId].locais[i]) mtState.dados[empId].locais[i] = {};
      mtState.dados[empId].locais[i][f] = f === 'qtde' ? parseInt(this.value)||0 : this.value;
    });
  });

  // Plano textarea
  MT_EMPRESAS_DETALHE.forEach(function(empId) {
    var ta = document.getElementById('mt-plano-txt-' + empId);
    if (ta) ta.addEventListener('input', function() {
      if (!mtState.dados[empId].planoAcao) mtState.dados[empId].planoAcao = {};
      mtState.dados[empId].planoAcao.texto = this.value;
      mtState.dados[empId].planoAcao.resposta = this.value;
    });
  });
}

function _mtSomaDiasQtde(dadosGrupo) {
  return (dadosGrupo.dias_ofensores || []).reduce(function(a, d2) { return a + (parseInt(d2.qtde)||0); }, 0);
}
function _mtDiaPctAuto(dadosGrupo, idx) {
  var total = _mtSomaDiasQtde(dadosGrupo);
  var qtde  = parseInt((dadosGrupo.dias_ofensores[idx] || {}).qtde) || 0;
  if (!total || !qtde) return '';
  return Math.round(qtde / total * 100) + '%';
}

function _mtSomaCustoEmpresas(field) {
  return MT_EMPRESAS_DETALHE.reduce(function(a, id) {
    var c = (mtState.dados[id] || {}).utp_custo || {};
    return a + (parseFloat(c[field]) || 0);
  }, 0);
}

function _mtRecalcEmpresa(empId) {
  var d = mtState.dados[empId];
  if (!d) return;
  var mes = mtState.mes; // base 0
  // Acumula Jan até mês de fechamento inclusive
  d.utp_acum        = (d.utp_valores || []).slice(0, mes + 1).reduce(function(a, b) { return a + (parseFloat(b)||0); }, 0);
  d.utp_qtde_acum   = (d.utp_qtde   || []).slice(0, mes + 1).reduce(function(a, b) { return a + (parseInt(b)||0); }, 0);
  d.utp_orcado_acum = (d.utp_orcado || []).slice(0, mes + 1).reduce(function(a, b) { return a + (parseFloat(b)||0); }, 0);
  // Multas recebidas = valor/qtde do mês de fechamento
  // Só preenche se o valor ainda não foi definido pelo Sheets (evita sobrescrever)
  var valMes  = parseFloat((d.utp_valores || [])[mes]) || 0;
  var qtdeMes = parseInt((d.utp_qtde || [])[mes]) || 0;
  if (valMes  > 0) d.multas_recebidas_val  = valMes;
  if (qtdeMes > 0) d.multas_recebidas_qtde = qtdeMes;
  // nics_val e nics_qtde NÃO são recalculados aqui — vêm do Sheets e não devem ser sobrescritos
}

function _mtUpdatePreviewKpis(empId) {
  var d = mtState.dados[empId] || {};
  var el;
  el = document.getElementById('mt-pv-acum-' + empId);  if (el) el.textContent = _mtFmtMoeda(d.utp_acum||0);
  el = document.getElementById('mt-pv-qtde-' + empId);  if (el) el.textContent = d.utp_qtde_acum||0;
  el = document.getElementById('mt-pv-orc-' + empId);   if (el) el.textContent = _mtFmtMoeda(d.utp_orcado_acum||0);
  el = document.getElementById('mt-pv-rec-' + empId);   if (el) el.textContent = _mtFmtMoeda(d.multas_recebidas_val||0);
}

// ── Link plano ────────────────────────────────────────────────
function mtCopiarLinkPlano(empId) {
  var base = window.location.origin + window.location.pathname.replace('index.html', '');
  var url  = base + 'plano-de-acao-multas-transito.html?emp=' + empId + '&mes=' + mtState.mes + '&ano=' + mtState.ano;
  navigator.clipboard.writeText(url).then(function() {
    alert('Link copiado!\n\n' + url);
  }).catch(function() {
    prompt('Copie o link abaixo:', url);
  });
}

// ═══════════════════════════════════════════════
// STEP 3 — Preview de slides
// ═══════════════════════════════════════════════
function _mtStep3HTML() {
  var slides   = mtState.slides;
  var slideIdx = mtState.slideIdx || 0;
  var mesLabel = MESES_FULL[mtState.mes] + '/' + mtState.ano;

  function thumbLabel(s) {
    if (s.type === 'capa')          return 'Capa';
    if (s.type === 'acomp-utp')     return 'Acomp.\nUTP';
    if (s.type === 'causa-raiz')    return 'Causa\nRaiz';
    if (s.type === 'enderecos')     return 'Endereços';
    if (s.type === 'custos-empresa')return 'Custos\nEmpresa';
    if (s.type === 'evolucao-grupo')return 'Evolução\nGrupo';
    if (s.type === 'vel-grupo')     return 'Velocidade\nGrupo';
    if (s.type === 'evolucao-emp')  return 'Evolução\n' + MT_EMP_LABEL[s.emp];
    if (s.type === 'mes-emp')       return MESES_FULL[mtState.mes] + '\n' + MT_EMP_LABEL[s.emp];
    if (s.type === 'plano')         return 'Plano\n' + MT_EMP_LABEL[s.emp];
    if (s.type === 'contra-capa')   return 'Contra\nCapa';
    return 'Slide';
  }

  var thumbsHTML = slides.map(function(s, i) {
    return '<div class="thumb' + (i === slideIdx ? ' thumb--active' : '') + '"'
      + ' data-mt-action="go-slide" data-mt-idx="' + i + '">'
      + '<div class="thumb__preview" style="white-space:pre-line">' + thumbLabel(s) + '</div>'
      + '<div class="thumb__num">' + (i + 1) + '</div>'
      + '</div>';
  }).join('');

  return '<div class="preview-page" style="height:100vh;overflow:hidden">'
    + '<div class="preview-bar">'
    +   '<div class="preview-bar__left">'
    +     '<button class="preview-bar__arrow" style="font-size:13px;padding:4px 12px" data-mt-action="go-step" data-mt-step="2">&#8592; Voltar</button>'
    +     '<button class="preview-bar__arrow" style="font-size:13px;padding:4px 12px" data-mt-action="go-home">In&iacute;cio</button>'
    +     '<span class="preview-bar__info">Multas de Tr&acirc;nsito &mdash; Slide ' + (slideIdx + 1) + ' / ' + slides.length + ' &mdash; ' + mesLabel + '</span>'
    +   '</div>'
    +   '<div class="preview-bar__nav">'
    +     '<button class="preview-bar__arrow" data-mt-action="prev-slide">&#8592;</button>'
    +     '<button class="preview-bar__arrow" data-mt-action="next-slide">&#8594;</button>'
    +   '</div>'
    +   '<button class="preview-bar__arrow" id="mt-btn-pdf" data-mt-action="mt-gerar-pdf" style="font-size:12px;padding:4px 14px">&#128196; Gerar PDF</button>'
    + '</div>'
    + '<div class="preview-body" style="flex:1;min-height:0;overflow:hidden;display:flex">'
    +   '<div class="thumbs" style="overflow-y:auto;overflow-x:hidden;flex-shrink:0">' + thumbsHTML + '</div>'
    +   '<div class="slide-canvas" style="flex:1;display:flex;align-items:center;justify-content:center;padding:28px;min-height:0;overflow:hidden">'
    +     '<div class="slide-frame" id="mt-slide-frame" style="overflow:hidden;flex-shrink:0"></div>'
    +   '</div>'
    + '</div>'
    + '</div>';
}

function _mtRenderCurrentSlide() {
  var frame = document.getElementById('mt-slide-frame');
  if (!frame || !mtState.slides) return;
  _mtDestroyAllCharts();

  var s = mtState.slides[mtState.slideIdx || 0];
  var html = '';
  if      (s.type === 'capa')           html = _mtSlideCapa();
  else if (s.type === 'acomp-utp')      html = _mtSlideAcompUTP();
  else if (s.type === 'causa-raiz')     html = _mtSlideCausaRaiz();
  else if (s.type === 'enderecos')      html = _mtSlideEnderecos();
  else if (s.type === 'custos-empresa') html = _mtSlideCustosEmpresa();
  else if (s.type === 'evolucao-grupo') html = _mtSlideEvolucaoGrupo();
  else if (s.type === 'vel-grupo')      html = _mtSlideVelocidade();
  else if (s.type === 'evolucao-emp')   html = _mtSlideEvolucaoEmp(s.emp);
  else if (s.type === 'mes-emp')        html = _mtSlideMesEmp(s.emp);
  else if (s.type === 'plano')          html = _mtSlidePlano(s.emp);
  else if (s.type === 'contra-capa')    html = _mtSlideContraCapa();

  frame.innerHTML = html;

  requestAnimationFrame(function() {
    var slide = frame.querySelector('.mt-slide');
    if (slide) { slide.style.width = '100%'; slide.style.height = '100%'; slide.style.boxShadow = 'none'; slide.style.borderRadius = '0'; }
  });

  setTimeout(function() {
    if (s.type === 'evolucao-grupo') _mtInitEvolucaoChart('grupo');
    if (s.type === 'evolucao-emp')   _mtInitEvolucaoChart(s.emp);
    if (s.type === 'mes-emp')        _mtInitHBarChart(s.emp);
    if (s.type === 'vel-grupo')      _mtInitVelHBarChart();
  }, 60);
}

function _mtUpdateActiveThumbs() {
  document.querySelectorAll('.thumb').forEach(function(t, i) {
    t.classList.toggle('thumb--active', i === mtState.slideIdx);
    if (i === mtState.slideIdx) t.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

function _mtUpdateSlideCounter() {
  var el = document.querySelector('.preview-bar__info');
  if (el) el.textContent = 'Multas de Trânsito — Slide ' + (mtState.slideIdx + 1) + ' / ' + mtState.slides.length + ' — ' + MESES_FULL[mtState.mes] + '/' + mtState.ano;
  var prev = document.querySelector('[data-mt-action="prev-slide"]');
  var next = document.querySelector('[data-mt-action="next-slide"]');
  if (prev) prev.disabled = mtState.slideIdx === 0;
  if (next) next.disabled = mtState.slideIdx === mtState.slides.length - 1;
}

// ═══════════════════════════════════════════════
// SLIDES — HTML
// ═══════════════════════════════════════════════

function _mtSlideHeader(empId) {
  var logoEmp = empId ? '<img src="' + MT_LOGOS[empId] + '" class="mt-emp-logo" alt="">' : '';
  return '<div class="mt-slide-header">'
    + '<div class="mt-slide-header__row">'
    +   '<img src="' + MT_LOGO_JCA + '" style="height:30px;object-fit:contain" alt="JCA">'
    +   '<span class="mt-slide-header__modulo">Multas de Tr&acirc;nsito</span>'
    + '</div>'
    + '<div class="mt-slide-header__line"></div>'
    + '</div>'
    + logoEmp;
}

function _mtSlideFooter() {
  var txt = mtState.analista ? 'DO.ACT.IOP - ' + mtState.analista : 'DO.ACT.IOP';
  return '<div class="mt-slide-footer">'
    + '<span class="mt-slide-footer__text">' + txt + '</span>'
    + '<img src="' + MT_LOGO_IO + '" style="height:28px;object-fit:contain" alt="IO">'
    + '</div>';
}

// SLIDE 1 — CAPA
function _mtSlideCapa() {
  var mesLabel = MESES_FULL[mtState.mes] + ' /' + mtState.ano;
  var analista = mtState.analista ? 'DO.ACT.IOP - ' + mtState.analista : 'DO.ACT.IOP';
  return '<div class="mt-slide" style="position:relative">'
    + '<div class="mt-slide-capa">'
    +   '<div class="logos-row">'
    +     '<img src="' + MT_LOGO_JCA + '" alt="JCA">'
    +     '<div class="sep"></div>'
    +     '<img src="' + MT_LOGO_IO_CAPA + '" alt="IO" style="opacity:.9">'
    +   '</div>'
    +   '<div class="titulo">Multas de Tr&acirc;nsito</div>'
    +   '<div class="subtitulo">' + mesLabel + '</div>'
    + '</div>'
    + '<div class="mt-rodape-autor">' + analista + '</div>'
    + '</div>';
}

// SLIDE 2 — Acompanhamento UTP Comparativo
function _mtSlideAcompUTP() {
  var d = mtState.dados.grupo;
  var anoLabel = mtState.ano;
  var anoAnterior = anoLabel - 1;

  // Totais 2025 e 2026
  var tot25Qtde  = (d.comp2025 || []).reduce(function(a, b) { return a + (parseInt(b.qtde)||0); }, 0);
  var tot25Valor = (d.comp2025 || []).reduce(function(a, b) { return a + (parseFloat(b.valor)||0); }, 0);
  var tot26Qtde  = (d.comp2026 || []).reduce(function(a, b) { return a + (parseInt(b.qtde)||0); }, 0);
  var tot26Valor = (d.comp2026 || []).reduce(function(a, b) { return a + (parseFloat(b.valor)||0); }, 0);
  var tot26Orc   = (d.comp2026 || []).reduce(function(a, b) { return a + (parseFloat(b.orcado)||0); }, 0);

  // Linhas (só meses com algum dado preenchido)
  var rows = MESES.map(function(m, i) {
    var c25 = d.comp2025[i] || {};
    var c26 = d.comp2026[i] || {};
    if (!c25.valor && !c26.valor && !c26.qtde && !c25.qtde) return '';

    var varAnual = (c25.valor && c26.valor) ? _mtVariacao(c25.valor, c26.valor) : null;
    var varOrc   = (c26.orcado && c26.valor) ? _mtVariacaoOrc(c26.orcado, c26.valor) : null;

    return '<tr>'
      + '<td class="td-mes">' + m + '</td>'
      + '<td>' + (c25.qtde || '—') + '</td>'
      + '<td>' + (c25.valor ? _mtFmtMoeda(c25.valor) : '—') + '</td>'
      + '<td>' + (c26.qtde || '—') + '</td>'
      + '<td>' + (c26.valor ? _mtFmtMoeda(c26.valor) : '—') + '</td>'
      + '<td>' + (varAnual ? '<span class="' + (varAnual.pos ? 'var-pos' : 'var-neg') + '">' + varAnual.txt + '</span>' : '—') + '</td>'
      + '<td>' + (c26.orcado ? _mtFmtMoeda(c26.orcado) : '—') + (varOrc ? ' <span style="font-size:10px;font-weight:600;color:' + (varOrc.pos ? '#c0392b' : '#27ae60') + '">(' + varOrc.txt + ')</span>' : '') + '</td>'
      + '</tr>';
  }).join('');

  var varTotalObj = (tot25Valor && tot26Valor) ? _mtVariacao(tot25Valor, tot26Valor) : null;
  var varOrcObj   = (tot26Orc && tot26Valor)   ? _mtVariacaoOrc(tot26Orc, tot26Valor) : null;

  return '<div class="mt-slide">'
    + _mtSlideHeader()
    + '<div class="mt-slide-body">'
    +   '<div class="mt-slide-secao">Multas de Tr&acirc;nsito - ' + anoLabel + ' | Acompanhamento de Redu&ccedil;&atilde;o de Multas</div>'
    +   '<div style="display:flex;align-items:center;justify-content:center;flex:1;min-height:0">'
    +     '<table class="mt-tabela-acomp" style="width:94%">'
    +       '<thead>'
    +         '<tr><th colspan="7" class="th-titulo">MULTAS DE TR&Acirc;NSITO &mdash; UTP</th></tr>'
    +         '<tr>'
    +           '<th class="th-left">M&Ecirc;S</th>'
    +           '<th>QTD ' + anoAnterior + '</th>'
    +           '<th>VALOR ' + anoAnterior + '</th>'
    +           '<th>QTD ' + anoLabel + '</th>'
    +           '<th>VALOR ' + anoLabel + '</th>'
    +           '<th>VARIA&Ccedil;&Atilde;O ' + anoAnterior + '/' + anoLabel + '</th>'
    +           '<th>VALOR OR&Ccedil;ADO</th>'
    +         '</tr>'
    +       '</thead>'
    +       '<tbody>' + rows + '</tbody>'
    +       '<tfoot>'
    +         '<tr>'
    +           '<td class="td-total td-mes">TOTAL</td>'
    +           '<td class="td-total">' + (tot25Qtde||'—') + '</td>'
    +           '<td class="td-total">' + (tot25Valor?_mtFmtMoeda(tot25Valor):'—') + '</td>'
    +           '<td class="td-total">' + (tot26Qtde||'—') + '</td>'
    +           '<td class="td-total">' + (tot26Valor?_mtFmtMoeda(tot26Valor):'—') + '</td>'
    +           '<td class="td-total">' + (varTotalObj ? '<span class="' + (varTotalObj.pos?'var-pos':'var-neg') + '">' + varTotalObj.txt + '</span>' : '—') + '</td>'
    +           '<td class="td-total">' + (tot26Orc?_mtFmtMoeda(tot26Orc):'—') + (varOrcObj ? ' <span style="font-size:10px;font-weight:600;color:' + (varOrcObj.pos ? '#c0392b' : '#27ae60') + '">(' + varOrcObj.txt + ')</span>' : '') + '</td>'
    +         '</tr>'
    +       '</tfoot>'
    +     '</table>'
    +   '</div>'
    + '</div>'
    + _mtSlideFooter()
    + '</div>';
}

// SLIDE 3 — Causa Raiz + Dias Ofensores
function _mtSlideCausaRaiz() {
  var d = mtState.dados.grupo;
  var causas = d.causa_raiz || [];
  var dias   = d.dias_ofensores || [];

  var causaRows = causas.map(function(c) {
    return '<tr>'
      + '<td>' + (c.descricao||'') + '</td>'
      + '<td class="td-qtde">' + (c.qtde||'')
      + (c.pct ? '<span style="font-size:10px;font-weight:400;color:#888"> (' + Math.round(parseFloat(String(c.pct).replace(',','.').replace('%',''))) + '%)</span>' : '')
      + '</td>'
      + '</tr>';
  }).join('') || '<tr><td colspan="2" style="color:#ccc;text-align:center;padding:10px">Sem dados</td></tr>';

  // Classificação por quantidade: 0-50=Baixo, 51-250=Médio, 251-400=Alto, >400=Muito alto
  function _mtClassificarCriticidade(qtde) {
    var n = parseInt(qtde) || 0;
    if (n > 400) return 'Muito alto';
    if (n > 250) return 'Alto';
    if (n > 50)  return 'Médio';
    return 'Baixo';
  }

  var critiMap = {
    'Muito alto': '<div class="mt-criti-wrap"><span class="mt-critico-dot mt-critico-mto-alto"></span>Muito alto</div>',
    'Alto':       '<div class="mt-criti-wrap"><span class="mt-critico-dot mt-critico-alto"></span>Alto</div>',
    'Médio':      '<div class="mt-criti-wrap"><span class="mt-critico-dot mt-critico-medio"></span>M&eacute;dio</div>',
    'Baixo':      '<div class="mt-criti-wrap"><span class="mt-critico-dot mt-critico-baixo"></span>Baixo</div>',
  };

  var diasRows = dias.map(function(d2) {
    // Monta texto de horas: "07h às 09h (73) e 16h às 18h (56)"
    function fmtPeriodo(hora, qtde) {
      if (!hora) return '';
      var h1 = hora, h2 = String(parseInt(hora)+2).padStart(2,'0');
      return h1 + 'h às ' + h2 + 'h' + (qtde ? ' (' + qtde + ')' : '');
    }
    var p1 = fmtPeriodo(d2.p1hora, d2.p1qtde);
    var p2 = fmtPeriodo(d2.p2hora, d2.p2qtde);
    var horas = [p1, p2].filter(Boolean).join(' e ');

    // Percentual calculado automaticamente pela proporção das qtdes
    var totalDias = (d.dias_ofensores || []).reduce(function(a, x) { return a + (parseInt(x.qtde)||0); }, 0);
    var pctDia = (totalDias && d2.qtde) ? Math.round((parseInt(d2.qtde)||0) / totalDias * 100) + '%' : '';

    var qtdeCell = d2.qtde
      ? '<span style="font-weight:700">' + d2.qtde + '</span>'
        + (pctDia ? '<span style="font-size:10px;font-weight:400;color:#888"> (' + pctDia + ')</span>' : '')
      : '';

    // Usa criticidade do dropdown — se vazio, classifica pela qtde automaticamente
    var critiVal = d2.criticidade || _mtClassificarCriticidade(d2.qtde);

    return '<tr>'
      + '<td>' + (d2.dia||'') + '</td>'
      + '<td class="td-criti">' + (critiMap[critiVal] || critiVal) + '</td>'
      + '<td class="td-center">' + qtdeCell + '</td>'
      + '<td>' + (horas||'') + '</td>'
      + '</tr>';
  }).join('') || '<tr><td colspan="4" style="color:#ccc;text-align:center;padding:10px">Sem dados</td></tr>';

  return '<div class="mt-slide">'
    + _mtSlideHeader()
    + '<div class="mt-slide-body">'
    +   '<div class="mt-slide-secao">Multas de Tr&acirc;nsito - ' + mtState.ano + ' | Acompanhamento de Redu&ccedil;&atilde;o de Multas</div>'
    +   '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:12px;flex-shrink:0">Acumulado Anual</div>'
    +   '<div class="mt-analise-layout">'
    +     '<div class="mt-analise-left">'
    +       '<table class="mt-causa-table">'
    +         '<thead><tr><th>Causa Raiz</th><th class="th-right">Quantidade</th></tr></thead>'
    +         '<tbody>' + causaRows + '</tbody>'
    +       '</table>'
    +     '</div>'
    +     '<div class="mt-analise-right">'
    +       '<table class="mt-dias-table">'
    +         '<thead><tr><th>Dias Ofensores</th><th class="th-center">Criticidade</th><th class="th-center">Quantidade</th><th>Horas Ofensoras<br><span style="font-size:9px;font-weight:400">(Per&iacute;odo de 2 horas)</span></th></tr></thead>'
    +         '<tbody>' + diasRows + '</tbody>'
    +       '</table>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + _mtSlideFooter()
    + '</div>';
}

// SLIDE 4 — Endereços
function _mtSlideEnderecos() {
  var d = mtState.dados.grupo;
  var acum = d.enderecos_acum || [];
  var mes  = d.enderecos_mes  || [];

  function endRows(arr, isRosa) {
    return arr.map(function(e2) {
      return '<tr>'
        + '<td' + (isRosa ? ' class="td-rosa"' : '') + '>' + (e2.endereco||'') + '</td>'
        + '<td class="td-qtde">' + (e2.qtde||'') + '</td>'
        + '</tr>';
    }).join('') || '<tr><td colspan="2" style="color:#ccc;text-align:center;padding:8px">Sem dados</td></tr>';
  }

  return '<div class="mt-slide">'
    + _mtSlideHeader()
    + '<div class="mt-slide-body">'
    +   '<div class="mt-slide-secao">Multas de Tr&acirc;nsito - ' + mtState.ano + ' | Acompanhamento de Redu&ccedil;&atilde;o de Multas</div>'
    +   '<div class="mt-end-layout">'
    +     '<div class="mt-end-col">'
    +       '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:10px">Acumulado Anual</div>'
    +       '<table class="mt-end-table">'
    +         '<thead><tr><th style="background:rgba(236,152,152,.5);color:#555">Endere&ccedil;os</th><th class="th-qtde" style="background:rgba(236,152,152,.5);color:#555">Quantidade</th></tr></thead>'
    +         '<tbody>' + endRows(acum, true) + '</tbody>'
    +       '</table>'
    +     '</div>'
    +     '<div class="mt-end-divider"></div>'
    +     '<div class="mt-end-col">'
    +       '<div style="font-size:13px;font-weight:700;color:#c0392b;margin-bottom:10px">' + MESES_FULL[mtState.mes] + '</div>'
    +       '<table class="mt-end-table">'
    +         '<thead><tr><th style="background:rgba(236,152,152,.5);color:#555">Endere&ccedil;os</th><th class="th-qtde" style="background:rgba(236,152,152,.5);color:#555">Quantidade</th></tr></thead>'
    +         '<tbody>' + endRows(mes, false) + '</tbody>'
    +       '</table>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + _mtSlideFooter()
    + '</div>';
}

// SLIDE 5 — Custos UTP por empresa
function _mtSlideCustosEmpresa() {
  var rows = MT_EMPRESAS_DETALHE.map(function(id) {
    var d = mtState.dados[id] || {};
    var c = d.utp_custo || {};
    return '<tr>'
      + '<td class="logo-cell"><img src="' + MT_LOGOS[id] + '" style="max-height:24px;max-width:80px;object-fit:contain" alt=""></td>'
      + '<td>' + (c.valor_total  ? _mtFmtMoeda(c.valor_total)  : '—') + '</td>'
      + '<td>' + (c.ressarcimento ? _mtFmtMoeda(c.ressarcimento) : '—') + '</td>'
      + '<td>' + (c.custo_empresa ? _mtFmtMoeda(c.custo_empresa) : '—') + '</td>'
      + '<td>' + (c.em_aberto     ? _mtFmtMoeda(c.em_aberto)     : '—') + '</td>'
      + '</tr>';
  }).join('');

  // Total Grupo JCA — soma automática das empresas
  var totVT = _mtSomaCustoEmpresas('valor_total');
  var totRS = _mtSomaCustoEmpresas('ressarcimento');
  var totCE = _mtSomaCustoEmpresas('custo_empresa');
  var totEA = _mtSomaCustoEmpresas('em_aberto');

  return '<div class="mt-slide">'
    + _mtSlideHeader()
    + '<div class="mt-slide-body">'
    +   '<div class="mt-slide-secao">Multas de Tr&acirc;nsito - ' + mtState.ano + ' | UTP</div>'
    +   '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:12px;flex-shrink:0;text-align:center">An&aacute;lise Consolidada de Custos Detalhados</div>'
    +   '<div style="display:flex;align-items:center;justify-content:center;flex:1;min-height:0">'
    +     '<table class="mt-tabela-custos" style="width:90%">'
    +       '<thead><tr>'
    +         '<th>Empresas</th>'
    +         '<th style="color:#c0392b">Valor Total Multas</th>'
    +         '<th>Ressarcimento</th>'
    +         '<th>Custo Empresa</th>'
    +         '<th>Valor Em Aberto</th>'
    +       '</tr></thead>'
    +       '<tbody>' + rows + '</tbody>'
    +       '<tfoot><tr class="td-total-row">'
    +         '<td class="logo-cell"><img src="' + MT_LOGO_JCA + '" style="max-height:24px;max-width:80px;object-fit:contain" alt=""></td>'
    +         '<td style="font-weight:700">' + _mtFmtMoeda(totVT) + '</td>'
    +         '<td style="font-weight:700">' + _mtFmtMoeda(totRS) + '</td>'
    +         '<td style="font-weight:700">' + _mtFmtMoeda(totCE) + '</td>'
    +         '<td style="font-weight:700">' + _mtFmtMoeda(totEA) + '</td>'
    +       '</tr></tfoot>'
    +     '</table>'
    +   '</div>'
    + '</div>'
    + _mtSlideFooter()
    + '</div>';
}

// SLIDE 6 — Evolução UTP Grupo
function _mtSlideEvolucaoGrupo() {
  var d = mtState.dados.grupo;
  var totalValor = (d.comp2026 || []).reduce(function(a, b) { return a + (parseFloat(b.valor)||0); }, 0);
  var totalQtde  = (d.comp2026 || []).reduce(function(a, b) { return a + (parseInt(b.qtde)||0); }, 0);
  var totalOrc   = (d.comp2026 || []).reduce(function(a, b) { return a + (parseFloat(b.orcado)||0); }, 0);
  var varOrc = totalOrc > 0 ? _mtVariacaoOrc(totalOrc, totalValor) : null;

  return '<div class="mt-slide">'
    + _mtSlideHeader()
    + '<div class="mt-slide-body">'
    +   '<div class="mt-slide-secao">Multas de Tr&acirc;nsito &ndash; Evolu&ccedil;&atilde;o ' + mtState.ano + ' | UTP</div>'
    +   '<div class="mt-kpi-row">'
    +     '<div class="mt-kpi-box"><div class="lbl">Valor Total</div><div class="val">' + _mtFmtMoeda(totalValor) + ' <span style="font-size:11px;font-weight:400">(' + totalQtde + ')</span></div></div>'
    +     '<div class="mt-kpi-box"><div class="lbl">Valor Or&ccedil;ado</div><div class="val td-orc" style="color:#aaa">' + _mtFmtMoeda(totalOrc) + '</div></div>'
    +     (varOrc ? '<div class="mt-kpi-box"><div class="lbl">Varia&ccedil;&atilde;o</div><div class="val ' + (varOrc.pos ? 'val--red' : 'val--green') + '">' + varOrc.txt + '</div></div>' : '')
    +   '</div>'
    +   '<div style="font-size:12px;font-weight:700;color:#333;margin-bottom:6px;flex-shrink:0">Evolu&ccedil;&atilde;o Anual</div>'
    +   '<div class="mt-evolucao-chart"><canvas id="mt-chart-evolucao-grupo"></canvas></div>'
    + '</div>'
    + _mtSlideFooter()
    + '</div>';
}

// SLIDE 7 — Excesso de Velocidade (Grupo)
function _mtSlideVelocidade() {
  var d = mtState.dados.grupo;

  var mesFechLabel = MESES_FULL[mtState.mes] || '';
  var empRows = MT_EMPRESAS_DETALHE.map(function(id) {
    var v = (d.vel_por_empresa || []).find(function(x) { return x.empId === id; }) || { qtde: 0, qtdeMes: 0 };
    return '<tr>'
      + '<td class="logo-cell" style="padding:6px 10px"><img src="' + MT_LOGOS[id] + '" style="max-height:22px;max-width:80px;object-fit:contain" alt=""></td>'
      + '<td class="td-center">' + (v.qtde || '—') + '</td>'
      + '<td class="td-center">' + (v.qtdeMes || '—') + '</td>'
      + '</tr>';
  }).join('');

  return '<div class="mt-slide">'
    + _mtSlideHeader()
    + '<div class="mt-slide-body">'
    +   '<div class="mt-slide-secao">Multas de Tr&acirc;nsito &ndash; Excesso de Velocidade ' + mtState.ano + ' | UTP</div>'
    +   '<div class="mt-kpi-row" style="flex-shrink:0;margin-bottom:10px">'
    +     '<div class="mt-kpi-box"><div class="lbl">Quantidade Multas</div><div class="val">' + (d.vel_total||'—') + '</div></div>'
    +     '<div class="mt-kpi-box"><div class="lbl">Multas Velocidade 20%</div><div class="val">' + (d.vel20_qtde||'—') + ' <span style="font-size:11px;font-weight:400;color:#c0392b">(' + (d.vel20_pct||'') + ')</span></div></div>'
    +     '<div class="mt-kpi-box"><div class="lbl">Multas Velocidade até 50%</div><div class="val">' + (d.vel50_qtde||'—') + ' <span style="font-size:11px;font-weight:400;color:#c0392b">(' + (d.vel50_pct||'') + ')</span></div></div>'
    +     '<div class="mt-kpi-box"><div class="lbl">Multas Velocidade +50%</div><div class="val">' + (d.vel50mais_qtde||'—') + ' <span style="font-size:11px;font-weight:400;color:#c0392b">(' + (d.vel50mais_pct||'') + ')</span></div></div>'
    +   '</div>'
    +   '<div class="mt-vel-layout">'
    +     '<div class="mt-vel-left">'
    +       '<table class="mt-vel-table">'
    +         '<thead><tr><th>Empresas</th><th class="th-center">Qtde Anual</th><th class="th-center">' + mesFechLabel + '</th></tr></thead>'
    +         '<tbody>' + empRows + '</tbody>'
    +       '</table>'
    +     '</div>'
    +     '<div class="mt-vel-right">'
    +       '<div style="font-size:12px;font-weight:700;color:#333;margin-bottom:6px;flex-shrink:0;text-align:center">Locais</div>'
    +       '<div style="flex:1;min-height:0;position:relative"><canvas id="mt-chart-vel-hbar"></canvas></div>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + _mtSlideFooter()
    + '</div>';
}

// SLIDE — Evolução UTP por empresa
function _mtSlideEvolucaoEmp(empId) {
  var d = mtState.dados[empId] || {};
  var varObj = (d.utp_orcado_acum && d.utp_acum) ? _mtVariacaoOrc(d.utp_orcado_acum, d.utp_acum) : null;

  return '<div class="mt-slide">'
    + _mtSlideHeader(empId)
    + '<div class="mt-slide-body">'
    +   '<div class="mt-slide-secao">Multas de Tr&acirc;nsito &ndash; Evolu&ccedil;&atilde;o ' + mtState.ano + ' | UTP</div>'
    +   '<div class="mt-kpi-row">'
    +     '<div class="mt-kpi-box"><div class="lbl">Valor Total</div><div class="val">' + _mtFmtMoeda(d.utp_acum||0) + ' <span style="font-size:11px;font-weight:400">(' + (d.utp_qtde_acum||0) + ')</span></div></div>'
    +     '<div class="mt-kpi-box"><div class="lbl">Valor Or&ccedil;ado</div><div class="val" style="color:#aaa">' + _mtFmtMoeda(d.utp_orcado_acum||0) + '</div></div>'
    +     (varObj ? '<div class="mt-kpi-box"><div class="lbl">Varia&ccedil;&atilde;o</div><div class="val ' + (varObj.pos?'val--red':'val--green') + '">' + varObj.txt + '</div></div>' : '')
    +   '</div>'
    +   '<div style="font-size:12px;font-weight:700;color:#333;margin-bottom:6px;flex-shrink:0">Evolu&ccedil;&atilde;o Anual</div>'
    +   '<div class="mt-evolucao-chart"><canvas id="mt-chart-evolucao-' + empId + '"></canvas></div>'
    + '</div>'
    + _mtSlideFooter()
    + '</div>';
}

// SLIDE — Mês por empresa (Motivos + Locais)
function _mtEmpCor(empId) {
  // Retorna cor sólida (sem transparência) para uso em SVG/stroke
  var cores = {
    '1001':  '#9e9e9e',
    '1001u': '#b0b0b0',
    cat:     '#03a5a5',
    com:     '#4a90d9',
    grupo:   '#ec9898'
  };
  return cores[empId] || '#c0392b';
}

function _mtSlideMesEmp(empId) {
  var d = mtState.dados[empId] || {};
  var motivos = d.motivos || [];
  var locais  = d.locais  || [];
  var empCor  = _mtEmpCor(empId);

  // KPI row
  var kpiRow = '<div class="mt-kpi-row" style="flex-shrink:0;margin-bottom:8px">'
    + '<div class="mt-kpi-box"><div class="lbl">Multas Recebidas</div><div class="val">' + _mtFmtMoeda(d.multas_recebidas_val||0) + ' <span style="font-size:11px;font-weight:400">(' + (d.multas_recebidas_qtde||0) + ')</span></div></div>'
    + '<div class="mt-kpi-box"><div class="lbl">Multas NICs Recebidas</div><div class="val">' + _mtFmtMoeda(d.nics_val||0) + ' <span style="font-size:11px;font-weight:400">(' + (d.nics_qtde||0) + ')</span></div></div>'
    + '</div>';

  // Locais (donuts) — percentual relativo à soma de todos os locais listados
  var totalLocais = locais.reduce(function(a, l) { return a + (parseInt(l.qtde) || 0); }, 0) || 1;
  var locaisHTML = locais.map(function(l) {
    var qtde = parseInt(l.qtde) || 0;
    var pct  = Math.min(Math.round(qtde / totalLocais * 100), 100);
    var dashTotal = 2 * Math.PI * 22;
    var dashVal   = dashTotal * pct / 100;
    return '<div class="mt-local-item">'
      + '<div class="mt-donut-wrap">'
      +   '<svg width="52" height="52" viewBox="0 0 52 52">'
      +     '<circle cx="26" cy="26" r="22" fill="none" stroke="#e8e8e8" stroke-width="7"/>'
      +     '<circle cx="26" cy="26" r="22" fill="none" stroke="' + empCor + '" stroke-width="7"'
      +       ' stroke-dasharray="' + dashVal.toFixed(1) + ' ' + dashTotal.toFixed(1) + '"'
      +       ' stroke-linecap="round" transform="rotate(-90 26 26)"/>'
      +     '<text x="26" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="#1d3061">' + qtde + '</text>'
      +   '</svg>'
      + '</div>'
      + '<div class="mt-local-texto">' + (l.endereco||'') + '</div>'
      + '</div>';
  }).join('') || '<div style="color:#bbb;font-style:italic;font-size:12px">Sem locais</div>';

  return '<div class="mt-slide">'
    + _mtSlideHeader(empId)
    + '<div class="mt-slide-body">'
    +   '<div class="mt-slide-secao">Multas de Tr&acirc;nsito &ndash; ' + MESES_FULL[mtState.mes] + ' ' + mtState.ano + '</div>'
    +   kpiRow
    +   '<div class="mt-mes-layout">'
    +     '<div class="mt-mes-left">'
    +       '<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:6px">Principais Motivos</div>'
    +       '<div class="mt-hbar-wrap"><canvas id="mt-chart-hbar-' + empId + '"></canvas></div>'
    +     '</div>'
    +     '<div class="mt-mes-right">'
    +       '<div style="font-size:12px;font-weight:700;color:#c0392b;margin-bottom:8px">Principais Locais &ndash; Principal Motivo</div>'
    +       '<div class="mt-locais-list">' + locaisHTML + '</div>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + _mtSlideFooter()
    + '</div>';
}

// SLIDE — Plano de Ação por empresa
function _mtSlidePlano(empId) {
  var d = mtState.dados[empId] || {};
  var p = d.planoAcao || {};
  var motivos = d.motivos || [];
  var principalMotivo = motivos[0] || {};
  var texto = p.resposta || p.texto || '';
  var linhas = texto.split('\n').filter(function(l) { return l.trim(); });
  var bullets = linhas.length
    ? '<ul>' + linhas.map(function(l) { return '<li>' + l + '</li>'; }).join('') + '</ul>'
    : '<span class="empty">Nenhum plano preenchido.</span>';

  return '<div class="mt-slide">'
    + _mtSlideHeader(empId)
    + '<div class="mt-slide-body">'
    +   '<div class="mt-slide-secao">Multas de Tr&acirc;nsito - ' + mtState.ano + ' | Plano de A&ccedil;&atilde;o</div>'
    +   '<div class="mt-plano-slide-header-row">'
    +     '<div class="mt-plano-slide-cat">'
    +       '<div style="font-size:11px;color:rgba(255,255,255,.7);font-weight:400">Multas de<br>Tr&acirc;nsito</div>'
    +       '<div style="font-size:20px;font-weight:700;margin-top:2px">' + (principalMotivo.qtde||'—') + '</div>'
    +     '</div>'
    +     '<div class="mt-plano-slide-causa-wrap">'
    +       '<div>'
    +         '<div class="mt-plano-slide-causa-lbl">Principal Causa</div>'
    +         '<div class="mt-plano-slide-causa-val">' + (principalMotivo.descricao ? _mtCapitalize(principalMotivo.descricao) : '—') + '</div>'
    +       '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div class="mt-plano-slide-body">' + bullets + '</div>'
    + '</div>'
    + _mtSlideFooter()
    + '</div>';
}

// SLIDE — Contra-capa
function _mtSlideContraCapa() {
  var analista = mtState.analista ? 'DO.ACT.IOP - ' + mtState.analista : 'DO.ACT.IOP';
  return '<div class="mt-slide" style="position:relative">'
    + '<div class="mt-slide-capa">'
    +   '<div class="logos-row">'
    +     '<img src="' + MT_LOGO_JCA + '" alt="JCA">'
    +     '<div class="sep"></div>'
    +     '<img src="' + MT_LOGO_IO_CAPA + '" alt="IO" style="opacity:.9">'
    +   '</div>'
    + '</div>'
    + '<div class="mt-rodape-autor">' + analista + '</div>'
    + '</div>';
}

// ═══════════════════════════════════════════════
// GRÁFICOS
// ═══════════════════════════════════════════════

function _mtDestroyAllCharts() {
  Object.keys(mtCharts).forEach(function(k) {
    if (mtCharts[k]) { try { mtCharts[k].destroy(); } catch(e) {} }
  });
  mtCharts = {};
  if (_mtPreviewChart) { try { _mtPreviewChart.destroy(); } catch(e) {} _mtPreviewChart = null; }
}

// Gráfico evolução: barras (valor) + linha (qtde) + linha (orçado)
function _mtInitEvolucaoChart(empId, dpr, container) {
  var canvasId = 'mt-chart-evolucao-' + empId;
  var canvas   = (container || document).querySelector('#' + canvasId);
  if (!canvas) return;
  if (mtCharts[canvasId]) { mtCharts[canvasId].destroy(); }

  var d, vals, qtdes, orcs;
  if (empId === 'grupo') {
    var dg = mtState.dados.grupo;
    var ate = mtState.mes + 1;
    vals  = (dg.comp2026 || Array(12).fill({})).slice(0, ate).map(function(x) { return parseFloat(x.valor)||0; });
    qtdes = (dg.comp2026 || Array(12).fill({})).slice(0, ate).map(function(x) { return parseInt(x.qtde)||0; });
    orcs  = (dg.comp2026 || Array(12).fill({})).slice(0, ate).map(function(x) { return parseFloat(x.orcado)||0; });
  } else {
    d     = mtState.dados[empId] || {};
    var ate2 = mtState.mes + 1;
    vals  = (d.utp_valores || Array(12).fill(0)).slice(0, ate2).map(function(v) { return parseFloat(v)||0; });
    qtdes = (d.utp_qtde   || Array(12).fill(0)).slice(0, ate2).map(function(v) { return parseInt(v)||0; });
    orcs  = (d.utp_orcado || Array(12).fill(0)).slice(0, ate2).map(function(v) { return parseFloat(v)||0; });
  }
  var labels   = MESES.slice(0, vals.length);
  var barColor = empId === 'grupo' ? 'rgba(236,152,152,.85)' : MT_BAR_COLORS[empId];

  var labelPlugin = {
    id: 'mtEvolLabels',
    afterDatasetsDraw: function(chart) {
      var ctx = chart.ctx;
      var valorMeta = chart.getDatasetMeta(1); // linha Valor (R$) — vermelho
      var orcMeta   = orcs.some(function(v) { return v > 0; }) ? chart.getDatasetMeta(2) : null; // linha Orçado — navy
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px Arial';

      valorMeta.data.forEach(function(pt, i) {
        if (!vals[i]) return;
        var temOrc = orcMeta && orcs[i];
        // Se valor > orçado: valor fica ACIMA do ponto. Caso contrário, fica ABAIXO.
        var acima = temOrc ? (vals[i] > orcs[i]) : false;
        ctx.fillStyle = '#c0392b';
        ctx.fillText(_mtFmtMoeda(vals[i]), pt.x, pt.y + (acima ? -10 : 16));
      });
      if (orcMeta) {
        orcMeta.data.forEach(function(pt, i) {
          if (!orcs[i]) return;
          var temVal = vals[i] > 0;
          // Se orçado >= valor: orçado fica ACIMA do ponto. Caso contrário, fica ABAIXO.
          var acima = temVal ? (orcs[i] >= vals[i]) : true;
          ctx.fillStyle = '#1d3061';
          ctx.fillText(_mtFmtMoeda(orcs[i]), pt.x, pt.y + (acima ? -10 : 16));
        });
      }
      ctx.restore();
    }
  };

  var datasets = [
    {
      type: 'bar', label: 'Qtde Multas',
      data: qtdes,
      backgroundColor: barColor,
      borderWidth: 0, barPercentage: 0.6, yAxisID: 'yRight',
      datalabels: {
        display: true, anchor: 'center', align: 'center',
        color: '#1d3061', font: { size: 11, weight: 'bold' },
        formatter: function(v) { return v > 0 ? v : null; }
      }
    },
    {
      type: 'line', label: 'Valor (R$)',
      data: vals,
      borderColor: '#c0392b', backgroundColor: '#c0392b',
      pointRadius: 3, borderWidth: 2, tension: 0, yAxisID: 'yLeft',
      pointStyle: 'circle', pointBackgroundColor: '#c0392b',
      datalabels: { display: false }
    }
  ];
  if (orcs.some(function(v) { return v > 0; })) {
    datasets.push({
      type: 'line', label: 'Orçado',
      data: orcs,
      borderColor: '#1d3061', backgroundColor: '#1d3061',
      pointRadius: 4, borderWidth: 2, tension: 0, yAxisID: 'yLeft',
      pointStyle: 'circle', pointBackgroundColor: '#1d3061',
      datalabels: { display: false }
    });
  }

  var maxQtde  = Math.max.apply(null, qtdes.concat([1]));
  var maxValor = Math.max.apply(null, vals.concat(orcs).concat([1]));

  mtCharts[canvasId] = new Chart(canvas, {
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      devicePixelRatio: dpr || (window.devicePixelRatio * 2) || 2,
      layout: { padding: { top: 28, bottom: 4 } },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 5, boxHeight: 5, font: { size: 9 }, usePointStyle: true, pointStyle: 'circle' } },
        datalabels: { display: false }
      },
      scales: {
        // yRight (barras de Qtde): barras ocupam só a parte inferior do gráfico
        yRight: { display: false, min: 0, max: maxQtde * 2.6 },
        // yLeft (linhas de Valor/Orçado): min negativo "empurra" as linhas
        // para a faixa superior do gráfico, sempre acima das barras
        yLeft:  { display: false, min: -maxValor * 2.4, max: maxValor * 1.25 },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    },
    plugins: [ChartDataLabels, labelPlugin]
  });
}

// Gráfico barra horizontal (motivos do mês)
function _mtInitHBarChart(empId, dpr, container) {
  var canvasId = 'mt-chart-hbar-' + empId;
  var canvas   = (container || document).querySelector('#' + canvasId);
  if (!canvas) return;
  if (mtCharts[canvasId]) { mtCharts[canvasId].destroy(); }

  var d       = mtState.dados[empId] || {};
  var motivos = (d.motivos || []).filter(function(m) { return m.descricao && m.qtde; });
  var labels  = motivos.map(function(m) { return m.descricao.toUpperCase(); });
  var qtdes   = motivos.map(function(m) { return parseInt(m.qtde)||0; });
  var barColor = MT_BAR_COLORS[empId] || 'rgba(236,152,152,.85)';

  mtCharts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Multas',
        data: qtdes,
        backgroundColor: barColor,
        borderWidth: 0,
        barPercentage: 0.55,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      devicePixelRatio: dpr || (window.devicePixelRatio * 2) || 2,
      plugins: {
        legend: { display: false },
        datalabels: {
          display: true,
          anchor: 'end', align: 'end',
          color: '#1d3061',
          font: { size: 11, weight: 'bold' },
          formatter: function(v) { return v || null; }
        }
      },
      scales: {
        x: { display: false, beginAtZero: true, afterDataLimits: function(a) { if (a.max > 0) a.max *= 1.25; } },
        y: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#333' } }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// Gráfico barra horizontal (locais velocidade)
function _mtInitVelHBarChart(dpr, container) {
  var canvasId = 'mt-chart-vel-hbar';
  var canvas   = (container || document).querySelector('#' + canvasId);
  if (!canvas) return;
  if (mtCharts[canvasId]) { mtCharts[canvasId].destroy(); }

  var d      = mtState.dados.grupo;
  var locais = (d.vel_locais || []).filter(function(l) { return l.endereco && l.qtde; });
  var labels = locais.map(function(l) { return l.endereco.toUpperCase(); });
  var qtdes  = locais.map(function(l) { return parseInt(l.qtde)||0; });

  mtCharts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: qtdes,
        backgroundColor: 'rgba(236,152,152,.85)',
        borderWidth: 0,
        barPercentage: 0.55,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      devicePixelRatio: dpr || (window.devicePixelRatio * 2) || 2,
      plugins: {
        legend: { display: false },
        datalabels: {
          display: true, anchor: 'end', align: 'end',
          color: '#1d3061', font: { size: 11, weight: 'bold' },
          formatter: function(v) { return v || null; }
        }
      },
      scales: {
        x: { display: false, beginAtZero: true, afterDataLimits: function(a) { if (a.max > 0) a.max *= 1.25; } },
        y: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#333' } }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// ═══════════════════════════════════════════════
// FIREBASE
// ═══════════════════════════════════════════════
function _mtDocId() {
  return mtState.ano + '-' + String(mtState.mes + 1).padStart(2, '0');
}

function _mtSalvarFirebase() {
  if (typeof _db === 'undefined') return;
  _db.collection('multas_transito').doc(_mtDocId()).set({
    mes:             mtState.mes,
    ano:             mtState.ano,
    analista:        mtState.analista || '',
    dados:           mtState.dados,
    savedAt:         firebase.firestore.FieldValue.serverTimestamp()
  }).then(function() { console.log('[MT] Salvo:', _mtDocId()); })
    .catch(function(e) { console.warn('[MT] Erro ao salvar:', e); });
}

function _mtCarregarFirebase(callback) {
  if (typeof _db === 'undefined') { if (callback) callback(); return; }
  _db.collection('multas_transito').doc(_mtDocId()).get()
    .then(function(doc) {
      if (doc.exists) {
        var d = doc.data();
        if (d.dados)            mtState.dados           = d.dados;
        // Recalc acumulados
        MT_EMPRESAS_DETALHE.forEach(function(id) { _mtRecalcEmpresa(id); });
        console.log('[MT] Carregado:', _mtDocId());
      }
      if (callback) callback();
    }).catch(function(e) { console.warn('[MT] Erro ao carregar:', e); if (callback) callback(); });
}

async function _mtSalvarManual() {
  var btn = document.getElementById('mt-btn-salvar');
  if (btn) { btn.disabled = true; btn.textContent = '⏳'; }
  _mtSalvarFirebase();
  _mtSalvarPlanos();
  setTimeout(function() {
    if (btn) { btn.disabled = false; btn.textContent = '☁️ Salvar'; }
  }, 2500);
}

function _mtSalvarPlanos() {
  if (typeof _db === 'undefined') return;
  var payload = {};
  MT_EMPRESAS_DETALHE.forEach(function(id) {
    var d = mtState.dados[id] || {};
    payload[id] = {
      motivos:  (d.motivos || []).filter(function(m) { return m.descricao; }),
      analista: mtState.analista || ''
    };
  });
  _db.collection('planos_multas_transito').doc(_mtDocId())
    .set(payload, { merge: true })
    .then(function() { console.log('[MT] Planos salvos:', _mtDocId()); })
    .catch(function(e) { console.warn('[MT] Erro planos:', e); });
}

async function _mtImportarPlanos() {
  var btn = document.querySelector('[data-mt-action="mt-importar-planos"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Importando...'; }
  try {
    var doc = await _db.collection('planos_multas_transito').doc(_mtDocId()).get();
    if (!doc.exists) { alert('Nenhuma resposta encontrada para este período.'); return; }
    var fb = doc.data();
    var count = 0;
    MT_EMPRESAS_DETALHE.forEach(function(id) {
      var p = fb[id] || {};
      var resposta = p.resposta || p.texto || fb[id + '.resposta'] || '';
      var enviado  = p.enviado  || fb[id + '.enviado'] || false;
      if (!resposta && !enviado) return;
      if (!mtState.dados[id]) return;
      if (!mtState.dados[id].planoAcao) mtState.dados[id].planoAcao = {};
      mtState.dados[id].planoAcao.resposta = resposta;
      mtState.dados[id].planoAcao.texto    = resposta;
      mtState.dados[id].planoAcao.enviado  = true;
      count++;
    });
    if (count > 0) {
      alert('✅ ' + count + ' plano(s) importado(s)!');
      _mtRenderStep2Panel();
    } else {
      alert('Nenhuma empresa respondeu ainda.');
    }
  } catch(e) {
    alert('Erro ao importar: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📋 Importar Planos'; }
  }
}

function _mtAvancarParaStep2() {
  var btn = document.querySelector('[data-mt-action="go-step"][data-mt-step="2"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Carregando...'; }
  _mtCarregarFirebase(function() {
    mtState.step = 2;
    _mtRender();
    _mtSalvarPlanos();
  });
}

// ═══════════════════════════════════════════════
// PDF
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// IMPORTAÇÃO VIA COLAR TEXTO (Power BI)
// ═══════════════════════════════════════════════

function _mtShowImportStatus(msg, cor) {
  var el = document.getElementById('mt-import-status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'mt-import-status';
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;font-family:Arial,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.15);transition:opacity .3s';
    document.body.appendChild(el);
  }
  el.style.background = cor || '#1d3061';
  el.style.color = '#fff';
  el.style.opacity = msg ? '1' : '0';
  el.textContent = msg;
}

function _mtModalColar(titulo, placeholder, onConfirm) {
  // Remove modal anterior se existir
  var old = document.getElementById('mt-modal-colar');
  if (old) old.remove();

  var modal = document.createElement('div');
  modal.id = 'mt-modal-colar';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center';

  modal.innerHTML = '<div style="background:#fff;border-radius:14px;padding:28px 32px;width:560px;max-width:95vw;box-shadow:0 8px 40px rgba(0,0,0,.2);font-family:Arial,sans-serif">'
    + '<div style="font-size:16px;font-weight:700;color:#1d3061;margin-bottom:6px">' + titulo + '</div>'
    + '<div style="font-size:12px;color:#888;margin-bottom:14px">Cole o texto copiado do Power BI (Ctrl+C na tabela) e clique em Importar.</div>'
    + '<textarea id="mt-colar-area" style="width:100%;height:180px;padding:10px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:12px;font-family:monospace;resize:vertical;box-sizing:border-box;outline:none" placeholder="' + placeholder + '"></textarea>'
    + '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px">'
    +   '<button id="mt-colar-cancel" style="padding:9px 22px;border-radius:8px;border:1px solid #ddd;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;color:#555">Cancelar</button>'
    +   '<button id="mt-colar-ok" style="padding:9px 22px;border-radius:8px;border:none;background:#1d3061;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">&#128203; Importar</button>'
    + '</div>'
    + '</div>';

  document.body.appendChild(modal);
  document.getElementById('mt-colar-area').focus();

  document.getElementById('mt-colar-cancel').onclick = function() { modal.remove(); };
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  document.getElementById('mt-colar-ok').onclick = function() {
    var texto = document.getElementById('mt-colar-area').value.trim();
    if (!texto) return;
    modal.remove();
    onConfirm(texto);
  };
}

// Remove percentuais que o Power BI cola junto ao texto (ex: "BR 101 KM 14 3,44%" ou "Endereço 12%")
// Só remove se for um número decimal (vírgula/ponto) OU se vier após espaço no final
function _mtLimparDesc(str) {
  // Remove "X,XX%" ou "XX,XX%" no final (percentuais com decimal — são do Power BI)
  return str.replace(/\s+\d+[,.]\d+%\s*$/, '').trim();
}
// Suporta: Tab-separated, múltiplos espaços, vírgula como decimal
function _mtParseLinha(linha) {
  // Divide por tab ou por 2+ espaços consecutivos
  return linha.trim().split(/\t+|  +/).map(function(s) { return s.trim(); }).filter(Boolean);
}

function _mtParseNumero(s) {
  if (!s) return null;
  // Remove R$, espaços, pontos de milhar; substitui vírgula decimal por ponto
  var limpo = String(s).replace(/R\$|\s/g, '').replace(/\./g, '').replace(',', '.');
  // Remove % se houver
  limpo = limpo.replace('%', '');
  var n = parseFloat(limpo);
  return isNaN(n) ? null : n;
}

// ── Importar Causa Raiz ─────────────────────────────────────────────
function _mtColarCausa() {
  _mtModalColar(
    '📋 Importar Causa Raiz do Power BI',
    'Velocidade 20% e 50%\t980\t49,6%\nAvançar em sinal vermelho\t177\t9,0%\n...',
    function(texto) {
      var linhas = texto.split(/\n/).map(function(l) { return l.trim(); }).filter(Boolean);
      var itens = [];

      linhas.forEach(function(linha) {
        var cols = _mtParseLinha(linha);
        if (cols.length < 2) return;

        // Tentar identificar: última coluna numérica com % = pct, penúltima numérica = qtde, resto = descricao
        var descricao = '';
        var qtde = null;
        var pct  = null;

        // Busca da direita: último campo com % ou decimal = pct
        var temp = cols.slice();
        for (var j = temp.length - 1; j >= 0; j--) {
          var v = temp[j];
          if (/%/.test(v) || /^\d+[,.]?\d*$/.test(v.replace('%',''))) {
            var n = _mtParseNumero(v);
            if (n !== null) {
              if (pct === null && (/%/.test(v) || (n > 0 && n <= 100 && j === temp.length - 1))) {
                pct = String(n).replace('.', ',');
                temp.splice(j, 1);
              } else if (qtde === null && n === Math.round(n) && n > 0) {
                qtde = n;
                temp.splice(j, 1);
              }
              if (qtde !== null && pct !== null) break;
            }
          }
        }
        // Se pct ainda null, tenta penúltimo como pct e antepenúltimo como qtde
        if (qtde === null || pct === null) {
          var nums = [];
          var textos = [];
          cols.forEach(function(c) {
            var n = _mtParseNumero(c);
            if (n !== null) nums.push({ v: n, s: c });
            else textos.push(c);
          });
          descricao = textos.join(' ');
          if (nums.length >= 2) {
            qtde = Math.round(nums[0].v);
            pct  = String(nums[1].v).replace('.', ',');
          } else if (nums.length === 1) {
            qtde = Math.round(nums[0].v);
          }
        } else {
          descricao = temp.join(' ');
        }

        if (descricao && qtde !== null) {
          itens.push({ descricao: _mtLimparDesc(descricao), qtde: qtde, pct: pct || '' });
        }
      });

      if (itens.length === 0) {
        _mtShowImportStatus('❌ Nenhum dado reconhecido. Verifique o formato.', '#c0392b');
        setTimeout(function() { _mtShowImportStatus(''); }, 4000);
        return;
      }

      mtState.dados.grupo.causa_raiz = itens.sort(function(a, b) { return b.qtde - a.qtde; });
      _mtShowImportStatus('✅ ' + itens.length + ' causas importadas!', '#27ae60');
      setTimeout(function() { _mtShowImportStatus(''); }, 3000);
      _mtRenderStep2Panel();
    }
  );
}

// ── Importar Dias Ofensores — formato matriz hora×dia do Power BI ──
function _mtColarDias() {
  var CRITICA_MAP = ['Muito alto', 'Alto', 'Médio', 'Baixo'];
  var DIA_MAP = {
    'SEG':'Segunda-feira','TER':'Terça-feira','QUA':'Quarta-feira',
    'QUI':'Quinta-feira','SEX':'Sexta-feira','SÁB':'Sábado','SAB':'Sábado','DOM':'Domingo'
  };
  var ORDEM_DIAS = ['SEG','TER','QUA','QUI','SEX','SÁB','SAB','DOM'];

  _mtModalColar(
    '📋 Importar Dias Ofensores do Power BI',
    'Cole a matriz Hora × Dia da Semana × Multas Totais copiada do Power BI.\n\nExemplo:\nHora\tDia da Semana\tMultas Totais\n0\tSEG\t3\n0\tTER\t11\n...',
    function(texto) {
      var linhas = texto.split(/\n/);
      var matrix = {};
      ORDEM_DIAS.forEach(function(d) { matrix[d] = {}; });

      linhas.forEach(function(linha) {
        var cols = linha.trim().split(/\t/);
        if (cols.length < 3) return;
        var hora = cols[0].trim();
        var dia  = cols[1].trim().toUpperCase().replace('-FEIRA','').replace('Ç','Ç');
        var val  = cols[2].trim();

        // Ignorar cabeçalho e linhas em branco
        if (hora === 'Hora' || hora.toLowerCase().indexOf('em branco') >= 0) return;
        if (!DIA_MAP[dia]) return;
        var n = parseInt(val);
        if (isNaN(n)) return;
        var h = parseInt(hora);
        if (isNaN(h)) return;

        if (!matrix[dia]) matrix[dia] = {};
        matrix[dia][h] = (matrix[dia][h] || 0) + n;
      });

      // Totalizar por dia e filtrar dias com dados
      var totais = ORDEM_DIAS.map(function(dia) {
        var horas = matrix[dia] || {};
        var tot = Object.keys(horas).reduce(function(a, h) { return a + horas[h]; }, 0);
        return { dia: dia, total: tot, horas: horas };
      }).filter(function(x) { return x.total > 0; });

      if (totais.length === 0) {
        _mtShowImportStatus('❌ Nenhum dado reconhecido. Verifique o formato.', '#c0392b');
        setTimeout(function() { _mtShowImportStatus(''); }, 4000);
        return;
      }

      // Ordenar por total decrescente (1º = dia mais crítico)
      totais.sort(function(a, b) { return b.total - a.total; });

      // Total geral para % de cada dia
      var totalGeral = totais.reduce(function(a, d) { return a + d.total; }, 0);

      // Para cada dia: encontrar os 2 melhores períodos de 2h não sobrepostos
      var itens = totais.map(function(d, idx) {
        var horas = d.horas;
        var periodos = [];
        for (var h = 0; h <= 22; h++) {
          var soma = (horas[h] || 0) + (horas[h + 1] || 0);
          if (soma > 0) periodos.push({ h: h, soma: soma });
        }
        periodos.sort(function(a, b) { return b.soma - a.soma; });

        // Pegar P1 e P2 não sobrepostos (distância mínima de 2h)
        var p1 = periodos[0] || null;
        var p2 = null;
        for (var i = 1; i < periodos.length; i++) {
          if (!p1 || Math.abs(periodos[i].h - p1.h) >= 2) { p2 = periodos[i]; break; }
        }

        var pct = Math.round(d.total / totalGeral * 100);

        return {
          dia:         DIA_MAP[d.dia] || d.dia,
          criticidade: (function(q) {
            if (q > 400) return 'Muito alto';
            if (q > 250) return 'Alto';
            if (q > 50)  return 'Médio';
            return 'Baixo';
          })(d.total),
          qtde:        String(d.total),
          p1hora:      p1 ? String(p1.h).padStart(2, '0') : '',
          p1qtde:      p1 ? p1.soma : '',
          p2hora:      p2 ? String(p2.h).padStart(2, '0') : '',
          p2qtde:      p2 ? p2.soma : ''
        };
      });

      mtState.dados.grupo.dias_ofensores = itens;
      _mtShowImportStatus('✅ ' + itens.length + ' dias importados!', '#27ae60');
      setTimeout(function() { _mtShowImportStatus(''); }, 3000);
      _mtRenderStep2Panel();
    }
  );
}

// ── Importar Motivos da Empresa ──────────────────────────────────────
function _mtColarMotivos(empId) {
  _mtModalColar(
    '📋 Importar Principais Motivos — ' + MT_EMP_LABEL[empId],
    'Cole a tabela de motivos copiada do Power BI.\n\nExemplo:\nVELOCIDADE 20%\t43\nAVANÇAR EM SINAL VERMELHO\t11\nTRANSITAR EM LOCAL PROIBIDO\t5',
    function(texto) {
      var linhas = texto.split(/\n/).map(function(l){ return l.trim(); }).filter(Boolean);
      var itens = [];
      linhas.forEach(function(linha) {
        if (linha.toLowerCase().indexOf('motivo') >= 0 || linha.toLowerCase().indexOf('causa') >= 0) return; // cabeçalho
        var cols = linha.split(/\t+|  {2,}/).map(function(c){ return c.trim(); }).filter(Boolean);
        if (cols.length < 1) return;
        // Último campo numérico = qtde
        var qtde = null, desc = [];
        cols.forEach(function(c) {
          var n = parseInt(c.replace(/\./g,''));
          if (!isNaN(n) && n > 0) qtde = n;
          else desc.push(c);
        });
        if (desc.length && qtde !== null) itens.push({ descricao: _mtLimparDesc(desc.join(' ')), qtde: qtde });
      });

      if (!itens.length) {
        _mtShowImportStatus('❌ Nenhum dado reconhecido.', '#c0392b');
        setTimeout(function(){ _mtShowImportStatus(''); }, 3000);
        return;
      }
      itens.sort(function(a,b){ return b.qtde - a.qtde; });
      if (!mtState.dados[empId]) return;
      mtState.dados[empId].motivos = itens;
      _mtShowImportStatus('✅ ' + itens.length + ' motivos importados!', '#27ae60');
      setTimeout(function(){ _mtShowImportStatus(''); }, 3000);
      _mtRenderStep2Panel();
    }
  );
}

// ── Importar Locais da Empresa ────────────────────────────────────────
function _mtColarLocais(empId) {
  _mtModalColar(
    '📋 Importar Principais Locais — ' + MT_EMP_LABEL[empId],
    'Cole a tabela de locais copiada do Power BI.\n\nExemplo:\nBR 101 KM 323 A 335 - PONTE NIT/RJ\t13\nBR 101 KM 332 - RIO DE JANEIRO/RJ\t3',
    function(texto) {
      var linhas = texto.split(/\n/).map(function(l){ return l.trim(); }).filter(Boolean);
      var itens = [];
      linhas.forEach(function(linha) {
        if (linha.toLowerCase().indexOf('endereço') >= 0 || linha.toLowerCase().indexOf('local') >= 0) return;
        var cols = linha.split(/\t+|  {2,}/).map(function(c){ return c.trim(); }).filter(Boolean);
        if (cols.length < 1) return;
        var qtde = null, desc = [];
        cols.forEach(function(c) {
          var n = parseInt(c.replace(/\./g,''));
          if (!isNaN(n) && n > 0) qtde = n;
          else desc.push(c);
        });
        if (desc.length && qtde !== null) itens.push({ endereco: _mtLimparDesc(desc.join(' ')), qtde: qtde });
      });

      if (!itens.length) {
        _mtShowImportStatus('❌ Nenhum dado reconhecido.', '#c0392b');
        setTimeout(function(){ _mtShowImportStatus(''); }, 3000);
        return;
      }
      itens.sort(function(a,b){ return b.qtde - a.qtde; });
      if (!mtState.dados[empId]) return;
      mtState.dados[empId].locais = itens;
      _mtShowImportStatus('✅ ' + itens.length + ' locais importados!', '#27ae60');
      setTimeout(function(){ _mtShowImportStatus(''); }, 3000);
      _mtRenderStep2Panel();
    }
  );
}


// ── Importar Endereços ────────────────────────────────────────────────
function _mtColarEnderecos(tipo) {
  var titulo = tipo === 'acum'
    ? '📋 Importar Endereços — Acumulado Anual'
    : '📋 Importar Endereços — ' + MESES_FULL[mtState.mes];

  _mtModalColar(
    titulo,
    'Cole a tabela de endereços copiada do Power BI.\n\nExemplo:\nBR 101 KM 321 A 334 - PONTE NIT/RJ\t104\nBR 101 KM 14 - GARUVA/SC\t60\n...',
    function(texto) {
      var linhas = texto.split(/\n/).map(function(l){ return l.trim(); }).filter(Boolean);
      var itens = [];
      linhas.forEach(function(linha) {
        if (/endere[çc]o|quantidade|local/i.test(linha)) return; // cabeçalho
        var cols = linha.split(/\t+|  {2,}/).map(function(c){ return c.trim(); }).filter(Boolean);
        if (cols.length < 1) return;
        var qtde = null, desc = [];
        cols.forEach(function(c) {
          var n = parseInt(c.replace(/\./g,''));
          if (!isNaN(n) && n > 0 && /^\d+$/.test(c.replace(/\./g,''))) qtde = n;
          else desc.push(c);
        });
        if (desc.length && qtde !== null) itens.push({ endereco: _mtLimparDesc(desc.join(' ')), qtde: qtde });
      });

      if (!itens.length) {
        _mtShowImportStatus('❌ Nenhum dado reconhecido.', '#c0392b');
        setTimeout(function(){ _mtShowImportStatus(''); }, 3000);
        return;
      }
      itens.sort(function(a,b){ return b.qtde - a.qtde; });

      if (tipo === 'acum') mtState.dados.grupo.enderecos_acum = itens;
      else                  mtState.dados.grupo.enderecos_mes  = itens;

      _mtShowImportStatus('✅ ' + itens.length + ' endereços importados!', '#27ae60');
      setTimeout(function(){ _mtShowImportStatus(''); }, 3000);
      _mtRenderStep2Panel();
    }
  );
}


var MT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwaxFWmoeUpbHLSffzLt1B8X1tPneQEKIF3XYAVJhAha0z2LIfCH8MxRK_KQdulDXU0/exec';
// URL do Apps Script de Orçamento — preencher após deploy do jca-orcamento-multas.gs
var MT_ORCADO_URL = 'https://script.google.com/macros/s/AKfycbyHT5V7zP-LgN2t6VCeK8xFqj2-bODoI06m-hljuybxMOJdJBYFskhfFdgnE4Nvb6E/exec';

async function _mtImportarSheets() {
  if (!MT_APPS_SCRIPT_URL) {
    alert('⚠️ URL do Apps Script de multas não configurada.');
    return;
  }

  var btn = document.querySelector('[data-mt-action="mt-importar-sheets"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Importando...'; }

  try {
    var _t = '&_t=' + Date.now();
    // Buscar multas, orçado, velocidade, causa raiz e custos UTP em paralelo
    var promises = [
      fetch(MT_APPS_SCRIPT_URL + '?ano=' + mtState.ano + _t).then(function(r){ return r.json(); }),
      fetch(MT_APPS_SCRIPT_URL + '?tipo=velocidade&ano=' + mtState.ano + '&mes=' + mtState.mes + _t).then(function(r){ return r.json(); }),
      fetch(MT_APPS_SCRIPT_URL + '?tipo=causa-raiz&ano=' + mtState.ano + '&mes=' + mtState.mes + _t).then(function(r){ return r.json(); }),
      fetch(MT_APPS_SCRIPT_URL + '?tipo=custos-utp&ano=' + mtState.ano + '&mes=' + mtState.mes + _t).then(function(r){ return r.json(); })
    ];
    if (MT_ORCADO_URL) {
      promises.push(
        fetch(MT_ORCADO_URL + '?tipo=transito&ano=' + mtState.ano + _t).then(function(r){ return r.json(); })
      );
    }

    var results    = await Promise.all(promises);
    var jsonMultas = results[0];
    var jsonVel    = results[1];
    var jsonCR     = results[2];
    var jsonCU     = results[3];
    var jsonOrcado = results[4] || null;

    if (!jsonMultas.ok) throw new Error(jsonMultas.erro || 'Erro ao buscar multas');

    var dadosMultas = jsonMultas.dados || {};
    var dadosOrcado = (jsonOrcado && jsonOrcado.ok) ? (jsonOrcado.dados || {}) : {};
    var dadosVel    = (jsonVel && jsonVel.ok) ? jsonVel.dados : null;
    var count = 0;

    ['1001','1001u','cat','com'].forEach(function(empId) {
      var dm  = dadosMultas[empId];
      var dor = dadosOrcado[empId];
      var cu  = (jsonCU && jsonCU.ok && jsonCU.dados) ? jsonCU.dados[empId] : null;
      if (!mtState.dados[empId]) return;

      if (dm && dm.valores && dm.qtde) {
        dm.valores.forEach(function(v, i) { if (v > 0) mtState.dados[empId].utp_valores[i] = Math.round(v); });
        dm.qtde.forEach(function(q, i)    { if (q > 0) mtState.dados[empId].utp_qtde[i]    = q; });
        count++;
      }
      if (dor && dor.orcado) {
        dor.orcado.forEach(function(v, i) { if (v > 0) mtState.dados[empId].utp_orcado[i] = v; });
      }

      // Recalc acumulados + multas_recebidas_val/qtde dos arrays mensais
      _mtRecalcEmpresa(empId);

      // NICs, motivos e locais do script — preenchidos APÓS o recalc para não serem sobrescritos
      if (cu) {
        mtState.dados[empId].nics_qtde = cu.nics_qtde;
        mtState.dados[empId].nics_val  = cu.nics_val;
        if (cu.motivos && cu.motivos.length) mtState.dados[empId].motivos = cu.motivos;
        if (cu.locais  && cu.locais.length)  mtState.dados[empId].locais  = cu.locais;
        console.log('[MT Import] ' + empId + ' NICs:', cu.nics_qtde, 'R$', cu.nics_val, '| State:', mtState.dados[empId].nics_qtde);
      }
    });

    // Preencher dados de velocidade
    if (dadosVel) {
      var pe = dadosVel.porEmpresa || {};
      var totalV20 = 0, totalV50 = 0, totalV50mais = 0;

      var velArr = ['1001','1001u','cat','com'].map(function(empId) {
        var ev = pe[empId] || { v20: 0, v50: 0, v50mais: 0, mesFech: 0 };
        totalV20     += ev.v20;
        totalV50     += ev.v50;
        totalV50mais += ev.v50mais;
        return { empId: empId, qtde: ev.v20 + ev.v50 + ev.v50mais, qtdeMes: ev.mesFech };
      });

      var totalVel = totalV20 + totalV50 + totalV50mais;
      var d = mtState.dados.grupo;
      d.vel_total        = totalVel;
      d.vel20_qtde       = totalV20;
      d.vel20_pct        = totalVel ? Math.round(totalV20 / totalVel * 100) + '%' : '0%';
      d.vel50_qtde       = totalV50;
      d.vel50_pct        = totalVel ? Math.round(totalV50 / totalVel * 100) + '%' : '0%';
      d.vel50mais_qtde   = totalV50mais;
      d.vel50mais_pct    = totalVel ? Math.round(totalV50mais / totalVel * 100) + '%' : '0%';
      d.vel_por_empresa  = velArr;

      // Locais de velocidade
      if (dadosVel.locais && dadosVel.locais.length) {
        d.vel_locais = dadosVel.locais;
      }
    }

    // Preencher causa raiz
    if (jsonCR && jsonCR.ok && jsonCR.dados && jsonCR.dados.itens) {
      mtState.dados.grupo.causa_raiz = jsonCR.dados.itens;
    }

    var msgCU     = (jsonCU && jsonCU.ok) ? ' + custos' : '';
    var msgCR     = (jsonCR && jsonCR.ok) ? ' + causa raiz' : '';
    var msgOrcado = jsonOrcado ? (jsonOrcado.ok ? ' + orçado' : '') : '';
    var msgVel    = dadosVel ? ' + velocidade' : '';
    _mtShowImportStatus('✅ ' + count + ' empresas importadas' + msgOrcado + msgVel + msgCR + msgCU + ' (' + jsonMultas.ano + ')!', '#27ae60');
    setTimeout(function() { _mtShowImportStatus(''); }, 4000);
    _mtRenderStep2Panel();

  } catch(err) {
    console.error('[MT Sheets]', err);
    _mtShowImportStatus('❌ Erro ao importar: ' + err.message, '#c0392b');
    setTimeout(function() { _mtShowImportStatus(''); }, 5000);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📊 Importar Sheets'; }
  }
}

async function _mtGerarPDF() {

  var btn = document.getElementById('mt-btn-pdf');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Gerando...'; }

  // Destrói gráficos e limpa o canvas do slide atualmente exibido no preview,
  // evitando IDs de canvas duplicados simultâneos durante a geração do PDF
  _mtDestroyAllCharts();
  var previewFrame = document.getElementById('mt-slide-frame');
  if (previewFrame) previewFrame.innerHTML = '';

  var { jsPDF } = window.jspdf;
  var pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540], hotfixes: ['px_scaling'] });
  var slides   = mtState.slides;
  var savedIdx = mtState.slideIdx;

  var box = document.createElement('div');
  box.id  = 'mt-pdf-box';
  box.style.cssText = 'position:fixed;top:-600px;left:0;width:960px;height:540px;overflow:hidden;background:#fff;z-index:-1;font-family:Arial,Helvetica,sans-serif';
  document.body.appendChild(box);
  var styleEl = document.createElement('style');
  styleEl.textContent = '#mt-pdf-box .mt-slide{width:960px!important;height:540px!important;box-shadow:none!important;border-radius:0!important}';
  document.head.appendChild(styleEl);

  for (var i = 0; i < slides.length; i++) {
    var s = slides[i];
    _mtDestroyAllCharts();
    var html = '';
    try {
      if      (s.type === 'capa')           html = _mtSlideCapa();
      else if (s.type === 'acomp-utp')      html = _mtSlideAcompUTP();
      else if (s.type === 'causa-raiz')     html = _mtSlideCausaRaiz();
      else if (s.type === 'enderecos')      html = _mtSlideEnderecos();
      else if (s.type === 'custos-empresa') html = _mtSlideCustosEmpresa();
      else if (s.type === 'evolucao-grupo') html = _mtSlideEvolucaoGrupo();
      else if (s.type === 'vel-grupo')      html = _mtSlideVelocidade();
      else if (s.type === 'evolucao-emp')   html = _mtSlideEvolucaoEmp(s.emp);
      else if (s.type === 'mes-emp')        html = _mtSlideMesEmp(s.emp);
      else if (s.type === 'plano')          html = _mtSlidePlano(s.emp);
      else if (s.type === 'contra-capa')    html = _mtSlideContraCapa();
    } catch(err) { console.warn('mt pdf slide ' + i + ':', err); }

    box.innerHTML = html;

    await new Promise(function(r) { setTimeout(r, 80); });

    // Charts PDF (dpr=4) — busca o canvas dentro do próprio box do PDF,
    // evitando conflito de ID com qualquer canvas remanescente no preview
    if (s.type === 'evolucao-grupo') _mtInitEvolucaoChart('grupo', 4, box);
    if (s.type === 'evolucao-emp')   _mtInitEvolucaoChart(s.emp, 4, box);
    if (s.type === 'mes-emp')        _mtInitHBarChart(s.emp, 4, box);
    if (s.type === 'vel-grupo')      _mtInitVelHBarChart(4, box);

    await new Promise(function(r) { setTimeout(r, 300); });

    try {
      var canvas = await html2canvas(box, {
        scale: 4, useCORS: true, allowTaint: false,
        backgroundColor: '#ffffff',
        width: 960, height: 540,
        windowWidth: 960, windowHeight: 540,
        logging: false,
        onclone: function(doc) {
          var el = doc.getElementById('mt-pdf-box');
          if (el) el.style.top = '0';
        }
      });
      var img = canvas.toDataURL('image/jpeg', 0.97);
      if (i > 0) pdf.addPage([960, 540], 'landscape');
      pdf.addImage(img, 'JPEG', 0, 0, 960, 540);
    } catch(err) { console.warn('mt pdf canvas ' + i + ':', err); }
  }

  document.body.removeChild(box);
  document.head.removeChild(styleEl);
  _mtDestroyAllCharts();

  pdf.save('Multas_Transito_' + MESES_FULL[mtState.mes] + '_' + mtState.ano + '.pdf');
  mtState.slideIdx = savedIdx;
  _mtRenderCurrentSlide();
  if (btn) { btn.disabled = false; btn.textContent = '📄 Gerar PDF'; }
}

// ═══════════════════════════════════════════════
// HANDLER DE AÇÕES E INPUTS
// ═══════════════════════════════════════════════
function mtHandleAction(action, dataset, el) {
  switch (action) {
    case 'go-home':
      mtState = null;
      state.screen = 'home';
      render();
      break;

    case 'go-step':
      var step = Number(dataset.mtStep);
      if (step === 2 && mtState.step === 1) { _mtAvancarParaStep2(); break; }
      mtState.step = step;
      if (step === 3) { mtState.slideIdx = 0; _mtSalvarFirebase(); _mtSalvarPlanos(); }
      _mtRender();
      break;

    case 'set-tab':
      mtState.tabAtiva = dataset.mtTab;
      _mtRender();
      break;

    case 'go-slide':
      mtState.slideIdx = Number(dataset.mtIdx);
      _mtRenderCurrentSlide();
      _mtUpdateActiveThumbs();
      _mtUpdateSlideCounter();
      break;

    case 'prev-slide':
      if (mtState.slideIdx > 0) { mtState.slideIdx--; _mtRenderCurrentSlide(); _mtUpdateActiveThumbs(); _mtUpdateSlideCounter(); }
      break;

    case 'next-slide':
      if (mtState.slideIdx < mtState.slides.length - 1) { mtState.slideIdx++; _mtRenderCurrentSlide(); _mtUpdateActiveThumbs(); _mtUpdateSlideCounter(); }
      break;

    case 'mt-salvar-firebase':       _mtSalvarManual(); break;
    case 'mt-importar-sheets':       _mtImportarSheets(); break;
    case 'mt-importar-planos':       _mtImportarPlanos(); break;
    case 'mt-gerar-pdf':             _mtGerarPDF(); break;
    case 'mt-colar-causa':    _mtColarCausa(); break;
    case 'mt-colar-dias':     _mtColarDias(); break;
    case 'mt-colar-motivos':  _mtColarMotivos(dataset.mtEmp); break;
    case 'mt-colar-locais':   _mtColarLocais(dataset.mtEmp); break;
    case 'mt-colar-end-acum': _mtColarEnderecos('acum'); break;
    case 'mt-colar-end-mes':  _mtColarEnderecos('mes'); break;

    // Causa raiz
    case 'add-causa':
      if (!mtState.dados.grupo.causa_raiz) mtState.dados.grupo.causa_raiz = [];
      mtState.dados.grupo.causa_raiz.push({ descricao: '', qtde: 0, pct: '' });
      _mtRenderStep2Panel();
      break;
    case 'rm-causa':
      mtState.dados.grupo.causa_raiz.splice(Number(dataset.mtIdx), 1);
      _mtRenderStep2Panel();
      break;

    // Dias ofensores
    case 'add-dia':
      if (!mtState.dados.grupo.dias_ofensores) mtState.dados.grupo.dias_ofensores = [];
      mtState.dados.grupo.dias_ofensores.push({ dia: '', criticidade: 'Alto', qtde: '', p1hora: '', p1qtde: '', p2hora: '', p2qtde: '' });
      _mtRenderStep2Panel();
      break;
    case 'rm-dia':
      mtState.dados.grupo.dias_ofensores.splice(Number(dataset.mtIdx), 1);
      _mtRenderStep2Panel();
      break;

    // Endereços
    case 'add-end-acum':
      if (!mtState.dados.grupo.enderecos_acum) mtState.dados.grupo.enderecos_acum = [];
      mtState.dados.grupo.enderecos_acum.push({ endereco: '', qtde: 0 });
      _mtRenderStep2Panel();
      break;
    case 'add-end-mes':
      if (!mtState.dados.grupo.enderecos_mes) mtState.dados.grupo.enderecos_mes = [];
      mtState.dados.grupo.enderecos_mes.push({ endereco: '', qtde: 0 });
      _mtRenderStep2Panel();
      break;
    case 'add-vel-local':
      if (!mtState.dados.grupo.vel_locais) mtState.dados.grupo.vel_locais = [];
      mtState.dados.grupo.vel_locais.push({ endereco: '', qtde: 0 });
      _mtRenderStep2Panel();
      break;
    case 'rm-end':
      var prefix = dataset.mtEndPrefix;
      var arr = prefix === 'acum' ? mtState.dados.grupo.enderecos_acum
              : prefix === 'mes'  ? mtState.dados.grupo.enderecos_mes
              :                     mtState.dados.grupo.vel_locais;
      arr.splice(Number(dataset.mtIdx), 1);
      _mtRenderStep2Panel();
      break;

    // Motivos empresa
    case 'add-motivo':
      if (!mtState.dados[dataset.mtEmp].motivos) mtState.dados[dataset.mtEmp].motivos = [];
      mtState.dados[dataset.mtEmp].motivos.push({ descricao: '', qtde: 0 });
      _mtRenderStep2Panel();
      break;
    case 'rm-motivo':
      mtState.dados[dataset.mtEmp].motivos.splice(Number(dataset.mtIdx), 1);
      _mtRenderStep2Panel();
      break;

    // Locais empresa
    case 'add-local':
      if (!mtState.dados[dataset.mtEmp].locais) mtState.dados[dataset.mtEmp].locais = [];
      mtState.dados[dataset.mtEmp].locais.push({ endereco: '', qtde: 0 });
      _mtRenderStep2Panel();
      break;
    case 'rm-local':
      mtState.dados[dataset.mtEmp].locais.splice(Number(dataset.mtIdx), 1);
      _mtRenderStep2Panel();
      break;
  }
}

function mtHandleInput(el) {
  // Step 1 selects
  if (el.dataset.mtRoot) {
    var f = el.dataset.mtRoot;
    if (f === 'mes') mtState.mes = parseInt(el.value);
    else if (f === 'ano') mtState.ano = parseInt(el.value);
    else mtState[f] = el.value;
  }
}

// ═══════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════
function _mtFmtMoeda(v) {
  if (!v && v !== 0) return 'R$ —';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function _mtVariacao(anterior, atual) {
  if (!anterior || !atual) return null;
  var pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  var pctRound = Math.round(pct);
  var txt = (pctRound >= 0 ? '+' : '') + pctRound + '%';
  return { txt: txt, pos: pct > 0 };  // pos = true = acima do ano anterior (ruim = vermelho)
}

function _mtVariacaoOrc(orcado, realizado) {
  if (!orcado || !realizado) return null;
  var pct = ((realizado - orcado) / Math.abs(orcado)) * 100;
  var pctRound = Math.round(pct);
  var txt = (pctRound >= 0 ? '+' : '') + pctRound + '%';
  return { txt: txt, pos: pct > 0 }; // pos = acima do orçado (ruim)
}

function _mtCapitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}