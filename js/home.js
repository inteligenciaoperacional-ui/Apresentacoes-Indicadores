// ═══════════════════════════════════════════════════
// home.js — HTML de cada tela
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
        <div style="display:flex;align-items:center;justify-content:center;gap:28px;margin-bottom:32px">
          <img src="https://res.cloudinary.com/dln0ctawv/image/upload/v1779238658/JCA_1_mp1ic7.png" style="height:52px;object-fit:contain" alt="Grupo JCA">
          <div style="width:1px;height:52px;background:#ccc"></div>
          <img src="https://res.cloudinary.com/dln0ctawv/image/upload/v1781283106/Intelig%C3%AAncia_horizontal_preto_p6gikp_mwb3ts.png" style="height:52px;object-fit:contain" alt="Inteligência Operacional">
        </div>
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
        <div class="home-card home-card--enabled" data-action="start-multas">
          <div class="home-card__icon">
            <img src="https://res.cloudinary.com/dln0ctawv/image/upload/v1781216346/Multas_Regulatorias_mqhzxd.png"
              style="width:120px;height:120px;object-fit:contain" alt="Multas">
          </div>
          <div class="home-card__label">Multas Regulatórias</div>
          <div class="home-card__desc">Apresentação mensal por empresa</div>
        </div>
        <div class="home-card home-card--enabled" data-action="start-km-fretamento">
          <div class="home-card__icon">
            <img src="https://res.cloudinary.com/dln0ctawv/image/upload/v1781287454/KM_fretamento_zo1fef.png"
              style="width:120px;height:120px;object-fit:contain" alt="KM Fretamento">
          </div>
          <div class="home-card__label">KM Fretamento</div>
          <div class="home-card__desc">Apresentação mensal por empresa</div>
        </div>
        <div class="home-card home-card--enabled" data-action="start-reclamacoes-cliente">
          <div class="home-card__icon">
            <img src="https://res.cloudinary.com/dln0ctawv/image/upload/v1781818745/Reclamacoes_Cliente_wbmhyd.png"
              style="width:120px;height:120px;object-fit:contain" alt="Reclamações de Clientes">
          </div>
          <div class="home-card__label">Reclamações de Clientes</div>
          <div class="home-card__desc">Apresentação mensal por empresa</div>
        </div>
        <div class="home-card home-card--enabled" data-action="start-multas-transito">
          <div class="home-card__icon">
            <img src="https://res.cloudinary.com/dln0ctawv/image/upload/v1781287897/Multas_de_Transito_tdhy7v.png"
              style="width:120px;height:120px;object-fit:contain" alt="Multas de Trânsito">
          </div>
          <div class="home-card__label">Multas de Trânsito</div>
          <div class="home-card__desc">Apresentação mensal por empresa</div>
        </div>
        <div class="home-card home-card--enabled" data-action="start-eficiencia-diesel">
          <div class="home-card__icon">
            <img src="https://res.cloudinary.com/dln0ctawv/image/upload/v1781287774/Eficiencia_diesel_stwuuc.png"
              style="width:120px;height:120px;object-fit:contain" alt="Eficiência Diesel">
          </div>
          <div class="home-card__label">Efici&ecirc;ncia Diesel</div>
          <div class="home-card__desc">Apresentação mensal por empresa</div>
        </div>
      </div>
    </div>`;
}