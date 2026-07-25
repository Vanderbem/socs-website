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
    sortOrder: 'asc',
    currentPage: 1,
    pageSize: 5
};

async function loadLessons() {
    const hitsContainer = document.getElementById('hits')
    if (hitsContainer) {
        hitsContainer.innerHTML = '<li class="loading-message">Loading lessons...</li>';
    }

    try {
        const response = await fetch('/api/lessons');
        const lessonsData = await response.json();

        if (!response.ok) {
            const detail = lessonsData.details;
            const detailMessage = typeof detail === 'string'
                ? detail
                : [
                    detail?.message,
                    detail?.cause,
                    detail?.code ? `code: ${detail.code}` : '',
                    detail?.constraint ? `constraint: ${detail.constraint}` : '',
                    detail?.table ? `table: ${detail.table}` : '',
                    detail?.column ? `column: ${detail.column}` : '',
                    detail?.detail,
                ].filter(Boolean).join(' | ');
            throw new Error(detailMessage || lessonsData.error || `Failed to load lessons (${response.status})`);
        }

        // Pre-filter lessons to only include those that are ready to publish and have a valid link.
        allLessons = lessonsData.filter(lesson =>
            lesson.readyToPublish && lesson.linkToFolder && lesson.linkToFolder.trim() !== ''
        );

        searchAndRender(); // Perform initial render
    } catch (error) {
        console.error('Failed to load lessons:', error);
        if (hitsContainer) {
            hitsContainer.innerHTML = `<li class="error-message">Error loading lessons: ${escapeHtml(error.message || 'Please try refreshing the page.')}</li>`;
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
        if (Array.isArray(selectedValues) && selectedValues.length > 0) {
            const facetField = facet === 'ctConcept' ? 'ctConcept' : facet; // Map facet names to field names
            filteredLessons = filteredLessons.filter(lesson =>
                selectedValues.some(value => lesson[facetField]?.includes(value))
            );
        }
    });
    
    // 2b. Apply Has Spanish boolean filter
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

    // --- PAGING ---
    const totalResults = filteredLessons.length;
    const pageSize = searchState.pageSize || 10;
    const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

    // Clamp current page
    if (!searchState.currentPage || searchState.currentPage < 1) searchState.currentPage = 1;
    if (searchState.currentPage > totalPages) searchState.currentPage = totalPages;

    const startIndex = (searchState.currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalResults);

    const lessonsForPage = filteredLessons.slice(startIndex, endIndex);

    renderLessons(lessonsForPage);
    renderPagination(totalResults, searchState.currentPage, pageSize);
    updateAllFacets();
    updateResultsCount(totalResults, startIndex + 1, endIndex);
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
            <button onclick="handleLessonClick('${lesson.id}', '${lesson.linkToFolder.replace(/'/g, "\\'")}', &quot;${lesson.lessonTitle.replace(/"/g, "&quot;")}&quot;, false)" class="btn-primary">
                View Lesson →
            </button>
            ${lesson.linkToMaterials && lesson.linkToMaterials.trim() !== '' ? `
            <button onclick="handleLessonClick('${lesson.id}', '${(lesson.linkToMaterials || '').replace(/'/g, "\\'")}', &quot;${lesson.lessonTitle.replace(/"/g, "&quot;")}&quot;, false)" class="btn-secondary" style="margin-left:8px;">
                View Materials
            </button>
            ` : ''}
            ${lesson.linkToSpanishLesson && lesson.linkToSpanishLesson.trim() !== '' ? `
            <button onclick="handleLessonClick('${lesson.id}', '${(lesson.linkToSpanishLesson || '').replace(/'/g, "\\'")}', &quot;${lesson.lessonTitle.replace(/"/g, "&quot;")}&quot;, true)" class="btn-secondary" style="margin-left:8px;">
                Spanish Lesson
            </button>
            ` : ''}
            ${lesson.linkToSpanishMaterials && lesson.linkToSpanishMaterials.trim() !== '' ? `
            <button onclick="handleLessonClick('${lesson.id}', '${(lesson.linkToSpanishMaterials || '').replace(/'/g, "\\'")}', &quot;${lesson.lessonTitle.replace(/"/g, "&quot;")}&quot;, true)" class="btn-secondary" style="margin-left:8px;">
                Spanish Materials
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
    const facets = ['grade', 'subject', 'ctConcept'];
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

        if (searchState.filters.hasSpanish) {
            tempFilteredLessons = tempFilteredLessons.filter(lesson => !!lesson.hasSpanish);
        }

        // Now, get the counts for the facet we are currently updating
        const counts = getCountsForFacet(tempFilteredLessons, facetToUpdate);
        const facetElementId = facetToUpdate === 'ctConcept' ? 'concept-facet' : `${facetToUpdate}-facet`;
        renderFacet(facetElementId, counts, searchState.filters[facetToUpdate]);
    });

    updateSpanishFacetCount();
}

function updateSpanishFacetCount() {
  let tempFilteredLessons = [...allLessons];

  if (searchState.query) {
    tempFilteredLessons = tempFilteredLessons.filter(lesson =>
      ['lessonTitle', 'originalAuthor', 'subject', 'ctConcept', 'grade'].some(field =>
        lesson[field]?.toLowerCase().includes(searchState.query.toLowerCase())
      )
    );
  }

  ['grade', 'subject', 'ctConcept'].forEach(facet => {
    if (searchState.filters[facet].length > 0) {
      tempFilteredLessons = tempFilteredLessons.filter(lesson =>
        searchState.filters[facet].some(value => lesson[facet]?.includes(value))
      );
    }
  });

  const container = document.getElementById('spanish-facet');
  if (!container) return;

  const count = tempFilteredLessons.filter(lesson => !!lesson.hasSpanish).length;
  const isChecked = !!searchState.filters.hasSpanish;

  container.innerHTML = `
    <li class="${isChecked ? 'active' : ''}">
      <label>
        <input type="checkbox" id="has-spanish-checkbox" class="facet-checkbox" ${isChecked ? 'checked' : ''}>
        <span class="facet-value">Has Spanish</span>
        <span class="facet-count">${count}</span>
      </label>
    </li>
  `;
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

function updateResultsCount(total, start, end) {
    const element = document.getElementById('results-count');
    if (!element) return;
    if (typeof start === 'number' && typeof end === 'number' && total > 0) {
        element.textContent = `Showing ${start}–${end} of ${total} ${total === 1 ? 'result' : 'results'}`;
    } else {
        element.textContent = `${total} ${total === 1 ? 'result' : 'results'}`;
    }
}

function clearFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    searchState.filters.hasSpanish = false;

    // Reset paging
    searchState.currentPage = 1;

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

    // leave currentPage as-is (controlled by pagination UI or reset by interactions)
}

// PAGINATION RENDERING
function renderPagination(totalResults, currentPage, pageSize) {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
    if (totalPages === 1) {
        container.innerHTML = ''; // no pagination needed
        return;
    }

    const createPageBtn = (page, label = null, disabled = false, active = false) => {
        const text = label || String(page);
        return `<button class="page-btn${active ? ' active' : ''}" data-page="${page}" ${disabled ? 'disabled' : ''}>${text}</button>`;
    };

    let html = '';
    html += createPageBtn(currentPage - 1, 'Prev', currentPage === 1);

    // simple windowing: show first, maybe ellipsis, neighbors, maybe ellipsis, last
    const maxVisible = 7;
    let start = Math.max(1, currentPage - 3);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
        html += createPageBtn(1, '1', false, currentPage === 1);
        if (start > 2) html += `<span class="ellipsis">…</span>`;
    }

    for (let p = start; p <= end; p++) {
        html += createPageBtn(p, String(p), false, p === currentPage);
    }

    if (end < totalPages) {
        if (end < totalPages - 1) html += `<span class="ellipsis">…</span>`;
        html += createPageBtn(totalPages, String(totalPages), false, currentPage === totalPages);
    }

    html += createPageBtn(currentPage + 1, 'Next', currentPage === totalPages);

    container.innerHTML = html;

    // attach delegated click handler
    container.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = Number(e.currentTarget.dataset.page);
            setPage(page);
        });
    });
}

// Expose setPage so inline handlers can use it (and for debugging)
function setPage(page) {
    const pageNum = Number(page) || 1;
    searchState.currentPage = Math.max(1, pageNum);
    searchAndRender();
}
window.setPage = setPage;

// Create debounced search function
const debouncedSearchAndRender = debounce(searchAndRender, 300);

function initializeSearch() {
    // Load lesson data first
    loadLessons();

    // Search input
    const searchInputEl = document.getElementById('search-input');
    if (searchInputEl) {
        searchInputEl.addEventListener('input', () => {
            searchState.currentPage = 1;
            debouncedSearchAndRender();
        });
    }

    // Prevent form submission which reloads the page
    document.querySelector('form[role="search"]')?.addEventListener('submit', (e) => e.preventDefault());

    // Sort select dropdown
    document.getElementById('sort-select')?.addEventListener('change', () => {
        searchState.currentPage = 1;
        searchAndRender();
    });

    // Sort order toggle button
    document.getElementById('sort-order-toggle')?.addEventListener('click', (e) => {
        const button = e.currentTarget;
        const newOrder = button.dataset.order === 'asc' ? 'desc' : 'asc';
        button.dataset.order = newOrder;
        button.textContent = newOrder === 'asc' ? 'Ascending' : 'Descending';
        searchState.currentPage = 1;
        searchAndRender();
    });

    // Filter checkboxes (delegated to the parent column)
    document.getElementById('left-column')?.addEventListener('change', (e) => {
        if (e.target.matches('.facet-checkbox')) {
            searchState.currentPage = 1;
            searchAndRender();
        }
    });

    // Clear filters button
    document.getElementById('clear-filters-btn')?.addEventListener('click', clearFilters);
}

// --- LESSON ACCESS LOGIC ---

async function handleLessonClick(lessonId, lessonUrl, lessonTitle, isSpanish = false) {
  if (!lessonUrl || lessonUrl.trim() === '') {
    alert('No link available for this item');
    return;
  }

  const lessonWindow = window.open('about:blank', '_blank');

  if (!lessonWindow) {
    alert('Please allow pop-ups to open lesson links.');
    return;
  }

  lessonWindow.opener = null;

  try {
    // start new
    // 1. Prepare headers
    const headers = { 'Content-Type': 'application/json' };

    // 2. Fetch a fresh Bearer token from Clerk if available on window
    if (window.Clerk && window.Clerk.session) {
      try {
        const token = await window.Clerk.session.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (tokenErr) {
        console.warn('Could not retrieve Clerk token, falling back to cookies:', tokenErr);
      }
    }
    // 3. code below is sending traxcking request with authorization header 
    // end new
    const response = await fetch('/api/track/lesson-access', {
      method: 'POST',
      // old --> credentials: 'same-origin',
      // new
      credentials: 'include', // Ensure cookies are sent for session-based auth
      // old --> headers: { 'Content-Type': 'application/json' },
      // new
      headers: headers,
      body: JSON.stringify({
        lessonId,
        lessonUrl,
        isSpanish,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('Lesson access was not logged:', response.status, errorBody);
    }
  } catch (error) {
    console.error(`Failed to track lesson access for ${lessonTitle}:`, error);
  } finally {
    lessonWindow.location.href = lessonUrl;
  }
}

// Expose handleLessonClick to the global scope so inline `onclick` attributes can find it
window.handleLessonClick = handleLessonClick;

// --- PROFILE LOGIC ---

function setProfileStatus(message, isError = false) {
  const status = document.getElementById('profile-status');
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? '#d32f2f' : '#2e7d32';
}

function setProfileFormDisabled(isDisabled) {
  const form = document.getElementById('profile-form');
  if (!form) return;

  form.querySelectorAll('input, select, button').forEach((field) => {
    if (field.id === 'cancel-profile-button') return;
    field.disabled = isDisabled;
  });
}

async function loadProfile() {
  const emailInput = document.getElementById('profile-email');
  const nameInput = document.getElementById('profile-name');
  const gradeSelect = document.getElementById('profile-grade');
  const districtInput = document.getElementById('profile-district');

  setProfileStatus('Loading profile...');
  setProfileFormDisabled(true);

  try {
    const response = await fetch('/api/profile');
    const profile = await response.json();

    if (!response.ok) {
      throw new Error(profile.error || 'Unable to load profile');
    }

    if (emailInput) emailInput.value = profile.email || '';
    if (nameInput) nameInput.value = profile.name || '';
    if (gradeSelect) gradeSelect.value = profile.gradeLevel || '';
    if (districtInput) districtInput.value = profile.district || '';
    setProfileStatus('');
  } catch (error) {
    console.error('Failed to load profile:', error);
    setProfileStatus(error.message || 'Unable to load profile.', true);
  } finally {
    setProfileFormDisabled(false);
  }
}

function openProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  loadProfile();
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  const form = document.getElementById('profile-form');

  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
  if (form) form.reset();
  setProfileStatus('');
}

async function saveProfile(event) {
  event.preventDefault();

  const gradeSelect = document.getElementById('profile-grade');
  const districtInput = document.getElementById('profile-district');
  const gradeLevel = gradeSelect?.value || null;
  const district = districtInput?.value.trim() || null;

  setProfileStatus('Saving profile...');
  setProfileFormDisabled(true);

  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gradeLevel, district }),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Unable to save profile');
    }

    setProfileStatus('Profile saved.');
    window.setTimeout(closeProfileModal, 900);
  } catch (error) {
    console.error('Failed to save profile:', error);
    setProfileStatus(error.message || 'Unable to save profile.', true);
  } finally {
    setProfileFormDisabled(false);
  }
}

function initializeProfileModal() {
  document.getElementById('open-profile-modal')?.addEventListener('click', openProfileModal);
  document.getElementById('cancel-profile-button')?.addEventListener('click', closeProfileModal);
  document.getElementById('profile-form')?.addEventListener('submit', saveProfile);
}

// --- FEEDBACK DRAFT LOGIC ---

const FEEDBACK_RECIPIENT = 'vanderbem@sou.edu';
let selectedFeedbackLesson = null;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getFeedbackText() {
  return document.getElementById('feedback-text')?.value.trim() || '';
}

function formatFeedbackDraft() {
  const feedbackText = getFeedbackText();
  const lessonTitle = selectedFeedbackLesson?.lessonTitle?.trim();
  const lessonLink = selectedFeedbackLesson?.linkToFolder?.trim();
  const subject = lessonTitle
    ? `SOCS lesson feedback: ${lessonTitle}`
    : 'SOCS lesson feedback';

  const lines = [
    `To: ${FEEDBACK_RECIPIENT}`,
    `Subject: ${subject}`,
    '',
    'Feedback:',
    feedbackText || '[Enter feedback here]',
  ];

  if (lessonTitle || lessonLink) {
    lines.push('', 'Lesson:');
    if (lessonTitle) lines.push(`Title: ${lessonTitle}`);
    if (lessonLink) lines.push(`Link: ${lessonLink}`);
  }

  lines.push('', `Submitted from: ${window.location.href}`);

  return lines.join('\n');
}

function updateFeedbackPreview() {
  const preview = document.getElementById('feedback-preview');
  if (!preview) return;
  preview.textContent = formatFeedbackDraft();
}

function setFeedbackStatus(message, isError = false) {
  const status = document.getElementById('feedback-status');
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? '#d32f2f' : '#2e7d32';
}

function clearFeedbackStatusSoon() {
  window.setTimeout(() => setFeedbackStatus(''), 2500);
}

function openFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  updateFeedbackPreview();
  document.getElementById('feedback-text')?.focus();
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  const form = document.getElementById('feedback-form');
  const lessonGroup = document.getElementById('feedback-lesson-group');
  const results = document.getElementById('feedback-lesson-results');
  const selectedLesson = document.getElementById('feedback-selected-lesson');

  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
  if (form) form.reset();
  if (lessonGroup) lessonGroup.style.display = 'none';
  if (results) {
    results.innerHTML = '';
    results.style.display = 'none';
  }
  if (selectedLesson) {
    selectedLesson.innerHTML = '';
    selectedLesson.style.display = 'none';
  }
  selectedFeedbackLesson = null;
  setFeedbackStatus('');
  updateFeedbackPreview();
}

function renderSelectedFeedbackLesson() {
  const selectedLesson = document.getElementById('feedback-selected-lesson');
  if (!selectedLesson) return;

  if (!selectedFeedbackLesson) {
    selectedLesson.innerHTML = '';
    selectedLesson.style.display = 'none';
    updateFeedbackPreview();
    return;
  }

  selectedLesson.innerHTML = `
    <strong>${escapeHtml(selectedFeedbackLesson.lessonTitle)}</strong>
    <span>${escapeHtml(selectedFeedbackLesson.linkToFolder)}</span>
  `;
  selectedLesson.style.display = 'block';
  updateFeedbackPreview();
}

function selectFeedbackLesson(lessonIndex) {
  const lesson = allLessons[lessonIndex];
  if (!lesson) return;

  selectedFeedbackLesson = lesson;
  const searchInput = document.getElementById('feedback-lesson-search');
  const results = document.getElementById('feedback-lesson-results');

  if (searchInput) searchInput.value = lesson.lessonTitle || '';
  if (results) {
    results.innerHTML = '';
    results.style.display = 'none';
  }
  renderSelectedFeedbackLesson();
}

function renderFeedbackLessonResults(query) {
  const results = document.getElementById('feedback-lesson-results');
  if (!results) return;

  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    results.innerHTML = '';
    results.style.display = 'none';
    return;
  }

  const matches = allLessons
    .map((lesson, index) => ({ lesson, index }))
    .filter(({ lesson }) => lesson.lessonTitle?.toLowerCase().includes(normalizedQuery))
    .slice(0, 8);

  if (matches.length === 0) {
    results.innerHTML = '<div class="feedback-lesson-result">No matching lessons found</div>';
    results.style.display = 'block';
    return;
  }

  results.innerHTML = matches.map(({ lesson, index }) => `
    <button type="button" class="feedback-lesson-result" data-lesson-index="${index}">
      ${escapeHtml(lesson.lessonTitle)}
    </button>
  `).join('');
  results.style.display = 'block';
}

function downloadFeedbackDraft() {
  const draft = formatFeedbackDraft();
  const today = new Date().toISOString().slice(0, 10);
  const blob = new Blob([draft], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `socs-lesson-feedback-${today}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function copyFeedbackDraft() {
  const draft = formatFeedbackDraft();

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(draft);
    } else {
      const tempTextArea = document.createElement('textarea');
      tempTextArea.value = draft;
      tempTextArea.setAttribute('readonly', '');
      tempTextArea.style.position = 'fixed';
      tempTextArea.style.left = '-9999px';
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand('copy');
      document.body.removeChild(tempTextArea);
    }

    setFeedbackStatus('Draft copied.');
    clearFeedbackStatusSoon();
  } catch (error) {
    console.error('Failed to copy feedback draft:', error);
    setFeedbackStatus('Unable to copy draft. Please download it instead.', true);
  }
}

function initializeFeedbackModal() {
  const form = document.getElementById('feedback-form');
  const openButton = document.getElementById('open-feedback-modal');
  const cancelButton = document.getElementById('cancel-feedback-button');
  const copyButton = document.getElementById('copy-feedback-button');
  const includeLessonToggle = document.getElementById('include-lesson-toggle');
  const lessonSearch = document.getElementById('feedback-lesson-search');
  const lessonResults = document.getElementById('feedback-lesson-results');
  const feedbackText = document.getElementById('feedback-text');

  openButton?.addEventListener('click', openFeedbackModal);
  cancelButton?.addEventListener('click', closeFeedbackModal);
  copyButton?.addEventListener('click', copyFeedbackDraft);
  feedbackText?.addEventListener('input', updateFeedbackPreview);

  includeLessonToggle?.addEventListener('change', (event) => {
    const lessonGroup = document.getElementById('feedback-lesson-group');
    const includeLesson = event.target.checked;

    if (lessonGroup) lessonGroup.style.display = includeLesson ? 'block' : 'none';
    if (!includeLesson) {
      selectedFeedbackLesson = null;
      if (lessonSearch) lessonSearch.value = '';
      if (lessonResults) {
        lessonResults.innerHTML = '';
        lessonResults.style.display = 'none';
      }
      renderSelectedFeedbackLesson();
    } else {
      lessonSearch?.focus();
    }
  });

  lessonSearch?.addEventListener('input', (event) => {
    selectedFeedbackLesson = null;
    renderSelectedFeedbackLesson();
    renderFeedbackLessonResults(event.target.value);
  });

  lessonResults?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-lesson-index]');
    if (!button) return;
    selectFeedbackLesson(Number(button.dataset.lessonIndex));
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!getFeedbackText()) {
      setFeedbackStatus('Please enter feedback before downloading.', true);
      return;
    }

    downloadFeedbackDraft();
    setFeedbackStatus('Draft downloaded.');
    clearFeedbackStatusSoon();
  });

  updateFeedbackPreview();
}

// --- SCRIPT EXECUTION ---

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeSearch();
        initializeProfileModal();
        initializeFeedbackModal();
    });
} else {
    initializeSearch();
    initializeProfileModal();
    initializeFeedbackModal();
}
