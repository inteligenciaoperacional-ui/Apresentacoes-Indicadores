// ================================================================
// pontualidade.js — Squad Semanal de Pontualidade
// Prefixo: pont | Colecao Firebase: pontualidade_semanal
// ================================================================

var pontState = null;

// ── Logos empresas ────────────────────────────────
// ╔══════════════════════════════════════════════════╗
// ║  AJUSTE DE LOGOS — edite as alturas aqui:        ║
// ║  Na tabela do slide, busque por:                 ║
// ║    "height:11px;max-width:65px"                  ║
// ║  No formulário (Step 2), busque por:             ║
// ║    "height:24px;object-fit:contain"              ║
// ║  No preview ao vivo, busque por:                 ║
// ║    "height:14px;object-fit:contain"              ║
// ╚══════════════════════════════════════════════════╝
var PONT_LOGOS = {
  "RR":               "https://res.cloudinary.com/dln0ctawv/image/upload/v1781288229/RRP_np50b0_mftkkd.png",
  "1001":             "https://res.cloudinary.com/dln0ctawv/image/upload/v1779671790/1001_qisjtr_1_pzpzqw.png",
  "COMETA":           "https://res.cloudinary.com/dln0ctawv/image/upload/v1779671826/COM_folzln_ddghpr.png",
  "CATARINENSE":      "https://res.cloudinary.com/dln0ctawv/image/upload/v1779671813/AVC_zk4pe9_k4jgau.png",
  "BUSCO":            "https://res.cloudinary.com/dln0ctawv/image/upload/v1782600259/Busco_kuvjfb.png",
  "EXPRESSO DO SUL":  "https://res.cloudinary.com/dln0ctawv/image/upload/v1781288201/EXP_druks9_pg3ngc.png",
  "WEMOBI":           "https://res.cloudinary.com/dln0ctawv/image/upload/v1782600537/wemobi_aidspm.png",
  "RAPIDO RIBEIRÃO":  "https://res.cloudinary.com/dln0ctawv/image/upload/v1781288229/RRP_np50b0_mftkkd.png"
};

var PONT_EMP_ORDER = ["RR","1001","COMETA","CATARINENSE","BUSCO","EXPRESSO DO SUL","WEMOBI"];

// ── Altura individual dos logos na tabela do slide ──
// 📍 AJUSTE AQUI: altere a altura de cada empresa separadamente
var PONT_LOGO_H = {
  "RR":              20,
  "1001":            20,
  "COMETA":          30,
  "CATARINENSE":     26,
  "BUSCO":           18,
  "EXPRESSO DO SUL": 45,
  "WEMOBI":          15
};
function _pontLogoH(nome) { return (PONT_LOGO_H[nome] || 12) + "px"; }
var PONT_EMP_EXCLUIR = ["1001 URBANO","1001U"];

var PONT_LOGO_RIO = "https://res.cloudinary.com/dln0ctawv/image/upload/v1779238227/regionalRIO_zmz2ak.png";
var PONT_LOGO_SUL = "https://res.cloudinary.com/dln0ctawv/image/upload/v1779238268/regionalSUL_wviglw.png";
var PONT_LOGO_SAO = "https://res.cloudinary.com/dln0ctawv/image/upload/v1779238182/regionalSAO_pndoy8.png";

var PONT_REG_CONFIG = {
  RIO: { label: "RIO", logo: PONT_LOGO_RIO },
  SPO: { label: "SPO", logo: PONT_LOGO_SAO },
  SUL: { label: "SUL", logo: PONT_LOGO_SUL }
};

// ── Helpers ───────────────────────────────────────
function _pontFmtDate(d) {
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function _pontFmtLabel(d) {
  return String(d.getDate()).padStart(2,"0") + "/" + String(d.getMonth()+1).padStart(2,"0");
}
function _pontLabelFromStr(str) {
  if (!str) return "";
  var p = str.split("-");
  return p[2] + "/" + p[1];
}
function _pontParseN(v) {
  if (!v && v !== 0) return 0;
  return parseFloat(String(v).replace(/\./g,"").replace(",",".")) || 0;
}
function _pontFmtBr(v) {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
}

// ── Formatacao automatica de inputs ──────────────
function _pontFmtMilhar(val) {
  // Remove tudo que nao e digito ou virgula
  var v = String(val).replace(/[^0-9,]/g, "");
  var parts = v.split(",");
  var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.length > 1 ? intPart + "," + parts[1] : intPart;
}

function _pontFmtPct(val) {
  var v = String(val).trim();
  if (!v) return "";
  // Se vier no formato decimal 0.8620... converte para 86,2
  var asFloat = parseFloat(v.replace(",", "."));
  if (!isNaN(asFloat) && asFloat > 0 && asFloat <= 1) {
    return (asFloat * 100).toFixed(1).replace(".", ",");
  }
  // Se vier como 86.2 (ponto decimal) converte para 86,2
  if (!isNaN(asFloat) && v.indexOf(".") !== -1) {
    return asFloat.toFixed(1).replace(".", ",");
  }
  // Ja esta no formato pt-BR (86,2) — limpa e retorna com 1 casa
  var digits = v.replace(/[^0-9,]/g, "");
  var parts = digits.split(",");
  if (parts.length > 1) {
    return parts[0] + "," + parts[1].substring(0, 1);
  }
  return parts[0];
}

function _pontBlurMes(el) {
  el.value = _pontFmtMes(el.value);
  _pontSaveMes(el);
}

function _pontInputMes(el) {
  // Auto-formata quando digita exatamente 2 digitos numericos
  var v = el.value.replace(/[^0-9]/g, "");
  if (v.length >= 2) {
    el.value = _pontFmtMes(v.substring(0, 2));
    _pontSaveMes(el);
  }
}

function _pontSaveMes(el) {
  var idx  = parseInt(el.dataset.pontGrafIdx);
  var tipo = el.dataset.pontSlide;
  if (pontState && pontState[tipo] && pontState[tipo].grafico[idx] !== undefined) {
    pontState[tipo].grafico[idx].data = el.value;
    _pontUpdatePreview();
  }
}

function _pontFmtMes(val) {
  var v = String(val).trim();
  if (!v) return "";
  // Remove caracteres invalidos
  v = v.replace(/[^0-9/]/g, "");
  // Se ja tem barra e ano (ex: 01/2026), retorna como está
  if (v.indexOf("/") !== -1 && v.length >= 7) return v;
  // Se tem barra mas so mm/ ainda digitando, aguarda
  if (v.indexOf("/") !== -1) return v;
  // So digitos — pega ate 2 digitos e adiciona /ano
  var m = v.substring(0, 2).padStart(2, "0");
  var ano = pontState ? (pontState.dataFim ? pontState.dataFim.substring(0, 4) : new Date().getFullYear()) : new Date().getFullYear();
  return m + "/" + ano;
}

function _pontApplyFormat(el) {
  if (!el) return;
  var tipo = el.dataset.pontFmt;
  if (!tipo) return;
  var pos = el.selectionStart;
  var oldLen = el.value.length;
  if (tipo === "milhar") {
    el.value = _pontFmtMilhar(el.value);
  } else if (tipo === "pct") {
    el.value = _pontFmtPct(el.value);
  } else if (tipo === "mes") {
    el.value = _pontFmtMes(el.value);
  }
  // Reposiciona cursor
  var newLen = el.value.length;
  el.selectionStart = el.selectionEnd = pos + (newLen - oldLen);
}

// ── Estado inicial ────────────────────────────────
function _pontInitState() {
  var now = new Date();
  var day = now.getDay();
  var diffMon = day === 0 ? 6 : day - 1;
  var lastMon = new Date(now); lastMon.setDate(now.getDate() - diffMon - 7);
  var lastSun = new Date(lastMon); lastSun.setDate(lastMon.getDate() + 6);

  // Estado manual para os dois slides principais
  function _initSlideKpis() {
    return { partidas:"", pctGps:"", pontuais:"", atrasadas:"", pctPontual:"", meta:"92,0", semDados:"" };
  }
  function _initEmp(nome) {
    return { nome:nome, partidas:"", pontuais:"", atrasadas:"", pctPontual:"", semDados:"", pctGps:"" };
  }
  function _initReg(nome) {
    return { nome:nome, pctPontual:"", seta:"" };
  }
  function _initGrafico() {
    // 7 dias por padrao
    return [
      { data:"", pct:"" },{ data:"", pct:"" },{ data:"", pct:"" },{ data:"", pct:"" },
      { data:"", pct:"" },{ data:"", pct:"" },{ data:"", pct:"" }
    ];
  }
  function _initSlide() {
    return {
      kpis: _initSlideKpis(),
      empresas: PONT_EMP_ORDER.map(function(n) { return _initEmp(n); }),
      regionais: [_initReg("RIO"), _initReg("SPO"), _initReg("SUL")],
      grafico: _initGrafico()
    };
  }

  var yearStart = new Date(lastSun.getFullYear(), 0, 1);

  return {
    screen: "step1",
    acumInicio:      _pontFmtDate(yearStart),
    acumFim:         _pontFmtDate(lastSun),
    labelAcumInicio: "01/01",
    labelAcumFim:    _pontFmtLabel(lastSun),
    dataInicio:  _pontFmtDate(lastMon),
    dataFim:     _pontFmtDate(lastSun),
    labelInicio: _pontFmtLabel(lastMon),
    labelFim:    _pontFmtLabel(lastSun),
    analista: "",
    abaAtiva: "acumulado",
    slideAtual: 0,
    slides: [],
    // Dados manuais dos dois slides principais
    acumulado: _initSlide(),
    semanal:   _initSlide()
  };
}

function startPontualidade() {
  pontState = _pontInitState();
  render();
  // Tenta carregar o ultimo registro salvo do Firebase
  _pontCarregarUltimoFirebase();
}

function _pontCarregarUltimoFirebase() {
  var db = firebase.firestore();
  db.collection("pontualidade_semanal")
    .orderBy("savedAt", "desc")
    .limit(1)
    .get()
    .then(function(snap) {
      if (snap.empty) return;
      var d = snap.docs[0].data();
      if (!d) return;
      // Só aplica se ainda estiver no step1
      if (pontState && pontState.screen === "step1") {
        if (d.dataInicio)  pontState.dataInicio  = d.dataInicio;
        if (d.dataFim)     pontState.dataFim     = d.dataFim;
        if (d.acumInicio)  pontState.acumInicio  = d.acumInicio;
        if (d.acumFim)     pontState.acumFim     = d.acumFim;
        if (d.analista)    pontState.analista    = d.analista;
        if (d.acumulado)   pontState.acumulado   = d.acumulado;
        if (d.semanal)     pontState.semanal     = d.semanal;
        // Atualiza labels
        pontState.labelInicio     = _pontLabelFromStr(d.dataInicio || "");
        pontState.labelFim        = _pontLabelFromStr(d.dataFim || "");
        pontState.labelAcumInicio = _pontLabelFromStr(d.acumInicio || "");
        pontState.labelAcumFim    = _pontLabelFromStr(d.acumFim || "");
        render();
      }
    })
    .catch(function(e) { console.warn("Firebase [pont load]:", e); });
}

// ── Handler ───────────────────────────────────────
function pontHandleAction(action, dataset, el) {
  if (action === "go-home")          { pontState = null; render(); return; }
  if (action === "pont-tab")         { pontState.abaAtiva = dataset.reg; render(); return; }
  if (action === "pont-go-step2")    { pontState.screen = "step2"; pontState.abaAtiva = "acumulado"; render(); return; }
  if (action === "pont-go-step3")    { pontState.screen = "step3"; pontState.slideAtual = 0; pontState.slides = _pontBuildSlides(); render(); return; }
  if (action === "pont-prev-slide")  { if (pontState.slideAtual > 0) { pontState.slideAtual--; _pontRenderSlide(); } return; }
  if (action === "pont-next-slide")  { if (pontState.slideAtual < pontState.slides.length-1) { pontState.slideAtual++; _pontRenderSlide(); } return; }
  if (action === "pont-goto-slide")  { pontState.slideAtual = parseInt(dataset.idx)||0; _pontRenderSlide(); return; }
  if (action === "pont-gerar-pdf")   { _pontGerarPDF(); return; }
  if (action === "pont-salvar-firebase") { _pontSalvarFirebase(); return; }
  if (action === "pont-step1-avancar")   { _pontAvancarStep1(); return; }
  if (action === "pont-add-dia-acum")    { pontState.acumulado.grafico.push({data:"",pct:""}); render(); return; }
  if (action === "pont-rem-dia-acum")    { if (pontState.acumulado.grafico.length > 1) { pontState.acumulado.grafico.pop(); render(); } return; }
  if (action === "pont-add-dia-sem")     { pontState.semanal.grafico.push({data:"",pct:""}); render(); return; }
  if (action === "pont-rem-dia-sem")     { if (pontState.semanal.grafico.length > 1) { pontState.semanal.grafico.pop(); render(); } return; }
}

function pontRender() {
  if (!pontState) return "";
  if (pontState.screen === "step1") return _pontStep1HTML();
  if (pontState.screen === "step2") return _pontStep2HTML();
  if (pontState.screen === "step3") return _pontStep3HTML();
  return "";
}

// ── Input handler (chamado do app.js) ────────────
function _pontCalcPctPontual(tipo) {
  var slide = pontState[tipo];
  if (!slide) return;
  var partidas = _pontParseN(slide.kpis.partidas);
  var pontuais = _pontParseN(slide.kpis.pontuais);
  var semDados = _pontParseN(slide.kpis.semDados);
  // Formula: pontuais / (partidas - semDados) * 100
  var base = partidas - semDados;
  if (base > 0 && pontuais > 0) {
    var pct = (pontuais / base * 100).toFixed(1).replace(".", ",");
    slide.kpis.pctPontual = pct;
    var inputEl = document.querySelector('[data-pont-slide="' + tipo + '"][data-pont-kpi="pctPontual"]');
    if (inputEl) inputEl.value = pct;
  }
  // Recalcula para cada empresa
  slide.empresas.forEach(function(emp, i) {
    var ep  = _pontParseN(emp.partidas);
    var epo = _pontParseN(emp.pontuais);
    var esd = _pontParseN(emp.semDados);
    var ebase = ep - esd;
    if (ebase > 0 && epo > 0) {
      emp.pctPontual = (epo / ebase * 100).toFixed(1).replace(".", ",");
      var empEl = document.querySelector('[data-pont-slide="' + tipo + '"][data-pont-emp-idx="' + i + '"][data-pont-emp-field="pctPontual"]');
      if (empEl) empEl.value = emp.pctPontual;
    }
  });
}

function pontHandleInput(el) {
  var ds = el.dataset;
  if (!pontState) return;

  // KPIs acumulado/semanal
  if (ds.pontSlide && ds.pontKpi) {
    pontState[ds.pontSlide].kpis[ds.pontKpi] = el.value;
    // Recalcula % pontualidade automaticamente
    if (ds.pontKpi === "partidas" || ds.pontKpi === "pontuais" || ds.pontKpi === "semDados") {
      setTimeout(function() { _pontCalcPctPontual(ds.pontSlide); }, 50);
    }
    _pontUpdatePreview();
    return;
  }
  // Empresa
  if (ds.pontSlide && ds.pontEmpIdx !== undefined && ds.pontEmpField) {
    pontState[ds.pontSlide].empresas[parseInt(ds.pontEmpIdx)][ds.pontEmpField] = el.value;
    if (ds.pontEmpField === "partidas" || ds.pontEmpField === "pontuais" || ds.pontEmpField === "semDados") {
      setTimeout(function() { _pontCalcPctPontual(ds.pontSlide); }, 50);
    }
    _pontUpdatePreview();
    return;
  }
  // Regional
  if (ds.pontSlide && ds.pontRegIdx !== undefined && ds.pontRegField) {
    pontState[ds.pontSlide].regionais[parseInt(ds.pontRegIdx)][ds.pontRegField] = el.value;
    _pontUpdatePreview();
    return;
  }
  // Grafico
  if (ds.pontSlide && ds.pontGrafIdx !== undefined && ds.pontGrafField) {
    pontState[ds.pontSlide].grafico[parseInt(ds.pontGrafIdx)][ds.pontGrafField] = el.value;
    _pontUpdatePreview();
    return;
  }
  // Step 1
  if (ds.pontField === "acumInicio")  { pontState.acumInicio  = el.value; pontState.labelAcumInicio = _pontLabelFromStr(el.value); return; }
  if (ds.pontField === "acumFim")     { pontState.acumFim     = el.value; pontState.labelAcumFim    = _pontLabelFromStr(el.value); return; }
  if (ds.pontField === "dataInicio")  { pontState.dataInicio  = el.value; pontState.labelInicio = _pontLabelFromStr(el.value); return; }
  if (ds.pontField === "dataFim")     { pontState.dataFim     = el.value; pontState.labelFim    = _pontLabelFromStr(el.value); return; }
  if (ds.pontField === "analista")    { pontState.analista    = el.value; return; }
}

// ================================================================
// STEP 1
// ================================================================
function _pontStep1HTML() {
  var s = pontState;
  var sep = '<div style="font-size:11px;font-weight:700;color:#1d3061;text-transform:uppercase;' +
    'letter-spacing:.5px;padding:8px 0 4px;border-bottom:2px solid #e8ecf2;margin-bottom:12px">';
  var sub = '<span style="font-size:10px;color:#888;font-weight:400;text-transform:none">';
  return '<div class="pont-step1">'
    + '<div class="pont-step1__card">'
    + '<p class="pont-step1__title">Squad - Pontualidade</p>'
    + '<p class="pont-step1__subtitle">Configure os periodos da apresentacao</p>'
    + sep + 'Periodo Acumulado ' + sub + '(slide Visao Geral Acumulado)</span></div>'
    + '<div class="pont-step1__row">'
    + '<div><label class="field-label">Data Inicio</label>'
    + '<input class="field-input" type="date" id="pont-acum-inicio" value="' + s.acumInicio + '" data-pont-field="acumInicio"></div>'
    + '<div><label class="field-label">Data Fim</label>'
    + '<input class="field-input" type="date" id="pont-acum-fim" value="' + s.acumFim + '" data-pont-field="acumFim"></div>'
    + '</div>'
    + sep + 'Periodo Semanal ' + sub + '(demais slides)</span></div>'
    + '<div class="pont-step1__row">'
    + '<div><label class="field-label">Data Inicio</label>'
    + '<input class="field-input" type="date" id="pont-data-inicio" value="' + s.dataInicio + '" data-pont-field="dataInicio"></div>'
    + '<div><label class="field-label">Data Fim</label>'
    + '<input class="field-input" type="date" id="pont-data-fim" value="' + s.dataFim + '" data-pont-field="dataFim"></div>'
    + '</div>'
    + '<div class="pont-step1__field">'
    + '<label class="field-label">Analista Responsavel</label>'
    + '<input class="field-input" type="text" id="pont-analista" value="' + (s.analista||"") + '" placeholder="Nome do analista" data-pont-field="analista">'
    + '</div>'
    + '<button class="btn btn--primary pont-step1__btn" data-pont-action="pont-step1-avancar">Avancar &#8594;</button>'
    + '</div>'
    + '</div>';
}
function _pontAvancarStep1() {
  var acumInicio = document.getElementById("pont-acum-inicio").value;
  var acumFim    = document.getElementById("pont-acum-fim").value;
  var dataInicio = document.getElementById("pont-data-inicio").value;
  var dataFim    = document.getElementById("pont-data-fim").value;
  var analista   = document.getElementById("pont-analista").value.trim();
  if (!acumInicio || !acumFim) { alert("Informe as datas do periodo acumulado."); return; }
  if (!dataInicio || !dataFim) { alert("Informe as datas do periodo semanal."); return; }
  if (!analista)               { alert("Informe o nome do analista."); return; }
  pontState.acumInicio      = acumInicio;
  pontState.acumFim         = acumFim;
  pontState.labelAcumInicio = _pontLabelFromStr(acumInicio);
  pontState.labelAcumFim    = _pontLabelFromStr(acumFim);
  pontState.dataInicio      = dataInicio;
  pontState.dataFim         = dataFim;
  pontState.labelInicio     = _pontLabelFromStr(dataInicio);
  pontState.labelFim        = _pontLabelFromStr(dataFim);
  pontState.analista        = analista;
  pontState.screen          = "step2";
  pontState.abaAtiva        = "acumulado";
  render();
}
function _pontStep2HTML() {
  var s = pontState;
  var periodo = s.labelInicio + " a " + s.labelFim;

  var tabs = [
    { id:"acumulado", label:"Acumulado" },
    { id:"semanal",   label:"Semanal (" + periodo + ")" }
  ];
  var tabsHTML = tabs.map(function(t) {
    var active = s.abaAtiva === t.id ? " active" : "";
    return '<button class="pont-tab-btn pont-tab-btn--geral' + active + '" data-pont-action="pont-tab" data-reg="' + t.id + '">' + t.label + '</button>';
  }).join("");

  var conteudo = _pontStep2FormHTML(s.abaAtiva);

  return '<nav class="nav">'
    + '<div class="nav__left">'
    + '<button class="btn btn--ghost" data-pont-action="go-home">&#8592; Inicio</button>'
    + '<span class="nav__title">Pontualidade - Squad Semanal</span>'
    + '<span class="nav__period">' + periodo + '</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:6px">'
    + '<button class="btn btn--ghost" data-pont-action="pont-salvar-firebase" style="padding:3px 10px;font-size:11px;background:rgba(66,133,244,.25)">&#9729; Salvar</button>'
    + '<div class="nav__steps">'
    + '<div class="nav__step nav__step--done" style="cursor:pointer" data-pont-action="go-home">1. Periodo</div>'
    + '<div class="nav__step nav__step--active">2. Dados</div>'
    + '<div class="nav__step">3. Preview</div>'
    + '</div>'
    + '<button class="btn btn--primary" style="padding:5px 16px;font-size:13px" data-pont-action="pont-go-step3">Previa &#8594;</button>'
    + '</div>'
    + '</nav>'
    + '<div class="step-data">'
    + '<div class="step-data__wrapper">'
    + '<div class="pont-tabs" style="margin-bottom:0">' + tabsHTML + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1;min-height:0;overflow:hidden">'
    // Coluna esquerda: formulario
    + '<div style="overflow-y:auto;padding:16px 4px 16px 0">'
    + conteudo
    + '</div>'
    // Coluna direita: preview ao vivo
    + '<div style="overflow-y:auto;padding:16px 0">'
    + '<div class="preview-hd" style="margin-bottom:8px">Preview do Slide</div>'
    + _pontPreviewHTML(s.abaAtiva)
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>';
}

function _pontStep2FormHTML(tipo) {
  var slide = pontState[tipo] || pontState.acumulado;

  // ── KPIs ──
  var kpiFields = [
    { key:"partidas",    label:"Partidas",        fmt:"milhar" },
    { key:"pctGps",      label:"% GPS",           fmt:"pct" },
    { key:"pontuais",    label:"Pontuais",         fmt:"milhar" },
    { key:"atrasadas",   label:"Atrasadas",        fmt:"milhar" },
    { key:"pctPontual",  label:"% Pontualidade",  fmt:"pct" },
    { key:"meta",        label:"% Meta",           fmt:"pct" },
    { key:"semDados",    label:"Sem Dados",        fmt:"milhar" }
  ];
  var kpiHTML = '<div class="pont-secao-titulo">KPI Geral</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">'
    + kpiFields.map(function(f) {
        var ph = f.fmt==="pct" ? "81,9" : "0";
        return '<div><label class="field-label">' + f.label + '</label>'
          + '<input class="field-input" type="text" value="' + (slide.kpis[f.key]||"") + '"'
          + ' data-pont-slide="' + tipo + '" data-pont-kpi="' + f.key + '"'
          + ' data-pont-fmt="' + f.fmt + '" placeholder="' + ph + '"></div>';
      }).join("")
    + '</div>';

  // ── Empresas ──
  var empHTML = '<div class="pont-secao-titulo">Empresas</div>';
    slide.empresas.forEach(function(emp, i) {
    empHTML += '<div class="card" style="margin-bottom:10px;padding:12px">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'
      + (PONT_LOGOS[emp.nome] ? '<img src="' + PONT_LOGOS[emp.nome] + '" style="height:24px;object-fit:contain" title="📍 LOGO FORMULARIO">' : '<span style="font-size:12px;font-weight:700;color:#1d3061">' + emp.nome + '</span>')
      + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">'
      + _pontEmpInput(tipo, i, "partidas",   "Partidas")
      + _pontEmpInput(tipo, i, "pontuais",   "Pontuais")
      + _pontEmpInput(tipo, i, "atrasadas",  "Atrasadas")
      + _pontEmpInput(tipo, i, "pctPontual", "% Pontual")
      + _pontEmpInput(tipo, i, "semDados",   "Sem Dados")
      + _pontEmpInput(tipo, i, "pctGps",     "% GPS")
      + '</div>'
      + '</div>';
  });

  // ── Regionais ──
  var regHTML = '<div class="pont-secao-titulo">Regionais</div>'
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">';
  slide.regionais.forEach(function(reg, i) {
    var metaN = _pontParseN(slide.kpis.meta || "92,0");
    var regN   = _pontParseN(reg.pctPontual);
    var regCor = regN > 0 ? (regN >= metaN ? "#1a7a3c" : "#c0392b") : "#888";
    var regSeta = regN > 0 ? (regN >= metaN ? "&#8593;" : "&#8595;") : "";
    regHTML += '<div class="card" style="padding:10px">'
      + '<div style="font-size:10px;font-weight:700;color:#888;margin-bottom:6px">' + reg.nome + '</div>'
      + '<div>'
      + '<label class="field-label">% Pontual</label>'
      + '<input class="field-input" type="text" value="' + (reg.pctPontual||"") + '"'
      + ' style="color:' + (regN > 0 ? regCor : "") + ';font-weight:700"'
      + ' data-pont-slide="' + tipo + '" data-pont-reg-idx="' + i + '" data-pont-reg-field="pctPontual"'
      + ' data-pont-fmt="pct" placeholder="82,0">'
      + (regN > 0 ? '<div style="font-size:11px;font-weight:700;color:' + regCor + ';margin-top:3px">' + regSeta + ' ' + (regN >= metaN ? "Acima da meta" : "Abaixo da meta") + '</div>' : "")
      + '</div></div>';
  });
  regHTML += '</div>';

  // ── Grafico ──
  var isAcumTipo = tipo === "acumulado";
  var grafTitulo = isAcumTipo ? "Grafico - % Pontualidade por Mes" : "Grafico - % Pontualidade por Dia";
  var grafPH     = isAcumTipo ? "01" : "15/06";
  var grafLabel  = isAcumTipo ? "MES (mm)" : "DATA (dd/mm)";
  var addLabel   = isAcumTipo ? "+ Adicionar mes" : "+ Adicionar dia";
  var remAction  = tipo === "acumulado" ? "pont-rem-dia-acum" : "pont-rem-dia-sem";
  var addAction  = tipo === "acumulado" ? "pont-add-dia-acum" : "pont-add-dia-sem";

  var grafHTML = '<div class="pont-secao-titulo">' + grafTitulo + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 32px;gap:6px;align-items:end;margin-bottom:4px">'
    + '<span style="font-size:10px;font-weight:700;color:#888">' + grafLabel + '</span>'
    + '<span style="font-size:10px;font-weight:700;color:#888">% PONTUAL</span>'
    + '<span></span></div>';

  slide.grafico.forEach(function(g, i) {
    // Para acumulado: ao digitar o mes (01-12) formata automaticamente como "01/2026"
    var dataVal = g.data || "";
    grafHTML += '<div style="display:grid;grid-template-columns:1fr 1fr 32px;gap:6px;margin-bottom:4px;align-items:center">'
      + '<input class="field-input" type="text" value="' + dataVal + '"'
      + ' data-pont-slide="' + tipo + '" data-pont-graf-idx="' + i + '" data-pont-graf-field="data"'
      + (isAcumTipo ? ' data-pont-fmt="mes" oninput="_pontInputMes(this)" onblur="_pontBlurMes(this)"' : '')
      + ' placeholder="' + grafPH + '">'
      + '<input class="field-input" type="text" value="' + (g.pct||"") + '"'
      + ' data-pont-slide="' + tipo + '" data-pont-graf-idx="' + i + '" data-pont-graf-field="pct"'
      + ' data-pont-fmt="pct" placeholder="87,5">'
      + '<button style="background:none;border:none;color:#e57373;cursor:pointer;font-size:16px" data-pont-action="' + remAction + '">&#215;</button>'
      + '</div>';
  });
  grafHTML += '<button class="btn btn--secondary" style="font-size:12px;margin-top:4px" data-pont-action="' + addAction + '">' + addLabel + '</button>';

  return kpiHTML + empHTML + regHTML + grafHTML;
}

function _pontEmpInput(tipo, idx, field, label) {
  var val = (pontState[tipo] && pontState[tipo].empresas[idx]) ? (pontState[tipo].empresas[idx][field]||"") : "";
  var isPct    = (field === "pctPontual" || field === "pctGps");
  var isMilhar = (field === "partidas" || field === "pontuais" || field === "atrasadas" || field === "semDados");
  var fmt = isPct ? "pct" : (isMilhar ? "milhar" : "");
  var ph  = isPct ? "81,9" : (isMilhar ? "0" : "-");
  return '<div><label class="field-label">' + label + '</label>'
    + '<input class="field-input" type="text" value="' + val + '"'
    + ' data-pont-slide="' + tipo + '" data-pont-emp-idx="' + idx + '" data-pont-emp-field="' + field + '"'
    + (fmt ? ' data-pont-fmt="' + fmt + '"' : '')
    + ' placeholder="' + ph + '"></div>';
}

// ── Preview ao vivo ───────────────────────────────
function _pontPreviewHTML(tipo) {
  var slide = pontState[tipo] || pontState.acumulado;
  var s = pontState;
  var isAcum = tipo === "acumulado";
  var labelAI = s.labelAcumInicio || "01/01";
  var labelAF = s.labelAcumFim    || s.labelFim;
  var rodapeLabel = isAcum ? (labelAI + " a " + labelAF) : (s.labelInicio + " a " + s.labelFim);

  // KPI cards
  var kpis = slide.kpis;
  var pctPrevVal = kpis.pctPontual ? kpis.pctPontual + "%" : "-";
  var kpiCardHTML = '<div style="display:flex;gap:4px;margin-bottom:6px">'
    + _pontPrevKpiCard("Partidas", kpis.partidas||"-", "GPS: " + (kpis.pctGps ? kpis.pctGps+"%" : "-"))
    + _pontPrevKpiCard("Pontuais", kpis.pontuais||"-", "")
    + _pontPrevKpiCard("Atrasadas", kpis.atrasadas||"-", "")
    + _pontPrevKpiCard("% Pontual", pctPrevVal, "Meta: " + (kpis.meta||"92,0") + "%")
    + _pontPrevKpiCard("Sem Dados", kpis.semDados||"-", "")
    + '</div>';

  // Tabela empresas
  var empTableHTML = '<table style="width:100%;border-collapse:collapse;font-size:9px;margin-bottom:6px">'
    + '<thead><tr style="background:#1d3061;color:#fff">'
    + '<th style="padding:4px 5px;text-align:left">Empresa</th>'
    + '<th style="padding:4px 3px;text-align:center">Part.</th>'
    + '<th style="padding:4px 3px;text-align:center">Pont.</th>'
    + '<th style="padding:4px 3px;text-align:center">Atr.</th>'
    + '<th style="padding:4px 3px;text-align:center">%Pont</th>'
    + '<th style="padding:4px 3px;text-align:center">S.Dados</th>'
    + '<th style="padding:4px 3px;text-align:center">%GPS</th>'
    + '</tr></thead><tbody>';

  var totalP=0,totalPt=0,totalAt=0,totalSD=0;
  slide.empresas.forEach(function(emp, i) {
    var bg = i%2===0 ? "#f5f7fb" : "#fff";
    var n = _pontParseN(emp.pctPontual);
    var meta = _pontParseN(kpis.meta||"92,0");
    var cor = n > 0 ? (n >= meta ? "#1a7a3c" : "#c0392b") : "#1d3061";
    totalP  += _pontParseN(emp.partidas);
    totalPt += _pontParseN(emp.pontuais);
    totalAt += _pontParseN(emp.atrasadas);
    totalSD += _pontParseN(emp.semDados);
    empTableHTML += '<tr style="background:' + bg + '">'
      + '<td style="padding:3px 5px">'
      + (PONT_LOGOS[emp.nome] ? '<img src="' + PONT_LOGOS[emp.nome] + '" style="height:14px;object-fit:contain;vertical-align:middle" title="📍 LOGO PREVIEW">' : emp.nome)
      + '</td>'
      + '<td style="padding:3px;text-align:center;font-weight:600;color:#1d3061">' + (emp.partidas||"-") + '</td>'
      + '<td style="padding:3px;text-align:center;font-weight:600;color:#1d3061">' + (emp.pontuais||"-") + '</td>'
      + '<td style="padding:3px;text-align:center;font-weight:600;color:#1d3061">' + (emp.atrasadas||"-") + '</td>'
      + '<td style="padding:3px;text-align:center;font-weight:700;color:' + cor + '">' + (emp.pctPontual||"-") + '</td>'
      + '<td style="padding:3px;text-align:center;color:#1d3061">' + (emp.semDados||"-") + '</td>'
      + '<td style="padding:3px;text-align:center;color:#1d3061">' + (emp.pctGps||"-") + '</td>'
      + '</tr>';
  });
  // Total
  empTableHTML += '<tr style="background:#1d3061;color:#fff;font-weight:700">'
    + '<td style="padding:3px 5px">Total</td>'
    + '<td style="padding:3px;text-align:center">' + (totalP||"-") + '</td>'
    + '<td style="padding:3px;text-align:center">' + (totalPt||"-") + '</td>'
    + '<td style="padding:3px;text-align:center">' + (totalAt||"-") + '</td>'
    + '<td style="padding:3px;text-align:center">' + (kpis.pctPontual||"-") + '</td>'
    + '<td style="padding:3px;text-align:center">' + (totalSD||"-") + '</td>'
    + '<td style="padding:3px;text-align:center">' + (kpis.pctGps||"-") + '</td>'
    + '</tr></tbody></table>';

  // Regionais - cor e seta automáticas pela meta
  var metaPrevN = _pontParseN(kpis.meta||"92,0");
  var regHTML = '<div style="display:flex;flex-direction:column;gap:6px;width:110px">'
    + '<div style="font-size:9px;font-weight:700;color:#1d3061;text-align:center">Regionais</div>';
  slide.regionais.forEach(function(reg) {
    var cfg = PONT_REG_CONFIG[reg.nome] || {};
    var n   = _pontParseN(reg.pctPontual);
    var cor = n > 0 ? (n >= metaPrevN ? "#1a7a3c" : "#c0392b") : "#888";
    var seta = n > 0 ? (n >= metaPrevN ? " &#8593;" : " &#8595;") : "";
    regHTML += '<div style="display:flex;align-items:center;justify-content:space-between;background:#f5f7fb;border-radius:6px;padding:5px 8px">'
      + (cfg.logo ? '<img src="' + cfg.logo + '" style="height:26px;object-fit:contain">' : '<span style="font-size:9px;font-weight:700;color:#888">' + reg.nome + '</span>')
      + '<span style="font-size:12px;font-weight:700;color:' + cor + ';min-width:48px;text-align:right">' + (reg.pctPontual||"--") + seta + '</span>'
      + '</div>';
  });
  regHTML += '</div>';

  // Grafico canvas
  var grafID = "pont-prev-chart-" + tipo;
  var grafHTML = '<div style="margin-top:6px">'
    + '<div style="font-size:10px;font-weight:700;color:#1d3061;margin-bottom:4px">Periodo - % Pontualidade</div>'
    + '<div style="height:80px"><canvas id="' + grafID + '"></canvas></div>'
    + '<div style="font-size:9px;color:#999;text-align:center;margin-top:4px">' + rodapeLabel + '</div>'
    + '</div>';

  // Monta preview completo
  var html = '<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)">'
    // Mini header
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;padding-bottom:4px;border-bottom:2px solid #1d3061">'
    + '<img src="' + LOGO_JCA + '" style="height:20px;object-fit:contain">'
    + '<span style="font-size:9px;color:#bbb;letter-spacing:1px">Pontualidade</span>'
    + '</div>'
    + '<div style="font-size:12px;font-weight:700;color:#1d3061;margin-bottom:6px">Pontualidade - Rodoviária</div>'
    + kpiCardHTML
    + '<div style="display:flex;gap:8px;align-items:flex-start">'
    + '<div style="flex:1;min-width:0">' + empTableHTML + '</div>'
    + regHTML
    + '</div>'
    + grafHTML
    + '</div>';

  setTimeout(function() { _pontInitPreviewChart(grafID, slide.grafico); }, 80);

  return html;
}

function _pontPrevKpiCard(label, value, sub) {
  return '<div style="flex:1;border:1px solid #e0e4ed;border-radius:6px;padding:5px 7px">'
    + '<div style="font-size:8px;font-weight:700;color:#888;text-transform:uppercase">' + label + '</div>'
    + '<div style="font-size:13px;font-weight:700;color:#1d3061">' + value + '</div>'
    + (sub ? '<div style="font-size:8px;color:#888">' + sub + '</div>' : '')
    + '</div>';
}

function _pontUpdatePreview() {
  var tipo = pontState.abaAtiva;
  var container = document.querySelector(".step-data__wrapper > div:nth-child(2) > div:nth-child(2)");
  if (!container) return;
  container.innerHTML = '<div class="preview-hd" style="margin-bottom:8px">Preview do Slide</div>' + _pontPreviewHTML(tipo);
}

function _pontInitPreviewChart(id, grafico) {
  var canvas = document.getElementById(id);
  if (!canvas) return;
  if (canvas._chartInst) { try { canvas._chartInst.destroy(); } catch(e){} }
  var labels = grafico.map(function(g) { return g.data||""; });
  var data   = grafico.map(function(g) { return _pontParseN(g.pct)||null; });
  canvas._chartInst = new Chart(canvas, {
    type: "line",
    data: { labels: labels, datasets: [{ data: data, borderColor: "#4a7de8", backgroundColor: "rgba(74,125,232,.08)", tension: 0.4, pointRadius: 3, borderWidth: 2, fill: true }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, datalabels: { display: true, anchor: "top", align: "top", color: "#1d3061", font: { size: 8, weight: "700" }, formatter: function(v) { return v ? v + "%" : ""; } } },
      scales: { x: { ticks: { font: { size: 8 } } }, y: { display: false } },
      layout: { padding: { top: 14 } }
    },
    plugins: [ChartDataLabels]
  });
}

// ================================================================
// STEP 3
// ================================================================
function _pontStep3HTML() {
  var s = pontState;
  var total = s.slides.length;
  var idx   = s.slideAtual;
  var periodo = s.labelInicio + " a " + s.labelFim;

  var thumbsHTML = s.slides.map(function(sl, i) {
    var active = i === idx ? " thumb--active" : "";
    return '<div class="thumb' + active + '" data-pont-action="pont-goto-slide" data-idx="' + i + '">'
      + '<div class="thumb__preview">' + (sl.thumb||"Slide "+(i+1)) + '</div>'
      + '<div class="thumb__num">' + (i+1) + '</div>'
      + '</div>';
  }).join("");

  return '<div class="preview-page" style="height:100vh;overflow:hidden">'
    + '<div class="preview-bar">'
    + '<div class="preview-bar__left">'
    + '<button class="btn btn--ghost" data-pont-action="pont-go-step2" style="font-size:12px;padding:3px 12px">&#8592; Dados</button>'
    + '<button class="btn btn--ghost" data-pont-action="go-home" style="font-size:12px;padding:3px 12px">Inicio</button>'
    + '</div>'
    + '<span class="preview-bar__info">Slide '+(idx+1)+'/'+total+' - '+periodo+'</span>'
    + '<div style="display:flex;gap:8px;align-items:center">'
    + '<div class="preview-bar__nav">'
    + '<button class="preview-bar__arrow" data-pont-action="pont-prev-slide"'+(idx===0?" disabled":"")+'>&#8249;</button>'
    + '<button class="preview-bar__arrow" data-pont-action="pont-next-slide"'+(idx===total-1?" disabled":"")+'>&#8250;</button>'
    + '</div>'
    + '<button class="btn btn--ghost" data-pont-action="pont-gerar-pdf" style="font-size:12px;padding:3px 14px">&#8595; PDF</button>'
    + '</div>'
    + '</div>'
    + '<div class="preview-body" style="flex:1;overflow:hidden;display:flex">'
    + '<div class="thumbs" style="overflow-y:auto;flex-shrink:0">' + thumbsHTML + '</div>'
    + '<div class="slide-canvas" style="flex:1;display:flex;align-items:center;justify-content:center;padding:28px;overflow:hidden">'
    + '<div class="slide-frame" id="pont-slide-frame" style="width:100%;max-width:880px;aspect-ratio:16/9;background:#fff;border-radius:3px;overflow:hidden;box-shadow:0 10px 50px rgba(0,0,0,.7);position:relative"></div>'
    + '</div>'
    + '</div>'
    + '</div>';
}

function _pontBuildSlides() {
  var slides = [];
  var regs = ["RIO","SPO","SUL"];
  slides.push({ tipo:"capa",            thumb:"Capa" });
  slides.push({ tipo:"visao-acumulado", thumb:"Visao Geral\nAcumulado" });
  slides.push({ tipo:"visao-semanal",   thumb:"Visao Geral\nSemana" });
  slides.push({ tipo:"divisor",         thumb:"Rodoviari\nComercial", titulo:"RODOVIARI / COMERCIAL" });
  regs.forEach(function(reg) {
    slides.push({ tipo:"nps",          reg:reg, thumb:"NPS\n"+reg });
    slides.push({ tipo:"reclamacoes",  reg:reg, thumb:"Reclamacoes\n"+reg });
    slides.push({ tipo:"top-horarios", reg:reg, thumb:"Top Horarios\n"+reg });
    slides.push({ tipo:"top-motivos",  reg:reg, thumb:"Top Motivos\n"+reg });
  });
  slides.push({ tipo:"divisor",    thumb:"Garagem", titulo:"GARAGEM" });
  regs.forEach(function(reg) {
    slides.push({ tipo:"garagem",       reg:reg, thumb:"Garagem\n"+reg });
    slides.push({ tipo:"entrega-rodov", reg:reg, thumb:"Entrega Rod.\n"+reg });
  });
  slides.push({ tipo:"contra-capa", thumb:"Contra-capa" });
  return slides;
}

function _pontRenderSlide() {
  var frame = document.getElementById("pont-slide-frame");
  if (!frame) return;
  var s  = pontState;
  var sl = s.slides[s.slideAtual];
  if (!sl) return;

  if (window._pontCharts) { window._pontCharts.forEach(function(c){try{c.destroy();}catch(e){}}); }
  window._pontCharts = [];

  var thumbs = document.querySelectorAll(".thumbs .thumb");
  thumbs.forEach(function(t,i) {
    t.classList.toggle("thumb--active", i===s.slideAtual);
    var num = t.querySelector(".thumb__num");
    if (num) num.style.background = (i===s.slideAtual) ? "#5b9df9" : "";
  });

  var info = document.querySelector(".preview-bar__info");
  if (info) info.textContent = "Slide "+(s.slideAtual+1)+"/"+s.slides.length+" - "+s.labelInicio+" a "+s.labelFim;

  var prev = document.querySelector("[data-pont-action='pont-prev-slide']");
  var next = document.querySelector("[data-pont-action='pont-next-slide']");
  if (prev) prev.disabled = s.slideAtual===0;
  if (next) next.disabled = s.slideAtual===s.slides.length-1;

  frame.style.position = "relative";
  frame.innerHTML = _pontSlideHTML(sl);
  _pontInitCharts(sl);
}

// ── Componentes dos slides ────────────────────────
function _pontSlideHeader(titulo) {
  return '<div class="pont-slide-header">'
    + '<div class="pont-slide-header__row">'
    + '<img src="' + LOGO_JCA + '" style="height:28px;object-fit:contain">'
    + '<span class="pont-slide-header__modulo">Pontualidade</span>'
    + '</div>'
    + '<div class="pont-slide-header__line"></div>'
    + (titulo ? '<div style="font-size:16px;font-weight:700;color:#1d3061;margin-top:6px">' + titulo + '</div>' : '')
    + '</div>';
}

function _pontSlideFooter(labelIni, labelFi) {
  var s = pontState;
  return '<div class="pont-slide-footer">'
    + '<span class="pont-slide-footer__text">DO.ACT.IOP - ' + (s.analista||"") + '</span>'
    + '<span class="pont-slide-footer__periodo">' + (labelIni||s.labelInicio) + ' a ' + (labelFi||s.labelFim) + '</span>'
    + '<img src="' + LOGO_IO + '" style="height:22px;object-fit:contain">'
    + '</div>';
}

function _pontRegLogo(reg) {
  var cfg = PONT_REG_CONFIG[reg];
  if (!cfg) return "";
  return '<img class="pont-reg-logo" src="' + cfg.logo + '" alt="' + reg + '">';
}

// ── Slide dispatcher ──────────────────────────────
function _pontSlideHTML(sl) {
  switch(sl.tipo) {
    case "capa":            return _pontSlideCapa();
    case "contra-capa":     return _pontSlideContraCapa();
    case "divisor":         return _pontSlideDivisor(sl);
    case "visao-acumulado": return _pontSlideVisaoGeral("acumulado");
    case "visao-semanal":   return _pontSlideVisaoGeral("semanal");
    case "nps":             return _pontSlideNPS(sl.reg);
    case "reclamacoes":     return _pontSlideReclamacoes(sl.reg);
    case "top-horarios":    return _pontSlideTopHorarios(sl.reg);
    case "top-motivos":     return _pontSlideTopMotivos(sl.reg);
    case "garagem":         return _pontSlideGaragem(sl.reg);
    case "entrega-rodov":   return _pontSlideEntregaRodov(sl.reg);
    default: return '<div class="pont-slide"><p style="padding:20px">'+sl.tipo+'</p></div>';
  }
}

// ── Capa ──────────────────────────────────────────
function _pontSlideCapa() {
  var s = pontState;
  return '<div class="pont-slide">'
    + _pontSlideHeader("")
    + '<div class="pont-slide-capa">'
    + '<div class="logos-row"><img src="'+LOGO_JCA+'" alt="JCA"><div class="sep"></div><img src="'+LOGO_IO_CAPA+'" alt="IO"></div>'
    + '<div class="titulo">Pontualidade</div>'
    + '<div class="subtitulo">Indicadores e Acoes - ' + s.labelInicio + ' a ' + s.labelFim + '</div>'
    + '</div>'
    + '<div class="pont-rodape-autor">DO.ACT.IOP - ' + (s.analista||"") + '</div>'
    + '</div>';
}

function _pontSlideContraCapa() {
  return '<div class="pont-slide">'
    + _pontSlideHeader("")
    + '<div class="pont-slide-capa">'
    + '<div class="logos-row"><img src="'+LOGO_JCA+'" alt="JCA"><div class="sep"></div><img src="'+LOGO_IO_CAPA+'" alt="IO"></div>'
    + '<div class="titulo">Obrigado!</div>'
    + '<div class="subtitulo">Inteligencia Operacional - DO.ACT.IOP</div>'
    + '</div></div>';
}

function _pontSlideDivisor(sl) {
  return '<div class="pont-slide">'
    + '<div class="pont-slide-divisor">'
    + '<div class="div-titulo">PONTUALIDADE</div>'
    + '<div class="div-sub">' + (sl.titulo||"") + '</div>'
    + '</div></div>';
}

// ── Slide Visao Geral (Acumulado ou Semanal) ──────
function _pontSlideKpiCardV2(label, value, subLabel, subValue) {
  return '<div style="flex:1;border:1.5px solid #e0e4ed;border-radius:8px;padding:6px 10px">'
    + '<div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:2px">' + label + '</div>'
    + '<div style="display:flex;align-items:baseline;justify-content:space-between">'
    + '<span style="font-size:16px;font-weight:700;color:#1d3061">' + value + '</span>'
    + '<span style="font-size:9px;color:#888;text-align:right">' + subLabel + '<br><b style="font-size:11px;color:#1d3061">' + subValue + '%</b></span>'
    + '</div>'
    + '</div>';
}

function _pontSlideKpiCard(label, value, sub, cor) {
  return '<div style="flex:1;border:1.5px solid #e0e4ed;border-radius:8px;padding:6px 10px">'
    + '<div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:2px">' + label + '</div>'
    + '<div style="font-size:16px;font-weight:700;color:' + (cor||"#1d3061") + '">' + value + '</div>'
    + (sub ? '<div style="font-size:8px;color:#888">' + sub + '</div>' : '')
    + '</div>';
}

function _pontSlideKpiCardMeta(label, value, metaLabel, metaValue) {
  return '<div style="flex:1;border:1.5px solid #e0e4ed;border-radius:8px;padding:6px 10px">'
    + '<div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:2px">' + label + '</div>'
    + '<div style="display:flex;align-items:baseline;justify-content:space-between">'
    + '<span style="font-size:16px;font-weight:700;color:#1d3061">' + value + '</span>'
    + '<span style="font-size:9px;color:#888;text-align:right">' + metaLabel + '<br><b style="font-size:11px;color:#555">' + metaValue + '</b></span>'
    + '</div>'
    + '</div>';
}

function _pontSlideVisaoGeral(tipo) {
  var s     = pontState;
  var slide = s[tipo];
  var kpis  = slide.kpis;
  var isAcum = tipo === "acumulado";
  var labelAI = s.labelAcumInicio || "01/01";
  var labelAF = s.labelAcumFim    || s.labelFim;
  var rodapeLabel = isAcum ? (labelAI + " a " + labelAF) : (s.labelInicio + " a " + s.labelFim);
  var metaN = _pontParseN(kpis.meta||"92,0");
  var chartId = "pont-chart-visao-" + tipo;

  var pctVal  = kpis.pctPontual ? kpis.pctPontual + "%" : "-";
  var metaVal = kpis.meta ? kpis.meta + "%" : "92,0%";
  var kpiHTML = '<div style="display:flex;gap:5px;margin-bottom:8px;flex-shrink:0">'
    + _pontSlideKpiCardV2("Partidas", kpis.partidas||"-", "% GPS", kpis.pctGps||"-")
    + _pontSlideKpiCard("Pontuais", kpis.pontuais||"-", "", "#1a7a3c")
    + _pontSlideKpiCard("Atrasadas", kpis.atrasadas||"-", "", "#c0392b")
    + _pontSlideKpiCardMeta("% Pontualidade", pctVal, "% Meta", metaVal)
    + _pontSlideKpiCard("Sem Dados", kpis.semDados||"-", "", "#888")
    + '</div>';

  var empRows = "";
  var totalP=0, totalPt=0, totalAt=0, totalSD=0;
  slide.empresas.forEach(function(emp, i) {
    var bg = i%2===0 ? "#f5f7fb" : "#fff";
    var n  = _pontParseN(emp.pctPontual);
    var cor = n>0 ? (n>=metaN?"#1a7a3c":"#c0392b") : "#1d3061";
    totalP  += _pontParseN(emp.partidas);
    totalPt += _pontParseN(emp.pontuais);
    totalAt += _pontParseN(emp.atrasadas);
    totalSD += _pontParseN(emp.semDados);
    var logo = PONT_LOGOS[emp.nome];
    empRows += '<tr style="background:' + bg + '">'
      + '<td style="padding:3px 6px;width:80px">'
      + (logo ? '<img src="' + logo + '" style="height:' + _pontLogoH(emp.nome) + ';max-width:70px;object-fit:contain;vertical-align:middle" title="📍 LOGO TABELA SLIDE">' : '<span style="font-size:8px;font-weight:700;color:#1d3061">'+emp.nome+'</span>')
      + '</td>'
      + '<td style="text-align:center;font-size:8px;font-weight:600;color:#1d3061;padding:2px">' + (emp.partidas||"-") + '</td>'
      + '<td style="text-align:center;font-size:8px;font-weight:600;color:#1d3061;padding:2px">' + (emp.pontuais||"-") + '</td>'
      + '<td style="text-align:center;font-size:8px;font-weight:600;color:#1d3061;padding:2px">' + (emp.atrasadas||"-") + '</td>'
      + '<td style="text-align:center;font-size:8px;font-weight:700;color:'+cor+';padding:2px">' + (emp.pctPontual ? emp.pctPontual+"%" : "-") + '</td>'
      + '<td style="text-align:center;font-size:8px;color:#1d3061;padding:2px">' + (emp.semDados||"-") + '</td>'
      + '<td style="text-align:center;font-size:8px;color:#1d3061;padding:2px">' + (emp.pctGps ? emp.pctGps+"%" : "-") + '</td>'
      + '</tr>';
  });
  empRows += '<tr style="background:#1d3061">'
    + '<td style="padding:3px 6px;font-size:8px;font-weight:700;color:#fff">Total</td>'
    + '<td style="text-align:center;font-size:8px;font-weight:700;color:#fff">' + (totalP > 0 ? totalP.toLocaleString("pt-BR") : "-") + '</td>'
    + '<td style="text-align:center;font-size:8px;font-weight:700;color:#fff">' + (totalPt > 0 ? totalPt.toLocaleString("pt-BR") : "-") + '</td>'
    + '<td style="text-align:center;font-size:8px;font-weight:700;color:#fff">' + (totalAt > 0 ? totalAt.toLocaleString("pt-BR") : "-") + '</td>'
    + '<td style="text-align:center;font-size:8px;font-weight:700;color:#fff">' + (kpis.pctPontual ? kpis.pctPontual+"%" : "-") + '</td>'
    + '<td style="text-align:center;font-size:8px;font-weight:700;color:#fff">' + (totalSD > 0 ? totalSD.toLocaleString("pt-BR") : "-") + '</td>'
    + '<td style="text-align:center;font-size:8px;font-weight:700;color:#fff">' + (kpis.pctGps ? kpis.pctGps+"%" : "-") + '</td>'
    + '</tr>';

  var tabelaEmp = '<table style="width:100%;border-collapse:collapse;table-layout:fixed">'
    + '<thead><tr style="background:#1d3061;color:#fff">'
    + '<th style="padding:3px 5px;font-size:8px;text-align:left;font-weight:700;width:75px">Empresa</th>'
    + '<th style="padding:3px 3px;font-size:8px;text-align:center;font-weight:700">Partidas</th>'
    + '<th style="padding:3px 3px;font-size:8px;text-align:center;font-weight:700">Pontuais</th>'
    + '<th style="padding:3px 3px;font-size:8px;text-align:center;font-weight:700">Atrasadas</th>'
    + '<th style="padding:3px 3px;font-size:8px;text-align:center;font-weight:700">% Pontual</th>'
    + '<th style="padding:3px 3px;font-size:8px;text-align:center;font-weight:700">Sem Dados</th>'
    + '<th style="padding:3px 3px;font-size:8px;text-align:center;font-weight:700">% GPS</th>'
    + '</tr></thead><tbody>' + empRows + '</tbody></table>';

  var regHTML = '<div style="width:130px;flex-shrink:0;display:flex;flex-direction:column;gap:4px">'
    + '<div style="font-size:9px;font-weight:700;color:#1d3061;text-align:center;margin-bottom:2px">Regionais</div>';
  slide.regionais.forEach(function(reg) {
    var cfg = PONT_REG_CONFIG[reg.nome] || {};
    var n   = _pontParseN(reg.pctPontual);
    var cor = n>0 ? (n>=metaN?"#1a7a3c":"#c0392b") : "#888";
    var seta = n>0 ? (n>=metaN?" &#8593;":" &#8595;") : "";
    var pctDisp = reg.pctPontual ? reg.pctPontual+"%" : "--";
    regHTML += '<div style="display:flex;align-items:center;justify-content:space-between;background:#f5f7fb;border-radius:8px;padding:5px 8px">'
      + (cfg.logo ? '<img src="' + cfg.logo + '" style="height:22px;max-width:48px;object-fit:contain">' : '<span style="font-size:8px;font-weight:700">' + reg.nome + '</span>')
      + '<span style="font-size:13px;font-weight:700;color:'+cor+';min-width:54px;text-align:right">' + pctDisp + seta + '</span>'
      + '</div>';
  });
  regHTML += '</div>';

  var grafHTML = '<div style="flex:1;min-height:0"><canvas id="' + chartId + '"></canvas></div>';

  return '<div class="pont-slide">'
    + _pontSlideHeader("Pontualidade - Rodoviária")
    + '<div class="pont-slide-body">'
    + kpiHTML
    + '<div style="display:flex;gap:8px;flex:1;min-height:0">'
    + '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">'
    + '<div style="flex-shrink:0">' + tabelaEmp + '</div>'
    + '<div style="font-size:9px;font-weight:700;color:#1d3061;flex-shrink:0;margin-top:2px">Periodo - % Pontualidade</div>'
    + grafHTML
    + '</div>'
    + '<div style="width:130px;flex-shrink:0;display:flex;flex-direction:column;justify-content:flex-start;gap:4px;padding-top:0">'
    + regHTML
    + '</div>'
    + '</div>'
    + '</div>'
    + '<div class="pont-slide-footer">'
    + '<span class="pont-slide-footer__text">DO.ACT.IOP - ' + (pontState.analista||"") + '</span>'
    + '<span style="font-size:9px;color:#999;text-align:center">' + rodapeLabel + '</span>'
    + '<img src="' + LOGO_IO + '" style="height:22px;object-fit:contain">'
    + '</div>'
    + '</div>';
}

// ── NPS ───────────────────────────────────────────
function _pontSlideNPS(reg) {
  var dados = _pontNPS(reg);
  return '<div class="pont-slide">'
    + _pontSlideHeader("NPS - Pontualidade")
    + _pontRegLogo(reg)
    + '<div class="pont-slide-body">'
    + '<div style="flex:1;min-height:0"><canvas id="pont-chart-nps-'+reg+'"></canvas></div>'
    + '</div>'
    + _pontSlideFooter()
    + '</div>';
}

// ── Reclamacoes ───────────────────────────────────
function _pontSlideReclamacoes(reg) {
  var resumo  = _pontRecResumo(reg) || {};
  var total   = (resumo["[TotalReclamacoes]"]||0).toLocaleString("pt-BR");
  var atrasoP = (resumo["[TotalAtrasoPart]"]||0).toLocaleString("pt-BR");
  return '<div class="pont-slide">'
    + _pontSlideHeader("Reclamacoes - Atraso na Partida")
    + _pontRegLogo(reg)
    + '<div class="pont-slide-body">'
    + '<div style="display:flex;gap:12px;margin-bottom:8px;flex-shrink:0">'
    + '<div style="border:1.5px solid #e0e4ed;border-radius:8px;padding:8px 16px"><div style="font-size:9px;color:#888">Total</div><div style="font-size:20px;font-weight:700;color:#1d3061">'+total+'</div></div>'
    + '<div style="border:2px solid #1d3061;border-radius:8px;padding:8px 16px;background:#f0f3fb"><div style="font-size:9px;color:#888">Atraso na Partida</div><div style="font-size:20px;font-weight:700;color:#1d3061">'+atrasoP+'</div></div>'
    + '</div>'
    + '<div style="flex:1;min-height:0"><canvas id="pont-chart-rec-'+reg+'"></canvas></div>'
    + '</div>'
    + _pontSlideFooter()
    + '</div>';
}

// ── Top Horarios ──────────────────────────────────
function _pontSlideTopHorarios(reg) {
  var horarios = _pontTopHorarios(reg);
  var faixas   = _pontFaixas(reg);
  var badgeCor = "#c0392b"; var badgeBg = "#fdecea";

  var horRows = horarios.map(function(h) {
    return '<tr><td style="padding:5px 8px;font-size:10px;color:#1d3061;font-weight:600">' + (h["[ChaveVisual]"]||"-") + '</td>'
      + '<td style="padding:5px 6px;text-align:center;font-size:10px">' + (h["[QuantidadePartidas]"]||0) + '</td>'
      + '<td style="padding:5px 6px;text-align:center;font-size:10px;font-weight:700;color:#c0392b">' + (h["[PartidasAtrasadas]"]||0) + '</td>'
      + '<td style="padding:5px 6px;text-align:center;font-size:10px">' + (h["[PctPontual]"]||"-") + '</td></tr>';
  }).join("");

  var faixaOrder = {"Ate 30 min":1,"30 min a 1h":2,"1h a 2h":3,"Acima de 2h":4};
  var faixaRows = faixas.sort(function(a,b){return (faixaOrder[a["[Faixa]"]]||9)-(faixaOrder[b["[Faixa]"]]||9);})
    .map(function(f) {
      return '<tr><td style="padding:5px 10px;font-size:10px;color:#1d3061">' + (f["[Faixa]"]||f["[ChaveVisual]"]||"-") + '</td>'
        + '<td style="padding:5px 10px;text-align:right;font-size:10px;font-weight:700;color:#1d3061">' + (f["[PartidasAtrasadas]"]||0) + '</td></tr>';
    }).join("");

  return '<div class="pont-slide">'
    + _pontSlideHeader("Top 5 Horarios de Atraso")
    + _pontRegLogo(reg)
    + '<div class="pont-slide-body">'
    + '<div style="display:flex;gap:14px;flex:1;min-height:0">'
    + '<div style="flex:1;min-width:0">'
    + '<div style="font-size:12px;font-weight:700;color:#1d3061;margin-bottom:8px">Top 5 Horarios</div>'
    + '<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#1d3061;color:#fff">'
    + '<th style="padding:5px 8px;font-size:9px;text-align:left">Horario / Linha</th>'
    + '<th style="padding:5px 6px;font-size:9px;text-align:center">Partidas</th>'
    + '<th style="padding:5px 6px;font-size:9px;text-align:center">Atrasadas</th>'
    + '<th style="padding:5px 6px;font-size:9px;text-align:center">% Pontual</th>'
    + '</tr></thead><tbody>' + (horRows||'<tr><td colspan="4" style="text-align:center;color:#bbb;padding:10px">Sem dados</td></tr>') + '</tbody></table>'
    + '</div>'
    + '<div style="width:180px;flex-shrink:0">'
    + '<div style="font-size:12px;font-weight:700;color:#1d3061;margin-bottom:8px">Faixa de Atraso</div>'
    + '<table style="width:100%;border-collapse:collapse"><tbody>' + (faixaRows||"") + '</tbody></table>'
    + '</div>'
    + '</div>'
    + '</div>'
    + _pontSlideFooter()
    + '</div>';
}

// ── Top Motivos ───────────────────────────────────
function _pontSlideTopMotivos(reg) {
  var motivos = _pontTopMotivos(reg);
  var regData = _pontRegData(reg)||{};
  var totalAtr = regData["[Atrasadas]"]||0;
  var totalInf = motivos.reduce(function(a,m){return a+(m["[PartidasAtrasadas]"]||0);},0);

  var motivoRows = motivos.map(function(m) {
    return '<tr><td style="padding:6px 10px;font-size:10px;color:#1d3061">' + (m["[ChaveVisual]"]||"-") + '</td>'
      + '<td style="padding:6px 10px;text-align:center;font-size:11px;font-weight:700;color:#1d3061">' + (m["[PartidasAtrasadas]"]||0) + '</td></tr>';
  }).join("");

  return '<div class="pont-slide">'
    + _pontSlideHeader("Top 5 Motivos de Atraso")
    + _pontRegLogo(reg)
    + '<div class="pont-slide-body">'
    + '<div style="display:flex;gap:14px;flex:1;min-height:0">'
    + '<div style="flex:0 0 240px;display:flex;flex-direction:column;align-items:center;justify-content:center">'
    + '<canvas id="pont-chart-motivos-'+reg+'" style="max-width:220px;max-height:220px"></canvas>'
    + '</div>'
    + '<div style="flex:1;min-width:0;display:flex;flex-direction:column">'
    + '<div style="display:flex;gap:8px;margin-bottom:10px">'
    + '<div style="border:1.5px solid #1d3061;border-radius:8px;padding:8px 14px;background:#f0f3fb"><div style="font-size:9px;color:#888">Total Atrasadas</div><div style="font-size:18px;font-weight:700;color:#1d3061">'+totalAtr+'</div></div>'
    + '<div style="border:1.5px solid #e0e4ed;border-radius:8px;padding:8px 14px"><div style="font-size:9px;color:#888">Informado</div><div style="font-size:18px;font-weight:700;color:#1d3061">'+totalInf+' ('+(totalAtr>0?Math.round(totalInf/totalAtr*100):0)+'%)</div></div>'
    + '</div>'
    + '<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#1d3061;color:#fff">'
    + '<th style="padding:6px 10px;font-size:9px;text-align:left">Motivo</th>'
    + '<th style="padding:6px 10px;font-size:9px;text-align:center">Qtde</th>'
    + '</tr></thead><tbody>' + (motivoRows||'<tr><td colspan="2" style="text-align:center;color:#bbb;padding:10px">Sem dados</td></tr>') + '</tbody></table>'
    + '</div>'
    + '</div>'
    + '</div>'
    + _pontSlideFooter()
    + '</div>';
}

// ── Garagem ───────────────────────────────────────
function _pontSlideGaragem(reg) {
  var d    = _pontGarData(reg)||{};
  var emps = _pontGarEmpresas(reg);
  var tp   = d["[Partidas]"]||0;
  var tpt  = d["[Pontuais]"]||0;
  var ta   = d["[Atrasadas]"]||0;
  var ts   = d["[SemDados]"]||0;
  var base = tp - ts;
  var pct  = base>0 ? (tpt/base*100).toFixed(1)+"%" : "-";

  var empRows = emps.filter(function(e){ return e["[Empresa]"] && PONT_EMP_EXCLUIR.indexOf((e["[Empresa]"]||"").toUpperCase())<0; })
    .map(function(e,i) {
      var ep=e["[Partidas]"]||0, epo=e["[Pontuais]"]||0, esd=e["[SemDados]"]||0;
      var ebase=ep-esd; var epct=ebase>0?(epo/ebase*100).toFixed(1)+"%":"-";
      var bg = i%2===0?"#f5f7fb":"#fff";
      var logo = PONT_LOGOS[(e["[Empresa]"]||"").toUpperCase()];
      return '<tr style="background:'+bg+'"><td style="padding:3px 6px">'
        + (logo?'<img src="'+logo+'" style="height:14px;object-fit:contain;vertical-align:middle">':'<span style="font-size:9px">'+e["[Empresa]"]+'</span>')
        + '</td>'
        + '<td style="text-align:center;font-size:9px;color:#1d3061">'+ep.toLocaleString("pt-BR")+'</td>'
        + '<td style="text-align:center;font-size:9px;color:#1d3061">'+epo.toLocaleString("pt-BR")+'</td>'
        + '<td style="text-align:center;font-size:9px;color:#1d3061">'+(e["[Atrasadas]"]||0).toLocaleString("pt-BR")+'</td>'
        + '<td style="text-align:center;font-size:9px;font-weight:700;color:#1d3061">'+epct+'</td>'
        + '<td style="text-align:center;font-size:9px;color:#1d3061">'+esd.toLocaleString("pt-BR")+'</td></tr>';
    }).join("");

  return '<div class="pont-slide">'
    + _pontSlideHeader("Pontualidade - Garagem")
    + _pontRegLogo(reg)
    + '<div class="pont-slide-body">'
    + '<div style="display:flex;gap:5px;margin-bottom:8px;flex-shrink:0">'
    + _pontSlideKpiCard("Partidas", tp.toLocaleString("pt-BR"), "", "#4a90d9")
    + _pontSlideKpiCard("Pontuais", tpt.toLocaleString("pt-BR"), "", "#1a7a3c")
    + _pontSlideKpiCard("Atrasadas", ta.toLocaleString("pt-BR"), "", "#c0392b")
    + _pontSlideKpiCard("% Pontualidade", pct, "", "#1d3061")
    + _pontSlideKpiCard("Sem Dados", ts.toLocaleString("pt-BR"), "", "#888")
    + '</div>'
    + '<table style="width:100%;border-collapse:collapse;margin-bottom:8px;flex-shrink:0"><thead><tr style="background:#1d3061;color:#fff">'
    + '<th style="padding:4px 6px;font-size:8px;text-align:left">Empresa</th>'
    + '<th style="padding:4px 4px;font-size:8px;text-align:center">Partidas</th>'
    + '<th style="padding:4px 4px;font-size:8px;text-align:center">Pontuais</th>'
    + '<th style="padding:4px 4px;font-size:8px;text-align:center">Atrasadas</th>'
    + '<th style="padding:4px 4px;font-size:8px;text-align:center">% Pontual</th>'
    + '<th style="padding:4px 4px;font-size:8px;text-align:center">Sem Dados</th>'
    + '</tr></thead><tbody>'+(empRows||'<tr><td colspan="6" style="text-align:center;color:#bbb;padding:8px">Sem dados</td></tr>')+'</tbody></table>'
    + '<div style="font-size:10px;font-weight:700;color:#1d3061;flex-shrink:0;margin-bottom:4px">Periodo Diario - Partidas Sem Dados</div>'
    + '<div style="flex:1;min-height:0"><canvas id="pont-chart-gar-'+reg+'"></canvas></div>'
    + '</div>'
    + _pontSlideFooter()
    + '</div>';
}

// ── Entrega Rodoviaria ────────────────────────────
function _pontSlideEntregaRodov(reg) {
  var j = pontState.jsonParsed;
  var reg_d = null;
  if (j) { (j.EntregaRodoviaria||[]).forEach(function(r){ if(r["[TipoRegistro]"]==="ENT_KPI_REGIONAL"&&r["[Regional]"]===reg) reg_d=r; }); }
  if (!reg_d) return '<div class="pont-slide">'+_pontSlideHeader("Entrega na Rodoviari")+_pontSlideFooter()+'</div>';

  var tp=reg_d["[Partidas]"]||0, tpt=reg_d["[Pontuais]"]||0, ta=reg_d["[Atrasadas]"]||0, ts=reg_d["[SemDados]"]||0;
  var pct = (tp-ts)>0?(tpt/(tp-ts)*100).toFixed(1)+"%":"-";
  var emps = j?(j.EntregaRodoviaria||[]).filter(function(r){return r["[TipoRegistro]"]==="ENT_KPI_EMPRESA"&&r["[Regional]"]===reg&&r["[Empresa]"]&&PONT_EMP_EXCLUIR.indexOf((r["[Empresa]"]||"").toUpperCase())<0;}):[];

  var empRows = emps.map(function(e,i){
    var logo = PONT_LOGOS[(e["[Empresa]"]||"").toUpperCase()];
    var bg = i%2===0?"#f5f7fb":"#fff";
    return '<tr style="background:'+bg+'"><td style="padding:3px 6px">'
      + (logo?'<img src="'+logo+'" style="height:14px;object-fit:contain;vertical-align:middle">':'<span style="font-size:9px">'+e["[Empresa]"]+'</span>')
      + '</td>'
      + '<td style="text-align:center;font-size:9px">'+((e["[Partidas]"]||0)).toLocaleString("pt-BR")+'</td>'
      + '<td style="text-align:center;font-size:9px">'+((e["[Pontuais]"]||0)).toLocaleString("pt-BR")+'</td>'
      + '<td style="text-align:center;font-size:9px">'+((e["[Atrasadas]"]||0)).toLocaleString("pt-BR")+'</td>'
      + '<td style="text-align:center;font-size:9px;font-weight:700;color:#1d3061">'+(e["[PctPontual]"]||"-")+'</td></tr>';
  }).join("");

  return '<div class="pont-slide">'
    + _pontSlideHeader("Pontualidade - Entrega na Rodoviari")
    + _pontRegLogo(reg)
    + '<div class="pont-slide-body">'
    + '<div style="display:flex;gap:5px;margin-bottom:8px;flex-shrink:0">'
    + _pontSlideKpiCard("Partidas",tp.toLocaleString("pt-BR"),"","#4a90d9")
    + _pontSlideKpiCard("Pontuais",tpt.toLocaleString("pt-BR"),"","#1a7a3c")
    + _pontSlideKpiCard("Atrasadas",ta.toLocaleString("pt-BR"),"","#c0392b")
    + _pontSlideKpiCard("% Pontualidade",pct,"","#1d3061")
    + '</div>'
    + '<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#1d3061;color:#fff">'
    + '<th style="padding:4px 6px;font-size:8px;text-align:left">Empresa</th>'
    + '<th style="padding:4px 4px;font-size:8px;text-align:center">Partidas</th>'
    + '<th style="padding:4px 4px;font-size:8px;text-align:center">Pontuais</th>'
    + '<th style="padding:4px 4px;font-size:8px;text-align:center">Atrasadas</th>'
    + '<th style="padding:4px 4px;font-size:8px;text-align:center">% Pontual</th>'
    + '</tr></thead><tbody>'+(empRows||'<tr><td colspan="5" style="text-align:center;color:#bbb;padding:8px">Sem dados</td></tr>')+'</tbody></table>'
    + '</div>'
    + _pontSlideFooter()
    + '</div>';
}

// ================================================================
// GRAFICOS
// ================================================================
function _pontInitCharts(sl) {
  if (sl.tipo==="visao-acumulado") { _pontChartVisao("acumulado"); return; }
  if (sl.tipo==="visao-semanal")   { _pontChartVisao("semanal"); return; }
  if (sl.tipo==="nps")             { _pontChartNPS(sl.reg); return; }
  if (sl.tipo==="reclamacoes")     { _pontChartReclamacoes(sl.reg); return; }
  if (sl.tipo==="top-motivos")     { _pontChartMotivos(sl.reg); return; }
  if (sl.tipo==="garagem")         { _pontChartGaragem(sl.reg); return; }
}

function _pontReg(c) { if (!window._pontCharts) window._pontCharts=[]; window._pontCharts.push(c); }

function _pontChartVisao(tipo) {
  var id = "pont-chart-visao-" + tipo;
  var canvas = document.getElementById(id);
  if (!canvas) return;
  var slide  = pontState[tipo];
  var grafico = slide ? slide.grafico : [];
  var labels = grafico.map(function(g){return g.data||"";});
  var data   = grafico.map(function(g){return _pontParseN(g.pct)||null;});
  _pontReg(new Chart(canvas, {
    type:"line",
    data:{ labels:labels, datasets:[{ data:data, borderColor:"#4a7de8", backgroundColor:"rgba(74,125,232,.08)", tension:0.4, pointRadius:2, pointHoverRadius:4, borderWidth:2, fill:true }] },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, datalabels:{ display:true, anchor:"top", align:"top", color:"#1d3061", font:{size:9,weight:"700"}, formatter:function(v){return v?v+"%":""} } },
      scales:{ x:{ticks:{font:{size:9}}}, y:{display:false} },
      layout:{ padding:{top:18} }
    },
    plugins:[ChartDataLabels]
  }));
}

function _pontChartNPS(reg) {
  var canvas = document.getElementById("pont-chart-nps-"+reg);
  if (!canvas || !pontState.jsonParsed) return;
  var dados = _pontNPS(reg);
  if (!dados.length) return;
  var mNome = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  var marcas = {};
  dados.forEach(function(d){ var m=d["[Marca]"]||""; if(!marcas[m]) marcas[m]={}; marcas[m][d["[Mes]"]]=Math.round(d["[ScoreNPS]"]||0); });
  var meses=[]; dados.forEach(function(d){if(meses.indexOf(d["[Mes]"])<0)meses.push(d["[Mes]"]);});
  meses.sort(function(a,b){return a-b;});
  var cores=["#4a7de8","#03a5a5","#e67e22","#9e9e9e"];
  var datasets = Object.keys(marcas).map(function(m,i){
    return { label:m, data:meses.map(function(mes){return marcas[m][mes]||null;}), borderColor:cores[i%cores.length], backgroundColor:cores[i%cores.length]+"18", fill:true, tension:0.4, pointRadius:5, borderWidth:2 };
  });
  _pontReg(new Chart(canvas, {
    type:"line", data:{ labels:meses.map(function(m){return mNome[m-1]||m;}), datasets:datasets },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:"bottom",labels:{font:{size:10},usePointStyle:true,pointStyle:"circle"}},
        datalabels:{display:true,anchor:"top",align:"top",color:function(ctx){return ctx.dataset.borderColor;},font:{size:10,weight:"700"},formatter:function(v){return v||"";}} },
      scales:{ x:{ticks:{font:{size:10}}}, y:{display:false} }, layout:{padding:{top:20}}
    }, plugins:[ChartDataLabels]
  }));
}

function _pontChartReclamacoes(reg) {
  var canvas = document.getElementById("pont-chart-rec-"+reg);
  if (!canvas || !pontState.jsonParsed) return;
  var dados = _pontRecMensal(reg);
  if (!dados.length) return;
  var mNome=["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  var empresas={};
  dados.forEach(function(d){ var e=d["[Empresa]"]||"-"; if(!empresas[e])empresas[e]={}; empresas[e][d["[Mes]"]]=d["[TotalAtrasoPart]"]||0; });
  var meses=[]; dados.forEach(function(d){if(meses.indexOf(d["[Mes]"])<0)meses.push(d["[Mes]"]);});
  meses.sort(function(a,b){return a-b;});
  var cores=["#1d3061","#c0392b","#4a90d9","#03a5a5","#e67e22"];
  var datasets = Object.keys(empresas).map(function(e,i){
    return { label:e, data:meses.map(function(m){return empresas[e][m]||0;}), backgroundColor:cores[i%cores.length] };
  });
  _pontReg(new Chart(canvas, {
    type:"bar", data:{ labels:meses.map(function(m){return mNome[m-1]||m;}), datasets:datasets },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:"bottom",labels:{font:{size:9},usePointStyle:true,pointStyle:"rect"}},
        datalabels:{display:true,anchor:"end",align:"top",color:function(ctx){return ctx.dataset.backgroundColor;},font:{size:9,weight:"700"},formatter:function(v){return v>0?v:"";}} },
      scales:{ x:{ticks:{font:{size:9}},grid:{display:false}}, y:{display:false} }, layout:{padding:{top:16}}
    }, plugins:[ChartDataLabels]
  }));
}

function _pontChartMotivos(reg) {
  var canvas = document.getElementById("pont-chart-motivos-"+reg);
  if (!canvas || !pontState.jsonParsed) return;
  var motivos = _pontTopMotivos(reg);
  if (!motivos.length) return;
  var cores=["#5b9df9","#1d3061","#4a7de8","#03a5a5","#e67e22"];
  _pontReg(new Chart(canvas, {
    type:"doughnut",
    data:{ labels:motivos.map(function(m){return m["[ChaveVisual]"]||"-";}), datasets:[{data:motivos.map(function(m){return m["[PartidasAtrasadas]"]||0;}),backgroundColor:cores}] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, datalabels:{display:true,color:"#fff",font:{size:10,weight:"700"},formatter:function(v,ctx){var t=ctx.dataset.data.reduce(function(a,b){return a+b;},0);return t>0?(v/t*100).toFixed(1)+"%":"";}} }
    }, plugins:[ChartDataLabels]
  }));
}

function _pontChartGaragem(reg) {
  var canvas = document.getElementById("pont-chart-gar-"+reg);
  if (!canvas || !pontState.jsonParsed) return;
  var j = pontState.jsonParsed;
  var dias = (j.Garagem||[]).filter(function(r){return r["[TipoRegistro]"]==="GAR_KPI_DIARIO"&&r["[Regional]"]===reg;}).sort(function(a,b){return a["[Data]"]>b["[Data]"]?1:-1;});
  if (!dias.length) return;
  _pontReg(new Chart(canvas, {
    type:"line",
    data:{ labels:dias.map(function(d){var p=d["[Data]"].split("/");return p[0]+"/"+p[1];}), datasets:[{data:dias.map(function(d){return d["[SemDados]"]||0;}),borderColor:"#4a7de8",backgroundColor:"rgba(74,125,232,.08)",tension:0.3,pointRadius:4,borderWidth:2}] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, datalabels:{display:true,anchor:"top",align:"top",color:"#1d3061",font:{size:9,weight:"700"}} },
      scales:{ x:{ticks:{font:{size:9}}}, y:{display:false} }, layout:{padding:{top:18}}
    }, plugins:[ChartDataLabels]
  }));
}

// ── Helpers JSON ──────────────────────────────────
function _pontRegData(reg) {
  var j=pontState.jsonParsed; if(!j) return null;
  var f=null; (j.ResumoPontualidade||[]).forEach(function(r){if(r["[TipoRegistro]"]==="KPI_REGIONAL"&&r["[Regional]"]===reg)f=r;}); return f;
}
function _pontTopHorarios(reg) {
  var j=pontState.jsonParsed; if(!j) return [];
  return (j.OperacionalRodoviario||[]).filter(function(r){return r["[TipoRegistro]"]==="TOP_HORARIO"&&r["[Regional]"]===reg;}).sort(function(a,b){return (a["[Ranking]"]||99)-(b["[Ranking]"]||99);});
}
function _pontTopMotivos(reg) {
  var j=pontState.jsonParsed; if(!j) return [];
  return (j.OperacionalRodoviario||[]).filter(function(r){return r["[TipoRegistro]"]==="TOP_MOTIVO"&&r["[Regional]"]===reg;}).sort(function(a,b){return (a["[Ranking]"]||99)-(b["[Ranking]"]||99);});
}
function _pontFaixas(reg) {
  var j=pontState.jsonParsed; if(!j) return [];
  return (j.OperacionalRodoviario||[]).filter(function(r){return r["[TipoRegistro]"]==="FAIXA_ATRASO"&&r["[Regional]"]===reg;});
}
function _pontNPS(reg) {
  var j=pontState.jsonParsed; if(!j) return [];
  return (j.NPS||[]).filter(function(r){return r["[TipoRegistro]"]==="NPS_MENSAL_EMPRESA"&&r["[Regional]"]===reg;});
}
function _pontRecMensal(reg) {
  var j=pontState.jsonParsed; if(!j) return [];
  return (j.Reclamacoes||[]).filter(function(r){return r["[TipoRegistro]"]==="REC_MENSAL"&&r["[Regional]"]===reg;});
}
function _pontRecResumo(reg) {
  var j=pontState.jsonParsed; if(!j) return null;
  var f=null; (j.Reclamacoes||[]).forEach(function(r){if(r["[TipoRegistro]"]==="REC_RESUMO"&&r["[Regional]"]===reg)f=r;}); return f;
}
function _pontGarData(reg) {
  var j=pontState.jsonParsed; if(!j) return null;
  var f=null; (j.Garagem||[]).forEach(function(r){if(r["[TipoRegistro]"]==="GAR_KPI_REGIONAL"&&r["[Regional]"]===reg)f=r;}); return f;
}
function _pontGarEmpresas(reg) {
  var j=pontState.jsonParsed; if(!j) return [];
  return (j.Garagem||[]).filter(function(r){return r["[TipoRegistro]"]==="GAR_KPI_EMPRESA"&&r["[Regional]"]===reg&&r["[Empresa]"];});
}

// ================================================================
// IMPORTAR IMAGEM VIA CLAUDE API
// ================================================================
// ================================================================
// FIREBASE
// ================================================================
function _pontSalvarFirebase() {
  var s=pontState, db=firebase.firestore();
  var docId = s.dataInicio.replace(/-/g,"")+"_"+s.dataFim.replace(/-/g,"");
  var btn = document.querySelector("[data-pont-action='pont-salvar-firebase']");
  if (btn){btn.textContent="Salvando...";btn.disabled=true;}
  db.collection("pontualidade_semanal").doc(docId).set({
    dataInicio:s.dataInicio, dataFim:s.dataFim, analista:s.analista,
    acumulado:s.acumulado, semanal:s.semanal,
    jsonRaw: s.jsonRaw||"",
    savedAt:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    if(btn){btn.textContent="Salvo!";setTimeout(function(){if(btn){btn.textContent="Salvar";btn.disabled=false;}},2000);}
  }).catch(function(e){
    if(btn){btn.textContent="Erro";btn.disabled=false;} console.error("Firebase [pont]:",e);
  });
}

// ================================================================
// PDF
// ================================================================
function _pontGerarPDF() {
  var s=pontState;
  var btn=document.querySelector("[data-pont-action='pont-gerar-pdf']");
  if(btn){btn.textContent="Gerando...";btn.disabled=true;}
  var pdf=new jspdf.jsPDF({orientation:"landscape",unit:"mm",format:[270,152]});

  // Remove preview frame do DOM para evitar conflito de canvas IDs
  var previewFrame = document.getElementById("pont-slide-frame");
  if (previewFrame) previewFrame.innerHTML = "";

  var div=document.createElement("div");
  div.style.cssText="position:fixed;left:-9999px;top:0;width:960px;height:540px;overflow:hidden;background:#fff;z-index:-1";

  // Copia os estilos da página para o div do PDF
  var styleEl = document.createElement("style");
  styleEl.textContent = [
    ".pont-slide{width:960px;height:540px;position:relative;background:#fff;font-family:'Segoe UI',Arial,sans-serif;overflow:hidden;display:flex;flex-direction:column;box-sizing:border-box}",
    ".pont-slide-header{padding:12px 20px 0;flex-shrink:0}",
    ".pont-slide-header__row{display:flex;align-items:center;justify-content:space-between}",
    ".pont-slide-header__modulo{font-size:11px;color:#bbb;letter-spacing:1px}",
    ".pont-slide-header__line{height:2px;background:#1d3061;margin:6px 0 4px}",
    ".pont-slide-body{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 20px 4px;overflow:hidden}",
    ".pont-slide-footer{display:flex;align-items:center;justify-content:space-between;padding:4px 20px 8px;flex-shrink:0}",
    ".pont-slide-footer__text{font-size:9px;color:#888}",
    ".pont-slide-footer__periodo{font-size:9px;color:#c0392b;font-style:italic}",
    ".pont-slide-capa{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}",
    ".pont-slide-capa .logos-row{display:flex;align-items:center;gap:20px}",
    ".pont-slide-capa .sep{width:1px;height:40px;background:#ddd}",
    ".pont-slide-capa .titulo{font-size:32px;font-weight:700;color:#1d3061}",
    ".pont-slide-capa .subtitulo{font-size:14px;color:#888}",
    ".pont-slide-divisor{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1d3061}",
    ".pont-slide-divisor .div-titulo{font-size:14px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:3px;text-transform:uppercase}",
    ".pont-slide-divisor .div-sub{font-size:28px;font-weight:700;color:#fff;margin-top:8px}",
    ".pont-reg-logo{position:absolute;top:10px;right:20px;height:36px;object-fit:contain}",
    ".pont-rodape-autor{position:absolute;bottom:8px;left:20px;font-size:9px;color:#888}"
  ].join("");
  div.appendChild(styleEl);

  document.body.appendChild(div);
  if(window._pontChartsPDF){window._pontChartsPDF.forEach(function(c){try{c.destroy();}catch(e){}});}
  window._pontChartsPDF=[];
  var idx=0;
  function _next(){
    if(idx>=s.slides.length){
      document.body.removeChild(div);
      pdf.save("Pontualidade_"+s.labelInicio.replace("/","-")+"_"+s.labelFim.replace("/","-")+".pdf");
      if(btn){btn.textContent="PDF";btn.disabled=false;} return;
    }
    var sl=s.slides[idx];
    if(window._pontChartsPDF.length){window._pontChartsPDF.forEach(function(c){try{c.destroy();}catch(e){}});window._pontChartsPDF=[];}
    var orig=window._pontCharts; window._pontCharts=window._pontChartsPDF;
    var slideDiv=document.createElement("div");
    slideDiv.style.cssText="width:960px;height:540px;position:relative;overflow:hidden";
    slideDiv.innerHTML=_pontSlideHTML(sl);
    div.appendChild(slideDiv);
    _pontInitCharts(sl);
    window._pontChartsPDF=window._pontCharts; window._pontCharts=orig;
    var delay = (sl.tipo==="visao-acumulado"||sl.tipo==="visao-semanal"||sl.tipo==="nps"||sl.tipo==="reclamacoes"||sl.tipo==="top-motivos"||sl.tipo==="garagem") ? 600 : 200;
    setTimeout(function(){
      html2canvas(slideDiv,{scale:4,useCORS:true,allowTaint:true,backgroundColor:"#ffffff",logging:false,width:960,height:540}).then(function(c){
        var img=c.toDataURL("image/jpeg",0.98);
        if(idx>0) pdf.addPage([270,152],"landscape");
        pdf.addImage(img,"JPEG",0,0,270,152);
        div.removeChild(slideDiv);
        idx++; _next();
      }).catch(function(e){ console.warn("PDF slide err",e); div.removeChild(slideDiv); idx++;_next();});
    },delay);
  }
  _next();
}