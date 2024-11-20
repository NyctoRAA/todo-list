import { createProject } from "./project";
import { createTask } from "./task";
import trashIconSvg from "./images/trash-icon.svg";
import editIconSvg from "./images/edit-icon.svg";
import { format, isTomorrow, isYesterday, isToday, differenceInDays } from 'date-fns';
import { description } from "commander";

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

function saveToLocalStorage() {
    const dataToSave = projectsLibrary.map((project) => ({
        name: project.name,
        tasksContainer: project.tasksContainer.map((task) => ({
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate
        })),
    }));

    localStorage.setItem('projectsLibrary', JSON.stringify(dataToSave));    
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem("projectsLibrary");
    if(savedData) {
        const parsedData = JSON.parse(savedData);
        projectsLibrary.length = 0; // Cleans the array without losing it's reference;
        parsedData.forEach((projectData) => {
            const project = createProject(projectData.name);
            project.tasksContainer = project.tasksContainer.map((task) => createTask(task.title, task.description, task.priority, task.dueDate));
            projectsLibrary.push(project);
        });
    }
};

// Load the data form the localStorage when starting
loadFromLocalStorage();
projectsLibrary.forEach((project) => createProjectUI(project));


function createProjectUI(project) {
    const projectDiv = document.createElement("div");
    projectDiv.classList.add("project-container");
    
    const projectTitle = document.createElement("h2");
    projectTitle.textContent = project.name;

    projectDiv.appendChild(projectTitle);

    // Buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("project-buttons-container");
    
    // Delete button
    const deleteProjectBtn = document.createElement("button");
    deleteProjectBtn.classList.add("delete-project-btn");
    
    const trashIcon = document.createElement("img");
    trashIcon.src = trashIconSvg;
    trashIcon.alt = "Delete Project";
    trashIcon.width = 30;
    trashIcon.height = 30;
    trashIcon.classList.add("trash-icon");

    deleteProjectBtn.appendChild(trashIcon);
    buttonsContainer.appendChild(deleteProjectBtn);
    
    deleteProjectBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteProject(project, projectDiv);
    });

    // Edit button
    const editProjectBtn = document.createElement("button");
    editProjectBtn.classList.add("edit-project-btn");

    const editIcon = document.createElement("img");
    editIcon.classList.add("edit-icon");
    editIcon.src = editIconSvg;
    editIcon.alt = "Edit Project";
    editIcon.width = 30;
    editIcon.height = 30;

    editProjectBtn.appendChild(editIcon);
    buttonsContainer.appendChild(editProjectBtn);

    editProjectBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openTaskModalForProject(project);
    })

    projectDiv.appendChild(buttonsContainer);
    projectsContainer.appendChild(projectDiv);

    projectDiv.addEventListener("click", () => {
        if(projectsLibrary.includes(project)) {
            displayProjectTasks(project);
        }
    });
}

function deleteProject(project, projectDiv) {
    const projectIndex = projectsLibrary.indexOf(project);
    if (projectIndex > -1) {
        projectsLibrary.splice(projectIndex, 1);
    }

    projectsContainer.removeChild(projectDiv);

    if (currentProject === project) {
        currentProject = null;
        mainPage.innerHTML = ""; 
    }

    saveToLocalStorage();
}

function openTaskModalForProject(project) {
    currentProject = project;
    newTaskDialog.showModal();
}

function addProjectToSidebar(project) {
    projectsLibrary.push(project);
    createProjectUI(project);
    saveToLocalStorage();
}

function formatDueDate(date) {
    const taskDate = new Date(date);
    
    if(isToday(taskDate)) {
        return "Today";
    } else if(isTomorrow(taskDate)) {
        return "Tomorrow";
    } else if(isYesterday(taskDate)) {
        return "Yesterday";
    };

    const daysDifference = differenceInDays(taskDate, new Date());
    if(daysDifference > 0) {
        return `In ${daysDifference} days.`;
    } else if (daysDifference < 0) {
        `${Math.abs(daysDifference)} days ago.`;
    }

    return format(taskDate, 'EEE MMM dd yyyy');
}

function displayProjectTasks(project) {
    if (!project) {
        console.error("Project not found or undefined!");
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
        taskDueDate.textContent = `Due Date: ${formatDueDate(task.dueDate)}`;
        taskDiv.appendChild(taskDueDate);

        // Buttons container
        const buttonsContainer = document.createElement("div");
        buttonsContainer.classList.add("task-buttons-container");

        // Delete task button
        const deleteTaskBtn = document.createElement("button");
        deleteTaskBtn.classList.add("delete-task-btn");

        const trashIcon = document.createElement("img");
        trashIcon.classList.add("trash-icon");
        trashIcon.src = trashIconSvg;
        trashIcon.alt = "Delete task";
        trashIcon.width = 30;
        trashIcon.height = 30;

        deleteTaskBtn.appendChild(trashIcon);
        buttonsContainer.appendChild(deleteTaskBtn);

        deleteTaskBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            project.tasksContainer.splice(index, 1);
            saveToLocalStorage();
            displayProjectTasks(project);
        });
        
        // Edit task button
        const editTaskBtn = document.createElement("button");
        editTaskBtn.classList.add("edit-task-btn");

        const editIcon = document.createElement("img");
        editIcon.classList.add("edit-icon");
        editIcon.src = editIconSvg;
        editIcon.alt = "Edit task";
        editIcon.width = 30;
        editIcon.height = 30;

        editTaskBtn.appendChild(editIcon);
        buttonsContainer.appendChild(editTaskBtn);

        editTaskBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openEditTaskModal(task, project);
        });

        taskDiv.appendChild(buttonsContainer);
        mainPage.appendChild(taskDiv);
    });

    

    // Add task button
    const addTaskBtn = document.createElement("button");
    addTaskBtn.textContent = "Add Task";
    addTaskBtn.classList.add("add-task-btn");

    addTaskBtn.addEventListener("click", () => openTaskModalForProject(project));

    mainPage.appendChild(addTaskBtn);
};

function openEditTaskModal(task, project) {
    const taskTitleInput = document.querySelector("#taskTitle");
    const taskDescriptionInput = document.querySelector("#taskDescription");
    const taskPriorityInput = document.querySelector("#taskPriority");
    const taskDueDateInput = document.querySelector("#dueDate");

    taskTitleInput.value = task.title;
    taskDescriptionInput.value = task.description;
    taskPriorityInput.value = task.priority;
    taskDueDateInput.value = task.dueDate;

    newTaskDialog.showModal();

    submitTaskBtn.textContent = "Save Changes";

    submitTaskBtn.replaceWith(submitTaskBtn.cloneNode(true));
    const newTaskSubmitBtn = document.querySelector(".submit-task-btn");

    newTaskSubmitBtn.addEventListener("click", () => {
        task.title = taskTitleInput.value;
        task.description = taskDescriptionInput.value;
        task.priority = taskPriorityInput.value;
        task.dueDate = taskDueDateInput.value;

        displayProjectTasks(project);
        newTaskDialog.close();

        newTaskSubmitBtn.textContent = "Add task";
        newTaskSubmitBtn.addEventListener("click", addTaskHandler);
    });
}

function addTaskHandler() {
    const taskTitle = document.querySelector("#taskTitle").value;
    const taskDescription = document.querySelector("#taskDescription").value;
    const taskPriority = document.querySelector("#taskPriority").value;
    const taskDueDate = document.querySelector("#dueDate").value;

    if(currentProject) {
        const task = createTask(taskTitle, taskDescription, taskPriority, taskDueDate);
        currentProject.addTask(task);
        saveToLocalStorage();
    };

    displayProjectTasks(currentProject);
    newTaskDialog.close();
}

//event listeners

submitProjectBtn.addEventListener("click", () => {
    const projectName = document.querySelector("#projectName").value;
    const project = createProject(projectName);

    addProjectToSidebar(project);
    saveToLocalStorage();

    newProjectDialog.close();
});

submitTaskBtn.addEventListener("click", addTaskHandler);

// Show & close modals listeners
addProjectBtn.addEventListener("click", () => newProjectDialog.showModal());
closeProjectsModalBtn.addEventListener("click", () => newProjectDialog.close());
closeTasksModalBtn.addEventListener("click", () => newTaskDialog.close());

// Close modals on outside click
window.addEventListener('click', function(event) {
    if (event.target == newProjectDialog) newProjectDialog.close();
    if (event.target == newTaskDialog) newTaskDialog.close();
});
