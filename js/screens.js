// ═══════════════════════════════════════════════════
// screens.js — HTML de cada tela
// ═══════════════════════════════════════════════════

// ── Navegação ─────────────────────────────────────────
function navHTML(step, mes, ano) {
  const labels = ["1. Período", "2. Dados", "3. Preview"];
  const stepsHTML = labels.map((label, i) => {
    const n = i + 1;
    let cls = "nav__step";
    if (n === step)    cls += " nav__step--active";
    else if (n < step) cls += " nav__step--done";
    const attr = n < step ? `data-action="go-step" data-step="${n}"` : "";
    return `<div class="${cls}" ${attr}>${label}</div>`;
  }).join("");
  const period = step >= 2 ? `<span class="nav__period">${mes}/${ano}</span>` : "";
  return `
    <nav class="nav">
      <div class="nav__left">
        <button class="btn btn--ghost" data-action="go-home">← Início</button>
        <span class="nav__title">Excessos de Velocidade</span>
        ${period}
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        ${step === 2 ? `
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

// ══════════════════════════════════════════════════════
// HOME
// ══════════════════════════════════════════════════════
// ── Formulário de Referência do Plano de Ação ────────
function _planoRefFormHTML(state) {
  const regs = [
    { id:"RIO", label:"Regional RIO" },
    { id:"SUL", label:"Regional SUL" },
    { id:"SAO", label:"Regional SAO" }
  ];
  const pr = state.planoRef || {};
  return regs.map(function(r) {
    const p = pr[r.id] || {};
    return `
    <div class="card" style="margin-bottom:14px">
      <div class="section-title" style="margin-bottom:12px">${r.label}</div>
      <div class="kpi-grid">
        <div>
          <label class="field-label">Qtd. Excessos do Mês</label>
          <input class="field-input" type="text" value="${p.qtdExcessos || ''}"
            placeholder="0"
            data-plano-ref-reg="${r.id}" data-plano-ref-field="qtdExcessos">
        </div>
        <div>
          <label class="field-label">Excessos a cada 1000km</label>
          <input class="field-input" type="text" value="${p.a1000km || ''}"
            placeholder="0,00"
            data-plano-ref-reg="${r.id}" data-plano-ref-field="a1000km">
        </div>
        <div>
          <label class="field-label">Principal Setor Ofensor (NI)</label>
          <input class="field-input" type="text" value="${p.setorNI || ''}"
            placeholder="Setor / Linha"
            data-plano-ref-reg="${r.id}" data-plano-ref-field="setorNI">
        </div>
        <div>
          <label class="field-label">Qtd. Excessos NI</label>
          <input class="field-input" type="text" value="${p.qtdNI || ''}"
            placeholder="0"
            data-plano-ref-reg="${r.id}" data-plano-ref-field="qtdNI">
        </div>
      </div>
      <div id="plano-texto-${r.id}" style="margin-top:12px">
        <div style="color:#bbb;font-size:12px;font-style:italic">&#9203; Carregando texto...</div>
      </div>
    </div>`;
  }).join("");
}

function homeHTML() {
  return `
    <div class="home">
      <div class="home__header">
        <div class="home__eyebrow">Grupo JCA · Inteligência Operacional</div>
        <h1 class="home__title">Painel de Apresentações</h1>
        <p class="home__subtitle">Selecione o tipo de relatório que deseja montar</p>
      </div>
      <div class="home__cards">
        <div class="home-card home-card--enabled" data-action="start-excessos">
          <div class="home-card__icon">
            <img src="https://res.cloudinary.com/dln0ctawv/image/upload/v1780174695/Excessos_velocidade_wzzutp.png"
              style="width:120px;height:120px;object-fit:contain" alt="Excessos de Velocidade">
          </div>
          <div class="home-card__label">Excessos de Velocidade</div>
          <div class="home-card__desc">Apresentação mensal por regional</div>
        </div>
        <div class="home-card home-card--enabled" data-action="start-sinistros">
          <div class="home-card__icon">
            <img src="https://res.cloudinary.com/dln0ctawv/image/upload/v1779677663/colis%C3%A3o_g3go77.png"
              style="width:120px;height:120px;object-fit:contain" alt="Sinistros">
          </div>
          <div class="home-card__label">Sinistros</div>
          <div class="home-card__desc">Apresentação mensal por empresa</div>
        </div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════════
// STEP 1 — período + analista
// ══════════════════════════════════════════════════════
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
  const tabsIdent = REGS.map(r => `
    <button class="tab-btn ${tab === r ? "tab-btn--active" : ""}"
      data-action="set-tab" data-tab="${r}">${r}</button>`).join("");

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
    <div class="step-data">
      <div class="step-data__wrapper">
        <div class="step-data__topbar">
          <div>
            <div class="step-data__topbar-title">Preenchimento de Dados</div>
            <div class="step-data__topbar-sub">Preencha as informações de cada regional</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <button class="btn btn--secondary" style="font-size:11px;padding:5px 12px"
              data-action="importar-planos" title="Colar código do Plano de Ação">
              📋 Importar Planos
            </button>
            <span class="step-data__badge">${mes}/${ano}</span>
          </div>
        </div>

        <!-- Abas linha 1: Identificados -->
        <div class="tabs-group">
          <div class="tabs-group__label">Identificados</div>
          <div class="step-data__tabs">${tabsIdent}</div>
        </div>
        <!-- Abas linha 2: Não Identificados -->
        <div class="tabs-group">
          <div class="tabs-group__label">Não Identificados</div>
          <div class="step-data__tabs">${tabsNI}</div>
        </div>
        <!-- Aba Plano de Ação -->
        <div class="tabs-group" style="margin-top:4px">
          <div class="step-data__tabs">
            <button class="tab-btn ${tab === 'PLANO' ? 'tab-btn--active' : ''}"
              style="background:${tab === 'PLANO' ? 'var(--navy)' : 'transparent'};border-color:var(--navy)"
              data-action="set-tab" data-tab="PLANO">📋 Plano de Ação</button>
          </div>
        </div>

        <div class="step-data__grid">
          <div class="step-data__left">${notifBanner}${leftContent}</div>
          <div class="card step-data__preview">${previewContent}</div>
        </div>

        <div class="step-data__actions">
          <button class="btn btn--secondary" data-action="go-step" data-step="1">← Voltar</button>
          <button class="btn btn--primary"   data-action="go-step" data-step="3">Visualizar Apresentação →</button>
        </div>
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