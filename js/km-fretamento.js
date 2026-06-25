// ═══════════════════════════════════════════════════════════════
// km-fretamento.js — Módulo KM Fretamento (estado, slides, PDF)
// ═══════════════════════════════════════════════════════════════

// ── Constantes do módulo ─────────────────────────────────────
var KM_META_OCIOSO = 10; // % meta de KM improdutivo

// ── URL do Apps Script (substitua após publicar) ──────────────
var KM_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzTy402K5B6wVm_46igEV64nnk5u34PVtWdDowUzGvadUEc3MA5MY0teguXwEaLT2W5/exec";


var KM_EMPRESAS = [
  {
    id:    "grupo",
    label: "Grupo JCA",
    logo:  "https://res.cloudinary.com/dln0ctawv/image/upload/v1779238658/JCA_1_mp1ic7.png",
    barColor: "#5b7ec9",
    lightColor: "rgba(91,126,201,.25)",
    tabClass: "",
  },
  {
    id:    "1001",
    label: "1001",
    logo:  "https://res.cloudinary.com/dln0ctawv/image/upload/v1779671790/1001_qisjtr_1_pzpzqw.png",
    barColor: "#9e9e9e",
    lightColor: "rgba(158,158,158,.3)",
    tabClass: "km-tab-btn--1001",
  },
  {
    id:    "cat",
    label: "Catarinense",
    logo:  "https://res.cloudinary.com/dln0ctawv/image/upload/v1779671813/AVC_zk4pe9_k4jgau.png",
    barColor: "#03a5a5",
    lightColor: "rgba(3,165,165,.3)",
    tabClass: "km-tab-btn--cat",
  },
  {
    id:    "com",
    label: "Cometa",
    logo:  "https://res.cloudinary.com/dln0ctawv/image/upload/v1779671826/COM_folzln_ddghpr.png",
    barColor: "#1d3061",
    lightColor: "rgba(29,48,97,.2)",
    tabClass: "km-tab-btn--com",
  },
  {
    id:    "opc",
    label: "Opção",
    logo:  "https://res.cloudinary.com/dln0ctawv/image/upload/v1781452705/Op%C3%A7%C3%A3o_ztgpnc_fq3ibu.png",
    barColor: "#b5d94a",
    lightColor: "rgba(181,217,74,.35)",
    tabClass: "km-tab-btn--opc",
  },
];

// ── Estado global do módulo ───────────────────────────────────
var kmState = null;

function _kmInitEmpresa() {
  return {
    fteFrota:      "",
    fteMotoristas: "",
    kmProdMes:     "",   // KM produtivo do mês atual
    kmImprodMes:   "",   // KM improdutivo do mês atual
    fator:         "",   // fator motoristas/frota
    custo:         "",   // campo texto livre (custo da ociosidade)
    // histórico mensal (12 meses): { prod, improd }
    meses: Object.fromEntries(MESES.map(function(m) { return [m, { prod: "", improd: "" }]; })),
    // tabela de contratos improdutivos: [{ nome, pctAnterior, pctAtual }]
    contratos: [],
    // plano de ação (texto livre — complementado via Firebase plano-de-acao)
    planoAcao: "",
  };
}

function _kmInitState() {
  var dados = {};
  KM_EMPRESAS.forEach(function(e) { dados[e.id] = _kmInitEmpresa(); });
  return {
    screen:    "km",
    step:      1,
    mes:       MESES[(_now.getMonth() + 11) % 12],
    mesIdx:    (_now.getMonth() + 11) % 12,
    ano:       _prevAno,
    analista:  state.analista || "",
    tabAtiva:  "grupo",
    slideIdx:  0,
    slides:    [],
    dados:     dados,
    metaOcioso: "10",
    evolGrupo: Object.fromEntries(MESES.map(function(m) { return [m, { prod: "", improd: "" }]; })),
    dataAtualizacao: "",
    _fbNotif:  null,
  };
}

// ── Monta sequência de slides ─────────────────────────────────
function _kmBuildSlides() {
  var slides = [{ type: "cover" }];
  // Slide resumo grupo
  slides.push({ type: "resumo-grupo" });
  // Slide evolução KM do grupo (todas as empresas no mesmo gráfico não existe no modelo — é por empresa)
  // Slide evolução KM — GRUPO (soma das empresas)
  slides.push({ type: "evolucao", emp: "grupo" });
  // Por empresa (sem grupo): Operação → Evolução → KM Improdutivo → Plano
  ["1001","cat","com","opc"].forEach(function(id) {
    slides.push({ type: "operacao",   emp: id });
    slides.push({ type: "evolucao",   emp: id });
    slides.push({ type: "improdutivo", emp: id });
    slides.push({ type: "plano",      emp: id });
  });
  slides.push({ type: "contra-capa" });
  return slides;
}

// ── Iniciar módulo ────────────────────────────────────────────
function startKmFretamento() {
  kmState = _kmInitState();
  kmState.slides = _kmBuildSlides();
  _kmRender();
}

// ── Render principal ──────────────────────────────────────────
function _kmRender() {
  var app = document.getElementById("app");
  _kmDestroyCharts();
  if (kmState.step === 1) { app.innerHTML = _kmStep1HTML(); return; }
  if (kmState.step === 2) {
    app.innerHTML = _kmStep2HTML();
    if (kmState.tabAtiva === 'grupo') setTimeout(_kmInitGrupoPreviewChart, 80);
    return;
  }
  if (kmState.step === 3) { app.innerHTML = _kmStep3HTML(); _kmRenderCurrentSlide(); return; }
}

// ═══════════════════════════════════════════════
// STEP 1 — Seleção de período
// ═══════════════════════════════════════════════
function _kmStep1HTML() {
  var mesOpts = MESES.map(function(m, i) {
    return '<option value="' + m + '"' + (m === kmState.mes ? " selected" : "") + '>' + m + '</option>';
  }).join("");
  var anoOpts = ANOS.map(function(a) {
    return '<option value="' + a + '"' + (a === kmState.ano ? " selected" : "") + '>' + a + '</option>';
  }).join("");
  return _kmNavHTML(1) + '<div class="step-month"><div class="step-month__card">'
    + '<div class="step-month__title">KM Fretamento</div>'
    + '<div class="step-month__subtitle">Selecione o período da apresentação</div>'
    + '<div class="step-month__field"><label class="field-label">Mês de referência</label>'
    + '<select class="field-select" data-km-root="mes">' + mesOpts + '</select></div>'
    + '<div class="step-month__field"><label class="field-label">Ano</label>'
    + '<select class="field-select" data-km-root="ano">' + anoOpts + '</select></div>'
    + '<div class="step-month__field"><label class="field-label">Analista</label>'
    + '<input class="field-input" type="text" placeholder="Nome do analista" value="' + (kmState.analista || "") + '" data-km-root="analista"></div>'
    + '<button class="btn btn--primary step-month__btn" data-km-action="go-step" data-km-step="2">Próximo →</button>'
    + '</div></div>';
}

// ═══════════════════════════════════════════════
// STEP 2 — Preenchimento de dados
// ═══════════════════════════════════════════════
function _kmStep2HTML() {
  var mesIdx = MESES.indexOf(kmState.mes);
  var mesLabel = MESES_FULL[mesIdx] + " / " + kmState.ano;

  var tabs = KM_EMPRESAS.map(function(e) {
    var active = kmState.tabAtiva === e.id ? " active" : "";
    return '<button class="km-tab-btn ' + e.tabClass + active + '" data-km-action="set-tab" data-km-tab="' + e.id + '">' + e.label + '</button>';
  }).join("");
  tabs += '<button class="km-tab-btn' + (kmState.tabAtiva === 'plano' ? ' active' : '') + '" '
    + 'style="border-color:var(--navy)" data-km-action="set-tab" data-km-tab="plano">&#128203; Plano de A&ccedil;&atilde;o</button>';

  var panel = kmState.tabAtiva === 'plano'
    ? _kmPlanoPanelHTML()
    : _kmEmpresaPanelHTML(kmState.tabAtiva, mesIdx);

  return '<nav class="nav">'
    + '<div class="nav__left">'
    +   '<button class="btn btn--ghost" data-km-action="go-home">&#8592; In&iacute;cio</button>'
    +   '<span class="nav__title">KM Fretamento</span>'
    +   '<span class="nav__period">' + kmState.mes + '/' + kmState.ano + '</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:8px">'
    +   '<button class="btn btn--ghost" data-km-action="km-importar-sheets" style="padding:3px 12px;font-size:11px;background:rgba(52,168,83,.25);border-color:rgba(52,168,83,.5)" id="btn-km-sheets">&#128202; Importar Sheets</button>'
    +   '<button class="btn btn--ghost" data-km-action="km-importar-planos" style="padding:3px 12px;font-size:11px">&#128203; Importar Planos de A&ccedil;&atilde;o</button>'
    +   '<button class="btn btn--ghost" id="btn-km-salvar" data-km-action="km-salvar-firebase" style="padding:3px 12px;font-size:11px;background:rgba(66,133,244,.25)">&#9729;&#65039; Salvar</button>'
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
    +       '<p class="step-data__sub">Preencha os dados de cada empresa</p>'
    +     '</div>'
    +     '<span style="background:var(--navy);color:#fff;font-weight:700;font-size:13px;padding:6px 14px;border-radius:8px">' + kmState.mes + '/' + kmState.ano + '</span>'
    +   '</div>'
    +   '<div style="margin:8px 0 4px"><span style="font-size:10px;font-weight:700;color:#aaa;letter-spacing:1px">EMPRESA</span></div>'
    +   '<div class="km-tabs-empresa">' + tabs + '</div>'
    +   (kmState.tabAtiva === 'grupo'
    ?   '<div style="display:flex;gap:20px;flex:1;min-height:0;margin-top:8px">'
    +     '<div style="flex:0 0 58%;overflow-y:auto;min-width:0" data-km-grupo-painel>' + panel + '</div>'
    +     '<div style="flex:1;background:#fff;border-radius:12px;padding:16px;border:1px solid #eee;display:flex;flex-direction:column;overflow-y:auto" data-km-grupo-preview>'
    +       _kmGrupoPreviewHTML()
    +     '</div>'
    +   '</div>'
    : kmState.tabAtiva === 'plano'
    ?   '<div style="flex:1;min-height:0;overflow-y:auto;padding:0 8px;margin-top:8px">' + panel + '</div>'
    :   '<div style="display:flex;gap:20px;flex:1;min-height:0;margin-top:8px">'
    +     '<div style="flex:0 0 50%;overflow-y:auto;min-width:0">' + panel + '</div>'
    +     '<div style="flex:1;background:#fff;border-radius:12px;padding:16px;border:1px solid #eee;display:flex;align-items:center;justify-content:center">'
    +       '<div style="color:#bbb;font-size:12px;text-align:center">Preview dispon&iacute;vel no Step 3</div>'
    +     '</div>'
    +   '</div>')
    +   '<div style="display:flex;justify-content:space-between;padding-top:12px;margin-top:auto;flex-shrink:0;border-top:1px solid #eee">'
    +     '<button class="btn btn--ghost" data-km-action="go-step" data-km-step="1">&#8592; Voltar</button>'
    +     '<button class="btn btn--primary" data-km-action="go-step" data-km-step="3">Visualizar Apresenta&ccedil;&atilde;o &#8594;</button>'
    +   '</div>'
    + '</div>';
}

function _kmEmpresaPanelHTML(empId, mesIdx) {
  var d = kmState.dados[empId];
  var isGrupo = empId === "grupo";
  var html = "";

  // ── Aba Grupo: tabela resumo ao vivo ──
  if (isGrupo) {
    return _kmGrupoTabelaHTML();
  }

  // ── KPIs do mês ──
  html += '<div class="card">';
  html += '<div class="section-title">Dados do Mês</div>';
  html += '<div class="kpi-grid">';
  html += _kmField("FTE Frota",      "fteFrota",      d.fteFrota,      empId);
  html += _kmField("FTE Motoristas", "fteMotoristas", d.fteMotoristas, empId);
  html += _kmField("Fator (Mot/Frota)", "fator", d.fator, empId);
  html += _kmField("KM Produtivo",   "kmProdMes",   d.kmProdMes,   empId);
  html += _kmField("KM Improdutivo", "kmImprodMes", d.kmImprodMes, empId);
  html += _kmField("Custo*",         "custo",       d.custo,       empId, "R$ 0,00");
  html += '</div></div>';

  // ── Histórico mensal ──
  html += '<div class="card"><div class="section-title">Evolução KM ' + kmState.ano + '</div>';
  html += '<div class="km-secao-titulo" style="margin-top:0">KM Produtivo</div>';
  html += _kmMesesGridHTML(empId, "prod", mesIdx, d);
  html += '<div class="km-secao-titulo">KM Improdutivo</div>';
  html += _kmMesesGridHTML(empId, "improd", mesIdx, d);
  html += '</div>';

  // ── Contratos (só para empresas, não grupo) ──
  if (!isGrupo) {
    html += '<div class="card"><div class="section-title">KM Improdutivo por Contrato</div>';
    html += '<p class="km-contratos-hint">Informe o % de improdutiva de cada contrato no mês anterior e no mês atual</p>';
    html += '<div class="km-contratos-grid">';
    html += '<div class="hd">Contrato</div><div class="hd" style="text-align:center">' + (MESES[(MESES.indexOf(kmState.mes) + 11) % 12]) + '</div>';
    html += '<div class="hd" style="text-align:center">' + kmState.mes + '</div><div></div>';
    (d.contratos || []).forEach(function(c, i) {
      html += '<input class="field-input" style="font-size:12px;padding:5px 7px" placeholder="Nome do contrato" '
            + 'value="' + (c.nome || "") + '" data-km-contrato="' + empId + '" data-km-ci="' + i + '" data-km-cf="nome">';
      html += '<input class="field-input" style="font-size:12px;padding:5px 7px;text-align:center" placeholder="0%" '
            + 'value="' + (c.pctAnterior || "") + '" data-km-contrato="' + empId + '" data-km-ci="' + i + '" data-km-cf="pctAnterior">';
      html += '<input class="field-input" style="font-size:12px;padding:5px 7px;text-align:center" placeholder="0%" '
            + 'value="' + (c.pctAtual || "") + '" data-km-contrato="' + empId + '" data-km-ci="' + i + '" data-km-cf="pctAtual">';
      html += '<button class="km-btn-remove" data-km-action="rm-contrato" data-km-emp="' + empId + '" data-km-ci="' + i + '">×</button>';
    });
    html += '</div>';
    html += '<button class="km-btn-add-contrato" data-km-action="add-contrato" data-km-emp="' + empId + '">+ Adicionar contrato</button>';
    html += '</div>';

    // ── Plano de ação ──
    html += '<div class="card"><div class="section-title">Plano de Ação</div>';
    html += '<div class="km-plano-field"><label>Ações (uma por linha)</label>';
    html += '<textarea rows="5" placeholder="Ação 1;&#10;Ação 2;" data-km-field="planoAcao" data-km-emp="' + empId + '">'
           + (d.planoAcao || "") + '</textarea></div>';
    html += '</div>';
  }

  return html;
}

// ── Altura do logo por empresa (ajuste individual aqui) ─────
function _kmLogoHeight(id) {
  var heights = {
    'grupo': '24px',
    '1001':  '24px',
    'cat':   '24px',
    'com':   '24px',
    'opc':   '40px',  // ← ajuste aqui o tamanho da Opção
  };
  return heights[id] || '24px';
}

// ── Tabela editável Grupo JCA (aba Grupo no Step 2) ──────────
function _kmGrupoTabelaHTML() {
  var mesIdx  = MESES.indexOf(kmState.mes);
  var mesFull = MESES_FULL[mesIdx] + " / " + kmState.ano;
  var meta    = parseN(kmState.metaOcioso || "10");
  var linhas  = ["1001","cat","com","opc"];

  function pN(v){ return parseN(v||"0"); }
  function fmtDec(v){ return v>0 ? v.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1}) : "—"; }
  function fmtN(v){ return v>0 ? v.toLocaleString("pt-BR") : "—"; }
  function percStr(p){ return p>0 ? p.toFixed(1)+"%" : "—"; }
  function percCor(p){ return p<=0 ? "#555" : p>meta ? "#c0392b" : "#27ae60"; }

  // Soma Grupo
  var somaF=0,somaM=0,somaP=0,somaI=0;
  linhas.forEach(function(id){
    var d=kmState.dados[id];
    somaF+=pN(d.fteFrota); somaM+=pN(d.fteMotoristas);
    somaP+=pN(d.kmProdMes); somaI+=pN(d.kmImprodMes);
  });
  var somaT=somaP+somaI, somaPerc=somaT>0?(somaI/somaT*100):0;

  function cellRO(val,cor){
    return '<td style="padding:8px 10px;text-align:center;border-bottom:1px solid #e8ecf2">'
      +'<div style="background:#eef1f8;border-radius:5px;padding:5px 6px;font-weight:700;font-size:12px;color:'+(cor||"#1d3061")+'">'+(val||"—")+'</div></td>';
  }
  function cellInp(field,val,empId){
    return '<td style="padding:5px 8px;border-bottom:1px solid #f0f0f0">'
      +'<input class="field-input" style="font-size:12px;padding:4px 6px;text-align:center;min-width:70px"'
      +' value="'+(val||"")+'" placeholder="0"'
      +' data-km-field="'+field+'" data-km-emp="'+empId+'"></td>';
  }

  // Linha Grupo (soma)
  var grupoRow = '<tr style="background:#f4f6fb">'
    +'<td style="padding:9px 12px;text-align:center;border-bottom:2px solid #d0d8eb"><img src="'+KM_EMPRESAS[0].logo+'" style="height:'+_kmLogoHeight('grupo')+';width:auto;object-fit:contain;display:block;margin:0 auto"></td>'
    +cellRO(fmtDec(somaF))
    +cellRO(fmtDec(somaM))
    +cellRO(fmtN(somaP))
    +cellRO(fmtN(somaI))
    +cellRO(fmtN(somaT))
    +cellRO(percStr(somaPerc), percCor(somaPerc))
    +'<td style="padding:5px 8px;border-bottom:2px solid #d0d8eb">'
    +'<input class="field-input" style="font-size:12px;padding:4px 6px;text-align:center;min-width:70px;color:#c0392b;font-weight:700"'
    +' value="'+(kmState.dados["grupo"].custo||"")+'" placeholder="R$"'
    +' data-km-field="custo" data-km-emp="grupo"></td>'
    +'</tr>';

  // Linhas empresas
  var empRows = linhas.map(function(id){
    var d=kmState.dados[id];
    var e=KM_EMPRESAS.find(function(x){return x.id===id;});
    var prod=pN(d.kmProdMes),improd=pN(d.kmImprodMes),total=prod+improd,perc=total>0?(improd/total*100):0;
    return '<tr>'
      +'<td style="padding:7px 12px;text-align:center;border-bottom:1px solid #f0f0f0">'
      +'<img src="'+e.logo+'" style="height:'+_kmLogoHeight(e.id)+';width:auto;object-fit:contain;display:block;margin:0 auto"></td>'
      +cellInp("fteFrota",d.fteFrota,id)
      +cellInp("fteMotoristas",d.fteMotoristas,id)
      +cellInp("kmProdMes",d.kmProdMes,id)
      +cellInp("kmImprodMes",d.kmImprodMes,id)
      +'<td style="padding:7px 10px;text-align:center;font-weight:700;font-size:12px;color:#1d3061;border-bottom:1px solid #f0f0f0">'+fmtN(total)+'</td>'
      +'<td style="padding:7px 10px;text-align:center;font-weight:700;font-size:12px;color:'+percCor(perc)+';border-bottom:1px solid #f0f0f0">'+percStr(perc)+'</td>'
      +cellInp("custo",d.custo,id)
      +'</tr>';
  }).join("");

  // Tabela principal
  var thStyle = 'style="padding:8px 10px;text-align:center;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.3px"';
  var tabela = '<div style="overflow-x:auto">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'
    +'<div style="font-size:13px;font-weight:700;color:#1d3061">KM Fretamento | '+mesFull+'</div>'
    +'<div style="display:flex;align-items:center;gap:8px">'
    +'<span style="font-size:11px;font-weight:700;color:#888">Meta Ocioso:</span>'
    +'<input class="field-input" style="width:64px;font-size:12px;padding:4px 8px;text-align:center;color:#c0392b;font-weight:700;border-color:#f5c6c6"'
    +' value="'+(kmState.metaOcioso||"10")+'" placeholder="10" data-km-root="metaOcioso">%'
    +'</div></div>'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px">'
    +'<thead><tr style="background:#1d3061">'
    +'<th style="padding:8px 12px;text-align:left;color:#fff;font-size:10px;font-weight:700;width:100px">Empresa</th>'
    +'<th '+thStyle+'>FTE Frota</th>'
    +'<th '+thStyle+'>FTE Motoristas</th>'
    +'<th '+thStyle+'>KM Produtivo</th>'
    +'<th '+thStyle+'>KM Improdutivo</th>'
    +'<th '+thStyle+'>KM Total</th>'
    +'<th '+thStyle+'>% Improdutiva</th>'
    +'<th '+thStyle+'>Custo*</th>'
    +'</tr></thead>'
    +'<tbody>'+grupoRow+empRows+'</tbody>'
    +'</table>'
    +'<p style="font-size:10px;color:#888;font-style:italic;margin-top:8px">*O custo refere-se ao índice de ociosidade em comparação à meta de '+(kmState.metaOcioso||"10")+'%, indicando variações acima ou abaixo do parâmetro estabelecido.</p>'
    +'</div>';

  // Evolução mensal
  var evolHeader = '<div style="display:grid;grid-template-columns:48px repeat('+(mesIdx+1)+',1fr);gap:4px 6px;align-items:center;margin-bottom:4px">'
    +'<div style="font-size:9px;color:#888;font-weight:700"></div>'
    +MESES.slice(0,mesIdx+1).map(function(m){
      return '<div style="font-size:9px;font-weight:700;color:#888;text-align:center">'+m+'</div>';
    }).join("")
    +'</div>';

  function evolRow(label, tipo, color, readOnly) {
    var cells = MESES.slice(0, mesIdx+1).map(function(m, i) {
      var val = (kmState.evolGrupo && kmState.evolGrupo[m] && kmState.evolGrupo[m][tipo]) || "";
      if (readOnly) {
        // Calcular percentual automaticamente
        var prod  = parseN((kmState.evolGrupo && kmState.evolGrupo[m] && kmState.evolGrupo[m].prod) || "0");
        var improd= parseN((kmState.evolGrupo && kmState.evolGrupo[m] && kmState.evolGrupo[m].improd) || "0");
        var total = prod + improd;
        var p = total > 0 ? (improd/total*100) : 0;
        var cor = percCor(p);
        return '<div data-km-perc-mes="'+m+'" style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:4px;padding:4px 2px;text-align:center;font-size:11px;font-weight:700;color:'+cor+'">'
          +(p>0?p.toFixed(1)+"%":"—")+'</div>';
      }
      return '<input class="field-input" style="font-size:11px;padding:3px 4px;text-align:center;min-width:0"'
        +' value="'+(val||"")+'" placeholder="0"'
        +' data-km-evol="'+m+'" data-km-evol-tipo="'+tipo+'">';
    }).join("");
    return '<div style="display:grid;grid-template-columns:48px repeat('+(mesIdx+1)+',1fr);gap:4px 6px;align-items:center;margin-bottom:4px">'
      +'<div style="font-size:10px;font-weight:700;color:'+color+';white-space:nowrap">'+label+'</div>'
      +cells
      +'</div>';
  }

  var evolucao = '<div style="margin-top:14px">'
    +'<div style="font-size:13px;font-weight:700;color:#c0392b;margin-bottom:8px">Evolução KM '+kmState.ano+'</div>'
    +evolHeader
    +evolRow("Produtivo","prod","#1d3061",false)
    +evolRow("Improdutivo","improd","#1d3061",false)
    +evolRow("% Imp.","perc","#c0392b",true)
    +'</div>';

  return tabela + evolucao;
}

// ── Preview Grupo (coluna direita) ────────────────────────────
function _kmGrupoPreviewHTML() {
  var mesIdx = MESES.indexOf(kmState.mes);
  var meta   = parseN(kmState.metaOcioso || "10");
  var linhas = ["1001","cat","com","opc"];
  function pN(v){ return parseN(v||"0"); }
  function percCor(p){ return p<=0?"#555":p>meta?"#c0392b":"#27ae60"; }
  function fmtN(v){ return v>0?v.toLocaleString("pt-BR"):"—"; }

  var somaP=0,somaI=0;
  linhas.forEach(function(id){
    var d=kmState.dados[id];
    somaP+=pN(d.kmProdMes); somaI+=pN(d.kmImprodMes);
  });
  var somaT=somaP+somaI, somaPerc=somaT>0?(somaI/somaT*100):0;

  // Mini KPIs
  function kpi(lbl,val,cor){
    return '<div style="border:1px solid #e8e8e8;border-radius:6px;padding:8px 10px;flex:1">'
      +'<div style="font-size:9px;color:#aaa;font-weight:600;margin-bottom:2px">'+lbl+'</div>'
      +'<div style="font-size:14px;font-weight:700;color:'+(cor||"#1d3061")+'">'+val+'</div>'
      +'</div>';
  }

  var kpis = '<div style="display:flex;gap:8px;margin-bottom:12px">'
    +kpi("KM Produtivo", fmtN(somaP))
    +kpi("KM Improdutivo", fmtN(somaI))
    +'</div>'
    +'<div style="display:flex;gap:8px;margin-bottom:14px">'
    +kpi("KM Total", fmtN(somaT))
    +kpi("% Improdutiva", somaPerc>0?somaPerc.toFixed(1)+"%":"—", percCor(somaPerc))
    +'</div>';

  // Mini tabela empresas no preview
  var linhasPreview = linhas.map(function(id){
    var d=kmState.dados[id];
    var e=KM_EMPRESAS.find(function(x){return x.id===id;});
    var prod=pN(d.kmProdMes),improd=pN(d.kmImprodMes),total=prod+improd,perc=total>0?(improd/total*100):0;
    return '<tr>'
      +'<td style="padding:5px 8px;border-bottom:1px solid #f0f0f0">'
      +'<img src="'+e.logo+'" style="height:'+_kmLogoHeight(e.id)+';width:auto;object-fit:contain;display:block;margin:0 auto"></td>'
      +'<td style="padding:5px 8px;text-align:center;font-size:11px;font-weight:600;color:#1d3061;border-bottom:1px solid #f0f0f0">'+fmtN(total)+'</td>'
      +'<td style="padding:5px 8px;text-align:center;font-size:11px;font-weight:700;color:'+percCor(perc)+';border-bottom:1px solid #f0f0f0">'+(perc>0?perc.toFixed(1)+"%":"—")+'</td>'
      +'</tr>';
  }).join("");

  var miniTabela = '<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px">'
    +'<thead><tr style="background:#f4f6fb">'
    +'<th style="padding:5px 8px;text-align:left;font-size:9px;color:#888;font-weight:700">Empresa</th>'
    +'<th style="padding:5px 8px;text-align:center;font-size:9px;color:#888;font-weight:700">KM Total</th>'
    +'<th style="padding:5px 8px;text-align:center;font-size:9px;color:#888;font-weight:700">% Imp.</th>'
    +'</tr></thead><tbody>'+linhasPreview+'</tbody></table>';

  return '<div class="preview-hd">Preview — Grupo JCA</div>'
    +'<div class="preview-sub">'+MESES_FULL[mesIdx]+' / '+kmState.ano+'</div>'
    +'<div style="margin-top:12px">'+kpis+miniTabela+'</div>'
    +'<div style="font-size:10px;font-weight:700;color:#aaa;letter-spacing:1px;margin-bottom:6px">EVOLUÇÃO KM</div>'
    +'<div style="flex:1;min-height:140px"><canvas id="km-grupo-preview-chart"></canvas></div>';
}


function _kmField(label, field, value, empId, placeholder) {
  return '<div><label class="field-label">' + label + '</label>'
    + '<input class="field-input" type="text" value="' + (value || "") + '" '
    + 'placeholder="' + (placeholder || "0") + '" '
    + 'data-km-field="' + field + '" data-km-emp="' + empId + '"></div>';
}

function _kmMesesGridHTML(empId, tipo, mesIdx, d) {
  var html = '<div class="km-meses-grid">';
  MESES.forEach(function(m, i) {
    var isFuturo = i > mesIdx;
    var isAtual  = i === mesIdx;
    html += '<label>' + m
      + '<input type="text" ' + (isFuturo ? 'disabled style="opacity:.35"' : '')
      + ' class="' + (isAtual ? 'mes-atual' : '') + '"'
      + ' value="' + ((d.meses[m] && d.meses[m][tipo]) || "") + '"'
      + ' data-km-mes="' + m + '" data-km-mes-tipo="' + tipo + '" data-km-emp="' + empId + '">'
      + '</label>';
  });
  html += '</div>';
  return html;
}

// ═══════════════════════════════════════════════
// STEP 3 — Preview / Viewer
// ═══════════════════════════════════════════════
function _kmStep3HTML() {
  var total = kmState.slides.length;
  var idx   = kmState.slideIdx;

  var thumbs = kmState.slides.map(function(s, i) {
    var active = i === idx ? " thumb--active" : "";
    return '<div class="thumb' + active + '" data-km-action="go-slide" data-km-idx="' + i + '">'
      + '<div class="thumb__preview">' + _kmSlideThumbLabel(s) + '</div>'
      + '<div class="thumb__num">' + (i + 1) + '</div></div>';
  }).join("");

  var nav3 = '<nav class="nav">'
    + '<div class="nav__left">'
    +   '<button class="btn btn--ghost" data-km-action="go-step" data-km-step="2">&#8592; Editar</button>'
    +   '<span class="nav__title">KM Fretamento</span>'
    +   '<span class="nav__period">' + kmState.mes + '/' + kmState.ano + '</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:8px">'
    +   '<button class="btn btn--ghost" data-km-action="km-gerar-pdf" style="background:rgba(192,57,43,.35);padding:3px 12px;font-size:11px">&#11015; PDF</button>'
    +   '<div class="nav__steps">'
    +     '<span class="nav__step nav__step--done" data-km-action="go-step" data-km-step="1">1</span>'
    +     '<span class="nav__step nav__step--done" data-km-action="go-step" data-km-step="2">2</span>'
    +     '<span class="nav__step nav__step--active">3</span>'
    +   '</div>'
    + '</div>'
    + '</nav>';

  var bar = '<div class="preview-bar">'
    + '  <div class="preview-bar__left">'
    +   '<span class="preview-bar__info">Slide ' + (idx+1) + ' de ' + total + '</span>'
    + '  </div>'
    + '  <div class="preview-bar__nav">'
    +   '<button class="preview-bar__arrow" data-km-action="prev-slide" ' + (idx===0?'disabled':'') + '>&#8249;</button>'
    +   '<button class="preview-bar__arrow" data-km-action="next-slide" ' + (idx===total-1?'disabled':'') + '>&#8250;</button>'
    + '  </div>'
    + '</div>';

  var body = '<div style="display:flex;flex:1;overflow:hidden;min-height:0">'
    + '  <div class="thumbs">' + thumbs + '</div>'
    + '  <div class="slide-canvas">'
    +   '<div class="slide-frame" id="km-slide-frame"></div>'
    + '  </div>'
    + '</div>';

  return '<div style="height:100vh;background:#14141e;display:flex;flex-direction:column;overflow:hidden">'
    + nav3 + bar + body
    + '</div>';
}

function _kmSlideThumbLabel(s) {
  var labels = {
    "cover": "Capa",
    "resumo-grupo": "Resumo\nGrupo",
    "evolucao": "Evolução KM\n" + _kmEmpLabel(s.emp),
    "operacao": "Operação\n" + _kmEmpLabel(s.emp),
    "improdutivo": "KM Improdutivo\n" + _kmEmpLabel(s.emp),
    "plano": "Plano de Ação\n" + _kmEmpLabel(s.emp),
    "contra-capa": "Encerramento",
  };
  return labels[s.type] || s.type;
}

function _kmEmpLabel(id) {
  if (!id) return "";
  var e = KM_EMPRESAS.find(function(x) { return x.id === id; });
  return e ? e.label : id;
}

// ── Nav HTML ──────────────────────────────────────────────────
function _kmNavHTML(step) {
  var labels = ["1", "2", "3"];
  var stepsHTML = labels.map(function(label, i) {
    var n = i + 1;
    var cls = "nav__step";
    if (n === step)    cls += " nav__step--active";
    else if (n < step) cls += " nav__step--done";
    var attr = n < step ? 'data-km-action="go-step" data-km-step="' + n + '"' : "";
    return '<div class="' + cls + '" ' + attr + '>' + label + '</div>';
  }).join("");
  var period = step >= 2 ? '<span class="nav__period">' + kmState.mes + '/' + kmState.ano + '</span>' : "";
  return '<nav class="nav">'
    + '<div class="nav__left">'
    + '  <button class="btn btn--ghost" data-km-action="go-home">← Início</button>'
    + '  <span class="nav__title">KM Fretamento</span>'
    + '  ' + period
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:6px">'
    + '  <div class="nav__steps">' + stepsHTML + '</div>'
    + '</div></nav>';
}

// ═══════════════════════════════════════════════
// SLIDES — HTML de cada slide
// ═══════════════════════════════════════════════
function _kmRenderCurrentSlide() {
  var frame = document.getElementById("km-slide-frame");
  if (!frame) return;
  _kmDestroyCharts();
  var s = kmState.slides[kmState.slideIdx];
  try {
    if (s.type === "cover")        { frame.innerHTML = _kmSlideCapa(); return; }
    if (s.type === "contra-capa")  { frame.innerHTML = _kmSlideContraCapa(); return; }
    if (s.type === "resumo-grupo") { frame.innerHTML = _kmSlideResumoGrupo(); return; }
    if (s.type === "evolucao")     { frame.innerHTML = _kmSlideEvolucao(s.emp); setTimeout(function() { _kmInitEvolucaoChart(s.emp); }, 50); return; }
    if (s.type === "operacao")     { frame.innerHTML = _kmSlideOperacao(s.emp); setTimeout(function() { _kmInitDonutCharts(s.emp); }, 50); return; }
    if (s.type === "improdutivo")  { frame.innerHTML = _kmSlideImprodutivo(s.emp); return; }
    if (s.type === "plano")        { frame.innerHTML = _kmSlidePlano(s.emp); return; }
  } catch(err) {
    frame.innerHTML = '<div style="padding:20px;color:#c0392b;font-family:monospace;font-size:12px"><strong>Erro:</strong><br>' + err.message + '</div>';
    console.error("kmSlide:", err);
  }
}

// ── Header padrão ─────────────────────────────────────────────
function _kmHeaderHTML(empId) {
  return '<div class="km-slide-header">'
    + '<div class="km-slide-header__row">'
    + '  <img src="' + LOGO_JCA + '" style="height:30px;object-fit:contain">'
    + '  <span class="km-slide-header__modulo">KM Fretamento</span>'
    + '</div>'
    + '<div class="km-slide-header__line"></div>'
    + '</div>';
}

// ── Logo da empresa abaixo da linha azul (canto superior direito do body) ──
function _kmEmpLogoHTML(empId) {
  if (!empId || empId === 'grupo') return '';
  var e = KM_EMPRESAS.find(function(x) { return x.id === empId; });
  if (!e) return '';
  return '<div style="position:absolute;top:52px;right:18px">'
    + '<img src="' + e.logo + '" style="height:' + _kmLogoHeight(empId) + ';width:auto;object-fit:contain">'
    + '</div>';
}

// ── Footer padrão ─────────────────────────────────────────────
function _kmFooterHTML() {
  var dataStr = kmState.dataAtualizacao ? 'Dados atualizados em ' + kmState.dataAtualizacao : "";
  return '<div class="km-slide-footer">'
    + '<span class="km-slide-footer__text">DO.ACT.IOP - ' + (kmState.analista || "") + '</span>'
    + '<div style="display:flex;align-items:center;gap:8px">'
    + '  <span class="km-slide-footer__data">' + dataStr + '</span>'
    + '  <img src="' + LOGO_IO + '" style="height:28px;object-fit:contain">'
    + '</div></div>';
}

// ── Capa ──────────────────────────────────────────────────────
function _kmSlideCapa() {
  var mesIdx = MESES.indexOf(kmState.mes);
  var periodo = MESES_FULL[mesIdx] + " /" + kmState.ano;
  return '<div class="km-slide km-slide-capa" style="align-items:center;justify-content:center">'
    + '<div class="logos-row" style="display:flex;align-items:center;gap:32px;margin-bottom:56px">'
    + '  <img src="' + LOGO_JCA + '" style="height:60px;object-fit:contain">'
    + '  <div style="width:2px;height:70px;background:#333"></div>'
    + '  <img src="' + LOGO_IO_CAPA + '" style="height:60px;object-fit:contain">'
    + '</div>'
    + '<div style="font-size:26px;font-weight:700;color:#1d3061;text-align:center">KM Fretamento</div>'
    + '<div style="font-size:16px;color:#555;text-align:center;margin-top:6px">' + periodo + '</div>'
    + '<div class="km-rodape-autor">DO.ACT.IOP - ' + (kmState.analista || "") + '</div>'
    + '</div>';
}

// ── Contra-capa ───────────────────────────────────────────────
function _kmSlideContraCapa() {
  return '<div class="km-slide" style="align-items:center;justify-content:center">'
    + '<div style="display:flex;align-items:center;gap:32px">'
    + '  <img src="' + LOGO_JCA + '" style="height:60px;object-fit:contain">'
    + '  <div style="width:2px;height:70px;background:#333"></div>'
    + '  <img src="' + LOGO_IO_CAPA + '" style="height:60px;object-fit:contain">'
    + '</div>'
    + '<div class="km-rodape-autor">DO.ACT.IOP - ' + (kmState.analista || "") + '</div>'
    + '</div>';
}

// ── Resumo Grupo ──────────────────────────────────────────────
function _kmSlideResumoGrupo() {
  var mesIdx  = MESES.indexOf(kmState.mes);
  var mesFull = MESES_FULL[mesIdx] + " / " + kmState.ano;
  var meta    = parseN(kmState.metaOcioso || "10");
  var emps    = ["grupo","1001","cat","com","opc"];

  function pN(v) { return parseN(v || "0"); }
  function fmtDec(v) { return v > 0 ? v.toLocaleString("pt-BR", {minimumFractionDigits:1,maximumFractionDigits:1}) : "—"; }
  function fmtN(v)   { return v > 0 ? v.toLocaleString("pt-BR") : "—"; }
  function percStr(p){ return p > 0 ? p.toFixed(1) + "%" : "—"; }
  function percCor(p){ return p <= 0 ? "#555" : p > meta ? "#c0392b" : "#27ae60"; }

  // Calcular soma Grupo a partir das 4 empresas
  var somaF=0, somaM=0, somaP=0, somaI=0;
  ["1001","cat","com","opc"].forEach(function(id) {
    var d = kmState.dados[id];
    somaF += pN(d.fteFrota); somaM += pN(d.fteMotoristas);
    somaP += pN(d.kmProdMes); somaI += pN(d.kmImprodMes);
  });
  var somaT = somaP + somaI;
  var somaPerc = somaT > 0 ? (somaI / somaT * 100) : 0;

  var rows = emps.map(function(id, ri) {
    var e    = KM_EMPRESAS.find(function(x) { return x.id === id; });
    var d    = kmState.dados[id];
    var prod, improd, total, perc, fte_f, fte_m;

    if (id === "grupo") {
      prod = somaP; improd = somaI; total = somaT; perc = somaPerc;
      fte_f = somaF; fte_m = somaM;
    } else {
      fte_f  = pN(d.fteFrota); fte_m = pN(d.fteMotoristas);
      prod   = pN(d.kmProdMes); improd = pN(d.kmImprodMes);
      total  = prod + improd;
      perc   = total > 0 ? (improd / total * 100) : 0;
    }

    var bgRow  = ri % 2 === 0 ? "#f0f2f8" : "#f8f9fb";
    var isGrupo = id === "grupo";

    return "<tr>"
      // Logo
      + "<td style='padding:8px 10px;text-align:center;background:" + bgRow + ";border-bottom:2px solid #fff'>"
      +   "<img src='" + e.logo + "' style='height:" + _kmLogoHeight(id) + ";width:auto;object-fit:contain;display:block;margin:0 auto'>"
      + "</td>"
      // FTE Frota
      + "<td style='padding:8px 10px;text-align:center;font-size:12px;font-weight:" + (isGrupo?"700":"600") + ";color:#1d3061;background:" + bgRow + ";border-bottom:2px solid #fff'>" + fmtDec(fte_f) + "</td>"
      // FTE Motoristas
      + "<td style='padding:8px 10px;text-align:center;font-size:12px;font-weight:" + (isGrupo?"700":"600") + ";color:#1d3061;background:" + bgRow + ";border-bottom:2px solid #fff'>" + fmtDec(fte_m) + "</td>"
      // KM Produtivo
      + "<td style='padding:8px 10px;text-align:center;font-size:12px;font-weight:" + (isGrupo?"700":"600") + ";color:#1d3061;background:" + bgRow + ";border-bottom:2px solid #fff'>" + fmtN(prod) + "</td>"
      // KM Improdutivo
      + "<td style='padding:8px 10px;text-align:center;font-size:12px;font-weight:" + (isGrupo?"700":"600") + ";color:#1d3061;background:" + bgRow + ";border-bottom:2px solid #fff'>" + fmtN(improd) + "</td>"
      // KM Total
      + "<td style='padding:8px 10px;text-align:center;font-size:12px;font-weight:" + (isGrupo?"700":"600") + ";color:#1d3061;background:" + bgRow + ";border-bottom:2px solid #fff'>" + fmtN(total) + "</td>"
      // % Improdutiva
      + "<td style='padding:8px 10px;text-align:center;font-size:13px;font-weight:700;color:" + percCor(perc) + ";background:" + bgRow + ";border-bottom:2px solid #fff'>" + percStr(perc) + "</td>"
      // Custo*
      + "<td style='padding:8px 10px;text-align:center;font-size:12px;font-weight:700;color:#c0392b;background:" + bgRow + ";border-bottom:2px solid #fff'>" + (d.custo || "R$") + "</td>"
      + "</tr>";
  }).join("");

  var thStyle = "padding:9px 10px;text-align:center;font-size:10px;font-weight:700;color:#c0392b;text-transform:uppercase;letter-spacing:.3px;background:#c8cdd8";
  var thStyleFirst = "padding:9px 10px;text-align:center;font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.3px;background:#c8cdd8;width:100px";

  return "<div class='km-slide'>"
    + _kmHeaderHTML(null)
    + "<div class='km-slide-body'>"
    + "<div class='km-slide-secao'>KM Fretamento | " + mesFull + "</div>"
    + "<div style='text-align:right;font-size:11px;font-weight:700;color:#c0392b;margin-bottom:6px;flex-shrink:0'>Meta Ocioso: " + (kmState.metaOcioso||"10") + "%</div>"
    + "<div style='flex:1;min-height:0;overflow:hidden'>"
    + "<table style='width:100%;border-collapse:separate;border-spacing:0;font-size:12px'>"
    + "<thead><tr>"
    + "<th style='" + thStyleFirst + ";border-radius:6px 0 0 0'></th>"
    + "<th style='" + thStyle + "'>FTE Frota</th>"
    + "<th style='" + thStyle + "'>FTE Motoristas</th>"
    + "<th style='" + thStyle + "'>KM Produtivo</th>"
    + "<th style='" + thStyle + "'>KM Improdutivo</th>"
    + "<th style='" + thStyle + "'>KM Total</th>"
    + "<th style='" + thStyle + "'>% Improdutiva</th>"
    + "<th style='" + thStyle + ";border-radius:0 6px 0 0'>Custo*</th>"
    + "</tr></thead>"
    + "<tbody>" + rows + "</tbody>"
    + "</table>"
    + "</div>"
    + "<div style='font-size:9px;color:#888;font-style:italic;margin-top:6px;flex-shrink:0'>*O custo refere-se ao índice de ociosidade em comparação à meta de " + (kmState.metaOcioso||"10") + "%, indicando variações acima ou abaixo do parâmetro estabelecido.</div>"
    + "</div>"
    + _kmFooterHTML()
    + "</div>";
}

// ── Slide Operação (3 donuts) ─────────────────────────────────
function _kmSlideOperacao(empId) {
  var d       = kmState.dados[empId];
  var mesIdx  = MESES.indexOf(kmState.mes);
  var mesFull = MESES_FULL[mesIdx] + " / " + kmState.ano;
  var prod    = parseN(d.kmProdMes);
  var improd  = parseN(d.kmImprodMes);
  var total   = prod + improd;
  var percProd   = total > 0 ? (prod   / total * 100).toFixed(1) : "0";
  var percImprod = total > 0 ? (improd / total * 100).toFixed(1) : "0";

  // Fator calculado automaticamente: motoristas / frota
  var frotaN = parseN(d.fteFrota || "0");
  var motN   = parseN(d.fteMotoristas || "0");
  var fatorVal = (frotaN > 0 && motN > 0)
    ? (motN / frotaN).toFixed(1)
    : (d.fator || "—");

  var logoFrota = KM_LOGOS_FROTA[empId] || "";
  var e = KM_EMPRESAS.find(function(x) { return x.id === empId; });
  var barColor = e ? e.barColor : "#1d3061";

  return '<div class="km-slide">'    + _kmHeaderHTML(empId)    + _kmEmpLogoHTML(empId)    + '<div class="km-slide-body">'    + '<div class="km-slide-secao">Operação – ' + mesFull + '</div>'    + '<div class="km-op-layout">'
    // Col Produtivo
    + '<div class="km-op-col">'    + '  <div class="km-op-col__title">Produtivo</div>'    + '  <div class="km-op-col__value">' + (prod > 0 ? prod.toLocaleString("pt-BR") : "—") + '</div>'    + '  <div class="km-donut-wrap"><canvas id="km-donut-prod-' + empId + '"></canvas></div>'    + '  <div style="display:flex;align-items:center;justify-content:center;margin-top:6px;gap:6px">'    + (logoFrota ? '    <img src="' + logoFrota + '" style="height:30px;width:auto;object-fit:contain">' : '')    + '    <div style="display:flex;flex-direction:column;align-items:center">'    + '      <span style="font-size:14px;font-weight:700;color:#1d3061">' + (d.fteFrota || "—") + '</span>'    + '      <span style="font-size:9px;font-weight:700;color:#888">Frota</span>'    + '    </div>'    + '  </div>'    + '</div>'
    // Col Improdutivo
    + '<div class="km-op-col">'    + '  <div class="km-op-col__title">Improdutivo</div>'    + '  <div class="km-op-col__value">' + (improd > 0 ? improd.toLocaleString("pt-BR") : "—") + '</div>'    + '  <div class="km-donut-wrap"><canvas id="km-donut-improd-' + empId + '"></canvas></div>'    + '  <div class="km-fator-box" style="margin-top:6px">'    + '    <div class="lbl">Fator</div>'    + '    <div class="val">' + fatorVal + '</div>'    + '  </div>'    + '</div>'
    // Col Total
    + '<div class="km-op-col">'    + '  <div class="km-op-col__title">Total</div>'    + '  <div class="km-op-col__value">&nbsp;</div>'    + '  <div class="km-donut-wrap"><canvas id="km-donut-total-' + empId + '"></canvas></div>'    + '  <div style="display:flex;align-items:center;justify-content:center;margin-top:6px;gap:6px">'    + '    <img src="' + KM_LOGO_MOTORISTA + '" style="height:30px;width:auto;object-fit:contain">'    + '    <div style="display:flex;flex-direction:column;align-items:center">'    + '      <span style="font-size:14px;font-weight:700;color:#1d3061">' + (d.fteMotoristas || "—") + '</span>'    + '      <span style="font-size:9px;font-weight:700;color:#888">Motorista</span>'    + '    </div>'    + '  </div>'    + '</div>'
    + '</div>'    + '</div>'    + _kmFooterHTML()    + '</div>';
}

// ── Slide Evolução KM (gráfico barras) ───────────────────────
function _kmSlideEvolucao(empId) {
  var mesIdx = MESES.indexOf(kmState.mes);
  var ano    = kmState.ano;
  return '<div class="km-slide">'
    + _kmHeaderHTML(empId)
    + _kmEmpLogoHTML(empId)
    + '<div class="km-slide-body">'
    + '<div class="km-slide-secao">Evolução KM ' + ano + '</div>'
    + '<div class="km-evolucao-chart"><canvas id="km-evolucao-chart-' + empId + '"></canvas></div>'
    + '</div>'
    + _kmFooterHTML()
    + '</div>';
}

// ── Slide KM Improdutivo (tabela contratos) ───────────────────
function _kmSlideImprodutivo(empId) {
  var d       = kmState.dados[empId];
  var mesIdx  = MESES.indexOf(kmState.mes);
  var mesFull = MESES_FULL[mesIdx] + " / " + kmState.ano;
  var mesPrev = MESES[(mesIdx + 11) % 12];
  var e = KM_EMPRESAS.find(function(x) { return x.id === empId; });
  var barColor = e ? e.barColor : "#1d3061";

  // Ordenar: verde (melhorou) → azul (igual) → vermelho (piorou)
  var contratos = (d.contratos || []).filter(function(c) { return c.nome; }).map(function(c) {
    var prev  = parseFloat((c.pctAnterior || "0").replace("%","")) || 0;
    var atual = parseFloat((c.pctAtual   || "0").replace("%","")) || 0;
    var grupo = atual < prev ? 0 : atual === prev ? 1 : 2; // 0=verde,1=azul,2=vermelho
    return Object.assign({}, c, { _prev: prev, _atual: atual, _grupo: grupo });
  }).sort(function(a, b) {
    if (a._grupo !== b._grupo) return a._grupo - b._grupo;
    return a._atual - b._atual;
  });

  // Empresas com poucos contratos usam tabela única; demais dividem em 2 colunas
  var tabelaUnica = empId === "cat" || empId === "opc" || contratos.length <= 8;
  var col1, col2;
  if (tabelaUnica) {
    col1 = contratos; col2 = [];
  } else {
    var mid = Math.ceil(contratos.length / 2);
    col1 = contratos.slice(0, mid);
    col2 = contratos.slice(mid);
  }

  function rowHTML(c, idx) {
    var corAtual = c._grupo === 2 ? "#c0392b" : c._grupo === 0 ? "#27ae60" : "#1d3061";
    var corPrev  = c.pctAnterior ? "#888" : "#bbb";
    var bgRow    = idx % 2 === 0 ? "#f7f8fc" : "#ffffff";
    return '<tr style="background:' + bgRow + '">'
      + '<td style="font-size:11px;padding:6px 10px;color:#1d3061">' + c.nome + '</td>'
      + '<td class="pct-cell" style="color:' + corPrev + ';font-size:12px;text-align:center">' + (c.pctAnterior || "—") + '</td>'
      + '<td class="pct-cell" style="color:' + corAtual + ';font-weight:700;font-size:12px;text-align:center">' + (c.pctAtual || "—") + '</td>'
      + '</tr>';
  }

  function tableHTML(rows) {
    if (!rows.length) return '<div style="color:#bbb;font-style:italic;font-size:12px;padding:10px">Sem contratos registrados</div>';
    return '<div style="border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 6px 16px rgba(0,0,0,.12)">'
      + '<table class="km-contratos-slide-table" style="border-radius:0">'
      + '<thead><tr>'
      + '<th style="background:' + barColor + ';padding:8px 10px;font-size:10px;text-align:left">Contrato</th>'
      + '<th class="col-pct" style="background:' + barColor + ';padding:8px 10px;font-size:10px;text-align:center;width:60px">' + mesPrev + '</th>'
      + '<th class="col-pct" style="background:' + barColor + ';padding:8px 10px;font-size:10px;text-align:center;width:60px">' + kmState.mes + '</th>'
      + '</tr></thead><tbody>'
      + rows.map(function(c, i) { return rowHTML(c, i); }).join("")
      + '</tbody></table>'
      + '</div>';
  }

  var wrapStyle = tabelaUnica
    ? 'display:flex;justify-content:center;align-items:center;flex:1;min-height:0;padding:0 20px'
    : 'display:flex;gap:16px;align-items:flex-start;flex:1;min-height:0;padding:0 8px';

  var colStyle = tabelaUnica ? 'width:55%;min-width:320px' : 'flex:1;min-width:0';

  return '<div class="km-slide">'
    + _kmHeaderHTML(empId)
    + _kmEmpLogoHTML(empId)
    + '<div class="km-slide-body">'
    + '<div class="km-slide-secao">KM Improdutivo - ' + mesFull + '</div>'
    + '<div style="' + wrapStyle + '">'
    + '<div style="' + colStyle + ';overflow:hidden">' + tableHTML(col1) + '</div>'
    + (col2.length ? '<div style="flex:1;overflow:hidden">' + tableHTML(col2) + '</div>' : '')
    + '</div>'
    + '</div>'
    + _kmFooterHTML()
    + '</div>';
}

// ── Slide Plano de Ação ───────────────────────────────────────
function _kmSlidePlano(empId) {
  var d      = kmState.dados[empId];
  var ano    = kmState.ano;
  var linhas = (d.planoAcao || "").split("\n").filter(function(l) { return l.trim(); });
  var bodyContent = linhas.length
    ? '<ul>' + linhas.map(function(l) { return '<li>' + l + '</li>'; }).join("") + '</ul>'
    : '<div class="empty">Plano de ação não preenchido.</div>';

  return '<div class="km-slide">'
    + _kmHeaderHTML(empId)
    + _kmEmpLogoHTML(empId)
    + '<div class="km-slide-body">'
    + '<div class="km-slide-secao">KM Fretamento - ' + ano + ' | Plano de Ação</div>'
    + '<div class="km-plano-slide-table-wrap">'
    + '  <div class="km-plano-slide-header-row">'
    + '    <div class="km-plano-slide-cat">KM<br>Fretamento</div>'
    + '    <div class="km-plano-slide-label">Plano de Ação</div>'
    + '  </div>'
    + '</div>'
    + '<div class="km-plano-slide-body">' + bodyContent + '</div>'
    + '</div>'
    + _kmFooterHTML()
    + '</div>';
}

// ═══════════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════════

// ── Donuts de Operação ────────────────────────────────────────
function _kmInitDonutCharts(empId, dpr) {
  var d      = kmState.dados[empId];
  var prod   = parseN(d.kmProdMes);
  var improd = parseN(d.kmImprodMes);
  var total  = prod + improd;
  var e = KM_EMPRESAS.find(function(x) { return x.id === empId; });
  var barColor = e ? e.barColor : "#1d3061";

  var meta = parseN(kmState.metaOcioso || '10');

  function centerTextPlugin(label, color) {
    return {
      id: 'centerText_' + label,
      afterDraw: function(chart) {
        var w = chart.width, h = chart.height, ctx2 = chart.ctx;
        ctx2.save();
        ctx2.font = 'bold ' + Math.round(h * 0.11) + 'px Arial';
        ctx2.fillStyle = color;
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.fillText(label, w / 2, h / 2);
        ctx2.restore();
      }
    };
  }

  function makeDonut(canvasId, value, max, color, centerLabel, centerColor) {
    var el = document.getElementById(canvasId);
    if (!el) return;
    var pct = max > 0 ? (value / max) : 0;
    _kmRegisterChart(new Chart(el.getContext('2d'), {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [pct, 1 - pct],
          backgroundColor: [color, '#e8eaf0'],
          borderWidth: 0,
        }]
      },
      plugins: [centerTextPlugin(centerLabel, centerColor)],
      options: {
        cutout: '72%',
        devicePixelRatio: dpr || (window.devicePixelRatio || 1),
        plugins: { legend: { display: false }, tooltip: { enabled: false }, datalabels: { display: false } },
        animation: false,
      }
    }));
  }

  var percProdStr   = total > 0 ? (prod   / total * 100).toFixed(1) + '%' : '—';
  var percImprodStr = total > 0 ? (improd / total * 100).toFixed(1) + '%' : '—';
  var percImprod    = total > 0 ? (improd / total * 100) : 0;
  var totalStr      = total > 0 ? total.toLocaleString('pt-BR') : '—';
  var improdColor   = percImprod > meta ? '#c0392b' : '#27ae60';

  makeDonut('km-donut-prod-'   + empId, prod,   total, barColor,  percProdStr,   '#1d3061');
  makeDonut('km-donut-improd-' + empId, improd, total, improdColor, percImprodStr, improdColor);
  makeDonut('km-donut-total-'  + empId, total,  total, barColor,  totalStr,      '#1d3061');
}

// ── Gráfico Evolução KM ───────────────────────────────────────
function _kmInitEvolucaoChart(empId, dpr) {
  var canvasId = "km-evolucao-chart-" + empId;
  var el = document.getElementById(canvasId);
  if (!el) return;

  var d      = kmState.dados[empId];
  var mesIdx = MESES.indexOf(kmState.mes);
  var mesesAtivos = MESES.slice(0, mesIdx + 1);
  var e = KM_EMPRESAS.find(function(x) { return x.id === empId; });
  var barColor = e ? e.barColor : "#1d3061";
  var lightColor = e ? e.lightColor : "rgba(91,126,201,.25)";

  var isGrupoEvol = empId === "grupo";
  var prodData   = mesesAtivos.map(function(m) {
    return isGrupoEvol
      ? parseN((kmState.evolGrupo[m] && kmState.evolGrupo[m].prod)   || "0")
      : parseN(d.meses[m] && d.meses[m].prod || "");
  });
  var improdData = mesesAtivos.map(function(m) {
    return isGrupoEvol
      ? parseN((kmState.evolGrupo[m] && kmState.evolGrupo[m].improd) || "0")
      : parseN(d.meses[m] && d.meses[m].improd || "");
  });
  var percData   = mesesAtivos.map(function(m, i) {
    var p = prodData[i], im = improdData[i], t = p + im;
    return t > 0 ? parseFloat((im / t * 100).toFixed(1)) : null;
  });

  _kmRegisterChart(new Chart(el.getContext("2d"), {
    type: "bar",
    data: {
      labels: mesesAtivos,
      datasets: [
        {
          label: "KM Produtivo",
          data: prodData,
          backgroundColor: barColor,
          order: 2,
        },
        {
          label: "KM Improdutivo",
          data: improdData,
          backgroundColor: lightColor,
          order: 2,
        },
        {
          label: "Percentual",
          data: percData,
          type: "line",
          borderColor: "transparent",
          backgroundColor: "transparent",
          pointBackgroundColor: "#8b0000",
          pointRadius: 3,
          pointHoverRadius: 3,
          yAxisID: "yPerc",
          order: 1,
        }
      ]
    },
    plugins: [{
      id: "kmEvolucaoLabels",
      afterDatasetsDraw: function(chart) {
        var ctx = chart.ctx;
        ctx.save();
        chart.data.datasets.forEach(function(dataset, di) {
          var meta = chart.getDatasetMeta(di);
          if (meta.hidden) return;
          meta.data.forEach(function(bar, i) {
            var val = dataset.data[i];
            if (val === null || val === undefined || val === 0) return;
            ctx.font = "bold 10px Arial";
            ctx.fillStyle = "#1d3061";
            ctx.textAlign = "center";
            // KM Produtivo: valor acima da barra
            if (di === 0) {
              ctx.fillStyle = "#1d3061";
              ctx.fillText(val > 0 ? val.toLocaleString("pt-BR") : "", bar.x, bar.y - 4);
            }
            // KM Improdutivo: valor dentro/abaixo
            if (di === 1 && val > 0) {
              ctx.fillStyle = "#c0392b";
              ctx.fillText(val.toLocaleString("pt-BR"), bar.x, bar.y - 4);
            }
            // Percentual: abaixo do ponto
            if (di === 2 && val !== null) {
              ctx.fillStyle = "#c0392b";
              ctx.font = "bold 11px Arial";
              ctx.fillText(val.toFixed(1) + "%", bar.x, bar.y + 16);
            }
          });
        });
        ctx.restore();
      }
    }],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: dpr || (window.devicePixelRatio || 1),
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 5, boxHeight: 5, pointStyle: "circle", usePointStyle: true, font: { size: 9 } }
        },
        datalabels: { display: false },
        tooltip: { enabled: false },
      },
      scales: {
        x: { stacked: false, grid: { display: false } },
        y: {
          stacked: false,
          grid: { display: false },
          ticks: { display: false },
        },
        yPerc: {
          display: false,
          position: "right",
          min: 0, max: 50,
        }
      }
    }
  }));
}

// ── Registro e destruição de charts do KM (sem sobrescrever destroyAllCharts global) ──
var _kmCharts = [];
function _kmRegisterChart(chart) {
  _kmCharts.push(chart);
}
function _kmDestroyCharts() {
  _kmCharts.forEach(function(c) { try { c.destroy(); } catch(e) {} });
  _kmCharts = [];
}

// ═══════════════════════════════════════════════
// FIREBASE
// ═══════════════════════════════════════════════
var _KM_COL        = "km_fretamento";
var _KM_PLANOS_COL = "planos_km_fretamento";

// ── Logos de frota por empresa e motorista ────────────────────
var KM_LOGOS_FROTA = {
  "1001": "https://res.cloudinary.com/dln0ctawv/image/upload/v1781481640/Frota_1001_rcnz3x.png",
  "cat":  "https://res.cloudinary.com/dln0ctawv/image/upload/v1781481950/Frota_Catarinense_rolqld.png",
  "com":  "https://res.cloudinary.com/dln0ctawv/image/upload/v1781482056/Frota_Cometa_1_swbjlg.png",
  "opc":  "https://res.cloudinary.com/dln0ctawv/image/upload/v1781483071/Frota_Op%C3%A7%C3%A3o_y9lrvi.png",
};
var KM_LOGO_MOTORISTA = "https://res.cloudinary.com/dln0ctawv/image/upload/v1781482307/Motorista_cnfosd.png";


function _kmDocId() {
  var mesIdx = MESES.indexOf(kmState.mes);
  return kmState.ano + "-" + String(mesIdx + 1).padStart(2, "0");
}

// ═══════════════════════════════════════════════
// IMPORTAÇÃO DO GOOGLE SHEETS
// ═══════════════════════════════════════════════
async function _kmImportarSheets() {
  if (!KM_APPS_SCRIPT_URL) {
    alert("⚠️ Configure a URL do Apps Script em KM_APPS_SCRIPT_URL no arquivo km-fretamento.js");
    return;
  }

  var btn = document.getElementById("btn-km-sheets");
  if (btn) { btn.textContent = "⏳ Importando..."; btn.disabled = true; }

  var mesIdx = MESES.indexOf(kmState.mes);
  var mesAbrev = kmState.mes;   // ex: "Mai"
  var ano     = kmState.ano;

  try {
    var url = KM_APPS_SCRIPT_URL
      + "?ano=" + ano;

    var resp = await fetch(url);
    var json = await resp.json();

    if (!json.ok) throw new Error(json.erro || "Erro desconhecido");

    var resultado = json.resultado; // { "1001": { "Jan": {...}, "Mai": {...} }, ... }
    var empsImport = ["1001","cat","com","opc"];
    var importados = 0;

    empsImport.forEach(function(empId) {
      if (!resultado[empId]) return;

      // Acumular todos os meses disponíveis no histórico
      MESES.slice(0, mesIdx + 1).forEach(function(m) {
        if (!resultado[empId][m]) return;
        var bloco = resultado[empId][m];

        // Preencher histórico mensal
        if (!kmState.dados[empId].meses[m]) kmState.dados[empId].meses[m] = {};
        kmState.dados[empId].meses[m].prod   = String(Math.round(bloco.kmProd));
        kmState.dados[empId].meses[m].improd = String(Math.round(bloco.kmImprod));

        // Preencher evolução do grupo também
        if (!kmState.evolGrupo[m]) kmState.evolGrupo[m] = {};
        var gProd   = parseN(kmState.evolGrupo[m].prod || "0");
        var gImprod = parseN(kmState.evolGrupo[m].improd || "0");
        kmState.evolGrupo[m].prod   = String(Math.round(gProd + bloco.kmProd));
        kmState.evolGrupo[m].improd = String(Math.round(gImprod + bloco.kmImprod));

        // Se for o mês atual, preencher KPIs principais
        if (m === mesAbrev) {
          kmState.dados[empId].fteFrota      = bloco.fteFrota.toFixed(1);
          kmState.dados[empId].fteMotoristas = bloco.fteMotoristas.toFixed(1);
          kmState.dados[empId].kmProdMes     = String(Math.round(bloco.kmProd));
          kmState.dados[empId].kmImprodMes   = String(Math.round(bloco.kmImprod));

          // Contratos: pctAtual do mês atual, pctAnterior do mês anterior
          if (bloco.contratos && bloco.contratos.length > 0) {
            // Descobrir mês anterior
            var mIdx = MESES.indexOf(m);
            var mPrevIdx = (mIdx + 11) % 12;
            var mPrev = MESES[mPrevIdx];
            var blocoAnt = resultado[empId] && resultado[empId][mPrev];
            var contratosAnt = {};
            if (blocoAnt && blocoAnt.contratos) {
              blocoAnt.contratos.forEach(function(c) { contratosAnt[c.nome] = c.pct; });
            }
            // Ordenar: verde (melhorou = atual < anterior) primeiro, vermelho por último
            var lista = bloco.contratos.map(function(c) {
              return {
                nome: c.nome,
                pctAnterior: contratosAnt[c.nome] !== undefined ? contratosAnt[c.nome] + "%" : "",
                pctAtual: c.pct + "%",
                _pctNum: c.pct,
                _antNum: contratosAnt[c.nome] !== undefined ? contratosAnt[c.nome] : c.pct
              };
            });
            lista.sort(function(a, b) {
              var aVerde = a._pctNum <= a._antNum ? 0 : 1;
              var bVerde = b._pctNum <= b._antNum ? 0 : 1;
              if (aVerde !== bVerde) return aVerde - bVerde;
              return a._pctNum - b._pctNum;
            });
            kmState.dados[empId].contratos = lista.map(function(c) {
              return { nome: c.nome, pctAnterior: c.pctAnterior, pctAtual: c.pctAtual };
            });
          }
          importados++;
        }
      });
    });

    // Recalcular soma do Grupo para o mês atual
    var somaP = 0, somaI = 0, somaF = 0, somaM = 0;
    empsImport.forEach(function(id) {
      somaP += parseN(kmState.dados[id].kmProdMes   || "0");
      somaI += parseN(kmState.dados[id].kmImprodMes || "0");
      somaF += parseN(kmState.dados[id].fteFrota    || "0");
      somaM += parseN(kmState.dados[id].fteMotoristas || "0");
    });
    kmState.dados["grupo"].fteFrota      = somaF.toFixed(1);
    kmState.dados["grupo"].fteMotoristas = somaM.toFixed(1);
    kmState.dados["grupo"].kmProdMes     = String(Math.round(somaP));
    kmState.dados["grupo"].kmImprodMes   = String(Math.round(somaI));

    // Recalcular evolGrupo do zero (soma das empresas por mês)
    MESES.slice(0, mesIdx + 1).forEach(function(m) {
      var gP = 0, gI = 0;
      empsImport.forEach(function(id) {
        gP += parseN((kmState.dados[id].meses[m] && kmState.dados[id].meses[m].prod)   || "0");
        gI += parseN((kmState.dados[id].meses[m] && kmState.dados[id].meses[m].improd) || "0");
      });
      if (!kmState.evolGrupo[m]) kmState.evolGrupo[m] = {};
      kmState.evolGrupo[m].prod   = String(Math.round(gP));
      kmState.evolGrupo[m].improd = String(Math.round(gI));
    });

    if (btn) { btn.textContent = "✅ Importado"; btn.disabled = false; }
    setTimeout(function() { if (btn) btn.textContent = "📊 Importar Sheets"; }, 3000);

    alert("✅ Importados dados de " + importados + " empresa(s) para " + mesAbrev + "/" + ano + "\n"
        + "Total de linhas lidas: " + json.linhas);

    // Re-renderizar o painel atual
    _kmRender();

  } catch(err) {
    console.error("km sheets import:", err);
    if (btn) { btn.textContent = "❌ Erro"; btn.disabled = false; }
    setTimeout(function() { if (btn) btn.textContent = "📊 Importar Sheets"; }, 3000);
    alert("❌ Erro ao importar: " + err.message);
  }
}

async function _kmSalvarFirebase() {
  var btn = document.getElementById("btn-km-salvar");
  if (btn) { btn.textContent = "⏳ Salvando..."; btn.disabled = true; }
  try {
    await _db.collection(_KM_COL).doc(_kmDocId()).set(_clean({
      mes:             kmState.mes,
      ano:             kmState.ano,
      analista:        kmState.analista,
      dataAtualizacao: kmState.dataAtualizacao,
      metaOcioso:      kmState.metaOcioso,
      evolGrupo:       kmState.evolGrupo,
      dados:           kmState.dados,
      savedAt:         firebase.firestore.FieldValue.serverTimestamp(),
    }));
    if (btn) { btn.textContent = "✅ Salvo"; btn.disabled = false; }
    setTimeout(function() { if (btn) btn.textContent = "☁️ Salvar"; }, 2000);
  } catch(err) {
    console.error("km firebase save:", err);
    if (btn) { btn.textContent = "❌ Erro"; btn.disabled = false; }
  }
}

async function _kmCarregarFirebase() {
  try {
    var doc = await _db.collection(_KM_COL).doc(_kmDocId()).get();
    if (doc.exists) return { dados: doc.data(), fonte: "atual" };
  } catch(e) { console.warn("km load atual:", e); }
  // Tenta mês anterior como base
  var mesIdx  = MESES.indexOf(kmState.mes);
  var prevIdx = (mesIdx + 11) % 12;
  var prevAno = mesIdx === 0 ? kmState.ano - 1 : kmState.ano;
  var prevDocId = prevAno + "-" + String(prevIdx + 1).padStart(2, "0");
  try {
    var doc2 = await _db.collection(_KM_COL).doc(prevDocId).get();
    if (doc2.exists) return { dados: doc2.data(), fonte: "anterior", mesFonte: MESES[prevIdx] };
  } catch(e) { console.warn("km load ant:", e); }
  return null;
}

async function _kmAvancarParaStep2() {
  var btn = document.querySelector('[data-km-action="go-step"][data-km-step="2"]');
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Carregando..."; }

  try {
    var resultado = await _kmCarregarFirebase();
    if (resultado) {
      var d = resultado.dados;
      if (d.dados)           kmState.dados           = JSON.parse(JSON.stringify(d.dados));
      if (d.dataAtualizacao) kmState.dataAtualizacao = d.dataAtualizacao;
      if (d.metaOcioso)      kmState.metaOcioso      = d.metaOcioso;
      if (d.evolGrupo)       kmState.evolGrupo       = JSON.parse(JSON.stringify(d.evolGrupo));
      kmState._fbNotif = resultado.fonte === "anterior"
        ? "📂 Base de " + resultado.mesFonte + " carregada — preencha " + kmState.mes
        : "✅ Rascunho de " + kmState.mes + " retomado";
    }
  } catch(e) { console.warn("km avancar:", e); }

  kmState.step = 2;
  _kmRender();
}

async function _kmImportarPlanos() {
  var docId = _kmDocId();
  var btn = document.querySelector('[data-km-action="km-importar-planos"]');
  if (btn) { btn.textContent = '⏳ Importando...'; btn.disabled = true; }
  try {
    var doc = await _db.collection(_KM_PLANOS_COL).doc(docId).get();
    if (!doc.exists) {
      alert('Nenhum plano encontrado para ' + docId + '.\n\nVerifique se as empresas já preencheram o plano-de-acao-km-fretamento.html para este período.');
      if (btn) { btn.textContent = '📋 Importar Planos de Ação'; btn.disabled = false; }
      return;
    }
    var data = doc.data();
    var importados = 0;
    ["1001","cat","com","opc"].forEach(function(id) {
      // Firestore pode salvar como objeto aninhado OU como dot-notation flat
      var obj    = data[id] || {};
      var texto  = obj.texto   || obj.resposta
                || data[id + ".texto"]   || data[id + ".resposta"] || '';
      var enviado = !!(obj.enviado || data[id + ".enviado"]);
      if (texto) {
        kmState.dados[id].planoAcao = texto;
        importados++;
      }
      kmState.dados[id]._planoEnviado = enviado;
    });
    if (btn) { btn.textContent = '✅ ' + importados + ' plano(s)'; btn.disabled = false; }
    setTimeout(function() { if (btn) btn.textContent = '📋 Importar Planos de Ação'; }, 3000);
    kmState.tabAtiva = 'plano';
    _kmRender();
  } catch(e) {
    console.error('km importar planos:', e);
    if (btn) { btn.textContent = '❌ Erro'; btn.disabled = false; }
    alert('Erro ao importar: ' + e.message);
  }
}

// ═══════════════════════════════════════════════
// PDF
// ═══════════════════════════════════════════════
async function _kmGerarPDF() {
  var btn = document.querySelector('[data-km-action="km-gerar-pdf"]');
  if (btn) { btn.textContent = "⏳ Gerando..."; btn.disabled = true; }

  var { jsPDF } = window.jspdf;
  var pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [960, 540], hotfixes: ["px_scaling"] });
  var total    = kmState.slides.length;
  var savedIdx = kmState.slideIdx;
  var dpr      = window.devicePixelRatio || 1;

  // Box fora da tela — sem bordas, sem sombra do viewer
  var box = document.createElement("div");
  box.style.cssText = "position:fixed;top:-600px;left:0;width:960px;height:540px;"
    + "overflow:hidden;background:#fff;font-family:Arial,Helvetica,sans-serif;z-index:-1";
  document.body.appendChild(box);

  // Injetar estilo para forçar o slide a ocupar 100% do box
  var styleEl = document.createElement("style");
  styleEl.textContent = "#km-pdf-box .km-slide{width:960px!important;height:540px!important;box-sizing:border-box!important;box-shadow:none!important;border-radius:0!important}";
  box.id = "km-pdf-box";
  document.head.appendChild(styleEl);

  for (var i = 0; i < total; i++) {
    kmState.slideIdx = i;
    // Renderizar slide no box limpo
    _kmDestroyCharts();
    var s = kmState.slides[i];
    try {
      if (s.type === "cover")        box.innerHTML = _kmSlideCapa();
      else if (s.type === "contra-capa") box.innerHTML = _kmSlideContraCapa();
      else if (s.type === "resumo-grupo") box.innerHTML = _kmSlideResumoGrupo();
      else if (s.type === "evolucao")  { box.innerHTML = _kmSlideEvolucao(s.emp); await new Promise(function(r){setTimeout(r,80);}); _kmInitEvolucaoChart(s.emp, 4); }
      else if (s.type === "operacao")  { box.innerHTML = _kmSlideOperacao(s.emp); await new Promise(function(r){setTimeout(r,80);}); _kmInitDonutCharts(s.emp, 4); }
      else if (s.type === "improdutivo") box.innerHTML = _kmSlideImprodutivo(s.emp);
      else if (s.type === "plano")       box.innerHTML = _kmSlidePlano(s.emp);
    } catch(err) { console.warn("km pdf render slide "+i+":", err); }

    await new Promise(function(r) { setTimeout(r, 150); });

    try {
      var canvas = await html2canvas(box, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 960,
        height: 540,
        windowWidth: 960,
        windowHeight: 540,
        logging: false,
        onclone: function(doc) {
          var el = doc.getElementById("km-pdf-box");
          if (el) el.style.top = "0";
        }
      });
      var img = canvas.toDataURL("image/jpeg", 0.98);
      if (i > 0) pdf.addPage([960, 540], "landscape");
      pdf.addImage(img, "JPEG", 0, 0, 960, 540);
    } catch(err) {
      console.warn("km pdf canvas slide " + i + ":", err);
    }
  }

  // Limpar
  document.body.removeChild(box);
  document.head.removeChild(styleEl);
  _kmDestroyCharts();

  var mesIdx = MESES.indexOf(kmState.mes);
  var mesFull = MESES_FULL[mesIdx] + "_" + kmState.ano;
  pdf.save("KM_Fretamento_" + mesFull + ".pdf");

  // Restaurar slide atual
  kmState.slideIdx = savedIdx;
  _kmRenderCurrentSlide();
  if (btn) { btn.textContent = "⬇ PDF"; btn.disabled = false; }
}

// ═══════════════════════════════════════════════
// HANDLER DE AÇÕES E INPUTS
// ═══════════════════════════════════════════════
function kmHandleAction(action, dataset, el) {
  switch (action) {
    case "go-home":
      kmState = null;
      state.screen = "home";
      render();
      break;

    case "go-step":
      var nextStep = Number(dataset.kmStep);
      if (nextStep === 2 && kmState.step === 1) {
        _kmAvancarParaStep2();
      } else {
        kmState.step = nextStep;
        if (nextStep === 3) kmState.slideIdx = 0;
        _kmRender();
      }
      break;

    case "set-tab":
      kmState.tabAtiva = dataset.kmTab;
      _kmRender();
      break;

    case "add-contrato":
      kmState.dados[dataset.kmEmp].contratos.push({ nome: "", pctAnterior: "", pctAtual: "" });
      _kmRender();
      break;

    case "rm-contrato":
      kmState.dados[dataset.kmEmp].contratos.splice(Number(dataset.kmCi), 1);
      _kmRender();
      break;

    case "km-salvar-firebase":
      _kmSalvarFirebase();
      break;

    case "km-importar-sheets":
      _kmImportarSheets();
      break;

    case "km-importar-planos":
      _kmImportarPlanos();
      break;

    case "km-gerar-pdf":
      _kmGerarPDF();
      break;

    case "go-slide":
      kmState.slideIdx = Number(dataset.kmIdx);
      _kmRenderCurrentSlide();
      _kmUpdateActiveThumbs();
      _kmUpdateSlideCounter();
      break;

    case "prev-slide":
      if (kmState.slideIdx > 0) {
        kmState.slideIdx--;
        _kmRenderCurrentSlide();
        _kmUpdateActiveThumbs();
        _kmUpdateSlideCounter();
      }
      break;

    case "next-slide":
      if (kmState.slideIdx < kmState.slides.length - 1) {
        kmState.slideIdx++;
        _kmRenderCurrentSlide();
        _kmUpdateActiveThumbs();
        _kmUpdateSlideCounter();
      }
      break;
  }
}

function _kmUpdateActiveThumbs() {
  document.querySelectorAll(".thumb").forEach(function(t, i) {
    t.classList.toggle("thumb--active", i === kmState.slideIdx);
  });
}

function _kmUpdateSlideCounter() {
  var el = document.querySelector(".preview-bar__info");
  if (el) el.textContent = "Slide " + (kmState.slideIdx + 1) + " de " + kmState.slides.length;
  // Atualiza botões prev/next
  var prev = document.querySelector('[data-km-action="prev-slide"]');
  var next = document.querySelector('[data-km-action="next-slide"]');
  if (prev) prev.disabled = kmState.slideIdx === 0;
  if (next) next.disabled = kmState.slideIdx === kmState.slides.length - 1;
}

// ── Input handler ─────────────────────────────────────────────
// ── Aba Plano de Ação (Step 2) ────────────────────────────────
function _kmPlanoPanelHTML() {
  var emps = ["1001","cat","com","opc"];
  var mesIdx = MESES.indexOf(kmState.mes);
  var mesFull = MESES_FULL[mesIdx] + " / " + kmState.ano;

  var cards = emps.map(function(id) {
    var e     = KM_EMPRESAS.find(function(x) { return x.id === id; });
    var d     = kmState.dados[id];
    var plano = d.planoAcao || "";
    var enviado = d._planoEnviado || false;

    return '<div class="card" style="margin-bottom:12px">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'
      +   '<img src="' + e.logo + '" style="height:' + _kmLogoHeight(id) + ';width:auto;object-fit:contain">'
      + '</div>'
      + (enviado
          ? '<div style="background:#f0fff4;border:1px solid #a7f3d0;border-radius:8px;padding:12px 14px;font-size:12px;color:#065f46;margin-bottom:8px">'
          +   '&#10003; Resposta recebida via plano-de-acao-km-fretamento.html'
          + '</div>'
          : '<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:10px 14px;font-size:11px;color:#856404;margin-bottom:8px">'
          +   '&#9203; Aguardando resposta da empresa'
          + '</div>'
        )
      + '<div class="km-plano-field">'
      +   '<label>Plano de Ação — ' + mesFull + '</label>'
      +   '<textarea rows="4" data-km-field="planoAcao" data-km-emp="' + id + '" '
      +   'placeholder="Ações preenchidas pela empresa aparecem aqui após Importar Planos de Ação...">'
      +   plano
      +   '</textarea>'
      + '</div>'
      + '</div>';
  }).join("");

  return '<div style="width:100%">'
    + '<div style="background:#e8f4fd;border:1px solid #bee3f8;border-radius:8px;padding:12px 16px;font-size:12px;color:#2b6cb0;margin-bottom:14px">'
    +   '&#128161; Clique em <b>Importar Planos de A&ccedil;&atilde;o</b> na barra acima ap&oacute;s as empresas responderem pelo link '
    +   '<b>plano-de-acao-km-fretamento.html</b>'
    + '</div>'
    + cards
    + '</div>';
}

// ── Gráfico preview Evolução KM Grupo ────────────────────────
// ── Atualiza células % Imp. da evolução sem re-render total ──
function _kmAtualizarPercEvolucao() {
  var mesIdx = MESES.indexOf(kmState.mes);
  MESES.slice(0, mesIdx + 1).forEach(function(m) {
    var el = document.querySelector('[data-km-perc-mes="' + m + '"]');
    if (!el) return;
    var prod   = parseN((kmState.evolGrupo[m] && kmState.evolGrupo[m].prod)   || '0');
    var improd = parseN((kmState.evolGrupo[m] && kmState.evolGrupo[m].improd) || '0');
    var total  = prod + improd;
    var meta   = parseN(kmState.metaOcioso || '10');
    var perc   = total > 0 ? (improd / total * 100) : 0;
    var cor    = perc <= 0 ? '#555' : perc > meta ? '#c0392b' : '#27ae60';
    el.textContent = perc > 0 ? perc.toFixed(1) + '%' : '—';
    el.style.color = cor;
  });
}

function _kmInitGrupoPreviewChart() {
  var el = document.getElementById('km-grupo-preview-chart');
  if (!el) return;
  var mesIdx = MESES.indexOf(kmState.mes);
  var mesesAtivos = MESES.slice(0, mesIdx + 1);
  var meta = parseN(kmState.metaOcioso || '10');
  var prodData   = mesesAtivos.map(function(m) { return parseN((kmState.evolGrupo[m] && kmState.evolGrupo[m].prod) || '0'); });
  var improdData = mesesAtivos.map(function(m) { return parseN((kmState.evolGrupo[m] && kmState.evolGrupo[m].improd) || '0'); });
  var percData   = mesesAtivos.map(function(m, i) {
    var p = prodData[i], im = improdData[i], t = p + im;
    return t > 0 ? parseFloat((im / t * 100).toFixed(1)) : null;
  });
  _kmRegisterChart(new Chart(el.getContext('2d'), {
    type: 'bar',
    data: {
      labels: mesesAtivos,
      datasets: [
        { label: 'KM Produtivo',   data: prodData,   backgroundColor: '#90b4e8', order: 2 },
        { label: 'KM Improdutivo', data: improdData, backgroundColor: '#f5c6c6', order: 2 },
        { label: 'Percentual', data: percData, type: 'line', borderColor: 'transparent',
          backgroundColor: 'transparent', pointBackgroundColor: '#8b0000', pointRadius: 3,
          yAxisID: 'yPerc', order: 1 }
      ]
    },
    plugins: [{
      id: 'kmGrupoLabels',
      afterDatasetsDraw: function(chart) {
        var ctx = chart.ctx; ctx.save();
        chart.data.datasets.forEach(function(ds, di) {
          var meta2 = chart.getDatasetMeta(di);
          meta2.data.forEach(function(bar, i) {
            var v = ds.data[i]; if (!v) return;
            ctx.textAlign = 'center'; ctx.font = 'bold 9px Arial';
            if (di === 0) { ctx.fillStyle = '#1d3061'; ctx.fillText(v > 0 ? v.toLocaleString('pt-BR') : '', bar.x, bar.y - 3); }
            if (di === 1 && v > 0) { ctx.fillStyle = '#c0392b'; ctx.fillText(v.toLocaleString('pt-BR'), bar.x, bar.y - 3); }
            if (di === 2 && v !== null) { ctx.fillStyle = '#c0392b'; ctx.font = 'bold 10px Arial'; ctx.fillText(v.toFixed(1)+'%', bar.x, bar.y + 14); }
          });
        });
        ctx.restore();
      }
    }],
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 5, boxHeight: 5, pointStyle: 'circle', usePointStyle: true, font: { size: 9 } } },
        datalabels: { display: false }, tooltip: { enabled: false }
      },
      scales: {
        x: { stacked: false, grid: { display: false } },
        y: { stacked: false, grid: { display: false }, ticks: { display: false } },
        yPerc: { display: false, position: 'right', min: 0, max: 50 }
      }
    }
  }));
}

// ── Re-renderiza painel e preview do Grupo ao vivo ──────────
function _kmRefreshGrupoPainel(focusEl) {
  var painel = document.querySelector('[data-km-grupo-painel]');
  var preview = document.querySelector('[data-km-grupo-preview]');
  if (painel) {
    var focusField = focusEl ? focusEl.dataset.kmField : null;
    var focusEmp   = focusEl ? focusEl.dataset.kmEmp : null;
    var focusEvol  = focusEl ? focusEl.dataset.kmEvol : null;
    var focusTipo  = focusEl ? focusEl.dataset.kmEvolTipo : null;
    var focusRoot  = focusEl ? focusEl.dataset.kmRoot : null;
    painel.innerHTML = _kmGrupoTabelaHTML();
    // Restaurar foco
    var novo = null;
    if (focusField && focusEmp) novo = painel.querySelector('[data-km-field="'+focusField+'"][data-km-emp="'+focusEmp+'"]');
    else if (focusEvol && focusTipo) novo = painel.querySelector('[data-km-evol="'+focusEvol+'"][data-km-evol-tipo="'+focusTipo+'"]');
    else if (focusRoot) novo = painel.querySelector('[data-km-root="'+focusRoot+'"]');
    if (novo) { novo.focus(); novo.setSelectionRange(novo.value.length, novo.value.length); }
  }
  if (preview) {
    _kmDestroyCharts();
    preview.innerHTML = _kmGrupoPreviewHTML();
    setTimeout(_kmInitGrupoPreviewChart, 60);
  }
}

function kmHandleInput(el) {
  // Campo simples de empresa
  if (el.dataset.kmField && el.dataset.kmEmp) {
    kmState.dados[el.dataset.kmEmp][el.dataset.kmField] = el.value;
    // Se estiver na aba Grupo, re-renderizar a tabela ao vivo
    if (kmState.tabAtiva === "grupo" && kmState.step === 2) {
      _kmRefreshGrupoPainel(el);
    }
    return;
  }
  // Campos raiz (mes, ano, analista, dataAtualizacao)
  if (el.dataset.kmRoot) {
    var f = el.dataset.kmRoot;
    if (f === "ano") kmState.ano = Number(el.value);
    else if (f === "mes") { kmState.mes = el.value; kmState.mesIdx = MESES.indexOf(el.value); }
    else kmState[f] = el.value;
    // Re-renderizar painel grupo ao mudar metaOcioso
    if (f === "metaOcioso" && kmState.tabAtiva === "grupo" && kmState.step === 2) {
      _kmRefreshGrupoPainel(el);
    }
    return;
  }
  // Evolução mensal do Grupo
  if (el.dataset.kmEvol && el.dataset.kmEvolTipo) {
    var m = el.dataset.kmEvol, t = el.dataset.kmEvolTipo;
    if (!kmState.evolGrupo) kmState.evolGrupo = {};
    if (!kmState.evolGrupo[m]) kmState.evolGrupo[m] = {};
    kmState.evolGrupo[m][t] = el.value;
    // Só atualiza o preview (não re-renderiza o painel inteiro para não perder foco)
    var preview = document.querySelector('[data-km-grupo-preview]');
    if (preview) {
      _kmDestroyCharts();
      preview.innerHTML = _kmGrupoPreviewHTML();
      setTimeout(_kmInitGrupoPreviewChart, 60);
    }
    // Atualiza só a linha % Imp. na tabela de evolução
    _kmAtualizarPercEvolucao();
    return;
  }
  // Mês histórico
  if (el.dataset.kmMes && el.dataset.kmMesTipo && el.dataset.kmEmp) {
    if (!kmState.dados[el.dataset.kmEmp].meses[el.dataset.kmMes]) {
      kmState.dados[el.dataset.kmEmp].meses[el.dataset.kmMes] = {};
    }
    kmState.dados[el.dataset.kmEmp].meses[el.dataset.kmMes][el.dataset.kmMesTipo] = el.value;
    return;
  }
  // Contrato
  if (el.dataset.kmContrato && el.dataset.kmCi !== undefined && el.dataset.kmCf) {
    var empId = el.dataset.kmContrato;
    var idx   = Number(el.dataset.kmCi);
    var field = el.dataset.kmCf;
    if (kmState.dados[empId].contratos[idx]) {
      kmState.dados[empId].contratos[idx][field] = el.value;
    }
    return;
  }
}