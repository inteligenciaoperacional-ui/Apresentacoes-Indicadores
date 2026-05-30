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