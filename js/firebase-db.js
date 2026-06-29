// firebase-db.js — persistência com Firebase Firestore
//
// Estrutura no Firestore:
//   coleção : "excessos_velocidade"
//   documento: "2026-Abr", "2026-Mai", etc.
//
// REGRAS NECESSÁRIAS NO FIREBASE CONSOLE → Firestore → Rules:
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /excessos_velocidade/{docId} {
//       allow read, write: if true;
//     }
//   }
// }

const _fbConfig = {
  apiKey:            "AIzaSyBoAgfudElHnMLPF9i9aplwc2sd9-zmT3E",
  authDomain:        "apresentacoes-indicadores.firebaseapp.com",
  projectId:         "apresentacoes-indicadores",
  storageBucket:     "apresentacoes-indicadores.firebasestorage.app",
  messagingSenderId: "508186104156",
  appId:             "1:508186104156:web:a52ab3848db24c7555b199"
};

firebase.initializeApp(_fbConfig);
const _db  = firebase.firestore();
const _COL = "excessos_velocidade";

// ── Helpers ────────────────────────────────────────────────────────────────
function _fbId(mes, ano) { return ano + "-" + mes; }  // ex: "2026-Abr"

// Remove undefined (Firestore não aceita)
function _clean(obj) {
  return JSON.parse(JSON.stringify(obj, function(k, v) {
    return v === undefined ? null : v;
  }));
}

// ── Salvar ─────────────────────────────────────────────────────────────────
async function salvarNoFirebase(state) {
  try {
    await _db.collection(_COL).doc(_fbId(state.mes, state.ano)).set(_clean({
      mes:      state.mes,
      ano:      state.ano,
      analista: state.analista,
      data:     state.data,
      naoId:    state.naoId,
      naoIdRIO: state.naoIdRIO,
      naoIdSUL: state.naoIdSUL,
      naoIdSAO: state.naoIdSAO,
      savedAt:  firebase.firestore.FieldValue.serverTimestamp()
    }));
    return true;
  } catch (err) {
    console.error("Firebase [save]:", err.message);
    return false;
  }
}

// ── Carregar um mês específico ─────────────────────────────────────────────
async function _fbCarregar(mes, ano) {
  try {
    var doc = await _db.collection(_COL).doc(_fbId(mes, ano)).get();
    return doc.exists ? doc.data() : null;
  } catch (err) {
    console.warn("Firebase [load]:", err.message);
    return null;
  }
}

// ── Lógica principal de carregamento ──────────────────────────────────────
// 1º tenta o próprio mês (retomada de rascunho)
// 2º tenta o mês anterior (base para mês novo)
// Retorna { dados, fonte, mesFonte } ou null
async function carregarDadosMes(mes, ano) {
  // Mês atual
  var atual = await _fbCarregar(mes, ano);
  if (atual) return { dados: atual, fonte: "atual" };

  // Mês anterior
  var idx      = MESES.indexOf(mes);
  var prevIdx  = (idx + 11) % 12;
  var prevAno  = idx === 0 ? ano - 1 : ano;
  var anterior = await _fbCarregar(MESES[prevIdx], prevAno);
  if (anterior) return { dados: anterior, fonte: "anterior", mesFonte: MESES[prevIdx] };

  return null;
}

// ══════════════════════════════════════════════════════
// SINISTROS — coleção separada no mesmo projeto Firebase
// ══════════════════════════════════════════════════════
const _SIN_COL = "sinistros";

async function salvarSinistrosNoFirebase(sinState) {
  try {
    await _db.collection(_SIN_COL).doc(_fbId(sinState.mes, sinState.ano)).set(_clean({
      mes:      sinState.mes,
      ano:      sinState.ano,
      analista: sinState.analista,
      dados:    sinState.dados,
      savedAt:  firebase.firestore.FieldValue.serverTimestamp()
    }));
    return true;
  } catch (err) {
    console.error("Firebase [sin save]:", err.message);
    return false;
  }
}

async function carregarDadosSinistros(mes, ano) {
  // 1º tenta o próprio mês (rascunho)
  try {
    var atual = await _db.collection(_SIN_COL).doc(_fbId(mes, ano)).get();
    if (atual.exists) return { dados: atual.data(), fonte: "atual" };
  } catch(e) { console.warn("Firebase [sin load atual]:", e.message); }

  // 2º tenta mês anterior como base
  var idx     = MESES.indexOf(mes);
  var prevIdx = (idx + 11) % 12;
  var prevAno = idx === 0 ? ano - 1 : ano;
  try {
    var ant = await _db.collection(_SIN_COL).doc(_fbId(MESES[prevIdx], prevAno)).get();
    if (ant.exists) return { dados: ant.data(), fonte: "anterior", mesFonte: MESES[prevIdx] };
  } catch(e) { console.warn("Firebase [sin load ant]:", e.message); }

  return null;
}