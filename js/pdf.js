// ═══════════════════════════════════════════════════
// pdf.js — geração de PDF em alta resolução
//
// Estratégia:
//   • Container no tamanho natural do slide (880×495)
//   • html2canvas scale:4  →  imagem 3520×1980 px
//   • Chart.js devicePixelRatio:4  →  gráfico nítido
//   • Resultado: ~350 DPI no PDF final
// ═══════════════════════════════════════════════════

const PDF_OUT_W = 960;
const PDF_OUT_H = 540;
const RENDER_W  = 880;
const RENDER_H  = 495;

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

const _raf   = () => new Promise(r => requestAnimationFrame(r));
const _delay = ms  => new Promise(r => setTimeout(r, ms));