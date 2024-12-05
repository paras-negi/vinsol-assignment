export function createDependencyDropdown(element, dropdownList) {

  let htmlStr = "";

  if (!dropdownList.length) {
    htmlStr += `<div class="checkbox-item">
    <label>
      No dependencies to show
    </label>
  </div>
`;
  }else{
    htmlStr += dropdownList.map((item, index) => {
      return `
        <div class="checkbox-item" data-id="${index}">
            <label for="${item.name}-${index}">
              <input type="checkbox" name="dependency" id="${item.name}-${index}" data-value="${item.name}"/>
              ${item.name}
            </label>
          </div>
        `;
    })
    .join("");
  }
  
  element.innerHTML = htmlStr;
}

export function updateTaskList(taskArray) {
  const taskListItems = document.getElementById("taskListItems");

  if (taskArray.length === 0) {
    taskListItems.innerHTML = `
              <li class="empty-state">
                  <p>No tasks added yet</p>
              </li>
          `;
    return;
  }

  taskListItems.innerHTML = taskArray
    .map(
      (task, index) => `
          <li class="task-item" key=${task.name + "-" + index} data-task-name="${task.name}">
              <div class="task-content">
                  <div class="task-field">
                      <span class="field-label">Task:</span>
                      <span class="field-value">${task.name}</span>
                  </div>
                  <div class="task-field">
                      <span class="field-label">Dependency:</span>
                      <span class="field-value">${
                        task.dependencies.join(", ") || "None"
                      }</span>
                  </div>
                  <div class="task-field">
                      <span class="field-label">Priority:</span>
                      <span class="field-value ${task.priority?.toLowerCase()}">${
                        task.priority || "Not set"
                      }</span>
                  </div>

                  <div class="task-field hidden">
                      <span class="field-label">Status:</span>
                      <span class="status-badge ${
                        task.status?.toLowerCase() || "pending"
                      }">${task.status || "Pending"}</span>
                  </div>
              </div>
  
              <div class="task-actions">
              <button class="task-action-btn complete-btn hidden">Mark Complete</button>
              <button class="task-action-btn edit-btn">Edit</button>
              <button class="task-action-btn delete-btn">Delete</button>
              </div>
          </li>
      `
    )
    .join("");
}

export function drawExecutionFlow(parentEl, flow) {
  let parentElement = document.getElementById(parentEl);

  parentElement.innerHTML = flow.map((task) => {
    return `
      <div class="execution-flow-item ${task.priority}">
        ${task.name}
      </div>
    `}).join('');
}
