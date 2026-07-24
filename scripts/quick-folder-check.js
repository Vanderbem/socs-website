const fs = require('fs');
const { google } = require('googleapis');

async function quickFolderCheck() {
  try {
    // Read just the first few lines of CSV
    const csvPath = '/Users/ian/Desktop/socs_website/csv_data/FINALIZED CT Lessons Tracker  - 2024-2025.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(0, 6); // First 5 rows + header
    
    console.log('📄 First few lines of CSV:');
    lines.forEach((line, index) => {
      console.log(`Row ${index}: ${line.substring(0, 100)}...`);
    });
    
    // Set up Google Drive API
    const auth = new google.auth.GoogleAuth({
      keyFile: '/Users/ian/Desktop/socs_website/socs4all-e896217ba3d5.json',
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ]
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Test with just one folder
    const testFolderId = '14DVs3l3twBFd43iud8Qfd8RHGRlzYN4e'; // From first lesson
    
    console.log('\n🔍 Testing access to one folder...');
    console.log(`Folder ID: ${testFolderId}`);
    
    try {
      // First, try to get folder metadata
      const folderInfo = await drive.files.get({
        fileId: testFolderId,
        fields: 'id,name,mimeType,permissions'
      });
      
      console.log('✅ Folder metadata retrieved:');
      console.log(`  Name: ${folderInfo.data.name}`);
      console.log(`  Type: ${folderInfo.data.mimeType}`);
      
      // Then try to list contents
      const response = await drive.files.list({
        q: `'${testFolderId}' in parents and trashed=false`,
        fields: 'files(id,name,mimeType,size,webViewLink)',
        pageSize: 10
      });
      
      const files = response.data.files || [];
      console.log(`\n📁 Folder contents (${files.length} files):`);
      
      if (files.length === 0) {
        console.log('  🚫 No files found - this could mean:');
        console.log('     • Folder is genuinely empty');
        console.log('     • Service account lacks permission to see contents');
        console.log('     • Files are in subfolders');
      } else {
        files.forEach(file => {
          console.log(`  📄 ${file.name} (${file.mimeType})`);
        });
      }
      
      // Check what email the service account is using
      const authClient = await auth.getClient();
      console.log(`\n📧 Service account email: ${authClient.email || 'Unknown'}`);
      console.log('💡 Make sure this email has been granted access to the Google Drive folders');
      
    } catch (folderError) {
      console.error('❌ Error accessing folder:', folderError.message);
      if (folderError.code === 404) {
        console.log('  • Folder not found or no permission');
      } else if (folderError.code === 403) {
        console.log('  • Permission denied - share folder with service account');
      }
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

quickFolderCheck();