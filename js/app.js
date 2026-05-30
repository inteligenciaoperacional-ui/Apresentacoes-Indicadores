// ═══════════════════════════════════════════════════
// app.js — estado global, roteamento, eventos
// ═══════════════════════════════════════════════════

// ── Data padrão: mês ANTERIOR (apresentação é sempre do mês passado) ──
const _now      = new Date();
const _prevIdx  = (_now.getMonth() + 11) % 12;   // 0→11, 1→0, ...
const _prevAno  = _now.getMonth() === 0 ? _now.getFullYear() - 1 : _now.getFullYear();

const state = {
  screen:    "home",
  step:      1,
  mes:       MESES[_prevIdx],
  ano:       _prevAno,
  analista:  "Kelvin Santos",
  tab:       "GRUPO",
  data:      null,
  naoId:     null,
  naoIdRIO:  null,
  naoIdSUL:  null,
  naoIdSAO:  null,
  slideIdx:  0,
  slides:    null,
  _fbNotif:  null,   // mensagem de carregamento Firebase (transitória)
  planoRef:  null,   // referencia do plano de ação (por regional)
};

// ── Init ────────────────────────────────────────────
function init() {
  state.data    = { GRUPO: initReg(), RIO: initReg(), SUL: initReg(), SAO: initReg() };
  state.naoId    = initNaoId();           // GRUPO NI: gráfico mensal
  state.naoIdRIO = initNaoIdRegional();   // RIO NI: top 5 setores
  state.naoIdSUL = initNaoIdRegional();   // SUL NI: top 5 setores
  state.naoIdSAO = initNaoIdRegional();   // SAO NI: top 5 setores
  state.slides  = buildSlides();
  state.planoRef = { RIO: _initPlanoRef(), SUL: _initPlanoRef(), SAO: _initPlanoRef() };

  // Sincroniza planos do arquivo externo (localStorage)
  _syncPlanosFromStorage();

  render();
}

// ── Sincronizar Planos de Ação do localStorage ────────
// Salvo pelo plano-de-acao.html
function _syncPlanosFromStorage() {
  try {
    const raw = localStorage.getItem("jca_planos_ev");
    if (!raw) return;
    const planos = JSON.parse(raw);
    ["RIO","SUL","SAO"].forEach(r => {
      if (planos[r]?.planoAcao !== undefined) {
        state.data[r].planoAcao = planos[r].planoAcao;
      }
    });
  } catch(e) { /* ignora erros de parse */ }
}


function _initPlanoRef() {
  return { principalOfensor: "", qtdExcessos: "", a1000km: "", setorNI: "", qtdNI: "" };
}

// ── Helper: retorna o objeto naoId pelo tab key ───────
function _getNaoId(key) {
  if (key === "NI_RIO" || key === "RIO")   return state.naoIdRIO;
  if (key === "NI_SUL" || key === "SUL")   return state.naoIdSUL;
  if (key === "NI_SAO" || key === "SAO")   return state.naoIdSAO;
  return state.naoId; // GRUPO
}

// Helper: retorna o naoId certo pelo regional do slide
function _getNaoIdByRegional(r) {
  if (r === "RIO") return state.naoIdRIO;
  if (r === "SUL") return state.naoIdSUL;
  if (r === "SAO") return state.naoIdSAO;
  return state.naoId;
}

// ── Render principal ─────────────────────────────────
function render() {
  const app = document.getElementById("app");
  destroyAllCharts();

  if (state.screen === "home") { app.innerHTML = homeHTML(); return; }

  if (state.screen === "excessos") {
    if (state.step === 1) {
      app.innerHTML = stepMonthHTML(state.mes, state.ano, state.analista);
      return;
    }
    if (state.step === 2) {
      app.innerHTML = stepDataHTML(state);
      _initPreviewForTab();
      return;
    }
    if (state.step === 3) {
      app.innerHTML = stepPreviewHTML(state.slides, state.slideIdx, state.mes, state.ano);
      renderCurrentSlide();
      return;
    }
  }
}

// ── Inicializa preview chart conforme a aba ───────────
function _initPreviewForTab() {
  const mesIdx      = MESES.indexOf(state.mes);
  const mesesAtivos = MESES.slice(0, mesIdx + 1);
  const isNI        = state.tab.startsWith("NI_");
  const regional    = isNI ? state.tab.replace("NI_", "") : state.tab;

  if (isNI && regional !== "GRUPO") {
    const nd = _getNaoId(state.tab);
    if (nd && nd.setores) initPreviewSectorChart(nd.setores, regional);
  } else {
    const regData = isNI ? _getNaoId(state.tab) : state.data[state.tab];
    if (regData) initPreviewChart(regData, mesesAtivos, regional);
    // Na aba GRUPO, inicia também o segundo gráfico (NI GRUPO)
    if (state.tab === "GRUPO") {
      initNIGrupoPreviewChart(state.naoId, mesesAtivos);
    }
  }
}

// ── Renderiza slide no frame (Step 3) ─────────────────
function renderCurrentSlide() {
  const frame = document.getElementById("slide-frame");
  if (!frame) return;

  try {
    const slide       = state.slides[state.slideIdx];
    const mesIdx      = MESES.indexOf(state.mes);
    const mesesAtivos = MESES.slice(0, mesIdx + 1);

    if (slide.type === "cover") {
      frame.innerHTML = slideCoverHTML(state.mes, state.ano, state.analista);
      return;
    }
    if (slide.type === "contra-capa") {
      frame.innerHTML = slideContraCapaHTML(state.analista);
      return;
    }
    if (slide.type === "regional") {
      frame.innerHTML = slideRegionalHTML(slide.r, state.data[slide.r], state.ano, state.analista);
      initSlideChart("slide-chart", state.data[slide.r], mesesAtivos, slide.r);
      return;
    }
    if (slide.type === "nao-id") {
      const nd = _getNaoIdByRegional(slide.r);
      frame.innerHTML = slideNaoIdHTML(slide.r, nd, state.ano, state.analista);
      if (slide.r === "GRUPO") {
        initSlideChart("slide-chart", nd, mesesAtivos, "GRUPO");
      } else {
        initSectorChart("slide-chart", nd.setores, slide.r);
      }
      return;
    }
    if (slide.type === "plano") {
      frame.innerHTML = slidePlanoHTML(slide.r, state.data[slide.r], state.mes, mesIdx, state.analista);
      return;
    }
  } catch (err) {
    // Mostra o erro diretamente no slide para facilitar o diagnóstico
    frame.innerHTML = `
      <div style="padding:24px;font-family:monospace;font-size:12px;color:#c0392b">
        <strong>Erro ao renderizar slide:</strong><br><br>
        ${err.message}<br><br>
        <pre style="font-size:10px;color:#555;white-space:pre-wrap">${err.stack}</pre>
      </div>`;
    console.error("renderCurrentSlide:", err);
  }
}

// ── Firebase: avançar para Step 2 carregando dados ────
async function _avancarParaStep2() {
  var btn = document.querySelector('[data-action="go-step"][data-step="2"]');
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Carregando..."; }

  try {
    var resultado = await carregarDadosMes(state.mes, state.ano);

    if (resultado) {
      var d = resultado.dados;
      // Aplica dados ao state — analista NÃO é sobrescrito (respeita o que foi digitado no Step 1)
      if (d.data)     state.data     = JSON.parse(JSON.stringify(d.data));
      if (d.naoId)    state.naoId    = JSON.parse(JSON.stringify(d.naoId));
      if (d.naoIdRIO) state.naoIdRIO = JSON.parse(JSON.stringify(d.naoIdRIO));
      if (d.naoIdSUL) state.naoIdSUL = JSON.parse(JSON.stringify(d.naoIdSUL));
      if (d.naoIdSAO) state.naoIdSAO = JSON.parse(JSON.stringify(d.naoIdSAO));

      state._fbNotif = resultado.fonte === "anterior"
        ? "📂 Dados de " + resultado.mesFonte + " carregados como base — adicione " + state.mes + " e salve"
        : "✅ Rascunho de " + state.mes + " retomado";
    } else {
      state._fbNotif = null;
    }
  } catch (err) {
    console.warn("Firebase load failed:", err);
    state._fbNotif = null;
  }

  state.step = 2;
  render();

  // Some a notificação após 5 segundos
  if (state._fbNotif) {
    setTimeout(function() {
      var el = document.getElementById("fb-notif");
      if (el) { el.style.opacity = "0"; el.style.transition = "opacity 0.6s"; }
      setTimeout(function() { state._fbNotif = null; }, 700);
    }, 5000);
  }
}


// ── Firebase: Plano de Referência (Excessos) ──────────
function _salvarPlanoRefFirebase() {
  if (!state.planoRef || typeof _db === "undefined") return;
  const docId = state.ano + "-" + state.mes;
  const payload = {};
  ["RIO","SUL","SAO"].forEach(r => {
    payload[r] = {
      principalOfensor: state.planoRef[r].principalOfensor || "",
      qtdExcessos:      state.planoRef[r].qtdExcessos      || "",
      a1000km:          state.planoRef[r].a1000km           || "",
      setorNI:          state.planoRef[r].setorNI           || "",
      qtdNI:            state.planoRef[r].qtdNI             || ""
    };
  });
  _db.collection("planos_excessos").doc(docId).set(payload, { merge: true })
     .catch(e => console.warn("Firebase plano_ev save:", e));
}

async function _importarPlanosFirebase() {
  const btn = document.querySelector("[data-action='importar-planos']");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Importando..."; }
  try {
    const docId = state.ano + "-" + state.mes;
    const doc   = await _db.collection("planos_excessos").doc(docId).get();
    if (!doc.exists) {
      alert("Nenhum plano encontrado para " + state.mes + "/" + state.ano + ".\nAguarde o time regional enviar.");
      return;
    }
    const fb = doc.data();
    let count = 0;
    ["RIO","SUL","SAO"].forEach(r => {
      const p = fb[r];
      if (!p || !p.enviado) return;
      if (p.texto !== undefined) state.data[r].planoAcao = p.texto;
      count++;
    });
    if (count > 0) {
      render();
      if (btn) btn.textContent = "✅ " + count + " importado(s)!";
      setTimeout(() => { if (btn) { btn.disabled = false; btn.textContent = "📋 Importar Planos"; }}, 3000);
    } else {
      alert("Nenhum plano enviado ainda pelo time regional.");
      if (btn) { btn.disabled = false; btn.textContent = "📋 Importar Planos"; }
    }
  } catch(e) {
    alert("Erro ao importar: " + e.message);
    if (btn) { btn.disabled = false; btn.textContent = "📋 Importar Planos"; }
  }
}

// ── Revisão e edição dos textos do Plano (Excessos) ──
async function _carregarTextosPlano() {
  try {
    const doc = await _db.collection("planos_excessos").doc(state.ano + "-" + state.mes).get();
    const fb  = doc.exists ? doc.data() : {};
    ["RIO","SUL","SAO"].forEach(r => {
      const div = document.getElementById("plano-texto-" + r);
      if (!div) return;
      const p = fb[r] || {};
      if (!p.enviado || !p.texto) {
        div.innerHTML = '<div style="color:#aaa;font-size:12px;font-style:italic">⏳ Aguardando envio do time regional.</div>';
      } else {
        div.dataset.texto = p.texto;
        div.innerHTML     = _planoTextoReadHTML(r, p.texto, "plano-texto-");
      }
    });
  } catch(e) { console.warn("carregar textos plano:", e); }
}

function _planoTextoReadHTML(id, texto, prefix) {
  const linhas  = texto.split("\n").filter(function(l) { return l.trim(); });
  const bullets = linhas.map(function(l) { return "<li style='margin-bottom:4px'>" + l + "</li>"; }).join("");
  return '<div style="border-top:1px solid #eee;margin-top:12px;padding-top:10px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
    +   '<span style="font-size:10px;font-weight:700;color:#1a7a3c;text-transform:uppercase">✅ Texto enviado</span>'
    +   '<button class="btn btn--ghost" style="font-size:11px;padding:2px 10px"'
    +   ' data-action="editar-plano-texto" data-plano-id="' + id + '" data-plano-prefix="' + prefix + '">✏️ Editar</button>'
    + '</div>'
    + '<ul style="font-size:12px;color:#333;padding-left:16px;line-height:1.8">' + bullets + '</ul>'
    + '</div>';
}

function _planoTextoEditHTML(id, texto, prefix) {
  return '<div style="border-top:1px solid #eee;margin-top:12px;padding-top:10px">'
    + '<div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:6px">✏️ Editando</div>'
    + '<textarea id="edit-txt-' + id + '" style="width:100%;padding:8px;border:1px solid #1d3061;border-radius:6px;font-size:12px;font-family:inherit;resize:vertical;min-height:80px">' + texto + '</textarea>'
    + '<div style="display:flex;gap:8px;margin-top:8px">'
    +   '<button class="btn btn--primary" style="font-size:11px;padding:4px 14px"'
    +   ' data-action="salvar-plano-texto" data-plano-id="' + id + '" data-plano-prefix="' + prefix + '">💾 Salvar</button>'
    +   '<button class="btn btn--ghost" style="font-size:11px;padding:4px 14px"'
    +   ' data-action="cancelar-plano-texto" data-plano-id="' + id + '" data-plano-prefix="' + prefix + '">Cancelar</button>'
    + '</div>'
    + '</div>';
}

async function _salvarTextoPlanoEditado(id, prefix, colecao) {
  const textarea = document.getElementById("edit-txt-" + id);
  if (!textarea) return;
  const novoTexto = textarea.value.trim();
  const isSin     = prefix === "sin-plano-texto-";
  const docId     = (isSin ? sinState.ano : state.ano) + "-" + (isSin ? sinState.mes : state.mes);
  try {
    await _db.collection(colecao).doc(docId).set({ [id]: { texto: novoTexto }}, { merge: true });

    // Atualiza estado local para refletir no slide imediatamente
    if (isSin && sinState && sinState.dados[id]) {
      sinState.dados[id].planoAcao.texto = novoTexto;
    } else if (!isSin && state.data[id]) {
      state.data[id].planoAcao = novoTexto;
    }

    const div      = document.getElementById(prefix + id);
    div.dataset.texto = novoTexto;
    div.innerHTML    = _planoTextoReadHTML(id, novoTexto, prefix);
  } catch(e) { alert("Erro ao salvar: " + e.message); }
}

// ── Handlers de edição ────────────────────────────────

async function _autoSalvarFirebase() {
  await salvarNoFirebase(state);
}


// ── Firebase: Plano de Referência (Excessos) ──────────
function _salvarPlanoRefFirebase() {
  if (!state.planoRef || typeof _db === "undefined") return;
  const docId = state.ano + "-" + state.mes;
  const payload = {};
  ["RIO","SUL","SAO"].forEach(r => {
    payload[r] = {
      principalOfensor: state.planoRef[r].principalOfensor || "",
      qtdExcessos:      state.planoRef[r].qtdExcessos      || "",
      a1000km:          state.planoRef[r].a1000km           || "",
      setorNI:          state.planoRef[r].setorNI           || "",
      qtdNI:            state.planoRef[r].qtdNI             || ""
    };
  });
  _db.collection("planos_excessos").doc(docId).set(payload, { merge: true })
     .catch(e => console.warn("Firebase plano_ev save:", e));
}

async function _importarPlanosFirebase() {
  const btn = document.querySelector("[data-action='importar-planos']");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Importando..."; }
  try {
    const docId = state.ano + "-" + state.mes;
    const doc   = await _db.collection("planos_excessos").doc(docId).get();
    if (!doc.exists) {
      alert("Nenhum plano encontrado para " + state.mes + "/" + state.ano + ".\nAguarde o time regional enviar.");
      return;
    }
    const fb = doc.data();
    let count = 0;
    ["RIO","SUL","SAO"].forEach(r => {
      const p = fb[r];
      if (!p || !p.enviado) return;
      if (p.texto !== undefined) state.data[r].planoAcao = p.texto;
      count++;
    });
    if (count > 0) {
      render();
      if (btn) btn.textContent = "✅ " + count + " importado(s)!";
      setTimeout(() => { if (btn) { btn.disabled = false; btn.textContent = "📋 Importar Planos"; }}, 3000);
    } else {
      alert("Nenhum plano enviado ainda pelo time regional.");
      if (btn) { btn.disabled = false; btn.textContent = "📋 Importar Planos"; }
    }
  } catch(e) {
    alert("Erro ao importar: " + e.message);
    if (btn) { btn.disabled = false; btn.textContent = "📋 Importar Planos"; }
  }
}

// ── Firebase: salvar manual com feedback ──────────────
async function _salvarManual() {
  var btn = document.getElementById("btn-salvar-fb");
  if (btn) { btn.disabled = true; btn.textContent = "⏳"; }
  var ok = await salvarNoFirebase(state);
  if (btn) {
    btn.disabled = false;
    btn.textContent = ok ? "☁️ Salvo!" : "❌ Erro";
    setTimeout(function() { if (btn) btn.textContent = "☁️ Salvar"; }, 2500);
  }
}
// ── Live update preview Não Identificados ─────────────
function _updateNIPreviewKpi(field, value, niKey) {
  const idMap = { excessos: "pni-ex", condutores: "pni-cond", km: "pni-km", cada1000: "pni-k1" };
  const kpiEl = document.getElementById(idMap[field]);
  if (kpiEl) kpiEl.textContent = fmtBr(value);
  if (field === "meta") {
    const e = document.getElementById("pni-meta");
    if (e) e.textContent = value || "—";
    _updateNIRealizadoColor(niKey);
  }
  if (field === "realizado") {
    const e = document.getElementById("pni-real");
    if (e) e.textContent = value || "—";
    _updateNIRealizadoColor(niKey);
  }
}
function _updateNIRealizadoColor(niKey) {
  const nd  = _getNaoId(niKey);
  const cor = realizadoColor(nd.meta, nd.realizado);
  const el  = document.getElementById("pni-real");
  if (el) el.style.color = cor || "var(--navy)";
}
function _updatePreviewKpi(field, value) {
  const el = document.getElementById(`pkpi-${field}`);
  if (el) el.textContent = fmtBr(value);
  if (field === "meta") {
    const e = document.getElementById("pmeta");
    if (e) e.textContent = value || "—";
    _refreshRealizadoColor();
  }
  if (field === "realizado") {
    const e = document.getElementById("prealizado");
    if (e) e.textContent = value || "—";
    _refreshRealizadoColor();
  }
}

// Atualiza a cor do Realizado no preview e no input do formulário
function _refreshRealizadoColor() {
  const rd  = state.data[state.tab];
  if (!rd) return;
  const cor = realizadoColor(rd.meta, rd.realizado);
  const css = cor || "var(--navy)";

  // Preview (caixa do lado direito)
  const box = document.getElementById("prealizado");
  if (box) box.style.color = css;

  // Input do formulário: borda e texto coloridos
  const inp = document.querySelector('[data-field="realizado"]');
  if (inp) {
    inp.style.color        = cor || "";
    inp.style.borderColor  = cor ? cor + "99" : "";
  }
}

// ── Atualização rápida do viewer de slides ────────────
function refreshSlidePreview() {
  document.querySelectorAll(".thumb").forEach((el, i) =>
    el.classList.toggle("thumb--active", i === state.slideIdx));
  const info = document.querySelector(".preview-bar__info");
  if (info) info.textContent =
    `Slide ${state.slideIdx + 1} / ${state.slides.length} — ${state.mes}/${state.ano}`;
  const prev = document.querySelector("[data-action='prev-slide']");
  const next = document.querySelector("[data-action='next-slide']");
  if (prev) prev.disabled = state.slideIdx === 0;
  if (next) next.disabled = state.slideIdx === state.slides.length - 1;
  renderCurrentSlide();
}

// ── Events: clicks ────────────────────────────────────
document.addEventListener("click", function(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  _handleAction(el.dataset.action, el.dataset, el);
});

// ── Events: selects ───────────────────────────────────
document.addEventListener("change", function(e) {
  const el = e.target;
  if (el.dataset.action === "set-mes") { state.mes = el.value; return; }
  if (el.dataset.action === "set-ano") { state.ano = Number(el.value); return; }
});

// ── Events: inputs ────────────────────────────────────
document.addEventListener("input", function(e) {
  const el = e.target;
  const mesIdx      = MESES.indexOf(state.mes);
  const mesesAtivos = MESES.slice(0, mesIdx + 1);

  // Inputs do modulo Sinistros
  if (el && (el.dataset.sinRoot || el.dataset.sinGeralMes || el.dataset.sinGeralTotal ||
      el.dataset.sinSeg || el.dataset.sinGrav || el.dataset.sinTipoIdx !== undefined ||
      el.dataset.sinOfIdx !== undefined || el.dataset.sinPlano)) {
    sinHandleAction("sin-input", el.dataset, el);
    return;
  }

  // Plano de referência (Principal Ofensor, Qtd Excessos etc.)
  if (el.dataset.planoRefReg && el.dataset.planoRefField) {
    const reg   = el.dataset.planoRefReg;
    const field = el.dataset.planoRefField;
    if (state.planoRef && state.planoRef[reg]) {
      state.planoRef[reg][field] = el.value;
      _salvarPlanoRefFirebase();
    }
    return;
  }

  // Campos raiz (analista, sheetsUrl)
  if (el.dataset.rootField === "analista")   { state.analista   = el.value; return; }

  // Identificados: KPI / meta / realizado / planoAcao
  if (el.dataset.field) {
    const f = el.dataset.field;
    state.data[state.tab][f] = el.value;
    _updatePreviewKpi(f, el.value);
    return;
  }

  // Identificados: dados mensais
  if (el.dataset.mes) {
    state.data[state.tab].meses[el.dataset.mes][el.dataset.mesfield] = el.value;
    updatePreviewChart(state.data[state.tab], mesesAtivos);
    return;
  }

  // Dados dos setores (Não Identificados regionais)
  if (el.dataset.setorIdx !== undefined && el.dataset.setorField) {
    const idx   = Number(el.dataset.setorIdx);
    const field = el.dataset.setorField;
    const niKey = el.dataset.niKey || state.tab;
    _getNaoId(niKey).setores[idx][field] = el.value;
    // Atualiza preview do gráfico de setores ao vivo
    if (state.tab.startsWith("NI_")) {
      initPreviewSectorChart(_getNaoId(state.tab).setores);
    }
    return;
  }

  // Não Identificados: campos de total
  if (el.dataset.naoIdField) {
    const niKey  = el.dataset.niKey || "NI_GRUPO";
    const field  = el.dataset.naoIdField;
    _getNaoId(niKey)[field] = el.value;
    // Live update: aba NI_XXX ativa OU NI_GRUPO dentro da aba GRUPO
    if (state.tab === niKey || (state.tab === "GRUPO" && niKey === "NI_GRUPO")) {
      _updateNIPreviewKpi(field, el.value, niKey);
    }
    return;
  }

  // Não Identificados: dados mensais
  if (el.dataset.naoIdMes) {
    const niKey = el.dataset.niKey || "NI_GRUPO";
    _getNaoId(niKey).meses[el.dataset.naoIdMes][el.dataset.naoIdMesfield] = el.value;
    if (state.tab.startsWith("NI_")) {
      updatePreviewChart(_getNaoId(state.tab), mesesAtivos);
    }
    // Atualiza o gráfico NI GRUPO quando está na aba GRUPO
    if (niKey === "NI_GRUPO" && state.tab === "GRUPO") {
      updateNIGrupoPreviewChart(state.naoId, mesesAtivos);
    }
    return;
  }
});

// ── Roteador de ações ─────────────────────────────────
function _handleAction(action, dataset, el) {
  switch (action) {
    case "go-home":
      state.screen = "home"; state.step = 1; render(); break;

    case "start-excessos":
      state.screen = "excessos"; state.step = 1; render(); break;

    case "go-step":
      var _nextStep = Number(dataset.step);
      if (_nextStep === 2 && state.step === 1) {
        _avancarParaStep2();           // carrega dados do Firebase antes de renderizar
      } else if (_nextStep === 3) {
        state.step = 3;
        state.slideIdx = 0;
        _autoSalvarFirebase();         // salva em background ao entrar no preview
        render();
      } else {
        state.step = _nextStep;
        render();
      }
      break;

    case "salvar-firebase":
      _salvarManual(); break;

    case "set-tab":
      state.tab = dataset.tab;
      render();
      if (dataset.tab === "PLANO") setTimeout(_carregarTextosPlano, 100);
      break;

    case "go-slide":
      state.slideIdx = Number(dataset.idx);
      refreshSlidePreview(); break;

    case "prev-slide":
      if (state.slideIdx > 0) { state.slideIdx--; refreshSlidePreview(); } break;

    case "next-slide":
      if (state.slideIdx < state.slides.length - 1) { state.slideIdx++; refreshSlidePreview(); } break;

    case "start-sinistros":
      startSinistros(); break;

    case "editar-plano-texto": {
      const pid    = dataset.planoId;
      const pfix   = dataset.planoPrefix;
      const div    = document.getElementById(pfix + pid);
      const texto  = div ? (div.dataset.texto || "") : "";
      if (div) div.innerHTML = _planoTextoEditHTML(pid, texto, pfix);
      break;
    }
    case "cancelar-plano-texto": {
      const pid2   = dataset.planoId;
      const pfix2  = dataset.planoPrefix;
      const div2   = document.getElementById(pfix2 + pid2);
      const texto2 = div2 ? (div2.dataset.texto || "") : "";
      if (div2) div2.innerHTML = _planoTextoReadHTML(pid2, texto2, pfix2);
      break;
    }
    case "salvar-plano-texto": {
      const pid3  = dataset.planoId;
      const pfix3 = dataset.planoPrefix;
      const col   = pfix3 === "sin-plano-texto-" ? "planos_sinistros" : "planos_excessos";
      _salvarTextoPlanoEditado(pid3, pfix3, col);
      break;
    }

    case "sin-go-home": case "sin-go-step": case "sin-set-empresa":
    case "sin-set-subtab": case "sin-go-slide": case "sin-prev-slide":
    case "sin-next-slide": case "sin-gerar-pdf":
    case "sin-gerar-sheets": case "sin-salvar-firebase": case "sin-importar-planos":
    case "sin-processar-ofensores": case "sin-processar-top5":
      sinHandleAction(action, dataset, el); break;

    case "gerar-pdf":
      gerarPDF(state); break;

    case "gerar-sheets":
      sincronizarSheets(state); break;

        case "importar-planos":
      _importarPlanosFirebase(); break;  }
}

// ── Ponto de entrada ──────────────────────────────────
document.addEventListener("DOMContentLoaded", init);