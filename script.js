import { handleDropdownClick, handleOutsideClick } from "./js/eventHandlers.js";
import { updateTaskList, createDependencyDropdown, drawExecutionFlow } from "./js/uiHandlers.js";
import { showToast } from "./js/toastUtils.js";

let taskDependencyObj = {};

let taskArray = [];
// let uploadedTasks = null;

let taskInput;
// let addTaskButton;
let taskForm;
let taskPriorityDropdown;
let dependencyListDropdown;
let dependencyInput;
let batchImportTextarea;
let batchImportBtn;

let modifyTaskName = "";

let graphContainer; 

// const dc = {};


const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");

const taskPositions = {}; // To store positions of tasks
const taskRadius = 40; // Radius of task nodes
const distance = 180;

document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  graphContainer = document.getElementById("graphContainer");
  taskInput = document.getElementById("taskInput");
  taskForm = document.getElementById("taskForm");
  taskPriorityDropdown = document.getElementById("taskPriority");
  dependencyListDropdown = document.getElementById("dependencyList");
  dependencyInput = document.getElementById("selectedDependencies");
  batchImportTextarea = document.getElementById("batchImport");
  batchImportBtn = document.getElementById("batchImportBtn");

  //Create initial dependency dropdown
  createDependencyDropdown(dependencyListDropdown, taskArray);

  // Update task list
  updateTaskList(taskArray);

  // Handle dropdowns
  handleDropdownClick();
  handleOutsideClick();


  // Draw initial graph
  //   initializeGraph(taskArray);
    drawGraph();
//   createGraph();
  // Event listeners
  taskForm.addEventListener("submit", saveTask);
  batchImportBtn.addEventListener("click", uploadBatchImport);

  // Handle dependency dropdown
  const dependencyItems = document.querySelectorAll(
    ".checkbox-item input[type='checkbox']"
  );

  dependencyItems.forEach((checkbox) => {
    checkbox.addEventListener("change", handleTaskDependencyChange);
    // Initialize checkbox state based on taskDependencyObj
    const value = checkbox.getAttribute("data-value");
    checkbox.checked = !!taskDependencyObj[value];
  });
});

function handleTaskDependencyChange(event) {
  event.stopPropagation();
  // Get the checkbox and its value
  const checkbox = event.target;
  const dependencyName = checkbox.getAttribute("data-value");

  // Update the taskDependencyObj based on checkbox state
  if (checkbox.checked) {
    taskDependencyObj[dependencyName] = dependencyName;
  } else {
    delete taskDependencyObj[dependencyName];
  }

  // Update the input display
  if (dependencyInput) {
    dependencyInput.value = Object.values(taskDependencyObj).join(", ");
  }
}

function uploadBatchImport(e) {
  e.preventDefault();

  try {
    let tasks = JSON.parse(batchImportTextarea.value);

    if (!Array.isArray(tasks)) {
      showToast("Input must be an array", "error");
      return;
    }

    if(!tasks.length) {
      showToast("No tasks to import", "error");
      return;
    }

    if(tasks.length > 5) {
      showToast("You can only import up to 5 tasks at a time", "error");
      return;
    }

    const isValid = tasks.every((task) => {
      return (
        typeof task === "object" &&
        typeof task.name === "string" &&
        Array.isArray(task.dependencies) &&
        ["high", "medium", "low"].includes(task.priority)
      );
    });

    if (isValid) {
      taskArray = [...taskArray, ...tasks];
      updateTaskList(taskArray);
      createDependencyDropdown(dependencyListDropdown, taskArray);
      drawGraph();
      handleDependencyDropdown();
      addTaskButtonListeners();
      showToast("Task added successfully", "success");
    } else {
      uploadedTasks = null;
      showToast("Invalid task format", "error");
      // Disable the import button or show error indicator
    }
  } catch (error) {
    showToast("Error parsing batch import value:", "error");
  }
}

function saveTask(e) {
  e.preventDefault();

  // Get form values
  const taskName = taskInput.value.trim();
  const taskPriority = taskPriorityDropdown.value;
  const dependencies = Object.values(taskDependencyObj);

  // Validation checks
  if (!taskName) {
    showToast("Please enter a task name", "error");
    return;
  }

  if (!taskPriority) {
    showToast("Please select a priority", "error");
    return;
  }

  // Check for duplicate task name
  const isDuplicate = modifyTaskName
    ? false
    : taskArray.some(
        (task) => task.name.toLowerCase() === taskName.toLowerCase()
      );

  if (isDuplicate) {
    showToast("A task with this name already exists", "error");
    return;
  }

  // Check for circular dependencies
  if (dependencies.includes(taskName)) {
    showToast("A task cannot depend on itself", "error");
    return;
  }

  let isCircularDependency = checkIsCircularDependency(taskArray, {
    name: taskName,
    dependencies: dependencies,
    priority: taskPriority,
  });

  if (isCircularDependency) {
    showToast("Circular dependency can't be present", "error");
    return;
  }

  try {
    if (modifyTaskName) {
      // Update existing task
      taskArray = taskArray.map((task) => {
        if (task.name === modifyTaskName) {
          return {
            name: taskName,
            dependencies: dependencies,
            priority: taskPriority,
          };
        }
        return task;
      });
      modifyTaskName = ""; // Reset the modify flag
    } else {
      // Add new task
      taskArray.push({
        name: taskName,
        dependencies: dependencies,
        priority: taskPriority,
      });
    }

    // Reset form and update UI
    taskForm.reset();
    taskDependencyObj = {};
    dependencyInput.value = "";

    updateTaskList(taskArray);
    createDependencyDropdown(dependencyListDropdown, taskArray);
    drawGraph();
    calculateExecutionFlow(taskArray);
    handleDependencyDropdown();
    addTaskButtonListeners();
    showToast("Task saved successfully", "success");
  } catch (error) {
    showToast("Error saving task. Please try again.", "error");
    console.error("Error:", error);
  }
}

function addTaskButtonListeners() {
  let listItems = document.querySelectorAll(".task-item");

  listItems.forEach((item) => {
    let deleteBtn = item.querySelector(".delete-btn");
    let editBtn = item.querySelector(".edit-btn");

    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const taskName = item.getAttribute("data-task-name");

      if (confirm("Are you sure you want to delete this task?")) {
        onDeleteTask(taskName);
      }
    });

    editBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const taskName = item.getAttribute("data-task-name");
      onEditTask(taskName);
    });
  });
}

function onDeleteTask(taskName) {
  taskArray = taskArray.filter((task) => task.name !== taskName);
  updateTaskList(taskArray);
  handleDependencyDropdown();
  //   drawGraph();
  createGraph();
  showToast("Task deleted successfully", "success");
}

function onEditTask(taskName) {
  let task = taskArray.find((task) => task.name === taskName);
  modifyTaskName = taskName; // Store the task name being edited

  taskInput.focus();
  taskInput.value = task.name;
  taskPriorityDropdown.value = task.priority;

  let dependencies = task.dependencies;
  let dependencyArr = dependencies.map((dep) => dep);

  taskDependencyObj = {}; // Reset the global taskDependencyObj
  dependencyArr.forEach((dep) => (taskDependencyObj[dep] = dep));
  dependencyInput.value = Object.values(taskDependencyObj).join(", ");

  const checkboxes = document.querySelectorAll(
    ".checkbox-item input[type='checkbox']"
  );
  checkboxes.forEach((checkbox) => {
    let checkboxValue = checkbox.getAttribute("data-value");
    checkbox.checked = !!taskDependencyObj[checkboxValue];
  });
}

function handleDependencyDropdown() {
  // Reset form and global taskDependencyObj
  taskDependencyObj = {};

  // Make sure to update the input display
  if (dependencyInput) {
    dependencyInput.value = "";
  }

  // Uncheck all checkboxes
  const checkboxes = document.querySelectorAll(
    ".checkbox-item input[type='checkbox']"
  );

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", handleTaskDependencyChange);
    checkbox.checked = false;
    // Update taskDependencyObj for checked items
    const value = checkbox.getAttribute("data-value");

    if (checkbox.checked) {
      taskDependencyObj[value] = value;
    }
  });
}


function initializeGraph(taskArr) {    
    for (let val of taskArr) {
        const { name, dependencies } = val;
        if (dependencies.length) {
          for (let parent of dependencies) {
            dc[parent] = Array.isArray(dc[parent]) ? [...dc[parent], name] : [name];
          }
        }
      }
}


function solve (val, visited, parent, level = 1){
  visited[val] = true;
  let levelEle = document.createElement("div");
  let ele = document.createElement("span");
  let div = document.createElement("div");
  div.setAttribute("id", val);
  ele.classList.add("nodeSpan");
  //   ele.style.width = "50px";
  ele.style.backgroundColor = "pink";
  levelEle.style.display = "flex";
  let textNode = document.createTextNode(val);
  if (val === "dummy") {
    ele.style.visibility = "hidden";
  }
  ele.appendChild(textNode);
  div.appendChild(ele);
  div.appendChild(levelEle);

  for (let child of dc[val] || []) {
    if (!visited[child]) {
      solve(child, visited, levelEle, level + 1);
    }
  }

  parent.append(div);
};

function createGraph() {
  const visited = {};
  for (let val of Object.keys(dc)) {
    if (!visited[val]) {
      solve(val, visited, graphContainer);
    }
  }
}

function getTaskPosition(index) {
  const x = (index % 3) * distance + 100;
  const y = Math.floor(index / 3) * distance + 100;
  return { x, y };
}

// Draw a node for a task
function drawTaskNode(task, x, y) {
  const priorityClass = task.priority;
  const colors = {
    high: "FF5733",
    medium: "FFD700",
    low: "32CD32",
  };

  ctx.fillStyle = `#${colors[priorityClass]}`;
  ctx.beginPath();
  ctx.arc(x, y, taskRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "14px";
  ctx.fillText(task.name, x - taskRadius / 2, y);
}

// Draw arrow from one task to another
function drawArrow(fromX, fromY, toX, toY) {
  const headLength = 10;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#333";
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = "#333";
  ctx.fill();
}

// Draw all tasks and their dependencies
function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Position each task
  taskArray.forEach((task, index) => {
    taskPositions[task.name] = getTaskPosition(index);
  });

  // Draw nodes
  taskArray.forEach((task) => {
    const { x, y } = taskPositions[task.name];
    drawTaskNode(task, x, y);
  });

  // Draw arrows for dependencies
  taskArray.forEach((task) => {
    const { x: fromX, y: fromY } = taskPositions[task.name];
    if (task.dependencies?.length === 0) return;

    task.dependencies.forEach((dep) => {
      const { x: toX, y: toY } = taskPositions[dep];
      drawArrow(fromX, fromY, toX, toY);
    });
  });
}

function solveCircularDependency(s, list, visited, dfsvisited) {
    visited[s] = true;
    dfsvisited[s] = true;
  
    for (let val of (list[s] || [])) {
      if (!visited[val]) {
        if (solveCircularDependency(val, list, visited, dfsvisited)) {
          return true;
        }
      } else if (visited[val] == true && dfsvisited[val] == true) {
        return true;
      }
    }
    dfsvisited[s] = false;
    return false;
  }
  

  function checkIsCircularDependency(taskList, newTask) {
    let updatedTask = [...taskList, newTask];
    const dc = {};

    for (let val of updatedTask) {
      const { name, dependencies } = val;
      for (let parent of dependencies) {
        dc[parent] = Array.isArray(dc[parent]) ? [...dc[parent], name] : [name];
      }
    }
  
    const visited = {}
    const dfsvisited = {}
    for (let val of Object.keys(dc)) {
      if (!visited[val]) {
        if (solveCircularDependency(val, dc, visited, dfsvisited)) {
          return true;
        }
      }
    }
    return false;
  }

function calculateExecutionFlow(tasks) {
  const priorityWeights = {
    high: 1,
    medium: 2,
    low: 3
  };

  const graph = {};
  const inDegree = {};
  
  tasks.forEach(task => {
    graph[task.name] = [];
    inDegree[task.name] = 0;
  });

  tasks.forEach(task => {
    task.dependencies.forEach(dep => {
      graph[dep].push(task.name);
      inDegree[task.name]++;
    });
  });

  const queue = tasks
    .filter(task => inDegree[task.name] === 0)
    .sort((a, b) => priorityWeights[a.priority] - priorityWeights[b.priority]);

  const executionFlow = [];
  
  while (queue.length) {
    queue.sort((a, b) => priorityWeights[a.priority] - priorityWeights[b.priority]);
    
    const currentTask = queue.shift();
    executionFlow.push(currentTask);

    graph[currentTask.name].forEach(dependent => {
      inDegree[dependent]--;
      
      if (inDegree[dependent] === 0) {
        const task = tasks.find(t => t.name === dependent);
        queue.push(task);
      }
    });
  }

  let flow = executionFlow.map((task, index) => ({
    ...task,
    executionOrder: index + 1,
    priorityWeight: priorityWeights[task.priority] 
  }))

  drawExecutionFlow("executionFlow", flow);
}
