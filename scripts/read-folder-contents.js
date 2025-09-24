const fs = require('fs');
const path = require('path');

// Simple CSV parser
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      if (values.length > 0) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
  }
  
  return data;
}

// Parse a CSV line handling quoted values
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Extract folder ID from Google Drive URL
function extractFolderIdFromUrl(url) {
  if (!url) return null;
  
  // Handle different Google Drive URL formats
  const patterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,  // Standard folder URL
    /\/drive\/folders\/([a-zA-Z0-9-_]+)/,  // Alternative format
    /id=([a-zA-Z0-9-_]+)/, // Query parameter format
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Main function to analyze folder contents
async function analyzeFolderContents() {
  try {
    console.log('📁 Reading CSV file...');
    const csvPath = path.join(__dirname, '../csv_data/FINALIZED CT Lessons Tracker  - 2024-2025.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    console.log('📊 Parsing CSV data...');
    const lessons = parseCSV(csvContent);
    
    console.log(`Found ${lessons.length} lessons in CSV`);
    console.log('\\n=== FOLDER ANALYSIS ===\\n');
    
    const results = {
      totalLessons: lessons.length,
      foldersColumnF: { valid: 0, invalid: 0, empty: 0, urls: [] },
      foldersColumnM: { valid: 0, invalid: 0, empty: 0, urls: [] }
    };
    
    lessons.forEach((lesson, index) => {
      const rowNum = index + 2; // Account for header row
      const columnF = lesson['Link to folder with updated lesson plan and materials'];
      const columnM = lesson['Original Folder Link'];
      const lessonTitle = lesson['Lesson Title'];
      
      console.log(`\\n--- Row ${rowNum}: ${lessonTitle || 'Untitled'} ---`);
      
      // Analyze Column F
      console.log(`Column F (Updated): ${columnF || 'EMPTY'}`);
      if (!columnF || columnF.trim() === '') {
        results.foldersColumnF.empty++;
      } else {
        const folderIdF = extractFolderIdFromUrl(columnF);
        if (folderIdF) {
          results.foldersColumnF.valid++;
          results.foldersColumnF.urls.push({
            row: rowNum,
            title: lessonTitle,
            url: columnF,
            folderId: folderIdF
          });
          console.log(`  ✅ Valid folder ID: ${folderIdF}`);
        } else {
          results.foldersColumnF.invalid++;
          console.log(`  ❌ Invalid/unrecognized URL format`);
        }
      }
      
      // Analyze Column M
      console.log(`Column M (Original): ${columnM || 'EMPTY'}`);
      if (!columnM || columnM.trim() === '') {
        results.foldersColumnM.empty++;
      } else {
        const folderIdM = extractFolderIdFromUrl(columnM);
        if (folderIdM) {
          results.foldersColumnM.valid++;
          results.foldersColumnM.urls.push({
            row: rowNum,
            title: lessonTitle,
            url: columnM,
            folderId: folderIdM
          });
          console.log(`  ✅ Valid folder ID: ${folderIdM}`);
        } else {
          results.foldersColumnM.invalid++;
          console.log(`  ❌ Invalid/unrecognized URL format`);
        }
      }
    });
    
    // Summary
    console.log('\\n\\n=== SUMMARY ===');
    console.log(`Total lessons processed: ${results.totalLessons}`);
    console.log('\\nColumn F (Updated lesson folders):');
    console.log(`  ✅ Valid URLs: ${results.foldersColumnF.valid}`);
    console.log(`  ❌ Invalid URLs: ${results.foldersColumnF.invalid}`);
    console.log(`  📭 Empty: ${results.foldersColumnF.empty}`);
    console.log('\\nColumn M (Original lesson folders):');
    console.log(`  ✅ Valid URLs: ${results.foldersColumnM.valid}`);
    console.log(`  ❌ Invalid URLs: ${results.foldersColumnM.invalid}`);
    console.log(`  📭 Empty: ${results.foldersColumnM.empty}`);
    
    // Save results to JSON for further processing
    const outputPath = path.join(__dirname, 'folder-analysis-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\\n📄 Results saved to: ${outputPath}`);
    
    console.log('\\n💡 Note: To actually read folder contents, you would need:');
    console.log('   1. Google Drive API credentials');
    console.log('   2. Permission to access these folders');
    console.log('   3. Google Drive API client setup');
    console.log('\\n   This script shows you all the folder IDs that can be processed.');
    
    return results;
    
  } catch (error) {
    console.error('❌ Error analyzing folder contents:', error.message);
    process.exit(1);
  }
}

// Run the analysis
if (require.main === module) {
  analyzeFolderContents();
}

module.exports = { analyzeFolderContents, extractFolderIdFromUrl };