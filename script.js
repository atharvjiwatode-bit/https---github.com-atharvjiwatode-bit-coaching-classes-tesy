document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     MOBILE NAVIGATION MENU
     ========================================================================== */
  const hamburger = document.getElementById('hamburger-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  const toggleMenu = () => {
    const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', !isExpanded);
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    
    // Prevent body scroll when menu is active on mobile
    document.body.style.overflow = !isExpanded ? 'hidden' : '';
  };

  const closeMenu = () => {
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', toggleMenu);

  // Close menu when clicking navigation links (enables section anchors)
  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  /* ==========================================================================
     SHRINKING STICKY HEADER
     ========================================================================== */
  const header = document.getElementById('main-header');
  let ticking = false;

  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('shrink');
    } else {
      header.classList.remove('shrink');
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  });

  // Run on initial load in case user refreshed part-way down the page
  handleScroll();

  /* ==========================================================================
     SCROLL REVEAL ANIMATIONS (Intersection Observer)
     ========================================================================== */
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Unobserve once revealed to keep layout performant
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12, // Trigger when 12% of the element is visible
    rootMargin: '0px 0px -50px 0px' // Slightly offset bottom trigger area
  });

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  /* ==========================================================================
     POPUP DETAILS MODALS (HTML5 <dialog> Fallback & Interactions)
     ========================================================================== */
  const dialogs = document.querySelectorAll('dialog');

  // Unified click handler for older/unsupported browsers (fallback for Invoker Commands)
  const supportsInvokers = 'commandForElement' in HTMLButtonElement.prototype;
  
  if (!supportsInvokers) {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('button[commandfor]');
      if (!button) return;

      const targetId = button.getAttribute('commandfor');
      const target = document.getElementById(targetId);
      const command = button.getAttribute('command');

      if (target && target.tagName === 'DIALOG' && command) {
        if (command === 'show-modal') {
          target.showModal();
        } else if (command === 'close') {
          target.close();
        }
      }
    });
  }

  // Light dismiss fallback: Close modal when clicking on the backdrop
  dialogs.forEach(dialog => {
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= event.clientY && 
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX && 
        event.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        dialog.close();
      }
    });
  });

  /* ==========================================================================
     TOAST NOTIFICATION COMPONENT
     ========================================================================== */
  const toastContainer = document.getElementById('toast-container');

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    toast.innerHTML = `
      <div class="toast-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="toast-message">${message}</div>
    `;

    toastContainer.appendChild(toast);

    // Force reflow to trigger CSS transition
    toast.offsetHeight;
    
    // Add show class
    toast.classList.add('show');

    // Remove toast after duration
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => {
        toast.remove();
      });
    }, 4000);
  };

  /* ==========================================================================
     ENQUIRY FORM VALIDATION (Accessibility & Visual States)
     ========================================================================== */
  const form = document.getElementById('enquiry-form');
  const nameInput = document.getElementById('input-name');
  const phoneInput = document.getElementById('input-phone');
  const courseInput = document.getElementById('input-course');

  // Synchronize aria-invalid with native input validity
  const syncAria = (el) => {
    // A submission attempt or interaction will trigger :user-invalid or custom dirty state
    const isValid = el.checkValidity();
    el.setAttribute('aria-invalid', !isValid ? 'true' : 'false');
  };

  // Add listeners to validate on blur and clear errors on input
  [nameInput, phoneInput, courseInput].forEach(input => {
    input.addEventListener('blur', () => {
      syncAria(input);
    });
    
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') {
        syncAria(input);
      }
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault(); // Keep page SPA-like and handle flow dynamically

    // Trigger validity check on all inputs
    const isNameValid = nameInput.checkValidity();
    const isPhoneValid = phoneInput.checkValidity();
    const isCourseValid = courseInput.checkValidity();

    syncAria(nameInput);
    syncAria(phoneInput);
    syncAria(courseInput);

    if (isNameValid && isPhoneValid && isCourseValid) {
      const studentName = nameInput.value.trim();
      const selectedCourse = courseInput.value;
      
      // Success response
      showToast(`Thank you, ${studentName}! Enquiry submitted for ${selectedCourse}.`);
      
      // Reset form states
      form.reset();
      
      [nameInput, phoneInput, courseInput].forEach(input => {
        input.removeAttribute('aria-invalid');
        // Reset classes for visual fallback if any
        input.classList.remove('user-invalid-fallback');
        input.classList.remove('user-valid-fallback');
      });
    } else {
      // Focus on first invalid input to guide screen readers and keyboard users
      if (!isNameValid) {
        nameInput.focus();
      } else if (!isPhoneValid) {
        phoneInput.focus();
      } else if (!isCourseValid) {
        courseInput.focus();
      }
      
      showToast("Please correct the highlighted errors in the form.");
    }
  });

  /* ==========================================================================
     STUDY ZONE INTERACTIVE UTILITIES
     ========================================================================== */
  
  // Tab Switching Logic
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.study-tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all buttons & contents
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active to current
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Active Recall Flashcards Data & Logic
  const flashcardsData = {
    'jee-physics': [
      { q: "What is Kepler's Third Law of Planetary Motion?", a: "The square of the orbital period of a planet is directly proportional to the cube of the semi-major axis of its orbit: T² ∝ a³." },
      { q: "Define escape velocity of a body from Earth.", a: "The minimum velocity required for a body to escape Earth's gravitational pull permanently. v_e = √(2gR) ≈ 11.2 km/s." },
      { q: "State the Work-Energy Theorem.", a: "The work done by the net force acting on a body is equal to the change in its kinetic energy: W_net = ΔK." }
    ],
    'neet-bio': [
      { q: "What are Mendelian inheritance ratios for a monohybrid cross?", a: "Phenotypic ratio is 3:1 (dominant to recessive). Genotypic ratio is 1:2:1 (homozygous dominant : heterozygous : homozygous recessive)." },
      { q: "What is the start codon in translation?", a: "AUG, which codes for the amino acid Methionine." },
      { q: "Define semi-conservative replication of DNA.", a: "Replication where each daughter DNA molecule contains one original parent strand and one newly synthesized strand, proven by Meselson and Stahl." }
    ],
    'upsc-polity': [
      { q: "Which article of the Indian Constitution covers the Right to Equality?", a: "Articles 14 to 18 of the Indian Constitution guarantee the Right to Equality." },
      { q: "What is the term of a member of the Rajya Sabha?", a: "6 years. It is a permanent body and 1/3rd of its members retire every 2 years." },
      { q: "Who is the custodian of the Indian Constitution?", a: "The Supreme Court of India." }
    ]
  };

  let currentSubject = 'jee-physics';
  let cardIndex = 0;

  const flashcardEl = document.getElementById('interactive-flashcard');
  const questionText = document.getElementById('flashcard-question-text');
  const answerText = document.getElementById('flashcard-answer-text');
  const currentCardNum = document.getElementById('current-card-num');
  const totalCardNum = document.getElementById('total-card-num');
  const selectSubject = document.getElementById('flashcard-subject');
  const prevBtn = document.getElementById('prev-flashcard-btn');
  const nextBtn = document.getElementById('next-flashcard-btn');

  // Flip flashcard
  flashcardEl.addEventListener('click', () => {
    flashcardEl.classList.toggle('flipped');
  });

  const updateCard = () => {
    // Reset flip state
    flashcardEl.classList.remove('flipped');
    
    // Slight delay to allow flip animation to reset before changing text
    setTimeout(() => {
      const currentList = flashcardsData[currentSubject];
      questionText.textContent = currentList[cardIndex].q;
      answerText.textContent = currentList[cardIndex].a;
      currentCardNum.textContent = cardIndex + 1;
      totalCardNum.textContent = currentList.length;
    }, 150);
  };

  selectSubject.addEventListener('change', (e) => {
    currentSubject = e.target.value;
    cardIndex = 0;
    updateCard();
  });

  prevBtn.addEventListener('click', () => {
    const currentList = flashcardsData[currentSubject];
    cardIndex = (cardIndex - 1 + currentList.length) % currentList.length;
    updateCard();
  });

  nextBtn.addEventListener('click', () => {
    const currentList = flashcardsData[currentSubject];
    cardIndex = (cardIndex + 1) % currentList.length;
    updateCard();
  });

  // Pomodoro Focus Timer Logic
  let timerInterval = null;
  let timeRemaining = 1500; // 25 minutes default
  let totalSessionTime = 1500;
  let isTimerRunning = false;

  const timerDisplay = document.getElementById('timer-display-time');
  const timerStartBtn = document.getElementById('timer-start-btn');
  const timerResetBtn = document.getElementById('timer-reset-btn');
  const timerCircle = document.getElementById('timer-indicator-circle');
  const timerSessionType = document.getElementById('timer-session-type');
  const presetButtons = document.querySelectorAll('.preset-btn');

  const updateTimerDisplay = () => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Update circular progress bar
    if (totalSessionTime > 0) {
      const percentage = timeRemaining / totalSessionTime;
      const offset = 283 - (percentage * 283);
      timerCircle.style.strokeDashoffset = offset;
    }
  };

  const startTimer = () => {
    if (isTimerRunning) return;
    
    isTimerRunning = true;
    timerStartBtn.textContent = 'Pause';
    timerStartBtn.classList.add('btn-outline-primary');
    timerStartBtn.classList.remove('btn-primary');

    timerInterval = setInterval(() => {
      if (timeRemaining > 0) {
        timeRemaining--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerStartBtn.textContent = 'Start';
        timerStartBtn.classList.remove('btn-outline-primary');
        timerStartBtn.classList.add('btn-primary');
        showToast("Great job! Your study session timer has completed.");
        // Play system bell sound if possible (fallback visual trigger)
        document.body.style.filter = "invert(0.1)";
        setTimeout(() => document.body.style.filter = "", 500);
      }
    }, 1000);
  };

  const pauseTimer = () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerStartBtn.textContent = 'Start';
    timerStartBtn.classList.remove('btn-outline-primary');
    timerStartBtn.classList.add('btn-primary');
  };

  timerStartBtn.addEventListener('click', () => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  timerResetBtn.addEventListener('click', () => {
    pauseTimer();
    timeRemaining = totalSessionTime;
    updateTimerDisplay();
  });

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      pauseTimer();
      const minutes = parseInt(btn.getAttribute('data-minutes'));
      timeRemaining = minutes * 60;
      totalSessionTime = timeRemaining;
      
      // Update label
      if (minutes === 25) {
        timerSessionType.textContent = 'Focus Session';
      } else {
        timerSessionType.textContent = 'Break Time';
      }

      updateTimerDisplay();
    });
  });

  // Initialize timer stroke length
  timerCircle.style.strokeDasharray = 283;
  updateTimerDisplay();

  // Formula & Concept Sheet Viewer Logic
  const formulaNavButtons = document.querySelectorAll('.formula-nav-btn');
  const formulaPanes = document.querySelectorAll('.formula-category-pane');

  formulaNavButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      formulaNavButtons.forEach(b => b.classList.remove('active'));
      formulaPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const cat = btn.getAttribute('data-formula-cat');
      document.getElementById(`pane-${cat}`).classList.add('active');
    });
  });

});
