import { Task } from "./task";

const addProjectBtn = document.querySelector(".add-project-btn");
const submitProjectBtn = document.querySelector(".submit-project-btn");
const projectsContainer = document.querySelector(".sidebar-content");
const projectsModal = document.querySelector(".new-project-dialog");
const closeProjectsModalBtn = document.querySelector(".close-project-dialog-btn");
const mainPage = document.querySelector("")

const projectsLibrary = [];

class Project {
    constructor(name) {
        this.name = name;
        this.tasksContainer = [];
    }

    addTask(task) {
        this.tasksContainer.push(task);
    }
}

function createProject(project) {
    const projectDiv = document.createElement("div");
    projectDiv.classList.add("project-container");
    
    const projectTitle = document.createElement("h2");
    projectTitle.textContent = project.name;
    
    projectDiv.appendChild(projectTitle);
    projectsContainer.appendChild(projectDiv);
}

function addProjectToSidebar(project) {
    projectsLibrary.push(project);
    createProject(project);
}

function displayProjectTasks(project) {
    mainPage.innerHTML = "";

    const projectTitle = document.createElement("h2");
    projectTitle.textContent = `${project.name}'s Tasks`;
    mainPage.appendChild(projectTitle);

    project.tasksContainer.forEach((task, index) => {
        const taskDiv = document.createElement("div");
        taskDiv.classList.add("task");
        
        const taskTitle = document.createElement("p");
        taskTitle.textContent = `Task ${index + 1}: ${task.title}`;
    });
}

//event listeners

submitProjectBtn.addEventListener("click", () => {
    const projectName = document.querySelector("#projectName").value;

    const project = new Project(projectName);
    addProjectToSidebar(project);
});

addProjectBtn.addEventListener("click", () => projectsModal.showModal());

closeProjectsModalBtn.addEventListener("click", () => projectsModal.close());

window.addEventListener('click', function(event) {
    if (event.target == projectsModal) {
      projectsModal.close();
    }
});