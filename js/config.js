/* ================================================================
   CONFIG.JS — PlanStart.ma Configuration
   Secteurs précis adaptés au marché marocain
   ================================================================ */

const CONFIG = {

  // ── OpenRouter API ─────────────────────────────────────────────
  API_ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
  API_KEY:      'sk-or-v1-' + '58ece8075d21f96ca433d2ce72b497a6c493336a47059e172d3785dce08188fd',
  APP_NAME:     'PlanStart.ma',
  APP_URL:      'https://planstart.ma',
  SITE_TITLE:   'PlanStart.ma',

  // ── Modèle fixe ────────────────────────────────────────────────
  DEFAULT_MODEL: 'anthropic/claude-3.5-haiku',
  MAX_TOKENS:    8000,
  TEMPERATURE:   1,

  // ── Statuts juridiques marocains ───────────────────────────────
  LEGAL_FORMS: [
    { value: 'sarl',   label: 'SARL — Société à Responsabilité Limitée' },
    { value: 'sa',     label: 'SA — Société Anonyme' },
    { value: 'sas',    label: 'SAS — Société par Actions Simplifiée' },
    { value: 'snc',    label: 'SNC — Société en Nom Collectif' },
    { value: 'auto',   label: 'Auto-entrepreneur' },
    { value: 'liberal',label: 'Profession libérale' },
    { value: 'assoc',  label: 'Association / Coopérative' },
    { value: 'autre',  label: 'Non encore défini' }
  ],

  // ── Titres professionnels ───────────────────────────────────────
  TITLES: [
    { value: 'dr',   label: 'Dr. — Docteur en médecine' },
    { value: 'dr-d', label: 'Dr. — Docteur en chirurgie dentaire' },
    { value: 'pr',   label: 'Pr. — Professeur' },
    { value: 'me',   label: 'Me. — Maître (Avocat / Notaire)' },
    { value: 'ing',  label: 'Ing. — Ingénieur' },
    { value: 'arch', label: 'Arch. — Architecte' },
    { value: 'pharm',label: 'Pharm. — Pharmacien' },
    { value: 'ec',   label: 'EC — Expert-Comptable' },
    { value: 'm',    label: 'M. — Monsieur' },
    { value: 'mme',  label: 'Mme. — Madame' },
    { value: 'autre',label: 'Autre titre' }
  ],

  // ── Secteurs précis au Maroc (par catégorie avec optgroups) ────
  // Structure: { category, icon, activities: [{value, label, keywords}] }
  SECTORS: [
    {
      category: 'Santé & Médical',
      icon: '🏥',
      activities: [
        { value: 'cabinet-dentaire',         label: 'Cabinet dentaire (omnipraticien)' },
        { value: 'orthodontie',              label: 'Cabinet d\'orthodontie' },
        { value: 'cabinet-medical-general',  label: 'Cabinet médical généraliste' },
        { value: 'cabinet-specialiste',      label: 'Cabinet de spécialité médicale' },
        { value: 'cabinet-kinesitherapie',   label: 'Cabinet de kinésithérapie' },
        { value: 'cabinet-psychologie',      label: 'Cabinet de psychologie / psychiatrie' },
        { value: 'cabinet-nutrition',        label: 'Cabinet de diététique / nutrition' },
        { value: 'pharmacie',                label: 'Pharmacie' },
        { value: 'parapharmacie',            label: 'Parapharmacie' },
        { value: 'laboratoire-analyses',     label: 'Laboratoire d\'analyses médicales' },
        { value: 'clinique-privee',          label: 'Clinique privée / Polyclinique' },
        { value: 'centre-dialyse',           label: 'Centre de dialyse / soins spécialisés' },
        { value: 'optique-medicale',         label: 'Opticien / Optique médicale' },
        { value: 'maison-repos',             label: 'Maison de repos / Établissement de soins' },
        { value: 'ambulance',                label: 'Service ambulance privé' }
      ]
    },
    {
      category: 'Conseil & Services Professionnels',
      icon: '💼',
      activities: [
        { value: 'cabinet-conseil-strategie',   label: 'Cabinet de conseil stratégique' },
        { value: 'cabinet-conseil-management',  label: 'Cabinet de conseil en management' },
        { value: 'cabinet-conseil-rh',          label: 'Cabinet de conseil RH & recrutement' },
        { value: 'cabinet-comptable',           label: 'Cabinet comptable / Expert-comptable' },
        { value: 'cabinet-audit',               label: 'Cabinet d\'audit & commissariat aux comptes' },
        { value: 'cabinet-juridique',           label: 'Cabinet d\'avocats / Conseil juridique' },
        { value: 'etude-notariale',             label: 'Étude notariale' },
        { value: 'cabinet-architecture',        label: 'Cabinet d\'architecture & urbanisme' },
        { value: 'bureau-etudes-techniques',    label: 'Bureau d\'études techniques (BET)' },
        { value: 'agence-communication',        label: 'Agence de communication & publicité' },
        { value: 'agence-marketing-digital',    label: 'Agence de marketing digital & SEO' },
        { value: 'cabinet-formation',           label: 'Cabinet de formation professionnelle' },
        { value: 'cabinet-coaching',            label: 'Cabinet de coaching & développement personnel' },
        { value: 'bureau-traduction',           label: 'Bureau de traduction & interprétariat' },
        { value: 'agence-evenementielle',       label: 'Agence événementielle & wedding planning' }
      ]
    },
    {
      category: 'Technologie & Digital',
      icon: '💻',
      activities: [
        { value: 'startup-saas',              label: 'Startup SaaS (logiciel par abonnement)' },
        { value: 'agence-web',                label: 'Agence web & développement logiciel' },
        { value: 'ecommerce',                 label: 'E-commerce / Marketplace' },
        { value: 'app-mobile',                label: 'Application mobile' },
        { value: 'cybersecurite',             label: 'Cybersécurité & sécurité informatique' },
        { value: 'ia-data',                   label: 'Intelligence artificielle & Data science' },
        { value: 'fintech',                   label: 'Fintech & paiements digitaux' },
        { value: 'edtech',                    label: 'EdTech (technologie éducative)' },
        { value: 'healthtech',                label: 'HealthTech & télémédecine' },
        { value: 'proptech',                  label: 'PropTech (immobilier digital)' },
        { value: 'agritech',                  label: 'AgriTech (agriculture digitale)' },
        { value: 'iot',                       label: 'IoT & objets connectés' }
      ]
    },
    {
      category: 'Commerce & Distribution',
      icon: '🛍️',
      activities: [
        { value: 'epicerie-fine',             label: 'Épicerie fine / Commerce alimentaire' },
        { value: 'superette',                 label: 'Supérette / Minimarché' },
        { value: 'boutique-mode',             label: 'Boutique de mode & vêtements' },
        { value: 'bijouterie',                label: 'Bijouterie & joaillerie' },
        { value: 'parfumerie',                label: 'Parfumerie & cosmétiques' },
        { value: 'materiau-construction',     label: 'Commerce matériaux de construction' },
        { value: 'quincaillerie',             label: 'Quincaillerie & outillage' },
        { value: 'electromenager',            label: 'Électroménager & high-tech' },
        { value: 'librairie-papeterie',       label: 'Librairie / Papeterie' },
        { value: 'import-export',             label: 'Import / Export' },
        { value: 'distribution-grossiste',   label: 'Distribution en gros' },
        { value: 'franchise',                 label: 'Franchise (repreneur)' }
      ]
    },
    {
      category: 'Restauration & Food',
      icon: '🍽️',
      activities: [
        { value: 'restaurant-traditionnel',   label: 'Restaurant traditionnel marocain' },
        { value: 'restaurant-gastronomique',  label: 'Restaurant gastronomique' },
        { value: 'fast-food',                 label: 'Fast-food / Restauration rapide' },
        { value: 'cafe-salon-the',            label: 'Café / Salon de thé' },
        { value: 'patisserie-boulangerie',    label: 'Pâtisserie / Boulangerie' },
        { value: 'traiteur',                  label: 'Traiteur & service traiteur' },
        { value: 'dark-kitchen',              label: 'Dark kitchen / Cuisine virtuelle' },
        { value: 'chocolaterie',              label: 'Chocolaterie / Confiserie artisanale' },
        { value: 'jus-smoothies',             label: 'Bar à jus & smoothies' },
        { value: 'food-truck',                label: 'Food truck' }
      ]
    },
    {
      category: 'Éducation & Formation',
      icon: '📚',
      activities: [
        { value: 'ecole-privee',              label: 'École privée (primaire/collège/lycée)' },
        { value: 'ecole-maternelle',          label: 'École maternelle / Crèche / Garderie' },
        { value: 'centre-formation-pro',      label: 'Centre de formation professionnelle' },
        { value: 'soutien-scolaire',          label: 'Centre de soutien scolaire & cours particuliers' },
        { value: 'auto-ecole',                label: 'Auto-école' },
        { value: 'ecole-langues',             label: 'École de langues (arabe, français, anglais...)' },
        { value: 'ecole-musique-arts',        label: 'École de musique / arts / danse' },
        { value: 'centre-formation-digital',  label: 'Centre de formation digitale & coding' },
        { value: 'prepa-concours',            label: 'Prépa concours (ENCG, Médecine, etc.)' }
      ]
    },
    {
      category: 'Immobilier & Construction',
      icon: '🏠',
      activities: [
        { value: 'agence-immobiliere',        label: 'Agence immobilière' },
        { value: 'promoteur-immobilier',      label: 'Promotion immobilière' },
        { value: 'btp-construction',          label: 'BTP & construction générale' },
        { value: 'renovation-decoration',     label: 'Rénovation intérieure & décoration' },
        { value: 'amenagement-espaces',       label: 'Aménagement commercial & tertiaire' },
        { value: 'expertise-immobiliere',     label: 'Expertise immobilière & estimation' },
        { value: 'syndic-copropriete',        label: 'Syndic de copropriété' },
        { value: 'location-saisonniere',      label: 'Location saisonnière / Airbnb management' }
      ]
    },
    {
      category: 'Industrie & Artisanat',
      icon: '🎨',
      activities: [
        { value: 'artisanat-traditional',     label: 'Artisanat traditionnel (poterie, zellige, cuir...)' },
        { value: 'confection-textile',        label: 'Confection textile & prêt-à-porter' },
        { value: 'agroalimentaire',           label: 'Industrie agroalimentaire & transformation' },
        { value: 'imprimerie',                label: 'Imprimerie & packaging' },
        { value: 'menuiserie-bois',           label: 'Menuiserie bois & aluminium' },
        { value: 'plasturgie',                label: 'Plasturgie & transformation matières' },
        { value: 'fabrication-cosmetiques',   label: 'Fabrication cosmétiques & bien-être' },
        { value: 'production-agricole',       label: 'Production agricole (maraîchage, arboriculture...)' },
        { value: 'elevage',                   label: 'Élevage (aviculture, apiculture, bovin...)' }
      ]
    },
    {
      category: 'Tourisme & Hôtellerie',
      icon: '🏨',
      activities: [
        { value: 'hotel',                     label: 'Hôtel' },
        { value: 'riad-maison-hotes',         label: 'Riad / Maison d\'hôtes' },
        { value: 'agence-voyages',            label: 'Agence de voyages & tourisme' },
        { value: 'guide-tourisme',            label: 'Guide touristique & excursions' },
        { value: 'camping-glamping',          label: 'Camping / Glamping / Éco-lodge' },
        { value: 'spa-hammam',                label: 'Spa / Hammam / Centre bien-être' },
        { value: 'transport-touristique',     label: 'Transport touristique (minibus, 4x4...)' },
        { value: 'animation-touristique',     label: 'Animation & activités touristiques' }
      ]
    },
    {
      category: 'Transport & Logistique',
      icon: '🚚',
      activities: [
        { value: 'transport-marchandises',    label: 'Transport de marchandises routier' },
        { value: 'messagerie-livraison',      label: 'Messagerie & livraison last-mile' },
        { value: 'taxi-vtc',                  label: 'Taxi / VTC / Transport de personnes' },
        { value: 'logistique-entreposage',    label: 'Logistique & entreposage' },
        { value: 'transitaire-douane',        label: 'Transitaire & dédouanement' },
        { value: 'demenagement',              label: 'Déménagement & transfert' }
      ]
    },
    {
      category: 'Énergie & Environnement',
      icon: '♻️',
      activities: [
        { value: 'energie-solaire',           label: 'Énergie solaire (installation & vente)' },
        { value: 'efficacite-energetique',    label: 'Efficacité énergétique & audit' },
        { value: 'gestion-dechets',           label: 'Gestion des déchets & recyclage' },
        { value: 'eau-assainissement',        label: 'Eau & assainissement' },
        { value: 'agriculture-bio',           label: 'Agriculture biologique & produits bio' }
      ]
    },
    {
      category: 'Finance & Assurance',
      icon: '💳',
      activities: [
        { value: 'courtage-assurance',        label: 'Courtage en assurance' },
        { value: 'courtage-credit',           label: 'Courtage en crédit / Financement' },
        { value: 'microfinance',              label: 'Microfinance & inclusion financière' },
        { value: 'gestion-patrimoine',        label: 'Gestion de patrimoine & investissement' },
        { value: 'bureau-change',             label: 'Bureau de change' }
      ]
    },
    {
      category: 'Bien-être & Services à la Personne',
      icon: '✨',
      activities: [
        { value: 'salon-coiffure',            label: 'Salon de coiffure' },
        { value: 'institut-beaute',           label: 'Institut de beauté & soins esthétiques' },
        { value: 'salle-sport',               label: 'Salle de sport / Fitness center' },
        { value: 'yoga-pilates',              label: 'Studio yoga / Pilates / Méditation' },
        { value: 'aide-domicile',             label: 'Services à domicile (aide, ménage, garde enfants)' },
        { value: 'buanderie-laverie',         label: 'Laverie / Pressing' },
        { value: 'veterinaire',               label: 'Clinique vétérinaire' }
      ]
    }
  ],

  // ── Villes marocaines ──────────────────────────────────────────
  CITIES: [
    'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger',
    'Agadir', 'Meknès', 'Oujda', 'Laâyoune', 'Beni Mellal',
    'Kénitra', 'Tétouan', 'Safi', 'Mohammedia', 'El Jadida',
    'Nador', 'Khouribga', 'Béni Mellal', 'Taza', 'Settat',
    'Berrechid', 'Khémisset', 'Inezgane', 'Dakhla', 'Autre'
  ],

  // ── Taille équipe ──────────────────────────────────────────────
  TEAM_SIZES: [
    { value: 'solo',  label: 'Solo-entrepreneur / Libéral seul (1 personne)' },
    { value: '2-3',   label: '2 à 3 associés / collaborateurs' },
    { value: '4-10',  label: '4 à 10 personnes' },
    { value: '10+',   label: 'Plus de 10 personnes' }
  ],

  // ── Années d'expérience ────────────────────────────────────────
  EXPERIENCE_YEARS: [
    { value: 'etudiant',    label: 'Étudiant / En cours de diplôme' },
    { value: 'junior',      label: 'Moins de 2 ans d\'expérience' },
    { value: '2-5',         label: '2 à 5 ans d\'expérience' },
    { value: '5-10',        label: '5 à 10 ans d\'expérience' },
    { value: '10-20',       label: '10 à 20 ans d\'expérience' },
    { value: '20+',         label: 'Plus de 20 ans d\'expérience' }
  ],

  // ── LocalStorage keys ──────────────────────────────────────────
  STORAGE_KEYS: {
    LANG:      'planstart_lang',
    FORM_DATA: 'planstart_form_data'
  },

  // ── Configuration des 6 Agents IA ─────────────────────────────
  AGENTS: [
    {
      id:     'market',
      name:   'Agent Marché',
      nameAr: 'وكيل السوق',
      role:   'Analyse de marché & data',
      icon:   '📊',
      avatar: 'img/agent_market.png',
      color:  '#C9A84C'
    },
    {
      id:     'business',
      name:   'Agent Business',
      nameAr: 'وكيل الأعمال',
      role:   'Modèle économique & stratégie',
      icon:   '💼',
      color:  '#C9A84C'
    },
    {
      id:     'financial',
      name:   'Agent Financier',
      nameAr: 'وكيل المالية',
      role:   'Projections financières (MAD)',
      icon:   '💰',
      color:  '#C9A84C'
    },
    {
      id:     'writer',
      name:   'Agent Rédacteur',
      nameAr: 'وكيل الكتابة',
      role:   'Rédaction du business plan',
      icon:   '✍️',
      color:  '#C9A84C'
    },
    {
      id:     'audit',
      name:   'Agent Audit',
      nameAr: 'وكيل التدقيق',
      role:   'Red Team — Critique indépendante',
      icon:   '🔍',
      color:  '#C9A84C'
    },
    {
      id:     'validator',
      name:   'Agent Validateur',
      nameAr: 'وكيل التحقق',
      role:   'Version finale optimisée',
      icon:   '✅',
      color:  '#1E9E75'
    }
  ]
};
