document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('project-form');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const imageInput = document.getElementById('image');
    const projectsGrid = document.getElementById('projects-grid');
    const loader = document.getElementById('loader');
    const clearBtn = document.getElementById('clearAll');
    const editIdInput = document.getElementById('edit-id');
    const themeToggle = document.getElementById('toggleTheme');

    let projects = JSON.parse(localStorage.getItem('projects') || '[]');

    function saveProjects() {
        localStorage.setItem('projects', JSON.stringify(projects));
    }

    function renderProjects() {
        projectsGrid.innerHTML = '';
        projects.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                ${project.imageUrl ? `<img src="${project.imageUrl}" alt="">` : ''}
                <div class="project-info">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <div class="project-actions">
                        <button class="btn-edit" onclick="editProject(${index})">✏️ Editar</button>
                        <button class="btn-delete" onclick="deleteProject(${index})">🗑 Borrar</button>
                    </div>
                </div>
            `;
            projectsGrid.appendChild(card);
        });
    }

    window.editProject = (index) => {
        const project = projects[index];
        editIdInput.value = index;
        titleInput.value = project.title;
        descriptionInput.value = project.description;
    };

    window.deleteProject = (index) => {
        if (confirm("¿Eliminar este proyecto?")) {
            projects.splice(index, 1);
            saveProjects();
            renderProjects();
        }
    };

    clearBtn.addEventListener('click', () => {
        if (confirm("¿Limpiar todos los proyectos?")) {
            projects = [];
            saveProjects();
            renderProjects();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        loader.style.display = 'block';

        const formData = new FormData();
        if (imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }

        let imageUrl = '';
        if (formData.has('image')) {
            const response = await fetch('php/upload.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                imageUrl = data.url;
            }
        }

        const project = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            imageUrl
        };

        const editIndex = editIdInput.value;
        if (editIndex) {
            projects[editIndex] = project;
            editIdInput.value = '';
        } else {
            projects.push(project);
        }

        saveProjects();
        loader.style.display = 'none';
        form.reset();
        renderProjects();
    });

    // Toggle Theme
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Initial render
    renderProjects();
});