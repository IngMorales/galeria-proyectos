// js/app.js
class ProjectGallery {
    constructor() {
        this.projects = JSON.parse(localStorage.getItem('projects')) || [];
        this.form = document.getElementById('projectForm');
        this.init();
    }

    init() {
        this.renderProjects();
        this.setupEventListeners();
        this.loadTheme();
    }

    renderProjects() {
        const grid = document.getElementById('projectGrid');
        grid.innerHTML = this.projects.map(project => `
            <div class="project-card" data-id="${project.id}">
                ${project.image ? `<img src="${project.image}" alt="${project.title}">` : ''}
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="actions">
                    <button class="edit" title="Editar">✏️</button>
                    <button class="delete" title="Eliminar">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData();
        const imageFile = document.getElementById('image').files[0];

        if (imageFile) {
            formData.append('image', imageFile);
            try {
                const imageUrl = await this.uploadImage(formData);
                this.saveProject(imageUrl);
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        } else {
            this.saveProject();
        }
    }

    async uploadImage(formData) {
        document.getElementById('loading').style.display = 'flex';
        try {
            const response = await fetch('php/upload.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            return data.url;
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }

    saveProject(imageUrl = '') {
        const project = {
            id: document.getElementById('projectId').value || Date.now().toString(),
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            image: imageUrl,
            timestamp: Date.now()
        };

        // Actualizar o agregar proyecto
        const index = this.projects.findIndex(p => p.id === project.id);
        if (index > -1) {
            this.projects[index] = project;
        } else {
            this.projects.push(project);
        }

        localStorage.setItem('projects', JSON.stringify(this.projects));
        this.renderProjects();
        this.form.reset();
    }

    // Métodos restantes para editar, eliminar, limpiar, tema...
}

new ProjectGallery();