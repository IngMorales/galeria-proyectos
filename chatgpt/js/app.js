const form = document.getElementById('project-form');
const gallery = document.getElementById('gallery');
const clearAllBtn = document.getElementById('clear-all');
const toggleTheme = document.getElementById('toggle-theme');

let projects = JSON.parse(localStorage.getItem('projects')) || [];

function saveProjects() {
    localStorage.setItem('projects', JSON.stringify(projects));
}

function renderProjects() {
    gallery.innerHTML = '';
    projects.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
      <img src="${project.image || 'assets/placeholder.png'}" alt="Imagen Proyecto">
      <div class="card-content">
        <h3>${project.title}</h3>
        <p>${project.description}</p>
      </div>
      <div class="actions">
        <button onclick="editProject(${index})" title="Editar">✏️</button>
        <button onclick="deleteProject(${index})" title="Eliminar">🗑️</button>
      </div>
    `;
        gallery.appendChild(card);
    });
}

function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    return fetch('php/upload.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => data.url)
        .catch(() => 'assets/placeholder.png');
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const imageFile = document.getElementById('image').files[0];

    let imageUrl = 'assets/placeholder.png';
    if (imageFile) {
        imageUrl = await uploadImage(imageFile);
    }

    projects.push({ title, description, image: imageUrl });
    saveProjects();
    renderProjects();
    form.reset();
});

function deleteProject(index) {
    if (confirm('¿Seguro que quieres eliminar este proyecto?')) {
        projects.splice(index, 1);
        saveProjects();
        renderProjects();
    }
}

function editProject(index) {
    const project = projects[index];
    document.getElementById('title').value = project.title;
    document.getElementById('description').value = project.description;
    projects.splice(index, 1);
    saveProjects();
    renderProjects();
}

clearAllBtn.addEventListener('click', () => {
    if (confirm('¿Seguro que quieres eliminar todos los proyectos?')) {
        projects = [];
        saveProjects();
        renderProjects();
    }
});

toggleTheme.addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

renderProjects();
