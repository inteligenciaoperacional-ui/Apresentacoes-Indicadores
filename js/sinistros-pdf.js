// sinistros-pdf.js — geracao de PDF do modulo Sinistros

async function sinGerarPDF(sinState) {
  var btn = document.getElementById("btn-sin-pdf");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Gerando..."; }

  try {
    var mesIdx  = MESES.indexOf(sinState.mes);
    var mesesAt = MESES.slice(0, mesIdx + 1);
    var slides  = sinState.slides || buildSinistrosSlides();
    var { jsPDF } = window.jspdf;
    var pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [960, 540] });

    var box = document.createElement("div");
    box.style.cssText = "position:fixed;top:-600px;left:0;width:960px;height:540px;overflow:hidden;background:#fff;";
    document.body.appendChild(box);

    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var html = sinSlideHTMLForPDF(s, sinState, mesesAt);
      box.innerHTML = html;

      // Criar graficos
      var charts = [];
      var mainC = box.querySelector("#sin-main-chart");
      var donutC = box.querySelector("#sin-donut-chart");
      var hbarC  = box.querySelector("#sin-hbar-chart");
      var hbar2C = box.querySelector("#sin-hbar2-chart");

      if (s.type === "sin-geral" && mainC) {
        var geral = sinState.dados[s.empresa].geral;
        charts.push(sinCreateMainChartSync(mainC, geral.meses, mesesAt, s.empresa, true));
      }
      if (s.type === "sin-segmento" && mainC) {
        var seg = sinState.dados[s.empresa][s.seg];
        charts.push(sinCreateMainChartSync(mainC, seg.meses, mesesAt, s.empresa, false));
        if (donutC) charts.push(sinCreateDonutChartSync(donutC, seg.gravidade, sinGetEmpresa(s.empresa).cor));
        if (hbarC) {
          var tipos = (seg.tipos || []).filter(function(t) { return t.tipo; });
          charts.push(sinCreateHBarChartSync(hbarC, tipos, "tipo", "qtd", sinGetEmpresa(s.empresa).cor));
        }
      }
      if (s.type === "sin-ofensores") {
        var segOf = sinState.dados[s.empresa][s.seg];
        var emp   = sinGetEmpresa(s.empresa);
        var ofMes = (segOf.ofensoresMes || []).filter(function(o) { return o.nome; });
        var top5  = (segOf.top5Ano     || []).filter(function(o) { return o.nome; });
        if (hbarC)  charts.push(sinCreateHBarChartSync(hbarC,  ofMes, "nome", "qtd", emp.cor, "km"));
        if (hbar2C) charts.push(sinCreateHBarChartSync(hbar2C, top5,  "nome", "qtd", emp.cor, "km"));
      }

      await new Promise(function(r) { requestAnimationFrame(r); });
      await new Promise(function(r) { setTimeout(r, 250); });

      var canvas = await html2canvas(box, {
        scale: 2, useCORS: true, allowTaint: false,
        width: 960, height: 540, backgroundColor: "#ffffff"
      });

      charts.forEach(function(c) { if (c) c.destroy(); });

      var img = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage([960, 540], "landscape");
      pdf.addImage(img, "JPEG", 0, 0, 960, 540);
    }

    document.body.removeChild(box);
    pdf.save("Sinistros_" + sinState.mes + "_" + sinState.ano + ".pdf");

  } catch(err) {
    alert("Erro ao gerar PDF: " + err.message);
    console.error(err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "📄 Gerar PDF"; }
  }
}

function sinSlideHTMLForPDF(s, sinState, mesesAt) {
  var analista = sinState.analista;
  if (s.type === "sin-cover")    return sinSlideCoverHTML(sinState.mes, sinState.ano, analista);
  if (s.type === "contra-capa")  return slideContraCapaHTML(analista);
  if (s.type === "sin-geral")    return sinSlideGeralHTML(s.empresa, sinState.dados[s.empresa].geral, sinState.ano, analista);
  if (s.type === "sin-segmento") return sinSlideSegmentoHTML(s.empresa, s.seg, sinState.dados[s.empresa][s.seg], sinState.ano, analista);
  if (s.type === "sin-ofensores")return sinSlideOfensoresHTML(s.empresa, s.seg, sinState.dados[s.empresa][s.seg], sinState.mes, sinState.ano, analista);
  if (s.type === "sin-plano")    return sinSlidePlanoHTML(s.empresa, sinState.dados[s.empresa].planoAcao, sinState.mes, sinState.ano, analista);
  return "<div></div>";
}