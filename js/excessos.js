// ============================================================
//  excessos.js — Módulo Excessos de Velocidade
//  (chart, slides, screens, pdf, sheets)
// ============================================================

function navHTML(step, mes, ano) {
  const labels = ["1", "2", "3"];
  const stepsHTML = labels.map((label, i) => {
    const n = i + 1;
    let cls = "nav__step";
    if (n === step)    cls += " nav__step--active";
    else if (n < step) cls += " nav__step--done";
    const attr = n < step ? `data-action="go-step" data-step="${n}"` : "";
    return `<div class="${cls}" ${attr}>${label}</div>`;
  }).join("");
  const period = step >= 2 ? `<span class="nav__period">${mes}/${ano}</span>` : "";
  const backBtn = step === 1
    ? `<button class="btn btn--ghost" data-action="go-home">← Início</button>`
    : `<button class="btn btn--ghost" data-action="go-step" data-step="${step - 1}">← Voltar</button>`;
  return `
    <nav class="nav">
      <div class="nav__left">
        ${backBtn}
        <span class="nav__title">Excessos de Velocidade</span>
        ${period}
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        ${step === 2 ? `
        <button class="btn btn--ghost" data-action="importar-planos"
          style="padding:3px 12px;font-size:11px">
          📋 Importar Planos de Ação
        </button>
        <button class="btn btn--ghost"
          title="Copiar link do Plano de Ação"
          style="padding:3px 12px;font-size:11px"
          onclick="(function(){
            var url='LINK_PLANO_DE_ACAO_AQUI';
            navigator.clipboard.writeText(url).then(function(){
              var b=event.target; var orig=b.textContent;
              b.textContent='✅ Copiado!'; b.style.background='rgba(39,174,96,.35)';
              setTimeout(function(){ b.textContent=orig; b.style.background=''; },2000);
            });
          })()">
          🔗 Link Plano de Ação
        </button>
        <button id="btn-salvar-fb" class="btn btn--ghost" data-action="salvar-firebase"
          title="Salvar dados no Firebase"
          style="padding:3px 10px;font-size:11px;background:rgba(66,133,244,.25)">
          ☁️ Salvar
        </button>
        <button class="btn btn--ghost" data-action="gerar-sheets"
          title="Sincronizar com Google Sheets"
          style="padding:2px 6px;background:rgba(255,255,255,.1)">
          <img src="${LOGO_SHEETS}" style="height:20px;width:auto;vertical-align:middle" alt="Sheets">
        </button>` : ""}
        <a href="${SHEETS_URL}" target="_blank" title="Abrir planilha"
          style="display:flex;align-items:center;opacity:.8"
          onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.8">
          <img src="${LOGO_SHEETS}" style="height:26px;width:auto" alt="Sheets">
        </a>
        <div class="nav__steps">${stepsHTML}</div>
      </div>
    </nav>`;
}

function stepMonthHTML(mes, ano, analista) {
  const mOpts = MESES.map(m => `<option value="${m}" ${m === mes ? "selected" : ""}>${m}</option>`).join("");
  const aOpts = ANOS.map(a  => `<option value="${a}" ${a === ano ? "selected" : ""}>${a}</option>`).join("");
  return `
    ${navHTML(1, mes, ano)}
    <div class="step-month">
      <div class="step-month__card">
        <h2 class="step-month__title">Configurar Apresentação</h2>
        <p class="step-month__subtitle">Período e analista responsável</p>
        <div class="step-month__field">
          <label class="field-label">Mês</label>
          <select class="field-select" data-action="set-mes">${mOpts}</select>
        </div>
        <div class="step-month__field">
          <label class="field-label">Ano</label>
          <select class="field-select" data-action="set-ano">${aOpts}</select>
        </div>
        <div class="step-month__field">
          <label class="field-label">Analista Responsável</label>
          <input class="field-input" type="text" value="${analista}"
            placeholder="Ex: Kelvin Santos" data-root-field="analista">
        </div>
        <button class="btn btn--primary step-month__btn" data-action="go-step" data-step="2">
          Próximo →
        </button>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════════
// STEP 2 — preenchimento de dados
// ══════════════════════════════════════════════════════
function stepDataHTML(state) {
  const { mes, ano, tab, data, naoId, naoIdRIO, naoIdSUL, naoIdSAO, _fbNotif } = state;

  // Banner de notificação Firebase (some após 5s via app.js)
  const notifBanner = _fbNotif ? `
    <div id="fb-notif" style="
      background:#1d3061;color:#fff;font-size:12px;padding:8px 16px;
      border-radius:6px;margin-bottom:10px;display:flex;align-items:center;gap:8px;
      transition:opacity 0.6s">
      ${_fbNotif}
    </div>` : "";
  const mesIdx      = MESES.indexOf(mes);
  const mesesAtivos = MESES.slice(0, mesIdx + 1);

  // Identifica se é aba de Não Identificados
  const isNI    = tab.startsWith("NI_");
  const niRegional = isNI ? tab.replace("NI_", "") : null;
  const niData  = isNI ? _getNaoIdByKey(tab, state) : null;
  const rd      = !isNI ? data[tab] : null;

  // Abas linha 1: Identificados
  const _TAB_COLORS = {
    GRUPO: { bg: "#1d3061", border: "#1d3061" },
    RIO:   { bg: "#b0b0b0", border: "#b0b0b0" },
    SUL:   { bg: "#03a5a5", border: "#03a5a5" },
    SAO:   { bg: "#0104a7", border: "#0104a7" },
  };
  const tabsIdent = REGS.map(r => {
    const active = tab === r;
    const c = _TAB_COLORS[r] || { bg: "#1d3061", border: "#1d3061" };
    const activeStyle = active
      ? `background:${c.bg};border-color:${c.border};color:#fff;`
      : "";
    return `<button class="tab-btn ${active ? "tab-btn--active" : ""}"
      style="${activeStyle}"
      data-action="set-tab" data-tab="${r}">${r}</button>`;
  }).join("");

  // Abas linha 2: Não Identificados (GRUPO já está no GRUPO tab)
  const tabsNI = ["RIO","SUL","SAO"].map(r => {
    const key = `NI_${r}`;
    return `<button class="tab-btn tab-btn--ni ${tab === key ? "tab-btn--active" : ""}"
      data-action="set-tab" data-tab="${key}">N.ident.${r}</button>`;
  }).join("");

  // Conteúdo da coluna esquerda
  const leftContent = tab === "PLANO"
    ? _planoRefFormHTML(state)
    : isNI
      ? _niFormHTML(niRegional, niData, mes, mesesAtivos)
      : _identFormHTML(tab, rd, mes, mesesAtivos, state.naoId);

  // Preview KPI (col. direita)
  const previewContent = tab === "PLANO"
    ? '<div style="padding:8px">'
    +   '<div class="preview-hd">Plano de Ação</div>'
    +   '<div class="preview-sub" style="margin-top:4px">Referência para o time regional</div>'
    +   '<div style="margin-top:16px;font-size:12px;color:#888;line-height:1.9">'
    +   '📌 Preencha os campos de referência ao lado.<br>'
    +   'Os dados aparecerão automaticamente no<br>'
    +   '<b>plano-de-acao.html</b> para o time regional.<br><br>'
    +   '📋 Após o time enviar as ações, clique em<br>'
    +   '<b>Importar Planos</b> na barra acima.'
    +   '</div></div>'
    : isNI
      ? _niPreviewHTML(niRegional, niData, ano)
      : _identPreviewHTML(tab, rd, ano, tab === "GRUPO" ? naoId : null);

  return `
    ${navHTML(2, mes, ano)}
    <div style="display:flex;flex-direction:column;padding:20px 24px;height:calc(100vh - 50px);overflow:hidden;box-sizing:border-box">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-shrink:0">
        <div>
          <h3 class="step-data__title">Preenchimento de Dados</h3>
          <p class="step-data__sub">Preencha as informações de cada regional</p>
        </div>
        <span style="background:var(--navy);color:#fff;font-weight:700;font-size:13px;padding:6px 14px;border-radius:8px">${mes}/${ano}</span>
      </div>

      <div style="margin:0 0 10px;flex-shrink:0">
        <div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
          ${tabsIdent}
          <span style="width:1px;height:24px;background:var(--border);margin:0 4px;flex-shrink:0;"></span>
          ${tabsNI}
          <span style="width:1px;height:24px;background:var(--border);margin:0 4px;flex-shrink:0;"></span>
          <button class="tab-btn ${tab === 'PLANO' ? 'tab-btn--active' : ''}"
            style="background:${tab === 'PLANO' ? 'var(--navy)' : 'transparent'};border-color:var(--navy)"
            data-action="set-tab" data-tab="PLANO">📋 Plano de Ação</button>
        </div>
      </div>

      <div style="display:flex;gap:20px;flex:1;min-height:0;margin-top:4px">
        <div style="flex:0 0 44%;overflow-y:auto;min-width:0">${notifBanner}${leftContent}</div>
        <div style="flex:1;background:#fff;border-radius:12px;padding:16px;border:1px solid #eee;display:flex;flex-direction:column;overflow-y:auto">${previewContent}</div>
      </div>

      <div style="display:flex;justify-content:space-between;padding-top:12px;margin-top:auto;flex-shrink:0;border-top:1px solid #eee">
        <div></div>
        <button class="btn btn--primary" data-action="go-step" data-step="3">Visualizar Apresentação →</button>
      </div>
    </div>`;
}

// ── Formulário: Identificados ──────────────────────────
function _identFormHTML(tab, rd, mes, mesesAtivos, naoId) {
  const kpiInputs = [
    { f:"excessos",   l:"Excessos de Velocidade" },
    { f:"condutores", l:"Condutores c/ Excesso"  },
    { f:"km",         l:"Km Percorrido"          },
    { f:"cada1000",   l:"A cada 1000km"          },
  ].map(({ f, l }) => `
    <div>
      <label class="field-label">${l}</label>
      <input class="field-input" type="text" value="${rd[f]}"
        placeholder="0" data-field="${f}">
    </div>`).join("");

  const monthRows = mesesAtivos.map(m => `
    <div class="monthly-grid__label">${m}</div>
    <input class="monthly-input" type="text" value="${rd.meses[m].q}"
      placeholder="0" data-mes="${m}" data-mesfield="q">
    <input class="monthly-input monthly-input--red" type="text" value="${rd.meses[m].k1000}"
      placeholder="0,00" data-mes="${m}" data-mesfield="k1000">`).join("");

  const planoHTML = tab !== "GRUPO" ? `
    <div class="card">
      <div class="section-title">Plano de Ação — ${tab}</div>
      <p class="field-hint">Uma ação por linha &nbsp;·&nbsp;
        <a href="plano-de-acao.html" target="_blank" style="color:var(--red);font-size:11px">
          Abrir formulário externo ↗
        </a>
      </p>
      <textarea class="field-textarea" rows="5" data-field="planoAcao"
        placeholder="Convocação dos motoristas infratores;\nAtuação junto à equipe de instrutores;"
      >${rd.planoAcao}</textarea>
    </div>` : "";

  const _niGrupo = naoId || {};
  const _niGrupoMonthRows = mesesAtivos.map(m => `
    <div class="monthly-grid__label">${m}</div>
    <input class="monthly-input" type="text"
      value="${(_niGrupo.meses && _niGrupo.meses[m]) ? _niGrupo.meses[m].q : ""}"
      placeholder="0" data-nao-id-mes="${m}" data-nao-id-mesfield="q" data-ni-key="NI_GRUPO">
    <input class="monthly-input monthly-input--red" type="text"
      value="${(_niGrupo.meses && _niGrupo.meses[m]) ? _niGrupo.meses[m].k1000 : ""}"
      placeholder="0,00" data-nao-id-mes="${m}" data-nao-id-mesfield="k1000" data-ni-key="NI_GRUPO">
  `).join("");

  const naoIdGrupoHTML = tab === "GRUPO" ? `
    <div class="card">
      <div class="section-title" style="color:var(--red);border-color:var(--red)">
        Não Identificados — GRUPO (Totais)
      </div>
      <div class="kpi-grid">
        <div><label class="field-label">Excessos de Velocidade</label>
          <input class="field-input" type="text" value="${_niGrupo.excessos || ""}"
            placeholder="0" data-nao-id-field="excessos" data-ni-key="NI_GRUPO"></div>
        <div><label class="field-label">Condutores c/ Excesso</label>
          <input class="field-input" type="text" value="${_niGrupo.condutores || ""}"
            placeholder="0" data-nao-id-field="condutores" data-ni-key="NI_GRUPO"></div>
        <div><label class="field-label">Km Percorrido</label>
          <input class="field-input" type="text" value="${_niGrupo.km || ""}"
            placeholder="0" data-nao-id-field="km" data-ni-key="NI_GRUPO"></div>
        <div><label class="field-label">A cada 1000km</label>
          <input class="field-input" type="text" value="${_niGrupo.cada1000 || ""}"
            placeholder="0,00" data-nao-id-field="cada1000" data-ni-key="NI_GRUPO"></div>
      </div>
    </div>
    <div class="card">
      <div class="section-title" style="color:var(--red);border-color:var(--red)">
        Não Identificados — GRUPO (Dados Mensais)
      </div>
      <div class="monthly-grid">
        <div class="monthly-grid__hd">MES</div>
        <div class="monthly-grid__hd">EXCESSOS</div>
        <div class="monthly-grid__hd monthly-grid__hd--red">A CADA 1000KM</div>
        ${_niGrupoMonthRows}
      </div>
    </div>` : "";

  return `
    <div class="card">
      <div class="section-title">Identificados — Totais do Ano (${tab})</div>
      <div class="kpi-grid">
        ${kpiInputs}
        ${tab !== "GRUPO" ? `
        <div><label class="field-label">Meta</label>
          <input class="field-input" type="text" value="${rd.meta}" placeholder="0,02" data-field="meta"></div>
        <div><label class="field-label">Realizado</label>
          <input class="field-input" type="text" value="${rd.realizado}" placeholder="0,00" data-field="realizado"></div>` : ""}
      </div>
    </div>
    <div class="card">
      <div class="section-title">Identificados — Dados Mensais (Jan a ${mes})</div>
      <div class="monthly-grid">
        <div class="monthly-grid__hd">MÊS</div>
        <div class="monthly-grid__hd">EXCESSOS</div>
        <div class="monthly-grid__hd monthly-grid__hd--red">A CADA 1000KM</div>
        ${monthRows}
      </div>
    </div>
    ${planoHTML}
    ${naoIdGrupoHTML}`;
}

// ── Formulário: Não Identificados ─────────────────────
function _niFormHTML(regional, niData, mes, mesesAtivos) {
  const niKey  = `NI_${regional}`;
  const setores = niData.setores || [];
  const setorRows = setores.map((s, i) => `
    <input class="field-input" type="text" value="${s.nome || ''}"
      placeholder="Nome do setor" style="font-size:12px"
      data-setor-idx="${i}" data-setor-field="nome" data-ni-key="${niKey}">
    <input class="monthly-input" type="text" value="${s.excessos || ''}"
      placeholder="0"
      data-setor-idx="${i}" data-setor-field="excessos" data-ni-key="${niKey}">
    <input class="monthly-input monthly-input--red" type="text" value="${s.cada1000 || ''}"
      placeholder="0,00"
      data-setor-idx="${i}" data-setor-field="cada1000" data-ni-key="${niKey}">`).join("");

  return `
    <div class="card">
      <div class="section-title" style="color:var(--red);border-color:var(--red)">
        Não Identificados — ${regional} (Totais)
      </div>
      <div class="kpi-grid">
        <div><label class="field-label">Excessos de Velocidade</label>
          <input class="field-input" type="text" value="${niData.excessos || ''}"
            placeholder="0" data-nao-id-field="excessos" data-ni-key="${niKey}"></div>
        <div><label class="field-label">Condutores c/ Excesso</label>
          <input class="field-input" type="text" value="${niData.condutores || ''}"
            placeholder="0" data-nao-id-field="condutores" data-ni-key="${niKey}"></div>
        <div><label class="field-label">Km Percorrido</label>
          <input class="field-input" type="text" value="${niData.km || ''}"
            placeholder="0" data-nao-id-field="km" data-ni-key="${niKey}"></div>
        <div><label class="field-label">A cada 1000km</label>
          <input class="field-input" type="text" value="${niData.cada1000 || ''}"
            placeholder="0,00" data-nao-id-field="cada1000" data-ni-key="${niKey}"></div>
        <div><label class="field-label">Meta</label>
          <input class="field-input" type="text" value="${niData.meta || ''}"
            placeholder="0,02" data-nao-id-field="meta" data-ni-key="${niKey}"></div>
        <div><label class="field-label">Realizado</label>
          <input class="field-input" type="text" value="${niData.realizado || ''}"
            placeholder="0,00" data-nao-id-field="realizado" data-ni-key="${niKey}"></div>
      </div>
    </div>
    <div class="card">
      <div class="section-title" style="color:var(--red);border-color:var(--red)">
        Top 5 Setores — Não Identificados ${regional}
      </div>
      <p class="field-hint">Preencha os 5 piores setores em ordem decrescente de excessos</p>
      <div class="monthly-grid" style="grid-template-columns:1fr 80px 100px">
        <div class="monthly-grid__hd">SETOR</div>
        <div class="monthly-grid__hd">EXCESSOS</div>
        <div class="monthly-grid__hd monthly-grid__hd--red">A CADA 1000KM</div>
        ${setorRows}
      </div>
    </div>`;
}

// ── Preview: Identificados ─────────────────────────────
function _identPreviewHTML(tab, rd, ano, naoId) {
  const kpiBoxes = [
    { f:"excessos",   l:"Excessos:" },
    { f:"condutores", l:"Condutores:" },
    { f:"km",         l:"Km:" },
    { f:"cada1000",   l:"A cada 1000km:" },
  ].map(({ f, l }) => `
    <div class="kpi-card">
      <div class="kpi-card__label">${l}</div>
      <div class="kpi-card__value" id="pkpi-${f}">${fmtBr(rd[f])}</div>
    </div>`).join("");

  // Seção NI GRUPO — aparece só na aba GRUPO
  const niSection = (tab === "GRUPO" && naoId) ? `
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid #eee">
      <div class="preview-hd" style="font-size:11px;margin-bottom:6px">
        Não Identificados — GRUPO
      </div>
      <div class="kpi-cards" style="grid-template-columns:repeat(2,1fr);gap:5px;margin-bottom:8px">
        <div class="kpi-card" style="padding:6px 8px">
          <div class="kpi-card__label">Excessos:</div>
          <div class="kpi-card__value" id="pni-ex">${fmtBr(naoId.excessos)}</div>
        </div>
        <div class="kpi-card" style="padding:6px 8px">
          <div class="kpi-card__label">Condutores:</div>
          <div class="kpi-card__value" id="pni-cond">${fmtBr(naoId.condutores)}</div>
        </div>
        <div class="kpi-card" style="padding:6px 8px">
          <div class="kpi-card__label">Km:</div>
          <div class="kpi-card__value" id="pni-km">${fmtBr(naoId.km)}</div>
        </div>
        <div class="kpi-card" style="padding:6px 8px">
          <div class="kpi-card__label">A cada 1000km:</div>
          <div class="kpi-card__value" id="pni-k1">${fmtBr(naoId.cada1000)}</div>
        </div>
      </div>
      <div style="height:150px"><canvas id="preview-chart-ni"></canvas></div>
    </div>` : "";

  return `
    <div class="preview-hd">Preview — ${tab} · Identificados</div>
    <div class="preview-sub">Identificados - ${ano}</div>
    <div class="kpi-cards" style="grid-template-columns:repeat(2,1fr);gap:8px">${kpiBoxes}</div>
    <div style="margin-top:10px;height:180px"><canvas id="preview-chart"></canvas></div>
    ${tab !== "GRUPO" ? `
    <div class="meta-real-row">
      <div class="meta-real-box">
        <div class="meta-real-box__label">META</div>
        <div class="meta-real-box__val meta-real-box__val--navy" id="pmeta">${rd.meta || "—"}</div>
      </div>
      <div class="meta-real-box">
        <div class="meta-real-box__label">REALIZADO</div>
        <div class="meta-real-box__val" id="prealizado"
          style="color:${realizadoColor(rd.meta, rd.realizado) || 'var(--navy)'}">
          ${rd.realizado || "—"}
        </div>
      </div>
    </div>` : ""}
    ${niSection}`;
}

// ── Preview: Não Identificados ─────────────────────────
function _niPreviewHTML(regional, niData, ano) {
  var cor = realizadoColor(niData.meta, niData.realizado);
  return `
    <div class="preview-hd">Preview — N.ident.${regional}</div>
    <div class="preview-sub">Não Identificados — ${ano}</div>
    <div class="kpi-cards" style="grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:8px">
      <div class="kpi-card">
        <div class="kpi-card__label">Excessos:</div>
        <div class="kpi-card__value" id="pni-ex">${fmtBr(niData.excessos)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-card__label">Condutores:</div>
        <div class="kpi-card__value" id="pni-cond">${fmtBr(niData.condutores)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-card__label">Km:</div>
        <div class="kpi-card__value" id="pni-km">${fmtBr(niData.km)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-card__label">A cada 1000km:</div>
        <div class="kpi-card__value" id="pni-k1">${fmtBr(niData.cada1000)}</div>
      </div>
    </div>
    <div style="height:170px"><canvas id="preview-chart"></canvas></div>
    <div class="meta-real-row">
      <div class="meta-real-box">
        <div class="meta-real-box__label">META</div>
        <div class="meta-real-box__val meta-real-box__val--navy" id="pni-meta">${niData.meta || "—"}</div>
      </div>
      <div class="meta-real-box">
        <div class="meta-real-box__label">REALIZADO</div>
        <div class="meta-real-box__val" id="pni-real"
          style="color:${cor || 'var(--navy)'}">
          ${niData.realizado || "—"}
        </div>
      </div>
    </div>`;
}

// ── Helper: obtém objeto naoId pelo tab key ────────────
function _getNaoIdByKey(key, state) {
  if (key === "NI_GRUPO") return state.naoId;
  if (key === "NI_RIO")   return state.naoIdRIO;
  if (key === "NI_SUL")   return state.naoIdSUL;
  if (key === "NI_SAO")   return state.naoIdSAO;
  return state.naoId;
}

// ══════════════════════════════════════════════════════
// STEP 3 — preview de slides
// ══════════════════════════════════════════════════════
function stepPreviewHTML(slides, slideIdx, mes, ano) {
  const total = slides.length;
  const thumbLabel = s =>
    s.type === "cover"       ? "Capa"
    : s.type === "contra-capa" ? "Contra\nCapa"
    : s.type === "regional"  ? `${s.r}\nIdentif.`
    : s.type === "nao-id"    ? `${s.r}\nNão Id.`
    : `${s.r}\nPlano`;

  const thumbsHTML = slides.map((s, i) => `
    <div class="thumb ${i === slideIdx ? "thumb--active" : ""}"
      data-action="go-slide" data-idx="${i}">
      <div class="thumb__preview">${thumbLabel(s)}</div>
      <div class="thumb__num">${i + 1}</div>
    </div>`).join("");

  return `
    <div style="height:100vh;background:#14141e;display:flex;flex-direction:column;overflow:hidden">
      <div class="preview-bar">
        <div class="preview-bar__left">
          <button class="btn btn--ghost" data-action="go-step" data-step="2">← Editar</button>
          <button class="btn btn--ghost" data-action="go-home">Início</button>
        </div>
        <span class="preview-bar__info">Slide ${slideIdx + 1} / ${total} — ${mes}/${ano}</span>
        <div class="preview-bar__nav">
          <button class="preview-bar__arrow" data-action="prev-slide" ${slideIdx === 0 ? "disabled" : ""}>‹</button>
          <button class="preview-bar__arrow" data-action="next-slide" ${slideIdx === total - 1 ? "disabled" : ""}>›</button>
          <button class="btn btn--ghost" id="btn-pdf" data-action="gerar-pdf"
            style="margin-left:12px;padding:3px 12px;font-size:11px">
            📄 Gerar PDF
          </button>
          <button class="btn btn--ghost" id="btn-sheets" data-action="gerar-sheets"
            title="Sincronizar dados com Google Sheets"
            style="margin-left:4px;padding:2px 6px;background:rgba(255,255,255,.1)">
            <img src="${LOGO_SHEETS}" style="height:22px;width:auto;vertical-align:middle" alt="Sync Sheets">
          </button>
          <a href="${SHEETS_URL}" target="_blank" title="Abrir planilha"
            style="margin-left:2px;display:inline-flex;align-items:center;padding:2px 8px;
                   background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.3);
                   border-radius:6px;font-size:11px;color:white;text-decoration:none">
            ↗ Abrir
          </a>
        </div>
      </div>
      <div style="display:flex;flex:1;overflow:hidden;min-height:0">
        <div class="thumbs">${thumbsHTML}</div>
        <div class="slide-canvas">
          <div class="slide-frame" id="slide-frame"></div>
        </div>
      </div>
    </div>`;
}
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
          labels: { font: { size: 9 }, boxWidth: 5, boxHeight: 5, padding: 8, usePointStyle: true, pointStyle: "circle" }
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
          labels: { font: { size: 9 }, boxWidth: 5, boxHeight: 5, padding: 8, usePointStyle: true, pointStyle: "circle" }
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
// slides.js — HTML de cada slide da apresentacao

// Retorna o logo correto por regional
function _logoRegional(regional) {
  if (regional === "RIO") return LOGO_RIO;
  if (regional === "SUL") return LOGO_SUL;
  if (regional === "SAO") return LOGO_SAO;
  return LOGO_JCA;
}

// Quebra o texto em spans por palavra (resolve bug de espacos no html2canvas)
function fw(text) {
  const spans = String(text).split(" ").map(function(w) {
    return "<span>" + w + "</span>";
  }).join("");
  return '<span style="display:inline-flex;flex-wrap:wrap;gap:0.28em;align-items:baseline">' + spans + "</span>";
}

// ── Cabecalho padrao ──────────────────────────────────────────────────────────
function _header(regional) {
  return '<div class="slide-header">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:2px">'
    +   '<img src="' + LOGO_JCA + '" class="slide-logo-sm" crossorigin="anonymous" alt="JCA">'
    +   '<span class="slide-header__bc" style="display:inline-flex;gap:0.25em">'+
        '<span>Excessos</span><span>de</span><span>Velocidade</span>'
    +   '</span>'
    + '</div>'
    + '<div style="height:3px;background:var(--navy);width:100%;flex-shrink:0"></div>'
    + '</div>';
}

// ── Rodape ────────────────────────────────────────────────────────────────────
function _footer(analista) {
  var txt = analista ? "DO.ACT.IOP - " + analista : "DO.ACT.IOP";
  var spans = txt.split(" ").map(function(w) { return "<span>" + w + "</span>"; }).join("");
  return '<div class="slide__footer-row">'
    + '<span class="slide__footer-text" style="display:inline-flex;flex-wrap:wrap;gap:0.25em">' + spans + '</span>'
    + '<img src="' + LOGO_IO + '" class="slide-logo-io" crossorigin="anonymous" alt="IO">'
    + '</div>';
}

// ── Cards de KPI ──────────────────────────────────────────────────────────────
function _kpiCards(cards) {
  var cols = cards.length;
  var html = '<div class="kpi-cards" style="grid-template-columns:repeat(' + cols + ',1fr)">';
  cards.forEach(function(c) {
    html += '<div class="kpi-card">'
      + '<div class="kpi-card__label">' + fw(c.label) + '</div>'
      + '<div class="kpi-card__value">' + fmtBr(c.val) + '</div>'
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ── Meta / Realizado ──────────────────────────────────────────────────────────
function _metaReal(regData) {
  var meta      = regData.meta      || "";
  var realizado = regData.realizado || "";
  var cor       = realizadoColor(meta, realizado);
  var realizadoStyle = cor
    ? 'style="color:' + cor + '"'
    : 'style="color:#1d3061"';

  return '<div class="slide-meta-real">'
    + '<div class="slide-meta-box">'
    +   '<div class="slide-meta-box__label">Meta</div>'
    +   '<div class="slide-meta-box__val slide-meta-box__val--navy">' + (meta || "---") + '</div>'
    + '</div>'
    + '<div class="slide-meta-box">'
    +   '<div class="slide-meta-box__label">Realizado</div>'
    +   '<div class="slide-meta-box__val" ' + realizadoStyle + '>' + (realizado || "---") + '</div>'
    + '</div>'
    + '</div>';
}

// ── CAPA ──────────────────────────────────────────────────────────────────────
function slideCoverHTML(mes, ano, analista) {
  var footerTxt = analista ? "DO.ACT.IOP - " + analista : "DO.ACT.IOP";
  var footerSpans = footerTxt.split(" ").map(function(w) { return "<span>" + w + "</span>"; }).join("");
  return '<div class="slide slide-cover">'
    + '<div class="slide-cover__logos">'
    +   '<img src="' + LOGO_JCA + '" class="slide-cover__logo-jca" crossorigin="anonymous" alt="JCA">'
    +   '<div class="slide-cover__sep"></div>'
    +   '<img src="' + LOGO_IO_CAPA  + '" class="slide-cover__logo-io"  crossorigin="anonymous" alt="IO">'
    + '</div>'
    + '<div class="slide-cover__title">' + fw("Excessos de Velocidade") + '</div>'
    + '<div class="slide-cover__period">' + fw(MESES_FULL[MESES.indexOf(mes)] + " / " + ano) + '</div>'
    + '<div class="slide__footer-row" style="position:absolute;bottom:12px;left:24px;right:24px">'
    +   '<span class="slide__footer-text" style="display:inline-flex;flex-wrap:wrap;gap:0.25em">' + footerSpans + '</span>'
    + '</div>'
    + '</div>';
}

// ── REGIONAL IDENTIFICADOS ────────────────────────────────────────────────────
function slideRegionalHTML(regional, regData, ano, analista) {
  var cards = [
    { label: "Excessos de Velocidade:", val: regData.excessos   },
    { label: "Condutores c/ Excesso:",  val: regData.condutores },
    { label: "Km Percorrido:",          val: regData.km         },
    { label: "Excessos a cada 1000km:", val: regData.cada1000   }
  ];
  var logoLg = regional !== "GRUPO"
    ? '<img src="' + _logoRegional(regional) + '" class="slide-logo-lg" crossorigin="anonymous" alt="' + regional + '">'
    : "";
  return '<div class="slide">'
    + _header(regional)
    + '<div class="slide-title-row">'
    +   '<div class="slide-regional__title">' + fw("Excessos de Velocidade | Identificados - " + ano) + '</div>'
    +   logoLg
    + '</div>'
    + _kpiCards(cards)
    + '<div class="slide-regional__chart-area">'
    +   '<div class="slide-regional__chart"><canvas id="slide-chart"></canvas></div>'
    +   (regional !== "GRUPO" ? _metaReal(regData) : "")
    + '</div>'
    + _footer(analista)
    + '</div>';
}

// ── NAO IDENTIFICADOS GRUPO (grafico mensal) ──────────────────────────────────
function slideNaoIdHTML(regional, naoIdData, ano, analista) {
  if (regional !== "GRUPO") {
    return _slideNaoIdRegional(regional, naoIdData, ano, analista);
  }
  // 4 cards, sem Meta/Realizado (GRUPO NI nao tem)
  var cards = [
    { label: "Excessos de Velocidade:", val: naoIdData.excessos   },
    { label: "Condutores c/ Excesso:",  val: naoIdData.condutores },
    { label: "Km Percorrido:",          val: naoIdData.km         },
    { label: "Excessos a cada 1000km:", val: naoIdData.cada1000   }
  ];
  return '<div class="slide">'
    + _header(null)
    + '<div class="slide-title-row">'
    +   '<div class="slide-regional__title">' + fw("Excessos de Velocidade | Nao Identificados - " + ano) + '</div>'
    + '</div>'
    + _kpiCards(cards)
    + '<div class="slide-regional__chart-area">'
    +   '<div class="slide-regional__chart"><canvas id="slide-chart"></canvas></div>'
    + '</div>'
    + _footer(analista)
    + '</div>';
}

// ── NAO IDENTIFICADOS REGIONAL (grafico de setores) ───────────────────────────
function _slideNaoIdRegional(regional, naoIdData, ano, analista) {
  var cards = [
    { label: "Excessos de Velocidade:", val: naoIdData.excessos   },
    { label: "Condutores c/ Excesso:",  val: naoIdData.condutores },
    { label: "Km Percorrido:",          val: naoIdData.km         },
    { label: "Excessos a cada 1000km:", val: naoIdData.cada1000   }
  ];
  return '<div class="slide">'
    + _header(regional)
    + '<div class="slide-title-row">'
    +   '<div class="slide-regional__title">' + fw("Excessos de Velocidade | Nao Identificados " + regional + " - " + ano) + '</div>'
    +   '<img src="' + _logoRegional(regional) + '" class="slide-logo-lg" crossorigin="anonymous" alt="' + regional + '">'
    + '</div>'
    + _kpiCards(cards)
    + '<div class="slide-regional__chart-area">'
    +   '<div class="slide-regional__chart"><canvas id="slide-chart"></canvas></div>'
    +   _metaReal(naoIdData)
    + '</div>'
    + _footer(analista)
    + '</div>';
}

// ── CONTRA CAPA ───────────────────────────────────────────────────────────────
function slideContraCapaHTML(analista) {
  var footerTxt   = analista ? "DO.ACT.IOP - " + analista : "DO.ACT.IOP";
  var footerSpans = footerTxt.split(" ").map(function(w) { return "<span>" + w + "</span>"; }).join("");
  return '<div class="slide slide-cover">'
    + '<div class="slide-cover__logos">'
    +   '<img src="' + LOGO_JCA + '" class="slide-cover__logo-jca" crossorigin="anonymous" alt="JCA">'
    +   '<div class="slide-cover__sep"></div>'
    +   '<img src="' + LOGO_IO_CAPA  + '" class="slide-cover__logo-io"  crossorigin="anonymous" alt="IO">'
    + '</div>'
    + '<div class="slide__footer-row" style="position:absolute;bottom:12px;left:24px;right:24px">'
    +   '<span class="slide__footer-text" style="display:inline-flex;flex-wrap:wrap;gap:0.25em">' + footerSpans + '</span>'
    + '</div>'
    + '</div>';
}
function slidePlanoHTML(regional, regData, mes, mesIdx, analista) {
  var mesDado = regData.meses[mes] || {};
  var prox    = mes;
  var linhas  = regData.planoAcao.split("\n").filter(function(l) { return l.trim(); });
  var bullets = linhas.length === 0
    ? '<span class="slide-plano__empty">Nenhum plano preenchido.</span>'
    : '<ul>' + linhas.map(function(l) { return "<li>" + l + "</li>"; }).join("") + '</ul>';

  return '<div class="slide">'
    + _header(regional)
    + '<div class="slide-plano__title">' + fw("Plano de Acao") + '</div>'
    + '<div class="slide-plano__table">'
    +   '<div class="slide-plano__table-hd">' + fw("Tipo da Ocorrencia") + '</div>'
    +   '<div class="slide-plano__table-type">' + fw("Excessos de Velocidade") + '</div>'
    +   '<div class="slide-plano__table-row">'
    +     '<div class="slide-plano__table-cell"><strong>Quantidade:</strong> ' + (mesDado.q || "---") + '</div>'
    +     '<div class="slide-plano__table-cell"><strong>A cada 1000km:</strong> ' + (mesDado.k1000 || "---") + '</div>'
    +     '<div class="slide-plano__table-cell"><strong>Meta:</strong> ' + (regData.meta || "---") + '</div>'
    +   '</div>'
    +   '<div class="slide-plano__table-sub">' + fw("Plano de Acao " + prox) + '</div>'
    + '</div>'
    + '<div class="slide-plano__actions">' + bullets + '</div>'
    + _footer(analista)
    + '</div>';
}
// ═══════════════════════════════════════════════════
// pdf.js — geração de PDF em alta resolução
//
// Estratégia:
//   • Container no tamanho natural do slide (880×495)
//   • html2canvas scale:4  →  imagem 3520×1980 px
//   • Chart.js devicePixelRatio:4  →  gráfico nítido
//   • Resultado: ~350 DPI no PDF final
// ═══════════════════════════════════════════════════

var PDF_OUT_W = 960;
var PDF_OUT_H = 540;
var RENDER_W  = 880;
var RENDER_H  = 495;

async function gerarPDF(state) {
  const { slides, data, mes, ano } = state;
  const mesIdx      = MESES.indexOf(mes);
  const mesesAtivos = MESES.slice(0, mesIdx + 1);

  const btn = document.getElementById("btn-pdf");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Gerando..."; }

  // Container posicionado acima (top negativo) — left:-9999 causa kerning bugado em alguns browsers
  const box = document.createElement("div");
  box.style.cssText = `
    position: fixed;
    top: -${RENDER_H + 20}px;
    left: 0;
    width: ${RENDER_W}px;
    height: ${RENDER_H}px;
    overflow: hidden;
    background: #fff;
    z-index: 9999;
    font-family: Arial, Helvetica, sans-serif;
    word-spacing: 0.12em;
    font-kerning: none;
  `;
  document.body.appendChild(box);

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [PDF_OUT_W, PDF_OUT_H],
    hotfixes: ["px_scaling"],
  });

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];

    // Renderiza o HTML do slide no container
    box.innerHTML = _slideHTMLForPDF(s, state, mesesAtivos, mesIdx);

    // Gráfico — detecta tipo (mensal ou setores)
    let tempChart = null;
    if (s.type === "regional") {
      const canvas = box.querySelector("#slide-chart");
      if (canvas) tempChart = createChartSync(canvas, data[s.r], mesesAtivos, s.r);
    }
    if (s.type === "nao-id") {
      const canvas = box.querySelector("#slide-chart");
      if (canvas) {
        const nd = _naoIdForRegional(s.r, state);
        tempChart = s.r === "GRUPO"
          ? createChartSync(canvas, nd, mesesAtivos, "GRUPO")
          : createSectorChartSync(canvas, nd.setores || [], s.r);
      }
    }

    // Aguarda o Chart.js terminar de pintar
    await _raf();
    await _delay(200);

    // Captura em 4× o tamanho natural → 3520×1980 px
    const snap = await html2canvas(box, {
      scale: 4,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      width: RENDER_W,
      height: RENDER_H,
      logging: false,
    });

    if (i > 0) pdf.addPage([PDF_OUT_W, PDF_OUT_H], "landscape");
    pdf.addImage(
      snap.toDataURL("image/jpeg", 0.95),
      "JPEG", 0, 0, PDF_OUT_W, PDF_OUT_H
    );

    if (tempChart) tempChart.destroy();
  }

  document.body.removeChild(box);
  pdf.save(`JCA_Excessos_${mes}_${ano}.pdf`);

  if (btn) { btn.disabled = false; btn.textContent = "📄 Gerar PDF"; }
}

function _slideHTMLForPDF(slide, state, mesesAtivos, mesIdx) {
  const { data, mes, ano, analista } = state;
  if (slide.type === "cover")
    return slideCoverHTML(mes, ano, analista);
  if (slide.type === "contra-capa")
    return slideContraCapaHTML(analista);
  if (slide.type === "regional")
    return slideRegionalHTML(slide.r, data[slide.r], ano, analista);
  if (slide.type === "nao-id")
    return slideNaoIdHTML(slide.r, _naoIdForRegional(slide.r, state), ano, analista);
  if (slide.type === "plano")
    return slidePlanoHTML(slide.r, data[slide.r], mes, mesIdx, analista);
  return "";
}

function _naoIdForRegional(r, state) {
  if (r === "RIO") return state.naoIdRIO;
  if (r === "SUL") return state.naoIdSUL;
  if (r === "SAO") return state.naoIdSAO;
  return state.naoId;
}

var _raf   = () => new Promise(r => requestAnimationFrame(r));
var _delay = ms  => new Promise(r => setTimeout(r, ms));
// sheets.js — integração com Google Sheets
//
// Estrutura: um sync sobrescreve a aba inteira com o histórico completo.
// O analista de cada mês é buscado no Firebase (quem preencheu aquele mês).

var _HDR = [
  "Período","Ano","Analista","Tipo","Referência",
  "Excessos","Condutores","Km Percorrido","A cada 1000km","Meta","Realizado"
];

function _row(periodo, ano, analista, tipo, ref, ex, cond, km, k1000, meta, real) {
  return [
    periodo  || "", ano     || "", analista || "",
    tipo     || "", ref     || "",
    ex       || "", cond    || "", km       || "", k1000   || "",
    meta     || "", real    || ""
  ];
}

// "Jan-Mai/2026" se mesIdx > 0, senão "Jan/2026"
function _periodo(mes, ano) {
  var idx = MESES.indexOf(mes);
  return (idx === 0 ? mes : MESES[0] + "-" + mes) + "/" + ano;
}

// ── Sincronizar com o Sheets ──────────────────────────────────────────────
async function sincronizarSheets(state) {
  var url = (APPS_SCRIPT_URL || "").trim();
  if (!url) { alert("URL do Apps Script não configurada em constants.js"); return; }

  var btn = document.getElementById("btn-sheets");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Carregando histórico..."; }

  try {
    var mes      = state.mes;
    var ano      = state.ano;
    var mesIdx   = MESES.indexOf(mes);
    var mesesAt  = MESES.slice(0, mesIdx + 1);
    var periodo  = _periodo(mes, ano);

    // Busca o analista de cada mês no Firebase
    // Meses sem dado no Firebase usam o analista atual como fallback
    var analistas = {};
    for (var i = 0; i <= mesIdx; i++) {
      var m = MESES[i];
      try {
        var doc = await _fbCarregar(m, ano);
        analistas[m] = doc && doc.analista ? doc.analista : state.analista;
      } catch(e) {
        analistas[m] = state.analista;
      }
    }

    function r(m, tipo, ref, ex, cond, km, k1000, meta, real) {
      return _row(periodo, ano, analistas[m] || state.analista,
                  tipo, ref, ex, cond, km, k1000, meta, real);
    }

    var sheets = {};

    // ── GRUPO ───────────────────────────────────────────────────────────────
    var gd = state.data.GRUPO;
    var ni = state.naoId || {};
    var grupoRows = [];

    // Identificados: uma linha por mês
    mesesAt.forEach(function(m) {
      var md = (gd.meses && gd.meses[m]) || {};
      grupoRows.push(r(m, "Identificados", m, md.q, "", "", md.k1000, "", ""));
    });
    // Total acumulado
    grupoRows.push(r(mes, "Ident — Total", "Jan-"+mes,
      gd.excessos, gd.condutores, gd.km, gd.cada1000, gd.meta, gd.realizado));

    // N.Identificados: uma linha por mês
    mesesAt.forEach(function(m) {
      var md = (ni.meses && ni.meses[m]) || {};
      grupoRows.push(r(m, "N.Identificados", m, md.q, "", "", md.k1000, "", ""));
    });
    grupoRows.push(r(mes, "N.Ident — Total", "Jan-"+mes,
      ni.excessos, ni.condutores, ni.km, ni.cada1000, "", ""));

    sheets["GRUPO"] = { rows: grupoRows };

    // ── Regionais ────────────────────────────────────────────────────────────
    var niMap = { RIO: state.naoIdRIO, SUL: state.naoIdSUL, SAO: state.naoIdSAO };

    ["RIO","SUL","SAO"].forEach(function(reg) {
      var rd = state.data[reg];
      var nd = niMap[reg] || {};
      var regRows = [];

      // Identificados mensal
      mesesAt.forEach(function(m) {
        var md = (rd.meses && rd.meses[m]) || {};
        regRows.push(r(m, "Identificados", m, md.q, "", "", md.k1000, "", ""));
      });
      regRows.push(r(mes, "Ident — Total", "Jan-"+mes,
        rd.excessos, rd.condutores, rd.km, rd.cada1000, rd.meta, rd.realizado));

      // Plano de ação
      var plano = (rd.planoAcao || "").split("\n").filter(function(l) { return l.trim(); });
      plano.forEach(function(linha) {
        regRows.push(r(mes, "Plano de Ação", linha, "", "", "", "", "", ""));
      });

      sheets["Regional " + reg] = { rows: regRows };

      // N.ident: totais + setores do mês atual (dado pontual, não acumula)
      var niRows = [
        r(mes, "N.Ident — Total", mes, nd.excessos, nd.condutores, nd.km, nd.cada1000, nd.meta, nd.realizado),
      ];
      (nd.setores || []).filter(function(s) { return s.nome; }).forEach(function(s) {
        niRows.push(r(mes, "N.Ident — Setor", s.nome, s.excessos, "", "", s.cada1000, "", ""));
      });
      sheets["N.ident." + reg] = { rows: niRows };
    });

    // Envia
    if (btn) btn.textContent = "⏳ Enviando...";

    var payload  = { periodo: periodo, header: _HDR, sheets: sheets };
    var response = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body:    JSON.stringify(payload)
    });
    var result = await response.json();

    if (result.ok) {
      alert("✅ Google Sheets atualizado!\n\n" +
        Object.keys(sheets).map(function(s) { return "• " + s; }).join("\n"));
    } else {
      alert("❌ Erro: " + (result.error || "verifique o Apps Script."));
    }

  } catch (err) {
    alert("❌ Erro: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<img src="' + LOGO_SHEETS +
        '" style="height:20px;width:auto;vertical-align:middle" alt="Sheets">';
    }
  }
}