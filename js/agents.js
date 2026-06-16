/* ================================================================
   AGENTS.JS — PlanStart.ma Multi-Agent Orchestrator
   Architecture: McKinsey/BCG inspired 6-agent pipeline
   Modèle: nex-agi/nex-n2-pro:free (OpenRouter)
   ================================================================ */

class AgentOrchestrator {

  constructor({ onProgress, onStream, onError, onComplete }) {
    this.apiKey     = CONFIG.API_KEY;
    this.models     = CONFIG.FALLBACK_MODELS || ['openai/gpt-oss-120b:free'];
    this.onProgress = onProgress || (() => {});
    this.onStream   = onStream   || (() => {});
    this.onError    = onError    || console.error;
    this.onComplete = onComplete || (() => {});
    this.aborted    = false;
  }

  abort() {
    this.aborted = true;
    if (this._controller) this._controller.abort();
  }

  async run(startupData, language) {
    if (this.aborted) return;
    const context = {
      market:    '',
      business:  '',
      financial: '',
      plan:      '',
      audit:     ''
    };

    try {
      const messages = PROMPTS.megaPrompt(startupData, language);

      // Simulation de la progression UI
      this.onProgress('market', 'running', 10);
      setTimeout(() => { if (!this.aborted) this.onProgress('market', 'done', 20); }, 5000);
      setTimeout(() => { if (!this.aborted) this.onProgress('financial', 'running', 30); }, 6000);
      setTimeout(() => { if (!this.aborted) this.onProgress('financial', 'done', 40); }, 10000);
      setTimeout(() => { if (!this.aborted) this.onProgress('writer', 'running', 50); }, 11000);

      let finalPlan = null;
      let lastError = null;

      // Boucle de fallback sur les modèles
      for (let i = 0; i < this.models.length; i++) {
        if (this.aborted) throw new Error('ABORTED');
        const currentModel = this.models[i];
        console.log(`🚀 Tentative avec le modèle : ${currentModel}`);
        
        try {
          finalPlan = await this.callAgentSingleShot(currentModel, messages);
          if (finalPlan) {
            console.log(`✅ Succès avec ${currentModel}`);
            break; // Sortir de la boucle si succès
          }
        } catch (err) {
          console.warn(`❌ Échec avec ${currentModel}:`, err.message);
          lastError = err;
          if (err.message === 'ABORTED' || err.name === 'AbortError') {
             throw err;
          }
          // Si c'est le dernier modèle, on throw l'erreur
          if (i === this.models.length - 1) {
             throw new Error(`Tous les modèles de secours ont échoué. Dernière erreur: ${err.message}`);
          }
          // Sinon on attend 2s et on essaie le prochain
          await new Promise(res => setTimeout(res, 2000));
        }
      }

      if (!finalPlan) throw new Error("Génération échouée ou vide.");

      // Fin de la simulation UI
      this.onProgress('writer', 'done', 100);

      // Le Mega Prompt renvoie le plan complet dans context.plan
      context.plan = finalPlan;

      this.onComplete({
        finalPlan: finalPlan,
        context: context,
        metadata: {
          projectName: startupData.projectName,
          sector:      startupData.sectorLabel,
          language:    language,
          model:       this.models[0], // Modèle principal (ou on pourrait tracker celui qui a réussi)
          generatedAt: new Date().toISOString()
        }
      });

      return finalPlan;

    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      if (msg === 'ABORTED' || err.name === 'AbortError') {
        console.log('Génération annulée par l\'utilisateur.');
        return null;
      }
      
      console.error('Erreur API détaillée:', err);
      const customErr = new Error(`Échec de la génération. ${msg}`);
      this.onError(customErr);
      throw customErr;
    }
  }

  async callAgentSingleShot(model, messages) {
    if (this.aborted) throw new Error('ABORTED');
    this._controller = new AbortController();

    let fullContent = '';
    // Timeout global de 2 minutes pour la requête entière
    const timeoutId = setTimeout(() => {
      if (this._controller) this._controller.abort('TIMEOUT');
    }, 120000);

    const requestBody = {
      model:       model,
      messages:    messages,
      stream:      true,
      max_tokens:  CONFIG.MAX_TOKENS,
      temperature: CONFIG.TEMPERATURE
    };

    let response;
    try {
      response = await fetch(CONFIG.API_ENDPOINT, {
        method:  'POST',
        signal:  this._controller.signal,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type':  'application/json',
          'HTTP-Referer':  CONFIG.APP_URL,
          'X-Title':       CONFIG.APP_NAME
        },
        body: JSON.stringify(requestBody)
      });
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const msg = fetchErr.message || String(fetchErr);
      if (fetchErr.name === 'AbortError' || msg.includes('TIMEOUT')) {
         throw new Error(`Timeout (120s) dépassé pour ${model}`);
      }
      throw new Error(`Erreur réseau: ${msg}`);
    }

    if (!response.ok) {
      let errBody = '';
      try { errBody = await response.text(); } catch {}
      throw new Error(`Erreur API ${response.status} : ${errBody.substring(0, 150)}`);
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer    = '';

    while (true) {
      if (this.aborted) {
        reader.cancel();
        throw new Error('ABORTED');
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Garder la ligne incomplète dans le buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;

        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          continue; // Ignorer les chunks corrompus sans crasher
        }

        if (parsed.error) {
          throw new Error(parsed.error.message || 'Erreur interne de l\'API OpenRouter');
        }

        const choice = parsed.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta;
        if (!delta || !delta.content) continue;

        const content = delta.content;
        fullContent += content;
        
        // Simuler l'envoi du flux à l'agent 'writer' pour l'UI, même si tout se fait d'un coup
        this.onStream('writer', content, fullContent);
      }
    }

    if (!fullContent.trim()) {
      throw new Error(`Le modèle ${model} n'a retourné aucun texte.`);
    }

    return fullContent;
  }

}
