/* ================================================================
   PROMPTS.JS — PlanStart.ma Multi-Agent Prompts
   Structure: McKinsey/BCG inspired 6-agent pipeline
   ================================================================ */

const PROMPTS = {

  /* ── UTILS ────────────────────────────────────────────────────── */
  langInstruction(lang) {
    return lang === 'ar'
      ? 'IMPORTANT: Tu DOIS répondre UNIQUEMENT en arabe (العربية). Utilise un arabe professionnel et clair, adapté au contexte des affaires marocain.'
      : 'IMPORTANT: Réponds UNIQUEMENT en français. Utilise un français professionnel et clair.';
  },

  today() {
    return new Date().toLocaleDateString('fr-MA', { year: 'numeric', month: 'long', day: 'numeric' });
  },

  /* ── FICHE ENTREPRENEUR (bloc injecté dans tous les agents) ────── */
  entrepreneurBlock(data) {
    const fd = data;
    const titleLabel = CONFIG.TITLES.find(t => t.value === fd.entrepreneurTitle);
    const titleStr   = titleLabel ? titleLabel.label.split('—')[0].trim() : '';
    const legalLabel = CONFIG.LEGAL_FORMS.find(l => l.value === fd.legalForm);
    const legalStr   = legalLabel ? legalLabel.label : '';
    const expLabel   = CONFIG.EXPERIENCE_YEARS.find(e => e.value === fd.experience);
    const expStr     = expLabel ? expLabel.label : '';

    // Build full address
    const addrParts  = [fd.addressStreet, fd.addressQuartier, fd.addressCP, fd.city || fd.addressCity].filter(Boolean);
    const fullAddr   = addrParts.join(', ');
    const zone       = fd.addressZone ? ` (${fd.addressZone})` : '';

    let block = `\n---\n## 🧑‍💼 FICHE DU PORTEUR DE PROJET\n`;
    if (titleStr || fd.entrepreneurName) {
      block += `**Identité :** ${titleStr} ${fd.entrepreneurName || ''}`.trim() + '\n';
    }
    if (fd.entrepreneurActivity) {
      block += `**Activité / Spécialité :** ${fd.entrepreneurActivity}\n`;
    }
    if (expStr) {
      block += `**Expérience :** ${expStr}\n`;
    }
    if (legalStr) {
      block += `**Statut juridique envisagé :** ${legalStr}\n`;
    }
    if (fullAddr) {
      block += `**Adresse professionnelle :** ${fullAddr}${zone}\n`;
    }
    if (fd.openingDate) {
      block += `**Ouverture prévue :** ${fd.openingDate}\n`;
    }
    if (fd.email) {
      block += `**Email :** ${fd.email}\n`;
    }
    if (fd.phone) {
      block += `**Téléphone :** ${fd.phone}\n`;
    }
    block += `---\n`;
    return block;
  },

  /* ── CONTEXTE PROJET (bloc partagé) ─────────────────────────── */
  projectContext(data) {
    return `
## 📋 CONTEXTE DU PROJET
**Structure / Cabinet :** ${data.projectName}
**Secteur précis :** ${data.sectorLabel}${data.sectorCategory ? ` (${data.sectorCategory})` : ''}
**Ville d'implantation :** ${data.city}${data.addressZone ? `, ${data.addressZone}` : ''}
**Budget total :** ${Number(data.capital).toLocaleString('fr-MA')} MAD
**Taille de l'équipe :** ${data.teamSize}
**Description :** ${data.description}
**Problème identifié :** ${data.problem}
**Proposition de valeur :** ${data.uniqueValue}${data.targetClients ? `\n**Cibles clientèle :** ${data.targetClients}` : ''}
**Date de génération :** ${this.today()}
`;
  },

  /* ── AGENT 1: MARKET ANALYSIS (Marché Maroc) ─────────────────── */
  market(data, lang) {
    const langInstr = this.langInstruction(lang);
    const entrepreneur = this.entrepreneurBlock(data);
    const context = this.projectContext(data);
    return [
      {
        role: 'system',
        content: `Tu es un expert senior en analyse de marché au Maroc avec 15 ans d'expérience. Tu travailles avec des données du HCP (Haut-Commissariat au Plan), de Bank Al-Maghrib, de l'OMPIC et du CRI (Centre Régional d'Investissement). Tu connais parfaitement l'écosystème économique marocain, les tendances sectorielles, et les spécificités du marché local.\n\nTu es mandaté pour produire un business plan complet et personnalisé pour le porteur de projet suivant. Utilise ces informations dans ton analyse pour la contextualiser précisément. ${langInstr}`
      },
      {
        role: 'user',
        content: `Réalise une analyse de marché professionnelle pour ce projet :
${entrepreneur}
${context}

Produis une analyse structurée incluant :

## 1. Taille et Potentiel du Marché
- Estimation du marché adressable total (TAM) en MAD — spécifique à ${data.sectorLabel} au Maroc
- Marché adressable réalisable (SAM) dans la ville de ${data.city}
- Consommation actuelle et potentielle (au niveau national et régional)
- Taux de croissance annuel (CAGR) du secteur au Maroc

## 2. Tendances et Dynamiques (2025-2027)
- Tendances macro-économiques au Maroc impactant ce secteur précis
- Évolutions réglementaires et politiques gouvernementales (CNSS, HAS, CRI...)
- Transformation digitale et comportements des consommateurs marocains
- Impact du démantèlement douanier et statistiques des importations (le cas échéant)

## 3. Analyse Concurrentielle — ${data.city}
- Offre existante au niveau national et régional (Unités de production/services)
- Principaux concurrents locaux dans ${data.city}${data.addressZone ? ` (${data.addressZone})` : ''} (avec noms réels si connu)
- Positionnement et niveau de service de la concurrence
- Avantage concurrentiel potentiel pour ${data.projectName}

## 4. Segmentation Clients et Stratégie
- Profils des clients cibles${data.targetClients ? ` (selon le porteur : ${data.targetClients})` : ''}
- Comportements et pouvoir d'achat (en MAD)
- Part de marché convoitée et politique de prix
- Canaux d'acquisition et circuit de distribution envisagé au Maroc

## 5. Opportunités Spécifiques
- Opportunités liées au secteur dans le contexte marocain 2025-2026
- Soutiens disponibles (Maroc PME, CCG, Tamwilcom, CRI de ${data.city})
- Potentiel de croissance moyen terme

## 6. Barrières et Défis
- Obstacles réglementaires et bureaucratiques pour ce secteur au Maroc
- Défis culturels et comportementaux spécifiques
- Risques principaux à mitiger

Sois précis, concret et basé sur des réalités marocaines. Utilise des chiffres réalistes pour ${data.city}.`
      }
    ];
  },

  /* ── AGENT 2: BUSINESS MODEL ─────────────────────────────────── */
  business(data, marketAnalysis, lang) {
    const langInstr    = this.langInstruction(lang);
    const entrepreneur = this.entrepreneurBlock(data);
    return [
      {
        role: 'system',
        content: `Tu es un consultant en stratégie d'entreprise senior, spécialiste des startups et PME marocaines. Tu maîtrises le Business Model Canvas, le Design Thinking et les frameworks stratégiques (Porter, SWOT, PESTEL). Tu as accompagné plus de 50 structures au Maroc vers leur premier financement. Tu travailles ici pour le porteur de projet suivant : personnalise ton analyse à son profil réel. ${langInstr}`
      },
      {
        role: 'user',
        content: `Sur la base de cette analyse de marché :

${marketAnalysis}
${entrepreneur}
Conçois le modèle économique pour :

**Structure / Cabinet :** ${data.projectName}
**Secteur :** ${data.sectorLabel}
**Description :** ${data.description}
**Problème résolu :** ${data.problem}
**Proposition de valeur unique :** ${data.uniqueValue}${data.targetClients ? `
**Cible principale :** ${data.targetClients}` : ''}
**Budget disponible :** ${Number(data.capital).toLocaleString('fr-MA')} MAD
**Taille de l'équipe :** ${data.teamSize}
**Ville :** ${data.city}${data.addressZone ? `, ${data.addressZone}` : ''}

## Business Model Canvas — ${data.projectName}

### 1. Proposition de Valeur
- Valeur unique offerte aux clients
- Différenciation vs concurrents
- Gains et problèmes résolus

### 2. Segments Clients (Personas Détaillés)
- Profil 1 : [décris avec détails — âge, revenus, comportements]
- Profil 2 : [si applicable]
- Critères de segmentation

### 3. Canaux de Distribution (adaptés au Maroc)
- Canaux directs et indirects
- Mix digital / physique
- Stratégie de go-to-market au Maroc

### 4. Organisation Commerciale & Clients
- Mode d'acquisition (CAC estimé)
- Fidélisation et rétention
- Modalités de paiement prévues avec les clients
- Chiffre d'affaires : ventilation (Marché local vs Exportations éventuelles)

### 5. Sources de Revenus & Pricing
- Modèle de monétisation (abonnement, commission, vente directe, etc.)
- Politique de prix en MAD (avec justification vs prix de revient)
- Revenus récurrents vs ponctuels

### 6. Moyens d'Exploitation (Ressources Clés)
- Terrains et constructions nécessaires (existants ou à acquérir, superficies)
- Matériel et équipements (à l'état neuf ou d'occasion, leasing vs propriété)
- Propriété intellectuelle et technologies

### 7. Activités Clés & Étude Technique
- Explication du procédé de fabrication ou mode de prestation de service
- Capacité de production / volume de traitement
- Processus qualité et activités de croissance

### 8. Partenaires Clés & Approvisionnements
- Fournisseurs stratégiques (approvisionnements locaux vs importations)
- Modalités de règlement fournisseurs
- Partenaires institutionnels (CRI, CCG, etc.)

### 9. Structure de Coûts & Effectifs
- Effectifs à recruter : Administratif, Commercial, Technique (Qualifié / Non qualifié)
- Masse salariale prévisionnelle
- Coûts fixes principaux et coûts variables

### 10. Planning de Réalisation
- Étapes clés de la mise en place de l'investissement
- Calendrier de lancement des opérations`
      }
    ];
  },

  /* ── AGENT 3: FINANCIAL PROJECTIONS ─────────────────────────── */
  financial(data, marketAnalysis, businessModel, lang) {
    const langInstr = this.langInstruction(lang);
    return [
      {
        role: 'system',
        content: `Tu es un expert-comptable et directeur financier spécialisé dans les startups marocaines. Tu maîtrises la fiscalité marocaine (IS, IR, TVA, CNSS, AMO, taxe professionnelle), les normes comptables marocaines (PCM) et les mécanismes de financement locaux (CCG, Tamwilcom, Maroc PME, CRI). TOUS LES MONTANTS SONT EN MAD (Dirham Marocain). ${langInstr}`
      },
      {
        role: 'user',
        content: `Crée des projections financières complètes et réalistes pour :

**Startup :** ${data.projectName}
**Secteur :** ${data.sectorLabel}
**Capital initial :** ${data.capital} MAD
**Ville :** ${data.city}
**Équipe :** ${data.teamSize}

Contexte :
${businessModel}
## Analyse Financière — ${data.projectName}

### 1. Coût Total du Programme d'Investissement
Détaille l'utilisation du capital de ${data.capital} MAD selon cette structure bancaire :
- Frais préliminaires
- Terrain
- Constructions / Aménagements
- Équipements et Matériel
- Divers et imprévus
- Besoins en Fonds de Roulement (BFR)

### 2. Plan de Financement Envisagé
- Capital
- Apport en Comptes Courants Associés
- Crédit sollicité (emprunt bancaire)
- Autres (crédit fournisseur, subventions)

### 3. Compte d'Exploitation Prévisionnel (sur 5 ans : A1 à A5)
Génère un tableau structuré (en MAD) avec EXACTEMENT les rubriques suivantes :
| Rubrique | A1 | A2 | A3 | A4 | A5 |
|----------|---|---|---|---|---|
| A. Chiffre d'Affaires | | | | | |
| B. Achats | | | | | |
| C. Marge Brute (A-B) | | | | | |
| D. Frais de Personnel | | | | | |
| E. Charges Externes | | | | | |
| F. Frais Financiers | | | | | |
| G. Amortissements | | | | | |
| H. Charges d'exploitation (D+E+F+G) | | | | | |
| I. Résultats (C-H) | | | | | |
| J. IS (Impôt sur les Sociétés) | | | | | |
| K. Résultat Net (I-J) | | | | | |
| L. Cash-Flow (K+G) | | | | | |

### 4. Indicateurs Financiers Clés
- ROI (Retour sur Investissement)
- Délai de récupération (Payback period)
- Seuil de Rentabilité (Break-even) annuel et mensuel

### 5. Fiscalité Applicable
- Taux d'IS ou IR prévu
- TVA applicable
- CNSS et AMO (taux de charges sociales sur la masse salariale)`
      }
    ];
  },

  /* ── AGENT 4: BUSINESS PLAN WRITER ───────────────────────────── */
  writer(data, context, lang) {
    const langInstr    = this.langInstruction(lang);
    const isAr         = lang === 'ar';
    const entrepreneur = this.entrepreneurBlock(data);
    return [
      {
        role: 'system',
        content: `Tu es un rédacteur expert en business plans de niveau investisseur. Tu as rédigé plus de 200 business plans pour des structures marocaines (cabinets médicaux, cabinets de conseil, startups tech, commerces, etc.), dont plusieurs ont levé des fonds auprès de CDG Invest, Maroc Numeric Fund, Azur Innovation et des investisseurs privés. Ton style est professionnel, percutant et convaincant. Adapte toujours le document au profil précis du porteur de projet. ${langInstr}`
      },
      {
        role: 'user',
        content: `Rédige un business plan COMPLET et PROFESSIONNEL de niveau investisseur en intégrant toutes les analyses ci-dessous.
${entrepreneur}
=== ANALYSE DE MARCHÉ ===
${context.market}

=== MODÈLE ÉCONOMIQUE ===
${context.business}

=== PROJECTIONS FINANCIÈRES ===
${context.financial}

---

**Informations du projet :**
- **Structure / Cabinet :** ${data.projectName}
- **Porteur de projet :** ${data.entrepreneurName || ''}${data.entrepreneurActivity ? ` — ${data.entrepreneurActivity}` : ''}
- **Secteur :** ${data.sectorLabel}
- **Adresse :** ${[data.addressStreet, data.addressQuartier, data.city].filter(Boolean).join(', ')}
- **Équipe :** ${data.teamSize}
- **Budget total :** ${Number(data.capital).toLocaleString('fr-MA')} MAD
- **Statut juridique :** ${data.legalForm ? CONFIG.LEGAL_FORMS.find(l=>l.value===data.legalForm)?.label || data.legalForm : 'À définir'}
- **Date d'ouverture prévue :** ${data.openingDate || 'À définir'}
- **Date de génération :** ${this.today()}

Rédige le business plan COMPLET avec ces 12 sections (sois exhaustif pour chaque section) :

# BUSINESS PLAN — ${data.projectName}
*Préparé pour : ${data.entrepreneurName || 'Le porteur de projet'} — Confidentiel — ${this.today()}*

---

## 1. 📋 Résumé Exécutif
[Synthèse percutante de 300-400 mots qui donne envie de lire la suite. Inclure : problème, solution, marché cible, modèle de revenus, traction envisagée, équipe, besoin de financement]

## 2. 👤 Présentation du Porteur de Projet
[Profil complet de ${data.entrepreneurName || 'le porteur'}, son expérience, ses qualifications, sa légitimité dans ce secteur. Adresse : ${[data.addressStreet, data.addressQuartier, data.city].filter(Boolean).join(', ')}]

## 3. 🚀 Présentation du Projet
[Description détaillée de ${data.projectName}, vision, mission, valeurs. Services/produits offerts. Positionnement dans le secteur ${data.sectorLabel}]

## 4. 📊 Analyse du Marché Marocain — ${data.city}
[Basé sur l'analyse de marché fournie — taille, tendances, concurrence locale à ${data.city}, opportunités]

## 5. 💡 Modèle Économique & Étude Technique
[Procédé, capacité de production, modèle de monétisation, approvisionnements et modalités]

## 6. 📣 Organisation Commerciale
[Canaux de distribution, acquisition, politique de prix, modalités de règlement clients]

## 7. ⚙️ Moyens d'Exploitation (Capacité & RH)
[Terrains, constructions, matériel (neuf/occasion), effectifs existants et à recruter, masse salariale]

## 8. 💰 Coût du Programme & Plan de Financement
[Détail du coût d'investissement : terrain, équipement, BFR. Répartition du financement : capital, apport CCA, crédit bancaire sollicité]

## 9. 📊 Compte d'Exploitation Prévisionnel (5 ans)
[Tableau détaillé des 5 premières années avec CA, Achats, Frais personnel, Résultat Net et Cash-Flow. Seuil de rentabilité]

## 10. ⚖️ Cadre Juridique & Réglementaire
[Forme juridique recommandée au Maroc — ${data.legalForm ? CONFIG.LEGAL_FORMS.find(l=>l.value===data.legalForm)?.label || '' : 'SARL/SA/Auto-entrepreneur'} — démarches CRI/OMPIC, licences professionnelles requises]

## 11. ⚠️ Analyse des Risques & Mitigation
[Matrice des risques sectoriels, marché, financiers, réglementaires]

## 12. 📅 Planning de Réalisation de l'Investissement
[Étapes clés, délais de mise en œuvre, date d'ouverture : ${data.openingDate || 'à définir'}]

---

Assure-toi que chaque section est :
✅ Professionnelle et convaincante pour un investisseur marocain
✅ Contextualisée au marché de ${data.city} et au secteur ${data.sectorLabel}
✅ Personnalisée au profil réel de ${data.entrepreneurName || 'le porteur'}
✅ Cohérente avec les chiffres financiers fournis
✅ Prête à soumettre à un CRI, une banque ou un investisseur au Maroc

⚠️ INSTRUCTION CRITIQUE SUR LA LONGUEUR ⚠️
TU DOIS IMPÉRATIVEMENT ÉCRIRE LES 12 SECTIONS JUSQU'À LA TOUTE DERNIÈRE (Section 12). NE T'ARRÊTE SOUS AUCUN PRÉTEXTE AVANT LA FIN DU DOCUMENT. SI BESOIN, SOIS SYNTHÉTIQUE ET DIRECT DANS TES EXPLICATIONS POUR T'ASSURER DE TOUT TERMINER. IL EST STRICTEMENT INTERDIT DE COUPER LE DOCUMENT EN COURS DE ROUTE.`
      }
    ];
  },

  /* ── AGENT 5: AUDIT / RED TEAM ───────────────────────────────── */
  audit(businessPlan, lang) {
    const langInstr = this.langInstruction(lang);
    return [
      {
        role: 'system',
        content: `Tu es un partner senior d'un fonds d'investissement marocain spécialisé dans les startups. Tu as analysé plus de 500 dossiers d'investissement et tu es connu pour ton regard critique et exigeant. Ton rôle est d'identifier toutes les failles, incohérences et points faibles d'un business plan avant qu'il soit présenté à des investisseurs. ${langInstr}`
      },
      {
        role: 'user',
        content: `Audite ce business plan avec un regard critique d'investisseur :

${businessPlan}

---

Réalise un audit structuré :

## ✅ Points Forts (3-5 éléments)
[Ce qui est convaincant et bien développé]

## ⚠️ Failles Critiques (à corriger absolument)
[Incohérences, hypothèses irréalistes, manques importants]

## 🔢 Vérification des Chiffres
[Cohérence financière, réalisme des projections, taux de croissance]

## 🎯 Hypothèses à Challenger
[Suppositions trop optimistes ou non fondées]

## ❓ Questions d'un Investisseur Marocain
[Les 5-7 questions difficiles que poserait un investisseur lors d'un pitch]

## 📝 Sections Insuffisantes
[Ce qui manque ou est trop superficiel]

## 🔴 Risques Sous-estimés
[Risques non mentionnés ou mal traités]

## ⭐ Score Global
[Note sur 10 avec justification détaillée]`
      }
    ];
  },

  /* ── AGENT 6: VALIDATOR (Final Version) ──────────────────────── */
  validator(businessPlan, auditReport, data, lang) {
    const langInstr = this.langInstruction(lang);
    return [
      {
        role: 'system',
        content: `Tu es un Managing Partner senior d'un cabinet de conseil stratégique (niveau McKinsey Maroc / BCG Casablanca). Tu valides et optimises des business plans pour les porter au plus haut niveau de qualité professionnelle. Tu t'assures que le document est prêt pour une présentation à des investisseurs sérieux (CDG Invest, Maroc Numeric Fund, fonds africains, BEI, etc.). ${langInstr}`
      },
      {
        role: 'user',
        content: `Voici un business plan et son rapport d'audit :

=== BUSINESS PLAN INITIAL ===
${businessPlan}

=== RAPPORT D'AUDIT ===
${auditReport}

---

Ta mission : Produire la **VERSION FINALE OPTIMISÉE** du business plan de **${data.projectName}**.

Instructions :
1. ✅ **Corrige** toutes les failles identifiées dans l'audit
2. ✅ **Renforce** les arguments insuffisants avec des données concrètes
3. ✅ **Complète** les sections manquantes
4. ✅ **Affine** les projections financières pour plus de réalisme
5. ✅ **Améliore** le style pour qu'il soit percutant et convaincant
6. ✅ **Ajoute** les éléments spécifiques au marché marocain manquants
7. ✅ **Assure** la cohérence globale du document

IMPORTANT :
- Produis le document **COMPLET** (pas juste les corrections)
- Conserve la structure en 12 sections complètes
- Chaque section doit être substantielle et convaincante
- Les chiffres doivent être cohérents dans tout le document
- Commence directement par le business plan, sans préambule

⚠️ INSTRUCTION CRITIQUE SUR LA LONGUEUR ⚠️
TU DOIS IMPÉRATIVEMENT ÉCRIRE LES 12 SECTIONS JUSQU'À LA TOUTE DERNIÈRE (Section 12). C'EST VITAL. NE T'ARRÊTE SOUS AUCUN PRÉTEXTE AVANT LA FIN DU DOCUMENT. SI BESOIN, SOIS SYNTHÉTIQUE ET VA A L'ESSENTIEL DANS LES PREMIÈRES SECTIONS POUR T'ASSURER DE TOUT TERMINER. LE RENDU DOIT ÊTRE UN SEUL BLOC.

Format : Business plan complet en Markdown professionnel`
      }
    ];
  }

};
