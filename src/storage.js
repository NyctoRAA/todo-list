export function saveToLocalStorage(projectsLibrary) {
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

export function loadFromLocalStorage(createProject, createTask) {
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