const fs = require('fs');
const path = require('path');

const KEY_FILE = path.join(__dirname, '..', 'google-credentials.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'audio');

// Set Application Default Credentials environment variable
process.env.GOOGLE_APPLICATION_CREDENTIALS = KEY_FILE;

const textToSpeech = require('@google-cloud/text-to-speech');
const { v2: { Translate } } = require('@google-cloud/translate');

async function testConnection() {
  console.log('--- 🔍 Testing Google Cloud Connection ---');
  
  if (!fs.existsSync(KEY_FILE)) {
    console.error(`❌ Credentials file not found at: ${KEY_FILE}`);
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Test Text-to-Speech
  console.log('\n[1/2] Testing Google Cloud Text-to-Speech...');
  try {
    const ttsClient = new textToSpeech.TextToSpeechClient();
    const text = 'こんにちは！日本語の勉強を始めましょう。';
    
    const request = {
      input: { text },
      voice: {
        languageCode: 'ja-JP',
        name: 'ja-JP-Neural2-B', // High-fidelity female Japanese voice
        ssmlGender: 'FEMALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.95,
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    const audioPath = path.join(OUTPUT_DIR, 'test_greeting.mp3');
    fs.writeFileSync(audioPath, response.audioContent, 'binary');
    console.log(`✅ Text-to-Speech Success! Audio saved to: ${audioPath}`);
  } catch (err) {
    console.error('❌ Text-to-Speech Error:', err.message);
    if (err.message.includes('API has not been used') || err.message.includes('disabled')) {
      console.log('👉 Make sure "Cloud Text-to-Speech API" is enabled in Google Cloud Console.');
    }
  }

  // 2. Test Cloud Translation
  console.log('\n[2/2] Testing Google Cloud Translation...');
  try {
    const translateClient = new Translate();
    const [translation] = await translateClient.translate('こんにちは！日本語の勉強を始めましょう。', 'en');
    console.log(`✅ Translation Success!`);
    console.log(`   Original: こんにちは！日本語の勉強を始めましょう。`);
    console.log(`   English : ${translation}`);
  } catch (err) {
    console.error('❌ Translation Error:', err.message);
    if (err.message.includes('API has not been used') || err.message.includes('disabled')) {
      console.log('👉 Make sure "Cloud Translation API" is enabled in Google Cloud Console.');
    }
  }

  console.log('\n--- 🎉 Test Finished ---');
}

testConnection();
