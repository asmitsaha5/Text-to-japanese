const kuromoji = require('kuromoji');
const path = require('path');

const DIC_PATH = path.join(__dirname, '..', 'node_modules', 'kuromoji', 'dict');

function katakanaToHiragana(src) {
  if (!src) return '';
  return src.replace(/[\u30a1-\u30f6]/g, match => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

let tokenizerInstance = null;
let tokenizerInitPromise = null;

function getTokenizer() {
  if (tokenizerInstance) return Promise.resolve(tokenizerInstance);
  if (!tokenizerInitPromise) {
    tokenizerInitPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: DIC_PATH }).build((err, tokenizer) => {
        if (err) return reject(err);
        tokenizerInstance = tokenizer;
        resolve(tokenizer);
      });
    });
  }
  return tokenizerInitPromise;
}

/**
 * Analyzes Japanese text, generating Furigana (HTML and Anki bracket syntax)
 * and extracting vocabulary words.
 * @param {string} text 
 * @returns {Promise<object>}
 */
async function analyzeSentence(text) {
  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);

  let rubyHtml = '';
  let bracketFurigana = '';
  let hiraganaOnly = '';
  const vocabWords = [];

  for (const token of tokens) {
    const surface = token.surface_form;
    const reading = token.reading ? katakanaToHiragana(token.reading) : surface;
    const hasKanji = /[\u4e00-\u9faf]/.test(surface);

    if (hasKanji && reading) {
      rubyHtml += `<ruby>${surface}<rt>${reading}</rt></ruby>`;
      bracketFurigana += ` ${surface}[${reading}]`;
      hiraganaOnly += reading;
    } else {
      rubyHtml += surface;
      bracketFurigana += surface;
      hiraganaOnly += surface;
    }

    // Collect meaningful vocabulary words (Nouns, Verbs, Adjectives, Adverbs)
    if (['名詞', '動詞', '形容詞', '副詞'].includes(token.pos) && surface.length > 0) {
      vocabWords.push({
        word: surface,
        dictionaryForm: token.basic_form !== '*' ? token.basic_form : surface,
        pos: token.pos,
        reading: token.reading ? katakanaToHiragana(token.reading) : ''
      });
    }
  }

  return {
    original: text,
    bracketFurigana: bracketFurigana.trim(),
    rubyHtml,
    hiragana: hiraganaOnly,
    vocab: vocabWords
  };
}

module.exports = {
  getTokenizer,
  analyzeSentence,
  katakanaToHiragana
};
