# 🎌 Anime Japanese Audio & Anki Immersion Generator

A language-learning tool for Japanese learners and anime watchers. It turns anime dialogue, subtitles, and Japanese sentences into:
1. **Studio-quality native Japanese audio** using Google Cloud Text-to-Speech (Neural2 / Wavenet).
2. **Interactive Furigana readings & Kanji breakdown** using morphological analysis (Kuromoji).
3. **Accurate English translations** powered by Google Cloud Translation.
4. **Ready-to-import Anki Decks (`.apkg`)** with embedded audio and cards modeled after the popular Core 2k/6k Japanese Recognition deck.

---

## ⚡ Quick Start

### 1. Start the Local Web App
```bash
npm start
```
Open your browser at: **[http://localhost:3000](http://localhost:3000)**

### 2. Run Tests
- **Test Google Cloud Connection (TTS + Translation):**
  ```bash
  npm test
  ```
- **Test Full Anime Pipeline & Anki Export:**
  ```bash
  npm run test:pipeline
  ```

---

## 🚀 Features

- **Google Cloud Neural2 Audio**: High-fidelity Japanese native voices (Female & Male protagonist styles) with adjustable speaking speed for learners (e.g. `0.95x`).
- **Furigana & Ruby Annotations**: Automatically attaches Hiragana readings above/beside Kanji (`勉強[べんきょう]`).
- **One-Click Anki Deck Export (`.apkg`)**: Audio MP3 files are packaged directly inside the deck—just double-click the file to import into Anki on Desktop, AnkiMobile (iOS), or AnkiDroid (Android).
- **Subtitle Ingestion**: Paste `.srt` or `.ass` subtitle files; the app automatically strips timestamps and line numbers to extract clean Japanese dialogue.
- **Vocabulary Extraction**: Highlights key nouns, verbs, and adjectives for each sentence.

---

## 📁 Project Architecture

- `src/server.js` - Express backend serving the web application and API endpoints.
- `src/pipeline.js` - Main pipeline coordinating text cleaning, analysis, translation, audio synthesis, and Anki packaging.
- `src/tts.js` - Google Cloud Text-to-Speech integration with voice selection (`Neural2`, `Wavenet`).
- `src/translator.js` - Google Cloud Translation API integration.
- `src/analyzer.js` - Japanese morphological parser (Kuromoji) for Furigana and vocabulary extraction.
- `src/anki.js` - Anki `.apkg` deck generator styled for Japanese recognition.
- `public/index.html` - Interactive web interface.
- `output/` - Generated `.apkg` decks and audio files.
