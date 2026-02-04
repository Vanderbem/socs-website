let allLessons = [];
let searchTimeoutId = null;

const searchState = {
    query: '',
    filters: {
        grade: [],
        subject: [],
      ctConcept: [],
      hasSpanish: false
    },
    sortBy: 'lessonTitle',
    sortOrder: 'asc'
};

async function loadLessons() {
    const hitsContainer = document.getElementById('hits')
    if (hitsContainer) {
        hitsContainer.innerHTML = '<li class="loading-message">Loading lessons...</li>';
    }

    try {
        const response = await fetch('/api/lessons');
        const lessonsData = await response.json();

        // Pre-filter lessons to only include those that are ready to publish and have a valid link.
        allLessons = lessonsData.filter(lesson =>
            lesson.readyToPublish && lesson.linkToFolder && lesson.linkToFolder.trim() !== ''
        );

        searchAndRender(); // Perform initial render
    } catch (error) {
        console.error('Failed to load lessons:', error);
        if (hitsContainer) {
            hitsContainer.innerHTML = '<li class="error-message">Error loading lessons. Please try refreshing the page.</li>';
        }
    }
}

function debounce(func, delay) {
    return function(...args) {
        clearTimeout(searchTimeoutId);
        searchTimeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function searchAndRender() {
    updateStateFromDOM();

    let filteredLessons = [...allLessons];

    // 1. Apply Search Query
    if (searchState.query) {
        const query = searchState.query.toLowerCase();
        filteredLessons = filteredLessons.filter(lesson =>
            ['lessonTitle', 'originalAuthor', 'subject', 'ctConcept', 'grade'].some(field =>
                lesson[field]?.toLowerCase().includes(query)
            )
        );
    }

    // 2. Apply Filters
    Object.entries(searchState.filters).forEach(([facet, selectedValues]) => {
        if (selectedValues.length > 0) {
            const facetField = facet === 'ctConcept' ? 'ctConcept' : facet; // Map facet names to field names
            filteredLessons = filteredLessons.filter(lesson =>
                selectedValues.some(value => lesson[facetField]?.includes(value))
            );
        }
    });
    
    // 2b. Apply Has Spanish boolean filter (checked => only show lessons with spanish)
    if (searchState.filters.hasSpanish) {
      filteredLessons = filteredLessons.filter(lesson => !!lesson.hasSpanish);
    }
  
    // 3. Apply Sorting
    const sortKey = searchState.sortBy;
    const sortOrder = searchState.sortOrder;
    
    filteredLessons.sort((a, b) => {
        let comparison;
        
        if (sortKey === 'grade') {
            // Custom grade sorting: K comes before numbers
            const gradeOrder = { 'K': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6 };
            
            // Handle complex grades like "1, 2" or "4, 5" by taking the first grade
            const getFirstGrade = (grade) => {
                const firstGrade = grade.split(',')[0].trim();
                return gradeOrder[firstGrade] !== undefined ? gradeOrder[firstGrade] : 999;
            };
            
            const gradeA = getFirstGrade(a.grade || '');
            const gradeB = getFirstGrade(b.grade || '');
            comparison = gradeA - gradeB;
        } else {
            // Default alphabetical sorting for other fields
            comparison = (a[sortKey] || '').localeCompare(b[sortKey] || '', undefined, { numeric: true });
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    renderLessons(filteredLessons);
    updateAllFacets();
    updateResultsCount(filteredLessons.length);
}

function renderLessons(lessonsToRender) {
  const container = document.getElementById('hits')
  if (!container) return
  
  if (lessonsToRender.length === 0) {
    container.innerHTML = '<ul class="no-results">No lessons found</ul>'
    return
  }
  
  container.innerHTML = lessonsToRender.map(lesson => {
    const highlightedTitle = highlightText(lesson.lessonTitle);
    return `
    <ul class="ais-Hits-item">
      <div class="hit">
        <div class="hit-content">
          <div class="hit-header">
            <h2 class="hit-name">${highlightedTitle}</h2>
          </div>
          <p class="hit-category-breadcrumb">
            Grade ${lesson.grade} • ${lesson.subject}
          </p>
          <div class="hit-concepts">
            ${lesson.ctConcept.split(', ').map(concept => 
              `<span class="concept-tag">${concept}</span>`
            ).join('')}
          </div>
          
          <p class="hit-author">
            By ${lesson.originalAuthor}
            ${lesson.revisedBy ? ` • Revised by ${lesson.revisedBy}` : ''}
          </p>
          <div class="hit-footer">
            ${lesson.dateFinalized ? `<span class="hit-date">Finalized: ${lesson.dateFinalized}</span>` : ''}
          </div>
          <div class="hit-actions">
            <button onclick="handleLessonClick('${lesson.linkToFolder.replace(/'/g, "\\'")}', &quot;${lesson.lessonTitle.replace(/"/g, "&quot;")}&quot;)" class="btn-primary">
                View Lesson →
            </button>
            ${lesson.linkToMaterials && lesson.linkToMaterials.trim() !== '' ? `
            <button onclick="handleLessonClick('${(lesson.linkToMaterials || '').replace(/'/g, "\\'")}', &quot;${lesson.lessonTitle.replace(/"/g, "&quot;")}&quot;)" class="btn-secondary" style="margin-left:8px;">
                View Materials
            </button>
            ` : ''}
          </div>
        </div>
      </div>
    </ul>
  `}).join('')
}

function highlightText(text) {
  const query = searchState.query;
  if (!query) return text

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

function updateAllFacets() {
    const facets = ['grade', 'subject', 'ctConcept', 'hasSpanish'];
    facets.forEach(facetToUpdate => {
        let tempFilteredLessons = [...allLessons];

        // Filter by search query
        if (searchState.query) {
            tempFilteredLessons = tempFilteredLessons.filter(lesson =>
                ['lessonTitle', 'originalAuthor', 'subject', 'ctConcept', 'grade'].some(field =>
                    lesson[field]?.toLowerCase().includes(searchState.query.toLowerCase())
                )
            );
        }

        // Filter by OTHER active facets
        facets.forEach(otherFacet => {
            if (otherFacet !== facetToUpdate && searchState.filters[otherFacet].length > 0) {
                tempFilteredLessons = tempFilteredLessons.filter(lesson =>
                    searchState.filters[otherFacet].some(value => lesson[otherFacet]?.includes(value))
                );
            }
        });

        // Special handling for boolean Has Spanish facet
        if (facetToUpdate === 'hasSpanish') {
          const count = tempFilteredLessons.filter(lesson => !!lesson.hasSpanish).length;
          const container = document.getElementById('spanish-facet');
          if (container) {
            const isChecked = !!searchState.filters.hasSpanish;
            container.innerHTML = `\n          <li>\n            <label>\n              <input type="checkbox" id="has-spanish-checkbox" class="facet-checkbox" ${isChecked ? 'checked' : ''}>\n              <span class="facet-value">Has Spanish</span>\n              <span class="facet-count">${count}</span>\n            </label>\n          </li>\n        `;
          }
          return; // move to next facet
        }

        // Now, get the counts for the facet we are currently updating
        const counts = getCountsForFacet(tempFilteredLessons, facetToUpdate);
        const facetElementId = facetToUpdate === 'ctConcept' ? 'concept-facet' : `${facetToUpdate}-facet`;
        renderFacet(facetElementId, counts, searchState.filters[facetToUpdate]);
    });
}


function getCountsForFacet(lessonsToCount, field) {
    const counts = new Map();
    lessonsToCount.forEach(lesson => {
        const values = lesson[field]?.split(',').map(v => v.trim()).filter(Boolean);
        if (values) {
            values.forEach(value => {
                counts.set(value, (counts.get(value) || 0) + 1);
            });
        }
    });
    return counts;
}

function renderFacet(elementId, counts, selectedValues) {
    const container = document.getElementById(elementId);
    if (!container) return;

    // Custom sorting for grade facet to ensure K comes first
    let sortedValues;
    if (elementId === 'grade-facet') {
        const gradeOrder = { 'K': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6 };
        sortedValues = [...counts.keys()].sort((a, b) => {
            const orderA = gradeOrder[a] !== undefined ? gradeOrder[a] : 999;
            const orderB = gradeOrder[b] !== undefined ? gradeOrder[b] : 999;
            if (orderA !== orderB) return orderA - orderB;
            // Fallback to alphabetical for non-standard grades
            return a.localeCompare(b, undefined, { numeric: true });
        });
    } else {
        // Sort values alphabetically for other facets
        sortedValues = [...counts.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }

    if (sortedValues.length === 0) {
        container.innerHTML = '<li>No options available</li>';
        return;
    }

    container.innerHTML = sortedValues.map(value => {
        const count = counts.get(value);
        const isChecked = selectedValues.includes(value);
        return `
      <li>
        <label>
          <input type="checkbox" value="${value}" class="facet-checkbox" ${isChecked ? 'checked' : ''}>
          <span class="facet-value">${value}</span>
          <span class="facet-count">${count}</span>
        </label>
      </li>
    `;
    }).join('');
}

function updateResultsCount(count) {
    const element = document.getElementById('results-count');
    if (element) {
        element.textContent = `${count} ${count === 1 ? 'result' : 'results'}`;
    }
}

function clearFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

  // Reset our hasSpanish flag in state
  searchState.filters.hasSpanish = false;

    // Reset state and re-render
    searchAndRender();
}

function updateStateFromDOM() {
    const searchInput = document.getElementById('search-input');
    searchState.query = searchInput ? searchInput.value : '';

    searchState.filters.grade = Array.from(document.querySelectorAll('#grade-facet input:checked')).map(cb => cb.value);
    searchState.filters.subject = Array.from(document.querySelectorAll('#subject-facet input:checked')).map(cb => cb.value);
    searchState.filters.ctConcept = Array.from(document.querySelectorAll('#concept-facet input:checked')).map(cb => cb.value);
    searchState.filters.hasSpanish = !!(document.getElementById('has-spanish-checkbox') && document.getElementById('has-spanish-checkbox').checked);

    const sortSelect = document.getElementById('sort-select');
    searchState.sortBy = sortSelect ? sortSelect.value : 'lessonTitle';

    const sortOrderToggle = document.getElementById('sort-order-toggle');
    searchState.sortOrder = sortOrderToggle ? sortOrderToggle.dataset.order : 'asc';
}

// Create debounced search function
const debouncedSearchAndRender = debounce(searchAndRender, 300);

function initializeSearch() {
    // Load lesson data first
    loadLessons();

    // Search input
    document.getElementById('search-input')?.addEventListener('input', debouncedSearchAndRender);

    // Prevent form submission which reloads the page
    document.querySelector('form[role="search"]')?.addEventListener('submit', (e) => e.preventDefault());

    // Sort select dropdown
    document.getElementById('sort-select')?.addEventListener('change', searchAndRender);

    // Sort order toggle button
    document.getElementById('sort-order-toggle')?.addEventListener('click', (e) => {
        const button = e.currentTarget;
        const newOrder = button.dataset.order === 'asc' ? 'desc' : 'asc';
        button.dataset.order = newOrder;
        button.textContent = newOrder === 'asc' ? 'Ascending' : 'Descending';
        searchAndRender();
    });

    // Filter checkboxes (delegated to the parent column)
    document.getElementById('left-column')?.addEventListener('change', (e) => {
        if (e.target.matches('.facet-checkbox')) {
            searchAndRender();
        }
    });

    // Clear filters button
    document.getElementById('clear-filters-btn')?.addEventListener('click', clearFilters);
}

// --- NEW ANALYTICS & LESSON VIEW LOGIC ---

let lessonUrlToOpen = null;
let lessonTitleToTrack = null;

/**
 * Handles clicking on a "View Lesson" button.
 * Stores the lesson URL and title, then displays the analytics modal.
 */
function handleLessonClick(lessonUrl, lessonTitle) {
  // Guard: don't open analytics modal for empty/invalid URLs
  if (!lessonUrl || lessonUrl.trim() === '') {
    alert('No link available for this item');
    return;
  }

  lessonUrlToOpen = lessonUrl;
  lessonTitleToTrack = lessonTitle;
  document.getElementById('analytics-modal').style.display = 'flex';
}

// Expose handleLessonClick to the global scope so inline `onclick` attributes can find it
window.handleLessonClick = handleLessonClick;

/**
 * Hides the modal and opens the stored lesson link in a new tab.
 */
function proceedToLesson() {
  document.getElementById('analytics-modal').style.display = 'none';
  document.getElementById('analytics-form').reset();
  document.getElementById('grade-level-group').style.display = 'none';

  if (lessonUrlToOpen) {
    window.open(lessonUrlToOpen, '_blank', 'noopener,noreferrer');
    lessonUrlToOpen = null; // Clear after use
    lessonTitleToTrack = null; // Clear after use
  }
}

/**
 * Generates or retrieves a unique anonymous ID for the user.
 */
function getAnonymousId() {
  let anonId = localStorage.getItem('socs-anonymous-id');
  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem('socs-anonymous-id', anonId);
  }
  return anonId;
}

/**
 * Sets up event listeners for the analytics modal.
 */
function initializeAnalyticsModal() {
  const form = document.getElementById('analytics-form');
  const skipButton = document.getElementById('skip-button');
  const teacherRadios = document.querySelectorAll('input[name="isTeacher"]');

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const isTeacher = formData.get('isTeacher') === 'true';
    const gradeLevel = formData.get('gradeLevel') || null;
    const schoolDistrict = formData.get('schoolDistrict') || null;

    // Validate that if teacher is selected, grade level is provided
    if (isTeacher && !gradeLevel) {
      alert('Please select a grade level.');
      return;
    }

    const payload = {
      lessonUrl: lessonUrlToOpen,
      lessonTitle: lessonTitleToTrack || 'Unknown Lesson',
      isTeacher,
      gradeLevel,
      schoolDistrict,
      interactionType: 'submitted'
    };

    console.log('Submitting payload:', payload);

    try {
      const response = await fetch('/api/track/lesson-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Analytics submitted successfully');
    } catch (error) {
      console.error("Failed to submit analytics:", error);
      // We still proceed to the lesson even if the analytics call fails
    } finally {
      proceedToLesson();
    }
  });

  // Handle the skip button
  skipButton.addEventListener('click', async () => {
    // Track the skip interaction
    const payload = {
      lessonUrl: lessonUrlToOpen,
      lessonTitle: lessonTitleToTrack || 'Unknown Lesson',
      interactionType: 'skipped'
    };

    try {
      await fetch('/api/track/lesson-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('Skip interaction tracked');
    } catch (error) {
      console.error("Failed to track skip:", error);
    }

    proceedToLesson();
  });

  // Show/hide teacher fields based on teacher status
  teacherRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isTeacher = e.target.value === 'true';
      const gradeGroup = document.getElementById('grade-level-group');
      const teacherInfoGroup = document.getElementById('teacher-info-group');
      const gradeSelect = document.getElementById('gradeLevel');

      if (isTeacher) {
        gradeGroup.style.display = 'block';
        teacherInfoGroup.style.display = 'block';
        gradeSelect.required = true;
      } else {
        gradeGroup.style.display = 'none';
        teacherInfoGroup.style.display = 'none';
        gradeSelect.required = false;
      }
    });
  });
}

// --- SCRIPT EXECUTION ---

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeSearch();
        initializeAnalyticsModal();
    });
} else {
    initializeSearch();
    initializeAnalyticsModal();
}