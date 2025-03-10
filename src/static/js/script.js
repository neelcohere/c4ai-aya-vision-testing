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
    const summaryEditContainer = document.getElementById('summary-edit-container');
    const summaryTitleEdit = document.getElementById('summary-title-edit');
    const summaryDescriptionEdit = document.getElementById('summary-description-edit');
    const editSummaryButton = document.getElementById('edit-summary-button');
    const approveSummaryButton = document.getElementById('approve-summary-button');
    const cancelSummaryEditButton = document.getElementById('cancel-summary-edit-button');
    const saveSummaryEditButton = document.getElementById('save-summary-edit-button');
    
    // Track approval status
    let allDescriptionsApproved = false;
    let summaryApproved = false;
    
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
                
                data.descriptions.forEach((item, index) => {
                    const descItem = document.createElement('div');
                    descItem.className = 'description-item';
                    descItem.dataset.index = index;
                    
                    // Create header with filename
                    const itemHeader = document.createElement('div');
                    itemHeader.className = 'description-item-header';
                    
                    const fileName = document.createElement('h3');
                    fileName.textContent = item.filename;
                    
                    // Add approval status
                    const approvalStatus = document.createElement('span');
                    approvalStatus.className = 'approved-tag hidden';
                    approvalStatus.textContent = 'Approved';
                    approvalStatus.id = `approved-tag-${index}`;
                    
                    itemHeader.appendChild(fileName);
                    itemHeader.appendChild(approvalStatus);
                    
                    // Create content for viewing
                    const descTextContainer = document.createElement('div');
                    descTextContainer.className = 'description-text-container';
                    descTextContainer.id = `desc-text-container-${index}`;
                    
                    const descText = document.createElement('p');
                    descText.className = 'description-text';
                    descText.textContent = item.description;
                    descText.dataset.originalText = item.description;
                    
                    descTextContainer.appendChild(descText);
                    
                    // Create edit interface (hidden initially)
                    const editContainer = document.createElement('div');
                    editContainer.className = 'description-edit-container hidden';
                    editContainer.id = `desc-edit-container-${index}`;
                    
                    const editTextarea = document.createElement('textarea');
                    editTextarea.className = 'full-width';
                    editTextarea.rows = 5;
                    editTextarea.id = `desc-edit-${index}`;
                    editTextarea.value = item.description;
                    
                    editContainer.appendChild(editTextarea);
                    
                    // Create action buttons
                    const actionButtons = document.createElement('div');
                    actionButtons.className = 'description-actions';
                    
                    const editButton = document.createElement('button');
                    editButton.className = 'action-button edit-button';
                    editButton.textContent = 'Edit';
                    editButton.id = `edit-desc-${index}`;
                    
                    const approveButton = document.createElement('button');
                    approveButton.className = 'action-button approve-button';
                    approveButton.textContent = 'Approve';
                    approveButton.id = `approve-desc-${index}`;
                    
                    actionButtons.appendChild(editButton);
                    actionButtons.appendChild(approveButton);
                    
                    // Edit mode buttons (hidden initially)
                    const editModeButtons = document.createElement('div');
                    editModeButtons.className = 'description-actions hidden';
                    editModeButtons.id = `edit-mode-buttons-${index}`;
                    
                    const cancelButton = document.createElement('button');
                    cancelButton.className = 'action-button cancel-button';
                    cancelButton.textContent = 'Cancel';
                    cancelButton.id = `cancel-edit-${index}`;
                    
                    const saveButton = document.createElement('button');
                    saveButton.className = 'action-button save-button';
                    saveButton.textContent = 'Save';
                    saveButton.id = `save-edit-${index}`;
                    
                    editModeButtons.appendChild(cancelButton);
                    editModeButtons.appendChild(saveButton);
                    
                    // Append all elements
                    descItem.appendChild(itemHeader);
                    descItem.appendChild(descTextContainer);
                    descItem.appendChild(editContainer);
                    descItem.appendChild(actionButtons);
                    descItem.appendChild(editModeButtons);
                    descriptionsList.appendChild(descItem);
                    
                    // Set up event listeners for this description item
                    setupDescriptionItemListeners(index);
                });
                
                // Check if all descriptions are approved to update UI
                checkAllDescriptionsApproved();
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
                
                // Store summary data for ticket submission and editing
                summaryText.dataset.title = data.summary.title;
                summaryText.dataset.description = data.summary.description;
                
                // Populate edit form with current values
                summaryTitleEdit.value = data.summary.title;
                summaryDescriptionEdit.value = data.summary.description;
                
                // Hide ticket form until approved
                ticketContainer.classList.add('hidden');
                summaryApproved = false;
            }
        })
        .catch(error => {
            loadingIndicator.classList.add('hidden');
            descriptionsList.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        });
    });
    
    // Helper function to set up description item listeners
    function setupDescriptionItemListeners(index) {
        // Edit button opens the edit interface
        document.getElementById(`edit-desc-${index}`).addEventListener('click', () => {
            document.getElementById(`desc-text-container-${index}`).classList.add('hidden');
            document.getElementById(`desc-edit-container-${index}`).classList.remove('hidden');
            document.getElementById(`edit-mode-buttons-${index}`).classList.remove('hidden');
            document.querySelector(`[data-index="${index}"] .description-actions`).classList.add('hidden');
            
            // Update the textarea with current content
            const currentText = document.querySelector(`[data-index="${index}"] .description-text`).textContent;
            document.getElementById(`desc-edit-${index}`).value = currentText;
        });
        
        // Approve button marks the description as approved
        document.getElementById(`approve-desc-${index}`).addEventListener('click', () => {
            document.getElementById(`approved-tag-${index}`).classList.remove('hidden');
            document.getElementById(`edit-desc-${index}`).disabled = true;
            document.getElementById(`approve-desc-${index}`).disabled = true;
            
            // Mark as approved and check overall approval status
            document.querySelector(`[data-index="${index}"]`).dataset.approved = 'true';
            checkAllDescriptionsApproved();
        });
        
        // Cancel button returns to view mode without saving changes
        document.getElementById(`cancel-edit-${index}`).addEventListener('click', () => {
            document.getElementById(`desc-text-container-${index}`).classList.remove('hidden');
            document.getElementById(`desc-edit-container-${index}`).classList.add('hidden');
            document.getElementById(`edit-mode-buttons-${index}`).classList.add('hidden');
            document.querySelector(`[data-index="${index}"] .description-actions`).classList.remove('hidden');
        });
        
        // Save button saves changes and returns to view mode
        document.getElementById(`save-edit-${index}`).addEventListener('click', () => {
            const newText = document.getElementById(`desc-edit-${index}`).value;
            document.querySelector(`[data-index="${index}"] .description-text`).textContent = newText;
            
            // Return to view mode
            document.getElementById(`desc-text-container-${index}`).classList.remove('hidden');
            document.getElementById(`desc-edit-container-${index}`).classList.add('hidden');
            document.getElementById(`edit-mode-buttons-${index}`).classList.add('hidden');
            document.querySelector(`[data-index="${index}"] .description-actions`).classList.remove('hidden');
        });
    }
    
    // Helper function to check if all descriptions are approved
    function checkAllDescriptionsApproved() {
        const descItems = document.querySelectorAll('.description-item');
        allDescriptionsApproved = Array.from(descItems).every(item => item.dataset.approved === 'true');
        
        // If all approved and summary is also approved, show the ticket form
        updateTicketFormVisibility();
    }
    
    // Helper function to update ticket form visibility based on approval status
    function updateTicketFormVisibility() {
        if (allDescriptionsApproved && summaryApproved) {
            ticketContainer.classList.remove('hidden');
        } else {
            ticketContainer.classList.add('hidden');
        }
    }
    
    // Summary Edit button
    editSummaryButton.addEventListener('click', () => {
        summaryContainer.classList.add('hidden');
        summaryEditContainer.classList.remove('hidden');
    });
    
    // Summary Approve button
    approveSummaryButton.addEventListener('click', () => {
        summaryApproved = true;
        
        // Add approved tag to summary
        const approvedTag = document.createElement('span');
        approvedTag.className = 'approved-tag';
        approvedTag.textContent = 'Approved';
        approvedTag.id = 'summary-approved-tag';
        
        // Remove previous tag if exists
        const existingTag = document.getElementById('summary-approved-tag');
        if (existingTag) {
            existingTag.remove();
        }
        
        // Add to summary title
        const titleElement = summaryText.querySelector('strong');
        titleElement.appendChild(approvedTag);
        
        // Disable edit and approve buttons
        editSummaryButton.disabled = true;
        approveSummaryButton.disabled = true;
        
        // Update UI based on approval status
        updateTicketFormVisibility();
    });
    
    // Cancel Summary Edit button
    cancelSummaryEditButton.addEventListener('click', () => {
        summaryEditContainer.classList.add('hidden');
        summaryContainer.classList.remove('hidden');
    });
    
    // Save Summary Edit button
    saveSummaryEditButton.addEventListener('click', () => {
        // Get edited values
        const newTitle = summaryTitleEdit.value;
        const newDescription = summaryDescriptionEdit.value;
        
        // Update display
        const titleElement = summaryText.querySelector('strong');
        titleElement.textContent = newTitle;
        
        const descriptionElement = summaryText.querySelector('p');
        descriptionElement.textContent = newDescription;
        
        // Update stored data
        summaryText.dataset.title = newTitle;
        summaryText.dataset.description = newDescription;
        
        // Switch back to view mode
        summaryEditContainer.classList.add('hidden');
        summaryContainer.classList.remove('hidden');
        
        // Reset approved status
        summaryApproved = false;
        
        // Re-enable approve button
        approveSummaryButton.disabled = false;
        
        // Remove approved tag if exists
        const existingTag = document.getElementById('summary-approved-tag');
        if (existingTag) {
            existingTag.remove();
        }
        
        // Update UI based on approval status
        updateTicketFormVisibility();
    });
    
    // Handle ticket submission
    ticketForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Ensure all items are approved before submission
        if (!allDescriptionsApproved || !summaryApproved) {
            alert('Please approve all descriptions and the summary before submitting a ticket.');
            return;
        }
        
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