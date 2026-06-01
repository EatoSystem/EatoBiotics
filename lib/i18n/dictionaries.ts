import { type Locale, DEFAULT_LOCALE } from "./config"

/* ── Message catalogue ─────────────────────────────────────────────────────
   English is the source of truth. es / fr / ar are DRAFT machine translations
   seeded to prove the system end-to-end (incl. RTL via ar) — health/nutrition
   copy must be reviewed by a human translator before production use.

   The `Dictionary` interface enforces that every locale defines every key, so
   a missing translation is a compile error rather than a runtime blank.
──────────────────────────────────────────────────────────────────────────── */

export interface Dictionary {
  common: {
    appName: string
    backToDashboard: string
    logMeal: string
    logAnotherMeal: string
  }
  pillars: {
    prebiotics: string
    probiotics: string
    postbiotics: string
  }
  language: {
    label: string
  }
  family: {
    title: string
    subtitle: string
    scoreLabel: string
    scoreEmpty: string
    /** params: {contributors}, {total} */
    averageNote: string
    you: string
    ownerSource: string
    householdMember: string
    addTitle: string
    namePlaceholder: string
    relationshipPlaceholder: string
    agePlaceholder: string
    addButton: string
    addingButton: string
    remove: string
    nameRequired: string
    draftNotice: string
  }
}

const en: Dictionary = {
  common: {
    appName: "EatoBiotics",
    backToDashboard: "← Back to dashboard",
    logMeal: "Log a meal",
    logAnotherMeal: "Log another meal",
  },
  pillars: {
    prebiotics: "Prebiotics",
    probiotics: "Probiotics",
    postbiotics: "Postbiotics",
  },
  language: { label: "Language" },
  family: {
    title: "Your family food system",
    subtitle:
      "Track your whole household's gut health together. Members are managed by you — no separate logins needed.",
    scoreLabel: "Family score",
    scoreEmpty: "Add members and scores to see your household average.",
    averageNote: "Average across {contributors} of {total} household members.",
    you: "you",
    ownerSource: "From your most recent meal analysis",
    householdMember: "Household member",
    addTitle: "Add a household member",
    namePlaceholder: "Name",
    relationshipPlaceholder: "Relationship…",
    agePlaceholder: "Age…",
    addButton: "Add member",
    addingButton: "Adding…",
    remove: "Remove",
    nameRequired: "Please enter a name.",
    draftNotice: "Translations shown are draft and pending review.",
  },
}

// ⚠ DRAFT — machine translation, pending professional review.
const es: Dictionary = {
  common: {
    appName: "EatoBiotics",
    backToDashboard: "← Volver al panel",
    logMeal: "Registrar una comida",
    logAnotherMeal: "Registrar otra comida",
  },
  pillars: {
    prebiotics: "Prebióticos",
    probiotics: "Probióticos",
    postbiotics: "Posbióticos",
  },
  language: { label: "Idioma" },
  family: {
    title: "El sistema alimentario de tu familia",
    subtitle:
      "Sigue la salud intestinal de todo tu hogar. Tú gestionas a los miembros: no necesitan inicios de sesión separados.",
    scoreLabel: "Puntuación familiar",
    scoreEmpty: "Añade miembros y puntuaciones para ver la media de tu hogar.",
    averageNote: "Media de {contributors} de {total} miembros del hogar.",
    you: "tú",
    ownerSource: "De tu análisis de comida más reciente",
    householdMember: "Miembro del hogar",
    addTitle: "Añadir un miembro del hogar",
    namePlaceholder: "Nombre",
    relationshipPlaceholder: "Relación…",
    agePlaceholder: "Edad…",
    addButton: "Añadir miembro",
    addingButton: "Añadiendo…",
    remove: "Eliminar",
    nameRequired: "Introduce un nombre.",
    draftNotice: "Las traducciones mostradas son un borrador pendiente de revisión.",
  },
}

// ⚠ DRAFT — machine translation, pending professional review.
const fr: Dictionary = {
  common: {
    appName: "EatoBiotics",
    backToDashboard: "← Retour au tableau de bord",
    logMeal: "Enregistrer un repas",
    logAnotherMeal: "Enregistrer un autre repas",
  },
  pillars: {
    prebiotics: "Prébiotiques",
    probiotics: "Probiotiques",
    postbiotics: "Postbiotiques",
  },
  language: { label: "Langue" },
  family: {
    title: "Le système alimentaire de votre famille",
    subtitle:
      "Suivez la santé intestinale de tout votre foyer. Vous gérez les membres — aucune connexion séparée nécessaire.",
    scoreLabel: "Score familial",
    scoreEmpty: "Ajoutez des membres et des scores pour voir la moyenne de votre foyer.",
    averageNote: "Moyenne sur {contributors} des {total} membres du foyer.",
    you: "vous",
    ownerSource: "D'après votre analyse de repas la plus récente",
    householdMember: "Membre du foyer",
    addTitle: "Ajouter un membre du foyer",
    namePlaceholder: "Nom",
    relationshipPlaceholder: "Relation…",
    agePlaceholder: "Âge…",
    addButton: "Ajouter un membre",
    addingButton: "Ajout…",
    remove: "Retirer",
    nameRequired: "Veuillez saisir un nom.",
    draftNotice: "Les traductions affichées sont provisoires et en attente de révision.",
  },
}

// ⚠ DRAFT — machine translation, pending professional review. Renders right-to-left.
const ar: Dictionary = {
  common: {
    appName: "EatoBiotics",
    backToDashboard: "← العودة إلى لوحة التحكم",
    logMeal: "سجّل وجبة",
    logAnotherMeal: "سجّل وجبة أخرى",
  },
  pillars: {
    prebiotics: "بريبيوتيك",
    probiotics: "بروبيوتيك",
    postbiotics: "بوستبيوتيك",
  },
  language: { label: "اللغة" },
  family: {
    title: "النظام الغذائي لعائلتك",
    subtitle: "تابِع صحة أمعاء جميع أفراد منزلك معًا. أنت من يدير الأفراد — لا حاجة لحسابات منفصلة.",
    scoreLabel: "نتيجة العائلة",
    scoreEmpty: "أضِف أفرادًا ونتائج لرؤية متوسط منزلك.",
    averageNote: "المتوسط عبر {contributors} من {total} من أفراد المنزل.",
    you: "أنت",
    ownerSource: "من أحدث تحليل لوجبتك",
    householdMember: "فرد من المنزل",
    addTitle: "إضافة فرد إلى المنزل",
    namePlaceholder: "الاسم",
    relationshipPlaceholder: "صلة القرابة…",
    agePlaceholder: "الفئة العمرية…",
    addButton: "إضافة فرد",
    addingButton: "جارٍ الإضافة…",
    remove: "إزالة",
    nameRequired: "يرجى إدخال اسم.",
    draftNotice: "الترجمات المعروضة مسودة وقيد المراجعة.",
  },
}

const DICTIONARIES: Record<Locale, Dictionary> = { en, es, fr, ar }

/** Locales whose catalogues are human-reviewed (vs. draft machine translation). */
export const REVIEWED_LOCALES: readonly Locale[] = ["en"]

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
}
