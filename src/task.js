export class Task {
    constructor(title, description, priority, dueDate) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
    }
}

function createTask(task) {
    const taskDiv = document.createElement("div");
    taskDiv.classList.add("task-container");

    const taskTitle = document.createElement("h2");
    taskTitle.textContent = task.title;
    taskDiv.appendChild(taskTitle);

    const taskDescription = document.createElement("p");
    taskDescription.textContent = task.description;
    taskDiv.appendChild(taskDescription);

}