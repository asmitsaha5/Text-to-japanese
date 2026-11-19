const fs = require('fs');
const path = require('path');
const AnkiExport = require('anki-apkg-export').default || require('anki-apkg-export');

async function testAnkiExport() {
  const apkg = await AnkiExport.create('Anime Japanese Test Deck');

  // Add media file if test audio exists
  const audioPath = path.join(__dirname, '..', 'output', 'audio', 'test_greeting.mp3');
  if (fs.existsSync(audioPath)) {
    apkg.addMedia('test_greeting.mp3', fs.readFileSync(audioPath));
  }

  // Add card
  apkg.addCard(
    'こんにちは！ 日本語[にほんご]の 勉強[べんきょう]を 始め[はじめ]ましょう。<br>[sound:test_greeting.mp3]',
    'Hello! Let\'s start learning Japanese.'
  );

  const zip = await apkg.save();
  const outputPath = path.join(__dirname, '..', 'output', 'Anime_Japanese_Test.apkg');
  fs.writeFileSync(outputPath, zip, 'binary');
  console.log(`✅ Anki deck (.apkg) exported successfully to: ${outputPath}`);
}

testAnkiExport().catch(err => {
  console.error('❌ Error exporting deck:', err);
});
