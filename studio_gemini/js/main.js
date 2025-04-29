document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const projectForm = document.getElementById('project-form');
    const formSection = document.getElementById('form-section');
    const formTitle = document.getElementById('form-title');
    const projectIdInput = document.getElementById('project-id');
    const projectTitleInput = document.getElementById('project-title');
    const projectDescInput = document.getElementById('project-desc');
    const projectImageInput = document.getElementById('project-image');
    const imagePreview = document.getElementById('image-preview');
    const galleryGrid = document.getElementById('project-gallery');
    const addProjectBtn = document.getElementById('add-project-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const submitBtn = document.getElementById('submit-btn');
    const submitBtnText = submitBtn.querySelector('.btn-text');
    const loadingIndicator = document.getElementById('loading-indicator');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const noProjectsMessage = document.getElementById('no-projects-message');
    const toggleThemeBtn = document.getElementById('toggle-theme-btn');
    const themeIcon = toggleThemeBtn.querySelector('i');

    const UPLOAD_SCRIPT_URL = 'php/upload.php';
    const MAX_IMAGE_SIZE_MB = 2;
    const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

    // --- State ---
    let projects = [];
    let isEditing = false;

    // --- LocalStorage Functions ---
    const getProjectsFromStorage = () => {
        const storedProjects = localStorage.getItem('projects');
        try {
            return storedProjects ? JSON.parse(storedProjects) : [];
        } catch (e) {
            console.error("Error parsing projects from localStorage:", e);
            return []; // Return empty array on error
        }
    };

    const saveProjectsToStorage = (projectsToSave) => {
        localStorage.setItem('projects', JSON.stringify(projectsToSave));
    };

    // --- Theme Functions ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            toggleThemeBtn.title = "Cambiar a Modo Claro";
        } else {
            document.body.classList.remove('dark-mode');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            toggleThemeBtn.title = "Cambiar a Modo Oscuro";
        }
        localStorage.setItem('theme', theme);
    };

    const toggleTheme = () => {
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    };

    const loadTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light
        applyTheme(savedTheme);
    };


    // --- Rendering Functions ---
    const createProjectCard = (project) => {
        const card = document.createElement('div');
        card.classList.add('project-card');
        card.dataset.id = project.id; // Store ID for easy access

        // Use placeholder if no image URL
        const imageUrl = project.imageUrl || 'https://via.placeholder.com/300x180.png?text=No+Image';

        card.innerHTML = `
            <img src="${imageUrl}" alt="${project.title || 'Imagen del Proyecto'}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x180.png?text=Error+Img';">
            <div class="card-content">
                <h3>${escapeHTML(project.title)}</h3>
                <p>${escapeHTML(project.description)}</p>
                <div class="card-actions">
                    <button class="btn btn-warning edit-btn" title="Editar Proyecto">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger delete-btn" title="Eliminar Proyecto">
                        <i class="fas fa-trash-alt"></i> Eliminar
                    </button>
                </div>
            </div>
        `;

        // Add event listeners directly to buttons
        card.querySelector('.edit-btn').addEventListener('click', () => handleEdit(project.id));
        card.querySelector('.delete-btn').addEventListener('click', () => handleDelete(project.id));

        return card;
    };

    const renderGallery = () => {
        galleryGrid.innerHTML = ''; // Clear existing cards
        if (projects.length === 0) {
            noProjectsMessage.classList.remove('hidden');
        } else {
            noProjectsMessage.classList.add('hidden');
            projects.forEach(project => {
                const card = createProjectCard(project);
                galleryGrid.appendChild(card);
                 // Trigger animation slightly delayed
                 setTimeout(() => card.style.opacity = 1, 50);
            });
        }
    };

    // --- Form Handling ---
    const showForm = (editMode = false, projectData = null) => {
        isEditing = editMode;
        formSection.classList.remove('hidden');
        // Force reflow for animation
        void formSection.offsetWidth;


        if (editMode && projectData) {
            formTitle.textContent = 'Editar';
            submitBtnText.textContent = 'Actualizar';
            projectIdInput.value = projectData.id;
            projectTitleInput.value = projectData.title;
            projectDescInput.value = projectData.description;
            // Don't re-populate file input for security reasons
            // Show current image preview if exists
            if (projectData.imageUrl) {
                 imagePreview.src = projectData.imageUrl;
                 imagePreview.classList.remove('hidden');
            } else {
                imagePreview.classList.add('hidden');
                imagePreview.src = '#';
            }
             projectImageInput.value = ''; // Clear file input always on edit/add
        } else {
            formTitle.textContent = 'Agregar';
            submitBtnText.textContent = 'Guardar';
            projectForm.reset(); // Clear form fields
            projectIdInput.value = '';
            imagePreview.classList.add('hidden');
            imagePreview.src = '#';
            clearValidationErrors();
        }
         // Scroll to form smoothly
         formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const hideForm = () => {
        formSection.classList.add('hidden');
        projectForm.reset();
        projectIdInput.value = '';
        isEditing = false;
        submitBtnText.textContent = 'Guardar';
        imagePreview.classList.add('hidden');
        imagePreview.src = '#';
        clearValidationErrors();
        hideLoading(); // Ensure loading indicator is hidden
    };

    const showLoading = () => {
        loadingIndicator.classList.remove('hidden');
        submitBtn.disabled = true;
        submitBtnText.style.display = 'none'; // Hide text when loading
    };

    const hideLoading = () => {
        loadingIndicator.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtnText.style.display = 'inline'; // Show text again
    };

    // --- Validation ---
    const validateForm = () => {
        let isValid = true;
        clearValidationErrors();

        // Title validation
        if (!projectTitleInput.value.trim()) {
            showValidationError(projectTitleInput, 'El título es obligatorio.');
            isValid = false;
        }

        // Image validation (optional field, but validate if file is selected)
        const file = projectImageInput.files[0];
        if (file) {
            const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                showValidationError(projectImageInput, 'Tipo de archivo no permitido (solo PNG, JPG, GIF).');
                isValid = false;
            } else if (file.size > MAX_IMAGE_SIZE_BYTES) {
                 showValidationError(projectImageInput, `El archivo es demasiado grande (máx ${MAX_IMAGE_SIZE_MB} MB).`);
                 isValid = false;
            }
        }


        return isValid;
    };

    const showValidationError = (inputElement, message) => {
        const formGroup = inputElement.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        formGroup.classList.add('invalid');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block'; // Make sure it's visible
        }
    };

    const clearValidationErrors = () => {
        projectForm.querySelectorAll('.form-group.invalid').forEach(group => {
            group.classList.remove('invalid');
            const errorElement = group.querySelector('.error-message');
            if (errorElement) {
                errorElement.style.display = 'none'; // Hide the error message
            }
        });
    };


    // --- Image Upload (Client-side) ---
    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('projectImage', file); // Name must match PHP's $_FILES key

        try {
            const response = await fetch(UPLOAD_SCRIPT_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                // Try to parse error message from PHP if available
                let errorMessage = `Error del servidor: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) { /* Ignore parsing error */ }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            if (result.success && result.imageUrl) {
                return result.imageUrl; // Return the relative URL from PHP
            } else {
                throw new Error(result.message || 'Error al subir la imagen.');
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            showValidationError(projectImageInput, `Error de carga: ${error.message}`);
            return null; // Indicate failure
        }
    };


    // --- CRUD Operations ---
    const handleFormSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return; // Stop if validation fails
        }

        showLoading();

        const title = projectTitleInput.value.trim();
        const description = projectDescInput.value.trim();
        const id = projectIdInput.value;
        const imageFile = projectImageInput.files[0];
        let imageUrl = null; // Default to null

        // If editing, find the existing project to potentially keep old image URL
        const existingProject = isEditing ? projects.find(p => p.id === id) : null;
        if (existingProject) {
            imageUrl = existingProject.imageUrl; // Keep existing image by default
        }


        // Upload new image if selected
        if (imageFile) {
            const uploadedUrl = await uploadImage(imageFile);
            if (uploadedUrl) {
                imageUrl = uploadedUrl; // Update with new URL if upload succeeds
            } else {
                // Upload failed, stop processing
                hideLoading();
                return; // Error message is shown by uploadImage()
            }
        }

        // Prepare project data
        const projectData = {
            // id: isEditing ? id : Date.now().toString(), // Generate new ID only if adding
             // Use existing ID if editing, otherwise generate a new one
            id: isEditing && id ? id : `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            title: title,
            description: description,
            imageUrl: imageUrl // Use the determined image URL
        };


        if (isEditing) {
            // Update existing project
            projects = projects.map(p => (p.id === id ? projectData : p));
        } else {
            // Add new project (add to the beginning for visual feedback)
            projects.unshift(projectData);
        }

        saveProjectsToStorage(projects);
        renderGallery();
        hideForm(); // Hides form and loading indicator
        // Optionally add a success message here
    };

    const handleEdit = (id) => {
        const projectToEdit = projects.find(p => p.id === id);
        if (projectToEdit) {
            showForm(true, projectToEdit);
        } else {
            console.error("Project not found for editing:", id);
            alert("Error: No se pudo encontrar el proyecto para editar.");
        }
    };

    const handleDelete = (id) => {
        const projectToDelete = projects.find(p => p.id === id);
         if (!projectToDelete) return; // Should not happen if UI is correct

        if (confirm(`¿Estás seguro de que quieres eliminar el proyecto "${escapeHTML(projectToDelete.title)}"?`)) {
            projects = projects.filter(p => p.id !== id);
            saveProjectsToStorage(projects);

             // Remove card visually before re-rendering (optional smooth removal)
            const cardElement = galleryGrid.querySelector(`.project-card[data-id="${id}"]`);
            if (cardElement) {
                 cardElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                 cardElement.style.opacity = '0';
                 cardElement.style.transform = 'scale(0.9)';
                 setTimeout(() => {
                    renderGallery(); // Re-render after animation
                 }, 300);
            } else {
                renderGallery(); // Fallback if card not found
            }
        }
    };

    const handleClearAll = () => {
        if (projects.length === 0) {
            alert("No hay proyectos para borrar.");
            return;
        }
        if (confirm('¿Estás seguro de que quieres eliminar TODOS los proyectos? Esta acción no se puede deshacer.')) {
            projects = [];
            saveProjectsToStorage(projects);
            // Add transition for clearing
            galleryGrid.style.transition = 'opacity 0.5s ease';
            galleryGrid.style.opacity = 0;
            setTimeout(() => {
                renderGallery();
                galleryGrid.style.opacity = 1; // Fade back in (empty state)
            }, 500);

        }
    };

    // --- Utility Functions ---
     const escapeHTML = (str) => {
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    };

     // Preview selected image
     projectImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
            // Clear previous image validation error if any
             const formGroup = projectImageInput.closest('.form-group');
             formGroup.classList.remove('invalid');
             const errorElement = formGroup.querySelector('.error-message');
             if (errorElement) errorElement.style.display = 'none';

        } else {
            imagePreview.src = '#';
            imagePreview.classList.add('hidden');
             if(file) { // Only show error if a file was selected but it's not an image
                 showValidationError(projectImageInput, 'Por favor, selecciona un archivo de imagen válido.');
             }
        }
    });


    // --- Event Listeners ---
    addProjectBtn.addEventListener('click', () => showForm());
    cancelBtn.addEventListener('click', hideForm);
    projectForm.addEventListener('submit', handleFormSubmit);
    clearAllBtn.addEventListener('click', handleClearAll);
    toggleThemeBtn.addEventListener('click', toggleTheme);

    // --- Initialization ---
    const initializeApp = () => {
        loadTheme(); // Load theme preference first
        projects = getProjectsFromStorage();
        renderGallery();
    };

    initializeApp();
});