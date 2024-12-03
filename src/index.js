import "./styles.css";
import { createProject } from "./project";
import { createTask } from "./task";
// import { saveToLocalStorage, loadFromLocalStorage } from "./storage";
import trashIconSvg from "./images/trash-icon.svg";
import editIconSvg from "./images/edit-icon.svg";
import { format, isTomorrow, isYesterday, isToday, differenceInDays } from 'date-fns';

const addProjectBtn = document.querySelector(".add-project-btn");
const submitTaskBtn = document.querySelector(".submit-task-btn");
const closeTasksModalBtn = document.querySelector(".close-task-dialog-btn");

const tasksContainerDiv = document.querySelector(".tasks-container");
const projectsContainer = document.querySelector(".sidebar-content");
const newTaskDialog = document.querySelector(".new-task-dialog");
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
            dueDate: task.dueDate,
            completed: task.completed,
        })),
    }));

    localStorage.setItem('projectsLibrary', JSON.stringify(dataToSave));    
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem("projectsLibrary");
        if (savedData) {
            const parsedData = JSON.parse(savedData);

            // Verifies if its an array before moving on
            if (!Array.isArray(parsedData)) {
                console.warn("Data in localStorage is not in expected format. Resetting...");
                return;
            }

            projectsLibrary.length = 0; // Cleans the array without losing it's reference

            parsedData.forEach((projectData) => {
                // Verifies the basic estructure of each project
                if (!projectData.name || !Array.isArray(projectData.tasksContainer)) {
                    console.warn("Project data is invalid. Skipping...");
                    return;
                }

                const project = createProject(projectData.name);

                // Filtrates valid tasks
                project.tasksContainer = projectData.tasksContainer
                    .filter((task) => task.dueDate && !isNaN(new Date(task.dueDate)))
                    .map((task) => {
                        const restoredTask = createTask(task.title, task.description, task.priority, task.dueDate);
                        restoredTask.completed = !!task.completed;
                        return restoredTask;
                    });

                projectsLibrary.push(project);
            });
        }
    } catch (error) {
        console.error("Error loading data from localStorage:", error);
    }
}


// Load the data form the localStorage when starting
loadFromLocalStorage();
projectsLibrary.forEach((project) => createProjectUI(project));

function showDeleteModal(context, onConfirmCallback) {
    const deleteModal = document.querySelector(".delete-confirmation-modal");
    const confirmBtn = document.querySelector("#confirm-delete-btn");
    const cancelBtn = document.querySelector("#cancel-delete-btn");
    const dontAskAgainCheckbox = document.querySelector("#dont-ask-again");
    const deleteMessage = document.querySelector("#delete-modal-message");

    dontAskAgainCheckbox.unchecked;

    const isTask = context === "task";
    const localStorageKey = isTask 
        ? "dontAskDeleteModalTask" 
        : "dontAskDeleteModalProject";

    deleteMessage.textContent = isTask
        ? "Are you sure you want to delete this task?"
        : "Are you sure you want to delete this project?";

    if(localStorage.getItem(localStorageKey) === "true") {
        onConfirmCallback();
        return;
    };

    deleteModal.classList.remove("hidden");

    confirmBtn.onclick = () => {
        if(dontAskAgainCheckbox.checked) {
            localStorage.setItem(localStorageKey, "true");
        }
        onConfirmCallback();
        deleteModal.classList.add("hidden");
    };

    cancelBtn.onclick = () => {
        deleteModal.classList.add("hidden");
    };
}

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
        showDeleteModal("project", () => {
            deleteProject(project, projectDiv);
        }); 
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
        editProjectHandler(project, projectDiv);
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
        tasksContainerDiv.innerHTML = "";
    }

    saveToLocalStorage();
}

function addProjectToSidebar(project) {
    projectsLibrary.push(project);
    createProjectUI(project);
    saveToLocalStorage();
}

function formatDueDate(date) {
    if(!date || isNaN(new Date(date))) {
        return "No due date.";
    }

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
    tasksContainerDiv.innerHTML = "";

    const projectTitle = document.createElement("h2");
    projectTitle.textContent = `${project.name}'s Tasks`;
    mainPage.appendChild(projectTitle);

    project.tasksContainer.forEach((task) => {
        const taskDiv = document.createElement("div");
        taskDiv.classList.add("task");
        
        const taskTitle = document.createElement("p");
        taskTitle.classList.add("taskTitle");
        taskTitle.textContent = task.title;
        taskDiv.appendChild(taskTitle);

        const taskDescription = document.createElement("p");
        taskDescription.classList.add("taskDescription");
        taskDescription.textContent = task.description;
        taskDiv.appendChild(taskDescription);

        const taskPriority = document.createElement("p");
        taskPriority.classList.add("taskPriority");
        if(task.priority == "High") {
            taskPriority.style.backgroundColor = "Salmon";
            taskPriority.style.color = "Black";
        }
        taskPriority.style.backgroundColor = "#FFD85F";   
        taskPriority.style.color = "Black";
        taskPriority.textContent = task.priority;
        taskDiv.appendChild(taskPriority);


        const taskDueDate = document.createElement("p");
        taskDueDate.classList.add("taskDueDate");
        taskDueDate.textContent = `${formatDueDate(task.dueDate)}`;
        taskDiv.appendChild(taskDueDate);

        const taskStatusCheckBox = document.createElement("input");
        taskStatusCheckBox.classList.add("taskCheckBox");
        taskStatusCheckBox.type = "checkbox";
        taskStatusCheckBox.checked = task.completed;

        const statusSpan = document.createElement("span");
        statusSpan.classList.add("status-span");
        if(task.completed) {
            taskDiv.classList.add("completed");
            statusSpan.textContent = "Done ✔";
            statusSpan.style.color = "green";
            taskDiv.appendChild(statusSpan);

            taskDiv.querySelectorAll("p, .task-buttons-container").forEach((child) => {
                child.style.pointerEvents = "none";
            });

            taskStatusCheckBox.style.pointerEvents = "auto";
        } else {
            taskDiv.classList.remove("completed");
            statusSpan.textContent = "";
            taskDiv.querySelectorAll("p, .task-buttons-container").forEach((child) => {
                child.style.pointerEvents = "auto";
            })
        }

        taskStatusCheckBox.addEventListener("change", () => {
            task.toggleComplete();
            saveToLocalStorage();
            displayProjectTasks(project);
        });

        taskDiv.appendChild(taskStatusCheckBox);

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
            showDeleteModal("task", () => {
                deleteTask(project, task);
            });
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
        tasksContainerDiv.appendChild(taskDiv);
        mainPage.appendChild(tasksContainerDiv);
    });

    

    // Add task button
    const addTaskBtn = document.createElement("button");
    addTaskBtn.textContent = "+";
    addTaskBtn.classList.add("add-task-btn");

    addTaskBtn.addEventListener("click", () => openTaskModalForProject(project));

    mainPage.appendChild(addTaskBtn);
};

function deleteTask(project, task) {
    const taskIndex = project.tasksContainer.indexOf(task);

    if(taskIndex > -1 && taskIndex < project.tasksContainer.length) {
        project.tasksContainer.splice(taskIndex, 1)
        saveToLocalStorage();
        displayProjectTasks(project);
    } else {
        console.error("Task not found in the tasksContainer.");
    }
}

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

        newTaskSubmitBtn.textContent = "Add Task";
        newTaskSubmitBtn.addEventListener("click", addTaskHandler);
    });
}

function addTaskHandler(event) {
    event.preventDefault();

    const form = document.querySelector(".add-task-form");
    if(!form.checkValidity()) {
        form.reportValidity();
        return;
    };

    const taskTitle = document.querySelector("#taskTitle").value;
    const taskDescription = document.querySelector("#taskDescription").value;
    const taskPriority = document.querySelector("#taskPriority").value;
    const taskDueDate = document.querySelector("#dueDate").value;

    if(currentProject) {
        const task = createTask(taskTitle, taskDescription, taskPriority, taskDueDate);
        currentProject.addTask(task);
        console.log("Task created:", task);
        console.log("Tasks in current project:", currentProject.tasksContainer);
        saveToLocalStorage();
    };

    displayProjectTasks(currentProject);
    newTaskDialog.close();
};

function addProjectHandler() { 
    if(document.querySelector(".projectName-input")) return;

    const inputContainer = document.createElement("div");
    inputContainer.classList.add("project-input-container");

    const input = document.createElement("input");
    input.type = "text";
    input.required = true;
    input.placeholder = "Project Name...";
    input.classList.add("projectName-input");

    const submitButton = document.createElement("button");
    submitButton.textContent = "->";
    submitButton.classList.add("submit-project-btn");

    inputContainer.appendChild(input);
    inputContainer.appendChild(submitButton);
    projectsContainer.appendChild(inputContainer);

    input.focus();

    input.addEventListener("keydown", (e) => {
        if(e.key === "Enter") {
            saveNewProject(input, inputContainer);
        }
    });

    submitButton.addEventListener("click", () => {
        saveNewProject(input, inputContainer);
    })
}

function editProjectHandler(project, projectDiv) {
    const projectTitle = projectDiv.querySelector("h2");

    const input = document.createElement("input");
    input.type = "text";
    input.required = true;
    input.value = project.name;
    input.classList.add("projectName-input");

    const submitButton = document.createElement("button");
    submitButton.textContent = "->";
    submitButton.classList.add("submit-project-btn");

    projectDiv.replaceChild(input, projectTitle);
    projectDiv.appendChild(submitButton);

    input.focus();

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            saveProjectEdit(input, project, projectDiv);
        }
    });

    submitButton.addEventListener("click", () => {
        saveProjectEdit(input, project, projectDiv);
    })
}

function saveProjectEdit(input, project, projectDiv) {
    const newName = input.value.trim();
    const submitBtn = document.querySelector(".submit-project-btn");
    if(newName) {
        project.name = newName;
        saveToLocalStorage();

        const projectTitle = document.createElement("h2");
        projectTitle.textContent = newName;
        projectDiv.replaceChild(projectTitle, input);
    } else {
        const projectTitle = document.createElement("h2");
        projectTitle.textContent = project.name;
        projectDiv.replaceChild(projectTitle, input);
    }

    submitBtn.remove();
}

function saveNewProject(input) {
    const projectName = input.value.trim();
    const submitBtn = document.querySelector(".submit-project-btn");
    if(projectName) {
        const newProject = createProject(projectName);
        addProjectToSidebar(newProject);
        saveToLocalStorage();
    }

    input.remove();
    submitBtn.remove();

}

//event listeners

submitTaskBtn.addEventListener("click", addTaskHandler);

// Show & close modals listeners
addProjectBtn.addEventListener("click", addProjectHandler);
closeTasksModalBtn.addEventListener("click", () => newTaskDialog.close());

window.addEventListener('click', function(event) {
    // Verifica se clicou fora do campo de criação de novo projeto
    const projectInput = document.querySelector(".projectName-input");
    if (projectInput && !projectInput.contains(event.target) && event.target !== addProjectBtn) {
        projectInput.remove();
    }

    // Verifica se clicou fora do campo de edição do projeto
    const projectEditInput = document.querySelector(".project-input");
    if (projectEditInput && !projectEditInput.contains(event.target)) {
        const projectDiv = projectEditInput.closest(".project-container");
        const projectTitle = document.createElement("h2");
        projectTitle.textContent = projectEditInput.value || projectEditInput.defaultValue;
        projectDiv.replaceChild(projectTitle, projectEditInput);
    }

    // Fecha o modal de tarefa se o clique for fora do modal
    if (event.target === newTaskDialog) {
        newTaskDialog.close();
    }
});

