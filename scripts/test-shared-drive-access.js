const { google } = require('googleapis');

async function testSharedDriveAccess() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: '/Users/ian/Desktop/socs_website/socs4all-e896217ba3d5.json',
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    });
    
    const drive = google.drive({ version: 'v3', auth });
    console.log('🔍 Testing Shared Drive access with manager permissions...');
    
    // Get shared drives again
    const sharedDrives = await drive.drives.list({
      pageSize: 100
    });
    
    console.log(`📂 Found ${sharedDrives.data.drives?.length || 0} Shared Drives`);
    
    for (const sharedDrive of sharedDrives.data.drives || []) {
      console.log(`\n--- Testing: ${sharedDrive.name} ---`);
      console.log(`Drive ID: ${sharedDrive.id}`);
      
      try {
        // List files in the shared drive
        const filesResponse = await drive.files.list({
          driveId: sharedDrive.id,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          corpora: 'drive',
          pageSize: 10,
          fields: 'files(id,name,mimeType,parents)'
        });
        
        const files = filesResponse.data.files || [];
        console.log(`✅ Can access drive - found ${files.length} items`);
        
        if (files.length > 0) {
          console.log('📁 Sample items:');
          files.slice(0, 5).forEach(file => {
            const type = file.mimeType.includes('folder') ? '📁' : '📄';
            console.log(`   ${type} ${file.name} (${file.id})`);
          });
          
          // Look specifically for our target folder
          const targetFolder = files.find(f => f.id === '1vpqclwGsQ-NzKch4uMm4UZuV_k93eNBQ');
          if (targetFolder) {
            console.log(`🎯 Found target folder: ${targetFolder.name}`);
            
            // Try to list its contents
            const folderContents = await drive.files.list({
              q: `'${targetFolder.id}' in parents and trashed=false`,
              driveId: sharedDrive.id,
              includeItemsFromAllDrives: true,
              supportsAllDrives: true,
              fields: 'files(id,name,mimeType,size)',
              pageSize: 50
            });
            
            const contents = folderContents.data.files || [];
            console.log(`📄 Target folder contents: ${contents.length} files`);
            contents.forEach(file => {
              console.log(`      - ${file.name} (${file.mimeType})`);
            });
          } else {
            // Search for folders that might contain our target
            console.log('🔎 Searching for target folder in subfolders...');
            const searchResponse = await drive.files.list({
              q: `'1vpqclwGsQ-NzKch4uMm4UZuV_k93eNBQ' in parents`,
              driveId: sharedDrive.id,
              includeItemsFromAllDrives: true,
              supportsAllDrives: true,
              fields: 'files(id,name,mimeType)',
              pageSize: 10
            });
            
            const searchResults = searchResponse.data.files || [];
            console.log(`🔍 Found ${searchResults.length} items in target folder`);
            searchResults.forEach(file => {
              console.log(`      - ${file.name} (${file.mimeType})`);
            });
          }
        }
        
      } catch (error) {
        console.error(`❌ Error accessing ${sharedDrive.name}:`, error.message);
        console.log(`   Error code: ${error.code}`);
        
        if (error.code === 403) {
          console.log('   🚫 Permissions issue - check Shared Drive member settings');
        } else if (error.code === 400) {
          console.log('   ⚠️  API parameter issue - trying alternative approach...');
          
          // Try without specifying driveId
          try {
            const altResponse = await drive.files.list({
              q: `parents in '${sharedDrive.id}'`,
              includeItemsFromAllDrives: true,
              supportsAllDrives: true,
              pageSize: 5
            });
            console.log(`   ✅ Alternative approach found ${altResponse.data.files?.length || 0} files`);
          } catch (altError) {
            console.log(`   ❌ Alternative approach also failed: ${altError.message}`);
          }
        }
      }
    }
    
    // Try one more direct approach to the specific folder
    console.log('\n🎯 Direct test of target folder...');
    try {
      const directResponse = await drive.files.list({
        q: `'1vpqclwGsQ-NzKch4uMm4UZuV_k93eNBQ' in parents`,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        fields: 'files(id,name,mimeType,size)',
        pageSize: 20
      });
      
      const directFiles = directResponse.data.files || [];
      console.log(`📄 Direct query found ${directFiles.length} files in target folder`);
      directFiles.forEach(file => {
        console.log(`   - ${file.name} (${file.mimeType}) - ${file.size || 'unknown'} bytes`);
      });
      
    } catch (error) {
      console.error('❌ Direct query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

testSharedDriveAccess();