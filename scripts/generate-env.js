const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get version from package.json
const packageJson = require('../package.json');
const version = packageJson.version;

// Get current build time
const buildTime = new Date().toISOString();

// Create .env.local file if it doesn't exist
const envLocalPath = path.join(__dirname, '..', '.env.local');

let envContent = '';

if (fs.existsSync(envLocalPath)) {
  // Read existing content
  envContent = fs.readFileSync(envLocalPath, 'utf8');
  
  // Update version and build time
  envContent = envContent
    .replace(/NEXT_PUBLIC_APP_VERSION=.*/g, `NEXT_PUBLIC_APP_VERSION=${version}`)
    .replace(/NEXT_PUBLIC_BUILD_TIME=.*/g, `NEXT_PUBLIC_BUILD_TIME=${buildTime}`);
} else {
  // Create new content with default values
  envContent = `# App Configuration
NEXT_PUBLIC_APP_VERSION=${version}
NEXT_PUBLIC_BUILD_TIME=${buildTime}

# Upstash Redis Configuration (required for production)
# UPSTASH_URL=your-upstash-url
# UPSTASH_TOKEN=your-upstash-token

# Admin Configuration
# ADMIN_PASSWORD=your-admin-password

# Crust Network Configuration (optional)
# CRUST_TOKEN=your-crust-token
`;
}

// Write updated content
fs.writeFileSync(envLocalPath, envContent);

console.log('✅ Environment variables generated successfully!');
console.log(`Version: ${version}`);
console.log(`Build Time: ${buildTime}`);
