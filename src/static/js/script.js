document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const selectButton = document.getElementById('select-button');
    const previewContainer = document.getElementById('preview-container');
    const previewList = document.getElementById('preview-list');
    const clearImagesButton = document.getElementById('clear-images');
    const analyzeButton = document.getElementById('analyze-button');
    const promptInput = document.getElementById('prompt-input');
    const resultContainer = document.getElementById('result-container');
    const descriptionsContainer = document.getElementById('descriptions-container');
    const descriptionsList = document.getElementById('descriptions-list');
    const summaryContainer = document.getElementById('summary-container');
    const summaryText = document.getElementById('summary-text');
    const loadingIndicator = document.getElementById('loading');
    const ticketContainer = document.getElementById('ticket-container');
    const ticketForm = document.getElementById('ticket-form');
    
    let selectedFiles = [];
    
    // Event Listeners for drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            handleFiles(files);
        }
    }
    
    // Handle file selection
    selectButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFiles(e.target.files);
        }
    });
    
    function handleFiles(files) {
        const fileArray = Array.from(files);
        
        // Filter out non-image files
        const imageFiles = fileArray.filter(file => file.type.match('image.*'));
        
        if (imageFiles.length === 0) {
            alert('Please select at least one image file.');
            return;
        }
        
        if (fileArray.length !== imageFiles.length) {
            alert('Some files were skipped because they are not images.');
        }
        
        // Add new files to selected files list
        selectedFiles = [...selectedFiles, ...imageFiles];
        
        // Display previews
        updatePreviews();
        updateAnalyzeButtonState();
    }
    
    function updatePreviews() {
        // Clear preview list
        previewList.innerHTML = '';
        
        if (selectedFiles.length === 0) {
            clearImagesButton.classList.add('hidden');
            return;
        }
        
        clearImagesButton.classList.remove('hidden');
        
        // Add preview for each file
        selectedFiles.forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            // Create thumbnail
            const thumbnail = document.createElement('img');
            thumbnail.className = 'thumbnail';
            thumbnail.alt = file.name;
            
            // Create reader to set thumbnail src
            const reader = new FileReader();
            reader.onload = (e) => {
                thumbnail.src = e.target.result;
            };
            reader.readAsDataURL(file);
            
            // Create filename display
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.textContent = file.name;
            
            // Create remove button
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-button';
            removeButton.textContent = '×';
            removeButton.addEventListener('click', () => {
                selectedFiles.splice(index, 1);
                updatePreviews();
                updateAnalyzeButtonState();
            });
            
            // Append elements
            previewItem.appendChild(thumbnail);
            previewItem.appendChild(fileInfo);
            previewItem.appendChild(removeButton);
            previewList.appendChild(previewItem);
        });
    }
    
    // Clear all images
    clearImagesButton.addEventListener('click', () => {
        selectedFiles = [];
        updatePreviews();
        updateAnalyzeButtonState();
    });
    
    // Update button state
    function updateAnalyzeButtonState() {
        if (selectedFiles.length > 0) {
            analyzeButton.classList.remove('disabled');
        } else {
            analyzeButton.classList.add('disabled');
        }
    }
    
    // Handle analyze button click
    analyzeButton.addEventListener('click', () => {
        if (selectedFiles.length === 0 || analyzeButton.classList.contains('disabled')) {
            return;
        }
        
        // Reset and show containers
        summaryContainer.classList.add('hidden');
        descriptionsContainer.classList.add('hidden');
        ticketContainer.classList.add('hidden');
        
        // Show loading
        loadingIndicator.classList.remove('hidden');
        resultContainer.classList.remove('hidden');
        descriptionsList.innerHTML = '';
        summaryText.innerHTML = '';
        
        // Create form data
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('images[]', file);
        });
        
        const promptText = promptInput.value.trim();
        if (promptText) {
            formData.append('prompt', promptText);
        }
        
        // Send request to backend
        fetch('/describe', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to get descriptions');
                });
            }
            return response.json();
        })
        .then(data => {
            // Hide loading
            loadingIndicator.classList.add('hidden');
            
            // Display image descriptions
            if (data.descriptions && data.descriptions.length > 0) {
                descriptionsContainer.classList.remove('hidden');
                
                data.descriptions.forEach(item => {
                    const descItem = document.createElement('div');
                    descItem.className = 'description-item';
                    
                    const fileName = document.createElement('h3');
                    fileName.textContent = item.filename;
                    
                    const descText = document.createElement('p');
                    descText.textContent = item.description;
                    
                    descItem.appendChild(fileName);
                    descItem.appendChild(descText);
                    descriptionsList.appendChild(descItem);
                });
            }
            
            // Display summary if available
            if (data.summary && data.summary.title) {
                summaryContainer.classList.remove('hidden');
                
                // Create formatted summary with bold title
                const titleElement = document.createElement('strong');
                titleElement.textContent = data.summary.title;
                
                const descriptionElement = document.createElement('p');
                descriptionElement.textContent = data.summary.description;
                descriptionElement.style.marginTop = '10px';
                
                summaryText.innerHTML = '';
                summaryText.appendChild(titleElement);
                summaryText.appendChild(descriptionElement);
                
                // Store summary data for ticket submission
                summaryText.dataset.title = data.summary.title;
                summaryText.dataset.description = data.summary.description;
                
                // Show ticket form
                ticketContainer.classList.remove('hidden');
            }
        })
        .catch(error => {
            loadingIndicator.classList.add('hidden');
            descriptionsList.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        });
    });
    
    // Handle ticket submission
    ticketForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get values from form
        const technician = document.getElementById('technician-name').value;
        const location = document.getElementById('location').value;
        const equipmentId = document.getElementById('equipment-id').value;
        const additionalNotes = document.getElementById('additional-notes').value;
        
        // Get the title and description from the summary
        const title = summaryText.dataset.title || 'Equipment Issue';
        const description = summaryText.dataset.description || '';
        
        // Create ticket data
        const ticketData = {
            title: title,
            description: description,
            technician: technician,
            location: location,
            equipment_id: equipmentId,
            additional_notes: additionalNotes
        };
        
        // Show submission in progress
        const submitButton = document.getElementById('submit-ticket-button');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;
        
        // Submit the ticket
        fetch('/submit_ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ticketData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to submit ticket');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Show success message
                alert(`Ticket #${data.ticket_id} submitted successfully!`);
                
                // Redirect to tickets view
                window.location.href = '/tickets';
            } else {
                throw new Error('Failed to submit ticket');
            }
        })
        .catch(error => {
            alert(`Error: ${error.message}`);
            // Reset button
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        });
    });
});