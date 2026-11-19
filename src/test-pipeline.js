const { processPipeline } = require('./pipeline');

async function run() {
  const sampleJapanese = `
  諦めたらそこで試合終了ですよ。
  お前はもう死んでいる。
  海賊王に俺はなる！
  `;

  try {
    const result = await processPipeline(sampleJapanese, {
      deckName: 'Anime Classic Quotes Deck',
      voiceKey: 'neural2-female',
      speakingRate: 0.95
    });

    console.log('\n--- Output Summary ---');
    console.log(`Deck Path: ${result.deckPath}`);
    console.log(`Cards Created: ${result.items.length}`);
    for (const item of result.items) {
      console.log(`\nCard ${item.index}:`);
      console.log(`  Japanese:    ${item.original}`);
      console.log(`  Furigana:    ${item.bracketFurigana}`);
      console.log(`  English:     ${item.translation}`);
      console.log(`  Audio File:  ${item.audioFilename}`);
      console.log(`  Vocab Words: ${item.vocab.map(v => v.word).join(', ')}`);
    }
  } catch (err) {
    console.error('Pipeline failed:', err);
  }
}

run();
