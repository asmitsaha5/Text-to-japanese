const express = require('express');
const path = require('path');
const fs = require('fs');
const { processPipeline } = require('./pipeline');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve generated audio preview files
const audioDir = path.join(__dirname, '..', 'output', 'audio');
fs.mkdirSync(audioDir, { recursive: true });
app.use('/audio', express.static(audioDir));

// Process Japanese sentences
app.post('/api/process', async (req, res) => {
  try {
    const { rawText, deckName, voiceKey, speakingRate } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'Please enter Japanese text or dialogue.' });
    }

    const result = await processPipeline(rawText, {
      deckName: deckName || 'Anime Japanese Practice',
      voiceKey: voiceKey || 'neural2-female',
      speakingRate: parseFloat(speakingRate) || 0.95
    });

    const deckFilename = path.basename(result.deckPath);

    // Return items without heavy buffers to frontend
    const sanitizedItems = result.items.map(item => ({
      index: item.index,
      original: item.original,
      bracketFurigana: item.bracketFurigana,
      rubyHtml: item.rubyHtml,
      hiragana: item.hiragana,
      vocab: item.vocab,
      translation: item.translation,
      audioFilename: item.audioFilename
    }));

    res.json({
      success: true,
      deckName: result.deckName,
      deckFilename,
      items: sanitizedItems
    });
  } catch (err) {
    console.error('API Error in /api/process:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Download .apkg file
app.get('/api/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, '..', 'output', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Deck file not found.');
  }

  res.download(filePath, filename);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Anime Japanese Audio & Anki App is running!`);
  console.log(`🌐 Local Web UI: http://localhost:${PORT}\n`);
});
