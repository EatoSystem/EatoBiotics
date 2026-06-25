import { type Locale, DEFAULT_LOCALE } from "./config"

/* ── Message catalogue ─────────────────────────────────────────────────────
   English is the source of truth. es / fr / de / ar are DRAFT machine
   translations seeded to prove the system end-to-end (incl. RTL via ar) —
   health/nutrition copy must be reviewed by a human translator before
   production use. Non-`en` waitlist surfaces show a visible draft notice.

   The `Dictionary` interface enforces that every locale defines every key, so
   a missing translation is a compile error rather than a runtime blank.
──────────────────────────────────────────────────────────────────────────── */

/** One quiz question's translatable copy (keyed by question id elsewhere). */
export interface WaitlistQuestion {
  text: string
  subtitle: string
  options: { label: string; description: string }[]
}

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
  loop: {
    /** params: {count} */
    streakDays: string
    startStreak: string
    streakWaiting: string
    statusDone: string
    statusKeepAlive: string
    statusBegin: string
    focusLabel: string
    /** params: {count} */
    best: string
  }
  pillarNudges: {
    prebiotics: string
    probiotics: string
    postbiotics: string
  }
  relationships: { self: string; child: string; partner: string; parent: string; sibling: string; other: string }
  ageBands: { child: string; teen: string; adult: string }
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
  /* ── Pre-launch waitlist / discovery surface ─────────────────────────────
     Drives the 60-second "Meet the Food System Inside You" quiz, the reveal,
     the skip-the-line panel, share UI and the country leaderboard. Quiz
     question/option text is looked up by id (`questions[id]`); engines and
     reactions by pillar. */
  waitlist: {
    /** params: {language} */
    draftNotice: string
    intro: {
      eyebrow: string
      titleLead: string
      titleHighlight: string
      titleTail: string
      body: string
      bioticsHeader: string
      cta: string
      meta: string
    }
    progress: {
      /** params: {index}, {label} */
      engineOf: string
      almostThere: string
      /** params: {index} */
      interstitialBadge: string
      begin: string
      continue: string
      back: string
      /** params: {step}, {total} */
      stepCount: string
    }
    engines: {
      prebiotics: { label: string; verb: string; fact: string }
      probiotics: { label: string; verb: string; fact: string }
      postbiotics: { label: string; verb: string; fact: string }
    }
    reactions: {
      prebiotics: string[]
      probiotics: string[]
      postbiotics: string[]
    }
    questions: {
      diversity: WaitlistQuestion
      fibre: WaitlistQuestion
      fermented: WaitlistQuestion
      rhythm: WaitlistQuestion
      recovery: WaitlistQuestion
    }
    /** params: {foods} */
    probioticsSubtitle: string
    context: {
      goalBadge: string
      challengeBadge: string
      goalTitle: string
      challengeTitle: string
      tailor: string
    }
    goals: { energy: string; digestion: string; weight: string; immunity: string; longevity: string; mood: string }
    challenges: { time: string; cravings: string; knowledge: string; consistency: string; variety: string; budget: string }
    diets: { omnivore: string; flexitarian: string; vegetarian: string; vegan: string; pescatarian: string; other: string }
    reveal: {
      eyebrow: string
      /** params: {pct} */
      percentile: string
      /** params: {label} */
      biggestOpp: string
    }
    form: {
      beFirstTitle: string
      beFirstBody: string
      joinCta: string
      firstName: string
      email: string
      age: string
      country: string
      diet: string
      joining: string
      consent: string
      genericError: string
    }
    done: {
      title: string
      body: string
      viewReport: string
    }
    status: {
      eyebrow: string
      /** params: {total}, {jump} */
      ofTotal: string
      unlockedTitle: string
      /** params: {code} */
      yourCode: string
      codeEmail: string
      /** params: {n} */
      inviteMore: string
      inviteGeneric: string
    }
    share: {
      heading: string
      share: string
      whatsapp: string
      post: string
      copyLink: string
      copied: string
      /** params: {profile}, {score} */
      text: string
      nativeTitle: string
    }
    leaderboard: {
      eyebrow: string
      blurb: string
      /** params: {name}, {rank} */
      you: string
    }
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
  loop: {
    streakDays: "{count}-day streak",
    startStreak: "Start your streak today",
    streakWaiting: "Your streak is waiting",
    statusDone: "Logged today — nicely done.",
    statusKeepAlive: "log a meal to keep your streak alive.",
    statusBegin: "log a meal to begin.",
    focusLabel: "Today's focus",
    best: "Best: {count}",
  },
  pillarNudges: {
    prebiotics: "Add a prebiotic food like garlic, onions, or oats to feed your good bacteria.",
    probiotics: "Try a fermented food like yoghurt, kimchi, or kombucha for live probiotics.",
    postbiotics: "Include a postbiotic-rich food like turmeric, dark chocolate, or green tea.",
  },
  relationships: { self: "Self", child: "Child", partner: "Partner", parent: "Parent", sibling: "Sibling", other: "Other" },
  ageBands: { child: "Child", teen: "Teen", adult: "Adult" },
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
  waitlist: {
    draftNotice: "Translation in progress — this page is shown in {language} as an automatic draft.",
    intro: {
      eyebrow: "EATOBIOTICS",
      titleLead: "Understand the Food System ",
      titleHighlight: "Inside You",
      titleTail: "",
      body: "Your health, digestion, energy, cravings, gut comfort, and daily food choices are connected. EatoBiotics helps you assess your internal food system and gives you a personalised score, report, and plan to improve it — supporting your overall health and wellbeing.",
      bioticsHeader: "3 Biotics",
      cta: "Understand My Food System",
      meta: "Join the Waitlist when complete.",
    },
    progress: {
      engineOf: "Engine {index} of 3 · {label}",
      almostThere: "Almost there",
      interstitialBadge: "Engine {index} of 3",
      begin: "Let's begin",
      continue: "Continue",
      back: "Back",
      stepCount: "{step}/{total}",
    },
    engines: {
      prebiotics: {
        label: "Prebiotics",
        verb: "Feed",
        fact: "The fibre in plants is the primary fuel for your gut bacteria — variety is the single biggest driver of a diverse, resilient microbiome.",
      },
      probiotics: {
        label: "Probiotics",
        verb: "Seed",
        fact: "Fermented foods deliver living bacteria straight to your gut — the most direct, practical way to reseed and diversify it.",
      },
      postbiotics: {
        label: "Postbiotics",
        verb: "Produce",
        fact: "~90% of your body's serotonin is made in your gut — postbiotics are how the food you eat becomes how you feel.",
      },
    },
    reactions: {
      prebiotics: [
        "Good to know — variety is the fastest lever you have here.",
        "A real base to build on.",
        "Nice — your bacteria are being well fed.",
        "Brilliant — that's a thriving inner garden.",
      ],
      probiotics: [
        "Easy win ahead — one daily fermented food shifts this fast.",
        "A start — a little more reseeding goes a long way.",
        "Great — you're regularly sending in reinforcements.",
        "Outstanding — living foods are a daily habit.",
      ],
      postbiotics: [
        "Your gut is asking for more rhythm and colour.",
        "Some signal there — small, steady tweaks compound.",
        "Good — your system is producing well.",
        "Excellent — your gut is clearly paying you back.",
      ],
    },
    questions: {
      diversity: {
        text: "Over a normal week, how alive is your plate?",
        subtitle: "Your gut bacteria thrive on the variety of plants you eat.",
        options: [
          { label: "Same few staples", description: "A small, familiar rotation" },
          { label: "Some variety", description: "A bit of range across the week" },
          { label: "A broad range", description: "Lots of different plants and colours" },
          { label: "Something new constantly", description: "I actively seek variety" },
        ],
      },
      fibre: {
        text: "How often does your gut get fed real fibre?",
        subtitle: "Plants, beans, whole grains, nuts, seeds — the fuel the whole system runs on.",
        options: [
          { label: "Rarely", description: "Mostly refined or processed food" },
          { label: "Some days", description: "A few times a week" },
          { label: "Most days", description: "A fibre-rich meal most days" },
          { label: "Nearly every meal", description: "It's the base of how I eat" },
        ],
      },
      fermented: {
        text: "How often do living foods reach your gut?",
        subtitle: "Yoghurt, kefir, kimchi, sauerkraut, miso — they seed new life into your microbiome.",
        options: [
          { label: "Almost never", description: "Not part of my routine" },
          { label: "Now and then", description: "Occasionally" },
          { label: "A few times a week", description: "A regular habit" },
          { label: "Most days", description: "Living foods feature daily" },
        ],
      },
      rhythm: {
        text: "What's your daily eating rhythm like?",
        subtitle: "Your system produces more when it runs on a steady tide.",
        options: [
          { label: "All over the place", description: "Meals happen whenever they happen" },
          { label: "Loose", description: "Roughly regular on good days" },
          { label: "Mostly steady", description: "Similar times most days" },
          { label: "Like clockwork", description: "A dependable daily rhythm" },
        ],
      },
      recovery: {
        text: "Lately, what is your gut telling you?",
        subtitle: "When it's thriving it pays you back — steady energy, easy digestion, good mood.",
        options: [
          { label: "It's struggling", description: "Bloated, sluggish, or off" },
          { label: "Mixed signals", description: "Some good days, some not" },
          { label: "Mostly good", description: "Comfortable and steady" },
          { label: "Thriving", description: "Light and energised" },
        ],
      },
    },
    probioticsSubtitle: "{foods} — they seed new life into your microbiome.",
    context: {
      goalBadge: "One more thing",
      challengeBadge: "Last one",
      goalTitle: "If your food system could fix one thing first…",
      challengeTitle: "What gets in the way most?",
      tailor: "We'll tailor your report around this.",
    },
    goals: { energy: "More energy", digestion: "Better digestion", weight: "Manage my weight", immunity: "Stronger immunity", longevity: "Long-term health", mood: "Mood & focus" },
    challenges: { time: "No time to cook", cravings: "Cravings & snacking", knowledge: "Not sure what to eat", consistency: "Staying consistent", variety: "Eating enough variety", budget: "Cost of healthy food" },
    diets: { omnivore: "Omnivore", flexitarian: "Flexitarian", vegetarian: "Vegetarian", vegan: "Vegan", pescatarian: "Pescatarian", other: "Other" },
    reveal: {
      eyebrow: "Meet your food system",
      percentile: "Higher than {pct}% of people with typical eating habits",
      biggestOpp: "Your biggest opportunity: {label}.",
    },
    form: {
      beFirstTitle: "Be first through the door",
      beFirstBody: "Join the waitlist for early access. You've got your snapshot — be first in line to unlock your full EatoBiotics report the moment we launch.",
      joinCta: "Join the waitlist",
      firstName: "First name",
      email: "you@email.com",
      age: "Age",
      country: "Country",
      diet: "Diet",
      joining: "Joining…",
      consent: "Free to join · Early access · No spam.",
      genericError: "Something went wrong. Please try again.",
    },
    done: {
      title: "You're on the list",
      body: "We've emailed your Food System Type and a snapshot of your three engines. Now climb the queue — invite friends to move up the line and unlock founding-member pricing.",
      viewReport: "View your mini report",
    },
    status: {
      eyebrow: "Your place in line",
      ofTotal: "of {total} — each friend who joins moves you up {jump} places.",
      unlockedTitle: "Founding-member reward unlocked 🎉",
      yourCode: "Your code: {code} — saved for launch.",
      codeEmail: "We'll email your founding-member code before launch.",
      inviteMore: "Invite {n} more to unlock founding-member pricing",
      inviteGeneric: "Invite friends to unlock founding-member pricing",
    },
    share: {
      heading: "Share your food system",
      share: "Share",
      whatsapp: "WhatsApp",
      post: "Post",
      copyLink: "Copy link",
      copied: "Copied",
      text: "I'm a {profile} ({score}/100) on EatoBiotics — what's your Food System Type? Discover yours in 60 seconds:",
      nativeTitle: "My Food System Type — EatoBiotics",
    },
    leaderboard: {
      eyebrow: "The global movement",
      blurb: "We open first where demand is highest — bring your country up the board.",
      you: "Your country, {name}, is #{rank} — invite friends to climb.",
    },
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
  loop: {
    streakDays: "Racha de {count} días",
    startStreak: "Empieza tu racha hoy",
    streakWaiting: "Tu racha te espera",
    statusDone: "Registrado hoy — ¡bien hecho!",
    statusKeepAlive: "registra una comida para mantener tu racha.",
    statusBegin: "registra una comida para empezar.",
    focusLabel: "Enfoque de hoy",
    best: "Mejor: {count}",
  },
  pillarNudges: {
    prebiotics: "Añade un alimento prebiótico como ajo, cebolla o avena para alimentar tus bacterias buenas.",
    probiotics: "Prueba un alimento fermentado como yogur, kimchi o kombucha para probióticos vivos.",
    postbiotics: "Incluye un alimento rico en posbióticos como cúrcuma, chocolate negro o té verde.",
  },
  relationships: { self: "Yo", child: "Hijo/a", partner: "Pareja", parent: "Padre/Madre", sibling: "Hermano/a", other: "Otro" },
  ageBands: { child: "Niño/a", teen: "Adolescente", adult: "Adulto/a" },
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
  waitlist: {
    draftNotice: "Traducción en curso — esta página se muestra en {language} como borrador automático.",
    intro: {
      eyebrow: "EATOBIOTICS",
      titleLead: "Comprende el sistema alimentario ",
      titleHighlight: "que llevas dentro",
      titleTail: "",
      body: "Tu salud, digestión, energía, antojos, bienestar intestinal y tus decisiones alimentarias diarias están conectados. EatoBiotics te ayuda a evaluar tu sistema alimentario interno y te ofrece una puntuación, un informe y un plan personalizados para mejorarlo, apoyando tu salud y bienestar generales.",
      bioticsHeader: "3 Biotics",
      cta: "Comprender mi sistema alimentario",
      meta: "Únete a la lista de espera al terminar.",
    },
    progress: {
      engineOf: "Motor {index} de 3 · {label}",
      almostThere: "Ya casi",
      interstitialBadge: "Motor {index} de 3",
      begin: "Empecemos",
      continue: "Continuar",
      back: "Atrás",
      stepCount: "{step}/{total}",
    },
    engines: {
      prebiotics: {
        label: "Prebióticos",
        verb: "Alimentar",
        fact: "La fibra de las plantas es el combustible principal de tus bacterias intestinales: la variedad es el mayor impulsor de un microbioma diverso y resiliente.",
      },
      probiotics: {
        label: "Probióticos",
        verb: "Sembrar",
        fact: "Los alimentos fermentados llevan bacterias vivas directamente a tu intestino: la forma más directa y práctica de repoblarlo y diversificarlo.",
      },
      postbiotics: {
        label: "Posbióticos",
        verb: "Producir",
        fact: "~90 % de la serotonina de tu cuerpo se produce en tu intestino: los posbióticos son cómo lo que comes se convierte en cómo te sientes.",
      },
    },
    reactions: {
      prebiotics: [
        "Bueno saberlo — la variedad es la palanca más rápida que tienes aquí.",
        "Una base real sobre la que construir.",
        "Bien — tus bacterias están bien alimentadas.",
        "Brillante — ese es un jardín interior próspero.",
      ],
      probiotics: [
        "Una victoria fácil por delante — un fermentado al día cambia esto rápido.",
        "Un comienzo — un poco más de repoblación ayuda mucho.",
        "Genial — envías refuerzos con regularidad.",
        "Excepcional — los alimentos vivos son un hábito diario.",
      ],
      postbiotics: [
        "Tu intestino pide más ritmo y más color.",
        "Hay alguna señal — los ajustes pequeños y constantes se acumulan.",
        "Bien — tu sistema está produciendo bien.",
        "Excelente — tu intestino claramente te lo devuelve.",
      ],
    },
    questions: {
      diversity: {
        text: "En una semana normal, ¿qué tan vivo está tu plato?",
        subtitle: "Tus bacterias intestinales prosperan con la variedad de plantas que comes.",
        options: [
          { label: "Los mismos básicos", description: "Una rotación pequeña y conocida" },
          { label: "Algo de variedad", description: "Algo de rango durante la semana" },
          { label: "Una amplia gama", description: "Muchas plantas y colores distintos" },
          { label: "Algo nuevo constantemente", description: "Busco la variedad activamente" },
        ],
      },
      fibre: {
        text: "¿Con qué frecuencia tu intestino recibe fibra de verdad?",
        subtitle: "Plantas, legumbres, cereales integrales, frutos secos, semillas — el combustible de todo el sistema.",
        options: [
          { label: "Rara vez", description: "Sobre todo comida refinada o procesada" },
          { label: "Algunos días", description: "Unas veces por semana" },
          { label: "Casi todos los días", description: "Una comida rica en fibra casi a diario" },
          { label: "Casi en cada comida", description: "Es la base de cómo como" },
        ],
      },
      fermented: {
        text: "¿Con qué frecuencia llegan alimentos vivos a tu intestino?",
        subtitle: "Yogur, kéfir, kimchi, chucrut, miso — siembran nueva vida en tu microbioma.",
        options: [
          { label: "Casi nunca", description: "No forma parte de mi rutina" },
          { label: "De vez en cuando", description: "Ocasionalmente" },
          { label: "Unas veces por semana", description: "Un hábito regular" },
          { label: "Casi todos los días", description: "Los alimentos vivos están a diario" },
        ],
      },
      rhythm: {
        text: "¿Cómo es tu ritmo diario de comidas?",
        subtitle: "Tu sistema produce más cuando funciona con una marea constante.",
        options: [
          { label: "Muy irregular", description: "Como cuando puedo" },
          { label: "Flexible", description: "Más o menos regular en los días buenos" },
          { label: "Bastante estable", description: "Horarios similares casi siempre" },
          { label: "Como un reloj", description: "Un ritmo diario fiable" },
        ],
      },
      recovery: {
        text: "Últimamente, ¿qué te dice tu intestino?",
        subtitle: "Cuando prospera te lo devuelve — energía estable, digestión fácil, buen ánimo.",
        options: [
          { label: "Está sufriendo", description: "Hinchado, pesado o raro" },
          { label: "Señales mixtas", description: "Días buenos y días malos" },
          { label: "Bastante bien", description: "Cómodo y estable" },
          { label: "Próspero", description: "Ligero y con energía" },
        ],
      },
    },
    probioticsSubtitle: "{foods} — siembran nueva vida en tu microbioma.",
    context: {
      goalBadge: "Una cosa más",
      challengeBadge: "La última",
      goalTitle: "Si tu sistema alimentario pudiera arreglar una cosa primero…",
      challengeTitle: "¿Qué se interpone más en el camino?",
      tailor: "Adaptaremos tu informe a esto.",
    },
    goals: { energy: "Más energía", digestion: "Mejor digestión", weight: "Controlar mi peso", immunity: "Más inmunidad", longevity: "Salud a largo plazo", mood: "Ánimo y concentración" },
    challenges: { time: "Sin tiempo para cocinar", cravings: "Antojos y picoteo", knowledge: "No sé qué comer", consistency: "Mantener la constancia", variety: "Comer suficiente variedad", budget: "El coste de comer sano" },
    diets: { omnivore: "Omnívora", flexitarian: "Flexitariana", vegetarian: "Vegetariana", vegan: "Vegana", pescatarian: "Pescetariana", other: "Otra" },
    reveal: {
      eyebrow: "Conoce tu sistema alimentario",
      percentile: "Por encima del {pct}% de las personas con hábitos alimentarios típicos",
      biggestOpp: "Tu mayor oportunidad: {label}.",
    },
    form: {
      beFirstTitle: "Sé el primero en entrar",
      beFirstBody: "Únete a la lista de espera para acceso anticipado. Ya tienes tu resumen — sé el primero en la fila para desbloquear tu informe completo de EatoBiotics en cuanto lancemos.",
      joinCta: "Unirme a la lista de espera",
      firstName: "Nombre",
      email: "tu@email.com",
      age: "Edad",
      country: "País",
      diet: "Dieta",
      joining: "Uniéndote…",
      consent: "Gratis · Acceso anticipado · Sin spam.",
      genericError: "Algo salió mal. Inténtalo de nuevo.",
    },
    done: {
      title: "Estás en la lista",
      body: "Te hemos enviado por correo tu Tipo de Sistema Alimentario y un resumen de tus tres motores. Ahora sube en la cola — invita a amigos para avanzar y desbloquear el precio de miembro fundador.",
      viewReport: "Ver tu miniinforme",
    },
    status: {
      eyebrow: "Tu lugar en la fila",
      ofTotal: "de {total} — cada amigo que se une te sube {jump} puestos.",
      unlockedTitle: "Recompensa de miembro fundador desbloqueada 🎉",
      yourCode: "Tu código: {code} — guardado para el lanzamiento.",
      codeEmail: "Te enviaremos tu código de miembro fundador antes del lanzamiento.",
      inviteMore: "Invita a {n} más para desbloquear el precio de miembro fundador",
      inviteGeneric: "Invita a amigos para desbloquear el precio de miembro fundador",
    },
    share: {
      heading: "Comparte tu sistema alimentario",
      share: "Compartir",
      whatsapp: "WhatsApp",
      post: "Publicar",
      copyLink: "Copiar enlace",
      copied: "Copiado",
      text: "Soy un {profile} ({score}/100) en EatoBiotics — ¿cuál es tu Tipo de Sistema Alimentario? Descúbrelo en 60 segundos:",
      nativeTitle: "Mi Tipo de Sistema Alimentario — EatoBiotics",
    },
    leaderboard: {
      eyebrow: "El movimiento global",
      blurb: "Abrimos primero donde hay más demanda — sube tu país en la tabla.",
      you: "Tu país, {name}, está en el puesto #{rank} — invita a amigos para subir.",
    },
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
  loop: {
    streakDays: "Série de {count} jours",
    startStreak: "Commencez votre série aujourd'hui",
    streakWaiting: "Votre série vous attend",
    statusDone: "Enregistré aujourd'hui — bravo !",
    statusKeepAlive: "enregistrez un repas pour maintenir votre série.",
    statusBegin: "enregistrez un repas pour commencer.",
    focusLabel: "Objectif du jour",
    best: "Record : {count}",
  },
  pillarNudges: {
    prebiotics: "Ajoutez un aliment prébiotique comme l'ail, l'oignon ou l'avoine pour nourrir vos bonnes bactéries.",
    probiotics: "Essayez un aliment fermenté comme le yaourt, le kimchi ou le kombucha pour des probiotiques vivants.",
    postbiotics: "Incluez un aliment riche en postbiotiques comme le curcuma, le chocolat noir ou le thé vert.",
  },
  relationships: { self: "Moi", child: "Enfant", partner: "Partenaire", parent: "Parent", sibling: "Frère/Sœur", other: "Autre" },
  ageBands: { child: "Enfant", teen: "Adolescent", adult: "Adulte" },
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
  waitlist: {
    draftNotice: "Traduction en cours — cette page est affichée en {language} sous forme de brouillon automatique.",
    intro: {
      eyebrow: "EATOBIOTICS",
      titleLead: "Comprenez le système alimentaire ",
      titleHighlight: "qui est en vous",
      titleTail: "",
      body: "Votre santé, votre digestion, votre énergie, vos envies, votre confort intestinal et vos choix alimentaires quotidiens sont liés. EatoBiotics vous aide à évaluer votre système alimentaire intérieur et vous donne un score, un rapport et un plan personnalisés pour l'améliorer — au service de votre santé et de votre bien-être globaux.",
      bioticsHeader: "3 Biotics",
      cta: "Comprendre mon système alimentaire",
      meta: "Rejoignez la liste d'attente une fois terminé.",
    },
    progress: {
      engineOf: "Moteur {index} sur 3 · {label}",
      almostThere: "Presque fini",
      interstitialBadge: "Moteur {index} sur 3",
      begin: "Commençons",
      continue: "Continuer",
      back: "Retour",
      stepCount: "{step}/{total}",
    },
    engines: {
      prebiotics: {
        label: "Prébiotiques",
        verb: "Nourrir",
        fact: "Les fibres des plantes sont le carburant principal de vos bactéries intestinales — la variété est le plus grand moteur d'un microbiome diversifié et résilient.",
      },
      probiotics: {
        label: "Probiotiques",
        verb: "Ensemencer",
        fact: "Les aliments fermentés apportent des bactéries vivantes directement à votre intestin — le moyen le plus direct et pratique de le réensemencer et de le diversifier.",
      },
      postbiotics: {
        label: "Postbiotiques",
        verb: "Produire",
        fact: "~90 % de la sérotonine de votre corps est produite dans votre intestin — les postbiotiques sont la façon dont ce que vous mangez devient ce que vous ressentez.",
      },
    },
    reactions: {
      prebiotics: [
        "Bon à savoir — la variété est le levier le plus rapide ici.",
        "Une vraie base sur laquelle construire.",
        "Bien — vos bactéries sont bien nourries.",
        "Excellent — c'est un jardin intérieur florissant.",
      ],
      probiotics: [
        "Une victoire facile en vue — un aliment fermenté par jour change vite la donne.",
        "Un début — un peu plus de réensemencement fait beaucoup.",
        "Super — vous envoyez des renforts régulièrement.",
        "Remarquable — les aliments vivants sont une habitude quotidienne.",
      ],
      postbiotics: [
        "Votre intestin réclame plus de rythme et de couleur.",
        "Un signal présent — les petits ajustements réguliers s'accumulent.",
        "Bien — votre système produit bien.",
        "Excellent — votre intestin vous le rend clairement.",
      ],
    },
    questions: {
      diversity: {
        text: "Sur une semaine normale, à quel point votre assiette est-elle vivante ?",
        subtitle: "Vos bactéries intestinales prospèrent grâce à la variété de plantes que vous mangez.",
        options: [
          { label: "Toujours les mêmes bases", description: "Une petite rotation familière" },
          { label: "Un peu de variété", description: "Un certain éventail sur la semaine" },
          { label: "Une large gamme", description: "Beaucoup de plantes et de couleurs différentes" },
          { label: "Quelque chose de nouveau sans cesse", description: "Je recherche activement la variété" },
        ],
      },
      fibre: {
        text: "À quelle fréquence votre intestin reçoit-il de vraies fibres ?",
        subtitle: "Plantes, légumineuses, céréales complètes, noix, graines — le carburant de tout le système.",
        options: [
          { label: "Rarement", description: "Surtout des aliments raffinés ou transformés" },
          { label: "Certains jours", description: "Quelques fois par semaine" },
          { label: "La plupart des jours", description: "Un repas riche en fibres presque chaque jour" },
          { label: "Presque à chaque repas", description: "C'est la base de mon alimentation" },
        ],
      },
      fermented: {
        text: "À quelle fréquence des aliments vivants atteignent-ils votre intestin ?",
        subtitle: "Yaourt, kéfir, kimchi, choucroute, miso — ils ensemencent une nouvelle vie dans votre microbiome.",
        options: [
          { label: "Presque jamais", description: "Pas dans mes habitudes" },
          { label: "De temps en temps", description: "Occasionnellement" },
          { label: "Quelques fois par semaine", description: "Une habitude régulière" },
          { label: "La plupart des jours", description: "Les aliments vivants sont quotidiens" },
        ],
      },
      rhythm: {
        text: "À quoi ressemble votre rythme alimentaire quotidien ?",
        subtitle: "Votre système produit davantage lorsqu'il suit une marée régulière.",
        options: [
          { label: "Très irrégulier", description: "Je mange quand je peux" },
          { label: "Souple", description: "À peu près régulier les bons jours" },
          { label: "Plutôt stable", description: "Des horaires similaires la plupart du temps" },
          { label: "Réglé comme une horloge", description: "Un rythme quotidien fiable" },
        ],
      },
      recovery: {
        text: "Dernièrement, que vous dit votre intestin ?",
        subtitle: "Quand il prospère, il vous le rend — énergie stable, digestion facile, bonne humeur.",
        options: [
          { label: "Il a du mal", description: "Ballonné, lourd ou déréglé" },
          { label: "Signaux mitigés", description: "Des bons jours et des moins bons" },
          { label: "Plutôt bien", description: "Confortable et stable" },
          { label: "Florissant", description: "Léger et plein d'énergie" },
        ],
      },
    },
    probioticsSubtitle: "{foods} — ils ensemencent une nouvelle vie dans votre microbiome.",
    context: {
      goalBadge: "Encore une chose",
      challengeBadge: "La dernière",
      goalTitle: "Si votre système alimentaire pouvait régler une chose en premier…",
      challengeTitle: "Qu'est-ce qui vous freine le plus ?",
      tailor: "Nous adapterons votre rapport en fonction de cela.",
    },
    goals: { energy: "Plus d'énergie", digestion: "Meilleure digestion", weight: "Gérer mon poids", immunity: "Immunité renforcée", longevity: "Santé à long terme", mood: "Humeur et concentration" },
    challenges: { time: "Pas le temps de cuisiner", cravings: "Envies et grignotage", knowledge: "Je ne sais pas quoi manger", consistency: "Rester régulier", variety: "Manger assez varié", budget: "Le coût du manger sain" },
    diets: { omnivore: "Omnivore", flexitarian: "Flexitarien", vegetarian: "Végétarien", vegan: "Végan", pescatarian: "Pescétarien", other: "Autre" },
    reveal: {
      eyebrow: "Découvrez votre système alimentaire",
      percentile: "Au-dessus de {pct} % des personnes ayant des habitudes alimentaires typiques",
      biggestOpp: "Votre plus grande opportunité : {label}.",
    },
    form: {
      beFirstTitle: "Soyez le premier à entrer",
      beFirstBody: "Rejoignez la liste d'attente pour un accès anticipé. Vous avez votre aperçu — soyez le premier en ligne pour débloquer votre rapport EatoBiotics complet dès le lancement.",
      joinCta: "Rejoindre la liste d'attente",
      firstName: "Prénom",
      email: "vous@email.com",
      age: "Âge",
      country: "Pays",
      diet: "Régime",
      joining: "Inscription…",
      consent: "Gratuit · Accès anticipé · Sans spam.",
      genericError: "Une erreur s'est produite. Veuillez réessayer.",
    },
    done: {
      title: "Vous êtes sur la liste",
      body: "Nous vous avons envoyé par e-mail votre Type de Système Alimentaire et un aperçu de vos trois moteurs. Montez maintenant dans la file — invitez des amis pour avancer et débloquer le tarif membre fondateur.",
      viewReport: "Voir votre mini-rapport",
    },
    status: {
      eyebrow: "Votre place dans la file",
      ofTotal: "sur {total} — chaque ami qui s'inscrit vous fait gagner {jump} places.",
      unlockedTitle: "Récompense membre fondateur débloquée 🎉",
      yourCode: "Votre code : {code} — gardé pour le lancement.",
      codeEmail: "Nous vous enverrons votre code membre fondateur avant le lancement.",
      inviteMore: "Invitez {n} de plus pour débloquer le tarif membre fondateur",
      inviteGeneric: "Invitez des amis pour débloquer le tarif membre fondateur",
    },
    share: {
      heading: "Partagez votre système alimentaire",
      share: "Partager",
      whatsapp: "WhatsApp",
      post: "Publier",
      copyLink: "Copier le lien",
      copied: "Copié",
      text: "Je suis un {profile} ({score}/100) sur EatoBiotics — quel est votre Type de Système Alimentaire ? Découvrez le vôtre en 60 secondes :",
      nativeTitle: "Mon Type de Système Alimentaire — EatoBiotics",
    },
    leaderboard: {
      eyebrow: "Le mouvement mondial",
      blurb: "Nous ouvrons d'abord là où la demande est la plus forte — faites monter votre pays.",
      you: "Votre pays, {name}, est #{rank} — invitez des amis pour grimper.",
    },
  },
}

// ⚠ DRAFT — machine translation, pending professional review.
const de: Dictionary = {
  common: {
    appName: "EatoBiotics",
    backToDashboard: "← Zurück zum Dashboard",
    logMeal: "Mahlzeit erfassen",
    logAnotherMeal: "Weitere Mahlzeit erfassen",
  },
  pillars: {
    prebiotics: "Präbiotika",
    probiotics: "Probiotika",
    postbiotics: "Postbiotika",
  },
  language: { label: "Sprache" },
  loop: {
    streakDays: "{count}-Tage-Serie",
    startStreak: "Starte heute deine Serie",
    streakWaiting: "Deine Serie wartet",
    statusDone: "Heute erfasst — gut gemacht.",
    statusKeepAlive: "erfasse eine Mahlzeit, um deine Serie zu halten.",
    statusBegin: "erfasse eine Mahlzeit, um zu beginnen.",
    focusLabel: "Fokus für heute",
    best: "Beste: {count}",
  },
  pillarNudges: {
    prebiotics: "Füge ein präbiotisches Lebensmittel wie Knoblauch, Zwiebeln oder Hafer hinzu, um deine guten Bakterien zu nähren.",
    probiotics: "Probiere ein fermentiertes Lebensmittel wie Joghurt, Kimchi oder Kombucha für lebende Probiotika.",
    postbiotics: "Iss ein postbiotikareiches Lebensmittel wie Kurkuma, dunkle Schokolade oder grünen Tee.",
  },
  relationships: { self: "Ich", child: "Kind", partner: "Partner/in", parent: "Elternteil", sibling: "Geschwister", other: "Andere" },
  ageBands: { child: "Kind", teen: "Teenager", adult: "Erwachsen" },
  family: {
    title: "Das Ernährungssystem deiner Familie",
    subtitle:
      "Verfolge die Darmgesundheit deines ganzen Haushalts gemeinsam. Du verwaltest die Mitglieder — keine separaten Logins nötig.",
    scoreLabel: "Familien-Score",
    scoreEmpty: "Füge Mitglieder und Werte hinzu, um den Haushaltsdurchschnitt zu sehen.",
    averageNote: "Durchschnitt über {contributors} von {total} Haushaltsmitgliedern.",
    you: "du",
    ownerSource: "Aus deiner letzten Mahlzeitenanalyse",
    householdMember: "Haushaltsmitglied",
    addTitle: "Haushaltsmitglied hinzufügen",
    namePlaceholder: "Name",
    relationshipPlaceholder: "Beziehung…",
    agePlaceholder: "Alter…",
    addButton: "Mitglied hinzufügen",
    addingButton: "Wird hinzugefügt…",
    remove: "Entfernen",
    nameRequired: "Bitte gib einen Namen ein.",
    draftNotice: "Die angezeigten Übersetzungen sind ein Entwurf und werden noch geprüft.",
  },
  waitlist: {
    draftNotice: "Übersetzung in Arbeit — diese Seite wird auf {language} als automatischer Entwurf angezeigt.",
    intro: {
      eyebrow: "EATOBIOTICS",
      titleLead: "Verstehe das Ernährungssystem ",
      titleHighlight: "in dir",
      titleTail: "",
      body: "Deine Gesundheit, Verdauung, Energie, Gelüste, dein Darmwohlbefinden und deine täglichen Essensentscheidungen hängen zusammen. EatoBiotics hilft dir, dein inneres Ernährungssystem einzuschätzen, und gibt dir einen personalisierten Score, einen Bericht und einen Plan, um es zu verbessern — für deine Gesundheit und dein Wohlbefinden insgesamt.",
      bioticsHeader: "3 Biotics",
      cta: "Mein Ernährungssystem verstehen",
      meta: "Tritt nach Abschluss der Warteliste bei.",
    },
    progress: {
      engineOf: "Motor {index} von 3 · {label}",
      almostThere: "Fast geschafft",
      interstitialBadge: "Motor {index} von 3",
      begin: "Los geht's",
      continue: "Weiter",
      back: "Zurück",
      stepCount: "{step}/{total}",
    },
    engines: {
      prebiotics: {
        label: "Präbiotika",
        verb: "Nähren",
        fact: "Die Ballaststoffe in Pflanzen sind der wichtigste Treibstoff für deine Darmbakterien — Vielfalt ist der größte Antrieb für ein vielfältiges, widerstandsfähiges Mikrobiom.",
      },
      probiotics: {
        label: "Probiotika",
        verb: "Aussäen",
        fact: "Fermentierte Lebensmittel bringen lebende Bakterien direkt in deinen Darm — der direkteste, praktischste Weg, ihn neu zu besiedeln und zu diversifizieren.",
      },
      postbiotics: {
        label: "Postbiotika",
        verb: "Produzieren",
        fact: "~90 % des Serotonins deines Körpers werden im Darm gebildet — Postbiotika sind der Weg, wie das, was du isst, zu dem wird, wie du dich fühlst.",
      },
    },
    reactions: {
      prebiotics: [
        "Gut zu wissen — Vielfalt ist hier dein schnellster Hebel.",
        "Eine echte Grundlage zum Aufbauen.",
        "Schön — deine Bakterien werden gut versorgt.",
        "Großartig — das ist ein blühender innerer Garten.",
      ],
      probiotics: [
        "Ein leichter Gewinn voraus — ein fermentiertes Lebensmittel täglich verändert das schnell.",
        "Ein Anfang — etwas mehr Neubesiedlung bewirkt viel.",
        "Klasse — du schickst regelmäßig Verstärkung.",
        "Hervorragend — lebendige Lebensmittel sind eine tägliche Gewohnheit.",
      ],
      postbiotics: [
        "Dein Darm wünscht sich mehr Rhythmus und Farbe.",
        "Es gibt ein Signal — kleine, stetige Anpassungen summieren sich.",
        "Gut — dein System produziert gut.",
        "Ausgezeichnet — dein Darm zahlt es dir spürbar zurück.",
      ],
    },
    questions: {
      diversity: {
        text: "Wie lebendig ist dein Teller in einer normalen Woche?",
        subtitle: "Deine Darmbakterien gedeihen durch die Vielfalt der Pflanzen, die du isst.",
        options: [
          { label: "Immer dieselben Grundnahrungsmittel", description: "Eine kleine, vertraute Auswahl" },
          { label: "Etwas Abwechslung", description: "Eine gewisse Bandbreite über die Woche" },
          { label: "Ein breites Spektrum", description: "Viele verschiedene Pflanzen und Farben" },
          { label: "Ständig etwas Neues", description: "Ich suche aktiv nach Abwechslung" },
        ],
      },
      fibre: {
        text: "Wie oft bekommt dein Darm echte Ballaststoffe?",
        subtitle: "Pflanzen, Hülsenfrüchte, Vollkorn, Nüsse, Samen — der Treibstoff des gesamten Systems.",
        options: [
          { label: "Selten", description: "Meist raffinierte oder verarbeitete Lebensmittel" },
          { label: "An manchen Tagen", description: "Ein paar Mal pro Woche" },
          { label: "An den meisten Tagen", description: "Fast täglich eine ballaststoffreiche Mahlzeit" },
          { label: "Fast bei jeder Mahlzeit", description: "Es ist die Basis meiner Ernährung" },
        ],
      },
      fermented: {
        text: "Wie oft erreichen lebendige Lebensmittel deinen Darm?",
        subtitle: "Joghurt, Kefir, Kimchi, Sauerkraut, Miso — sie säen neues Leben in dein Mikrobiom.",
        options: [
          { label: "Fast nie", description: "Gehört nicht zu meiner Routine" },
          { label: "Ab und zu", description: "Gelegentlich" },
          { label: "Ein paar Mal pro Woche", description: "Eine regelmäßige Gewohnheit" },
          { label: "An den meisten Tagen", description: "Lebendige Lebensmittel täglich" },
        ],
      },
      rhythm: {
        text: "Wie ist dein täglicher Essrhythmus?",
        subtitle: "Dein System produziert mehr, wenn es einem gleichmäßigen Takt folgt.",
        options: [
          { label: "Völlig unregelmäßig", description: "Mahlzeiten passieren, wann sie passieren" },
          { label: "Locker", description: "An guten Tagen einigermaßen regelmäßig" },
          { label: "Meist gleichmäßig", description: "Meistens ähnliche Zeiten" },
          { label: "Wie ein Uhrwerk", description: "Ein verlässlicher Tagesrhythmus" },
        ],
      },
      recovery: {
        text: "Was sagt dir dein Darm in letzter Zeit?",
        subtitle: "Wenn er gedeiht, zahlt er es dir zurück — stabile Energie, leichte Verdauung, gute Stimmung.",
        options: [
          { label: "Er hat zu kämpfen", description: "Aufgebläht, träge oder unrund" },
          { label: "Gemischte Signale", description: "Gute und weniger gute Tage" },
          { label: "Meist gut", description: "Angenehm und stabil" },
          { label: "Blühend", description: "Leicht und voller Energie" },
        ],
      },
    },
    probioticsSubtitle: "{foods} — sie säen neues Leben in dein Mikrobiom.",
    context: {
      goalBadge: "Noch eine Sache",
      challengeBadge: "Die letzte",
      goalTitle: "Wenn dein Ernährungssystem zuerst eine Sache lösen könnte…",
      challengeTitle: "Was steht dir am meisten im Weg?",
      tailor: "Wir richten deinen Bericht danach aus.",
    },
    goals: { energy: "Mehr Energie", digestion: "Bessere Verdauung", weight: "Mein Gewicht steuern", immunity: "Stärkere Immunität", longevity: "Langfristige Gesundheit", mood: "Stimmung & Fokus" },
    challenges: { time: "Keine Zeit zu kochen", cravings: "Heißhunger & Snacken", knowledge: "Unsicher, was ich essen soll", consistency: "Dranbleiben", variety: "Genug Vielfalt essen", budget: "Kosten gesunder Ernährung" },
    diets: { omnivore: "Allesesser", flexitarian: "Flexitarisch", vegetarian: "Vegetarisch", vegan: "Vegan", pescatarian: "Pescetarisch", other: "Andere" },
    reveal: {
      eyebrow: "Lerne dein Ernährungssystem kennen",
      percentile: "Höher als {pct}% der Menschen mit typischen Essgewohnheiten",
      biggestOpp: "Deine größte Chance: {label}.",
    },
    form: {
      beFirstTitle: "Sei als Erste·r dabei",
      beFirstBody: "Tritt der Warteliste für frühen Zugang bei. Du hast deinen Überblick — sei als Erste·r in der Reihe, um deinen vollständigen EatoBiotics-Bericht zum Start freizuschalten.",
      joinCta: "Der Warteliste beitreten",
      firstName: "Vorname",
      email: "du@email.com",
      age: "Alter",
      country: "Land",
      diet: "Ernährung",
      joining: "Wird beigetreten…",
      consent: "Kostenlos · Früher Zugang · Kein Spam.",
      genericError: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    },
    done: {
      title: "Du bist auf der Liste",
      body: "Wir haben dir deinen Ernährungssystem-Typ und einen Überblick über deine drei Motoren per E-Mail geschickt. Klettere jetzt in der Warteschlange nach oben — lade Freunde ein, um aufzusteigen und den Gründungsmitglied-Preis freizuschalten.",
      viewReport: "Deinen Mini-Bericht ansehen",
    },
    status: {
      eyebrow: "Dein Platz in der Reihe",
      ofTotal: "von {total} — jeder Freund, der beitritt, bringt dich {jump} Plätze nach vorne.",
      unlockedTitle: "Gründungsmitglied-Belohnung freigeschaltet 🎉",
      yourCode: "Dein Code: {code} — für den Start gespeichert.",
      codeEmail: "Wir senden dir deinen Gründungsmitglied-Code vor dem Start.",
      inviteMore: "Lade {n} weitere ein, um den Gründungsmitglied-Preis freizuschalten",
      inviteGeneric: "Lade Freunde ein, um den Gründungsmitglied-Preis freizuschalten",
    },
    share: {
      heading: "Teile dein Ernährungssystem",
      share: "Teilen",
      whatsapp: "WhatsApp",
      post: "Posten",
      copyLink: "Link kopieren",
      copied: "Kopiert",
      text: "Ich bin ein {profile} ({score}/100) bei EatoBiotics — was ist dein Ernährungssystem-Typ? Entdecke deinen in 60 Sekunden:",
      nativeTitle: "Mein Ernährungssystem-Typ — EatoBiotics",
    },
    leaderboard: {
      eyebrow: "Die globale Bewegung",
      blurb: "Wir starten zuerst dort, wo die Nachfrage am größten ist — bring dein Land nach oben.",
      you: "Dein Land, {name}, ist auf Platz #{rank} — lade Freunde ein, um aufzusteigen.",
    },
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
  loop: {
    streakDays: "سلسلة {count} يوم",
    startStreak: "ابدأ سلسلتك اليوم",
    streakWaiting: "سلسلتك في انتظارك",
    statusDone: "سُجّل اليوم — أحسنت.",
    statusKeepAlive: "سجّل وجبة للحفاظ على سلسلتك.",
    statusBegin: "سجّل وجبة لتبدأ.",
    focusLabel: "تركيز اليوم",
    best: "الأفضل: {count}",
  },
  pillarNudges: {
    prebiotics: "أضِف طعامًا بريبيوتيك مثل الثوم أو البصل أو الشوفان لتغذية بكتيريا أمعائك النافعة.",
    probiotics: "جرّب طعامًا مخمّرًا مثل الزبادي أو الكيمتشي أو الكمبوتشا للحصول على بروبيوتيك حي.",
    postbiotics: "أدرِج طعامًا غنيًا بالبوستبيوتيك مثل الكركم أو الشوكولاتة الداكنة أو الشاي الأخضر.",
  },
  relationships: { self: "أنا", child: "ابن/ابنة", partner: "شريك", parent: "أحد الوالدين", sibling: "أخ/أخت", other: "آخر" },
  ageBands: { child: "طفل", teen: "مراهق", adult: "بالغ" },
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
  waitlist: {
    draftNotice: "الترجمة قيد التنفيذ — تُعرض هذه الصفحة بـ{language} كمسودة تلقائية.",
    intro: {
      eyebrow: "EATOBIOTICS",
      titleLead: "افهم النظام الغذائي ",
      titleHighlight: "بداخلك",
      titleTail: "",
      body: "صحتك وهضمك وطاقتك والرغبة الشديدة في الطعام وراحة أمعائك وخياراتك الغذائية اليومية كلها مترابطة. يساعدك EatoBiotics على تقييم نظامك الغذائي الداخلي، ويمنحك درجة وتقريرًا وخطة مخصصة لتحسينه — لدعم صحتك وعافيتك بشكل عام.",
      bioticsHeader: "3 Biotics",
      cta: "افهم نظامي الغذائي",
      meta: "انضم إلى قائمة الانتظار عند الانتهاء.",
    },
    progress: {
      engineOf: "المحرك {index} من 3 · {label}",
      almostThere: "اقتربت",
      interstitialBadge: "المحرك {index} من 3",
      begin: "لنبدأ",
      continue: "متابعة",
      back: "رجوع",
      stepCount: "{step}/{total}",
    },
    engines: {
      prebiotics: {
        label: "بريبيوتيك",
        verb: "تغذية",
        fact: "الألياف في النباتات هي الوقود الأساسي لبكتيريا أمعائك — والتنوع هو أكبر محرك لميكروبيوم متنوع ومرن.",
      },
      probiotics: {
        label: "بروبيوتيك",
        verb: "بذر",
        fact: "توصِل الأطعمة المخمّرة بكتيريا حيّة مباشرة إلى أمعائك — وهي أسرع وأعمل طريقة لإعادة بذرها وتنويعها.",
      },
      postbiotics: {
        label: "بوستبيوتيك",
        verb: "إنتاج",
        fact: "نحو 90٪ من السيروتونين في جسمك يُصنع في أمعائك — البوستبيوتيك هو كيف يتحوّل ما تأكله إلى ما تشعر به.",
      },
    },
    reactions: {
      prebiotics: [
        "جيد أن تعرف — التنوع هو أسرع وسيلة لديك هنا.",
        "أساس حقيقي للبناء عليه.",
        "رائع — بكتيريا أمعائك تتغذى جيدًا.",
        "ممتاز — هذه حديقة داخلية مزدهرة.",
      ],
      probiotics: [
        "مكسب سهل قادم — طعام مخمّر واحد يوميًا يغيّر هذا بسرعة.",
        "بداية — قليل من إعادة البذر يحدث فرقًا كبيرًا.",
        "رائع — أنت ترسل التعزيزات بانتظام.",
        "متميّز — الأطعمة الحيّة عادة يومية.",
      ],
      postbiotics: [
        "أمعاؤك تطلب مزيدًا من الإيقاع والتنوع.",
        "هناك إشارة — التعديلات الصغيرة الثابتة تتراكم.",
        "جيد — نظامك ينتج بشكل جيد.",
        "ممتاز — أمعاؤك تكافئك بوضوح.",
      ],
    },
    questions: {
      diversity: {
        text: "خلال أسبوع عادي، ما مدى حيوية طبقك؟",
        subtitle: "تزدهر بكتيريا أمعائك بتنوع النباتات التي تأكلها.",
        options: [
          { label: "نفس الأساسيات القليلة", description: "تشكيلة صغيرة ومألوفة" },
          { label: "بعض التنوع", description: "قدر من التنوع عبر الأسبوع" },
          { label: "مجموعة واسعة", description: "الكثير من النباتات والألوان المختلفة" },
          { label: "شيء جديد باستمرار", description: "أبحث عن التنوع بنشاط" },
        ],
      },
      fibre: {
        text: "كم مرة تحصل أمعاؤك على ألياف حقيقية؟",
        subtitle: "النباتات والبقوليات والحبوب الكاملة والمكسرات والبذور — وقود النظام كله.",
        options: [
          { label: "نادرًا", description: "غالبًا طعام مكرّر أو معالَج" },
          { label: "بعض الأيام", description: "بضع مرات في الأسبوع" },
          { label: "معظم الأيام", description: "وجبة غنية بالألياف معظم الأيام" },
          { label: "في كل وجبة تقريبًا", description: "هي أساس طريقة أكلي" },
        ],
      },
      fermented: {
        text: "كم مرة تصل الأطعمة الحيّة إلى أمعائك؟",
        subtitle: "الزبادي والكفير والكيمتشي والملفوف المخمّر والميسو — تبذر حياة جديدة في ميكروبيومك.",
        options: [
          { label: "نادرًا جدًا", description: "ليست جزءًا من روتيني" },
          { label: "من حين لآخر", description: "أحيانًا" },
          { label: "بضع مرات في الأسبوع", description: "عادة منتظمة" },
          { label: "معظم الأيام", description: "الأطعمة الحيّة حاضرة يوميًا" },
        ],
      },
      rhythm: {
        text: "كيف هو إيقاع أكلك اليومي؟",
        subtitle: "ينتج نظامك أكثر عندما يسير على وتيرة ثابتة.",
        options: [
          { label: "غير منتظم تمامًا", description: "آكل متى ما أمكن" },
          { label: "مرن", description: "منتظم تقريبًا في الأيام الجيدة" },
          { label: "ثابت غالبًا", description: "أوقات متشابهة معظم الأيام" },
          { label: "كالساعة", description: "إيقاع يومي موثوق" },
        ],
      },
      recovery: {
        text: "مؤخرًا، ماذا تخبرك أمعاؤك؟",
        subtitle: "حين تزدهر تكافئك — طاقة ثابتة، وهضم سهل، ومزاج جيد.",
        options: [
          { label: "تعاني", description: "انتفاخ أو خمول أو اضطراب" },
          { label: "إشارات مختلطة", description: "أيام جيدة وأخرى لا" },
          { label: "جيدة غالبًا", description: "مريحة وثابتة" },
          { label: "مزدهرة", description: "خفيفة ومفعمة بالطاقة" },
        ],
      },
    },
    probioticsSubtitle: "{foods} — تبذر حياة جديدة في ميكروبيومك.",
    context: {
      goalBadge: "أمر أخير",
      challengeBadge: "الأخير",
      goalTitle: "لو كان بإمكان نظامك الغذائي إصلاح أمر واحد أولًا…",
      challengeTitle: "ما الذي يقف في طريقك أكثر؟",
      tailor: "سنخصّص تقريرك حول هذا.",
    },
    goals: { energy: "طاقة أكثر", digestion: "هضم أفضل", weight: "إدارة وزني", immunity: "مناعة أقوى", longevity: "صحة طويلة الأمد", mood: "المزاج والتركيز" },
    challenges: { time: "لا وقت للطبخ", cravings: "الاشتهاء والتسالي", knowledge: "لا أعرف ماذا آكل", consistency: "الاستمرار", variety: "تناول تنوع كافٍ", budget: "تكلفة الطعام الصحي" },
    diets: { omnivore: "أكل كل شيء", flexitarian: "مرن", vegetarian: "نباتي", vegan: "نباتي صرف", pescatarian: "نباتي مع السمك", other: "أخرى" },
    reveal: {
      eyebrow: "تعرّف على نظامك الغذائي",
      percentile: "أعلى من {pct}٪ من الأشخاص ذوي العادات الغذائية المعتادة",
      biggestOpp: "أكبر فرصة لديك: {label}.",
    },
    form: {
      beFirstTitle: "كن أول من يدخل",
      beFirstBody: "انضم إلى قائمة الانتظار للوصول المبكر. لديك لمحتك — كن أول من يفتح تقرير EatoBiotics الكامل لحظة إطلاقنا.",
      joinCta: "الانضمام إلى قائمة الانتظار",
      firstName: "الاسم الأول",
      email: "you@email.com",
      age: "العمر",
      country: "الدولة",
      diet: "النظام الغذائي",
      joining: "جارٍ الانضمام…",
      consent: "مجاني · وصول مبكر · بلا إزعاج.",
      genericError: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    },
    done: {
      title: "أنت على القائمة",
      body: "أرسلنا إليك عبر البريد نوع نظامك الغذائي ولمحة عن محركاتك الثلاثة. اصعد الآن في الطابور — ادعُ أصدقاءك للتقدّم وفتح سعر العضو المؤسس.",
      viewReport: "عرض تقريرك المصغّر",
    },
    status: {
      eyebrow: "مكانك في الطابور",
      ofTotal: "من {total} — كل صديق ينضم يرفعك {jump} مراكز.",
      unlockedTitle: "تم فتح مكافأة العضو المؤسس 🎉",
      yourCode: "رمزك: {code} — محفوظ للإطلاق.",
      codeEmail: "سنرسل إليك رمز العضو المؤسس قبل الإطلاق.",
      inviteMore: "ادعُ {n} آخرين لفتح سعر العضو المؤسس",
      inviteGeneric: "ادعُ أصدقاءك لفتح سعر العضو المؤسس",
    },
    share: {
      heading: "شارك نظامك الغذائي",
      share: "مشاركة",
      whatsapp: "واتساب",
      post: "نشر",
      copyLink: "نسخ الرابط",
      copied: "تم النسخ",
      text: "أنا {profile} ({score}/100) على EatoBiotics — ما نوع نظامك الغذائي؟ اكتشفه في 60 ثانية:",
      nativeTitle: "نوع نظامي الغذائي — EatoBiotics",
    },
    leaderboard: {
      eyebrow: "الحركة العالمية",
      blurb: "نفتح أولًا حيث يكون الطلب أعلى — ارفع دولتك في القائمة.",
      you: "دولتك، {name}، في المركز #{rank} — ادعُ أصدقاءك للصعود.",
    },
  },
}

const DICTIONARIES: Record<Locale, Dictionary> = { en, es, fr, de, ar }

/** Locales whose catalogues are human-reviewed (vs. draft machine translation). */
export const REVIEWED_LOCALES: readonly Locale[] = ["en"]

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
}
