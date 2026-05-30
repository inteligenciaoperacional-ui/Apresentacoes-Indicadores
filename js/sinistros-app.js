// sinistros-app.js — estado e logica do modulo Sinistros

// ── Estado ─────────────────────────────────────────────
var sinState = null;

function sinInit() {
  var now      = new Date();
  var prevIdx  = (now.getMonth() + 11) % 12;
  var prevAno  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  var dados    = {};
  SIN_EMPRESAS.forEach(function(emp) { dados[emp.id] = sinInitEmpresa(emp); });

  sinState = {
    step:     1,
    mes:      MESES[prevIdx],
    ano:      prevAno,
    analista: "Kelvin Santos",
    empresa:  "1001",
    subTab:   "geral",
    slideIdx: 0,
    slides:   null,
    dados:    dados,
  };
}

// ── Render ─────────────────────────────────────────────
function sinRender() {
  var app = document.getElementById("app");
  if (!app) return;
  sinDestroyAllCharts();

  if (sinState.step === 1) {
    app.innerHTML = sinStepMonthHTML(sinState.mes, sinState.ano, sinState.analista);
  } else if (sinState.step === 2) {
    app.innerHTML = sinStepDataHTML(sinState);
    sinInitPreviewForSubTab();
  } else if (sinState.step === 3) {
    if (!sinState.slides) sinState.slides = buildSinistrosSlides();
    app.innerHTML = sinStepPreviewHTML(sinState.slides, sinState.slideIdx, sinState.mes, sinState.ano);
    sinRenderCurrentSlide();
  }
}

// ── Preview Step 2 ────────────────────────────────────
function sinInitPreviewForSubTab() {
  var empresa = sinState.empresa;
  if (empresa === "plano") return; // aba plano não tem gráfico

  var mesIdx  = MESES.indexOf(sinState.mes);
  var mesesAt = MESES.slice(0, mesIdx + 1);
  var subTab  = sinState.subTab || "geral";
  var dados   = sinState.dados[empresa];
  if (!dados) return;

  setTimeout(function() {
    if (subTab === "geral") {
      sinInitMainChart("sin-preview-chart", dados.geral.meses, mesesAt, empresa, true);
    } else if (subTab !== "plano" && dados[subTab]) {
      sinInitMainChart("sin-preview-chart", dados[subTab].meses, mesesAt, empresa, false);
    }
  }, 50);
}

// ── Render slide ──────────────────────────────────────
function sinRenderCurrentSlide() {
  var frame = document.getElementById("sin-slide-frame");
  if (!frame) return;
  sinDestroyAllCharts();

  var slide    = sinState.slides[sinState.slideIdx];
  var mesIdx   = MESES.indexOf(sinState.mes);
  var mesesAt  = MESES.slice(0, mesIdx + 1);
  var analista = sinState.analista;

  try {
    if (slide.type === "sin-cover") {
      frame.innerHTML = sinSlideCoverHTML(sinState.mes, sinState.ano, analista);
      return;
    }
    if (slide.type === "contra-capa") {
      frame.innerHTML = slideContraCapaHTML(analista);
      return;
    }
    if (slide.type === "sin-geral") {
      var geral = sinState.dados[slide.empresa].geral;
      frame.innerHTML = sinSlideGeralHTML(slide.empresa, geral, sinState.ano, analista);
      setTimeout(function() { sinInitMainChart("sin-main-chart", geral.meses, mesesAt, slide.empresa, true); }, 50);
      return;
    }
    if (slide.type === "sin-segmento") {
      var seg = sinState.dados[slide.empresa][slide.seg];
      frame.innerHTML = sinSlideSegmentoHTML(slide.empresa, slide.seg, seg, sinState.ano, analista);
      setTimeout(function() {
        sinInitMainChart("sin-main-chart", seg.meses, mesesAt, slide.empresa, false);
        sinInitDonutChart("sin-donut-chart", seg.gravidade, true, sinGetEmpresa(slide.empresa).cor);
        var tipos = (seg.tipos || []).filter(function(t) { return t.tipo; });
        sinInitHBarChart("sin-hbar-chart", tipos, "tipo", "qtd", sinGetEmpresa(slide.empresa).cor);
      }, 50);
      return;
    }
    if (slide.type === "sin-ofensores") {
      var segOf = sinState.dados[slide.empresa][slide.seg];
      frame.innerHTML = sinSlideOfensoresHTML(slide.empresa, slide.seg, segOf, sinState.mes, sinState.ano, analista);
      setTimeout(function() {
        var emp = sinGetEmpresa(slide.empresa);
        var ofMes = (segOf.ofensoresMes || []).filter(function(o) { return o.nome; });
        var top5  = (segOf.top5Ano     || []).filter(function(o) { return o.nome; });
        if (_sinHBarChart) { _sinHBarChart.destroy(); _sinHBarChart = null; }
        var c1 = document.getElementById("sin-hbar-chart");
        if (c1) new Chart(c1, _sinMakeHBarConfig(ofMes, "nome", "qtd", emp.cor, false, "km"));
        var c2 = document.getElementById("sin-hbar2-chart");
        if (c2) new Chart(c2, _sinMakeHBarConfig(top5, "nome", "qtd", emp.cor, false, "km"));
      }, 50);
      return;
    }
    if (slide.type === "sin-plano") {
      var plano = sinState.dados[slide.empresa].planoAcao;
      frame.innerHTML = sinSlidePlanoHTML(slide.empresa, plano, sinState.mes, sinState.ano, analista);
      return;
    }
  } catch(err) {
    frame.innerHTML = '<div style="padding:20px;color:#c0392b;font-size:12px"><b>Erro:</b> ' + err.message + '</div>';
    console.error("sinRenderCurrentSlide:", err);
  }
}

// Atualiza grafico e KPI do preview ao vivo
function _sinUpdateChartAndKpi(withManut) {
  if (!sinState) return;
  var mesIdx  = MESES.indexOf(sinState.mes);
  var mesesAt = MESES.slice(0, mesIdx + 1);
  var subTab  = sinState.subTab || "geral";
  var dados   = sinState.dados[sinState.empresa];
  var mesesObj = subTab === "geral" ? dados.geral.meses : (dados[subTab] ? dados[subTab].meses : null);
  if (mesesObj) sinUpdateMainChart(mesesObj, mesesAt, withManut || false);
  _sinUpdatePreviewKpi();
}

// ── Atualiza KPI cards do preview ao vivo ────────────
function _sinUpdatePreviewKpi() {
  if (!sinState) return;
  var subTab = sinState.subTab || "geral";
  var dados  = sinState.dados[sinState.empresa];
  var sin = "", km = "";
  if (subTab === "geral") {
    sin = dados.geral.sinistros;
    km  = dados.geral.kmSinistro;
  } else if (subTab !== "plano" && dados[subTab]) {
    sin = dados[subTab].sinistros;
    km  = dados[subTab].kmSinistro;
  }
  // Tenta DOM direto primeiro (mais eficiente)
  var sinEl = document.getElementById("sin-pkpi-sin");
  var kmEl  = document.getElementById("sin-pkpi-km");
  if (sinEl) sinEl.textContent = fmtBr(sin) || "—";
  if (kmEl)  kmEl.textContent  = fmtBr(km)  || "—";
  // Fallback: re-renderiza o container
  if (!sinEl || !kmEl) {
    var wrap = document.getElementById("sin-kpi-preview-wrap");
    if (wrap) {
      wrap.innerHTML = sinPreviewKpiBox("Sinistros:", sin, "sin-pkpi-sin")
        + sinPreviewKpiBox("Km/Sinistro:", km, "sin-pkpi-km");
    }
  }
}

// ── Event handler ─────────────────────────────────────
function sinHandleAction(action, dataset, el) {
  var mesIdx  = MESES.indexOf(sinState.mes);
  var mesesAt = MESES.slice(0, mesIdx + 1);

  if (action === "sin-go-home") {
    sinState = null;
    state.screen = "home";  // volta para a home do app principal
    render();
    return;
  }
  if (action === "sin-go-step") {
    var step = Number(dataset.step);
    sinState.step = step;
    if (step === 3 && !sinState.slides) sinState.slides = buildSinistrosSlides();
    if (step === 3) { sinState.slideIdx = 0; _sinAutoSalvarFirebase(); sinRender(); return; }
    if (step === 2) {
      sinRender();
      _sinCarregarFirebase().then(function() { sinRender(); });
      return;
    }
    sinRender();
    return;
  }
  if (action === "sin-set-empresa") {
    sinState.empresa = dataset.empresa;
    if (dataset.empresa !== "plano") sinState.subTab = "geral";
    sinRender();
    if (dataset.empresa === "plano") setTimeout(_sinCarregarTextosPlano, 100);
    return;
  }
  if (action === "sin-set-subtab") {
    sinState.subTab = dataset.subtab;
    sinRender();
    return;
  }
  if (action === "sin-go-slide") {
    sinState.slideIdx = Number(dataset.idx);
    sinRenderCurrentSlide();
    sinUpdateSlideCounter();
    sinUpdateActiveThumbs();
    return;
  }
  if (action === "sin-prev-slide") {
    if (sinState.slideIdx > 0) {
      sinState.slideIdx--;
      sinRenderCurrentSlide();
      sinUpdateSlideCounter();
      sinUpdateActiveThumbs();
    }
    return;
  }
  if (action === "sin-next-slide") {
    if (sinState.slideIdx < sinState.slides.length - 1) {
      sinState.slideIdx++;
      sinRenderCurrentSlide();
      sinUpdateSlideCounter();
      sinUpdateActiveThumbs();
    }
    return;
  }
  if (action === "sin-processar-ofensores") {
    _sinProcessarPasteOfensores(dataset.sinSeg);
    return;
  }
  if (action === "sin-processar-top5") {
    _sinProcessarPasteTop5(dataset.sinSeg);
    return;
  }
  if (action === "sin-salvar-firebase") { _sinSalvarManual(); return; }
  if (action === "sin-gerar-sheets")    { sincronizarSheetsSinistros(sinState); return; }
  if (action === "sin-importar-planos") { _sinImportarPlanos(); return; }
  if (action === "sin-gerar-pdf")       { sinGerarPDF(sinState); return; }

  // Inputs root (mes, ano, analista)
  if (el && el.dataset.sinRoot) {
    var field = el.dataset.sinRoot;
    if (field === "ano") sinState.ano = Number(el.value);
    else sinState[field] = el.value;
    return;
  }

  // Geral total
  if (el && el.dataset.sinGeralTotal) {
    sinState.dados[sinState.empresa].geral[el.dataset.sinGeralTotal] = el.value;
    _sinUpdatePreviewKpi();
    return;
  }

  // Geral mensal
  if (el && el.dataset.sinGeralMes) {
    var emp = sinState.empresa;
    if (!sinState.dados[emp].geral.meses[el.dataset.sinGeralMes]) sinState.dados[emp].geral.meses[el.dataset.sinGeralMes] = {};
    sinState.dados[emp].geral.meses[el.dataset.sinGeralMes][el.dataset.sinGeralField] = el.value;
    _sinUpdateChartAndKpi(true);
    return;
  }

  // Segmento total
  if (el && el.dataset.sinSeg && el.dataset.sinSegTotal) {
    sinState.dados[sinState.empresa][el.dataset.sinSeg][el.dataset.sinSegTotal] = el.value;
    _sinUpdatePreviewKpi();
    return;
  }

  // Segmento mensal
  if (el && el.dataset.sinSeg && el.dataset.sinSegMes) {
    var s = el.dataset.sinSeg;
    var m = el.dataset.sinSegMes;
    var f = el.dataset.sinSegField;
    if (!sinState.dados[sinState.empresa][s]) return;
    if (!sinState.dados[sinState.empresa][s].meses[m]) sinState.dados[sinState.empresa][s].meses[m] = {};
    sinState.dados[sinState.empresa][s].meses[m][f] = el.value;
    _sinUpdateChartAndKpi(false);
    return;
  }

  // Gravidade
  if (el && el.dataset.sinSeg && el.dataset.sinGrav) {
    sinState.dados[sinState.empresa][el.dataset.sinSeg].gravidade[el.dataset.sinGrav] = el.value;
    return;
  }

  // Tipos de acidente
  if (el && el.dataset.sinSeg && el.dataset.sinTipoIdx !== undefined) {
    var idx = Number(el.dataset.sinTipoIdx);
    sinState.dados[sinState.empresa][el.dataset.sinSeg].tipos[idx][el.dataset.sinTipoField] = el.value;
    return;
  }

  // Ofensores
  if (el && el.dataset.sinSeg && el.dataset.sinOfIdx !== undefined) {
    var idx = Number(el.dataset.sinOfIdx);
    var tipo = el.dataset.sinOfTipo; // "mes" ou "top5"
    var arr  = tipo === "top5" ? "top5Ano" : "ofensoresMes";
    sinState.dados[sinState.empresa][el.dataset.sinSeg][arr][idx][el.dataset.sinOfField] = el.value;
    return;
  }

  // Plano (individual ou global)
  if (el && el.dataset.sinPlano) {
    var empTarget = el.dataset.sinPlanoEmp || sinState.empresa;
    if (sinState.dados[empTarget]) {
      sinState.dados[empTarget].planoAcao[el.dataset.sinPlano] = el.value;
      _sinSalvarPlanosLocalStorage(); // sincroniza com plano-de-acao-sinistros.html
    }
    return;
  }
}

function sinUpdateActiveThumbs() {
  var thumbs = document.querySelectorAll(".thumbs .thumb");
  thumbs.forEach(function(thumb, idx) {
    thumb.classList.toggle("thumb--active", idx === sinState.slideIdx);
    if (idx === sinState.slideIdx) {
      thumb.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
}

function sinUpdateSlideCounter() {
  var el = document.querySelector(".preview-bar__info");
  if (el && sinState && sinState.slides) {
    el.innerHTML = "Sinistros &nbsp;&mdash;&nbsp; Slide " + (sinState.slideIdx + 1) + " / " + sinState.slides.length + " &nbsp;&mdash;&nbsp; " + sinState.mes + "/" + sinState.ano;
  }
}


// ── Firebase: salvar em background ───────────────────
async function _sinAutoSalvarFirebase() {
  await salvarSinistrosNoFirebase(sinState);
}

// ── Firebase: salvar manual com feedback ─────────────
async function _sinSalvarManual() {
  var btn = document.getElementById("btn-sin-salvar-fb");
  if (btn) { btn.disabled = true; btn.textContent = "☁️ Salvando..."; }
  var ok = await salvarSinistrosNoFirebase(sinState);
  if (btn) {
    btn.textContent = ok ? "✅ Salvo!" : "❌ Erro";
    setTimeout(function() { if (btn) { btn.disabled = false; btn.textContent = "☁️ Salvar"; }}, 2500);
  }
}

// ── Firebase: carrega mês atual ou mês anterior como base ──
async function _sinCarregarFirebase() {
  var res = await carregarDadosSinistros(sinState.mes, sinState.ano);
  if (!res) return;

  var fb = res.dados;
  sinState.analista = fb.analista || sinState.analista;

  if (res.fonte === "atual" && fb.dados) {
    sinState.dados = fb.dados;
    return;
  }

  // Mês anterior — usa como base mas limpa dados mensais
  if (res.fonte === "anterior" && fb.dados) {
    var base = JSON.parse(JSON.stringify(fb.dados));
    SIN_EMPRESAS.forEach(function(emp) {
      var ed = base[emp.id];
      if (!ed) return;
      var segs = ["geral"].concat(emp.segmentos);
      segs.forEach(function(seg) {
        if (!ed[seg] || !ed[seg].meses) return;
        Object.keys(ed[seg].meses).forEach(function(m) {
          ed[seg].meses[m] = seg === "geral"
            ? { operacao: "", manutencao: "", km: "", meta: "" }
            : { sinistros: "", km: "", meta: "" };
        });
      });
    });
    sinState.dados = base;
  }
}


// ── Salva Principal Ofensor + Quantidade no Firebase e localStorage ──
function _sinSalvarPlanosLocalStorage() {
  try {
    var data = {};
    SIN_EMPRESAS.forEach(function(emp) {
      var p = sinState.dados[emp.id] ? sinState.dados[emp.id].planoAcao : {};
      data[emp.id] = {
        principalOfensor: p.principalOfensor || "",
        quantidade:        p.quantidade       || ""
      };
    });
    // Firebase (merge para não sobrescrever o texto do time)
    var docId = sinState.ano + "-" + sinState.mes;
    var fbPayload = {};
    SIN_EMPRESAS.forEach(function(emp) {
      fbPayload[emp.id] = {
        principalOfensor: data[emp.id].principalOfensor,
        quantidade:        data[emp.id].quantidade
      };
    });
    _db.collection("planos_sinistros").doc(docId).set(fbPayload, { merge: true })
       .catch(function(e) { console.warn("Firebase plano save:", e); });
  } catch(e) {}
}

// ── Importar Planos do Firebase ───────────────────────
async function _sinImportarPlanos() {
  var btn = document.querySelector("[data-action='sin-importar-planos']");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Importando..."; }

  try {
    var docId = sinState.ano + "-" + sinState.mes;
    var doc   = await _db.collection("planos_sinistros").doc(docId).get();

    if (!doc.exists) {
      alert("Nenhum plano encontrado para " + sinState.mes + "/" + sinState.ano + ".\nAguarde o time regional enviar.");
      return;
    }

    var fbData = doc.data();
    var count  = 0;
    SIN_EMPRESAS.forEach(function(emp) {
      var p = fbData[emp.id];
      if (!p || !p.enviado) return;
      if (!sinState.dados[emp.id]) return;
      sinState.dados[emp.id].planoAcao.texto = p.texto || "";
      count++;
    });

    if (count > 0) {
      sinRender();
      if (btn) { btn.textContent = "✅ " + count + " importado(s)!"; }
      setTimeout(function() { if (btn) { btn.disabled = false; btn.textContent = "📋 Importar Planos"; }}, 3000);
    } else {
      alert("Nenhum plano enviado ainda pelo time regional para " + sinState.mes + "/" + sinState.ano + ".");
      if (btn) { btn.disabled = false; btn.textContent = "📋 Importar Planos"; }
    }
  } catch(e) {
    alert("Erro ao importar: " + e.message);
    if (btn) { btn.disabled = false; btn.textContent = "📋 Importar Planos"; }
  }
}

// ── Revisão e edição dos textos do Plano (Sinistros) ──
async function _sinCarregarTextosPlano() {
  try {
    const doc = await _db.collection("planos_sinistros").doc(sinState.ano + "-" + sinState.mes).get();
    const fb  = doc.exists ? doc.data() : {};
    SIN_EMPRESAS.forEach(function(emp) {
      var div = document.getElementById("sin-plano-texto-" + emp.id);
      if (!div) return;
      var p = fb[emp.id] || {};
      if (!p.enviado || !p.texto) {
        div.innerHTML = '<div style="color:#aaa;font-size:12px;font-style:italic">&#9203; Aguardando envio do time.</div>';
      } else {
        div.dataset.texto = p.texto;
        div.innerHTML     = _planoTextoReadHTML(emp.id, p.texto, "sin-plano-texto-");
      }
    });
  } catch(e) { console.warn("sin carregar textos:", e); }
}


// ── Processar paste de contratos e contar ocorrências ─
function _sinProcessarPasteOfensores(seg) {
  var textarea = document.getElementById("sin-paste-of-" + seg);
  if (!textarea || !textarea.value.trim()) {
    alert("Cole os dados do Sheets antes de processar.");
    return;
  }

  var linhas = textarea.value.split("\n").map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
  var contagem = {};
  linhas.forEach(function(l) {
    contagem[l] = (contagem[l] || 0) + 1;
  });

  var sorted = Object.keys(contagem).map(function(nome) {
    return { nome: nome, qtd: contagem[nome] };
  }).sort(function(a, b) { return b.qtd - a.qtd; });

  var emp       = sinState.empresa;
  var ofensores = sinState.dados[emp][seg].ofensoresMes;
  ofensores.forEach(function(o) { o.nome = ""; o.qtd = ""; });
  sorted.slice(0, ofensores.length).forEach(function(item, i) {
    ofensores[i].nome = item.nome;
    ofensores[i].qtd  = String(item.qtd);
  });

  var total      = sorted.length;
  var preenchidos = Math.min(sorted.length, ofensores.length);
  sinRender();

  setTimeout(function() {
    var ta = document.getElementById("sin-paste-of-" + seg);
    if (ta) ta.placeholder = "✅ " + preenchidos + " contratos preenchidos" + (total > preenchidos ? " (de " + total + " únicos)" : "") + ". Cole novos dados para reprocessar.";
  }, 100);
}

// ── Processar paste para Top 5 do Ano ─────────────────
function _sinProcessarPasteTop5(seg) {
  var textarea = document.getElementById("sin-paste-top5-" + seg);
  if (!textarea || !textarea.value.trim()) {
    alert("Cole os dados do Sheets antes de processar.");
    return;
  }

  var linhas = textarea.value.split("\n").map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
  var contagem = {};
  linhas.forEach(function(l) {
    contagem[l] = (contagem[l] || 0) + 1;
  });

  var sorted = Object.keys(contagem).map(function(nome) {
    return { nome: nome, qtd: contagem[nome] };
  }).sort(function(a, b) { return b.qtd - a.qtd; });

  var emp    = sinState.empresa;
  var top5   = sinState.dados[emp][seg].top5Ano;
  top5.forEach(function(o) { o.nome = ""; o.qtd = ""; });
  sorted.slice(0, top5.length).forEach(function(item, i) {
    top5[i].nome = item.nome;
    top5[i].qtd  = String(item.qtd);
  });

  var preenchidos = Math.min(sorted.length, top5.length);
  sinRender();

  setTimeout(function() {
    var ta = document.getElementById("sin-paste-top5-" + seg);
    if (ta) ta.placeholder = "✅ " + preenchidos + " contratos preenchidos. Cole novos dados para reprocessar.";
  }, 100);
}

function startSinistros() {
  sinInit();
  sinRender();
}