// ═══════════════════════════════════════════════════
// utils.js — funções utilitárias
// ═══════════════════════════════════════════════════

/**
 * Converte string pt-BR ("1.234,56") para número.
 * Retorna 0 se inválido.
 */
function parseN(v) {
  return parseFloat((v || "0").replace(/\./g, "").replace(",", ".")) || 0;
}

/**
 * Formata número para exibição em pt-BR.
 * String vazia retorna "—" (campo não preenchido).
 */
function fmtBr(v) {
  const s = String(v ?? "");
  if (s === "") return "—";
  const n = parseN(s);
  // Se o número deu 0 mas a string não é "0", preserva o texto original
  // (útil enquanto o usuário digita "0,5" e ainda não terminou)
  return n === 0 && s !== "0" ? s : n.toLocaleString("pt-BR");
}

/**
 * Monta o array de dados para o Chart.js a partir do estado de um regional.
 */
function buildChartData(regData, mesesAtivos) {
  return mesesAtivos.map(m => ({
    name:     m,
    excessos: parseN(regData.meses[m]?.q),
    cada1000: parseN(regData.meses[m]?.k1000),
  }));
}

/**
 * Gera o próximo mês por extenso (usado no slide de Plano de Ação).
 */
function nextMes(mesIdx) {
  return MESES[(mesIdx + 1) % 12];
}

/**
 * Retorna a cor do Realizado comparado com a Meta:
 *   verde  (#27ae60)  se realizado <= meta  (dentro da meta)
 *   vermelho (#c0392b) se realizado >  meta  (acima da meta)
 *   null   se Realizado estiver vazio
 */
function realizadoColor(meta, realizado) {
  if (!realizado || realizado === "") return null;
  var m = parseN(meta || "0");
  var r = parseN(realizado);
  return r > m ? "#c0392b" : "#27ae60";
}