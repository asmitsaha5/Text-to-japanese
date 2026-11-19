const fs = require('fs');
const path = require('path');
const { synthesizeSpeech } = require('./tts');
const { translateToEnglish } = require('./translator');
const { analyzeSentence } = require('./analyzer');
const { createDeck } = require('./anki');

/**
 * Clean and parse raw input text (e.g. from subtitle files or pasted sentences).
 * Removes timestamps, line numbers, and empty lines.
 * @param {string} rawText 
 * @returns {Array<string>} Array of clean Japanese lines
 */
function parseRawLines(rawText) {
  if (!rawText) return [];

  // Remove ASS/SRT formatting if present
  const lines = rawText.split(/\r?\n/);
  const cleanLines = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Skip numeric subtitle indices
    if (/^\d+$/.test(line)) continue;

    // Skip SRT timestamps (e.g. 00:01:20,000 --> 00:01:23,000)
    if (line.includes('-->')) continue;

    // Skip ASS dialogue header prefix (e.g. Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,)
    if (line.startsWith('Dialogue:')) {
      const parts = line.split(',');
      if (parts.length >= 10) {
        line = parts.slice(9).join(',').trim();
      }
    }

    // Remove ASS tags like {\an8}, {\pos(x,y)}, etc.
    line = line.replace(/\{[^}]+\}/g, '').trim();

    // Only keep lines that have Japanese characters (Hiragana, Katakana, or Kanji)
    if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(line)) {
      cleanLines.push(line);
    }
  }

  // Deduplicate consecutive identical lines
  return cleanLines.filter((line, idx, arr) => idx === 0 || line !== arr[idx - 1]);
}

/**
 * Process a set of Japanese sentences through the entire pipeline:
 * Analysis -> Translation -> Audio Synthesis -> Anki Deck Generation
 * 
 * @param {string|Array<string>} input - Raw text or array of sentences
 * @param {object} options - Options { deckName, voiceKey, speakingRate, onProgress }
 */
async function processPipeline(input, options = {}) {
  const sentences = Array.isArray(input) ? input : parseRawLines(input);
  const deckName = options.deckName || 'Anime Immersion Listening Deck';
  const voiceKey = options.voiceKey || 'neural2-female';
  const speakingRate = options.speakingRate || 0.95;

  if (sentences.length === 0) {
    throw new Error('No Japanese text detected in input.');
  }

  console.log(`\n🎌 Starting Pipeline for ${sentences.length} Japanese sentences...`);

  const results = [];
  const outputAudioDir = path.join(__dirname, '..', 'output', 'audio');
  fs.mkdirSync(outputAudioDir, { recursive: true });

  for (let i = 0; i < sentences.length; i++) {
    const text = sentences[i];
    console.log(`[${i + 1}/${sentences.length}] Processing: "${text}"`);

    // 1. Analyze Furigana & Vocab
    const analysis = await analyzeSentence(text);

    // 2. Translate to English
    let translation = '';
    try {
      translation = await translateToEnglish(text);
    } catch (err) {
      console.warn(`⚠️ Translation warning for "${text}":`, err.message);
      translation = '(Translation unavailable)';
    }

    // 3. Synthesize Speech Audio (MP3)
    let audioBuffer = null;
    const audioFilename = `sentence_${String(i + 1).padStart(3, '0')}.mp3`;
    const audioFilePath = path.join(outputAudioDir, audioFilename);

    try {
      audioBuffer = await synthesizeSpeech(text, { voiceKey, speakingRate });
      fs.writeFileSync(audioFilePath, audioBuffer);
    } catch (err) {
      console.warn(`⚠️ TTS warning for "${text}":`, err.message);
    }

    const item = {
      index: i + 1,
      original: text,
      bracketFurigana: analysis.bracketFurigana,
      rubyHtml: analysis.rubyHtml,
      hiragana: analysis.hiragana,
      vocab: analysis.vocab,
      translation,
      audioFilename,
      audioFilePath,
      audioBuffer
    };

    results.push(item);

    if (typeof options.onProgress === 'function') {
      options.onProgress({ current: i + 1, total: sentences.length, item });
    }
  }

  // 4. Generate Anki Deck (.apkg)
  const safeDeckFileName = deckName.replace(/[^a-zA-Z0-9_\-\u3040-\u30ff\u4e00-\u9faf]/g, '_');
  const deckOutputPath = path.join(__dirname, '..', 'output', `${safeDeckFileName}.apkg`);

  console.log(`📦 Packaging Anki deck: ${deckOutputPath}...`);
  await createDeck(deckName, results, deckOutputPath);

  console.log(`🎉 Pipeline complete! Generated ${results.length} cards with audio.`);

  return {
    deckName,
    deckPath: deckOutputPath,
    items: results
  };
}

module.exports = {
  parseRawLines,
  processPipeline
};
