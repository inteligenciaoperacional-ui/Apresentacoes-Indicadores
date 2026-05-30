// sinistros-screens.js — formularios do modulo Sinistros

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
    +   '<div style="background:#fff;border-radius:16px;box-shadow:0 2px 24px rgba(0,0,0,.1);padding:40px 48px;width:100%;max-width:420px;display:flex;flex-direction:column;gap:20px">'
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
    return '<button class="sin-form-tab' + (active ? " sin-form-tab--active" : "") + '"'
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
    +     '<button class="btn btn--primary" data-action="sin-go-step" data-step="3">Visualizar Apresentacao &#8594;</button>'
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
  + '<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;font-size:12px;color:#856404">'
  + '&#128161; Ao preencher, o <b>plano-de-acao-sinistros.html</b> mostrará esses dados automaticamente '
  + 'para o time regional completar as ações.'
  + '</div>';
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
}