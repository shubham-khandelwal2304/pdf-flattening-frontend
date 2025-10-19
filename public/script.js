// Global variables
let selectedFile = null;
let currentTaskId = null;
let statusCheckInterval = null;
let apiBaseUrl = 'https://pdf-flattening-backend.onrender.com';

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const dpiInput = document.getElementById('dpiInput');
const dpiPresets = document.querySelectorAll('.dpi-preset');
const qualityToggle = document.getElementById('qualityToggle');
const toggleSwitch = document.getElementById('toggleSwitch');
const processButton = document.getElementById('processButton');
const progressSection = document.getElementById('progressSection');
const progressStatus = document.getElementById('progressStatus');
const progressFill = document.getElementById('progressFill');
const progressMessage = document.getElementById('progressMessage');
const resultSection = document.getElementById('resultSection');
const resultMessage = document.getElementById('resultMessage');
const downloadButton = document.getElementById('downloadButton');
// const tipsGrid = document.getElementById('tipsGrid'); // Commented out - tips section removed
const refreshButton = document.getElementById('refreshButton');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // loadOCRTips(); // Commented out - tips section removed
    setupEventListeners();
});

function setupEventListeners() {
    // File upload
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // DPI settings
    dpiInput.addEventListener('input', updateDpiExplanation);
    dpiPresets.forEach(preset => {
        preset.addEventListener('click', () => selectDpiPreset(preset));
    });

    // Quality toggle
    qualityToggle.addEventListener('click', toggleQualityMode);

    // Process button
    processButton.addEventListener('click', handleProcessButtonClick);

    // Refresh button
    refreshButton.addEventListener('click', clearFile);
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFile(file) {
    if (file.type !== 'application/pdf') {
        alert('Please select a PDF file.');
        return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.classList.add('active');
    processButton.disabled = false;
    processButton.innerHTML = '<i class="fas fa-magic"></i> Process PDF';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function handleProcessButtonClick() {
    if (!selectedFile) {
        // No file selected, trigger file selection
        fileInput.click();
    } else {
        // File selected, process it
        processFile();
    }
}

function clearFile() {
    // Clear selected file
    selectedFile = null;
    
    // Reset file input
    fileInput.value = '';
    
    // Hide file info
    fileInfo.classList.remove('active');
    
    // Reset button state
    processButton.disabled = false;
    processButton.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Select PDF File';
    
    // Hide any progress or result sections
    progressSection.classList.remove('active');
    resultSection.classList.remove('active');
    
    // Clear any existing status check interval
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
    
    // Reset current task ID
    currentTaskId = null;
}

function selectDpiPreset(preset) {
    dpiPresets.forEach(p => p.classList.remove('active'));
    preset.classList.add('active');
    dpiInput.value = preset.dataset.dpi;
    updateDpiExplanation();
}

function updateDpiExplanation() {
    const dpi = dpiInput.value;
    const explanation = document.querySelector('.dpi-explanation');
    let text = '';
    
    if (dpi <= 600) {
        text = `<strong>${dpi} DPI</strong> - Good for clear, typed documents.`;
    } else if (dpi <= 800) {
        text = `<strong>${dpi} DPI</strong> - Optimal for most invoices and forms (recommended).`;
    } else if (dpi <= 1200) {
        text = `<strong>${dpi} DPI</strong> - Enhanced quality for documents with small text.`;
    } else {
        text = `<strong>${dpi} DPI</strong> - Ultra-high quality for challenging documents.`;
    }
    
    explanation.innerHTML = text;
}

function toggleQualityMode() {
    const isActive = qualityToggle.classList.contains('active');
    qualityToggle.classList.toggle('active');
    toggleSwitch.classList.toggle('active');
    
    if (!isActive) { // Quality mode is being turned ON
        // If Maximum OCR Quality is enabled, set DPI to maximum (2400)
        dpiInput.value = '2400';
        updateDpiExplanation();
        
        // Update active preset to 2400 if it exists, otherwise remove active class from all
        dpiPresets.forEach(preset => {
            preset.classList.remove('active');
            if (preset.dataset.dpi === '2400') {
                preset.classList.add('active');
            }
        });
    } else { // Quality mode is being turned OFF
        // If Maximum OCR Quality is disabled, set DPI back to default (600)
        dpiInput.value = '600';
        updateDpiExplanation();
        
        // Update active preset to 600
        dpiPresets.forEach(preset => {
            preset.classList.remove('active');
            if (preset.dataset.dpi === '600') {
                preset.classList.add('active');
            }
        });
    }
}

async function processFile() {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('dpi', dpiInput.value);
    formData.append('max_ocr_quality', qualityToggle.classList.contains('active'));

    // Show progress section
    progressSection.classList.add('active');
    resultSection.classList.remove('active');
    processButton.disabled = true;
    processButton.innerHTML = '<div class="loading-spinner"></div> Processing PDF...';

    try {
        const response = await fetch(`${apiBaseUrl}/api/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            currentTaskId = result.task_id;
            startStatusCheck();
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        showError(error.message);
    }
}

function startStatusCheck() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }

    statusCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/status/${currentTaskId}`);
            const status = await response.json();

            updateProgress(status);

            if (status.status === 'completed' || status.status === 'error') {
                clearInterval(statusCheckInterval);
                if (status.status === 'completed') {
                    showSuccess(status);
                } else {
                    showError(status.message);
                }
            }
        } catch (error) {
            clearInterval(statusCheckInterval);
            showError('Failed to check processing status');
        }
    }, 1000);
}

function updateProgress(status) {
    progressStatus.textContent = status.status;
    progressStatus.className = `progress-status ${status.status}`;
    progressFill.style.width = `${status.progress || 0}%`;
    progressMessage.textContent = status.message;
}

function showSuccess(status) {
    progressSection.classList.remove('active');
    resultSection.classList.add('active');
    resultMessage.textContent = status.message;
    downloadButton.href = `${apiBaseUrl}/api/download/${currentTaskId}`;
    downloadButton.download = status.download_filename;
    
    processButton.disabled = false;
    processButton.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Select PDF File';
}

function showError(message) {
    progressSection.classList.remove('active');
    resultSection.classList.add('active');
    resultMessage.textContent = `Error: ${message}`;
    downloadButton.style.display = 'none';
    
    processButton.disabled = false;
    processButton.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Select PDF File';
}

// function loadOCRTips() {
//     // Load concise tips directly without API call for faster loading
//     const conciseTips = [
//         {
//             title: 'Quick Tips',
//             items: [
//                 '600 DPI recommended for most documents',
//                 'Higher DPI = better OCR but larger files',
//                 'Enable max quality for challenging documents',
//                 'Use grayscale for better text recognition'
//             ]
//         },
//         {
//             title: 'Best Results',
//             items: [
//                 'Scan documents flat and well-lit',
//                 'Clean documents before scanning',
//                 'Avoid shadows and reflections',
//                 'Use 300+ DPI for original scans'
//             ]
//         }
//     ];

//     tipsGrid.innerHTML = conciseTips.map(card => `
//         <div class="tip-card">
//             <div class="tip-title">${card.title}</div>
//             <ul class="tip-list">
//                 ${card.items.map(item => `<li>${item}</li>`).join('')}
//             </ul>
//         </div>
//     `).join('');
// }

// Initialize DPI explanation
updateDpiExplanation();
