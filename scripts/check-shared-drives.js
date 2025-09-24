const { google } = require('googleapis');

async function checkSharedDrives() {
  try {
    console.log('🔍 Checking for Shared Drives access...');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: '/Users/ian/Desktop/socs_website/socs4all-e896217ba3d5.json',
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    });
    
    const drive = google.drive({ version: 'v3', auth });
    const authClient = await auth.getClient();
    console.log(`📧 Service account: ${authClient.email}`);
    
    // List shared drives
    console.log('\n📂 Checking Shared Drives...');
    try {
      const sharedDrives = await drive.drives.list({
        pageSize: 100
      });
      
      if (sharedDrives.data.drives && sharedDrives.data.drives.length > 0) {
        console.log(`✅ Found ${sharedDrives.data.drives.length} Shared Drives:`);
        sharedDrives.data.drives.forEach(drive => {
          console.log(`   - ${drive.name} (ID: ${drive.id})`);
        });
        
        // Try to search for our folder in shared drives
        console.log('\n🔎 Searching for folder in Shared Drives...');
        const folderId = '1vpqclwGsQ-NzKch4uMm4UZuV_k93eNBQ';
        
        for (const sharedDrive of sharedDrives.data.drives) {
          try {
            const searchResult = await drive.files.list({
              q: `name contains 'lesson' or id='${folderId}'`,
              driveId: sharedDrive.id,
              includeItemsFromAllDrives: true,
              supportsAllDrives: true,
              corpora: 'drive',
              pageSize: 10
            });
            
            if (searchResult.data.files && searchResult.data.files.length > 0) {
              console.log(`   📁 Found files in ${sharedDrive.name}:`);
              searchResult.data.files.forEach(file => {
                console.log(`      - ${file.name} (${file.id})`);
              });
            }
          } catch (error) {
            console.log(`   ⚠️  Cannot search in ${sharedDrive.name}: ${error.message}`);
          }
        }
        
      } else {
        console.log('📭 No Shared Drives found');
      }
      
    } catch (error) {
      console.error('❌ Cannot list Shared Drives:', error.message);
    }
    
    // Try alternative approach - search all accessible files
    console.log('\n🔍 Searching all accessible files...');
    try {
      const allFiles = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder'",
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        pageSize: 20,
        fields: 'files(id,name,parents,driveId)'
      });
      
      console.log(`📁 Found ${allFiles.data.files?.length || 0} accessible folders`);
      if (allFiles.data.files && allFiles.data.files.length > 0) {
        allFiles.data.files.slice(0, 5).forEach(file => {
          console.log(`   - ${file.name} (${file.id})`);
        });
      }
      
    } catch (error) {
      console.error('❌ Cannot search files:', error.message);
    }
    
    console.log('\n💡 Troubleshooting suggestions:');
    console.log('1. Wait 5-10 minutes for permissions to propagate');
    console.log('2. Check if the folder is in a Shared Drive that needs separate sharing');
    console.log('3. Verify your Google Workspace allows external service accounts');
    console.log('4. Try sharing the folder directly (not just parent folder) with the service account');
    console.log(`5. Share with: ${authClient.email}`);
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

checkSharedDrives();