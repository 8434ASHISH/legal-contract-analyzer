// ===== GLOBAL VARIABLES =====
const API_BASE_URL = 'https://legal-contract-analyzer-tjvk.onrender.com';
let currentUser = null;
let uploadedFiles = [];
let analysisJobs = {};

// ===== DOM ELEMENTS =====
const elements = {
    // Navigation
    navbar: document.getElementById('navbar'),
    menuToggle: document.querySelector('.menu-toggle'),
    navLinks: document.querySelector('.nav-links'),
    
    // Cursor
    cursor: document.querySelector('.cursor'),
    cursorFollower: document.querySelector('.cursor-follower'),
    
    // Upload
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    progressContainer: document.getElementById('progressContainer'),
    progressFill: document.getElementById('progressFill'),
    progressPercent: document.getElementById('progressPercent'),
    progressStatus: document.getElementById('progressStatus'),
    
    // ROI Calculator
    contractSlider: document.getElementById('contractSlider'),
    pageSlider: document.getElementById('pageSlider'),
    contractCount: document.getElementById('contractCount'),
    pageCount: document.getElementById('pageCount'),
    timeSaved: document.getElementById('timeSaved'),
    costSaved: document.getElementById('costSaved'),
    roiPercent: document.getElementById('roiPercent'),
    
    // Tabs
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Chat
    chatContainer: document.getElementById('chatContainer'),
    chatInput: document.getElementById('chatInput'),
    sendButton: document.getElementById('sendButton'),
    suggestedQuestions: document.querySelectorAll('.suggested-question'),
    
    // Modals
    modals: document.querySelectorAll('.modal'),
    modalClose: document.querySelectorAll('.modal-close'),
    
    // Forms
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    contactForm: document.getElementById('contactForm')
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initAOS();
    initCustomCursor();
    initNavbar();
    initUpload();
    initROICalculator();
    initTabs();
    initChat();
    initModals();
    initForms();
    initSmoothScroll();
    initThemeToggle();
    initAnimations();
    checkAuth();
    loadSampleData();
});

// ===== AOS INITIALIZATION =====
function initAOS() {
    AOS.init({
        duration: 800,
        once: true,
        offset: 100,
        easing: 'ease-in-out'
    });
}

// ===== CUSTOM CURSOR =====
function initCustomCursor() {
    if (!elements.cursor || !elements.cursorFollower) return;
    
    document.addEventListener('mousemove', (e) => {
        elements.cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        elements.cursorFollower.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });
    
    document.addEventListener('mousedown', () => {
        elements.cursor.style.transform = 'scale(0.8)';
        elements.cursorFollower.style.transform = 'scale(1.5)';
    });
    
    document.addEventListener('mouseup', () => {
        elements.cursor.style.transform = 'scale(1)';
        elements.cursorFollower.style.transform = 'scale(1)';
    });
    
    // Add hover effect for interactive elements
    const interactive = document.querySelectorAll('a, button, .btn, .feature-card, .pricing-card, .testimonial-card');
    
    interactive.forEach(el => {
        el.addEventListener('mouseenter', () => {
            elements.cursorFollower.classList.add('hover');
        });
        
        el.addEventListener('mouseleave', () => {
            elements.cursorFollower.classList.remove('hover');
        });
    });
}

// ===== NAVBAR =====
function initNavbar() {
    if (!elements.navbar) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            elements.navbar.classList.add('scrolled');
        } else {
            elements.navbar.classList.remove('scrolled');
        }
    });
    
    // Mobile menu toggle
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', () => {
            elements.menuToggle.classList.toggle('active');
            elements.navLinks.classList.toggle('active');
            
            if (elements.navLinks.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        });
    }
}

// ===== UPLOAD FUNCTIONALITY =====
function initUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    if (!dropZone || !fileInput) return;
    
    // Click to upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag & drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

async function handleFileUpload(file) {
    // Validate file
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!validTypes.includes(file.type)) {
        showNotification('Please upload a PDF, DOCX, or TXT file', 'error');
        return;
    }
    
    if (file.size > maxSize) {
        showNotification('File size should be less than 50MB', 'error');
        return;
    }
    
    // Show progress
    showProgress();
    updateProgress(10, 'Uploading file...');
    
    try {
        // Upload file
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Upload failed');
        }
        
        const uploadData = await uploadResponse.json();
        updateProgress(30, 'File uploaded, starting analysis...');
        
        // Start analysis
        const analyzeResponse = await fetch(`${API_BASE_URL}/api/analyze/${uploadData.file_id}`, {
            method: 'POST'
        });
        
        const analyzeData = await analyzeResponse.json();
        const jobId = analyzeData.job_id;
        
        // Poll for progress
        await pollAnalysisProgress(jobId);
        
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Error uploading file. Please try again.', 'error');
        hideProgress();
    }
}

async function pollAnalysisProgress(jobId) {
    const steps = ['Extracting text from PDF', 'Chunking document', 'Generating embeddings', 'Analyzing with AI', 'Generating summary'];
    let stepIndex = 0;
    
    const interval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/status/${jobId}`);
            const data = await response.json();
            
            updateProgress(data.progress, steps[stepIndex] || 'Processing...');
            
            if (data.progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    hideProgress();
                    showNotification('Analysis complete!', 'success');
                    window.location.href = `dashboard.html?job=${jobId}`;
                }, 1000);
            }
            
            // Update step
            if (data.progress > (stepIndex + 1) * 25) {
                stepIndex = Math.min(stepIndex + 1, steps.length - 1);
            }
            
        } catch (error) {
            console.error('Progress poll error:', error);
        }
    }, 2000);
}

function showProgress() {
    const progressContainer = document.getElementById('progressContainer');
    const uploadArea = document.getElementById('uploadArea');
    
    if (progressContainer && uploadArea) {
        uploadArea.style.display = 'none';
        progressContainer.style.display = 'block';
    }
}

function hideProgress() {
    const progressContainer = document.getElementById('progressContainer');
    const uploadArea = document.getElementById('uploadArea');
    
    if (progressContainer && uploadArea) {
        progressContainer.style.display = 'none';
        uploadArea.style.display = 'block';
    }
}

function updateProgress(percent, status) {
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressStatus = document.getElementById('progressStatus');
    
    if (progressFill) {
        progressFill.style.width = `${percent}%`;
    }
    
    if (progressPercent) {
        progressPercent.textContent = `${percent}%`;
    }
    
    if (progressStatus && status) {
        progressStatus.textContent = status;
    }
}

// ===== ROI CALCULATOR =====
function initROICalculator() {
    if (!elements.contractSlider || !elements.pageSlider) return;
    
    elements.contractSlider.addEventListener('input', updateROI);
    elements.pageSlider.addEventListener('input', updateROI);
    
    updateROI();
}

function updateROI() {
    if (!elements.contractSlider || !elements.pageSlider) return;
    
    const contracts = parseInt(elements.contractSlider.value);
    const pages = parseInt(elements.pageSlider.value);
    
    // Update display values
    if (elements.contractCount) {
        elements.contractCount.textContent = contracts;
    }
    
    if (elements.pageCount) {
        elements.pageCount.textContent = pages;
    }
    
    // Calculate savings
    const manualHoursPerPage = 0.167; // 10 minutes per page
    const aiHoursPerContract = 0.033; // 2 minutes per contract
    
    const manualHours = contracts * pages * manualHoursPerPage;
    const aiHours = contracts * aiHoursPerContract;
    const hoursSaved = Math.round(manualHours - aiHours);
    
    const hourlyRate = 3000; // ₹3000 per hour
    const costSaved = hoursSaved * hourlyRate;
    
    const monthlySubscription = 2999;
    const roi = Math.round((costSaved - monthlySubscription) / monthlySubscription * 100);
    
    // Update display
    if (elements.timeSaved) {
        elements.timeSaved.textContent = hoursSaved;
    }
    
    if (elements.costSaved) {
        if (costSaved >= 100000) {
            elements.costSaved.textContent = '₹' + (costSaved / 100000).toFixed(1) + 'L';
        } else {
            elements.costSaved.textContent = '₹' + costSaved.toLocaleString();
        }
    }
    
    if (elements.roiPercent) {
        elements.roiPercent.textContent = roi + '%';
    }
}

// ===== TABS =====
function initTabs() {
    if (!elements.tabs || !elements.tabContents) return;
    
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs
            elements.tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all tab contents
            elements.tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab content
            const selectedContent = document.getElementById(tabId);
            if (selectedContent) {
                selectedContent.classList.add('active');
            }
        });
    });
}

// ===== CHAT FUNCTIONALITY =====
function initChat() {
    if (!elements.chatContainer || !elements.chatInput || !elements.sendButton) return;
    
    elements.sendButton.addEventListener('click', sendMessage);
    
    elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Suggested questions
    if (elements.suggestedQuestions) {
        elements.suggestedQuestions.forEach(question => {
            question.addEventListener('click', () => {
                elements.chatInput.value = question.textContent;
                sendMessage();
            });
        });
    }
}

async function sendMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addChatMessage(message, 'user');
    elements.chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Get contract ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const contractId = urlParams.get('contract_id');
        
        if (!contractId) {
            addChatMessage('Please upload a contract first.', 'assistant');
            hideTypingIndicator();
            return;
        }
        
        // Send to API
        const response = await fetch(`${API_BASE_URL}/api/ask/${contractId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: message })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        hideTypingIndicator();
        
        // Add assistant response
        let responseText = data.answer;
        if (data.citations && data.citations.length > 0) {
            responseText += '\n\n📚 Sources: ' + data.citations.join(', ');
        }
        
        addChatMessage(responseText, 'assistant');
        
    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        addChatMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    }
}

function addChatMessage(text, sender) {
    if (!elements.chatContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.textContent = text;
    
    messageDiv.appendChild(bubbleDiv);
    elements.chatContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

function showTypingIndicator() {
    if (!elements.chatContainer) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'chat-message assistant typing-indicator';
    indicator.id = 'typingIndicator';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    
    indicator.appendChild(bubble);
    elements.chatContainer.appendChild(indicator);
    
    // Scroll to bottom
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// ===== MODALS =====
function initModals() {
    if (!elements.modals || !elements.modalClose) return;
    
    // Open modal triggers
    document.querySelectorAll('[data-modal]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal');
            openModal(modalId);
        });
    });
    
    // Close buttons
    elements.modalClose.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Click outside to close
    elements.modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            elements.modals.forEach(modal => {
                if (modal.classList.contains('active')) {
                    closeModal(modal.id);
                }
            });
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ===== FORMS =====
function initForms() {
    // Login form
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    // Signup form
    if (elements.signupForm) {
        elements.signupForm.addEventListener('submit', handleSignup);
    }
    
    // Contact form
    if (elements.contactForm) {
        elements.contactForm.addEventListener('submit', handleContact);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        // TODO: Implement actual login API call
        showNotification('Login successful!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        showNotification('Login failed. Please try again.', 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    try {
        // TODO: Implement actual signup API call
        showNotification('Account created successfully!', 'success');
        
        setTimeout(() => {
            closeModal('signupModal');
            openModal('loginModal');
        }, 1500);
        
    } catch (error) {
        showNotification('Signup failed. Please try again.', 'error');
    }
}

async function handleContact(e) {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    
    try {
        // TODO: Implement actual contact API call
        showNotification('Message sent successfully!', 'success');
        elements.contactForm.reset();
        
    } catch (error) {
        showNotification('Failed to send message. Please try again.', 'error');
    }
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="bi bi-x"></i></button>
    `;
    
    document.body.appendChild(notification);
    
    // Show animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without jumping
                history.pushState(null, null, targetId);
            }
        });
    });
}

// ===== THEME TOGGLE =====
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="bi bi-sun"></i>';
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="bi bi-sun"></i>';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="bi bi-moon"></i>';
        }
    });
}

// ===== ANIMATIONS =====
function initAnimations() {
    // Animate numbers on scroll
    const animateNumbers = () => {
        document.querySelectorAll('.animate-number').forEach(el => {
            const target = parseInt(el.getAttribute('data-target'));
            const current = parseInt(el.textContent);
            
            if (current < target && isElementInViewport(el)) {
                const increment = Math.ceil(target / 20);
                const newValue = Math.min(current + increment, target);
                el.textContent = newValue;
            }
        });
    };
    
    window.addEventListener('scroll', animateNumbers);
    
    // Parallax effect
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        document.querySelectorAll('.parallax').forEach(el => {
            const speed = el.getAttribute('data-speed') || 0.5;
            el.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// ===== HELPER FUNCTIONS =====
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===== AUTHENTICATION =====
function checkAuth() {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        // Validate token
        fetch(`${API_BASE_URL}/api/auth/validate`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                currentUser = data.user;
                updateUIForAuth();
            } else {
                localStorage.removeItem('authToken');
            }
        })
        .catch(() => {
            localStorage.removeItem('authToken');
        });
    }
}

function updateUIForAuth() {
    document.querySelectorAll('.auth-required').forEach(el => {
        el.style.display = 'block';
    });
    
    document.querySelectorAll('.guest-only').forEach(el => {
        el.style.display = 'none';
    });
    
    // Update user info
    const userInfo = document.getElementById('userInfo');
    if (userInfo && currentUser) {
        userInfo.innerHTML = `
            <div class="user-avatar">${currentUser.name.charAt(0)}</div>
            <span class="user-name">${currentUser.name}</span>
        `;
    }
}

// ===== SAMPLE DATA =====
function loadSampleData() {
    // Load sample contracts
    const sampleContracts = [
        {
            id: '1',
            name: 'Service Agreement - Acme Corp.pdf',
            date: '2024-01-15',
            risk: 'medium'
        },
        {
            id: '2',
            name: 'NDA Template - Beta Inc.pdf',
            date: '2024-01-14',
            risk: 'low'
        },
        {
            id: '3',
            name: 'Employment Contract - John Doe.pdf',
            date: '2024-01-13',
            risk: 'high'
        }
    ];
    
    // Update recent contracts list
    const contractsList = document.getElementById('recentContracts');
    if (contractsList) {
        contractsList.innerHTML = sampleContracts.map(contract => `
            <div class="contract-item" onclick="viewContract('${contract.id}')">
                <div class="contract-icon"><i class="bi bi-file-pdf"></i></div>
                <div class="contract-info">
                    <div class="contract-name">${contract.name}</div>
                    <div class="contract-date">${formatDate(contract.date)}</div>
                </div>
                <span class="risk-badge risk-${contract.risk}">${contract.risk}</span>
            </div>
        `).join('');
    }
}

// ===== GLOBAL FUNCTIONS =====
window.viewContract = function(contractId) {
    window.location.href = `dashboard.html?id=${contractId}`;
};

window.downloadReport = function(contractId, format) {
    window.open(`${API_BASE_URL}/api/download/${contractId}?format=${format}`);
};

window.shareContract = function(contractId) {
    const url = `${window.location.origin}/shared/${contractId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Contract Analysis',
            text: 'Check out this contract analysis',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        showNotification('Link copied to clipboard!', 'success');
    }
};

window.printReport = function() {
    window.print();
};

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showNotification('An error occurred. Please try again.', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e.reason);
    showNotification('An error occurred. Please try again.', 'error');
});

// ===== SERVICE WORKER (PWA) =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });

}
