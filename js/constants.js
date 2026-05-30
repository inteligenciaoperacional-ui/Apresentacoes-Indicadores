// ═══════════════════════════════════════════════════
// constants.js
// ═══════════════════════════════════════════════════

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
// Anos disponíveis: sempre mostra 2 anos antes e 1 depois do ano atual
const _cy   = new Date().getFullYear();
const ANOS  = [_cy - 2, _cy - 1, _cy, _cy + 1];
const REGS  = ["GRUPO", "RIO", "SUL", "SAO"];

// ── Logos Cloudinary ──────────────────────────────────
const LOGO_JCA    = "https://res.cloudinary.com/dln0ctawv/image/upload/v1779238658/JCA_1_mp1ic7.png";
const LOGO_IO     = "https://res.cloudinary.com/dln0ctawv/image/upload/v1779238606/Intelig%C3%AAncia_preto_2_y6idqg.png";
const LOGO_SHEETS = "https://res.cloudinary.com/dln0ctawv/image/upload/v1779587158/Lgo_sheets_krlipc.png";

// ── Integração Google Sheets ───────────────────────────
// Para alterar: edite apenas estas duas linhas
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbysezN-fBnaHVEdl1fwKPFV7Zegh0-dFIlyuqoU6Y9fM8dY7uakZ7xE4FyqZDaZr3zF/exec";
const SHEETS_URL      = "https://docs.google.com/spreadsheets/d/103IVWwbsQCa7JOilQsJDcDphOiMjT4ZpDtMgDSZjQSU/edit";

// Logos das regionais — aparecem no canto superior direito dos slides de cada regional
const LOGO_RIO = "https://res.cloudinary.com/dln0ctawv/image/upload/v1779238227/regionalRIO_zmz2ak.png";
const LOGO_SUL = "https://res.cloudinary.com/dln0ctawv/image/upload/v1779238268/regionalSUL_wviglw.png";
const LOGO_SAO = "https://res.cloudinary.com/dln0ctawv/image/upload/v1779238182/regionalSAO_pndoy8.png";

// ── Cores (apenas onde CSS não alcança, ex: Chart.js) ──
const COLORS = { navy: "#1d3061", red: "#c0392b", coral: "#f5c6c6" };

// Cores das barras por regional + cor da fonte dos valores dentro da barra
// Edite aqui para ajustar cor de cada regional
const BAR_COLORS = {
  GRUPO: { bar: "#f5c6c6", label: "#1d3061" },  // rosa coral  → texto navy
  RIO:   { bar: "#b0b0b0", label: "#1d3061" },  // cinza       → texto navy
  SUL:   { bar: "#03a5a5", label: "#ffffff"  },  // verde água  → texto branco
  SAO:   { bar: "#0104a7", label: "#ffffff"  },  // azul JCA    → texto branco
};

// ── Estado inicial: regional Identificados ────────────
function initReg() {
  return {
    excessos: "", condutores: "", km: "", cada1000: "",
    meta: "0,02", realizado: "",
    meses: Object.fromEntries(MESES.map(m => [m, { q: "", k1000: "" }])),
    planoAcao: "",
  };
}

// ── Estado inicial: Não Identificados GRUPO (gráfico mensal) ──
// Sem Meta/Realizado — o GRUPO NI não tem esses campos
function initNaoId() {
  return {
    excessos: "", condutores: "", km: "", cada1000: "",
    meses: Object.fromEntries(MESES.map(m => [m, { q: "", k1000: "" }])),
  };
}

// ── Estado inicial: Não Identificados Regional (top 5 setores) ──
// Usado para RIO, SUL e SAO — estrutura diferente do GRUPO
function initNaoIdRegional() {
  return {
    excessos: "", condutores: "", km: "", cada1000: "",
    meta: "", realizado: "",
    setores: Array.from({ length: 5 }, () => ({ nome: "", excessos: "", cada1000: "" })),
  };
}

// ── Slides da apresentação ────────────────────────────
function buildSlides() {
  return [
    { type: "cover"       },
    { type: "regional",   r: "GRUPO" },
    { type: "nao-id",     r: "GRUPO" },
    { type: "regional",   r: "RIO"   },
    { type: "nao-id",     r: "RIO"   },
    { type: "plano",      r: "RIO"   },
    { type: "regional",   r: "SUL"   },
    { type: "nao-id",     r: "SUL"   },
    { type: "plano",      r: "SUL"   },
    { type: "regional",   r: "SAO"   },
    { type: "nao-id",     r: "SAO"   },
    { type: "plano",      r: "SAO"   },
    { type: "contra-capa" },
  ];
}