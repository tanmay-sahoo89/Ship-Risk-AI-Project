import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles } from 'lucide-react';
import { generateAISummary } from '../services/aiService';
import { useShipmentContext } from '../contexts/ShipmentContext';

interface AiAdvisorProps {
  shipmentId: string;
}

const suggestions = [
  'Summarize this shipment',
  'What are the main risks?',
  'Should I accept the recommendations?',
  'When will this arrive?',
  'What actions should I take?',
];

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ shipmentId }) => {
  const { shipments, alerts, recommendations } = useShipmentContext();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (text: string = query) => {
    if (!text.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');
    setSource('');

    try {
      // Build context from shipment data in memory
      const shipment = shipments.find((s) => s.shipment_id === shipmentId);
      const shipmentAlerts = alerts.filter((a) => a.shipment_id === shipmentId);
      const shipmentRecs = recommendations.filter((r) => r.shipment_id === shipmentId);

      const context = shipment
        ? { shipment, alerts: shipmentAlerts, recommendations: shipmentRecs }
        : undefined;

      const result = await generateAISummary(shipmentId, text, context);
      setResponse(result.summary);
      setSource(result.source);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border border-accent/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg gradient-primary">
          <Bot className="w-5 h-5" style={{ color: '#fff' }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">AI Shipment Advisor</h3>
          <p className="text-xs text-light">Ask questions about {shipmentId}</p>
        </div>
      </div>

      {/* Suggestion Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleSubmit(suggestion)}
            disabled={loading}
            className="text-xs px-3 py-1.5 glass-light rounded-lg text-light hover:text-accent transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Ask about this shipment..."
          className="input-field flex-1"
          disabled={loading}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={loading || !query.trim()}
          className="btn-primary px-4 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Response */}
      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-light p-4 rounded-lg"
          >
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{response}</p>
            {source && (
              <p className="text-xs text-light mt-2 opacity-60">
                Powered by {source === 'gemini' ? 'Google Gemini' : source === 'ai' ? 'AI' : 'rule-based analysis'}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="glass-light border border-red-500/30 p-3 rounded-lg mt-2">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
