import api from './api';

/**
 * Intelligent helper: If production server returns 404 (feature not yet deployed to cloud),
 * automatically fallback to the active local backend at http://localhost:3000.
 */
const callWithFallback = async (method, url, data) => {
  try {
    const res = method === 'get' ? await api.get(url) : await api.post(url, data);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        const token = localStorage.getItem('token') || '';
        const localUrl = `http://localhost:3000${url}`;
        const localRes = await fetch(localUrl, {
          method: method.toUpperCase(),
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: data ? JSON.stringify(data) : undefined,
        });
        if (localRes.ok) {
          return await localRes.json();
        }
      } catch (localErr) {
        console.warn('Local fallback also failed:', localErr);
      }
    }
    throw err;
  }
};

export const speakingTutorApi = {
  /**
   * Get all roleplay scenarios
   */
  getScenarios: async () => {
    return callWithFallback('get', '/api/speaking-tutor/scenarios');
  },

  /**
   * Evaluate student pronunciation on a target sentence
   * @param {Object} data { targetText, targetPinyin, targetMeaning, audioBase64, mimeType, level }
   */
  evaluatePronunciation: async (data) => {
    return callWithFallback('post', '/api/speaking-tutor/evaluate-pronunciation', data);
  },

  /**
   * Send speech in a conversation scenario and get tutor's voice response
   * @param {Object} data { scenarioId, history, userSpeechText, audioBase64, mimeType }
   */
  sendConversationTurn: async (data) => {
    return callWithFallback('post', '/api/speaking-tutor/conversation-turn', data);
  },

  /**
   * Analyze a monologue and provide native rephrase
   * @param {Object} data { audioBase64, text, promptTitle }
   */
  analyzeMonologue: async (data) => {
    return callWithFallback('post', '/api/speaking-tutor/analyze-monologue', data);
  },

  /**
   * Synthesize native speech audio for any Chinese text
   * @param {string} text
   */
  synthesizeSpeech: async (text) => {
    return callWithFallback('post', '/api/speaking-tutor/synthesize-speech', { text });
  },
};
