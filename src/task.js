class Task {
    constructor(title, description, projectName, priority, dueDate) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.projectName = projectName;
        this.dueDate = dueDate;
        this.completed = false;
    }

    toggleComplete() {
        this.completed = !this.completed;
    }
}

export function createTask(title, description, projectName, priority, dueDate) {
    return new Task(title, description, projectName, priority, dueDate);
}