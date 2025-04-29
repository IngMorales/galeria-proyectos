class ProjectGallery {
    constructor() {
        this.form = document.getElementById('project-form');
        this.titleInput = document.getElementById('title');
        this.descriptionInput = document.getElementById('description');
        this.imageInput = document.getElementById('image');
        this.projectIdInput = document.getElementById('project-id');
        this.formTitle = document.getElementById('form-title');
        this.cancelEditBtn = document.getElementById('cancel-edit');
        this.gallery = document.getElementById('gallery');
        this.loading = document.getElementById('loading');
        this.clearAllBtn = document.getElementById('clear-all');
        this.toggleThemeBtn = document.getElementById('toggle-theme');
        this.projects = JSON.parse(localStorage.getItem('projects')) || [];
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.cancelEditBtn.addEventListener('click', () => this.resetForm());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
        this.toggleThemeBtn.addEventListener('click', () => this.toggleTheme());
        this.renderProjects();
        this.loadTheme();
    }

    validateForm() {
        if (!this.titleInput.value.trim()) {
            alert('El título es requerido');
            return false;
        }
        if (!this.descriptionInput.value.trim()) {
            alert('La descripción es requerida');
            return false;
        }
        return true;
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (!this.validateForm()) return;

        this.loading.classList.remove('hidden');
        const formData = new FormData();
        formData.append('image', this.imageInput.files[0] || '');

        let imageUrl = '';
        if (this.imageInput.files[0]) {
            try {
                const response = await fetch('php/upload.php', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (result.success) {
                    imageUrl = result.url;
                } else {
                    alert('Error al subir la imagen: ' + result.message);
                    this.loading.classList.add('hidden');
                    return;
                }
            } catch (error) {
                alert('Error al subir la imagen');
                this.loading.classList.add('hidden');
                return;
            }
        }

        const project = {
            id: this.projectIdInput.value || Date.now().toString(),
            title: this.titleInput.value,
            description: this.descriptionInput.value,
            image: imageUrl
        };

        if (this.projectIdInput.value) {
            const index = this.projects.findIndex(p => p.id === this.projectIdInput.value);
            this.projects[index] = project;
        } else {
            this.projects.push(project);
        }

        localStorage.setItem('projects', JSON.stringify(this.projects));
        this.resetForm();
        this.renderProjects();
        this.loading.classList.add('hidden');
    }

    renderProjects() {
        this.gallery.innerHTML = '';
        this.projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${project.image || 'https://via.placeholder.com/300x150'}" alt="${project.title}">
                <div class="card-content">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                </div>
                <div class="card-actions">
                    <button class="edit-btn tooltip" data-tooltip="Editar" data-id="${project.id}">✏️</button>
                    <button class="delete-btn tooltip" data-tooltip="Eliminar" data-id="${project.id}">🗑️</button>
                </div>
            `;
            this.gallery.appendChild(card);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editProject(btn.dataset.id));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteProject(btn.dataset.id));
        });
    }

    editProject(id) {
        const project = this.projects.find(p => p.id === id);
        if (project) {
            this.projectIdInput.value = project.id;
            this.titleInput.value = project.title;
            this.descriptionInput.value = project.description;
            this.formTitle.textContent = 'Editar Proyecto';
            this.cancelEditBtn.style.display = 'inline-block';
        }
    }

    deleteProject(id) {
        if (confirm('¿Seguro que quieres eliminar este proyecto?')) {
            this.projects = this.projects.filter(p => p.id !== id);
            localStorage.setItem('projects', JSON.stringify(this.projects));
            this.renderProjects();
        }
    }

    resetForm() {
        this.form.reset();
        this.projectIdInput.value = '';
        this.formTitle.textContent = 'Agregar Proyecto';
        this.cancelEditBtn.style.display = 'none';
    }

    clearAll() {
        if (confirm('¿Seguro que quieres limpiar todos los proyectos?')) {
            this.projects = [];
            localStorage.removeItem('projects');
            this.renderProjects();
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        this.toggleThemeBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    }

    loadTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        document.body.classList.add(theme + '-mode');
        this.toggleThemeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

document.addEventListener('DOMContentLoaded', () => new ProjectGallery());