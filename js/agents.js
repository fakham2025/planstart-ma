/* ================================================================
   AGENTS.JS — PlanStart.ma Multi-Agent Orchestrator
   Architecture: McKinsey/BCG inspired 6-agent pipeline
   Modèle: nex-agi/nex-n2-pro:free (OpenRouter)
   ================================================================ */

class AgentOrchestrator {

  constructor({ onProgress, onStream, onError, onComplete }) {
    // Clé API et modèle récupérés directement depuis config.js
    this.apiKey     = CONFIG.API_KEY;
    this.model      = CONFIG.DEFAULT_MODEL;
    this.onProgress = onProgress || (() => {});
    this.onStream   = onStream   || (() => {});
    this.onError    = onError    || console.error;
    this.onComplete = onComplete || (() => {});
    this.aborted    = false;
  }

  /* ── ABORT SUPPORT ───────────────────────────────────────────── */
  abort() {
    this.aborted = true;
    if (this._controller) this._controller.abort();
  }

  /* ── CORE: Single Agent Call with Streaming ──────────────────── */
  async callAgent(agentId, messages) {
    if (this.aborted) throw new Error('ABORTED');

    this._controller = new AbortController();

    let currentMessages = [...messages];
    let fullContent = '';
    let isFinished = false;

    let loopCount = 0;
    while (!isFinished && loopCount < 3) {
      loopCount++;
      if (this.aborted) throw new Error('ABORTED');

      const requestBody = {
        model:       this.model,
        messages:    currentMessages,
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
      } catch (fetchErr) {
        const msg = fetchErr.message || String(fetchErr);
        console.error(`[${agentId}] Fetch error:`, msg);
        throw new Error(`Network error: ${msg}`);
      }

      if (!response.ok) {
        let errBody = '';
        try { errBody = await response.text(); } catch {}
        const errMsg = `API Error ${response.status} ${response.statusText}${errBody ? ': ' + errBody.substring(0, 200) : ''}`;
        console.error(`[${agentId}] ${errMsg}`);
        throw new Error(errMsg);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let   buffer       = '';
      let   chunkContent = '';
      let   finishReason = null;

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
            continue; // Ignorer les chunks non-parseable
          }

          if (parsed.error) {
            throw new Error(parsed.error.message || 'API Error in stream');
          }

          const choice = parsed.choices?.[0];
          if (!choice) continue;

          if (choice.finish_reason) {
            finishReason = choice.finish_reason;
          }

          const delta  = choice.delta;
          if (!delta) continue;

          const content = delta.content;

          if (typeof content === 'string' && content) {
            chunkContent += content;
            fullContent  += content;
            this.onStream(agentId, content, fullContent);

          } else if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'text' && block.text) {
                chunkContent += block.text;
                fullContent  += block.text;
                this.onStream(agentId, block.text, fullContent);
              }
            }
          }
        }
      }

      // Check why the generation stopped
      if ((finishReason === 'length' || finishReason === 'max_tokens') && loopCount < 3) {
        console.warn(`[${agentId}] Token limit reached. Auto-continuing...`);
        // Append what the AI just generated to the context
        currentMessages.push({ role: 'assistant', content: chunkContent });
        // Ask it to continue exactly where it left off
        currentMessages.push({ role: 'user', content: "Continue exactement là où tu t'es arrêté (ne répète pas ce qui a déjà été dit, commence par le mot suivant direct)." });
      } else {
        isFinished = true;
      }
    }

    if (!fullContent.trim()) {
      throw new Error("L'API n'a retourné aucun contenu texte.");
    }

    return fullContent;
  }

  /* ── MAIN ORCHESTRATION PIPELINE ────────────────────────────── */
  async run(startupData, language) {
    const context = {
      market:    '',
      business:  '',
      financial: '',
      plan:      '',
      audit:     ''
    };

    try {
      const delay = ms => new Promise(res => setTimeout(res, ms));

      // ─── AGENT 1: MARKET & BUSINESS ────────────────────────────
      this.onProgress('market', 'running', 0);
      context.market = await this.callAgent(
        'market',
        PROMPTS.market(startupData, language)
      );
      this.onProgress('market', 'done', 33);

      if (this.aborted) return;
      await delay(4000); // Pause API pour éviter le Rate Limiting

      // ─── AGENT 2: FINANCIAL PROJECTIONS ──────────────────────
      this.onProgress('financial', 'running', 33);
      context.financial = await this.callAgent(
        'financial',
        PROMPTS.financial(startupData, context.market, '', language)
      );
      this.onProgress('financial', 'done', 66);

      if (this.aborted) return;
      await delay(4000);

      // ─── AGENT 3: WRITER FINAL ────────────────────────────────
      this.onProgress('writer', 'running', 66);
      context.plan = await this.callAgent(
        'writer',
        PROMPTS.writer(startupData, context, language)
      );
      this.onProgress('writer', 'done', 100);

      const finalPlan = context.plan;

      // ─── TERMINÉ ──────────────────────────────────────────────
      this.onComplete({
        finalPlan,
        context,
        metadata: {
          projectName: startupData.projectName,
          sector:      startupData.sectorLabel,
          language,
          model:       this.model,
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
      const customErr = new Error(`L'API a bloqué la requête (Trop de requêtes ou Plus de tokens). Raison: ${msg}`);
      this.onError(customErr);
      throw customErr;
    }
  }

}
