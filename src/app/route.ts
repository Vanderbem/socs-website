import { NextResponse } from 'next/server'

export async function GET() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SOCS4AI Lesson Search</title>
  <link rel="stylesheet" href="/search/style.css">
  <link rel="stylesheet" href="/search/custom-overrides.css">
  <style>
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 2rem;
      flex: 1;
    }
    /* Analytics Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: none; /* Hidden by default */
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      width: 90%;
      max-width: 480px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }
    .modal-content h2 {
      margin-top: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }
    .modal-content p {
      margin-bottom: 1.5rem;
      color: #555;
    }
    .modal-content .form-group {
      margin-bottom: 1.5rem;
    }
    .modal-content label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .modal-content select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: #f8f8f8;
    }
    .modal-content #teacher-radios {
      display: flex;
      gap: 1rem;
    }
    .modal-content #teacher-radios label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 2rem;
    }
    .modal-buttons button {
        padding: 0.75rem 1.25rem;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .btn-submit {
        background-color: #0070f3;
        color: white;
    }
    .btn-submit:hover {
        background-color: #0051cc;
    }
    .btn-skip {
        background-color: #e0e0e0;
        color: #333;
    }
    .btn-skip:hover {
        background-color: #c7c7c7;
    }
  </style>
</head>
<body>
  <div class="instant-search-container">
    <header>
      <div class="header-left">
        <a href="/"><img src="/socs-wordmark.png" alt="SOCS For All" style="height: 50px;" /></a>
        <div id="search-input-container">
        <form action="" role="search">
          <input
            id="search-input"
            type="search"
            placeholder="Search for lessons..."
            class="ais-SearchBox-input"
          />
        </form>
      </div>
      </div>
    </header>

    <!-- Analytics Pop-up Modal -->
    <div id="analytics-modal" class="modal-overlay">
      <div class="modal-content">
        <h2>A quick question...</h2>
        <p>To help us improve our resources, please answer the following optional questions.</p>
        <form id="analytics-form">
          <div class="form-group">
            <label>Are you a teacher?</label>
            <div id="teacher-radios">
              <label><input type="radio" name="isTeacher" value="true" required> Yes</label>
              <label><input type="radio" name="isTeacher" value="false"> No</label>
            </div>
          </div>
          <div class="form-group" id="grade-level-group" style="display: none;">
            <label for="gradeLevel">What grade do you teach?</label>
            <select id="gradeLevel" name="gradeLevel">
              <option value="">Select a grade</option>
              <option value="K">Kindergarten</option>
              <option value="1">1st Grade</option>
              <option value="2">2nd Grade</option>
              <option value="3">3rd Grade</option>
              <option value="4">4th Grade</option>
              <option value="5">5th Grade</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group" id="teacher-info-group" style="display: none;">
            <label for="schoolDistrict">School District (Optional)</label>
            <input type="text" id="schoolDistrict" name="schoolDistrict" placeholder="Enter your school district" style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 1rem;">
          </div>
          <div class="modal-buttons">
            <button type="button" id="skip-button" class="btn-skip">Continue to Lesson</button>
            <button type="submit" class="btn-submit">Submit & Continue</button>
          </div>
        </form>
      </div>
    </div>

    <main>
      <div id="left-column">
        <div class="facet">
          <div class="facet-name">Grade Level</div>
          <ul class="facet-values" id="grade-facet"></ul>
        </div>
        
        <div class="facet">
          <div class="facet-name">Subject</div>
          <ul class="facet-values" id="subject-facet"></ul>
        </div>
        
        <div class="facet">
          <div class="facet-name">CT Concepts</div>
          <ul class="facet-values" id="concept-facet"></ul>
        </div>
        
        
        <button class="clear-filters" id="clear-filters-btn">
          Clear all filters
        </button>
      </div>

      <div id="right-column">
        <div class="results-header">
          <span id="results-count"></span>
          <div id="sort-by-wrapper">
            <select id="sort-select">
              <option value="lessonTitle">Title</option>
              <option value="grade">Grade</option>
              <option value="subject">Subject</option>
              <option value="ctConcept">CT Concept</option>
            </select>
            <button id="sort-order-toggle" data-order="asc">Ascending</button>
          </div>
        </div>
        
        <ul class="ais-Hits-list" id="hits"></ul>
      </div>
    </main>

    <footer>
      <p>Powered by SOCS4AI</p>
    </footer>
  </div>
  
  <script src="/search.js"></script>
</body>
</html>
  `
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}