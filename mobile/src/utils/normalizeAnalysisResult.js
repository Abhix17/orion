export function normalizeAnalysisResult(incident, sourceType = 'url') {
  if (!incident) {
    throw new Error('Invalid backend response');
  }

  // Extract recommended actions
  let recommendedActions = [];
  if (Array.isArray(incident.recommended_actions)) {
    recommendedActions = incident.recommended_actions.map(action => 
      typeof action === 'string' ? action : (action.description || action.action || JSON.stringify(action))
    );
  }

  // Extract evidence
  let evidence = [];
  if (Array.isArray(incident.evidence)) {
    evidence = incident.evidence.map(e => ({
      signal: e.signal || e.explanation || e.description || e.type || 'Unknown signal',
      source: e.source || 'Unknown source',
      confidence: e.confidence !== undefined ? e.confidence : null
    }));
  }

  return {
    rawAnalysisId: incident.id,
    sourceType: sourceType,
    riskLevel: incident.risk_level || 'UNKNOWN',
    classification: incident.threat_type || 'Unknown Threat',
    confidence: incident.confidence,
    summary: incident.explanation || incident.xai_summary || 'No explanation provided.',
    riskDrivers: Array.isArray(incident.risk_drivers) ? incident.risk_drivers : [],
    evidence: evidence,
    recommendedActions: recommendedActions,
    transcript: incident.metadata?.transcript || null,
    semanticIntent: incident.metadata?.semantic_intent || incident.metadata?.semanticIntent || null,
    speakerAnalysis: incident.metadata?.speaker_analysis || incident.metadata?.speakerAnalysis || null,
    audioAuthenticity: incident.metadata?.audio_authenticity || incident.metadata?.audioAuthenticity || null,
    timestamp: incident.timestamp || incident.created_at || new Date().toISOString()
  };
}
