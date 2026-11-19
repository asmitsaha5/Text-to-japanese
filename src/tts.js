const fs = require('fs');
const path = require('path');
const textToSpeech = require('@google-cloud/text-to-speech');

const KEY_FILE = path.join(__dirname, '..', 'google-credentials.json');
process.env.GOOGLE_APPLICATION_CREDENTIALS = KEY_FILE;

let ttsClient = null;

function getClient() {
  if (!ttsClient) {
    ttsClient = new textToSpeech.TextToSpeechClient();
  }
  return ttsClient;
}

const AVAILABLE_VOICES = {
  'neural2-female': {
    name: 'ja-JP-Neural2-B',
    gender: 'FEMALE',
    label: 'Japanese Female (Neural2 - Natural & Clear)'
  },
  'neural2-male': {
    name: 'ja-JP-Neural2-C',
    gender: 'MALE',
    label: 'Japanese Male (Neural2 - Anime Protagonist Style)'
  },
  'wavenet-female': {
    name: 'ja-JP-Wavenet-A',
    gender: 'FEMALE',
    label: 'Japanese Female (Wavenet)'
  },
  'wavenet-male': {
    name: 'ja-JP-Wavenet-C',
    gender: 'MALE',
    label: 'Japanese Male (Wavenet)'
  }
};

/**
 * Synthesizes Japanese text into an MP3 buffer.
 * @param {string} text - Japanese text to speak
 * @param {object} options - Voice options { voiceKey, speakingRate, pitch }
 * @returns {Promise<Buffer>} MP3 audio buffer
 */
async function synthesizeSpeech(text, options = {}) {
  const client = getClient();
  const voiceKey = options.voiceKey || 'neural2-female';
  const voiceConfig = AVAILABLE_VOICES[voiceKey] || AVAILABLE_VOICES['neural2-female'];
  const speakingRate = options.speakingRate || 0.95; // 0.95 is optimal for language learners
  const pitch = options.pitch || 0.0;

  const request = {
    input: { text },
    voice: {
      languageCode: 'ja-JP',
      name: voiceConfig.name,
      ssmlGender: voiceConfig.gender,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate,
      pitch,
    },
  };

  const [response] = await client.synthesizeSpeech(request);
  return Buffer.from(response.audioContent);
}

module.exports = {
  synthesizeSpeech,
  AVAILABLE_VOICES
};
