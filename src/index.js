import "./styles.css";
import { createProject } from "./project";
import { createTask } from "./task";
// import { saveToLocalStorage, loadFromLocalStorage } from "./storage";
import trashIconSvg from "./images/trash-icon.svg";
import editIconSvg from "./images/edit-icon.svg";
import { format, isTomorrow, isToday, differenceInDays } from 'date-fns';

const addProjectBtn = document.querySelector(".add-project-btn");
const submitProjectBtn = document.querySelector(".submit-project-btn");
const submitTaskBtn = document.querySelector(".submit-task-btn");
const closeProjectsModalBtn = document.querySelector(".close-project-dialog-btn");
const closeTasksModalBtn = document.querySelector(".close-task-dialog-btn");

const tasksContainerDiv = document.querySelector(".tasks-container");
const projectsContainer = document.querySelector(".projects-container");
const newProjectDialog = document.querySelector(".new-project-dialog");
const newTaskDialog = document.querySelector(".new-task-dialog");
const mainPage = document.querySelector(".content");

const projectsLibrary = [];
let currentProject = null;

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem("projectsLibrary");
        if (savedData) {
            const parsedData = JSON.parse(savedData);

            if (!Array.isArray(parsedData)) {
                console.warn("Data in localStorage is not in the expected format. Resetting...");
                return;
            }

            projectsLibrary.length = 0;

            parsedData.forEach((projectData) => {
                if (!projectData.name || !Array.isArray(projectData.tasksContainer)) {
                    console.warn("Project data is invalid. Skipping...");
                    return;
                }

                const project = createProject(projectData.name);

                project.tasksContainer = projectData.tasksContainer
                    .filter((task) => task.title && task.priority)
                    .map((task) => {
                        const restoredTask = createTask(
                            task.title, 
                            task.description || "", 
                            task.projectName || project.name,
                            task.priority, 
                            task.dueDate || ""
                        );
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

function saveToLocalStorage() {
    const dataToSave = projectsLibrary.map((project) => ({
        name: project.name,
        tasksContainer: project.tasksContainer.map((task) => ({
            title: task.title,
            description: task.description || "",
            projectName: task.projectName || project.name,
            priority: task.priority,
            dueDate: task.dueDate || "", 
            completed: !!task.completed,
        })),
    }));

    localStorage.setItem('projectsLibrary', JSON.stringify(dataToSave));
};

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
        positionModal(editProjectBtn, newProjectDialog);
        openEditProjectModal(project);
    })

    projectDiv.appendChild(buttonsContainer);
    projectsContainer.appendChild(projectDiv);

    projectDiv.addEventListener("click", () => {
        if(projectsLibrary.includes(project)) {
            displayProjectTasks(project);
        }
    });
}

function openEditProjectModal(project) {
    const projectTitleInput = document.querySelector("#projectName");

    projectTitleInput.value = project.name;

    const projectModalTitle = document.querySelector(".project-modal-title");
    projectModalTitle.textContent = "Edit Project";

    newProjectDialog.showModal();

    projectTitleInput.focus();
    projectTitleInput.select();

    submitProjectBtn.textContent = "Save Changes";

    const existingSubmitBtn = document.querySelector(".submit-project-btn");
    existingSubmitBtn.replaceWith(existingSubmitBtn.cloneNode(true)); 
    const newProjectSubmitBtn = document.querySelector(".submit-project-btn");

    newProjectSubmitBtn.addEventListener("click", () => {
        const updatedName = projectTitleInput.value.trim();
        if (updatedName) {
            project.name = updatedName;

            project.tasksContainer.forEach((task) => {
                task.projectName.value = updatedName;
            });

            projectsContainer.innerHTML = "";
            projectsLibrary.forEach((proj) => createProjectUI(proj));

            saveToLocalStorage();
        }

        newProjectDialog.close();
    });
};

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
};

function openCreateProjectModal() {
    const projectTitle = document.querySelector("#projectName");
    projectTitle.value = "";

    const projectModalTitle = document.querySelector(".project-modal-title");
    projectModalTitle.textContent = "New Project";

    if (newProjectDialog.hasAttribute("open")) {
        newProjectDialog.close(); 
    } else {
        newProjectDialog.showModal(); 
        projectTitle.focus();
    };
};

function addProjectToSidebar(project) {
    projectsLibrary.push(project);
    createProjectUI(project);
    saveToLocalStorage();
}

function formatDueDate(date) {
    if(!date || isNaN(new Date(date))) {
        return "No due date";
    }

    const taskDate = new Date(date);
    const daysDifference = differenceInDays(taskDate, new Date());
    
    if(isToday(taskDate)) {
        return "Today";
    } else if(isTomorrow(taskDate)) {
        return "Tomorrow";
    };

    const weeksDifference = Math.floor(daysDifference / 7);
    const monthsDifference = Math.floor(daysDifference / 30);
    const yearsDifference = Math.floor(daysDifference / 365);

    if (daysDifference < 0) {
        return "Expired";
    };

    if(daysDifference > 0) {
        if (yearsDifference >= 2) {
            return `In ${yearsDifference} years`;
        } else if (yearsDifference === 1) {
            return "In 1 year";
        } else if (monthsDifference >= 2) {
            return `In ${monthsDifference} months`;
        } else if (monthsDifference === 1) {
            return "In 1 month";
        } else if (weeksDifference >= 2) {
            return `In ${weeksDifference} weeks`;
        } else if (weeksDifference === 1) {
            return "In 1 week";
        } else {
            return `In ${daysDifference} days`;
        }
    };

    return format(taskDate, 'MMM dd yyyy');
};

function reevaluateTaskDueDates(tasks) {
    tasks.forEach((task) => {
        task.formattedDueDate = formatDueDate(task.dueDate); // Atualiza a formatação
    });
};

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

    const existingAddTaskBtn = document.querySelector(".add-task-btn");
    if (existingAddTaskBtn) {
        existingAddTaskBtn.remove();
    };

    project.tasksContainer.forEach((task) => {
        const taskDiv = document.createElement("div");
        taskDiv.classList.add("task");

        const taskStatuses = document.createElement("div");
        taskStatuses.classList.add("task-statuses");
        
        const taskTitle = document.createElement("p");
        taskTitle.classList.add("taskTitle");
        taskTitle.textContent = task.title;

        const taskDescription = document.createElement("p");
        taskDescription.classList.add("taskDescription");
        taskDescription.textContent = task.description;

        const taskProject = document.createElement("p");
        taskProject.classList.add("taskProject");
        taskProject.textContent = task.projectName;

        const taskPriority = document.createElement("p");
        taskPriority.classList.add("taskPriority");
        if(task.priority == "High") {
            taskPriority.style.backgroundColor = "Salmon";
            taskPriority.style.color = "Black";
        } else if(task.priority == "Medium") {
            taskPriority.style.backgroundColor = "Orange";
        } else {
            taskPriority.style.backgroundColor = "#FFD85F";   
        };
        taskPriority.style.color = "Black";
        taskPriority.textContent = task.priority;

        const taskDueDate = document.createElement("p");
        taskDueDate.classList.add("taskDueDate");
        taskDueDate.textContent = `${formatDueDate(task.dueDate)}`;
        taskDueDate.style.backgroundColor = "#E0BFFC";
        taskDueDate.style.color = "Black";

        const taskStatusCheckBox = document.createElement("input");
        taskStatusCheckBox.classList.add("taskCheckBox");
        taskStatusCheckBox.type = "checkbox";
        taskStatusCheckBox.checked = task.completed;

        const taskCompletedDiv = document.createElement("div");
        taskCompletedDiv.classList.add("task-completed-div");

        const statusSpan = document.createElement("span");
        statusSpan.classList.add("status-span");
        if(task.completed) {
            taskDiv.classList.add("completed");
            statusSpan.textContent = "Done ✔";
            statusSpan.style.color = "green";
            taskCompletedDiv.appendChild(statusSpan);

            // taskDiv.querySelectorAll("p, .task-buttons-container").forEach((child) => {
            //     child.style.pointerEvents = "none";
            // });

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
        
        taskDiv.appendChild(taskTitle);
        taskStatuses.appendChild(taskProject);
        taskStatuses.appendChild(taskPriority);
        taskStatuses.appendChild(taskDueDate);
        taskDiv.appendChild(taskStatuses);
        taskDiv.appendChild(taskDescription);
        taskCompletedDiv.prepend(taskStatusCheckBox);

        // Buttons container
        const buttonsContainer = document.createElement("div");
        buttonsContainer.classList.add("task-buttons-container");

        const editDeleteBtnsContainer = document.createElement("div");
        editDeleteBtnsContainer.classList.add("edit-delete-btns-container");

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
        editDeleteBtnsContainer.appendChild(deleteTaskBtn);

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
        editDeleteBtnsContainer.appendChild(editTaskBtn);

        editTaskBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            positionModal(editTaskBtn, newTaskDialog);
            openEditTaskModal(task, project);
        });

        buttonsContainer.prepend(taskCompletedDiv);
        buttonsContainer.appendChild(editDeleteBtnsContainer);
        taskDiv.appendChild(buttonsContainer);
        tasksContainerDiv.appendChild(taskDiv);
        mainPage.appendChild(tasksContainerDiv);
    });

    

    // Add task button
    const headerAuthorDiv = document.querySelector(".header-author");

    const addTaskBtn = document.createElement("button");
    addTaskBtn.innerHTML = 
        `<svg class="add-buttons-svg add-task-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>`;
    addTaskBtn.classList.add("add-task-btn");

    addTaskBtn.addEventListener("click", () => {
        positionModal(addTaskBtn, newTaskDialog);

        openCreateTaskModal();
    });

    headerAuthorDiv.prepend(addTaskBtn);
};

function openCreateTaskModal() {
    const taskTitleInput = document.querySelector("#taskTitle");
    const taskDescriptionInput = document.querySelector("#taskDescription");
    const taskPriorityInput = document.querySelector("#taskPriority");
    const taskDueDateInput = document.querySelector("#dueDate");

    taskTitleInput.value = "";
    taskDescriptionInput.value = "";
    taskPriorityInput.value = "Low";
    taskDueDateInput.value = "";

    const taskModalTitle = document.querySelector(".task-modal-title");
    taskModalTitle.textContent = "New Task";

    if(newTaskDialog.hasAttribute("open")) {
        newTaskDialog.close();
    } else {
        newTaskDialog.showModal();
        taskTitleInput.focus();
    }
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
    const taskModalTitle = document.querySelector(".task-modal-title");

    taskTitleInput.value = task.title;
    taskDescriptionInput.value = task.description;
    taskPriorityInput.value = task.priority;
    taskDueDateInput.value = task.dueDate;

    taskModalTitle.textContent = "Edit Task";
    
    newTaskDialog.showModal();

    taskTitleInput.focus();
    taskTitleInput.select();

    newTaskDialog.scrollIntoView({
        behavior: "smooth",
        block: "center" 
    });

    submitTaskBtn.textContent = "Save Changes";

    submitTaskBtn.replaceWith(submitTaskBtn.cloneNode(true));
    const newTaskSubmitBtn = document.querySelector(".submit-task-btn");

    newTaskSubmitBtn.addEventListener("click", () => {
        task.title = taskTitleInput.value;
        task.description = taskDescriptionInput.value;
        task.priority = taskPriorityInput.value;
        task.dueDate = taskDueDateInput.value;

        saveToLocalStorage();

        displayProjectTasks(project);
        
        newTaskSubmitBtn.textContent = "Add";

        newTaskDialog.close();
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
        console.log("Current project:", currentProject);
        console.log("Current project name:", currentProject.name);

        const task = createTask(taskTitle, taskDescription, currentProject.name, taskPriority, taskDueDate);
        currentProject.addTask(task);
        saveToLocalStorage();
    };

    displayProjectTasks(currentProject);
    newTaskDialog.close();
};

function addProjectHandler(event) {
    event.preventDefault();

    const form = document.querySelector(".add-project-form");
    if(!form.checkValidity()) {
        form.reportValidity();
        return;
    };

    const projectTitle = document.querySelector("#projectName").value;

    const project = createProject(projectTitle);
    addProjectToSidebar(project);

    saveToLocalStorage();
    newProjectDialog.close();
}

function positionModal(button, modal) {
    const buttonRect = button.getBoundingClientRect();
    const modalWidth = modal.offsetWidth || 300;
    const modalHeight = modal.offsetHeight || 200;

    let left = buttonRect.right + window.scrollX;
    let top = buttonRect.top + window.scrollY;

    if (left + modalWidth > window.innerWidth) {
        left = buttonRect.left + window.scrollX - modalWidth;
    }

    if (top + modalHeight > window.innerHeight) {
        top = buttonRect.bottom + window.scrollY - modalHeight;
    }

    if (top + modalHeight > window.innerHeight) {
        top = buttonRect.top + window.scrollY - modalHeight - 10;
    } else if (top < 0) {
        top = buttonRect.bottom + window.scrollY + 10;
    }

    modal.style.left = `${left}px`;
    modal.style.top = `${top}px`;
}

// Sort Tasks
function sortTasksByDueDate(project) {
    if (!project) {
        console.error("No project selected!");
        return;
    }

    const today = new Date();

    project.tasksContainer.sort((a, b) => {
        const getSortingValue = (dueDate) => {
            if (!dueDate || dueDate === "No due date") return Infinity; // "No due date" vai para o final

            const taskDate = new Date(dueDate);

            if (isNaN(taskDate)) return Infinity; // Se a data não for válida, trata como "No due date"
            if (taskDate < today) return Infinity + 1; // "Expired" depois de "No due date"

            return taskDate.getTime(); // Data válida: usa timestamp para ordenação
        };

        const aDueDateValue = getSortingValue(a.dueDate);
        const bDueDateValue = getSortingValue(b.dueDate);

        return aDueDateValue - bDueDateValue;
    });

    console.log("After sorting:");
    project.tasksContainer.forEach((task, index) => {
        console.log(`Task ${index + 1}:`, task.title, "Due Date:", task.dueDate);
    });

    saveToLocalStorage();
    displayProjectTasks(project);
};

function sortTasksByPriority(project) {
    if (!project) {
        console.error("No project selected!");
        return;
    }

    const priorityOrder = { high: 1, medium: 2, low: 3 };

    project.tasksContainer.sort((a, b) => {
        const priorityA = priorityOrder[a.priority?.toLowerCase()] || 4;
        const priorityB = priorityOrder[b.priority?.toLowerCase()] || 4;

        return priorityA - priorityB;
    });

    saveToLocalStorage();
};

document.querySelector(".sort-by-dueDate").addEventListener("click", () => {
    if(!currentProject) return;

    console.log("Before sort:", currentProject.tasksContainer.map((t) => t.dueDate));
    reevaluateTaskDueDates(currentProject.tasksContainer);
    sortTasksByDueDate(currentProject);
    console.log("After sort:", currentProject.tasksContainer.map((t) => t.dueDate));

    displayProjectTasks(currentProject);
});

document.querySelector(".sort-by-priority").addEventListener("click", () => {
    if(!currentProject) return;

    // updateTaskDueDates(currentProject.tasksContainer);
    sortTasksByPriority(currentProject);
    displayProjectTasks(currentProject);
});

// Date input blur
document.querySelector("#dueDate").addEventListener("change", function () {
    this.blur();
});

//Submit event listeners

submitProjectBtn.addEventListener("click", addProjectHandler);

submitTaskBtn.addEventListener("click", addTaskHandler);

// Show & close modals listeners

addProjectBtn.addEventListener("click", () => {
    positionModal(addProjectBtn, newProjectDialog);

    openCreateProjectModal();
});

closeProjectsModalBtn.addEventListener("click", () => newProjectDialog.close());
closeTasksModalBtn.addEventListener("click", () => newTaskDialog.close());

// Close modals on outside click
window.addEventListener('click', function(event) {
    if (event.target == newProjectDialog) newProjectDialog.close();
    if (event.target == newTaskDialog) newTaskDialog.close();
});

// Home page functionalities
