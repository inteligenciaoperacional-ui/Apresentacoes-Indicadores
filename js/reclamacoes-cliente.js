// ═══════════════════════════════════════════════════════════════
// reclamacoes-cliente.js — Reclamacoes de Clientes - Motoristas
// Prefixo: rc | Colecoes: reclamacoes_cliente / planos_reclamacoes_cliente
// ═══════════════════════════════════════════════════════════════

var RC_LOGOS = {
  grupo:  'https://res.cloudinary.com/dln0ctawv/image/upload/v1779238658/JCA_1_mp1ic7.png',
  '1001': 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671790/1001_qisjtr_1_pzpzqw.png',
  '1001u':'https://res.cloudinary.com/dln0ctawv/image/upload/v1781307419/1001_URB_m1lbdu.png',
  cat:    'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671813/AVC_zk4pe9_k4jgau.png',
  com:    'https://res.cloudinary.com/dln0ctawv/image/upload/v1779671826/COM_folzln_ddghpr.png',
};
var RC_LOGO_JCA     = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779238658/JCA_1_mp1ic7.png';
var RC_LOGO_IO      = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1779238606/Intelig%C3%AAncia_preto_2_y6idqg.png';
var RC_LOGO_IO_CAPA = 'https://res.cloudinary.com/dln0ctawv/image/upload/v1781283106/Intelig%C3%AAncia_horizontal_preto_p6gikp_mwb3ts.png';

var RC_EMP_LABEL = { grupo:'Grupo JCA', '1001':'1001', '1001u':'1001 Urbano', cat:'Catarinense', com:'Cometa' };
var RC_EMP_SOLID = {
  grupo:  '#c08080',
  '1001': '#555555',
  '1001u':'#888888',
  cat:    '#007a7a',
  com:    '#1a5fa0',
};
var RC_EMP_LIGHT = {
  grupo:  'rgba(236,152,152,.12)',
  '1001': 'rgba(85,85,85,.08)',
  '1001u':'rgba(136,136,136,.08)',
  cat:    'rgba(0,122,122,.08)',
  com:    'rgba(26,95,160,.08)',
};
// Cor do cabeçalho da tabela de motivos por empresa
var RC_TABLE_HEADER = {
  grupo:  '#1d3061',
  '1001': '#555555',
  '1001u':'#888888',
  cat:    '#007a7a',
  com:    '#1a5fa0',
};
// Cor das zebras da tabela por empresa
var RC_TABLE_ROW_ODD = {
  grupo:  '#fdf5f5',
  '1001': '#f5f5f5',
  '1001u':'#f8f8f8',
  cat:    '#f0fafa',
  com:    '#f0f5ff',
};
var RC_BAR_COLORS = {
  grupo:  'rgba(236,152,152,.55)',
  '1001': 'rgba(165,165,165,.70)',
  '1001u':'rgba(195,195,195,.65)',
  cat:    'rgba(0,168,168,.90)',
  com:    'rgba(52,130,210,.80)',
};
var RC_INCONS_COLORS = {
  grupo:  'rgba(210,100,100,.85)',
  '1001': 'rgba(90,90,90,.90)',
  '1001u':'rgba(130,130,130,.90)',
  cat:    'rgba(0,130,130,.95)',
  com:    'rgba(20,90,180,.92)',
};
var RC_EMPRESAS = ['1001','1001u','cat','com'];
var rcState  = null;
var rcCharts = {};

function _rcInitEmpresa() {
  return {
    qtde_mensal: Array(12).fill(0), tratamento_mensal: Array(12).fill(0), inconsistencias_mensal: Array(12).fill(0),
    qtde_acum:0, nao_ident_qtde:0, nao_ident_pct:'', inconsistencias_pct:'', consistentes_pct:'', tratamento_pct:'',
    motivos_mes:[], motivos_acum:[],
    abandono_2024:Array(12).fill(0), abandono_2025:Array(12).fill(0), abandono_2026:Array(12).fill(0),
    planoAcao:{texto:'',enviado:false},
  };
}
function _rcInitDadosGrupo() {
  return {
    qtde_acum:0, tratamento_pct:'', nao_ident_qtde:0, nao_ident_pct:'',
    inconsistencias_pct:'', consistentes_pct:'',
    qtde_mensal:Array(12).fill(''), tratamento_mensal:Array(12).fill(''), inconsistencias_mensal:Array(12).fill(''),
  };
}
function _rcInitElogios() {
  return {
    qtde_acum:0, tratamento_pct:'', nao_ident_qtde:0, nao_ident_pct:'',
    inconsistencias_qtde:0, inconsistencias_pct:'', consistentes_pct:'',
    mensal_1001:Array(12).fill(0), mensal_cat:Array(12).fill(0), mensal_com:Array(12).fill(0),
    mes_empresa:[],
  };
}
function _rcInitState() {
  var dados = {};
  RC_EMPRESAS.forEach(function(id){ dados[id] = _rcInitEmpresa(); });
  return {
    step:1, mes:_prevIdx, ano:_prevAno,
    analista:(typeof state !== 'undefined' ? state.analista : '') || '',
    tabAtiva:'grupo', slideIdx:0, slides:[],
    dados:dados, dadosGrupo:_rcInitDadosGrupo(), elogios:_rcInitElogios(),
  };
}
function _rcBuildSlides() {
  var slides = [{ type:'capa' }, { type:'utp', emp:'grupo' }];
  RC_EMPRESAS.forEach(function(id){
    slides.push({ type:'utp',    emp:id });
    slides.push({ type:'detalhe',emp:id });
    slides.push({ type:'plano1', emp:id });
    slides.push({ type:'plano2', emp:id });
  });
  RC_EMPRESAS.forEach(function(id){ slides.push({ type:'abandono', emp:id }); });
  slides.push({ type:'elogios-evolucao' });
  slides.push({ type:'elogios-detalhe' });
  slides.push({ type:'contra-capa' });
  return slides;
}

function startReclamacoesCliente() {
  rcState = _rcInitState();
  rcState.slides = _rcBuildSlides();
  _rcRender();
}
function _rcRender() {
  var app = document.getElementById('app');
  _rcDestroyAllCharts();
  if (rcState.step===1){ app.innerHTML=_rcStep1HTML(); return; }
  if (rcState.step===2){ app.innerHTML=_rcStep2HTML(); _rcRenderStep2Panel(); return; }
  if (rcState.step===3){ app.innerHTML=_rcStep3HTML(); _rcRenderCurrentSlide(); return; }
}

// STEP 1
function _rcStep1HTML() {
  var mesOpts = MESES_FULL.map(function(m,i){ return '<option value="'+i+'"'+(i===rcState.mes?' selected':'')+'>'+m+'</option>'; }).join('');
  var anoOpts = ANOS.map(function(a){ return '<option value="'+a+'"'+(a===rcState.ano?' selected':'')+'>'+a+'</option>'; }).join('');
  return '<nav class="nav"><div class="nav__left">'
    +'<button class="btn btn--ghost" data-rc-action="go-home">&#8592; In&iacute;cio</button>'
    +'<span class="nav__title">Reclama&ccedil;&otilde;es de Clientes</span></div>'
    +'<div class="nav__steps"><span class="nav__step nav__step--active">1</span><span class="nav__step">2</span><span class="nav__step">3</span></div></nav>'
    +'<div style="min-height:calc(100vh - 50px);display:flex;align-items:center;justify-content:center;background:#f5f6fa">'
    +'<div style="background:#fff;border-radius:16px;box-shadow:0 2px 24px rgba(0,0,0,.1);padding:40px 48px;width:400px;display:flex;flex-direction:column;gap:20px">'
    +'<div><h2 style="font-size:22px;font-weight:700;color:#1d3061;margin:0 0 4px">Reclama&ccedil;&otilde;es de Clientes</h2>'
    +'<p style="font-size:13px;color:#999;margin:0">M&ecirc;s de refer&ecirc;ncia e analista</p></div>'
    +'<div style="display:flex;flex-direction:column;gap:14px">'
    +'<div><label class="field-label">M&Ecirc;S</label><select class="field-input" data-rc-root="mes">'+mesOpts+'</select></div>'
    +'<div><label class="field-label">ANO</label><select class="field-input" data-rc-root="ano">'+anoOpts+'</select></div>'
    +'<div><label class="field-label">ANALISTA</label><input class="field-input" type="text" value="'+(rcState.analista||'')+'" data-rc-root="analista" placeholder="Ex: Diego Leme"></div>'
    +'</div>'
    +'<button class="btn btn--primary" style="width:100%;padding:12px;font-size:15px" data-rc-action="go-step" data-rc-step="2">Pr&oacute;ximo &#8594;</button>'
    +'</div></div>';
}

// STEP 2
function _rcStep2HTML() {
  var mesLabel = MESES_FULL[rcState.mes]+'/'+rcState.ano;
  return '<nav class="nav"><div class="nav__left">'
    +'<button class="btn btn--ghost" data-rc-action="go-step" data-rc-step="1">&#8592; Voltar</button>'
    +'<span class="nav__title">Reclama&ccedil;&otilde;es de Clientes</span>'
    +'<span class="nav__period">'+MESES_FULL[rcState.mes]+'/'+rcState.ano+'</span></div>'
    +'<div style="display:flex;align-items:center;gap:8px">'
    +'<button class="btn btn--ghost" data-rc-action="rc-importar-planos" style="padding:3px 12px;font-size:11px">Importar Planos</button>'
    +'<button class="btn btn--ghost" id="rc-btn-salvar" data-rc-action="rc-salvar-firebase" style="padding:3px 12px;font-size:11px;background:rgba(66,133,244,.25)">Salvar</button>'
    +'<div class="nav__steps"><span class="nav__step">1</span><span class="nav__step nav__step--active">2</span><span class="nav__step">3</span></div>'
    +'</div></nav>'
    +'<div style="display:flex;flex-direction:column;padding:20px 24px;height:calc(100vh - 50px);overflow:hidden;box-sizing:border-box">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-shrink:0">'
    +'<div><h3 style="font-size:19px;font-weight:700;color:#1d3061;margin:0 0 2px">Preenchimento de Dados</h3>'
    +'<p style="font-size:12px;color:#888;margin:0">Preencha os dados de cada empresa</p></div>'
    +'<span style="background:var(--navy);color:#fff;font-weight:700;font-size:13px;padding:6px 14px;border-radius:8px">'+mesLabel+'</span>'
    +'</div>'
    +'<div id="rc-step2-content" style="flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column"></div>'
    +'<div style="display:flex;justify-content:flex-end;padding-top:12px;flex-shrink:0;border-top:1px solid #eee">'
    +'<button class="btn btn--primary" data-rc-action="go-step" data-rc-step="3">Visualizar Apresenta&ccedil;&atilde;o &#8594;</button>'
    +'</div></div>';
}

function _rcRenderStep2Panel() {
  var container = document.getElementById('rc-step2-content');
  if (!container) return;
  var prevLeft = document.getElementById('rc-left-panel');
  var prevScroll = prevLeft ? prevLeft.scrollTop : 0;

  var tabs = '<button class="rc-tab-btn rc-tab-btn--grupo'+(rcState.tabAtiva==='grupo'?' active':'')+'" data-rc-action="set-tab" data-rc-tab="grupo">Grupo JCA</button>';
  tabs += RC_EMPRESAS.map(function(id){
    return '<button class="rc-tab-btn rc-tab-btn--'+id+(id===rcState.tabAtiva?' active':'')+'" data-rc-action="set-tab" data-rc-tab="'+id+'">'+RC_EMP_LABEL[id]+'</button>';
  }).join('');
  tabs += '<button class="rc-tab-btn rc-tab-btn--elogios'+(rcState.tabAtiva==='elogios'?' active':'')+'" data-rc-action="set-tab" data-rc-tab="elogios">Elogios</button>';
  tabs += '<button class="rc-tab-btn rc-tab-btn--plano'+(rcState.tabAtiva==='plano'?' active':'')+'" data-rc-action="set-tab" data-rc-tab="plano">Plano de A&ccedil;&atilde;o</button>';

  var leftPanel = '';
  if      (rcState.tabAtiva==='grupo')   leftPanel=_rcPanelGrupo();
  else if (rcState.tabAtiva==='elogios') leftPanel=_rcPanelElogios();
  else if (rcState.tabAtiva==='plano')   leftPanel=_rcPanelPlano();
  else                                    leftPanel=_rcPanelEmpresa(rcState.tabAtiva);

  container.innerHTML = '<div class="rc-tabs">'+tabs+'</div>'
    +'<div style="display:flex;gap:20px;flex:1;min-height:0;margin-top:8px;overflow:hidden">'
    +'<div id="rc-left-panel" style="flex:0 0 55%;overflow-y:auto;min-width:0;padding-right:4px">'+leftPanel+'</div>'
    +'<div style="flex:1;min-width:280px;background:#fff;border-radius:12px;padding:16px;border:1px solid #eee;overflow-y:auto">'+_rcPreviewHTML()+'</div>'
    +'</div>';

  var newLeft = document.getElementById('rc-left-panel');
  if (newLeft && prevScroll) newLeft.scrollTop = prevScroll;
  _rcBindStep2Events();
  setTimeout(function(){ _rcUpdatePreviewChart(); }, 80);
}

// PAINEIS STEP 2
function _rcPanelGrupo() {
  var g = rcState.dadosGrupo || _rcInitDadosGrupo();
  var mesesRows = MESES.map(function(m,i){
    var cls = i===rcState.mes?'mes-atual':'';
    return '<tr>'
      +'<td style="font-weight:700;font-size:11px;color:#555;padding:4px 6px">'+m+'</td>'
      +'<td><input type="number" step="1" value="'+((g.qtde_mensal&&g.qtde_mensal[i])||'')+'" data-rc-grupo-mes="'+i+'" data-rc-grupo-mes-f="qtde_mensal" class="'+cls+'" style="width:70px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      +'<td><input type="text" value="'+((g.tratamento_mensal&&g.tratamento_mensal[i])||'')+'" data-rc-grupo-mes="'+i+'" data-rc-grupo-mes-f="tratamento_mensal" class="'+cls+'" placeholder="100,0" style="width:70px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      +'<td><input type="number" step="1" value="'+((g.inconsistencias_mensal&&g.inconsistencias_mensal[i])||'')+'" data-rc-grupo-mes="'+i+'" data-rc-grupo-mes-f="inconsistencias_mensal" class="'+cls+'" style="width:70px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      +'</tr>';
  }).join('');
  return '<div class="rc-secao-titulo">Grupo JCA - KPIs Acumulados (UTP '+rcState.ano+')</div>'
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">'
    +_rcInputBox('Recebidas (acum.)',g.qtde_acum||'','rc-grupo-kpi','qtde_acum','number','0')
    +_rcInputBox('Tratamento %',g.tratamento_pct||'','rc-grupo-kpi','tratamento_pct','text','99,8')
    +_rcInputBox('Nao Ident. (qtde)',g.nao_ident_qtde||'','rc-grupo-kpi','nao_ident_qtde','number','0')
    +_rcInputBox('Nao Ident. %',g.nao_ident_pct||'','rc-grupo-kpi','nao_ident_pct','text','0,2')
    +_rcInputBox('Inconsist&ecirc;ncias %',g.inconsistencias_pct||'','rc-grupo-kpi','inconsistencias_pct','text','9,3')
    +_rcInputBox('Consistentes %',g.consistentes_pct||'','rc-grupo-kpi','consistentes_pct','text','90,7')
    +'</div>'
    +'<div class="rc-secao-titulo">Evolucao Mensal - Reclamacoes / Tratamento / Inconsist&ecirc;ncias</div>'
    +'<div style="overflow-x:auto;margin-bottom:12px">'
    +'<table style="border-collapse:collapse;font-size:11px;width:100%"><thead><tr style="background:#f0f3fb">'
    +'<th style="padding:5px 6px;text-align:left;font-size:10px;color:#888">MES</th>'
    +'<th style="padding:5px 6px;text-align:center;font-size:10px;color:#888">RECLAM.</th>'
    +'<th style="padding:5px 6px;text-align:center;font-size:10px;color:#1a7a3c">TRATAM. %</th>'
    +'<th style="padding:5px 6px;text-align:center;font-size:10px;color:#c0392b">INCONS.</th>'
    +'</tr></thead><tbody>'+mesesRows+'</tbody></table></div>';
}

function _rcPanelEmpresa(empId) {
  var d = rcState.dados[empId] || _rcInitEmpresa();
  var mesesRows = MESES.map(function(m,i){
    var cls = i===rcState.mes?'mes-atual':'';
    return '<tr>'
      +'<td style="font-weight:700;font-size:11px;color:#555;padding:4px 6px">'+m+'</td>'
      +'<td><input type="number" step="1" value="'+((d.qtde_mensal[i])||'')+'" data-rc-emp="'+empId+'" data-rc-campo="qtde_mensal" data-rc-mes="'+i+'" class="'+cls+'" style="width:70px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      +'<td><input type="text" value="'+((d.tratamento_mensal[i])||'')+'" data-rc-emp="'+empId+'" data-rc-campo="tratamento_mensal" data-rc-mes="'+i+'" class="'+cls+'" placeholder="100,0" style="width:70px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      +'<td><input type="number" step="1" value="'+((d.inconsistencias_mensal[i])||'')+'" data-rc-emp="'+empId+'" data-rc-campo="inconsistencias_mensal" data-rc-mes="'+i+'" class="'+cls+'" style="width:70px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      +'</tr>';
  }).join('');
  var motivosMesRows = (d.motivos_mes||[]).map(function(m,i){
    return '<tr>'
      +'<td><input type="text" value="'+(m.descricao||'')+'" data-rc-emp="'+empId+'" data-rc-motmes-idx="'+i+'" data-rc-motmes-f="descricao" placeholder="Ex: Abandono de Passageiro"></td>'
      +'<td><input type="number" step="1" value="'+(m.qtde||'')+'" data-rc-emp="'+empId+'" data-rc-motmes-idx="'+i+'" data-rc-motmes-f="qtde" style="text-align:center"></td>'
      +'<td><input type="text" value="'+(m.tratamento_pct||'')+'" data-rc-emp="'+empId+'" data-rc-motmes-idx="'+i+'" data-rc-motmes-f="tratamento_pct" placeholder="100,0%" style="text-align:center"></td>'
      +'<td><button class="rc-btn-rm" data-rc-action="rm-motmes" data-rc-emp="'+empId+'" data-rc-idx="'+i+'">&#10005;</button></td></tr>';
  }).join('');
  var motivosAcumRows = (d.motivos_acum||[]).map(function(m,i){
    return '<tr>'
      +'<td><input type="text" value="'+(m.descricao||'')+'" data-rc-emp="'+empId+'" data-rc-motacum-idx="'+i+'" data-rc-motacum-f="descricao" placeholder="Ex: Abandono de Passageiro"></td>'
      +'<td><input type="number" step="1" value="'+(m.qtde||'')+'" data-rc-emp="'+empId+'" data-rc-motacum-idx="'+i+'" data-rc-motacum-f="qtde" style="text-align:center"></td>'
      +'<td><button class="rc-btn-rm" data-rc-action="rm-motacum" data-rc-emp="'+empId+'" data-rc-idx="'+i+'">&#10005;</button></td></tr>';
  }).join('');
  var abanRows = MESES.map(function(m,i){
    var cls = i===rcState.mes?'mes-atual':'';
    return '<tr>'
      +'<td style="font-weight:700;font-size:11px;color:#555;padding:4px 6px">'+m+'</td>'
      +'<td><input type="number" step="1" value="'+((d.abandono_2024[i])||'')+'" data-rc-emp="'+empId+'" data-rc-campo="abandono_2024" data-rc-mes="'+i+'" style="width:60px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      +'<td><input type="number" step="1" value="'+((d.abandono_2025[i])||'')+'" data-rc-emp="'+empId+'" data-rc-campo="abandono_2025" data-rc-mes="'+i+'" style="width:60px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      +'<td><input type="number" step="1" value="'+((d.abandono_2026[i])||'')+'" data-rc-emp="'+empId+'" data-rc-campo="abandono_2026" data-rc-mes="'+i+'" class="'+cls+'" style="width:60px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      +'</tr>';
  }).join('');
  return '<div class="rc-secao-titulo">'+RC_EMP_LABEL[empId]+' - KPIs Acumulados (UTP '+rcState.ano+')</div>'
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">'
    +_rcInputBox('Recebidas (acum.)',d.qtde_acum||'','rc-kpi-emp','qtde_acum','number','0',empId)
    +_rcInputBox('Tratamento %',d.tratamento_pct||'','rc-kpi-emp','tratamento_pct','text','100,0',empId)
    +_rcInputBox('Nao Ident. (qtde)',d.nao_ident_qtde||'','rc-kpi-emp','nao_ident_qtde','number','0',empId)
    +_rcInputBox('Nao Ident. %',d.nao_ident_pct||'','rc-kpi-emp','nao_ident_pct','text','0,0',empId)
    +_rcInputBox('Inconsist&ecirc;ncias %',d.inconsistencias_pct||'','rc-kpi-emp','inconsistencias_pct','text','0,0',empId)
    +_rcInputBox('Consistentes %',d.consistentes_pct||'','rc-kpi-emp','consistentes_pct','text','0,0',empId)
    +'</div>'
    +'<div class="rc-secao-titulo">Evolucao Mensal - Reclam. / Tratam. / Incons.</div>'
    +'<div style="overflow-x:auto;margin-bottom:12px">'
    +'<table style="border-collapse:collapse;font-size:11px;width:100%"><thead><tr style="background:#f0f3fb">'
    +'<th style="padding:5px 6px;text-align:left;font-size:10px;color:#888">MES</th>'
    +'<th style="padding:5px 6px;text-align:center;font-size:10px;color:#888">RECLAM.</th>'
    +'<th style="padding:5px 6px;text-align:center;font-size:10px;color:#1a7a3c">TRATAM. %</th>'
    +'<th style="padding:5px 6px;text-align:center;font-size:10px;color:#c0392b">INCONS.</th>'
    +'</tr></thead><tbody>'+mesesRows+'</tbody></table></div>'
    +'<div class="rc-secao-titulo">Motivos - '+MESES_FULL[rcState.mes]+' (mes fechamento)</div>'
    +'<table class="rc-form-table"><colgroup><col><col style="width:70px"><col style="width:80px"><col style="width:28px"></colgroup>'
    +'<thead><tr><th>Motivo</th><th class="th-center">Qtde</th><th class="th-center">Tratam.</th><th></th></tr></thead>'
    +'<tbody id="rc-motmes-tbody-'+empId+'">'+motivosMesRows+'</tbody></table>'
    +'<button class="rc-btn-add" data-rc-action="add-motmes" data-rc-emp="'+empId+'">+ Motivo do Mes</button>'
    +'<div class="rc-secao-titulo">Motivos - Acumulado '+rcState.ano+'</div>'
    +'<table class="rc-form-table"><colgroup><col><col style="width:80px"><col style="width:28px"></colgroup>'
    +'<thead><tr><th>Motivo</th><th class="th-center">Qtde Acum.</th><th></th></tr></thead>'
    +'<tbody id="rc-motacum-tbody-'+empId+'">'+motivosAcumRows+'</tbody></table>'
    +'<button class="rc-btn-add" data-rc-action="add-motacum" data-rc-emp="'+empId+'">+ Motivo Acumulado</button>'
    +'<div class="rc-secao-titulo">Abandono de Passageiro - Comparativo</div>'
    +'<div style="overflow-x:auto;margin-bottom:12px">'
    +'<table style="border-collapse:collapse;font-size:11px"><thead><tr style="background:#f0f3fb">'
    +'<th style="padding:5px 6px;text-align:left;font-size:10px;color:#888">MES</th>'
    +'<th style="padding:5px 6px;text-align:center;font-size:10px;color:#aaa">'+(rcState.ano-2)+'</th>'
    +'<th style="padding:5px 6px;text-align:center;font-size:10px;color:#777">'+(rcState.ano-1)+'</th>'
    +'<th style="padding:5px 6px;text-align:center;font-size:10px;color:#333">'+rcState.ano+'</th>'
    +'</tr></thead><tbody>'+abanRows+'</tbody></table></div>';
}

function _rcPanelElogios() {
  var e = rcState.elogios;
  var mesesRows = MESES.map(function(m,i){
    var cls = i===rcState.mes?'mes-atual':'';
    return '<tr>'
      +'<td style="font-weight:700;font-size:11px;color:#555;padding:4px 6px">'+m+'</td>'
      +'<td><input type="number" step="1" value="'+((e.mensal_1001[i])||'')+'" data-rc-elogios="mensal_1001" data-rc-mes="'+i+'" class="'+cls+'" style="width:65px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      +'<td><input type="number" step="1" value="'+((e.mensal_cat[i])||'')+'" data-rc-elogios="mensal_cat" data-rc-mes="'+i+'" style="width:65px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      +'<td><input type="number" step="1" value="'+((e.mensal_com[i])||'')+'" data-rc-elogios="mensal_com" data-rc-mes="'+i+'" style="width:65px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;font-size:11px;text-align:center;font-family:inherit"></td>'
      +'</tr>';
  }).join('');
  var mesEmpRows = (e.mes_empresa||[]).map(function(em,i){
    return '<tr>'
      +'<td><select data-rc-elogios-mesemp="'+i+'" data-rc-elogios-mesemp-f="empId" style="border:1px solid #ddd;border-radius:4px;padding:4px;font-size:12px;font-family:inherit;width:100%">'
      +RC_EMPRESAS.map(function(id){ return '<option value="'+id+'"'+(em.empId===id?' selected':'')+'>'+RC_EMP_LABEL[id]+'</option>'; }).join('')
      +'</select></td>'
      +'<td><input type="number" step="1" value="'+(em.qtde||'')+'" data-rc-elogios-mesemp="'+i+'" data-rc-elogios-mesemp-f="qtde" style="text-align:center"></td>'
      +'<td><input type="text" value="'+(em.tratamento_pct||'')+'" data-rc-elogios-mesemp="'+i+'" data-rc-elogios-mesemp-f="tratamento_pct" placeholder="100,0%" style="text-align:center"></td>'
      +'<td><button class="rc-btn-rm" data-rc-action="rm-elogios-mesemp" data-rc-idx="'+i+'">&#10005;</button></td></tr>';
  }).join('');
  return '<div class="rc-secao-titulo">Elogios - KPIs Acumulados</div>'
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">'
    +_rcInputBox('Recebidos (acum.)',e.qtde_acum||'','rc-elogios-kpi','qtde_acum','number','0')
    +_rcInputBox('Tratamento %',e.tratamento_pct||'','rc-elogios-kpi','tratamento_pct','text','100,0')
    +_rcInputBox('Nao Ident. (qtde)',e.nao_ident_qtde||'','rc-elogios-kpi','nao_ident_qtde','number','0')
    +_rcInputBox('Nao Ident. %',e.nao_ident_pct||'','rc-elogios-kpi','nao_ident_pct','text','0,0')
    +_rcInputBox('Inconsist&ecirc;ncias (qtde)',e.inconsistencias_qtde||'','rc-elogios-kpi','inconsistencias_qtde','number','0')
    +_rcInputBox('Inconsist&ecirc;ncias %',e.inconsistencias_pct||'','rc-elogios-kpi','inconsistencias_pct','text','0,0')
    +_rcInputBox('Consistentes %',e.consistentes_pct||'','rc-elogios-kpi','consistentes_pct','text','0,0')
    +'</div>'
    +'<div class="rc-secao-titulo">Evolucao Mensal - Elogios por Empresa</div>'
    +'<div style="overflow-x:auto;margin-bottom:12px">'
    +'<table style="border-collapse:collapse;font-size:11px;width:100%"><thead><tr style="background:#f0f3fb">'
    +'<th style="padding:5px 6px;text-align:left;font-size:10px;color:#888">MES</th>'
    +'<th style="padding:5px 6px;text-align:center;font-size:10px;color:#888">1001</th>'
    +'<th style="padding:5px 6px;text-align:center;font-size:10px;color:#03a5a5">CATARINENSE</th>'
    +'<th style="padding:5px 6px;text-align:center;font-size:10px;color:#1d3061">COMETA</th>'
    +'</tr></thead><tbody>'+mesesRows+'</tbody></table></div>'
    +'<div class="rc-secao-titulo">Detalhe do Mes - Elogios por Empresa</div>'
    +'<table class="rc-form-table"><colgroup><col><col style="width:80px"><col style="width:90px"><col style="width:28px"></colgroup>'
    +'<thead><tr><th>Empresa</th><th class="th-center">Qtde</th><th class="th-center">Tratamento %</th><th></th></tr></thead>'
    +'<tbody id="rc-elogios-mesemp-tbody">'+mesEmpRows+'</tbody></table>'
    +'<button class="rc-btn-add" data-rc-action="add-elogios-mesemp">+ Empresa</button>';
}

function _rcPanelPlano() {
  // Link único para copiar (URL base do plano de ação)
  var baseUrl = 'https://inteligenciaoperacional-ui.github.io/Apresentacoes-Indicadores/plano-de-acao-reclamacoes-cliente.html?mes='+rcState.mes+'&ano='+rcState.ano;

  var rows = RC_EMPRESAS.map(function(id) {
    var d      = rcState.dados[id] || _rcInitEmpresa();
    var p      = d.planoAcao || {};
    var locked = !!p.enviado;
    var solid  = RC_EMP_SOLID[id] || '#1d3061';
    var light  = RC_EMP_LIGHT[id] || 'rgba(0,0,0,.06)';
    var ident  = p.identificacao || '';
    var causas = p.causas        || '';
    var acoes  = p.acoes         || [];
    var editing = !!p._editando;

    // ── Conteúdo da Identificação ──
    var identContent = editing
      ? '<textarea id="edit-ident-'+id+'" rows="3" style="width:100%;border:1.5px solid '+solid+';border-radius:6px;padding:8px;font-size:12px;font-family:inherit;resize:vertical">'+ident+'</textarea>'
      : (ident ? '<div style="font-size:12px;color:#333;line-height:1.6">'+ident+'</div>'
               : '<div style="color:#ccc;font-style:italic;font-size:12px">Não preenchido</div>');

    // ── Conteúdo das Causas ──
    var causasContent = editing
      ? '<textarea id="edit-causas-'+id+'" rows="3" style="width:100%;border:1.5px solid '+solid+';border-radius:6px;padding:8px;font-size:12px;font-family:inherit;resize:vertical">'+causas+'</textarea>'
      : (causas ? '<div style="font-size:12px;color:#333;line-height:1.6">'+causas+'</div>'
                : '<div style="color:#ccc;font-style:italic;font-size:12px">Não preenchido</div>');

    // ── Ações ──
    var acoesContent = '';
    if (acoes.length) {
      if (editing) {
        acoesContent = '<table style="width:100%;border-collapse:collapse;font-size:12px">'
          +'<thead><tr style="background:'+solid+'">'
          +'<th style="padding:7px 10px;color:#fff;text-align:left;font-size:10px;font-weight:700">Ação</th>'
          +'<th style="padding:7px 10px;color:#fff;text-align:center;font-size:10px;font-weight:700;width:150px">Responsável</th>'
          +'<th style="padding:7px 10px;color:#fff;text-align:center;font-size:10px;font-weight:700;width:120px">Prazo</th>'
          +'</tr></thead><tbody>'
          + acoes.map(function(a,i){
              var bg = i%2===0 ? light : '#fff';
              return '<tr style="background:'+bg+'">'
                +'<td style="padding:5px 8px"><textarea id="edit-acao-'+id+'-'+i+'" rows="2" style="width:100%;border:1.5px solid #ddd;border-radius:4px;padding:5px 7px;font-size:12px;font-family:inherit;resize:none">'+(a.acao||'')+'</textarea></td>'
                +'<td style="padding:5px 8px"><input type="text" id="edit-resp-'+id+'-'+i+'" value="'+(a.responsavel||'')+'" style="width:100%;border:1.5px solid #ddd;border-radius:4px;padding:5px 7px;font-size:12px;font-family:inherit;text-align:center"></td>'
                +'<td style="padding:5px 8px"><input type="text" id="edit-prazo-'+id+'-'+i+'" value="'+(a.prazo||'')+'" style="width:100%;border:1.5px solid #ddd;border-radius:4px;padding:5px 7px;font-size:12px;font-family:inherit;text-align:center"></td>'
                +'</tr>';
            }).join('')
          +'</tbody></table>';
      } else {
        acoesContent = '<table style="width:100%;border-collapse:collapse;font-size:12px">'
          +'<thead><tr style="background:'+solid+'">'
          +'<th style="padding:7px 10px;color:#fff;text-align:left;font-size:10px;font-weight:700">Ação</th>'
          +'<th style="padding:7px 10px;color:#fff;text-align:center;font-size:10px;font-weight:700;width:150px">Responsável</th>'
          +'<th style="padding:7px 10px;color:#fff;text-align:center;font-size:10px;font-weight:700;width:120px">Prazo</th>'
          +'</tr></thead><tbody>'
          + acoes.map(function(a,i){
              var bg = i%2===0 ? light : '#fff';
              return '<tr style="background:'+bg+'">'
                +'<td style="padding:7px 10px;font-size:12px;color:#333">'+(a.acao||'—')+'</td>'
                +'<td style="padding:7px 10px;font-size:12px;color:#555;text-align:center">'+(a.responsavel||'—')+'</td>'
                +'<td style="padding:7px 10px;font-size:12px;color:#555;text-align:center">'+(a.prazo||'—')+'</td>'
                +'</tr>';
            }).join('')
          +'</tbody></table>';
      }
    } else {
      acoesContent = '<div style="color:#ccc;font-style:italic;font-size:12px;padding:4px 0">Nenhuma ação registrada</div>';
    }

    // ── Botões ──
    var btns = '';
    if (locked) {
      if (editing) {
        btns = '<button class="rc-btn-add" style="margin:0;font-size:11px;background:#1a7a3c" data-rc-plano-salvar="'+id+'" data-rc-action="plano-salvar-edicao">&#10003; Salvar edição</button>'
             + ' <button class="rc-btn-add" style="margin:0;font-size:11px;background:#888" data-rc-plano-cancelar="'+id+'" data-rc-action="plano-cancelar-edicao">Cancelar</button>';
      } else {
        btns = '<span style="background:'+solid+';color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px">&#10003; Recebido</span>'
             + ' <button class="rc-btn-add" style="margin:0;font-size:11px" data-rc-plano-editar="'+id+'" data-rc-action="plano-editar">&#9998; Editar</button>';
      }
    }

    return '<div style="margin-bottom:16px;border-radius:10px;border:1.5px solid '+(locked?solid:'#e0e0e0')+';overflow:hidden">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:'+(locked?light:'#f8f9fa')+';border-bottom:1px solid #eee">'
      +  '<img src="'+RC_LOGOS[id]+'" style="max-height:26px;object-fit:contain" alt="">'
      +  '<div style="display:flex;align-items:center;gap:8px">'+btns+'</div>'
      +'</div>'
      +'<div style="padding:14px">'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">'
      +  '<div style="border:1.5px solid '+solid+';border-radius:8px;overflow:hidden">'
      +    '<div style="background:'+solid+';color:#fff;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;padding:6px 10px">Identificação dos Desvios</div>'
      +    '<div style="padding:10px">'+identContent+'</div>'
      +  '</div>'
      +  '<div style="border:1.5px solid '+solid+';border-radius:8px;overflow:hidden">'
      +    '<div style="background:'+solid+';color:#fff;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;padding:6px 10px">Principais Causas do Desvio</div>'
      +    '<div style="padding:10px">'+causasContent+'</div>'
      +  '</div>'
      +'</div>'
      +'<div style="font-size:9px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Ações do Plano</div>'
      +acoesContent
      +'</div>'
      +'</div>';
  }).join('');

  // Botão único de link
  var linkUrl = baseUrl;
  return '<div class="rc-secao-titulo">Plano de A&ccedil;&atilde;o por Empresa</div>'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'
    +'<p style="font-size:12px;color:#888;margin:0">Copie o link e envie para as empresas preencherem. Ap&oacute;s retorno, use <strong>Importar Planos</strong>.</p>'
    +'<button class="rc-btn-add" style="margin:0;font-size:12px;white-space:nowrap;flex-shrink:0" '
    +'data-rc-action="rc-copiar-link-plano" data-rc-url="'+linkUrl+'">&#128279; Copiar link do Plano</button>'
    +'</div>'
    +rows;
}


function _rcInputBox(lbl,val,dataAttr,field,type,placeholder,emp) {
  var empAttr=emp?' data-rc-emp-id="'+emp+'"':'';
  return '<div><label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">'+lbl+'</label>'
    +'<input type="'+(type||'text')+'" step="any" value="'+(val||'')+'" data-'+dataAttr+'="'+field+'"'+empAttr
    +' placeholder="'+(placeholder||'0')+'" style="width:100%;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;font-family:inherit;box-sizing:border-box"></div>';
}

// PREVIEW
function _rcPreviewHTML() {
  var tab=rcState.tabAtiva;
  if(tab==='plano'||tab==='elogios') return '<div style="font-size:12px;color:#888;padding:10px">Selecione uma empresa para ver o preview.</div>';
  var d=tab==='grupo'?_rcDadosGrupo():(rcState.dados[tab]||_rcInitEmpresa());
  var empLabel=RC_EMP_LABEL[tab]||tab;
  var mesLabel=MESES_FULL[rcState.mes]+' / '+rcState.ano;
  return '<div style="font-size:12px;font-weight:700;color:#1d3061;margin-bottom:4px">Preview - '+empLabel+'</div>'
    +'<div style="font-size:10px;color:#888;margin-bottom:8px">'+mesLabel+'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">'
    +'<div style="border:1px solid #eee;border-radius:8px;padding:6px 10px"><div style="font-size:9px;font-weight:700;color:#888">RECEBIDAS</div><div style="font-size:16px;font-weight:700;color:#c0392b">'+(d.qtde_acum||'--')+'</div></div>'
    +'<div style="border:1px solid #eee;border-radius:8px;padding:6px 10px"><div style="font-size:9px;font-weight:700;color:#888">TRATAMENTO</div><div style="font-size:16px;font-weight:700;color:#1a7a3c">'+(d.tratamento_pct||'--')+'%</div></div>'
    +'<div style="border:1px solid #eee;border-radius:8px;padding:6px 10px"><div style="font-size:9px;font-weight:700;color:#888">INCONSISTENCIAS</div><div style="font-size:16px;font-weight:700;color:#e67e22">'+(d.inconsistencias_pct||'--')+'%</div></div>'
    +'<div style="border:1px solid #eee;border-radius:8px;padding:6px 10px"><div style="font-size:9px;font-weight:700;color:#888">CONSISTENTES</div><div style="font-size:16px;font-weight:700;color:#1d3061">'+(d.consistentes_pct||'--')+'%</div></div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    +'<div><div style="font-size:10px;font-weight:700;color:#1d3061;margin-bottom:4px">Reclamacoes</div><div style="height:130px"><canvas id="rc-preview-chart"></canvas></div></div>'
    +'<div><div style="font-size:10px;font-weight:700;color:#c0392b;margin-bottom:4px">Inconsist&ecirc;ncias</div><div style="height:130px"><canvas id="rc-preview-incons-chart"></canvas></div></div>'
    +'</div>';
}

function _rcUpdatePreviewChart() {
  var tab=rcState.tabAtiva;
  if(tab==='plano'||tab==='elogios') return;
  var d=tab==='grupo'?_rcDadosGrupo():(rcState.dados[tab]||_rcInitEmpresa());
  var ate=rcState.mes+1, labels=MESES.slice(0,ate);
  var barColor=tab==='grupo'?RC_BAR_COLORS.grupo:(RC_BAR_COLORS[tab]||RC_BAR_COLORS.grupo);
  var baseOpts={responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},datalabels:{anchor:'end',align:'top',font:{size:9,weight:'bold'},color:'#1d3061',formatter:function(v){return v>0?v:'';}  }},
    scales:{x:{grid:{display:false},ticks:{font:{size:8}}},y:{beginAtZero:true,display:false}}};
  var c1=document.getElementById('rc-preview-chart');
  if(c1){
    if(rcCharts['preview']){try{rcCharts['preview'].destroy();}catch(e){}}
    rcCharts['preview']=new Chart(c1,{type:'bar',data:{labels:labels,datasets:[{data:(d.qtde_mensal||[]).slice(0,ate).map(function(v){return parseInt(v)||0;}),backgroundColor:barColor,borderRadius:3}]},plugins:[ChartDataLabels],options:baseOpts});
  }
  var c2=document.getElementById('rc-preview-incons-chart');
  if(c2){
    if(rcCharts['preview-incons']){try{rcCharts['preview-incons'].destroy();}catch(e){}}
    var opts2=JSON.parse(JSON.stringify(baseOpts));
    opts2.plugins.datalabels.color='#c0392b';
    rcCharts['preview-incons']=new Chart(c2,{type:'bar',data:{labels:labels,datasets:[{data:(d.inconsistencias_mensal||[]).slice(0,ate).map(function(v){return parseInt(v)||0;}),backgroundColor:'rgba(236,152,152,.8)',borderRadius:3}]},plugins:[ChartDataLabels],options:opts2});
  }
}

// BIND EVENTOS
function _rcBindStep2Events() {
  var left=document.getElementById('rc-left-panel');
  if(!left) return;
  left.addEventListener('input',function(e){
    var el=e.target;
    if(el.dataset.rcGrupoKpi){
      if(!rcState.dadosGrupo) rcState.dadosGrupo=_rcInitDadosGrupo();
      rcState.dadosGrupo[el.dataset.rcGrupoKpi]=el.value; _rcUpdatePreviewChart(); return;
    }
    if(el.dataset.rcGrupoMes!==undefined&&el.dataset.rcGrupoMesF){
      if(!rcState.dadosGrupo) rcState.dadosGrupo=_rcInitDadosGrupo();
      var campo=el.dataset.rcGrupoMesF, idx=parseInt(el.dataset.rcGrupoMes);
      if(!rcState.dadosGrupo[campo]) rcState.dadosGrupo[campo]=Array(12).fill('');
      rcState.dadosGrupo[campo][idx]=el.value; _rcUpdatePreviewChart(); return;
    }
    if(el.dataset.rcEmp&&el.dataset.rcCampo&&el.dataset.rcMes!==undefined){
      var id=el.dataset.rcEmp,campo=el.dataset.rcCampo,idx=parseInt(el.dataset.rcMes);
      if(!rcState.dados[id]) rcState.dados[id]=_rcInitEmpresa();
      rcState.dados[id][campo][idx]=campo==='tratamento_mensal'?el.value:(parseInt(el.value)||0);
      _rcUpdatePreviewChart(); return;
    }
    if(el.dataset.rcKpiEmp&&el.dataset.rcEmpId){
      var id=el.dataset.rcEmpId;
      if(!rcState.dados[id]) rcState.dados[id]=_rcInitEmpresa();
      rcState.dados[id][el.dataset.rcKpiEmp]=el.value; _rcUpdatePreviewChart(); return;
    }
    if(el.dataset.rcEmp&&el.dataset.rcMotmesIdx!==undefined){
      var id=el.dataset.rcEmp,idx=parseInt(el.dataset.rcMotmesIdx),f=el.dataset.rcMotmesF;
      if(!rcState.dados[id].motivos_mes[idx]) rcState.dados[id].motivos_mes[idx]={};
      rcState.dados[id].motivos_mes[idx][f]=f==='qtde'?(parseInt(el.value)||0):el.value; return;
    }
    if(el.dataset.rcEmp&&el.dataset.rcMotacumIdx!==undefined){
      var id=el.dataset.rcEmp,idx=parseInt(el.dataset.rcMotacumIdx),f=el.dataset.rcMotacumF;
      if(!rcState.dados[id].motivos_acum[idx]) rcState.dados[id].motivos_acum[idx]={};
      rcState.dados[id].motivos_acum[idx][f]=f==='qtde'?(parseInt(el.value)||0):el.value; return;
    }
    if(el.dataset.rcElogiosKpi){ rcState.elogios[el.dataset.rcElogiosKpi]=el.value; return; }
    if(el.dataset.rcElogios&&el.dataset.rcMes!==undefined){
      rcState.elogios[el.dataset.rcElogios][parseInt(el.dataset.rcMes)]=parseInt(el.value)||0; return;
    }
    if(el.dataset.rcElogiosMesemp!==undefined&&el.dataset.rcElogiosMesempF){
      var idx=parseInt(el.dataset.rcElogiosMesemp),f=el.dataset.rcElogiosMesempF;
      if(!rcState.elogios.mes_empresa[idx]) rcState.elogios.mes_empresa[idx]={};
      rcState.elogios.mes_empresa[idx][f]=f==='qtde'?(parseInt(el.value)||0):el.value; return;
    }
    if(el.dataset.rcPlanoEmp){
      var id=el.dataset.rcPlanoEmp;
      if(!rcState.dados[id]) rcState.dados[id]=_rcInitEmpresa();
      rcState.dados[id].planoAcao.texto=el.value; return;
    }
  });
}

// STEP 3 - VISUALIZADOR
function _rcStep3HTML() {
  var slides=rcState.slides,slideIdx=rcState.slideIdx||0;
  var mesLabel=MESES_FULL[rcState.mes]+'/'+rcState.ano;
  function thumbLabel(s){
    if(s.type==='capa')            return 'Capa';
    if(s.type==='utp')             return 'UTP\n'+RC_EMP_LABEL[s.emp];
    if(s.type==='detalhe')         return MESES[rcState.mes]+'\n'+RC_EMP_LABEL[s.emp];
    if(s.type==='abandono')        return 'Abandono\n'+RC_EMP_LABEL[s.emp];
    if(s.type==='elogios-evolucao')return 'Elogios\nEvolucao';
    if(s.type==='elogios-detalhe') return 'Elogios\nDetalhe';
    if(s.type==='contra-capa')     return 'Contra\nCapa';
    return 'Slide';
  }
  var thumbsHTML=slides.map(function(s,i){
    return '<div class="thumb'+(i===slideIdx?' thumb--active':'')+'" data-rc-action="go-slide" data-rc-idx="'+i+'">'
      +'<div class="thumb__preview" style="white-space:pre-line">'+thumbLabel(s)+'</div>'
      +'<div class="thumb__num">'+(i+1)+'</div></div>';
  }).join('');
  return '<div class="preview-page" style="height:100vh;overflow:hidden">'
    +'<div class="preview-bar"><div class="preview-bar__left">'
    +'<button class="preview-bar__arrow" style="font-size:13px;padding:4px 12px" data-rc-action="go-step" data-rc-step="2">&#8592; Voltar</button>'
    +'<button class="preview-bar__arrow" style="font-size:13px;padding:4px 12px" data-rc-action="go-home">Inicio</button>'
    +'<span class="preview-bar__info">Reclamacoes - Slide '+(slideIdx+1)+' / '+slides.length+' - '+mesLabel+'</span>'
    +'</div><div class="preview-bar__nav">'
    +'<button class="preview-bar__arrow" data-rc-action="prev-slide">&#8592;</button>'
    +'<button class="preview-bar__arrow" data-rc-action="next-slide">&#8594;</button>'
    +'</div>'
    +'<button class="preview-bar__arrow" id="rc-btn-pdf" data-rc-action="rc-gerar-pdf" style="font-size:12px;padding:4px 14px">Gerar PDF</button>'
    +'</div>'
    +'<div class="preview-body" style="flex:1;min-height:0;overflow:hidden;display:flex">'
    +'<div class="thumbs" style="overflow-y:auto;overflow-x:hidden;flex-shrink:0">'+thumbsHTML+'</div>'
    +'<div class="slide-canvas" style="flex:1;display:flex;align-items:center;justify-content:center;padding:28px;min-height:0;overflow:hidden">'
    +'<div class="slide-frame" id="rc-slide-frame" style="overflow:hidden;flex-shrink:0"></div>'
    +'</div></div></div>';
}

function _rcRenderCurrentSlide() {
  var frame=document.getElementById('rc-slide-frame');
  if(!frame||!rcState.slides) return;
  _rcDestroyAllCharts();
  var s=rcState.slides[rcState.slideIdx||0],html='';
  if      (s.type==='capa')            html=_rcSlideCapa();
  else if (s.type==='utp')             html=_rcSlideUTP(s.emp);
  else if (s.type==='detalhe')         html=_rcSlideDetalhe(s.emp);
  else if (s.type==='plano1')          html=_rcSlidePlano1(s.emp);
  else if (s.type==='plano2')          html=_rcSlidePlano2(s.emp);
  else if (s.type==='abandono')        html=_rcSlideAbandono(s.emp);
  else if (s.type==='elogios-evolucao')html=_rcSlideElogiosEvolucao();
  else if (s.type==='elogios-detalhe') html=_rcSlideElogiosDetalhe();
  else if (s.type==='contra-capa')     html=_rcSlideContraCapa();
  frame.innerHTML=html;
  requestAnimationFrame(function(){
    var slide=frame.querySelector('.rc-slide');
    if(slide){slide.style.width='100%';slide.style.height='100%';slide.style.boxShadow='none';slide.style.borderRadius='0';}
  });
  setTimeout(function(){
    if(s.type==='utp'){_rcInitUTPChart(s.emp);_rcInitInconsistChart(s.emp);}
    if(s.type==='detalhe')          _rcInitHBarChart(s.emp);
    if(s.type==='abandono')         _rcInitAbandonoChart(s.emp);
    if(s.type==='elogios-evolucao') _rcInitElogiosEvolucaoChart();
  },80);
}
function _rcUpdateActiveThumbs() {
  document.querySelectorAll('.thumb').forEach(function(t,i){
    t.classList.toggle('thumb--active',i===rcState.slideIdx);
    if(i===rcState.slideIdx) t.scrollIntoView({block:'nearest',behavior:'smooth'});
  });
}
function _rcUpdateSlideCounter() {
  var el=document.querySelector('.preview-bar__info');
  if(el) el.textContent='Reclamacoes - Slide '+(rcState.slideIdx+1)+' / '+rcState.slides.length+' - '+MESES_FULL[rcState.mes]+'/'+rcState.ano;
  var prev=document.querySelector('[data-rc-action="prev-slide"]');
  var next=document.querySelector('[data-rc-action="next-slide"]');
  if(prev) prev.disabled=rcState.slideIdx===0;
  if(next) next.disabled=rcState.slideIdx===rcState.slides.length-1;
}

// SLIDES HTML
function _rcSlideHeader(empId) {
  var logoEmp=(empId&&empId!=='grupo')?'<img src="'+RC_LOGOS[empId]+'" class="rc-emp-logo" alt="">':'';
  return '<div class="rc-slide-header"><div class="rc-slide-header__row">'
    +'<img src="'+RC_LOGO_JCA+'" style="height:30px;object-fit:contain" alt="JCA">'
    +'<span class="rc-slide-header__modulo">Reclamacoes de Clientes - Motoristas</span>'
    +'</div><div class="rc-slide-header__line"></div></div>'+logoEmp;
}
function _rcSlideFooter() {
  var txt=rcState.analista?'DO.ACT.IOP - '+rcState.analista:'DO.ACT.IOP';
  return '<div class="rc-slide-footer">'
    +'<span class="rc-slide-footer__text">'+txt+'</span>'
    +'<img src="'+RC_LOGO_IO+'" style="height:28px;object-fit:contain" alt="IO"></div>';
}
function _rcSlideCapa() {
  var mesLabel=MESES_FULL[rcState.mes]+' / '+rcState.ano;
  var analista=rcState.analista?'DO.ACT.IOP - '+rcState.analista:'DO.ACT.IOP';
  return '<div class="rc-slide" style="position:relative"><div class="rc-slide-capa">'
    +'<div class="logos-row"><img src="'+RC_LOGO_JCA+'" alt="JCA"><div class="sep"></div>'
    +'<img src="'+RC_LOGO_IO_CAPA+'" alt="IO" style="opacity:.9"></div>'
    +'<div class="titulo">Reclamacoes</div>'
    +'<div class="subtitulo">Identificacao de Motorista - '+mesLabel+'</div>'
    +'</div><div class="rc-rodape-autor">'+analista+'</div></div>';
}
function _rcSlideContraCapa() {
  var analista=rcState.analista?'DO.ACT.IOP - '+rcState.analista:'DO.ACT.IOP';
  return '<div class="rc-slide" style="position:relative"><div class="rc-slide-capa">'
    +'<div class="logos-row"><img src="'+RC_LOGO_JCA+'" alt="JCA"><div class="sep"></div>'
    +'<img src="'+RC_LOGO_IO_CAPA+'" alt="IO" style="opacity:.9"></div>'
    +'</div><div class="rc-rodape-autor">'+analista+'</div></div>';
}

// KPIs comuns
function _rcKpisHTML(d) {
  return '<div class="rc-kpis-row">'
    +_rcKpiCardSm('Recebidas',d.qtde_acum||'--','#c0392b')
    +_rcKpiCardSm('Tratamento',(d.tratamento_pct||'--')+'%','#1a7a3c')
    +_rcKpiCardSm('Nao Ident.',(d.nao_ident_qtde||'0')+' ('+(d.nao_ident_pct||'0,0')+'%)','#888')
    +_rcKpiCardSm('Inconsist&ecirc;ncias',(d.inconsistencias_pct||'--')+'%','#e67e22')
    +_rcKpiCardSm('Consistentes',(d.consistentes_pct||'--')+'%','#1d3061')
    +'</div>';
}
function _rcKpiCardSm(label,value,cor) {
  return '<div class="rc-kpi-card-sm"><div class="rc-kpi-card-sm__label" style="color:'+cor+'">'+label+'</div>'
    +'<div class="rc-kpi-card-sm__value" style="color:'+cor+'">'+value+'</div></div>';
}

// Slide UTP
function _rcSlideUTP(empId) {
  var d=empId==='grupo'?_rcDadosGrupo():(rcState.dados[empId]||_rcInitEmpresa());
  var logoId=empId==='grupo'?null:empId;
  return '<div class="rc-slide">'+_rcSlideHeader(logoId)
    +'<div class="rc-slide-body">'
    +'<div class="rc-slide-secao">Reclamacoes Total | Motorista - UTP '+rcState.ano+'</div>'
    +_rcKpisHTML(d)
    +'<div class="rc-utp-layout">'
    +'<div class="rc-utp-chart-wrap"><canvas id="rc-chart-utp-'+empId+'"></canvas></div>'
    +'<div class="rc-utp-right">'
    +'<div class="rc-incons-title">Inconsist&ecirc;ncias</div>'
    +'<div class="rc-incons-chart-wrap"><canvas id="rc-chart-incons-'+empId+'"></canvas></div>'
    +'<div style="height:28px;flex-shrink:0"></div>'
    +'</div>'
    +'</div></div>'+_rcSlideFooter()+'</div>';
}

// Slide Detalhe
function _rcSlideDetalhe(empId) {
  var d=rcState.dados[empId]||_rcInitEmpresa();
  var mesLabel=MESES_FULL[rcState.mes]+' '+rcState.ano;
  var motivos=(d.motivos_mes||[]).filter(function(m){return m.descricao;});
  var thColor  = RC_TABLE_HEADER[empId]  || '#1d3061';
  var rowOdd   = RC_TABLE_ROW_ODD[empId] || '#fdf5f5';
  var motivosRows=motivos.map(function(m,i){
    var bg = (i%2===0) ? rowOdd : '#fff';
    return '<tr style="background:'+bg+'">'
      +'<td style="text-align:center;font-weight:700;font-size:13px;color:#1d3061;padding:8px 14px">'+(parseInt(m.qtde)||0)+'</td>'
      +'<td style="color:#555;font-size:12px;padding:8px 10px">'+m.descricao+'</td>'
      +'<td style="text-align:center;font-weight:700;font-size:12px;color:#1a7a3c;padding:8px 10px">'+(m.tratamento_pct||'--')+'%</td>'
      +'</tr>';
  }).join('')||'<tr><td colspan="3" style="color:#bbb;font-style:italic;font-size:11px;text-align:center;padding:12px">Sem dados</td></tr>';
  return '<div class="rc-slide">'+_rcSlideHeader(empId)
    +'<div class="rc-slide-body">'
    +'<div class="rc-slide-secao">Reclamacoes Total | '+mesLabel+'</div>'
    +_rcKpisHTML(d)
    +'<div class="rc-dual-layout" style="margin-top:8px">'
    +'<div class="rc-dual-left">'
    +'<table class="rc-motivos-table">'
    +'<thead><tr style="background:'+thColor+'">'
    +'<th style="color:#fff">Qtd</th><th style="color:#fff">MOTIVOS</th><th style="color:#fff">TRATADAS</th>'
    +'</tr></thead>'
    +'<tbody>'+motivosRows+'</tbody>'
    +'</table>'
    +'</div>'
    +'<div class="rc-divider"></div>'
    +'<div class="rc-dual-right"><div class="rc-incons-title" style="color:#1d3061">Motivos Acumulados</div>'
    +'<div style="flex:1;min-height:0"><canvas id="rc-chart-hbar-'+empId+'"></canvas></div>'
    +'</div></div></div>'+_rcSlideFooter()+'</div>';
}


// Slide Abandono
function _rcSlideAbandono(empId) {
  return '<div class="rc-slide">'+_rcSlideHeader(empId)
    +'<div class="rc-slide-body">'
    +'<div class="rc-slide-secao">Reclamacoes | Evolucao de Abandono de Cliente</div>'
    +'<div style="flex:1;min-height:0"><canvas id="rc-chart-aband-'+empId+'"></canvas></div>'
    +'</div>'+_rcSlideFooter()+'</div>';
}

// Slide Elogios Evolucao
function _rcSlideElogiosEvolucao() {
  var e=rcState.elogios;
  return '<div class="rc-slide">'+_rcSlideHeader(null)
    +'<div class="rc-slide-body">'
    +'<div class="rc-slide-secao">Elogios | Evolucao Anual de elogios</div>'
    +'<div class="rc-elogios-kpis">'
    +_rcKpiCardSm('Recebidas',e.qtde_acum||'--','#1d3061')
    +_rcKpiCardSm('Tratamento',(e.tratamento_pct||'--')+'%','#1a7a3c')
    +_rcKpiCardSm('Nao Ident.',(e.nao_ident_qtde||'0')+' ('+(e.nao_ident_pct||'0,0')+'%)','#888')
    +_rcKpiCardSm('Inconsist&ecirc;ncias',(e.inconsistencias_qtde||'0')+' ('+(e.inconsistencias_pct||'0,0')+'%)','#e67e22')
    +_rcKpiCardSm('Consistentes',(e.consistentes_pct||'--')+'%','#1d3061')
    +'</div>'
    +'<div style="flex:1;min-height:0;margin-top:8px"><canvas id="rc-chart-elogios-evolucao"></canvas></div>'
    +'</div>'+_rcSlideFooter()+'</div>';
}

// Slide Elogios Detalhe
function _rcSlideElogiosDetalhe() {
  var e=rcState.elogios;
  var mesLabel=MESES_FULL[rcState.mes]+' '+rcState.ano;
  var rows=(e.mes_empresa||[]).map(function(em,i){
    var bg=i%2===0?'#fdf5f5':'#fff';
    return '<tr style="background:'+bg+'">'
      +'<td style="padding:10px 18px;text-align:center;border-right:1px solid #eee"><img src="'+RC_LOGOS[em.empId]+'" style="max-height:30px;max-width:120px;object-fit:contain" alt=""></td>'
      +'<td style="text-align:center;font-weight:700;font-size:20px;color:#1d3061;padding:10px 20px;border-right:1px solid #eee">'+(em.qtde||'--')+'</td>'
      +'<td style="text-align:center;font-weight:700;font-size:15px;color:#1a7a3c;padding:10px 16px">'+(em.tratamento_pct||'--')+'%</td>'
      +'</tr>';
  }).join('')||'<tr><td colspan="3" style="color:#bbb;font-style:italic;font-size:11px;text-align:center;padding:16px">Sem dados</td></tr>';
  return '<div class="rc-slide">'+_rcSlideHeader(null)
    +'<div class="rc-slide-body">'
    +'<div class="rc-slide-secao">Elogios | Motorista - UTP '+mesLabel+'</div>'
    +'<div class="rc-elogios-kpis">'
    +_rcKpiCardSm('Recebidas',e.qtde_acum||'--','#1d3061')
    +_rcKpiCardSm('Tratamento',(e.tratamento_pct||'--')+'%','#1a7a3c')
    +_rcKpiCardSm('Nao Ident.',(e.nao_ident_qtde||'0')+' ('+(e.nao_ident_pct||'0,0')+'%)','#888')
    +_rcKpiCardSm('Inconsist&ecirc;ncias',(e.inconsistencias_qtde||'0')+' ('+(e.inconsistencias_pct||'0,0')+'%)','#e67e22')
    +_rcKpiCardSm('Consistentes',(e.consistentes_pct||'--')+'%','#1d3061')
    +'</div>'
    +'<div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:0">'
    +'<div style="width:520px">'
    +'<table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">'
    +'<thead><tr style="background:#1d3061">'
    +'<th style="padding:10px 18px;text-align:center;color:#fff;font-size:12px;font-weight:700;width:180px">Empresa</th>'
    +'<th style="padding:10px 18px;text-align:center;color:#fff;font-size:12px;font-weight:700">'+mesLabel+'</th>'
    +'<th style="padding:10px 18px;text-align:center;color:#fff;font-size:12px;font-weight:700">Tratamento</th>'
    +'</tr></thead><tbody>'+rows+'</tbody></table></div></div>'
    +'</div>'+_rcSlideFooter()+'</div>';
}


// ── Helper: pegar dados do plano de ação ─────────────
function _rcPlanoAcoes(empId) {
  var d = rcState.dados[empId] || _rcInitEmpresa();
  var p = d.planoAcao || {};
  return p.acoes || [];
}

// ── SLIDE PLANO 1: Identificação dos Desvios + Principais Causas ──────────
function _rcSlidePlano1(empId) {
  var d      = rcState.dados[empId] || _rcInitEmpresa();
  var p      = d.planoAcao || {};
  var solid  = RC_EMP_SOLID[empId] || '#1d3061';
  var light  = RC_EMP_LIGHT[empId] || 'rgba(0,0,0,.06)';
  var ident  = p.identificacao || '';
  var causas = p.causas        || '';

  // ── Motivos do mês: ficam ACIMA das colunas ──
  var motivos = (d.motivos_mes || []).filter(function(m){ return m.descricao; });
  var ofensoresBox = motivos.length
    ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;flex-shrink:0">'
      + motivos.slice(0,5).map(function(m){
          return '<div style="display:inline-flex;align-items:center;gap:6px;background:'+light+';border:1px solid '+solid+';border-radius:20px;padding:3px 10px 3px 4px">'
            +'<span style="background:'+solid+';color:#fff;font-size:10px;font-weight:700;padding:1px 8px;border-radius:20px">'+(parseInt(m.qtde)||0)+'</span>'
            +'<span style="font-size:11px;color:#333;font-weight:500">'+m.descricao+'</span>'
            +'</div>';
        }).join('')
      +'</div>'
    : '';

  // ── Conteúdo das colunas: apenas resposta da empresa ──
  var identHTML = ident
    ? '<ul style="margin:0;padding-left:18px">'+ident.split('\n').filter(function(l){return l.trim();}).map(function(l){
        return '<li style="font-size:12px;color:#333;margin-bottom:6px;line-height:1.6">'+l.replace(/;$/, '')+'</li>';
      }).join('')+'</ul>'
    : '<div style="color:#bbb;font-style:italic;font-size:12px;text-align:center;margin-top:20px">Aguardando preenchimento</div>';

  var causasHTML = causas
    ? '<ul style="margin:0;padding-left:18px">'+causas.split('\n').filter(function(l){return l.trim();}).map(function(l){
        return '<li style="font-size:12px;color:#333;margin-bottom:6px;line-height:1.6">'+l.replace(/;$/, '')+'</li>';
      }).join('')+'</ul>'
    : '<div style="color:#bbb;font-style:italic;font-size:12px;text-align:center;margin-top:20px">Aguardando preenchimento</div>';

  return '<div class="rc-slide">'+_rcSlideHeader(empId)
    +'<div class="rc-slide-body">'
    // Título
    +'<div style="font-size:15px;font-weight:700;color:'+solid+';flex-shrink:0;margin-bottom:2px">Reclama&ccedil;&otilde;es | Plano de A&ccedil;&atilde;o</div>'
    +'<div style="font-size:11px;color:#888;flex-shrink:0;margin-bottom:10px">Desvios Constatados — '+MESES_FULL[rcState.mes]+' '+rcState.ano+'</div>'
    // Motivos do mês (fora das colunas)
    +ofensoresBox
    // Divisor
    +(ofensoresBox?'<div style="border-top:1px solid rgba(0,0,0,.08);margin-bottom:12px;flex-shrink:0"></div>':'')
    // Duas colunas
    +'<div style="flex:1;min-height:0;display:flex;gap:14px">'
    +'<div style="flex:1;min-width:0;border:1.5px solid '+solid+';border-radius:10px;overflow:hidden;display:flex;flex-direction:column">'
    +  '<div style="background:'+solid+';color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:8px 14px;flex-shrink:0">Identifica&ccedil;&atilde;o dos Desvios</div>'
    +  '<div style="padding:14px;flex:1;background:'+light+'">'+identHTML+'</div>'
    +'</div>'
    +'<div style="flex:1;min-width:0;border:1.5px solid '+solid+';border-radius:10px;overflow:hidden;display:flex;flex-direction:column">'
    +  '<div style="background:'+solid+';color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:8px 14px;flex-shrink:0">Principais Causas do Desvio</div>'
    +  '<div style="padding:14px;flex:1;background:'+light+'">'+causasHTML+'</div>'
    +'</div>'
    +'</div>'
    +'</div>'+_rcSlideFooter()+'</div>';
}


// ── SLIDE PLANO 2: Ações / Responsável / Prazo ───────────────────────────
function _rcSlidePlano2(empId) {
  var d      = rcState.dados[empId] || _rcInitEmpresa();
  var p      = d.planoAcao || {};
  var solid  = RC_EMP_SOLID[empId] || '#1d3061';
  var light  = RC_EMP_LIGHT[empId] || 'rgba(0,0,0,.06)';
  var acoes  = p.acoes || [];

  var acoesRows = acoes.length
    ? acoes.map(function(a, i){
        var bg = i%2===0 ? light : '#fff';
        return '<tr style="background:'+bg+'">'
          +'<td style="padding:7px 12px;font-size:11px;color:#333;border-right:1px solid rgba(0,0,0,.06)">'+(a.acao||'—')+'</td>'
          +'<td style="padding:7px 12px;font-size:11px;color:#555;text-align:center;border-right:1px solid rgba(0,0,0,.06);white-space:nowrap">'+(a.responsavel||'—')+'</td>'
          +'<td style="padding:7px 12px;font-size:11px;color:#555;text-align:center;white-space:nowrap">'+(a.prazo||'—')+'</td>'
          +'</tr>';
      }).join('')
    : '<tr><td colspan="3" style="padding:20px;text-align:center;color:#ccc;font-style:italic;font-size:12px">Sem a&ccedil;&otilde;es registradas</td></tr>';

  return '<div class="rc-slide">'+_rcSlideHeader(empId)
    +'<div class="rc-slide-body">'
    +'<div class="rc-slide-secao" style="color:'+solid+'">Reclama&ccedil;&otilde;es | Plano de A&ccedil;&atilde;o</div>'
    +'<div style="font-size:12px;font-weight:600;color:#555;margin-bottom:12px;flex-shrink:0">A&ccedil;&otilde;es do Plano</div>'
    +'<div style="flex:1;min-height:0;overflow:auto">'
    +'<table style="width:100%;border-collapse:collapse">'
    +'<thead><tr style="background:'+solid+'">'
    +  '<th style="padding:9px 12px;color:#fff;font-size:10px;font-weight:700;text-align:left;text-transform:uppercase;letter-spacing:.4px">A&ccedil;&atilde;o</th>'
    +  '<th style="padding:9px 12px;color:#fff;font-size:10px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:.4px;width:150px">Respons&aacute;vel</th>'
    +  '<th style="padding:9px 12px;color:#fff;font-size:10px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:.4px;width:120px">Prazo</th>'
    +'</tr></thead>'
    +'<tbody>'+acoesRows+'</tbody>'
    +'</table>'
    +'</div>'
    +'</div>'+_rcSlideFooter()+'</div>';
}

// DADOS GRUPO
function _rcDadosGrupo() {
  var g=rcState.dadosGrupo||_rcInitDadosGrupo();
  var qtde_mensal=MESES.map(function(_,i){
    var manual=parseInt(g.qtde_mensal&&g.qtde_mensal[i])||0;
    if(manual>0) return manual;
    return RC_EMPRESAS.reduce(function(s,id){return s+(parseInt(rcState.dados[id]&&rcState.dados[id].qtde_mensal[i])||0);},0);
  });
  var incons_mensal=MESES.map(function(_,i){
    var manual=parseInt(g.inconsistencias_mensal&&g.inconsistencias_mensal[i])||0;
    if(manual>0) return manual;
    return RC_EMPRESAS.reduce(function(s,id){return s+(parseInt(rcState.dados[id]&&rcState.dados[id].inconsistencias_mensal[i])||0);},0);
  });
  var totalAcum=g.qtde_acum||RC_EMPRESAS.reduce(function(s,id){return s+(parseInt((rcState.dados[id]||{}).qtde_acum)||0);},0);
  return {
    qtde_mensal:qtde_mensal, tratamento_mensal:g.tratamento_mensal||Array(12).fill(0),
    inconsistencias_mensal:incons_mensal, qtde_acum:totalAcum,
    tratamento_pct:g.tratamento_pct||'', nao_ident_qtde:g.nao_ident_qtde||0,
    nao_ident_pct:g.nao_ident_pct||'', inconsistencias_pct:g.inconsistencias_pct||'',
    consistentes_pct:g.consistentes_pct||'',
  };
}

// GRAFICOS
function _rcDestroyAllCharts() {
  Object.keys(rcCharts).forEach(function(k){if(rcCharts[k]){try{rcCharts[k].destroy();}catch(e){}}});
  rcCharts={};
}

function _rcInitUTPChart(empId) {
  var canvas=document.querySelector('#rc-chart-utp-'+empId);
  if(!canvas) return;
  if(rcCharts['utp-'+empId]) rcCharts['utp-'+empId].destroy();
  var d=empId==='grupo'?_rcDadosGrupo():(rcState.dados[empId]||_rcInitEmpresa());
  var ate=rcState.mes+1;
  var qtdes=(d.qtde_mensal||[]).slice(0,ate).map(function(v){return parseInt(v)||0;});
  var trats=(d.tratamento_mensal||[]).slice(0,ate).map(function(v){return parseFloat(String(v).replace(',','.'))||0;});
  var labels=MESES.slice(0,ate);
  var maxQtde=Math.max.apply(null,qtdes.concat([1]));
  var barColor=RC_BAR_COLORS[empId] || RC_BAR_COLORS.grupo;

  // Eixo Y das barras: 0 até maxQtde (sem multiplicador — barras usam toda a altura)
  // Eixo Y da linha: expandido para baixo para empurrar a linha ao topo
  // Ambos os gráficos (UTP e Incons) usam padding.top = 32 → área de barras idêntica
  var minTrat = trats.length>0 ? Math.min.apply(null,trats) : 98;
  var maxTrat = trats.length>0 ? Math.max.apply(null,trats) : 101;
  // Expandir o eixo para baixo: linha ocupa o topo 20% do canvas
  // canvas_height = total; barra_area = 80%; linha_area = 20% (topo)
  // Para isso: min = maxTrat - (maxTrat - minTrat + 0.5) * 5
  var yLeftMin = minTrat - (maxTrat - minTrat + 0.5) * 5;
  var yLeftMax = maxTrat + 0.3;

  rcCharts['utp-'+empId]=new Chart(canvas,{
    data:{labels:labels,datasets:[
      {type:'bar',  label:'Reclamacoes',  data:qtdes,  backgroundColor:barColor, borderRadius:3, yAxisID:'yRight', order:2},
      {type:'line', label:'Tratamento %', data:trats,  borderColor:'#c0392b', backgroundColor:'transparent',
        borderWidth:2, pointRadius:3, pointStyle:'circle', pointBackgroundColor:'#c0392b',
        yAxisID:'yLeft', order:1, tension:.3}
    ]},
    plugins:[ChartDataLabels],
    options:{
      responsive:true, maintainAspectRatio:false,
      layout:{padding:{top:32, bottom:0}},
      plugins:{
        legend:{
          display:true, position:'bottom', align:'start',
          labels:{boxWidth:6,boxHeight:6,usePointStyle:true,pointStyle:'circle',font:{size:10},padding:10}
        },
        datalabels:{
          formatter:function(v,ctx){
            if(ctx.datasetIndex===0) return v>0?v:'';
            return v>0?v.toFixed(1)+'%':'';
          },
          anchor:function(ctx){ return ctx.datasetIndex===0?'center':'end'; },
          align: function(ctx){ return ctx.datasetIndex===0?'center':'top'; },
          font:{size:9,weight:'bold'},
          color:function(ctx){
            if(ctx.datasetIndex===1) return '#c0392b';
            // Fundo claro (grupo, 1001, 1001u): texto navy; fundo escuro (cat, com): texto branco
            if(empId==='grupo'||empId==='1001'||empId==='1001u') return '#1d3061';
            return '#fff';
          }
        }
      },
      scales:{
        yRight:{ position:'right', beginAtZero:true, display:false, max:maxQtde, grid:{display:false} },
        yLeft:{  position:'left',  display:false, min:yLeftMin, max:yLeftMax, grid:{display:false} },
        x:{ grid:{display:false}, ticks:{font:{size:10}} }
      }
    }
  });
}

function _rcInitInconsistChart(empId) {
  var canvas=document.querySelector('#rc-chart-incons-'+empId);
  if(!canvas) return;
  if(rcCharts['incons-'+empId]) rcCharts['incons-'+empId].destroy();
  var d=empId==='grupo'?_rcDadosGrupo():(rcState.dados[empId]||_rcInitEmpresa());
  var ate=rcState.mes+1;
  var incons=(d.inconsistencias_mensal||[]).slice(0,ate).map(function(v){return parseInt(v)||0;});
  var labels=MESES.slice(0,ate);
  var maxIncons=Math.max.apply(null,incons.concat([1]));
  var inconsColor = RC_INCONS_COLORS[empId] || RC_INCONS_COLORS.grupo;
  var labelColor  = (empId==='grupo') ? '#c0392b' : '#333';
  rcCharts['incons-'+empId]=new Chart(canvas,{
    type:'bar',data:{labels:labels,datasets:[{data:incons,backgroundColor:inconsColor,borderRadius:3}]},
    plugins:[ChartDataLabels],
    options:{responsive:true,maintainAspectRatio:false,
      layout:{padding:{top:32,bottom:0}},
      plugins:{legend:{display:false},
        datalabels:{anchor:'end',align:'top',font:{size:9,weight:'bold'},color:labelColor,formatter:function(v){return v>0?v:'';}  }},
      scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{beginAtZero:true,display:false,grid:{display:false},max:maxIncons*2.2}}
    }
  });
}

function _rcInitHBarChart(empId) {
  var canvas=document.querySelector('#rc-chart-hbar-'+empId);
  if(!canvas) return;
  if(rcCharts['hbar-'+empId]) rcCharts['hbar-'+empId].destroy();
  var d=rcState.dados[empId]||_rcInitEmpresa();
  var motivos=(d.motivos_acum||[]).filter(function(m){return m.descricao;}).slice(0,6);
  var barColor=RC_BAR_COLORS[empId]||RC_BAR_COLORS.grupo;
  var maxVal=Math.max.apply(null,motivos.map(function(m){return parseInt(m.qtde)||0;}).concat([1]));
  rcCharts['hbar-'+empId]=new Chart(canvas,{
    type:'bar',
    data:{labels:motivos.map(function(m){return m.descricao;}),
      datasets:[{data:motivos.map(function(m){return parseInt(m.qtde)||0;}),backgroundColor:barColor,borderRadius:0,indexAxis:'y'}]},
    plugins:[ChartDataLabels],
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
      layout:{padding:{right:0}},
      plugins:{legend:{display:false},
        datalabels:{anchor:'end',align:'left',font:{size:11,weight:'bold'},color:'#fff',padding:{right:6},formatter:function(v){return v>0?v:'';}  }},
      scales:{x:{beginAtZero:true,display:false,max:maxVal*1.05},y:{ticks:{font:{size:10},color:'#1d3061'},grid:{display:false}}}
    }
  });
}

function _rcInitAbandonoChart(empId) {
  var canvas=document.querySelector('#rc-chart-aband-'+empId);
  if(!canvas) return;
  if(rcCharts['aband-'+empId]) rcCharts['aband-'+empId].destroy();
  var d=rcState.dados[empId]||_rcInitEmpresa();
  var ate=rcState.mes+1;
  var labels=MESES_FULL.slice(0,ate);

  // Paleta por empresa: 3 tons (claro=ano-2, médio=ano-1, escuro=ano)
  var paleta = {
    '1001':  ['rgba(200,200,200,.80)','rgba(120,120,120,.85)','rgba(50,50,50,.90)'],
    '1001u': ['rgba(210,210,210,.75)','rgba(140,140,140,.85)','rgba(70,70,70,.90)'],
    cat:     ['rgba(0,200,200,.50)','rgba(0,168,168,.75)','rgba(0,120,120,.95)'],
    com:     ['rgba(100,170,240,.55)','rgba(52,130,210,.78)','rgba(10,70,160,.90)'],
    grupo:   ['rgba(190,190,190,.85)','rgba(100,100,100,.85)','rgba(40,40,40,.85)'],
  };
  var cores = paleta[empId] || paleta.grupo;

  rcCharts['aband-'+empId]=new Chart(canvas,{
    type:'bar',data:{labels:labels,datasets:[
      {label:String(rcState.ano-2),data:(d.abandono_2024||[]).slice(0,ate).map(function(v){return parseInt(v)||0;}),backgroundColor:cores[0],borderRadius:2},
      {label:String(rcState.ano-1),data:(d.abandono_2025||[]).slice(0,ate).map(function(v){return parseInt(v)||0;}),backgroundColor:cores[1],borderRadius:2},
      {label:String(rcState.ano),  data:(d.abandono_2026||[]).slice(0,ate).map(function(v){return parseInt(v)||0;}),backgroundColor:cores[2],borderRadius:2},
    ]},
    plugins:[ChartDataLabels],
    options:{responsive:true,maintainAspectRatio:false,
      layout:{padding:{top:20}},
      plugins:{
        legend:{display:true,position:'bottom',align:'start',labels:{boxWidth:12,boxHeight:12,font:{size:10},padding:12}},
        datalabels:{anchor:'end',align:'top',font:{size:9,weight:'bold'},color:'#444',formatter:function(v){return v>0?v:'';}  }
      },
      scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{beginAtZero:true,display:false,grid:{display:false}}}
    }
  });
}

function _rcInitElogiosEvolucaoChart() {
  var canvas=document.querySelector('#rc-chart-elogios-evolucao');
  if(!canvas) return;
  if(rcCharts['elogios-evolucao']) rcCharts['elogios-evolucao'].destroy();
  var e=rcState.elogios,ate=rcState.mes+1;
  var labels=MESES_FULL.slice(0,ate);
  rcCharts['elogios-evolucao']=new Chart(canvas,{
    type:'bar',data:{labels:labels,datasets:[
      {label:'Cometa',      data:(e.mensal_com||[]).slice(0,ate).map(function(v){return parseInt(v)||0;}),  backgroundColor:RC_BAR_COLORS['com'],  borderRadius:2},
      {label:'Catarinense', data:(e.mensal_cat||[]).slice(0,ate).map(function(v){return parseInt(v)||0;}),  backgroundColor:RC_BAR_COLORS['cat'],  borderRadius:2},
      {label:'1001',        data:(e.mensal_1001||[]).slice(0,ate).map(function(v){return parseInt(v)||0;}), backgroundColor:RC_BAR_COLORS['1001'], borderRadius:2},
    ]},
    plugins:[ChartDataLabels],
    options:{responsive:true,maintainAspectRatio:false,
      layout:{padding:{top:20}},
      plugins:{
        legend:{display:true,position:'bottom',align:'center',labels:{boxWidth:12,boxHeight:12,font:{size:11},padding:14}},
        datalabels:{anchor:'end',align:'top',font:{size:9,weight:'bold'},color:'#333',formatter:function(v){return v>0?v:'';}  }
      },
      scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{beginAtZero:true,display:false,grid:{display:false}}}
    }
  });
}

// FIREBASE
function _rcDocId() { return rcState.ano+'-'+String(rcState.mes+1).padStart(2,'0'); }

function _rcSalvarFirebase() {
  if(typeof _db==='undefined') return;
  _db.collection('reclamacoes_cliente').doc(_rcDocId()).set({
    mes:rcState.mes,ano:rcState.ano,analista:rcState.analista||'',
    dados:rcState.dados,dadosGrupo:rcState.dadosGrupo,elogios:rcState.elogios,
    savedAt:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){console.log('[RC] Salvo:',_rcDocId());})
    .catch(function(e){console.warn('[RC] Erro ao salvar:',e);});
}

function _rcCarregarFirebase(callback) {
  if(typeof _db==='undefined'){if(callback)callback();return;}
  _db.collection('reclamacoes_cliente').doc(_rcDocId()).get()
    .then(function(doc){
      if(doc.exists){
        var d=doc.data();
        if(d.dados)      rcState.dados      =d.dados;
        if(d.dadosGrupo) rcState.dadosGrupo =d.dadosGrupo;
        if(d.elogios)    rcState.elogios    =d.elogios;
      }
      if(callback)callback();
    }).catch(function(e){console.warn('[RC] Erro ao carregar:',e);if(callback)callback();});
}

async function _rcSalvarManual() {
  var btn=document.getElementById('rc-btn-salvar');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  _rcSalvarFirebase(); _rcSalvarPlanos();
  setTimeout(function(){if(btn){btn.disabled=false;btn.textContent='Salvar';}},2500);
}

function _rcSalvarPlanos() {
  if(typeof _db==='undefined') return;
  var payload={};
  RC_EMPRESAS.forEach(function(id){
    var d=rcState.dados[id]||{};
    var p=d.planoAcao||{};
    payload[id]={
      motivos_mes:   (d.motivos_mes||[]).filter(function(m){return m.descricao;}),
      analista:       rcState.analista||'',
      acoes:          p.acoes         || [],
      identificacao:  p.identificacao || '',
      causas:         p.causas        || '',
      enviado:        !!p.enviado,
    };
  });
  _db.collection('planos_reclamacoes_cliente').doc(_rcDocId()).set(payload,{merge:true})
    .catch(function(e){console.warn('[RC] Erro planos:',e);});
}

async function _rcImportarPlanos() {
  var btn=document.querySelector('[data-rc-action="rc-importar-planos"]');
  if(btn){btn.disabled=true;btn.textContent='Importando...';}
  try{
    var doc=await _db.collection('planos_reclamacoes_cliente').doc(_rcDocId()).get();
    if(!doc.exists){alert('Nenhuma resposta encontrada ainda.\n\nDoc: '+_rcDocId());return;}
    var fb=doc.data(), count=0;
    console.log('[RC] Firebase data:', JSON.stringify(fb));

    RC_EMPRESAS.forEach(function(id){
      // Tentar formato nested: fb[id].acoes
      var pNested = fb[id] || {};
      // Tentar formato dot-notation: fb['1001.acoes']
      var acoes          = pNested.acoes         || fb[id+'.acoes']         || [];
      var identificacao  = pNested.identificacao  || fb[id+'.identificacao']  || '';
      var causas         = pNested.causas         || fb[id+'.causas']         || '';
      var texto          = pNested.texto          || fb[id+'.texto']          || '';
      var enviado        = pNested.enviado        || fb[id+'.enviado']        || false;

      var temConteudo = (acoes&&acoes.length>0) || identificacao || causas || texto || enviado;
      if(!temConteudo) return;
      if(!rcState.dados[id]) return;
      if(!rcState.dados[id].planoAcao) rcState.dados[id].planoAcao={};
      rcState.dados[id].planoAcao.acoes         = acoes;
      rcState.dados[id].planoAcao.identificacao  = identificacao;
      rcState.dados[id].planoAcao.causas         = causas;
      rcState.dados[id].planoAcao.texto          = texto;
      rcState.dados[id].planoAcao.enviado        = enviado;
      rcState.dados[id].planoAcao._editando      = false;
      count++;
    });

    if(count>0){
      alert('\u2705 '+count+' plano(s) importado(s)!');
      _rcRenderStep2Panel();
    } else {
      // Mostrar o que existe no documento para debug
      var keys = Object.keys(fb);
      alert('Nenhuma empresa preencheu ainda.\nChaves no Firebase: '+keys.join(', '));
    }
  }catch(e){alert('Erro ao importar: '+e.message);console.error('[RC]',e);}
  finally{if(btn){btn.disabled=false;btn.textContent='Importar Planos';}}
}


function _rcAvancarParaStep2() {
  var btn=document.querySelector('[data-rc-action="go-step"][data-rc-step="2"]');
  if(btn){btn.disabled=true;btn.textContent='Carregando...';}
  _rcCarregarFirebase(function(){rcState.step=2;_rcRender();_rcSalvarPlanos();});
}

// PDF
async function _rcGerarPDF() {
  var btn=document.getElementById('rc-btn-pdf');
  if(btn){btn.disabled=true;btn.textContent='Gerando...';}
  try{
    var {jsPDF}=window.jspdf;
    var pdf=new jsPDF({orientation:'landscape',unit:'px',format:[960,540],hotfixes:['px_scaling']});
    var container=document.createElement('div');
    container.style.cssText='position:fixed;left:-9999px;top:0;width:960px;height:540px;overflow:hidden;background:#fff';
    document.body.appendChild(container);
    for(var i=0;i<rcState.slides.length;i++){
      if(i>0) pdf.addPage();
      rcState.slideIdx=i; _rcDestroyAllCharts();
      var s=rcState.slides[i],html='';
      if      (s.type==='capa')            html=_rcSlideCapa();
      else if (s.type==='utp')             html=_rcSlideUTP(s.emp);
      else if (s.type==='detalhe')         html=_rcSlideDetalhe(s.emp);
      else if (s.type==='plano1')          html=_rcSlidePlano1(s.emp);
      else if (s.type==='plano2')          html=_rcSlidePlano2(s.emp);
      else if (s.type==='abandono')        html=_rcSlideAbandono(s.emp);
      else if (s.type==='elogios-evolucao')html=_rcSlideElogiosEvolucao();
      else if (s.type==='elogios-detalhe') html=_rcSlideElogiosDetalhe();
      else if (s.type==='contra-capa')     html=_rcSlideContraCapa();
      container.innerHTML=html;
      var slide=container.querySelector('.rc-slide');
      if(slide){slide.style.width='960px';slide.style.height='540px';slide.style.boxShadow='none';slide.style.borderRadius='0';}
      var dpr=window.devicePixelRatio; window.devicePixelRatio=4;
      if(s.type==='utp'){_rcInitUTPChart(s.emp);_rcInitInconsistChart(s.emp);}
      if(s.type==='detalhe')          _rcInitHBarChart(s.emp);
      if(s.type==='abandono')         _rcInitAbandonoChart(s.emp);
      if(s.type==='elogios-evolucao') _rcInitElogiosEvolucaoChart();
      await new Promise(function(r){setTimeout(r,s.type==='capa'||s.type==='contra-capa'?60:220);});
      window.devicePixelRatio=dpr;
      var canvas=await html2canvas(container,{scale:4,useCORS:true,allowTaint:true,backgroundColor:'#fff',logging:false});
      pdf.addImage(canvas.toDataURL('image/jpeg',0.98),'JPEG',0,0,960,540);
    }
    document.body.removeChild(container);
    pdf.save('Reclamacoes_'+MESES_FULL[rcState.mes]+'_'+rcState.ano+'.pdf');
    rcState.slideIdx=0; _rcRenderCurrentSlide(); _rcUpdateActiveThumbs(); _rcUpdateSlideCounter();
  }catch(e){alert('Erro ao gerar PDF: '+e.message);}
  finally{if(btn){btn.disabled=false;btn.textContent='Gerar PDF';}}
}

// HANDLER
function rcHandleAction(action,dataset,el) {
  switch(action){
    case 'go-home': rcState=null; state.screen='home'; render(); break;
    case 'go-step':
      var step=Number(dataset.rcStep);
      if(step===2&&rcState.step===1){_rcAvancarParaStep2();break;}
      rcState.step=step;
      if(step===3){rcState.slideIdx=0;_rcSalvarFirebase();_rcSalvarPlanos();}
      _rcRender(); break;
    case 'set-tab':    rcState.tabAtiva=dataset.rcTab; _rcRenderStep2Panel(); break;
    case 'go-slide':   rcState.slideIdx=Number(dataset.rcIdx); _rcRenderCurrentSlide(); _rcUpdateActiveThumbs(); _rcUpdateSlideCounter(); break;
    case 'prev-slide':
      if(rcState.slideIdx>0){rcState.slideIdx--;_rcRenderCurrentSlide();_rcUpdateActiveThumbs();_rcUpdateSlideCounter();}
      break;
    case 'next-slide':
      if(rcState.slideIdx<rcState.slides.length-1){rcState.slideIdx++;_rcRenderCurrentSlide();_rcUpdateActiveThumbs();_rcUpdateSlideCounter();}
      break;
    case 'rc-copiar-link-plano':
      navigator.clipboard.writeText(dataset.rcUrl||'').then(function(){ alert('Link copiado!'); }); break;
    case 'plano-editar':
      if(dataset.rcPlanoEditar){ var _eid=dataset.rcPlanoEditar; if(!rcState.dados[_eid].planoAcao) rcState.dados[_eid].planoAcao={}; rcState.dados[_eid].planoAcao._editando=true; _rcRenderStep2Panel(); } break;
    case 'plano-cancelar-edicao':
      if(dataset.rcPlanoCancelar){ var _cid=dataset.rcPlanoCancelar; if(rcState.dados[_cid]&&rcState.dados[_cid].planoAcao) rcState.dados[_cid].planoAcao._editando=false; _rcRenderStep2Panel(); } break;
    case 'plano-salvar-edicao':
      if(dataset.rcPlanoSalvar){
        var _sid=dataset.rcPlanoSalvar, _sp=rcState.dados[_sid].planoAcao;
        var _e1=document.getElementById('edit-ident-'+_sid), _e2=document.getElementById('edit-causas-'+_sid);
        if(_e1) _sp.identificacao=_e1.value; if(_e2) _sp.causas=_e2.value;
        var _si=0; while(document.getElementById('edit-acao-'+_sid+'-'+_si)){
          _sp.acoes[_si].acao=document.getElementById('edit-acao-'+_sid+'-'+_si).value;
          _sp.acoes[_si].responsavel=document.getElementById('edit-resp-'+_sid+'-'+_si).value;
          _sp.acoes[_si].prazo=document.getElementById('edit-prazo-'+_sid+'-'+_si).value; _si++;
        }
        _sp._editando=false;
        var _upd={}; _upd[_sid+'.identificacao']=_sp.identificacao; _upd[_sid+'.causas']=_sp.causas; _upd[_sid+'.acoes']=_sp.acoes;
        if(typeof _db!=='undefined') _db.collection('planos_reclamacoes_cliente').doc(_rcDocId()).set(_upd,{merge:true}).catch(function(e){console.warn(e);});
        _rcRenderStep2Panel();
      } break;
    case 'rc-salvar-firebase': _rcSalvarManual(); break;
    case 'rc-importar-planos': _rcImportarPlanos(); break;
    case 'rc-gerar-pdf':       _rcGerarPDF(); break;
    case 'add-motmes':
      if(!rcState.dados[dataset.rcEmp].motivos_mes) rcState.dados[dataset.rcEmp].motivos_mes=[];
      rcState.dados[dataset.rcEmp].motivos_mes.push({descricao:'',qtde:0,tratamento_pct:'100,0'});
      _rcRenderStep2Panel(); break;
    case 'rm-motmes':
      rcState.dados[dataset.rcEmp].motivos_mes.splice(Number(dataset.rcIdx),1); _rcRenderStep2Panel(); break;
    case 'add-motacum':
      if(!rcState.dados[dataset.rcEmp].motivos_acum) rcState.dados[dataset.rcEmp].motivos_acum=[];
      rcState.dados[dataset.rcEmp].motivos_acum.push({descricao:'',qtde:0});
      _rcRenderStep2Panel(); break;
    case 'rm-motacum':
      rcState.dados[dataset.rcEmp].motivos_acum.splice(Number(dataset.rcIdx),1); _rcRenderStep2Panel(); break;
    case 'add-elogios-mesemp':
      if(!rcState.elogios.mes_empresa) rcState.elogios.mes_empresa=[];
      rcState.elogios.mes_empresa.push({empId:'1001',qtde:0,tratamento_pct:'100,0'});
      _rcRenderStep2Panel(); break;
    case 'rm-elogios-mesemp':
      rcState.elogios.mes_empresa.splice(Number(dataset.rcIdx),1); _rcRenderStep2Panel(); break;
  }
}

function rcHandleInput(el) {
  if(el.dataset.rcRoot){
    var f=el.dataset.rcRoot;
    if(f==='mes')      rcState.mes=parseInt(el.value);
    else if(f==='ano') rcState.ano=parseInt(el.value);
    else               rcState[f]=el.value;
  }
}

function _rcDataAtual() {
  return new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
}