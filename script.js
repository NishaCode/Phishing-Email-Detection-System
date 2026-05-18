document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analysis-form');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const resultsPanel = document.getElementById('analysis-results');
    const overallStatus = document.getElementById('overall-status');
    
    // Steps
    const steps = {
        nlp: document.getElementById('step-nlp'),
        header: document.getElementById('step-header'),
        url: document.getElementById('step-url'),
        file: document.getElementById('step-file')
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get Inputs
        const content = document.getElementById('email-content').value.toLowerCase();
        const headers = document.getElementById('email-headers').value.toLowerCase();
        const urls = document.getElementById('email-urls').value.toLowerCase();
        const files = document.getElementById('email-attachments').files;

        // Reset UI
        emptyState.classList.add('hidden');
        resultsPanel.classList.add('hidden');
        loadingState.classList.remove('hidden');
        overallStatus.className = 'status-badge pending';
        overallStatus.innerText = 'Analyzing...';
        
        Object.values(steps).forEach(step => {
            step.classList.remove('done');
            step.innerHTML = step.innerHTML.replace('bx-check-circle', 'bx-loader-alt bx-spin');
        });

        // Simulate Analysis Pipeline
        let currentDelay = 0;
        
        // Step 1: NLP
        currentDelay += 800;
        setTimeout(() => completeStep('nlp'), currentDelay);
        
        // Step 2: Headers
        currentDelay += 700;
        setTimeout(() => completeStep('header'), currentDelay);
        
        // Step 3: URLs
        currentDelay += 900;
        setTimeout(() => completeStep('url'), currentDelay);
        
        // Step 4: Files
        currentDelay += 600;
        setTimeout(() => {
            completeStep('file');
            setTimeout(() => showResults(content, headers, urls, files), 500);
        }, currentDelay);
    });

    function completeStep(stepId) {
        const el = steps[stepId];
        el.classList.add('done');
        el.innerHTML = el.innerHTML.replace('bx-loader-alt bx-spin', 'bx-check-circle');
    }

    function showResults(content, headers, urls, files) {
        loadingState.classList.add('hidden');
        resultsPanel.classList.remove('hidden');

        // Logic to calculate mock score
        let score = 5; // Base probability
        
        // NLP Analysis
        const suspiciousKeywords = ['urgent', 'verify', 'account', 'suspended', 'password', 'login', 'click here', 'update', 'billing', 'invoice'];
        let matchCount = 0;
        suspiciousKeywords.forEach(kw => {
            if (content.includes(kw)) matchCount++;
        });
        
        let nlpStatus = 'safe';
        let nlpMsg = 'No suspicious language detected.';
        if (matchCount > 2) { score += 30; nlpStatus = 'danger'; nlpMsg = 'High urgency & credential theft patterns.'; }
        else if (matchCount > 0) { score += 15; nlpStatus = 'warning'; nlpMsg = 'Some suspicious keywords detected.'; }
        
        updateModule('nlp', nlpStatus, nlpMsg);

        // Header Analysis
        let headerStatus = 'safe';
        let headerMsg = 'Authentication passed (SPF/DKIM).';
        if (headers.length > 0) {
            if (headers.includes('fail') || headers.includes('softfail') || headers.includes('none')) {
                score += 25;
                headerStatus = 'danger';
                headerMsg = 'SPF/DKIM validation failed. Possible spoofing.';
            }
        } else {
            headerStatus = 'warning';
            headerMsg = 'No headers provided. Cannot verify origin.';
            score += 10;
        }
        updateModule('header', headerStatus, headerMsg);

        // URL Analysis
        let urlStatus = 'safe';
        let urlMsg = 'No malicious links identified.';
        if (urls.length > 0) {
            if (urls.includes('bit.ly') || urls.includes('tinyurl') || urls.includes('-') || urls.includes('.xyz')) {
                score += 30;
                urlStatus = 'danger';
                urlMsg = 'Suspicious/shortened domain detected.';
            } else {
                urlStatus = 'warning';
                urlMsg = 'Uncategorized domain present.';
                score += 5;
            }
        }
        updateModule('url', urlStatus, urlMsg);

        // Attachment Analysis
        let fileStatus = 'safe';
        let fileMsg = 'No dangerous attachments.';
        if (files.length > 0) {
            let hasDanger = false;
            for (let i = 0; i < files.length; i++) {
                const ext = files[i].name.split('.').pop().toLowerCase();
                if (['exe', 'bat', 'js', 'vbs', 'scr', 'macro', 'docm', 'xlsm'].includes(ext)) {
                    hasDanger = true;
                }
            }
            if (hasDanger) {
                score += 40;
                fileStatus = 'danger';
                fileMsg = 'Executable/Macro payload detected.';
            } else {
                fileStatus = 'warning';
                fileMsg = 'Files attached. Safe formats but caution advised.';
                score += 5;
            }
        }
        updateModule('file', fileStatus, fileMsg);

        // Cap score at 99%
        if (score > 99) score = 99;
        
        // Update Gauge
        updateGauge(score);
        
        // Update Overall Status
        if (score >= 60) {
            overallStatus.className = 'status-badge danger';
            overallStatus.innerText = 'Phishing Detected';
        } else if (score >= 30) {
            overallStatus.className = 'status-badge warning';
            overallStatus.innerText = 'Suspicious';
        } else {
            overallStatus.className = 'status-badge safe';
            overallStatus.innerText = 'Clean';
        }
    }

    function updateModule(modId, status, msg) {
        const el = document.getElementById(`mod-${modId}`);
        const msgEl = document.getElementById(`res-${modId}`);
        
        // Clear old classes
        el.className = 'module-card';
        el.classList.add(`mod-${status}`);
        msgEl.innerText = msg;
    }

    function updateGauge(score) {
        const circle = document.getElementById('score-circle');
        const text = document.getElementById('score-text');
        
        // Set Color
        let color = '#10b981'; // safe
        if (score >= 60) color = '#ef4444'; // danger
        else if (score >= 30) color = '#f59e0b'; // warning
        
        circle.style.stroke = color;
        
        // Animate progress
        // SVG circle dasharray: "score, 100"
        setTimeout(() => {
            circle.setAttribute('stroke-dasharray', `${score}, 100`);
            
            // Counter animation
            let current = 0;
            const step = Math.max(1, Math.floor(score / 30));
            const timer = setInterval(() => {
                current += step;
                if (current >= score) {
                    current = score;
                    clearInterval(timer);
                }
                text.textContent = `${current}%`;
                text.style.fill = color;
            }, 30);
        }, 100);
    }
    
    // File upload visual feedback
    const fileInput = document.getElementById('email-attachments');
    const fileText = document.querySelector('.file-upload span');
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileText.innerHTML = `<b>${e.target.files.length}</b> file(s) selected`;
            fileText.style.color = '#3b82f6';
        } else {
            fileText.innerHTML = `Drag & drop files or <u>browse</u>`;
            fileText.style.color = 'inherit';
        }
    });
});
