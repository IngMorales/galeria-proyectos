document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const gallery = document.getElementById('project-gallery');
    const addProjectBtn = document.getElementById('add-project-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = themeToggleBtn.querySelector('i');
    const themeText = themeToggleBtn.querySelector('.theme-text');

    const formContainer = document.getElementById('project-form-container');
    const projectForm = document.getElementById('project-form');
    const formTitle = document.getElementById('form-title');
    const projectIdInput = document.getElementById('project-id');
    const projectTitleInput = document.getElementById('project-title');
    const projectDescriptionInput = document.getElementById('project-description');
    const projectImageInput = document.getElementById('project-image');
    const imagePreview = document.getElementById('image-preview');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const submitBtn = document.getElementById('submit-btn');
    const loadingIndicator = document.getElementById('loading-indicator');

    // --- Variables y Constantes ---
    const PROJECTS_LS_KEY = 'interactiveGalleryProjects';
    const THEME_LS_KEY = 'interactiveGalleryTheme';
    let projects = [];
    let isEditing = false;

    // --- Funciones ---

    // Obtener proyectos de LocalStorage
    const getProjectsFromLS = () => {
        const projectsJson = localStorage.getItem(PROJECTS_LS_KEY);
        try {
            return projectsJson ? JSON.parse(projectsJson) : [];
        } catch (e) {
            console.error("Error parsing projects from localStorage:", e);
            return [];
        }
    };

    // Guardar proyectos en LocalStorage
    const saveProjectsToLS = () => {
        localStorage.setItem(PROJECTS_LS_KEY, JSON.stringify(projects));
    };

    // Crear HTML para una tarjeta de proyecto
    const createProjectCardHTML = (project) => {
        // Usa una imagen placeholder si no hay imageUrl o si es inválida
        const imageSrc = project.imageUrl && project.imageUrl.trim() !== '' ? project.imageUrl : 'https://via.placeholder.com/300x200.png?text=No+Image';
        // Manejo de error si la imagen cargada falla
        const imageErrorHandling = `onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200.png?text=Load+Error';"`;

        return `
            <article class="project-card" data-id="${project.id}">
                <img src="${imageSrc}" alt="Imagen del proyecto ${project.title}" class="project-image" ${imageErrorHandling}>
                <div class="card-content">
                    <h3>${escapeHTML(project.title)}</h3>
                    <p>${escapeHTML(project.description)}</p>
                    <div class="card-actions">
                        <button class="btn-icon edit-btn" title="Editar Proyecto">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-btn" title="Eliminar Proyecto">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </article>
        `;
    };

    // Renderizar todos los proyectos en la galería
    const renderGallery = () => {
        gallery.innerHTML = ''; // Limpiar galería actual
        if (projects.length === 0) {
            gallery.innerHTML = '<p>No hay proyectos para mostrar. ¡Agrega uno!</p>';
            return;
        }
        projects.forEach(project => {
            const cardHTML = createProjectCardHTML(project);
            gallery.insertAdjacentHTML('beforeend', cardHTML);
            // Forzar reflow para que la animación funcione al cargar
            const cardElement = gallery.lastElementChild;
             // Añadir clase con pequeño retraso para asegurar que la animación se aplique
            setTimeout(() => cardElement.classList.add('fade-in'), 10);
        });
    };

    // Mostrar/Ocultar formulario
    const showForm = (editMode = false, projectData = null) => {
        isEditing = editMode;
        formTitle.textContent = editMode ? 'Editar Proyecto' : 'Agregar Nuevo Proyecto';
        projectForm.reset(); // Limpiar formulario
        clearFormErrors();
        imagePreview.style.display = 'none'; // Ocultar preview por defecto
        imagePreview.src = '#';
        projectIdInput.value = ''; // Limpiar ID oculto

        if (editMode && projectData) {
            projectIdInput.value = projectData.id;
            projectTitleInput.value = projectData.title;
            projectDescriptionInput.value = projectData.description;
            // Mostrar preview si hay imagen existente
            if (projectData.imageUrl) {
                imagePreview.src = projectData.imageUrl;
                imagePreview.style.display = 'block';
            }
        }

        formContainer.classList.remove('hidden');
        projectTitleInput.focus(); // Enfocar el primer campo
    };

    const hideForm = () => {
        formContainer.classList.add('hidden');
        projectForm.reset();
        clearFormErrors();
        imagePreview.style.display = 'none';
        imagePreview.src = '#';
        projectIdInput.value = '';
        isEditing = false;
    };

    // Validar formulario (básico)
    const validateForm = () => {
        let isValid = true;
        clearFormErrors();

        if (!projectTitleInput.value.trim()) {
            showError('title-error', 'El título es obligatorio.');
            isValid = false;
        }
        if (!projectDescriptionInput.value.trim()) {
             showError('desc-error', 'La descripción es obligatoria.');
            isValid = false;
        }
        // Validación adicional de imagen si es necesario (ej: tamaño)
        const imageFile = projectImageInput.files[0];
        if (imageFile && imageFile.size > 2 * 1024 * 1024) { // Límite de 2MB
             showError('image-error', 'La imagen no debe exceder los 2MB.');
            isValid = false;
        }

        return isValid;
    };

     // Mostrar y limpiar errores del formulario
    const showError = (elementId, message) => {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    };

    const clearFormErrors = () => {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    };

    // Mostrar/ocultar indicador de carga
    const showLoading = (show) => {
        if (show) {
            loadingIndicator.classList.remove('hidden');
            submitBtn.disabled = true; // Deshabilitar botón mientras carga
        } else {
            loadingIndicator.classList.add('hidden');
             submitBtn.disabled = false;
        }
    };

    // Escapar HTML para prevenir XSS
    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    };

    // --- Manejadores de Eventos ---

    // Mostrar formulario para agregar
    addProjectBtn.addEventListener('click', () => showForm());

    // Cancelar edición/agregar
    cancelEditBtn.addEventListener('click', hideForm);

    // Subir imagen y guardar proyecto
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        showLoading(true);

        const title = projectTitleInput.value.trim();
        const description = projectDescriptionInput.value.trim();
        const imageFile = projectImageInput.files[0];
        const projectId = projectIdInput.value; // ID para edición
        let imageUrl = null;

        // 1. Subir imagen si existe
        if (imageFile) {
            const formData = new FormData();
            formData.append('projectImage', imageFile); // Nombre debe coincidir con PHP: $_FILES['projectImage']

            try {
                const response = await fetch('php/upload.php', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (response.ok && result.success) {
                    imageUrl = result.imageUrl; // URL relativa devuelta por PHP
                    // Actualizar preview por si acaso, aunque ya debería estar
                     if (imageUrl) {
                        imagePreview.src = imageUrl;
                        imagePreview.style.display = 'block';
                    }
                } else {
                    showError('image-error', result.message || 'Error al subir la imagen.');
                    showLoading(false);
                    return; // Detener si la subida falló
                }
            } catch (error) {
                console.error("Error uploading image:", error);
                 showError('image-error', 'Error de conexión al subir imagen.');
                showLoading(false);
                return;
            }
        } else if (isEditing) {
             // Si estamos editando y no se subió nueva imagen,
             // mantener la URL de la imagen existente (si la tenía)
             const existingProject = projects.find(p => p.id === projectId);
             if (existingProject) {
                 imageUrl = existingProject.imageUrl;
             }
        }


        // 2. Guardar/Actualizar datos del proyecto en LocalStorage
        if (isEditing && projectId) {
            // Editar proyecto existente
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex > -1) {
                projects[projectIndex] = {
                    ...projects[projectIndex], // Mantener ID y quizás otras props
                    title,
                    description,
                    // Actualizar imageUrl solo si se subió una nueva o si se mantuvo la anterior
                     imageUrl: imageUrl !== null ? imageUrl : projects[projectIndex].imageUrl
                };
            }
        } else {
            // Agregar nuevo proyecto
            const newProject = {
                id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // ID único simple
                title,
                description,
                imageUrl // Será null si no se subió imagen
            };
            projects.push(newProject);
        }

        saveProjectsToLS(); // Guardar en LocalStorage
        renderGallery(); // Re-renderizar la galería
        hideForm(); // Ocultar y resetear el formulario
        showLoading(false); // Ocultar indicador
    });

    // Manejar clics en la galería (Editar/Eliminar usando delegación)
    gallery.addEventListener('click', (e) => {
        const target = e.target;
        const editBtn = target.closest('.edit-btn');
        const deleteBtn = target.closest('.delete-btn');
        const card = target.closest('.project-card');

        if (!card) return; // Salir si el clic no fue dentro de una tarjeta

        const projectId = card.dataset.id;

        if (editBtn) {
            // Editar proyecto
            const projectToEdit = projects.find(p => p.id === projectId);
            if (projectToEdit) {
                showForm(true, projectToEdit); // Mostrar formulario en modo edición
            }
        } else if (deleteBtn) {
            // Eliminar proyecto
            if (confirm(`¿Estás seguro de que quieres eliminar el proyecto "${card.querySelector('h3').textContent}"?`)) {
                 // Añadir clase para animación de salida
                card.classList.add('fade-out');
                // Esperar a que termine la animación antes de eliminar del DOM y LS
                card.addEventListener('animationend', () => {
                    projects = projects.filter(p => p.id !== projectId); // Filtrar el proyecto
                    saveProjectsToLS(); // Guardar cambios
                    renderGallery(); // Re-renderizar (esto quitará el elemento definitivamente)
                 }, { once: true }); // El listener se ejecuta solo una vez
            }
        }
    });

    // Limpiar todos los proyectos
    clearAllBtn.addEventListener('click', () => {
        if (projects.length > 0 && confirm('¿Estás seguro de que quieres eliminar TODOS los proyectos? Esta acción no se puede deshacer.')) {
            projects = []; // Vaciar array
            saveProjectsToLS(); // Guardar estado vacío
            renderGallery(); // Actualizar vista
             // Opcional: Podrías hacer una llamada a PHP para limpiar la carpeta /uploads si fuera necesario,
             // pero usualmente esto se maneja con tareas programadas (cron jobs) en el servidor.
        } else if (projects.length === 0) {
            alert('La galería ya está vacía.');
        }
    });

     // Vista previa de imagen seleccionada
    projectImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo aquí también si se desea (aunque PHP también lo hará)
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                showError('image-error', 'Tipo de archivo no válido. Solo JPG, PNG, GIF.');
                projectImageInput.value = ''; // Resetear input
                imagePreview.style.display = 'none';
                return;
            }
             // Validar tamaño
             if (file.size > 2 * 1024 * 1024) { // 2MB
                showError('image-error', 'La imagen no debe exceder los 2MB.');
                projectImageInput.value = ''; // Resetear input
                imagePreview.style.display = 'none';
                return;
            }

            clearFormErrors(); // Limpiar errores previos si la imagen es válida
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        } else {
            imagePreview.style.display = 'none';
            imagePreview.src = '#';
        }
    });

    // --- Tema Oscuro/Claro ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            themeText.textContent = 'Claro';
            localStorage.setItem(THEME_LS_KEY, 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
             themeText.textContent = 'Oscuro';
            localStorage.setItem(THEME_LS_KEY, 'light');
        }
    };

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(currentTheme);
    });

    // --- Inicialización ---
    const loadInitialData = () => {
        // Cargar tema guardado
        const savedTheme = localStorage.getItem(THEME_LS_KEY) || 'light'; // Default a claro
        applyTheme(savedTheme);

        // Cargar proyectos guardados
        projects = getProjectsFromLS();
        renderGallery();
    };

    loadInitialData(); // Cargar datos al iniciar la página
});