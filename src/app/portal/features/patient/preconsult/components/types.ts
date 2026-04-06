export interface PreConsultData {
  motif: string | null;
  motifAutre: string;
  zones: string[];
  symptomes: string[];
  duree: string | null;
  intensite: number;
  notesSymptomes: string;
  dejaEuProbleme: boolean | null;
  dejaConsulte: boolean | null;
  traitements: string[];
  traitementAutre: string;
  allergies: boolean | null;
  allergiesDetail: string;
  medicaments: boolean | null;
  medicamentsDetail: string;
  grossesse: "oui" | "non" | "non_concerne" | null;
  peauSensible: boolean | null;
  typePeau: string | null;
  phototype: number | null;
  photos: { id: string; url: string; name: string }[];
  objectifs: string[];
  preferences: string[];
  notesObjectifs: string;
  consentDonnees: boolean;
  consentExactitude: boolean;
}

export const INITIAL_DATA: PreConsultData = {
  motif: null,
  motifAutre: "",
  zones: [],
  symptomes: [],
  duree: null,
  intensite: 2,
  notesSymptomes: "",
  dejaEuProbleme: null,
  dejaConsulte: null,
  traitements: [],
  traitementAutre: "",
  allergies: null,
  allergiesDetail: "",
  medicaments: null,
  medicamentsDetail: "",
  grossesse: null,
  peauSensible: null,
  typePeau: null,
  phototype: null,
  photos: [],
  objectifs: [],
  preferences: [],
  notesObjectifs: "",
  consentDonnees: false,
  consentExactitude: false,
};

export const MOTIFS = [
  { key: "acne", label: "Acné / boutons", icon: "acne" },
  { key: "taches", label: "Taches / hyperpigmentation", icon: "taches" },
  { key: "eczema", label: "Eczéma / démangeaisons", icon: "eczema" },
  { key: "rougeurs", label: "Rougeurs / rosacée", icon: "rougeurs" },
  { key: "cheveux", label: "Chute de cheveux / cuir chevelu", icon: "cheveux" },
  { key: "mycose", label: "Mycose / infection suspectée", icon: "mycose" },
  { key: "grain", label: "Grain de beauté / lésion", icon: "grain" },
  { key: "autre", label: "Autre", icon: "autre" },
];

export const ZONES = [
  "Visage",
  "Cuir chevelu",
  "Corps",
  "Mains",
  "Pieds",
  "Ongles",
  "Zones intimes",
];

export const SYMPTOMES = [
  "Démangeaisons",
  "Douleur",
  "Brûlure",
  "Saignement",
  "Suintement",
  "Sécheresse",
  "Gonflement",
  "Rougeur",
  "Desquamation",
];

export const DUREES = [
  { key: "1w", label: "< 1 semaine" },
  { key: "1-4w", label: "1–4 semaines" },
  { key: "1-6m", label: "1–6 mois" },
  { key: "6m+", label: "> 6 mois" },
];

export const TRAITEMENTS_CHIPS = [
  "Crème hydratante",
  "Corticoïdes",
  "Antibiotiques",
  "Antifongiques",
  "Produits naturels",
  "Compléments",
];

export const TYPES_PEAU = [
  { key: "seche", label: "Sèche" },
  { key: "mixte", label: "Mixte" },
  { key: "grasse", label: "Grasse" },
  { key: "normale", label: "Normale" },
  { key: "unknown", label: "Je ne sais pas" },
];

export const PHOTOTYPES = [
  { value: 1, label: "Très clair" },
  { value: 2, label: "Clair" },
  { value: 3, label: "Intermédiaire" },
  { value: 4, label: "Mat" },
  { value: 5, label: "Foncé" },
  { value: 6, label: "Très foncé" },
  { value: 0, label: "Je ne sais pas" },
];

export const OBJECTIFS = [
  "Soulager rapidement",
  "Comprendre la cause",
  "Routine skincare",
  "Obtenir une prescription",
  "Suivi de traitement",
  "Avis spécialisé",
];

export const PREFERENCES = [
  "Routine simple",
  "Budget limité",
  "Produits naturels",
  "Sans parfum",
  "Produits locaux",
  "Bio / vegan",
];

export const TOTAL_SUBSTEPS = 9; // 0=intro, 1-7=form, 8=recap