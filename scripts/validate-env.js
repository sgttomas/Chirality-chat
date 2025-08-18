#!/usr/bin/env node
/**
 * Environment Validation Script
 * 
 * Validates that all required environment variables are properly configured
 * for the Chirality Chat application. Checks both .env.local and process.env
 * for required and optional configuration values.
 */

require('dotenv').config({ path: '.env.local' });

// Check if running in CI environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Environment configuration requirements
const ENV_CONFIG = {
  required: {
    OPENAI_API_KEY: {
      description: 'OpenAI API key for LLM calls',
      validation: (value) => {
        if (!value) {
          if (isCI) return null; // Allow missing in CI
          return 'Missing required OpenAI API key';
        }
        if (!value.startsWith('sk-')) return 'OpenAI API key should start with sk-';
        if (value.length < 20) return 'OpenAI API key appears to be too short';
        return null;
      }
    }
  },
  optional: {
    OPENAI_MODEL: {
      description: 'OpenAI model to use (defaults to gpt-4.1-nano)',
      default: 'gpt-4.1-nano',
      validation: (value) => {
        if (value && !value.includes('gpt')) {
          return 'Warning: Model should typically be a GPT variant';
        }
        return null;
      }
    },
    NEXT_PUBLIC_APP_NAME: {
      description: 'Public app name displayed in UI',
      default: 'Chirality Chat',
      validation: null
    },
    NEXT_PUBLIC_DEBUG: {
      description: 'Enable debug mode (0 or 1)',
      default: '0',
      validation: (value) => {
        if (value && !['0', '1', 'true', 'false'].includes(value.toLowerCase())) {
          return 'Debug flag should be 0, 1, true, or false';
        }
        return null;
      }
    },
    NEO4J_URI: {
      description: 'Neo4j database URI (optional, for legacy GraphQL features)',
      validation: (value) => {
        if (value && !value.startsWith('neo4j')) {
          return 'Neo4j URI should start with neo4j:// or neo4j+s://';
        }
        return null;
      }
    },
    NEO4J_USER: {
      description: 'Neo4j database username',
      validation: null
    },
    NEO4J_PASSWORD: {
      description: 'Neo4j database password',
      validation: null
    },
    NODE_ENV: {
      description: 'Node.js environment (development, production, test)',
      default: 'development',
      validation: (value) => {
        if (value && !['development', 'production', 'test'].includes(value)) {
          return 'NODE_ENV should be development, production, or test';
        }
        return null;
      }
    }
  }
};

/**
 * Validate a single environment variable
 */
function validateEnvVar(name, config, value) {
  const result = {
    name,
    value: value || null,
    configured: !!value,
    valid: true,
    message: null,
    warning: null
  };

  if (config.validation) {
    const validationResult = config.validation(value);
    if (validationResult) {
      if (validationResult.startsWith('Warning:')) {
        result.warning = validationResult;
      } else {
        result.valid = false;
        result.message = validationResult;
      }
    }
  }

  // Check if using default
  if (!value && config.default) {
    result.value = config.default;
    result.message = `Using default: ${config.default}`;
  }

  return result;
}

/**
 * Check if .env.local file exists and is readable
 */
function checkEnvFile() {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    fs.accessSync(envPath, fs.constants.R_OK);
    return { exists: true, path: envPath };
  } catch (error) {
    return { exists: false, path: envPath, error: error.message };
  }
}

/**
 * Get Node.js and npm version information
 */
function getSystemInfo() {
  const nodeVersion = process.version;
  
  let npmVersion = 'unknown';
  try {
    const { execSync } = require('child_process');
    npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  } catch (error) {
    npmVersion = 'not available';
  }

  return { nodeVersion, npmVersion };
}

/**
 * Main validation function
 */
function validateEnvironment() {
  console.log('🔍 Environment Validation for Chirality Chat\n');

  // Check system information
  const systemInfo = getSystemInfo();
  console.log('📋 System Information:');
  console.log(`   Node.js: ${systemInfo.nodeVersion}`);
  console.log(`   npm: ${systemInfo.npmVersion}`);
  if (isCI) {
    console.log('   🤖 Running in CI environment');
  }
  
  // Check if we meet minimum requirements
  const nodeVersionNumber = parseFloat(systemInfo.nodeVersion.slice(1));
  if (nodeVersionNumber < 18) {
    console.log('   ⚠️  Warning: Node.js 18+ recommended (current: ' + systemInfo.nodeVersion + ')');
  }
  console.log();

  // Check .env.local file
  const envFile = checkEnvFile();
  console.log('📁 Environment File:');
  if (envFile.exists) {
    console.log(`   ✅ .env.local found at ${envFile.path}`);
  } else {
    console.log(`   ⚠️  .env.local not found (looked at ${envFile.path})`);
    console.log('   💡 Create .env.local with required environment variables');
  }
  console.log();

  let hasErrors = false;
  let hasWarnings = false;

  // Validate required environment variables
  console.log('🔧 Required Environment Variables:');
  for (const [name, config] of Object.entries(ENV_CONFIG.required)) {
    const result = validateEnvVar(name, config, process.env[name]);
    
    if (result.configured && result.valid) {
      console.log(`   ✅ ${name}: configured`);
    } else if (result.configured && !result.valid) {
      console.log(`   ❌ ${name}: ${result.message}`);
      hasErrors = true;
    } else {
      if (isCI) {
        console.log(`   ⚠️  ${name}: missing in CI (${config.description})`);
        hasWarnings = true;
      } else {
        console.log(`   ❌ ${name}: missing (${config.description})`);
        hasErrors = true;
      }
    }
  }
  console.log();

  // Validate optional environment variables
  console.log('⚙️  Optional Environment Variables:');
  for (const [name, config] of Object.entries(ENV_CONFIG.optional)) {
    const result = validateEnvVar(name, config, process.env[name]);
    
    if (result.configured && result.valid) {
      console.log(`   ✅ ${name}: ${result.value}`);
    } else if (result.configured && !result.valid) {
      console.log(`   ⚠️  ${name}: ${result.message}`);
      hasWarnings = true;
    } else if (result.message) {
      console.log(`   ℹ️  ${name}: ${result.message}`);
    } else {
      console.log(`   ➖ ${name}: not set (${config.description})`);
    }
    
    if (result.warning) {
      console.log(`   ⚠️  ${name}: ${result.warning}`);
      hasWarnings = true;
    }
  }
  console.log();

  // Summary
  console.log('📊 Validation Summary:');
  if (!hasErrors && !hasWarnings) {
    console.log('   🎉 All environment variables are properly configured!');
    return true;
  } else if (!hasErrors && hasWarnings) {
    console.log('   ⚠️  Configuration has warnings but should work');
    console.log('   💡 Consider addressing the warnings above');
    return true;
  } else {
    console.log('   ❌ Configuration has errors that must be fixed');
    console.log('   🔧 Please set the required environment variables');
    return false;
  }
}

/**
 * Provide setup instructions
 */
function showSetupInstructions() {
  console.log('\n📝 Setup Instructions:');
  console.log('1. Create .env.local file in the project root');
  console.log('2. Add the following required variables:');
  console.log('');
  console.log('   OPENAI_API_KEY=your-openai-api-key-here');
  console.log('');
  console.log('3. Optional variables (see .env.example for complete list):');
  console.log('   OPENAI_MODEL=gpt-4.1-nano');
  console.log('   NEXT_PUBLIC_APP_NAME=Chirality Chat');
  console.log('   NEXT_PUBLIC_DEBUG=0');
  console.log('');
  console.log('4. Get your OpenAI API key from: https://platform.openai.com/api-keys');
  console.log('5. Run this validation script again: npm run env:check');
}

// Main execution
if (require.main === module) {
  const isValid = validateEnvironment();
  
  if (!isValid) {
    showSetupInstructions();
    process.exit(1);
  }
  
  console.log('\n✅ Environment validation completed successfully!');
  console.log('🚀 You can now run: npm run dev');
}

module.exports = { validateEnvironment, ENV_CONFIG };