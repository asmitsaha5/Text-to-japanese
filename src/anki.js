const fs = require('fs');
const path = require('path');
const AnkiExport = require('anki-apkg-export').default || require('anki-apkg-export');

const CARD_CSS = `
.card {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
  font-size: 20px;
  text-align: center;
  color: #1e293b;
  background-color: #f8fafc;
  padding: 24px;
  line-height: 1.6;
}
.dark .card, [data-theme="dark"] .card {
  color: #f1f5f9;
  background-color: #0f172a;
}
.japanese-expression {
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
}
.dark .japanese-expression, [data-theme="dark"] .japanese-expression {
  color: #f8fafc;
}
ruby {
  ruby-align: center;
}
rt {
  font-size: 0.55em;
  color: #6366f1;
  font-weight: 500;
}
.dark rt, [data-theme="dark"] rt {
  color: #818cf8;
}
.english-meaning {
  font-size: 20px;
  color: #475569;
  margin-top: 14px;
  font-weight: 500;
}
.dark .english-meaning, [data-theme="dark"] .english-meaning {
  color: #cbd5e1;
}
.vocab-box {
  margin-top: 20px;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  text-align: left;
  font-size: 15px;
}
.dark .vocab-box, [data-theme="dark"] .vocab-box {
  background: #1e293b;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.vocab-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  margin-bottom: 6px;
}
.vocab-tag {
  display: inline-block;
  background: #e0e7ff;
  color: #3730a3;
  padding: 2px 8px;
  border-radius: 4px;
  margin: 2px 4px 2px 0;
  font-size: 13px;
}
.dark .vocab-tag, [data-theme="dark"] .vocab-tag {
  background: #312e81;
  color: #c7d2fe;
}
.badge-anime {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 9999px;
  background: #fbcfe8;
  color: #9d174d;
  margin-bottom: 12px;
}
`;

/**
 * Creates an Anki .apkg deck from processed Japanese sentences
 * @param {string} deckName - Name of the deck
 * @param {Array<object>} items - List of processed sentence items
 * @param {string} outputPath - Path to save the .apkg file
 */
async function createDeck(deckName, items, outputPath) {
  const apkg = await AnkiExport.create(deckName, {
    css: CARD_CSS
  });

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const audioFilename = `audio_${i + 1}_${Date.now()}.mp3`;

    // Embed audio binary into the deck package
    if (item.audioBuffer) {
      apkg.addMedia(audioFilename, item.audioBuffer);
    }

    // Build Vocab HTML
    let vocabHtml = '';
    if (item.vocab && item.vocab.length > 0) {
      const uniqueVocab = [];
      const seen = new Set();
      for (const v of item.vocab) {
        if (!seen.has(v.word)) {
          seen.add(v.word);
          uniqueVocab.push(v);
        }
      }

      const tags = uniqueVocab.map(v => 
        `<span class="vocab-tag">${v.word}${v.reading ? ` (${v.reading})` : ''}</span>`
      ).join(' ');

      vocabHtml = `
        <div class="vocab-box">
          <div class="vocab-title">Vocabulary Breakdown</div>
          ${tags}
        </div>
      `;
    }

    // Front: Expression + Audio prompt
    const front = `
      <div class="badge-anime">Anime Listening Practice</div>
      <div class="japanese-expression">${item.original}</div>
      [sound:${audioFilename}]
    `;

    // Back: Furigana reading + English Translation + Vocab
    const back = `
      <div class="japanese-expression">${item.rubyHtml || item.original}</div>
      <div class="english-meaning">${item.translation}</div>
      ${vocabHtml}
    `;

    apkg.addCard(front, back, { tags: ['anime-immersion', 'japanese-recognition'] });
  }

  const zip = await apkg.save();
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, zip, 'binary');
  return outputPath;
}

module.exports = {
  createDeck,
  CARD_CSS
};
