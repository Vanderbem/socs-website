Looking at your hydration errors and codebase, I can see the core issues. The problem is that your search page is trying to mix server-side rendering with client-side JavaScript in an incompatible way. Let me create a comprehensive fix plan.

## Root Cause Analysis

The hydration errors occur because:
1. Your search page renders as a React component on the server
2. But then tries to load vanilla JavaScript (`search.js`) that manipulates the DOM directly
3. This creates a mismatch between server HTML and client expectations
4. The `<ul>` elements are being populated by vanilla JS, causing the "unexpected text node" errors

## Comprehensive Fix Plan

### Phase 1: Convert to Pure Client-Side Rendering

**Step 1: Create a simple loading page**
Replace `src/app/search/page.tsx` with:

```tsx
'use client'

import { useEffect } from 'react'
import './style.css'
import './custom-overrides.css'

export default function SearchPage() {
  useEffect(() => {
    // Load the search script after component mounts
    const script = document.createElement('script')
    script.src = '/search.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="instant-search-container">
      {/* Static HTML structure - no dynamic content */}
      <header>
        <a href="/"><img src="/images/instant_search_logo@2x.png" alt="SOCS4AI Lesson Search" /></a>
        <div id="search-input-container">
          <form action="" role="search">
            <input
              id="search-input"
              type="search"
              placeholder="Search for lessons..."
              className="ais-SearchBox-input"
            />
            <button type="submit" title="Submit your search query." className="ais-SearchBox-submit">
              <svg className="ais-SearchBox-submitIcon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 40 40">
                <path d="M26.804 29.01c-2.832 2.34-6.465 3.746-10.426 3.746C7.333 32.756 0 25.424 0 16.378 0 7.333 7.333 0 16.378 0c9.046 0 16.378 7.333 16.378 16.378 0 3.96-1.406 7.594-3.746 10.426l10.534 10.534c.607.607.61 1.59-.004 2.202-.61.61-1.597.61-2.202.004L26.804 29.01zm-10.426.627c7.323 0 13.26-5.936 13.26-13.26 0-7.32-5.937-13.257-13.26-13.257C9.056 3.12 3.12 9.056 3.12 16.378c0 7.323 5.936 13.26 13.258 13.26z"></path>
              </svg>
            </button>
          </form>
        </div>
      </header>

      <main>
        <div id="left-column">
          <div className="facet">
            <div className="facet-name">Grade Level</div>
            <ul className="facet-values" id="grade-facet"></ul>
          </div>
          
          <div className="facet">
            <div className="facet-name">Subject</div>
            <ul className="facet-values" id="subject-facet"></ul>
          </div>
          
          <div className="facet">
            <div className="facet-name">CT Concepts</div>
            <ul className="facet-values" id="concept-facet"></ul>
          </div>
          
          <div className="facet">
            <div className="facet-name">Status</div>
            <ul className="facet-values" id="status-facet"></ul>
          </div>
          
          <button className="clear-filters" id="clear-filters-btn">
            Clear all filters
          </button>
        </div>

        <div id="right-column">
          <div className="results-header">
            <span id="results-count">Loading...</span>
            <select id="sort-select">
              <option value="relevance">Most Relevant</option>
              <option value="title">Title A-Z</option>
              <option value="grade">Grade Level</option>
              <option value="lesson-number">Lesson Number</option>
            </select>
          </div>
          <ul className="ais-Hits-list" id="hits"></ul>
        </div>
      </main>

      <footer>
        <p>Powered by SOCS4AI</p>
      </footer>
    </div>
  )
}
```

**Step 2: Fix the search.js file**
Replace `public/search.js` completely:

```javascript
// Simple, elegant search implementation
let lessons = []
let searchTimeout = null

// Load lessons on page load
async function loadLessons() {
  try {
    // Show loading state
    const hitsContainer = document.getElementById('hits')
    if (hitsContainer) {
      hitsContainer.innerHTML = '<li class="loading-message">Loading lessons...</li>'
    }
    
    const response = await fetch('/api/lessons')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    lessons = await response.json()
    console.log('Loaded lessons:', lessons.length)
    
    renderLessons(lessons)
    updateFacets()
    updateResultsCount(lessons.length)
  } catch (error) {
    console.error('Failed to load lessons:', error)
    const hitsContainer = document.getElementById('hits')
    if (hitsContainer) {
      hitsContainer.innerHTML = '<li class="error-message">Error loading lessons. Please refresh the page.</li>'
    }
  }
}

// Simple debounce function
function debounce(func, delay) {
  return function(...args) {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => func.apply(this, args), delay)
  }
}

// Search and filter
function searchLessons() {
  const searchInput = document.getElementById('search-input')
  const query = searchInput ? searchInput.value.toLowerCase() : ''
  
  // Get selected filters
  const selectedGrades = Array.from(document.querySelectorAll('#grade-facet input:checked')).map(cb => cb.value)
  const selectedSubjects = Array.from(document.querySelectorAll('#subject-facet input:checked')).map(cb => cb.value)
  const selectedConcepts = Array.from(document.querySelectorAll('#concept-facet input:checked')).map(cb => cb.value)
  const selectedStatus = Array.from(document.querySelectorAll('#status-facet input:checked')).map(cb => cb.value)
  
  const sortSelect = document.getElementById('sort-select')
  const sortBy = sortSelect ? sortSelect.value : 'relevance'
  
  // Filter lessons
  let filtered = lessons.filter(lesson => {
    // Search query
    const matchesSearch = !query || 
      (lesson.lessonTitle && lesson.lessonTitle.toLowerCase().includes(query)) ||
      (lesson.originalAuthor && lesson.originalAuthor.toLowerCase().includes(query)) ||
      (lesson.subject && lesson.subject.toLowerCase().includes(query)) ||
      (lesson.ctConcept && lesson.ctConcept.toLowerCase().includes(query)) ||
      (lesson.grade && lesson.grade.toLowerCase().includes(query))
    
    // Filters
    const matchesGrade = selectedGrades.length === 0 || 
      selectedGrades.some(g => lesson.grade && lesson.grade.includes(g))
    
    const matchesSubject = selectedSubjects.length === 0 || 
      selectedSubjects.some(s => lesson.subject && lesson.subject.includes(s))
    
    const matchesConcept = selectedConcepts.length === 0 || 
      selectedConcepts.some(c => lesson.ctConcept && lesson.ctConcept.includes(c))
    
    const matchesStatus = selectedStatus.length === 0 ||
      (selectedStatus.includes('ready') && lesson.readyToPublish) ||
      (selectedStatus.includes('in-progress') && !lesson.readyToPublish)
    
    return matchesSearch && matchesGrade && matchesSubject && matchesConcept && matchesStatus
  })
  
  // Sort
  if (sortBy === 'title') {
    filtered.sort((a, b) => (a.lessonTitle || '').localeCompare(b.lessonTitle || ''))
  } else if (sortBy === 'grade') {
    filtered.sort((a, b) => (a.grade || '').localeCompare(b.grade || ''))
  } else if (sortBy === 'lesson-number') {
    filtered.sort((a, b) => parseInt(a.lessonNumber || '0') - parseInt(b.lessonNumber || '0'))
  }
  
  renderLessons(filtered)
  updateResultsCount(filtered.length)
}

// Render lessons to DOM
function renderLessons(lessonsToRender) {
  const container = document.getElementById('hits')
  if (!container) return
  
  if (lessonsToRender.length === 0) {
    container.innerHTML = '<li><p class="no-results">No lessons found</p></li>'
    return
  }
  
  container.innerHTML = lessonsToRender.map(lesson => `
    <li class="ais-Hits-item">
      <div class="hit">
        <div class="hit-content">
          <div class="hit-header">
            <h2 class="hit-name">${highlightText(lesson.lessonTitle || 'Untitled Lesson')}</h2>
            <div class="hit-status">
              ${lesson.readyToPublish 
                ? '<span class="badge badge-success">✓ Ready</span>' 
                : '<span class="badge badge-warning">In Progress</span>'}
            </div>
          </div>
          
          <p class="hit-category-breadcrumb">
            Grade ${lesson.grade || 'N/A'} • ${lesson.subject || 'N/A'}
          </p>
          
          <div class="hit-concepts">
            ${(lesson.ctConcept || '').split(', ').filter(c => c).map(concept => 
              `<span class="concept-tag">${concept}</span>`
            ).join('')}
          </div>
          
          <p class="hit-author">
            By ${lesson.originalAuthor || 'Unknown'}
            ${lesson.revisedBy ? ` • Revised by ${lesson.revisedBy}` : ''}
          </p>
          
          ${lesson.notes ? `<p class="hit-description">${lesson.notes}</p>` : ''}
          
          <div class="hit-footer">
            <span class="hit-lesson-number">Lesson #${lesson.lessonNumber || 'N/A'}</span>
            ${lesson.dateFinalized ? `<span class="hit-date">Finalized: ${lesson.dateFinalized}</span>` : ''}
          </div>
          
          <div class="hit-actions">
            ${lesson.linkToFolder ? `
              <a href="${lesson.linkToFolder}" target="_blank" rel="noopener noreferrer" class="btn-primary">
                View Lesson →
              </a>
            ` : ''}
            ${lesson.originalFolderLink ? `
              <a href="${lesson.originalFolderLink}" target="_blank" rel="noopener noreferrer" class="btn-secondary">
                Original →
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    </li>
  `).join('')
}

// Highlight search terms
function highlightText(text) {
  const searchInput = document.getElementById('search-input')
  const query = searchInput ? searchInput.value : ''
  if (!query || !text) return text
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// Escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Update facets with counts
function updateFacets() {
  updateFacet('grade-facet', getUniqueValues('grade'))
  updateFacet('subject-facet', getUniqueValues('subject'))
  updateFacet('concept-facet', getUniqueValues('ctConcept'))
  updateStatusFacet()
}

function getUniqueValues(field) {
  const counts = {}
  lessons.forEach(lesson => {
    if (lesson[field]) {
      const values = lesson[field].split(', ')
      values.forEach(value => {
        const trimmed = value.trim()
        if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1
      })
    }
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

function updateFacet(facetId, values) {
  const container = document.getElementById(facetId)
  if (!container) return
  
  container.innerHTML = values.slice(0, 10).map(([value, count]) => `
    <li>
      <label>
        <input type="checkbox" value="${value}">
        <span class="facet-value">${value}</span>
        <span class="facet-count">${count}</span>
      </label>
    </li>
  `).join('')
  
  // Add event listeners
  container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', searchLessons)
  })
}

function updateStatusFacet() {
  const container = document.getElementById('status-facet')
  if (!container) return
  
  const readyCount = lessons.filter(l => l.readyToPublish).length
  const inProgressCount = lessons.filter(l => !l.readyToPublish).length
  
  container.innerHTML = `
    <li>
      <label>
        <input type="checkbox" value="ready">
        <span class="facet-value">Ready to Publish</span>
        <span class="facet-count">${readyCount}</span>
      </label>
    </li>
    <li>
      <label>
        <input type="checkbox" value="in-progress">
        <span class="facet-value">In Progress</span>
        <span class="facet-count">${inProgressCount}</span>
      </label>
    </li>
  `
  
  // Add event listeners
  container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', searchLessons)
  })
}

function updateResultsCount(count) {
  const element = document.getElementById('results-count')
  if (element) {
    element.textContent = `${count} ${count === 1 ? 'result' : 'results'}`
  }
}

// Clear all filters
function clearFilters() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false)
  const searchInput = document.getElementById('search-input')
  if (searchInput) searchInput.value = ''
  searchLessons()
}

// Initialize event listeners
function initializeEventListeners() {
  // Search input
  const searchInput = document.getElementById('search-input')
  if (searchInput) {
    searchInput.addEventListener('input', debouncedSearch)
  }
  
  // Sort select
  const sortSelect = document.getElementById('sort-select')
  if (sortSelect) {
    sortSelect.addEventListener('change', searchLessons)
  }
  
  // Clear filters button
  const clearButton = document.getElementById('clear-filters-btn')
  if (clearButton) {
    clearButton.addEventListener('click', clearFilters)
  }
}

// Debounced search
const debouncedSearch = debounce(searchLessons, 300)

// Initialize everything when DOM is loaded
function initialize() {
  console.log('Initializing search...')
  initializeEventListeners()
  loadLessons()
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize()
}
```

**Step 3: Simplify the API route**
Replace `src/app/api/lessons/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'csv_data', 'FINALIZED CT Lessons Tracker  - 2024-2025.csv')
    
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found at:', csvPath)
      return NextResponse.json({ error: 'CSV file not found' }, { status: 404 })
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      return NextResponse.json([])
    }
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    console.log('CSV Headers:', headers)
    
    const lessons = []
    
    // Parse CSV rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      try {
        // Simple CSV parsing - handle quotes
        const values = parseCSVLine(line)
        
        if (values.length < headers.length) {
          console.warn(`Row ${i} has ${values.length} values but expected ${headers.length}`)
          continue
        }
        
        // Map to lesson object with safe fallbacks
        const lesson = {
          id: getValue(values, headers, 'Lesson ID (hard coded)') || `lesson-${i}`,
          lessonNumber: getValue(values, headers, 'Lesson # (1-6)') || '',
          dateFinalized: getValue(values, headers, 'Date Finalized') || '',
          revisedBy: getValue(values, headers, 'Revised by') || '',
          readyToPublish: getValue(values, headers, 'Ready to publish to webpage')?.toUpperCase() === 'TRUE',
          linkToFolder: getValue(values, headers, 'Link to English Plan') || '',
          notes: getValue(values, headers, 'Notes') || '',
          lessonTitle: getValue(values, headers, 'Lesson Title') || 'Untitled Lesson',
          grade: getValue(values, headers, 'Grade') || '',
          ctConcept: getValue(values, headers, 'CT Concept') || '',
          subject: getValue(values, headers, 'Subject') || '',
          originalAuthor: getValue(values, headers, 'Original Author') || '',
          originalFolderLink: getValue(values, headers, 'Original Folder Link') || ''
        }
        
        // Only include lessons with a title
        if (lesson.lessonTitle && lesson.lessonTitle !== 'Untitled Lesson') {
          lessons.push(lesson)
        }
        
      } catch (error) {
        console.warn(`Error parsing row ${i}:`, error)
        continue
      }
    }
    
    console.log(`Successfully parsed ${lessons.length} lessons`)
    return NextResponse.json(lessons)
    
  } catch (error) {
    console.error('Error reading CSV:', error)
    return NextResponse.json({ error: 'Failed to load lessons' }, { status: 500 })
  }
}

// Simple CSV line parser that handles quotes
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add the last value
  values.push(current.trim())
  
  return values
}

// Helper to safely get value by header name
function getValue(values: string[], headers: string[], headerName: string): string {
  const index = headers.indexOf(headerName)
  return index >= 0 ? (values[index] || '').replace(/"/g, '') : ''
}
```

**Step 4: Remove components that cause conflicts**
Delete these files if they exist:
- `src/components/Header.tsx`
- `src/components/ui/` (entire directory)
- Any other custom components

**Step 5: Update package.json dependencies**
Remove unnecessary dependencies. Your `package.json` should look like:

```json
{
  "name": "socs_website",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.31",
    "react": "^18",
    "react-dom": "^18",
    "tailwindcss": "^4.1.11"
  },
  "devDependencies": {
    "@types/node": "20.19.9",
    "@types/react": "18.3.23",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.30",
    "typescript": "^5"
  }
}
```

### Phase 2: Test and Deploy

**Step 6: Test locally**
1. Run `npm install` to ensure clean dependencies
2. Run `npm run dev`
3. Navigate to `/search` and verify:
   - No hydration errors in console
   - Search functionality works
   - Filters work
   - Data loads correctly

**Step 7: Build and deploy**
1. Run `npm run build` to test production build
2. Fix any build errors
3. Deploy to Vercel

### Phase 3: Monitor and Optimize

**Step 8: Add error boundaries**
If needed, add simple error handling to catch any remaining issues.

This plan removes the React/vanilla JS conflict by making the search page purely client-side and using proper event listeners instead of inline handlers. The key is that the server renders static HTML, and then JavaScript takes over completely on the client side.