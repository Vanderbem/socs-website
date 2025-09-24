const fs = require('fs');
const path = require('path');
const { analyzeFolderContents, extractFolderIdFromUrl } = require('./read-folder-contents');

// This script would read actual Google Drive folder contents
// You'll need to install: npm install googleapis
// And set up Google Drive API credentials

/*
To use this script:
1. Go to Google Cloud Console
2. Enable Google Drive API
3. Create credentials (Service Account or OAuth2)
4. Download the credentials JSON file
5. Set the path below or use environment variables

Example setup:
npm install googleapis
export GOOGLE_CREDENTIALS_PATH="/path/to/your/credentials.json"
*/

async function readGoogleDriveFolders() {
  try {
    // Check if googleapis is available
    let drive;
    try {
      const { google } = require('googleapis');
      
      // Set up authentication
      const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || '/Users/ian/Desktop/socs_website/socs4all-e896217ba3d5.json';
      
      if (!fs.existsSync(credentialsPath)) {
        console.log('🔑 Google credentials not found.');
        console.log('To read actual folder contents, you need to:');
        console.log('1. Install googleapis: npm install googleapis');
        console.log('2. Set up Google Drive API credentials');
        console.log('3. Save credentials to google-credentials.json or set GOOGLE_CREDENTIALS_PATH');
        console.log('\\nRunning basic analysis instead...\\n');
        
        // Run the basic analysis
        return await analyzeFolderContents();
      }
      
      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });
      
      drive = google.drive({ version: 'v3', auth });
      console.log('🔑 Google Drive API authenticated successfully!');
      
    } catch (error) {
      console.log('📦 googleapis not installed. Install with: npm install googleapis');
      console.log('Running basic analysis instead...\\n');
      return await analyzeFolderContents();
    }
    
    // Get folder analysis first
    const analysis = await analyzeFolderContents();
    console.log('\\n\\n=== READING ACTUAL FOLDER CONTENTS ===\\n');
    
    const folderContents = {
      columnF: {},
      columnM: {}
    };
    
    // Read Column F folders
    console.log('Reading Column F folders (Updated lesson plans)...');
    for (const folder of analysis.foldersColumnF.urls) {
      try {
        console.log(`\\n📁 Reading folder: ${folder.title} (Row ${folder.row})`);
        const files = await listFolderContents(drive, folder.folderId);
        folderContents.columnF[folder.folderId] = {
          ...folder,
          files: files,
          fileCount: files.length
        };
        
        console.log(`   Found ${files.length} files:`);
        files.forEach(file => {
          console.log(`   - ${file.name} (${file.mimeType})`);
        });
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   ❌ Error reading folder ${folder.folderId}:`, error.message);
        folderContents.columnF[folder.folderId] = {
          ...folder,
          error: error.message
        };
      }
    }
    
    // Read Column M folders
    console.log('\\nReading Column M folders (Original lesson plans)...');
    for (const folder of analysis.foldersColumnM.urls) {
      try {
        console.log(`\\n📁 Reading folder: ${folder.title} (Row ${folder.row})`);
        const files = await listFolderContents(drive, folder.folderId);
        folderContents.columnM[folder.folderId] = {
          ...folder,
          files: files,
          fileCount: files.length
        };
        
        console.log(`   Found ${files.length} files:`);
        files.forEach(file => {
          console.log(`   - ${file.name} (${file.mimeType})`);
        });
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   ❌ Error reading folder ${folder.folderId}:`, error.message);
        folderContents.columnM[folder.folderId] = {
          ...folder,
          error: error.message
        };
      }
    }
    
    // Save detailed results
    const outputPath = path.join(__dirname, 'google-drive-contents.json');
    const fullResults = {
      analysis: analysis,
      folderContents: folderContents,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(fullResults, null, 2));
    console.log(`\\n\\n📄 Detailed results saved to: ${outputPath}`);
    
    // Print summary
    const totalColumnF = Object.keys(folderContents.columnF).length;
    const successColumnF = Object.values(folderContents.columnF).filter(f => !f.error).length;
    const totalColumnM = Object.keys(folderContents.columnM).length;
    const successColumnM = Object.values(folderContents.columnM).filter(f => !f.error).length;
    
    console.log('\\n=== FOLDER READING SUMMARY ===');
    console.log(`Column F: ${successColumnF}/${totalColumnF} folders read successfully`);
    console.log(`Column M: ${successColumnM}/${totalColumnM} folders read successfully`);
    
    return fullResults;
    
  } catch (error) {
    console.error('❌ Error reading Google Drive folders:', error.message);
    process.exit(1);
  }
}

// Helper function to list folder contents
async function listFolderContents(drive, folderId) {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType,size,createdTime,modifiedTime)',
    pageSize: 100
  });
  
  return response.data.files || [];
}

// Run if called directly
if (require.main === module) {
  readGoogleDriveFolders().catch(console.error);
}

module.exports = { readGoogleDriveFolders };