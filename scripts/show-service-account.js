const fs = require('fs');

// Read the service account credentials
const credentialsPath = '/Users/ian/Desktop/socs_website/socs4all-e896217ba3d5.json';
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

console.log('🔑 Service Account Information:');
console.log(`📧 Email: ${credentials.client_email}`);
console.log(`🏷️  Project ID: ${credentials.project_id}`);
console.log(`🔐 Private Key ID: ${credentials.private_key_id.substring(0, 8)}...`);

console.log('\n📋 To grant access to Google Drive folders:');
console.log('1. Open each Google Drive folder');
console.log('2. Click "Share" button');
console.log(`3. Add this email: ${credentials.client_email}`);
console.log('4. Give it "Viewer" permissions');
console.log('5. Click "Send"');

console.log('\n💡 Alternative approach:');
console.log('- Move all folders to a single parent folder');
console.log('- Share just that parent folder with the service account');
console.log('- The service account will inherit access to all subfolders');

// Show folder count from CSV
const csvPath = '/Users/ian/Desktop/socs_website/csv_data/FINALIZED CT Lessons Tracker  - 2024-2025.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

console.log(`\n📊 You have ${lines.length - 1} lessons to process`);
console.log('This would require sharing many individual folders, so the parent folder approach is recommended.');