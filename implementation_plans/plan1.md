Of course. I can certainly help you refactor your search page to fix the filtering logic, implement better sorting, and apply best practices for clean, maintainable code.

Here is a comprehensive implementation plan and the updated code to achieve your goals.

### Implementation Plan

1.  **Refactor Core Logic (`public/search.js`):**
    *   **State Management:** Introduce a central `searchState` object to manage the current query, active filters, and sorting preferences. This avoids reading from the DOM repeatedly and makes the state explicit.
    *   **Faceted Search:** The main bug is that filter counts are static. The fix involves recalculating the available options and counts for each filter category (`Grade`, `Subject`, `Concept`) based on the *other* active filters. For example, when a user selects "Grade 5", the counts for "Subject" will update to show only the subjects available within Grade 5 lessons.
    *   **Orchestration:** Create a single orchestrator function, `searchAndRender`, that is called whenever any state changes (search input, filter selection, or sorting). This function will manage the flow of filtering, sorting, and rendering, ensuring the UI is always in sync with the state.

2.  **Update Sorting Mechanism (`src/app/route.ts` & `public/search.js`):**
    *   **Modify HTML:** The `select` dropdown for sorting in `src/app/route.ts` will be updated to remove the "Most Relevant" and "Lesson Number" options.
    *   **Add Toggle:** A new button will be added next to the sort dropdown to toggle between `Ascending` and `Descending` order.
    *   **Update JS:** The JavaScript will be updated to handle the new sorting options and the ascending/descending state, correctly re-sorting the results whenever the sort controls are changed.

3.  **Code Quality and Best Practices:**
    *   **DRY Principle:** Reusable functions like `renderFacet` will be used to generate the filter lists, avoiding duplicated code.
    *   **Documentation:** JSDoc comments will be added to all major functions to explain their purpose, parameters, and return values, making the code easier to understand and maintain.
    *   **Clarity:** Variable and function names will be made more descriptive (e.g., `lessons` becomes `allLessons`) to improve readability.

Here are the updated files with the implemented changes.

### Updated Files

<diff>
<original file="/Users/ian/Desktop/socs_website/src/app/route.ts" />
<modified file="/Users/ian/Desktop/socs_website/src/app/route.ts" />
</diff>
```diff
--- a/src/app/route.ts
+++ b/src/app/route.ts
@@ -51,12 +51,13 @@
 
       <div id="right-column">
         <div class="results-header">
           <span id="results-count"></span>
-          <select id="sort-select">
-            <option value="relevance">Most Relevant</option>
-            <option value="title">Title A-Z</option>
-            <option value="grade">Grade Level</option>
-            <option value="lesson-number">Lesson Number</option>
-          </select>
+          <div id="sort-by-wrapper">
+            <select id="sort-select">
+              <option value="lessonTitle">Title</option>
+              <option value="grade">Grade</option>
+            </select>
+            <button id="sort-order-toggle" data-order="asc">Ascending</button>
+          </div>
         </div>
         
         <ul class="ais-Hits-list" id="hits"></ul>

```

<diff>
<original file="/Users/ian/Desktop/socs_website/public/search.js" />
<modified file="/Users/ian/Desktop/socs_website/public/search.js" />
</diff>
```diff
--- a/public/search.js
+++ b/public/search.js
@@ -1,38 +1,86 @@
-// Simple, elegant search implementation
-let lessons = []
-let searchTimeout = null
-
-// Load lessons on page load
+/**
+ * @file This script handles the client-side search, filtering, and sorting functionality for the lesson search page.
+ * It implements a faceted search, where filter options dynamically update based on the current selection.
+ */
+
+/**
+ * @typedef {object} Lesson - Represents a single lesson plan.
+ * @property {boolean} readyToPublish - Whether the lesson is ready for the webpage.
+ * @property {string} linkToFolder - A URL to the lesson materials.
+ * @property {string} lessonTitle - The title of the lesson.
+ * @property {string} originalAuthor - The original author of the lesson.
+ * @property {string} subject - The subject area(s), comma-separated.
+ * @property {string} ctConcept - The CT concept(s), comma-separated.
+ * @property {string} grade - The grade level(s), comma-separated.
+ * @property {string} [revisedBy] - The person who revised the lesson.
+ * @property {string} [dateFinalized] - The date the lesson was finalized.
+ */
+
+/** @type {Lesson[]} */
+let allLessons = [];
+let searchTimeoutId = null;
+
+/**
+ * Represents the current state of search, filters, and sorting.
+ * This central object is the single source of truth for the UI.
+ * @type {{
+ *   query: string;
+ *   filters: {grade: string[]; subject: string[]; ctConcept: string[]};
+ *   sortBy: 'lessonTitle' | 'grade';
+ *   sortOrder: 'asc' | 'desc';
+ * }}
+ */
+const searchState = {
+    query: '',
+    filters: {
+        grade: [],
+        subject: [],
+        ctConcept: []
+    },
+    sortBy: 'lessonTitle',
+    sortOrder: 'asc'
+};
+
+/**
+ * Fetches and loads lesson data from the API, then initializes the search UI.
+ * This function is the entry point for the search page.
+ * @returns {Promise<void>}
+ */
 async function loadLessons() {
-  try {
-    // Show loading state
     const hitsContainer = document.getElementById('hits')
     if (hitsContainer) {
-      hitsContainer.innerHTML = '<li class="loading-message">Loading lessons...</li>'
+        hitsContainer.innerHTML = '<li class="loading-message">Loading lessons...</li>';
     }
-    
-    const response = await fetch('/api/lessons')
-    lessons = await response.json()
-    
-    // Filter lessons immediately - only show ready to publish with folder links
-    const readyLessons = lessons.filter(lesson => {
-      return lesson.readyToPublish && lesson.linkToFolder && lesson.linkToFolder.trim() !== ''
-    })
-    
-    renderLessons(readyLessons)
-    updateFacets()
-  } catch (error) {
-    console.error('Failed to load lessons:', error)
-    const hitsContainer = document.getElementById('hits')
-    if (hitsContainer) {
-      hitsContainer.innerHTML = '<li class="error-message">Error loading lessons</li>'
+
+    try {
+        const response = await fetch('/api/lessons');
+        const lessonsData = await response.json();
+
+        // Pre-filter lessons to only include those that are ready to publish and have a valid link.
+        allLessons = lessonsData.filter(lesson =>
+            lesson.readyToPublish && lesson.linkToFolder && lesson.linkToFolder.trim() !== ''
+        );
+
+        searchAndRender(); // Perform initial render
+    } catch (error) {
+        console.error('Failed to load lessons:', error);
+        if (hitsContainer) {
+            hitsContainer.innerHTML = '<li class="error-message">Error loading lessons. Please try refreshing the page.</li>';
+        }
     }
-  }
 }
 
-// Simple debounce function
-function debounce(func, delay) {
-  return function(...args) {
-    clearTimeout(searchTimeout)
-    searchTimeout = setTimeout(() => func.apply(this, args), delay)
-  }
+/**
+ * Debounces a function to prevent it from being called too frequently.
+ * Useful for handling user input events like typing in a search box.
+ * @param {Function} func - The function to debounce.
+ * @param {number} delay - The debounce delay in milliseconds.
+ * @returns {Function} The debounced function.
+ */
+function debounce(func, delay) {
+    return function(...args) {
+        clearTimeout(searchTimeoutId);
+        searchTimeoutId = setTimeout(() => func.apply(this, args), delay);
+    };
 }
 
 // Search and filter
@@ -40,36 +88,40 @@
   const query = document.getElementById('search-input')?.value?.toLowerCase() || ''
   
   // Get selected filters
-  const selectedGrades = Array.from(document.querySelectorAll('#grade-facet input:checked')).map(cb => cb.value)
-  const selectedSubjects = Array.from(document.querySelectorAll('#subject-facet input:checked')).map(cb => cb.value)
-  const selectedConcepts = Array.from(document.querySelectorAll('#concept-facet input:checked')).map(cb => cb.value)
-  const sortBy = document.getElementById('sort-select')?.value || 'relevance'
+/**
+ * The main orchestrator function. It reads the current state from the DOM,
+ * applies filtering and sorting, and then updates the entire UI.
+ */
+function searchAndRender() {
+    updateStateFromDOM();
+
+    let filteredLessons = [...allLessons];
+
+    // 1. Apply Search Query
+    if (searchState.query) {
+        const query = searchState.query.toLowerCase();
+        filteredLessons = filteredLessons.filter(lesson =>
+            ['lessonTitle', 'originalAuthor', 'subject', 'ctConcept', 'grade'].some(field =>
+                lesson[field]?.toLowerCase().includes(query)
+            )
+        );
+    }
+
+    // 2. Apply Filters
+    Object.entries(searchState.filters).forEach(([facet, selectedValues]) => {
+        if (selectedValues.length > 0) {
+            filteredLessons = filteredLessons.filter(lesson =>
+                selectedValues.some(value => lesson[facet]?.includes(value))
+            );
+        }
+    });
   
-  // Filter lessons - only show ready to publish lessons with a link to folder
-  let filtered = lessons.filter(lesson => {
-    // Must be ready to publish
-    if (!lesson.readyToPublish) {
-      console.log('Filtering out lesson (not ready):', lesson.lessonTitle, 'readyToPublish:', lesson.readyToPublish)
-      return false
-    }
-    
-    // Must have a link to folder
-    if (!lesson.linkToFolder || lesson.linkToFolder.trim() === '') {
-      console.log('Filtering out lesson (no link):', lesson.lessonTitle, 'linkToFolder:', lesson.linkToFolder)
-      return false
-    }
-    
-    // Search query
-    const matchesSearch = !query || 
-      lesson.lessonTitle.toLowerCase().includes(query) ||
-      lesson.originalAuthor.toLowerCase().includes(query) ||
-      lesson.subject.toLowerCase().includes(query) ||
-      lesson.ctConcept.toLowerCase().includes(query) ||
-      lesson.grade.toLowerCase().includes(query)
-    
-    // Filters
-    const matchesGrade = selectedGrades.length === 0 || 
-      selectedGrades.some(g => lesson.grade.includes(g))
-    
-    const matchesSubject = selectedSubjects.length === 0 || 
-      selectedSubjects.some(s => lesson.subject.includes(s))
-    
-    const matchesConcept = selectedConcepts.length === 0 || 
-      selectedConcepts.some(c => lesson.ctConcept.includes(c))
-    
-    return matchesSearch && matchesGrade && matchesSubject && matchesConcept
-  })
-  
-  // Sort
-  if (sortBy === 'title') {
-    filtered.sort((a, b) => a.lessonTitle.localeCompare(b.lessonTitle))
-  } else if (sortBy === 'grade') {
-    filtered.sort((a, b) => a.grade.localeCompare(b.grade))
-  } else if (sortBy === 'lesson-number') {
-    filtered.sort((a, b) => parseInt(a.lessonNumber || '0') - parseInt(b.lessonNumber || '0'))
-  }
-  
-  renderLessons(filtered)
-  updateResultsCount(filtered.length)
+    // 3. Apply Sorting
+    const sortKey = searchState.sortBy;
+    const sortOrder = searchState.sortOrder;
+    filteredLessons.sort((a, b) => {
+        const comparison = (a[sortKey] || '').localeCompare(b[sortKey] || '', undefined, { numeric: true });
+        return sortOrder === 'asc' ? comparison : -comparison;
+    });
+
+    renderLessons(filteredLessons);
+    updateAllFacets();
+    updateResultsCount(filteredLessons.length);
 }
 
 // Render lessons to DOM
@@ -82,21 +134,16 @@
     return
   }
   
-  container.innerHTML = lessonsToRender.map(lesson => `
+  container.innerHTML = lessonsToRender.map(lesson => {
+    const highlightedTitle = highlightText(lesson.lessonTitle);
+    return `
     <li class="ais-Hits-item">
       <div class="hit">
         <div class="hit-content">
           <div class="hit-header">
-            <h2 class="hit-name">${highlightText(lesson.lessonTitle)}</h2>
-            <div class="hit-status">
-              ${lesson.readyToPublish 
-                ? '<span class="badge badge-success">✓ Ready</span>' 
-                : '<span class="badge badge-warning">In Progress</span>'}
-            </div>
+            <h2 class="hit-name">${highlightedTitle}</h2>
           </div>
-          
           <p class="hit-category-breadcrumb">
             Grade ${lesson.grade} • ${lesson.subject}
           </p>
-          
           <div class="hit-concepts">
             ${lesson.ctConcept.split(', ').map(concept => 
               `<span class="concept-tag">${concept}</span>`
@@ -107,38 +154,103 @@
             By ${lesson.originalAuthor}
             ${lesson.revisedBy ? ` • Revised by ${lesson.revisedBy}` : ''}
           </p>
-          
           <div class="hit-footer">
             ${lesson.dateFinalized ? `<span class="hit-date">Finalized: ${lesson.dateFinalized}</span>` : ''}
           </div>
-          
           <div class="hit-actions">
-            ${lesson.linkToFolder ? `
-              <button onclick="handleLessonClick('${lesson.linkToFolder}', '${lesson.lessonTitle.replace(/'/g, "\\'")}')" class="btn-primary">
+            <a href="${lesson.linkToFolder}" target="_blank" rel="noopener noreferrer" class="btn-primary">
                 View Lesson →
-              </button>
-            ` : ''}
+            </a>
           </div>
         </div>
       </div>
     </li>
-  `).join('')
+  `}).join('')
 }
 
-// Highlight search terms
+/**
+ * Wraps matching search terms in the lesson title with <mark> tags.
+ * @param {string} text - The text to highlight.
+ * @returns {string} The highlighted HTML string.
+ */
 function highlightText(text) {
-  const query = document.getElementById('search-input')?.value
+  const query = searchState.query;
   if (!query) return text
-  
-  const regex = new RegExp(`(${query})`, 'gi')
+
+  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
+  const regex = new RegExp(`(${escapedQuery})`, 'gi')
   return text.replace(regex, '<mark>$1</mark>')
 }
 
-// Update facets with counts
-function updateFacets() {
-  updateFacet('grade-facet', getUniqueValues('grade'))
-  updateFacet('subject-facet', getUniqueValues('subject'))
-  updateFacet('concept-facet', getUniqueValues('ctConcept'))
+/**
+ * Updates all filter facets based on the current search and filter state.
+ * This function implements the "faceted search" logic.
+ */
+function updateAllFacets() {
+    const facets = ['grade', 'subject', 'ctConcept'];
+    facets.forEach(facetToUpdate => {
+        let tempFilteredLessons = [...allLessons];
+
+        // Filter by search query
+        if (searchState.query) {
+            tempFilteredLessons = tempFilteredLessons.filter(lesson =>
+                ['lessonTitle', 'originalAuthor', 'subject', 'ctConcept', 'grade'].some(field =>
+                    lesson[field]?.toLowerCase().includes(searchState.query.toLowerCase())
+                )
+            );
+        }
+
+        // Filter by OTHER active facets
+        facets.forEach(otherFacet => {
+            if (otherFacet !== facetToUpdate && searchState.filters[otherFacet].length > 0) {
+                tempFilteredLessons = tempFilteredLessons.filter(lesson =>
+                    searchState.filters[otherFacet].some(value => lesson[otherFacet]?.includes(value))
+                );
+            }
+        });
+
+        // Now, get the counts for the facet we are currently updating
+        const counts = getCountsForFacet(tempFilteredLessons, facetToUpdate);
+        renderFacet(`${facetToUpdate}-facet`, counts, searchState.filters[facetToUpdate]);
+    });
+}
+
+
+/**
+ * Calculates the unique values and their counts for a specific facet from a list of lessons.
+ * @param {Lesson[]} lessonsToCount - The array of lessons to process.
+ * @param {string} field - The lesson property to count (e.g., 'grade', 'subject').
+ * @returns {Map<string, number>} A map where keys are unique values and values are their counts.
+ */
+function getCountsForFacet(lessonsToCount, field) {
+    const counts = new Map();
+    lessonsToCount.forEach(lesson => {
+        const values = lesson[field]?.split(',').map(v => v.trim()).filter(Boolean);
+        if (values) {
+            values.forEach(value => {
+                counts.set(value, (counts.get(value) || 0) + 1);
+            });
+        }
+    });
+    return counts;
 }
 
 function getUniqueValues(field) {
@@ -147,21 +259,33 @@
   const counts = {}
   lessons.forEach(lesson => {
     const values = lesson[field].split(', ')
-    values.forEach(value => {
-      if (value) counts[value] = (counts[value] || 0) + 1
-    })
+/**
+ * Renders a single facet's UI with checkboxes, labels, and counts.
+ * @param {string} elementId - The ID of the <ul> element for the facet.
+ * @param {Map<string, number>} counts - A map of value-to-count for the facet.
+ * @param {string[]} selectedValues - An array of the currently selected values for this facet.
+ */
+function renderFacet(elementId, counts, selectedValues) {
+    const container = document.getElementById(elementId);
+    if (!container) return;
+
+    // Sort values alphabetically for consistent display
+    const sortedValues = [...counts.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
+
+    if (sortedValues.length === 0) {
+        container.innerHTML = '<li>No options available</li>';
+        return;
+    }
+
+    container.innerHTML = sortedValues.map(value => {
+        const count = counts.get(value);
+        const isChecked = selectedValues.includes(value);
+        return `
+      <li>
+        <label>
+          <input type="checkbox" value="${value}" class="facet-checkbox" ${isChecked ? 'checked' : ''}>
+          <span class="facet-value">${value}</span>
+          <span class="facet-count">${count}</span>
+        </label>
+      </li>
+    `;
+    }).join('');
   })
   return Object.entries(counts).sort((a, b) => b[1] - a[1])
 }
@@ -183,12 +307,17 @@
   container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
     checkbox.addEventListener('change', searchLessons)
   })
-}
-
+/**
+ * Updates the results count display.
+ * @param {number} count - The number of results found.
+ */
 function updateResultsCount(count) {
-  const element = document.getElementById('results-count')
-  if (element) {
-    element.textContent = `${count} ${count === 1 ? 'result' : 'results'}`
-  }
+    const element = document.getElementById('results-count');
+    if (element) {
+        element.textContent = `${count} ${count === 1 ? 'result' : 'results'}`;
+    }
 }
 
 // Clear all filters
@@ -196,48 +325,82 @@
   document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false)
   const searchInput = document.getElementById('search-input')
   if (searchInput) searchInput.value = ''
-  searchLessons()
+/**
+ * Clears all active filters and the search query, then re-runs the search.
+ */
+function clearFilters() {
+    document.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
+    const searchInput = document.getElementById('search-input');
+    if (searchInput) searchInput.value = '';
+
+    // Reset state and re-render
+    searchAndRender();
+}
+
+/**
+ * Reads the current state of all UI controls (inputs, checkboxes, selects)
+ * and updates the central `searchState` object.
+ */
+function updateStateFromDOM() {
+    const searchInput = document.getElementById('search-input');
+    searchState.query = searchInput ? searchInput.value : '';
+
+    searchState.filters.grade = Array.from(document.querySelectorAll('#grade-facet input:checked')).map(cb => cb.value);
+    searchState.filters.subject = Array.from(document.querySelectorAll('#subject-facet input:checked')).map(cb => cb.value);
+    searchState.filters.ctConcept = Array.from(document.querySelectorAll('#concept-facet input:checked')).map(cb => cb.value);
+
+    const sortSelect = document.getElementById('sort-select');
+    searchState.sortBy = sortSelect ? sortSelect.value : 'lessonTitle';
+
+    const sortOrderToggle = document.getElementById('sort-order-toggle');
+    searchState.sortOrder = sortOrderToggle ? sortOrderToggle.dataset.order : 'asc';
 }
 
 // Create debounced search function
-const debouncedSearch = debounce(searchLessons, 300)
-
-// Initialize and attach event listeners when DOM is ready
+const debouncedSearchAndRender = debounce(searchAndRender, 300);
+
+/**
+ * Initializes the search page by attaching all necessary event listeners to the DOM elements.
+ */
 function initializeSearch() {
-  // Load lessons
-  loadLessons()
-  
-  // Attach event listeners
-  const searchInput = document.getElementById('search-input')
-  if (searchInput) {
-    searchInput.addEventListener('input', debouncedSearch)
-  }
-  
-  // Prevent form submission
-  const searchForm = document.querySelector('form[role="search"]')
-  if (searchForm) {
-    searchForm.addEventListener('submit', (e) => {
-      e.preventDefault()
-      searchLessons()
-    })
-  }
-  
-  // Sort select
-  const sortSelect = document.getElementById('sort-select')
-  if (sortSelect) {
-    sortSelect.addEventListener('change', searchLessons)
-  }
-  
-  // Clear filters button
-  const clearButton = document.getElementById('clear-filters-btn')
-  if (clearButton) {
-    clearButton.addEventListener('click', clearFilters)
-  }
-}
-
-// Initialize on DOM ready
+    // Load lesson data first
+    loadLessons();
+
+    // Search input
+    document.getElementById('search-input')?.addEventListener('input', debouncedSearchAndRender);
+
+    // Prevent form submission which reloads the page
+    document.querySelector('form[role="search"]')?.addEventListener('submit', (e) => e.preventDefault());
+
+    // Sort select dropdown
+    document.getElementById('sort-select')?.addEventListener('change', searchAndRender);
+
+    // Sort order toggle button
+    document.getElementById('sort-order-toggle')?.addEventListener('click', (e) => {
+        const button = e.currentTarget;
+        const newOrder = button.dataset.order === 'asc' ? 'desc' : 'asc';
+        button.dataset.order = newOrder;
+        button.textContent = newOrder === 'asc' ? 'Ascending' : 'Descending';
+        searchAndRender();
+    });
+
+    // Filter checkboxes (delegated to the parent column)
+    document.getElementById('left-column')?.addEventListener('change', (e) => {
+        if (e.target.matches('.facet-checkbox')) {
+            searchAndRender();
+        }
+    });
+
+    // Clear filters button
+    document.getElementById('clear-filters-btn')?.addEventListener('click', clearFilters);
+}
+
+
+// --- SCRIPT EXECUTION ---
+
+// Wait for the DOM to be fully loaded before initializing.
 if (document.readyState === 'loading') {
-  document.addEventListener('DOMContentLoaded', initializeSearch)
+    document.addEventListener('DOMContentLoaded', initializeSearch);
 } else {
-  initializeSearch()
+    initializeSearch();
 }

```