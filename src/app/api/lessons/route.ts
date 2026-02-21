import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'csv_data', 'FINALIZED CT Lessons Tracker  - 2024-2025.csv')
    
    // Simple synchronous file reading
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    const lessons = []
    
    // Parse CSV rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Simple CSV parsing - handle commas within quotes
      const values = []
      let current = ''
      let inQuotes = false
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      
      // Map to lesson object - use exact header names from CSV
      const lesson = {
        id: values[0] || '', // First column (empty header)
        lessonNumber: values[headers.indexOf('Lesson # (1-6)')] || '',
        dateFinalized: values[headers.indexOf('Date Finalized')] || '',
        revisedBy: values[headers.indexOf('Revised by')] || '', // lowercase 'by'
        readyToPublish: (values[headers.indexOf('Ready to publish to webpage')] || '').toUpperCase() === 'TRUE',
        linkToFolder: values[headers.indexOf('Link to English Plan')] || '',
        linkToMaterials: values[headers.indexOf('Link to folder with updated lesson plan and materials')] || '',
        notes: values[headers.indexOf('Notes')] || '',
        lessonTitle: values[headers.indexOf('Lesson Title')] || '',
        grade: values[headers.indexOf('Grade')] || '',
        ctConcept: values[headers.indexOf('CT Concept')] || '',
        subject: values[headers.indexOf('Subject')] || '',
        originalAuthor: values[headers.indexOf('Original Author')] || '',
        originalFolderLink: values[headers.indexOf('Original Folder Link')] || ''
      ,
      	hasSpanish: ((values[headers.indexOf('Has Spanish')] || '').toLowerCase() === 'yes' || (values[headers.indexOf('Has Spanish')] || '').toLowerCase() === 'true')
      }
      
      if (lesson.lessonTitle || lesson.id) {
        lessons.push(lesson)
      }
    }
    
    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error reading CSV:', error)
    return NextResponse.json({ error: 'Failed to load lessons' }, { status: 500 })
  }
}