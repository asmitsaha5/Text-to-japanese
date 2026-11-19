const path = require('path');
const { v2: { Translate } } = require('@google-cloud/translate');

const KEY_FILE = path.join(__dirname, '..', 'google-credentials.json');
process.env.GOOGLE_APPLICATION_CREDENTIALS = KEY_FILE;

let translateClient = null;

function getClient() {
  if (!translateClient) {
    translateClient = new Translate();
  }
  return translateClient;
}

/**
 * Translates Japanese text into English.
 * @param {string} text - Japanese sentence
 * @returns {Promise<string>} English translation
 */
async function translateToEnglish(text) {
  if (!text || !text.trim()) return '';
  const client = getClient();
  const [translation] = await client.translate(text, { from: 'ja', to: 'en' });
  return translation;
}

module.exports = {
  translateToEnglish
};
