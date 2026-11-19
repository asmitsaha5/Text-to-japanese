const kuromoji = require('kuromoji');
const path = require('path');

const DIC_PATH = path.join(__dirname, '..', 'node_modules', 'kuromoji', 'dict');

function katakanaToHiragana(src) {
  return src.replace(/[\u30a1-\u30f6]/g, match => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

function initTokenizer() {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: DIC_PATH }).build((err, tokenizer) => {
      if (err) return reject(err);
      resolve(tokenizer);
    });
  });
}

async function tokenizeAndFurigana(text, tokenizer) {
  const tokens = tokenizer.tokenize(text);
  
  // Build ruby HTML and Anki bracket furigana
  let rubyHtml = '';
  let bracketFurigana = '';
  let hiraganaSentence = '';

  for (const token of tokens) {
    const surface = token.surface_form;
    const reading = token.reading ? katakanaToHiragana(token.reading) : surface;
    
    // Check if token contains Kanji
    const hasKanji = /[\u4e00-\u9faf]/.test(surface);

    if (hasKanji && reading) {
      rubyHtml += `<ruby>${surface}<rt>${reading}</rt></ruby>`;
      bracketFurigana += ` ${surface}[${reading}]`;
      hiraganaSentence += reading;
    } else {
      rubyHtml += surface;
      bracketFurigana += surface;
      hiraganaSentence += surface;
    }
  }

  return {
    original: text,
    bracketFurigana: bracketFurigana.trim(),
    rubyHtml,
    hiragana: hiraganaSentence,
    tokens: tokens.map(t => ({
      word: t.surface_form,
      basic_form: t.basic_form,
      pos: t.pos,
      reading: t.reading ? katakanaToHiragana(t.reading) : null
    }))
  };
}

module.exports = {
  initTokenizer,
  tokenizeAndFurigana
};

// Test if run directly
if (require.main === module) {
  (async () => {
    const tokenizer = await initTokenizer();
    const result = await tokenizeAndFurigana('こんにちは！日本語の勉強を始めましょう。アニメが大好きです。', tokenizer);
    console.log('Result:', JSON.stringify(result, null, 2));
  })();
}
