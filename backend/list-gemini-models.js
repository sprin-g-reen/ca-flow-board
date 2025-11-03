import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
  console.error('❌ GEMINI_API_KEY not set in .env file');
  process.exit(1);
}

console.log('🔑 Using API Key:', API_KEY.substring(0, 20) + '...');
console.log('');
console.log('📋 Fetching available Gemini models...');
console.log('');

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  try {
    // List all available models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error fetching models:', error);
      process.exit(1);
    }
    
    const data = await response.json();
    
    if (!data.models || data.models.length === 0) {
      console.log('❌ No models found');
      return;
    }
    
    console.log(`✅ Found ${data.models.length} models:\n`);
    console.log('═'.repeat(80));
    
    // Filter for models that support generateContent
    const generateContentModels = data.models.filter(model => 
      model.supportedGenerationMethods?.includes('generateContent')
    );
    
    console.log('\n🎯 MODELS THAT SUPPORT generateContent (use these!):\n');
    
    generateContentModels.forEach((model, index) => {
      const modelName = model.name.replace('models/', '');
      console.log(`${index + 1}. ${modelName}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Description: ${model.description || 'N/A'}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log(`   Input Token Limit: ${model.inputTokenLimit?.toLocaleString() || 'N/A'}`);
      console.log(`   Output Token Limit: ${model.outputTokenLimit?.toLocaleString() || 'N/A'}`);
      console.log('');
    });
    
    console.log('═'.repeat(80));
    console.log('\n📝 RECOMMENDED MODELS FOR YOUR APP:\n');
    
    const recommended = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-1.0-pro-latest'
    ];
    
    const availableRecommended = generateContentModels.filter(m => 
      recommended.some(r => m.name.includes(r))
    );
    
    if (availableRecommended.length > 0) {
      availableRecommended.forEach((model, index) => {
        const modelName = model.name.replace('models/', '');
        console.log(`✨ ${index + 1}. ${modelName}`);
        console.log(`   ${model.description || model.displayName}`);
        console.log('');
      });
      
      console.log('═'.repeat(80));
      console.log('\n🚀 TO USE A MODEL:\n');
      console.log('1. Copy the model name (e.g., "gemini-1.5-flash")');
      console.log('2. Update your .env file:');
      console.log('   GEMINI_MODEL=gemini-1.5-flash');
      console.log('3. Restart your backend server');
      console.log('');
    }
    
    // Show other models
    const otherModels = data.models.filter(model => 
      !model.supportedGenerationMethods?.includes('generateContent')
    );
    
    if (otherModels.length > 0) {
      console.log('\n📋 OTHER MODELS (not for generateContent):\n');
      otherModels.forEach((model, index) => {
        const modelName = model.name.replace('models/', '');
        console.log(`${index + 1}. ${modelName}`);
        console.log(`   Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

listModels();
