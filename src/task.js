class Task {
    constructor(title, description, priority, dueDate) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
        this.completed = false;
    }

    toggleComplete() {
        this.completed = !this.completed;
    }
}

export function createTask(title, description, priority, dueDate) {
    return new Task(title, description, priority, dueDate);
}