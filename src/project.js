export class Project {
    constructor(name) {
        this.name = name;
        this.tasksContainer = [];
    }

    addTask(task) {
        this.tasksContainer.push(task);
    }

    removeTask(taskIndex) {
        this.tasksContainer.splice(taskIndex, 1); // Removes a task by index
    }
}

export function createProject(name) {
    return new Project(name);
}