// sinistros-sheets.js — sincronizacao Google Sheets para Sinistros

async function sincronizarSheetsSinistros(sinState) {
  var btn = document.getElementById("btn-sin-sheets");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Enviando..."; }

  try {
    // Monta payload com uma linha por empresa+segmento
    var linhas = [];
    SIN_EMPRESAS.forEach(function(emp) {
      var dados = sinState.dados[emp.id];
      if (!dados) return;

      // Geral
      linhas.push(_sinBuildRow(sinState, emp.id, "geral", dados.geral || {}, true));

      // Segmentos
      emp.segmentos.forEach(function(seg) {
        if (dados[seg]) {
          linhas.push(_sinBuildRow(sinState, emp.id, seg, dados[seg], false));
        }
      });
    });

    var payload = {
      modulo:   "sinistros",
      periodo:  sinState.mes,
      ano:      String(sinState.ano),
      analista: sinState.analista,
      linhas:   linhas
    };

    var res = await fetch(APPS_SCRIPT_URL, {
      method:  "POST",
      body:    JSON.stringify(payload),
      headers: { "Content-Type": "text/plain" }
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    if (btn) {
      btn.textContent = "✅ Enviado!";
      setTimeout(function() { if (btn) { btn.disabled = false; btn.textContent = "📊 Sheets"; }}, 3000);
    }
  } catch (err) {
    console.error("Sheets Sinistros:", err);
    if (btn) {
      btn.textContent = "❌ Erro";
      setTimeout(function() { if (btn) { btn.disabled = false; btn.textContent = "📊 Sheets"; }}, 3000);
    }
  }
}

function _sinBuildRow(sinState, empId, seg, segData, isGeral) {
  var row = {
    empresa:    empId,
    segmento:   isGeral ? "Geral" : (SIN_SEG_LABEL[seg] || seg),
    sinistros:  segData.sinistros  || "",
    kmSinistro: segData.kmSinistro || "",
    meses:      {}
  };

  MESES.forEach(function(m) {
    var d = (segData.meses && segData.meses[m]) || {};
    row.meses[m] = {
      op:    d.operacao   || d.sinistros || "",
      manut: d.manutencao || "",
      km:    d.km         || "",
      meta:  d.meta       || ""
    };
  });

  // Gravidade (segmentos)
  if (!isGeral && segData.gravidade) {
    row.gravidade = segData.gravidade;
  }

  return row;
}
