const { google } = require('googleapis');

async function testSpecificFolder() {
  const folderId = '1vpqclwGsQ-NzKch4uMm4UZuV_k93eNBQ';
  
  try {
    console.log('🔍 Testing specific folder access...');
    console.log(`Folder ID: ${folderId}`);
    console.log('URL: https://drive.google.com/drive/u/2/folders/1vpqclwGsQ-NzKch4uMm4UZuV_k93eNBQ');
    
    // Set up Google Drive API with broader scopes
    const auth = new google.auth.GoogleAuth({
      keyFile: '/Users/ian/Desktop/socs_website/socs4all-e896217ba3d5.json',
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Get auth client info
    const authClient = await auth.getClient();
    console.log(`📧 Using service account: ${authClient.email}`);
    
    // Test 1: Get folder metadata
    console.log('\n1️⃣ Testing folder metadata access...');
    try {
      const folderInfo = await drive.files.get({
        fileId: folderId,
        fields: 'id,name,mimeType,parents,shared,ownedByMe,capabilities'
      });
      
      console.log('✅ Folder metadata retrieved successfully:');
      console.log(`   Name: ${folderInfo.data.name}`);
      console.log(`   Type: ${folderInfo.data.mimeType}`);
      console.log(`   Shared: ${folderInfo.data.shared}`);
      console.log(`   Owned by me: ${folderInfo.data.ownedByMe}`);
      console.log(`   Can list children: ${folderInfo.data.capabilities?.canListChildren}`);
      
    } catch (error) {
      console.error('❌ Cannot access folder metadata:', error.message);
      return;
    }
    
    // Test 2: List contents with different approaches
    console.log('\n2️⃣ Testing content listing...');
    
    // Approach 1: Basic query
    try {
      console.log('   Trying basic query...');
      const response1 = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id,name,mimeType,size)',
        pageSize: 100
      });
      
      const files1 = response1.data.files || [];
      console.log(`   ✅ Basic query found ${files1.length} files`);
      
      if (files1.length > 0) {
        console.log('   📄 Files found:');
        files1.slice(0, 5).forEach(file => {
          console.log(`      - ${file.name} (${file.mimeType})`);
        });
        if (files1.length > 5) {
          console.log(`      ... and ${files1.length - 5} more files`);
        }
      }
      
    } catch (error) {
      console.error('   ❌ Basic query failed:', error.message);
    }
    
    // Approach 2: Include all file types
    try {
      console.log('   Trying query with all file types...');
      const response2 = await drive.files.list({
        q: `'${folderId}' in parents`,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        fields: 'files(id,name,mimeType,size,trashed)',
        pageSize: 100
      });
      
      const files2 = response2.data.files || [];
      console.log(`   ✅ Extended query found ${files2.length} files`);
      
      if (files2.length > 0) {
        const notTrashed = files2.filter(f => !f.trashed);
        console.log(`   📄 Non-trashed files: ${notTrashed.length}`);
      }
      
    } catch (error) {
      console.error('   ❌ Extended query failed:', error.message);
    }
    
    // Test 3: Check permissions
    console.log('\n3️⃣ Testing permissions...');
    try {
      const permissions = await drive.permissions.list({
        fileId: folderId,
        fields: 'permissions(id,type,role,emailAddress)'
      });
      
      console.log('✅ Permissions retrieved:');
      permissions.data.permissions.forEach(perm => {
        console.log(`   - ${perm.type}: ${perm.emailAddress || 'N/A'} (${perm.role})`);
      });
      
    } catch (error) {
      console.error('❌ Cannot check permissions:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Overall error:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure the service account email is shared on the folder');
    console.log('2. Check if the folder is in a Shared Drive (different API calls needed)');
    console.log('3. Verify the folder ID is correct');
    console.log('4. Check if there are any organization restrictions');
  }
}

testSpecificFolder();