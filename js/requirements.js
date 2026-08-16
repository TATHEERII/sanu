(function () {
  'use strict';

  var WHATSAPP_NUMBER = '923008932525';
  var BUSINESS_NAME = 'WebNexa';

  var websiteTypes = [
    { id: 'business', name: 'Business Website', icon: 'fa-building' },
    { id: 'ecommerce', name: 'E-Commerce', icon: 'fa-shopping-cart' },
    { id: 'healthcare', name: 'Doctor / Clinic', icon: 'fa-heartbeat' },
    { id: 'restaurant', name: 'Restaurant', icon: 'fa-utensils' },
    { id: 'realestate', name: 'Real Estate', icon: 'fa-home' },
    { id: 'portfolio', name: 'Portfolio', icon: 'fa-briefcase' },
    { id: 'school', name: 'School / Academy', icon: 'fa-school' },
    { id: 'landing', name: 'Landing Page', icon: 'fa-rocket' },
    { id: 'not-sure', name: 'Not Sure', icon: 'fa-question-circle' }
  ];

  var formData = {
    currentStep: 1,
    completedSteps: [],
    websiteType: null,
    goals: [],
    businessName: '',
    businessCategory: '',
    businessDescription: '',
    cityCountry: '',
    pagesNeeded: [],
    specialFeatures: '',
    designStyle: '',
    primaryColor: '#6366f1',
    logo: null,
    images: [],
    existingContent: null,
    contentReference: '',
    contentHelp: '',
    budget: '',
    timeline: '',
    contactName: '',
    contactWhatsApp: '',
    contactEmail: '',
    contactMethod: 'whatsapp'
  };

  var homepageData = null;
  var isTransitioning = false;

  var stepViewport = document.getElementById('stepViewport');
  var progressBar = document.getElementById('progressBar');
  var toast = document.getElementById('toast');
  var previewModal = document.getElementById('previewModal');
  var previewContent = document.getElementById('previewContent');
  var previewModalClose = document.getElementById('previewModalClose');
  var previewCancel = document.getElementById('previewCancel');
  var previewConfirm = document.getElementById('previewConfirm');

  function showToast(message, type) {
    toast.textContent = message;
    toast.className = 'toast ' + type;
    setTimeout(function () { toast.classList.add('show'); }, 10);
    setTimeout(function () { toast.classList.remove('show'); }, 4000);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function saveState() {
    try {
      localStorage.setItem('webnexa_requirements_state', JSON.stringify(formData));
    } catch (e) {
      // ignore
    }
  }

  function loadState() {
    try {
      var stored = localStorage.getItem('webnexa_requirements_state');
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed.type && !parsed.websiteType) {
          parsed.websiteType = parsed.type;
          delete parsed.type;
        }
        if (parsed.features && !parsed.goals) {
          parsed.goals = parsed.features;
          delete parsed.features;
        }
        if (parsed.maxStepReached && !parsed.completedSteps) {
          parsed.completedSteps = [];
          for (var i = 1; i <= parsed.maxStepReached; i++) {
            parsed.completedSteps.push(i);
          }
          delete parsed.maxStepReached;
        }
        Object.keys(formData).forEach(function (key) {
          if (parsed.hasOwnProperty(key)) {
            formData[key] = parsed[key];
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }

  function clearState() {
    localStorage.removeItem('webnexa_requirements_state');
  }

  function updateProgressBar() {
    var steps = progressBar.querySelectorAll('.progress-step');
    steps.forEach(function (step, index) {
      var stepNum = index + 1;
      step.classList.remove('active', 'completed');
      step.setAttribute('aria-current', 'false');
      if (stepNum === formData.currentStep) {
        step.classList.add('active');
        step.setAttribute('aria-current', 'step');
      } else if (formData.completedSteps.indexOf(stepNum) !== -1) {
        step.classList.add('completed');
      }
    });
  }

  function markStepCompleted(step) {
    if (formData.completedSteps.indexOf(step) === -1) {
      formData.completedSteps.push(step);
    }
  }

  function markStepsCompleted(fromStep, toStep) {
    for (var i = fromStep; i <= toStep; i++) {
      markStepCompleted(i);
    }
  }

  function isStepCompleted(step) {
    return formData.completedSteps.indexOf(step) !== -1;
  }

  function getFurthestCompletedStep(fromStep) {
    var furthest = fromStep;
    for (var i = 0; i < formData.completedSteps.length; i++) {
      var step = formData.completedSteps[i];
      if (step >= fromStep && step > furthest) {
        furthest = step;
      }
    }
    return furthest;
  }

  function updateHero(step) {
    var heroTitle = document.getElementById('heroStepTitle');
    var heroDesc = document.getElementById('heroStepDesc');
    if (!heroTitle || !heroDesc) return;

    var titles = {
      1: 'Website Type',
      2: 'Your Goals',
      3: 'Business Info',
      4: 'Pages Needed',
      5: 'Design Style',
      6: 'Website Content',
      7: 'Budget & Contact'
    };

    var descriptions = {
      1: 'Select your website type from the options below. If you don\'t know exactly what you need, choose "Not Sure".',
      2: 'What do you want your website to do? Select all that apply.',
      3: 'Tell us a bit about your business so we can tailor the perfect solution.',
      4: 'Which pages do you want on your website?',
      5: 'Choose a design style and color preference for your website.',
      6: 'Upload any content you already have, or let us know if you need help.',
      7: 'Almost done! Tell us your budget and how to reach you.'
    };

    heroTitle.textContent = titles[step] || '';
    heroDesc.textContent = descriptions[step] || '';
  }

  function goToStep(n, direction) {
    if (isTransitioning && direction !== 'none') return;
    if (n < 1 || n > 7) return;

    var currentPanel = document.querySelector('.step-panel.active');
    var nextPanel = document.getElementById('step' + n);
    if (!nextPanel || nextPanel === currentPanel) {
      if (currentPanel && n === formData.currentStep) return;
    }

    formData.currentStep = n;
    saveState();
    updateProgressBar();
    updateHero(n);

    if (direction === 'none') {
      document.querySelectorAll('.step-panel').forEach(function (panel) {
        if (panel !== nextPanel) {
          panel.classList.remove('active', 'exit-left', 'exit-right', 'enter-left', 'enter-right');
          panel.classList.add('hidden');
        }
      });
      nextPanel.classList.remove('hidden', 'exit-left', 'exit-right', 'enter-left', 'enter-right');
      nextPanel.classList.add('active');
      stepViewport.scrollTop = 0;
      return;
    }

    isTransitioning = true;
    var exitClass = direction === 'forward' ? 'exit-left' : 'exit-right';
    var enterClass = direction === 'forward' ? 'enter-right' : 'enter-left';

    if (currentPanel) {
      currentPanel.classList.add(exitClass);
    }

    setTimeout(function () {
      if (currentPanel) {
        currentPanel.classList.remove('active', 'exit-left', 'exit-right');
        currentPanel.classList.add('hidden');
      }

      nextPanel.classList.remove('hidden', 'enter-left', 'enter-right', 'exit-left', 'exit-right');
      nextPanel.classList.add(enterClass);
      nextPanel.offsetHeight;
      nextPanel.classList.remove(enterClass);
      nextPanel.offsetHeight;
      nextPanel.classList.add('active');

      stepViewport.scrollTop = 0;
      isTransitioning = false;
    }, 400);
  }

  function validateStep(step) {
    if (step === 1 && !formData.websiteType) {
      showToast('Pehle website type select karein.', 'error');
      return false;
    }
    if (step === 3 && !formData.businessName.trim()) {
      showToast('Pehle business name fill karein.', 'error');
      return false;
    }
    if (step === 7 && (!formData.contactName.trim() || !formData.contactWhatsApp.trim() || !formData.contactEmail.trim())) {
      showToast('Please fill in all required contact fields.', 'error');
      return false;
    }
    return true;
  }

  function loadHomepageData() {
    try {
      var stored = localStorage.getItem('webnexa_homepage_inquiry');
      if (stored) {
        homepageData = JSON.parse(stored);
      }
    } catch (e) {
      homepageData = null;
    }
  }

  function clearHomepageData() {
    localStorage.removeItem('webnexa_homepage_inquiry');
  }

  function initTypeCards() {
    var cards = document.querySelectorAll('#typesGrid .type-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        cards.forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        formData.websiteType = card.getAttribute('data-type');
        saveState();
      });
    });
  }

  function initCheckboxGrid(gridId, formKey) {
    var items = document.querySelectorAll('#' + gridId + ' .checkbox-item');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        var value = item.getAttribute('data-value');
        var index = formData[formKey].indexOf(value);
        if (index === -1) {
          formData[formKey].push(value);
          item.classList.add('selected');
        } else {
          formData[formKey].splice(index, 1);
          item.classList.remove('selected');
        }
        saveState();
      });
    });
  }

  function initRadioGrid(gridId, formKey) {
    var items = document.querySelectorAll('#' + gridId + ' .radio-card, #' + gridId + ' .radio-item');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        items.forEach(function (i) { i.classList.remove('selected'); });
        item.classList.add('selected');
        formData[formKey] = item.getAttribute('data-value');
        saveState();
      });
    });
  }

  function restoreCheckboxGrid(gridId, formKey) {
    var items = document.querySelectorAll('#' + gridId + ' .checkbox-item');
    items.forEach(function (item) {
      var value = item.getAttribute('data-value');
      if (formData[formKey].indexOf(value) !== -1) {
        item.classList.add('selected');
      }
    });
  }

  function restoreRadioGrid(gridId, formKey) {
    var items = document.querySelectorAll('#' + gridId + ' .radio-card, #' + gridId + ' .radio-item');
    items.forEach(function (item) {
      if (item.getAttribute('data-value') === formData[formKey]) {
        item.classList.add('selected');
      }
    });
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(phone) {
    return /^[\+]?[\d\s\-\(\)]{7,15}$/.test(phone);
  }

  function buildPreviewHTML() {
    var typeData = websiteTypes.find(function (t) { return t.id === formData.websiteType; });

    var budgetLabels = {
      'under-50': 'Under $50',
      '50-100': '$50 – $100',
      '100-200': '$100 – $200',
      '200-500': '$200 – $500',
      '500-plus': '$500+',
      'not-sure': 'Not sure'
    };

    var timelineLabels = {
      '1-3-days': '1 – 3 days',
      '3-7-days': '3 – 7 days',
      '1-2-weeks': '1 – 2 weeks',
      'flexible': 'Flexible'
    };

    var contactMethodLabels = {
      'whatsapp': 'WhatsApp',
      'email': 'Email',
      'phone': 'Phone'
    };

    var html = '';

    if (homepageData) {
      html += '<div class="preview-section homepage-preview">';
      html += '<h3><i class="fas fa-home"></i> Homepage Inquiry Details</h3>';
      html += '<div class="preview-grid">';
      html += '<div class="preview-item"><span class="preview-label">Name:</span><span class="preview-value">' + escapeHtml(homepageData.name) + '</span></div>';
      html += '<div class="preview-item"><span class="preview-label">Email:</span><span class="preview-value">' + escapeHtml(homepageData.email) + '</span></div>';
      html += '<div class="preview-item"><span class="preview-label">Phone:</span><span class="preview-value">' + escapeHtml(homepageData.phone) + '</span></div>';
      html += '<div class="preview-item"><span class="preview-label">Company Size:</span><span class="preview-value">' + escapeHtml(homepageData.companySize) + '</span></div>';
      html += '</div></div>';
    }

    html += '<div class="preview-section">';
    html += '<h3><span class="step-badge">1</span> <i class="fas fa-globe"></i> Website Type</h3>';
    html += '<div class="preview-item"><span class="preview-label">Type:</span><span class="preview-value">' + escapeHtml(typeData ? typeData.name : formData.websiteType) + '</span></div>';
    html += '</div>';

    if (formData.goals.length > 0) {
      html += '<div class="preview-section">';
      html += '<h3><span class="step-badge">2</span> <i class="fas fa-bullseye"></i> Goals</h3>';
      html += '<ul class="preview-list">';
      formData.goals.forEach(function (goal) {
        html += '<li><i class="fas fa-check"></i> ' + escapeHtml(goal) + '</li>';
      });
      html += '</ul></div>';
    }

    html += '<div class="preview-section">';
    html += '<h3><span class="step-badge">3</span> <i class="fas fa-building"></i> Business Info</h3>';
    html += '<div class="preview-grid">';
    html += '<div class="preview-item"><span class="preview-label">Business Name:</span><span class="preview-value">' + escapeHtml(formData.businessName || 'Not provided') + '</span></div>';
    html += '<div class="preview-item"><span class="preview-label">Category:</span><span class="preview-value">' + escapeHtml(formData.businessCategory || 'Not provided') + '</span></div>';
    html += '<div class="preview-item" style="grid-column:1/-1;"><span class="preview-label">Description:</span><span class="preview-value">' + escapeHtml(formData.businessDescription || 'Not provided') + '</span></div>';
    html += '<div class="preview-item"><span class="preview-label">City/Country:</span><span class="preview-value">' + escapeHtml(formData.cityCountry || 'Not provided') + '</span></div>';
    html += '</div></div>';

    if (formData.pagesNeeded.length > 0 || formData.specialFeatures) {
      html += '<div class="preview-section">';
      html += '<h3><span class="step-badge">4</span> <i class="fas fa-file-alt"></i> Pages & Features</h3>';
      if (formData.pagesNeeded.length > 0) {
        html += '<p style="font-size:0.85rem; color:var(--text-light); margin-bottom:8px;">Pages:</p>';
        html += '<ul class="preview-list">';
        formData.pagesNeeded.forEach(function (page) {
          html += '<li><i class="fas fa-check"></i> ' + escapeHtml(page) + '</li>';
        });
        html += '</ul>';
      }
      if (formData.specialFeatures) {
        html += '<div class="preview-item" style="margin-top:12px;"><span class="preview-label">Special Features:</span><span class="preview-value">' + escapeHtml(formData.specialFeatures) + '</span></div>';
      }
      html += '</div>';
    }

    html += '<div class="preview-section">';
    html += '<h3><span class="step-badge">5</span> <i class="fas fa-palette"></i> Design</h3>';
    html += '<div class="preview-grid">';
    html += '<div class="preview-item"><span class="preview-label">Style:</span><span class="preview-value">' + escapeHtml(formData.designStyle || 'Not provided') + '</span></div>';
    html += '<div class="preview-item"><span class="preview-label">Primary Color:</span><span class="preview-value"><span style="display:inline-block;width:16px;height:16px;background:' + formData.primaryColor + ';border-radius:50%;margin-right:8px;vertical-align:middle;"></span>' + escapeHtml(formData.primaryColor) + '</span></div>';
    html += '</div></div>';

    html += '<div class="preview-section">';
    html += '<h3><span class="step-badge">6</span> <i class="fas fa-images"></i> Content</h3>';
    html += '<div class="preview-grid">';
    html += '<div class="preview-item"><span class="preview-label">Logo:</span><span class="preview-value">' + escapeHtml(formData.logo || 'Not provided') + '</span></div>';
    html += '<div class="preview-item"><span class="preview-label">Images:</span><span class="preview-value">' + escapeHtml(formData.images.length > 0 ? formData.images.join(', ') : 'Not provided') + '</span></div>';
    html += '<div class="preview-item"><span class="preview-label">Existing Content:</span><span class="preview-value">' + escapeHtml(formData.existingContent || 'Not provided') + '</span></div>';
    if (formData.contentReference) {
      html += '<div class="preview-item" style="grid-column:1/-1;"><span class="preview-label">Reference Link:</span><span class="preview-value">' + escapeHtml(formData.contentReference) + '</span></div>';
    }
    html += '<div class="preview-item"><span class="preview-label">Content Help:</span><span class="preview-value">' + escapeHtml(formData.contentHelp || 'Not provided') + '</span></div>';
    html += '</div></div>';

    html += '<div class="preview-section">';
    html += '<h3><span class="step-badge">7</span> <i class="fas fa-dollar-sign"></i> Budget & Timeline</h3>';
    html += '<div class="preview-grid">';
    html += '<div class="preview-item"><span class="preview-label">Budget:</span><span class="preview-value">' + escapeHtml(budgetLabels[formData.budget] || 'Not provided') + '</span></div>';
    html += '<div class="preview-item"><span class="preview-label">Timeline:</span><span class="preview-value">' + escapeHtml(timelineLabels[formData.timeline] || 'Not provided') + '</span></div>';
    html += '</div></div>';

    html += '<div class="preview-section">';
    html += '<h3><span class="step-badge">7</span> <i class="fas fa-user"></i> Contact</h3>';
    html += '<div class="preview-grid">';
    html += '<div class="preview-item"><span class="preview-label">Name:</span><span class="preview-value">' + escapeHtml(formData.contactName) + '</span></div>';
    html += '<div class="preview-item"><span class="preview-label">WhatsApp:</span><span class="preview-value">' + escapeHtml(formData.contactWhatsApp) + '</span></div>';
    html += '<div class="preview-item"><span class="preview-label">Email:</span><span class="preview-value">' + escapeHtml(formData.contactEmail) + '</span></div>';
    html += '<div class="preview-item"><span class="preview-label">Method:</span><span class="preview-value">' + escapeHtml(contactMethodLabels[formData.contactMethod] || formData.contactMethod) + '</span></div>';
    html += '</div></div>';

    return html;
  }

  function buildWhatsAppMessage() {
    var typeData = websiteTypes.find(function (t) { return t.id === formData.websiteType; });

    var budgetLabels = {
      'under-50': 'Under $50',
      '50-100': '$50 – $100',
      '100-200': '$100 – $200',
      '200-500': '$200 – $500',
      '500-plus': '$500+',
      'not-sure': 'Not sure'
    };

    var timelineLabels = {
      '1-3-days': '1 – 3 days',
      '3-7-days': '3 – 7 days',
      '1-2-weeks': '1 – 2 weeks',
      'flexible': 'Flexible'
    };

    var contactMethodLabels = {
      'whatsapp': 'WhatsApp',
      'email': 'Email',
      'phone': 'Phone'
    };

    var msg = 'New ' + BUSINESS_NAME + ' Website Requirement Inquiry:%0A';

    if (homepageData) {
      msg += 'Name: ' + encodeURIComponent(homepageData.name) + '%0A';
      msg += 'Email: ' + encodeURIComponent(homepageData.email) + '%0A';
      msg += 'Phone: ' + encodeURIComponent(homepageData.phone) + '%0A';
      msg += 'Company Size: ' + encodeURIComponent(homepageData.companySize) + '%0A';
    }

    msg += 'Type: ' + encodeURIComponent(typeData ? typeData.name : formData.websiteType) + '%0A';

    if (formData.goals.length > 0) {
      msg += 'Goals: ' + encodeURIComponent(formData.goals.join(', ')) + '%0A';
    }

    msg += 'Business: ' + encodeURIComponent(formData.businessName) + '%0A';
    msg += 'Category: ' + encodeURIComponent(formData.businessCategory || 'Not provided') + '%0A';
    msg += 'Desc: ' + encodeURIComponent(formData.businessDescription || 'Not provided') + '%0A';
    msg += 'Location: ' + encodeURIComponent(formData.cityCountry || 'Not provided') + '%0A';

    if (formData.pagesNeeded.length > 0) {
      msg += 'Pages: ' + encodeURIComponent(formData.pagesNeeded.join(', ')) + '%0A';
    }
    if (formData.specialFeatures) {
      msg += 'Features: ' + encodeURIComponent(formData.specialFeatures) + '%0A';
    }

    msg += 'Style: ' + encodeURIComponent(formData.designStyle || 'Not provided') + '%0A';
    msg += 'Color: ' + encodeURIComponent(formData.primaryColor) + '%0A';

    msg += 'Logo: ' + encodeURIComponent(formData.logo || 'Not provided') + '%0A';
    msg += 'Images: ' + encodeURIComponent(formData.images.length > 0 ? formData.images.join(', ') : 'Not provided') + '%0A';
    msg += 'Content: ' + encodeURIComponent(formData.existingContent || 'Not provided') + '%0A';
    if (formData.contentReference) {
      msg += 'Link: ' + encodeURIComponent(formData.contentReference) + '%0A';
    }
    msg += 'Help: ' + encodeURIComponent(formData.contentHelp || 'Not provided') + '%0A';

    msg += 'Budget: ' + encodeURIComponent(budgetLabels[formData.budget] || 'Not provided') + '%0A';
    msg += 'Timeline: ' + encodeURIComponent(timelineLabels[formData.timeline] || 'Not provided') + '%0A';

    msg += 'Name: ' + encodeURIComponent(formData.contactName) + '%0A';
    msg += 'WhatsApp: ' + encodeURIComponent(formData.contactWhatsApp) + '%0A';
    msg += 'Email: ' + encodeURIComponent(formData.contactEmail) + '%0A';
    msg += 'Method: ' + encodeURIComponent(contactMethodLabels[formData.contactMethod] || formData.contactMethod) + '%0A';

    return msg;
  }

  function openPreview() {
    previewContent.innerHTML = buildPreviewHTML();
    previewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closePreview() {
    previewModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function resetForm() {
    formData.currentStep = 1;
    formData.completedSteps = [];
    formData.websiteType = null;
    formData.goals = [];
    formData.businessName = '';
    formData.businessCategory = '';
    formData.businessDescription = '';
    formData.cityCountry = '';
    formData.pagesNeeded = [];
    formData.specialFeatures = '';
    formData.designStyle = '';
    formData.primaryColor = '#6366f1';
    formData.logo = null;
    formData.images = [];
    formData.existingContent = null;
    formData.contentReference = '';
    formData.contentHelp = '';
    formData.budget = '';
    formData.timeline = '';
    formData.contactName = '';
    formData.contactWhatsApp = '';
    formData.contactEmail = '';
    formData.contactMethod = 'whatsapp';

    document.querySelectorAll('.step-panel').forEach(function (panel) {
      panel.classList.remove('active', 'selected');
      panel.classList.add('hidden');
    });

    document.querySelectorAll('.type-card, .checkbox-item, .radio-card, .radio-item').forEach(function (el) {
      el.classList.remove('selected');
    });

    document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea').forEach(function (el) {
      if (el.id !== 'primaryColor') {
        el.value = '';
      }
    });

    document.querySelectorAll('input[type="file"]').forEach(function (el) {
      el.value = '';
    });

    document.querySelectorAll('.file-name').forEach(function (el) {
      el.textContent = 'No file chosen';
    });

    document.getElementById('primaryColor').value = '#6366f1';
    document.getElementById('colorPreview').style.background = '#6366f1';

    goToStep(1, 'none');
    updateProgressBar();
    clearState();
  }

  function init() {
    loadHomepageData();
    loadState();

    if (!formData.completedSteps || formData.completedSteps.length === 0) {
      formData.completedSteps = [1];
    }
    for (var i = 1; i <= formData.currentStep; i++) {
      if (formData.completedSteps.indexOf(i) === -1) {
        formData.completedSteps.push(i);
      }
    }

    var banner = document.getElementById('homepageDataBanner');
    var details = document.getElementById('bannerDetails');
    if (homepageData && banner && details) {
      details.textContent = 'Name: ' + homepageData.name + ' | Email: ' + homepageData.email + ' | Phone: ' + homepageData.phone;
      banner.classList.remove('hidden');
    }

    initTypeCards();
    initCheckboxGrid('goalsGrid', 'goals');
    initCheckboxGrid('pagesGrid', 'pagesNeeded');
    initRadioGrid('designGrid', 'designStyle');
    initRadioGrid('contentHelpRadio', 'contentHelp');
    initRadioGrid('budgetRadio', 'budget');
    initRadioGrid('timelineRadio', 'timeline');
    initRadioGrid('contactMethodRadio', 'contactMethod');

    if (formData.websiteType) {
      var cards = document.querySelectorAll('#typesGrid .type-card');
      cards.forEach(function (card) {
        if (card.getAttribute('data-type') === formData.websiteType) {
          card.classList.add('selected');
        }
      });
    }

    restoreCheckboxGrid('goalsGrid', 'goals');
    restoreCheckboxGrid('pagesGrid', 'pagesNeeded');
    restoreRadioGrid('designGrid', 'designStyle');
    restoreRadioGrid('contentHelpRadio', 'contentHelp');
    restoreRadioGrid('budgetRadio', 'budget');
    restoreRadioGrid('timelineRadio', 'timeline');
    restoreRadioGrid('contactMethodRadio', 'contactMethod');

    var businessNameEl = document.getElementById('businessName');
    if (businessNameEl && formData.businessName) businessNameEl.value = formData.businessName;
    var businessCategoryEl = document.getElementById('businessCategory');
    if (businessCategoryEl && formData.businessCategory) businessCategoryEl.value = formData.businessCategory;
    var businessDescriptionEl = document.getElementById('businessDescription');
    if (businessDescriptionEl && formData.businessDescription) businessDescriptionEl.value = formData.businessDescription;
    var cityCountryEl = document.getElementById('cityCountry');
    if (cityCountryEl && formData.cityCountry) cityCountryEl.value = formData.cityCountry;
    var specialFeaturesEl = document.getElementById('specialFeatures');
    if (specialFeaturesEl && formData.specialFeatures) specialFeaturesEl.value = formData.specialFeatures;
    var contentReferenceEl = document.getElementById('contentReference');
    if (contentReferenceEl && formData.contentReference) contentReferenceEl.value = formData.contentReference;
    var contactNameEl = document.getElementById('contactName');
    if (contactNameEl && formData.contactName) contactNameEl.value = formData.contactName;
    var contactWhatsAppEl = document.getElementById('contactWhatsApp');
    if (contactWhatsAppEl && formData.contactWhatsApp) contactWhatsAppEl.value = formData.contactWhatsApp;
    var contactEmailEl = document.getElementById('contactEmail');
    if (contactEmailEl && formData.contactEmail) contactEmailEl.value = formData.contactEmail;
    var primaryColorEl = document.getElementById('primaryColor');
    if (primaryColorEl && formData.primaryColor) {
      primaryColorEl.value = formData.primaryColor;
      var colorPreview = document.getElementById('colorPreview');
      if (colorPreview) colorPreview.style.background = formData.primaryColor;
    }

    document.getElementById('step1Next').addEventListener('click', function () {
      if (validateStep(1)) {
        markStepsCompleted(1, getFurthestCompletedStep(2));
        goToStep(getFurthestCompletedStep(2), getFurthestCompletedStep(2) > 2 ? 'none' : 'forward');
      }
    });

    document.getElementById('step2Back').addEventListener('click', function () {
      goToStep(1, 'back');
    });

    document.getElementById('step2Next').addEventListener('click', function () {
      markStepsCompleted(2, getFurthestCompletedStep(3));
      goToStep(getFurthestCompletedStep(3), getFurthestCompletedStep(3) > 3 ? 'none' : 'forward');
    });

    document.getElementById('step3Back').addEventListener('click', function () {
      goToStep(2, 'back');
    });

    document.getElementById('step3Next').addEventListener('click', function () {
      if (validateStep(3)) {
        markStepsCompleted(3, getFurthestCompletedStep(4));
        goToStep(getFurthestCompletedStep(4), getFurthestCompletedStep(4) > 4 ? 'none' : 'forward');
      }
    });

    document.getElementById('step4Back').addEventListener('click', function () {
      goToStep(3, 'back');
    });

    document.getElementById('step4Next').addEventListener('click', function () {
      markStepsCompleted(4, getFurthestCompletedStep(5));
      goToStep(getFurthestCompletedStep(5), getFurthestCompletedStep(5) > 5 ? 'none' : 'forward');
    });

    document.getElementById('step5Back').addEventListener('click', function () {
      goToStep(4, 'back');
    });

    document.getElementById('step5Next').addEventListener('click', function () {
      markStepsCompleted(5, getFurthestCompletedStep(6));
      goToStep(getFurthestCompletedStep(6), getFurthestCompletedStep(6) > 6 ? 'none' : 'forward');
    });

    document.getElementById('step6Back').addEventListener('click', function () {
      goToStep(5, 'back');
    });

    document.getElementById('step6Next').addEventListener('click', function () {
      markStepsCompleted(6, getFurthestCompletedStep(7));
      goToStep(getFurthestCompletedStep(7), 'forward');
    });

    document.getElementById('step7Back').addEventListener('click', function () {
      goToStep(6, 'back');
    });

     document.getElementById('submitRequirements').addEventListener('click', function () {
      if (validateStep(7)) openPreview();
    });

    previewCancel.addEventListener('click', closePreview);
    previewModalClose.addEventListener('click', closePreview);
    previewModal.addEventListener('click', function (e) {
      if (e.target === previewModal) closePreview();
    });

    previewConfirm.addEventListener('click', function () {
      closePreview();
      if (validateStep(7)) {
        var messageText = buildWhatsAppMessage();
        var whatsappUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + messageText;
        window.open(whatsappUrl, '_blank');
        showToast('Redirecting to WhatsApp...', 'success');
        clearHomepageData();
        clearState();
        if (banner) banner.classList.add('hidden');
        resetForm();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && previewModal.classList.contains('active')) {
        closePreview();
      }
      if (e.key === 'Enter' || e.key === ' ') {
        var target = e.target;
        if (target.closest('.type-card, .checkbox-item, .radio-card, .radio-item')) {
          e.preventDefault();
          target.click();
        }
      }
    });

    var textFields = ['businessName', 'businessCategory', 'businessDescription', 'cityCountry', 'specialFeatures', 'contentReference', 'contactName', 'contactWhatsApp', 'contactEmail'];
    textFields.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', function () {
          formData[id] = el.value;
          saveState();
        });
      }
    });

    var colorEl = document.getElementById('primaryColor');
    if (colorEl) {
      colorEl.addEventListener('input', function () {
        formData.primaryColor = colorEl.value;
        var colorPreview = document.getElementById('colorPreview');
        if (colorPreview) colorPreview.style.background = colorEl.value;
        saveState();
      });
    }

    var fileFields = [
      { id: 'logoUpload', key: 'logo', nameId: 'logoFileName', defaultText: 'No file chosen' },
      { id: 'imagesUpload', key: 'images', nameId: 'imagesFileName', defaultText: 'No files chosen', multiple: true },
      { id: 'existingContentUpload', key: 'existingContent', nameId: 'existingContentFileName', defaultText: 'No file chosen' }
    ];

    fileFields.forEach(function (field) {
      var el = document.getElementById(field.id);
      if (!el) return;
      el.addEventListener('change', function () {
        var nameEl = document.getElementById(field.nameId);
        if (el.files && el.files.length > 0) {
          if (field.multiple) {
            var names = Array.from(el.files).map(function (f) { return f.name; });
            formData[field.key] = names;
            if (nameEl) nameEl.textContent = names.join(', ');
          } else {
            formData[field.key] = el.files[0].name;
            if (nameEl) nameEl.textContent = el.files[0].name;
          }
        } else {
          formData[field.key] = field.multiple ? [] : null;
          if (nameEl) nameEl.textContent = field.defaultText;
        }
        saveState();
      });
    });

    progressBar.addEventListener('click', function (e) {
      var step = e.target.closest('.progress-step');
      if (!step) return;
      var stepNum = parseInt(step.getAttribute('data-step'), 10);
      if (formData.completedSteps.indexOf(stepNum) !== -1) {
        goToStep(stepNum, stepNum < formData.currentStep ? 'back' : 'none');
      }
    });

    progressBar.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var step = e.target.closest('.progress-step');
        if (!step) return;
        e.preventDefault();
        var stepNum = parseInt(step.getAttribute('data-step'), 10);
        if (formData.completedSteps.indexOf(stepNum) !== -1) {
          goToStep(stepNum, stepNum < formData.currentStep ? 'back' : 'none');
        }
      }
    });

    goToStep(formData.currentStep, 'none');
    updateProgressBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
