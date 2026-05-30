// sinistros-constants.js — configurações do módulo Sinistros

const SIN_EMPRESAS = [
  {
    id: "1001",
    label: "1001",
    logo: "https://res.cloudinary.com/dln0ctawv/image/upload/v1779671790/1001_qisjtr_1_pzpzqw.png",
    cor: "#9e9e9e",
    corLabel: "#1d3061",
    segmentos: ["rodo", "fret", "urb"],
  },
  {
    id: "catarinense",
    label: "Catarinense",
    logo: "https://res.cloudinary.com/dln0ctawv/image/upload/v1779671813/AVC_zk4pe9_k4jgau.png",
    cor: "#03a5a5",
    corLabel: "#ffffff",
    segmentos: ["rodo", "fret"],
  },
  {
    id: "cometa",
    label: "Cometa",
    logo: "https://res.cloudinary.com/dln0ctawv/image/upload/v1779671826/COM_folzln_ddghpr.png",
    cor: "#4a90d9",
    corLabel: "#ffffff",
    segmentos: ["rodo", "fret"],
  },
];

const SIN_SEG_LABEL = { rodo: "Rodoviario", fret: "Fretamento", urb: "Urbano" };

// ── Inicialização do estado ───────────────────────────
function sinInitGeral() {
  return {
    sinistros: "", kmSinistro: "",
    meses: Object.fromEntries(MESES.map(function(m) {
      return [m, { operacao: "", manutencao: "", km: "", meta: "" }];
    })),
  };
}

function sinInitSegmento() {
  return {
    sinistros: "", kmSinistro: "", meta: "",
    meses: Object.fromEntries(MESES.map(function(m) {
      return [m, { sinistros: "", km: "", meta: "" }];
    })),
    gravidade: { leve: "", medio: "", grave: "", gravissimo: "" },
    tipos: Array.from({ length: 5 }, function() { return { tipo: "", qtd: "" }; }),
  };
}

function sinInitFretUrb() {
  var seg = sinInitSegmento();
  seg.ofensoresMes = Array.from({ length: 10 }, function() { return { nome: "", qtd: "", km: "" }; });
  seg.top5Ano      = Array.from({ length:  5 }, function() { return { nome: "", qtd: "", km: "" }; });
  return seg;
}

function sinInitEmpresa(emp) {
  var d = {
    geral:    sinInitGeral(),
    rodo:     sinInitSegmento(),
    fret:     sinInitFretUrb(),
    planoAcao: { principalOfensor: "", quantidade: "", texto: "" },
  };
  if (emp.segmentos.indexOf("urb") !== -1) d.urb = sinInitFretUrb();
  return d;
}

// ── Sequência de slides ───────────────────────────────
function buildSinistrosSlides() {
  var slides = [{ type: "sin-cover" }];
  SIN_EMPRESAS.forEach(function(emp) {
    slides.push({ type: "sin-geral",     empresa: emp.id });
    slides.push({ type: "sin-segmento",  empresa: emp.id, seg: "rodo" });
    slides.push({ type: "sin-segmento",  empresa: emp.id, seg: "fret" });
    slides.push({ type: "sin-ofensores", empresa: emp.id, seg: "fret" });
    if (emp.segmentos.indexOf("urb") !== -1) {
      slides.push({ type: "sin-segmento",  empresa: emp.id, seg: "urb" });
      slides.push({ type: "sin-ofensores", empresa: emp.id, seg: "urb" });
    }
    slides.push({ type: "sin-plano", empresa: emp.id });
  });
  slides.push({ type: "contra-capa" });
  return slides;
}

function sinGetEmpresa(id) {
  return SIN_EMPRESAS.filter(function(e) { return e.id === id; })[0] || SIN_EMPRESAS[0];
}