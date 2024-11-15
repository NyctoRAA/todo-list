import { createProject } from "./project";
import { createTask } from "./task";

const addProjectBtn = document.querySelector(".add-project-btn");
const submitProjectBtn = document.querySelector(".submit-project-btn");
const closeProjectsModalBtn = document.querySelector(".close-project-dialog-btn");
const projectsContainer = document.querySelector(".sidebar-content");
const newProjectDialog = document.querySelector(".new-project-dialog");
const newTaskDialog = document.querySelector(".new-task-dialog");
const submitTaskBtn = document.querySelector(".submit-task-btn");
const closeTasksModalBtn = document.querySelector(".close-task-dialog-btn");
const mainPage = document.querySelector(".content");

const projectsLibrary = [];
let currentProject = null;

function createProjectUI(project) {
    const projectDiv = document.createElement("div");
    projectDiv.classList.add("project-container");
    
    const projectTitle = document.createElement("h2");
    projectTitle.textContent = project.name;

    projectDiv.appendChild(projectTitle);
    
    const deleteProjectBtn = document.createElement("button");
    deleteProjectBtn.classList.add("delete-project-btn");
    
    const trashIcon = document.createElement("img");
    trashIcon.width = 30;
    trashIcon.height = 30;
    trashIcon.src = "path/to/trash-icon.png";
    trashIcon.alt = "Delete Project";
    trashIcon.classList.add("trash-icon");
    
    deleteProjectBtn.appendChild(trashIcon);
    projectDiv.appendChild(deleteProjectBtn);
    
    deleteProjectBtn.addEventListener("click", () => deleteProject(project, projectDiv));

    projectsContainer.appendChild(projectDiv);

    projectDiv.addEventListener("click", () => displayProjectTasks(project));
}

function deleteProject(project, projectDiv) {
    const porjectIndex = projectsLibrary.indexOf(project);
    if(porjectIndex > -1) {
        projectsLibrary.splice(porjectIndex, 1);
    }

    projectsContainer.removeChild(projectDiv);

    if(currentProject === project) {
        mainPage.innerHTML = "";
        currentProject = null;
    }
}

function openTaskModalForProject(project) {
    currentProject = project;
    newTaskDialog.showModal();
}

function addProjectToSidebar(project) {
    projectsLibrary.push(project);
    createProjectUI(project);
}

function displayProjectTasks(project) {
    if (!project) {
        console.error("Projeto não encontrado ou indefinido!");
        return;
    }

    currentProject = project;

    mainPage.innerHTML = "";

    const projectTitle = document.createElement("h2");
    projectTitle.textContent = `${project.name}'s Tasks`;
    mainPage.appendChild(projectTitle);

    project.tasksContainer.forEach((task, index) => {
        const taskDiv = document.createElement("div");
        taskDiv.classList.add("task");
        
        const taskTitle = document.createElement("p");
        taskTitle.textContent = `Task ${index + 1}: ${task.title}`;
        taskDiv.appendChild(taskTitle);

        const taskDescription = document.createElement("p");
        taskDescription.textContent = task.description;
        taskDiv.appendChild(taskDescription);

        const taskPriority = document.createElement("p");
        taskPriority.textContent = task.priority;
        taskDiv.appendChild(taskPriority);

        const taskDueDate = document.createElement("p");
        taskDueDate.textContent = task.dueDate;
        taskDiv.appendChild(taskDueDate);

        mainPage.appendChild(taskDiv);
    });
 
    const addTaskBtn = document.createElement("button");
    addTaskBtn.textContent = "Add Task";
    addTaskBtn.classList.add("add-task-btn");

    addTaskBtn.addEventListener("click", () => openTaskModalForProject(project));

    mainPage.appendChild(addTaskBtn);
};

//event listeners

submitProjectBtn.addEventListener("click", () => {
    const projectName = document.querySelector("#projectName").value;
    const project = createProject(projectName);

    addProjectToSidebar(project);

    newProjectDialog.close();
});

submitTaskBtn.addEventListener("click", () => {
    const taskTitle = document.querySelector("#taskTitle").value;
    const taskDescription = document.querySelector("#taskDescription").value;
    const taskPriority = document.querySelector("#taskPriority").value;
    const taskDueDate = document.querySelector("#dueDate").value;

    if(currentProject) {
        const task = createTask(taskTitle, taskDescription, taskPriority, taskDueDate);
        currentProject.addTask(task);
    }

    displayProjectTasks(currentProject);
    newTaskDialog.close();
});

addProjectBtn.addEventListener("click", () => newProjectDialog.showModal());
closeProjectsModalBtn.addEventListener("click", () => newProjectDialog.close());
closeTasksModalBtn.addEventListener("click", () => newTaskDialog.close());

// Close modals on outside click
window.addEventListener('click', function(event) {
    if (event.target == newProjectDialog) newProjectDialog.close();
    if (event.target == newTaskDialog) newTaskDialog.close();
});
