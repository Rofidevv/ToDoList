class TodoItemFormatter {
  formatTask(task) {
    return task;
  }

  formatDueDate(dueDate) {
    if (!dueDate) return "Tidak ada deadline";
    return new Date(dueDate).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  formatStatus(completed) {
    return completed ? "Completed" : "Pending";
  }
}

class TodoManager {
  constructor(todoItemFormatter) {
    this.todos = JSON.parse(localStorage.getItem("todos")) || [];
    this.todoItemFormatter = todoItemFormatter;
  }

  addTodo(task, dueDate) {
    const newTodo = {
      id: this.getRandomId(),
      task: task,
      dueDate: dueDate,
      completed: false,
    };
    this.todos.push(newTodo);
    this.saveToLocalStorage();
    return newTodo;
  }

  editTodo(id, updatedTask, updatedDueDate) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.task = updatedTask;
      todo.dueDate = updatedDueDate;
      this.saveToLocalStorage();
    }
    return todo;
  }

  deleteTodo(id) {
    this.todos = this.todos.filter((todo) => todo.id !== id);
    this.saveToLocalStorage();
  }

  toggleTodoStatus(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveToLocalStorage();
    }
  }

  clearAllTodos() {
    if (this.todos.length > 0) {
      this.todos = [];
      this.saveToLocalStorage();
    }
  }

  filterTodos(status) {
    switch (status) {
      case "all":
        return this.todos;
      case "pending":
        return this.todos.filter((todo) => !todo.completed);
      case "completed":
        return this.todos.filter((todo) => todo.completed);
      default:
        return this.todos; // Default ke all
    }
  }

  getRandomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  saveToLocalStorage() {
    localStorage.setItem("todos", JSON.stringify(this.todos));
  }
}

class UIManager {
  constructor(todoManager, todoItemFormatter) {
    this.todoManager = todoManager;
    this.todoItemFormatter = todoItemFormatter;
    this.taskInput = document.querySelector(
      ".input-section input[type='text']"
    );
    this.dateInput = document.querySelector(".schedule-date");
    this.addBtn = document.querySelector(".add-task-button");
    this.todosListContainer = document.querySelector(".todos-list-container");
    this.alertMessage = document.querySelector(".alert-message");
    this.deleteAllBtn = document.querySelector(".delete-all-btn");
    this.filterTabs = document.querySelectorAll(".todos-filter .tab");
    this.emptyState = document.getElementById("empty-state");
    this.editModal = document.getElementById("edit-modal");
    this.editTodoIdInput = document.getElementById("edit-todo-id");
    this.editTaskInput = document.getElementById("edit-task-input");
    this.editDateInput = document.getElementById("edit-date-input");
    this.currentFilter = "all";
    this.addEventListeners();
    this.showTodosByFilter();
  }

  addEventListeners() {
    this.addBtn.addEventListener("click", () => this.handleAddTodo());
    this.taskInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter" && this.taskInput.value.length > 0) {
        this.handleAddTodo();
      }
    });

    this.deleteAllBtn.addEventListener("click", () =>
      this.handleClearAllTodos()
    );

    this.filterTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this.filterTabs.forEach((t) => t.classList.remove("tab-active"));
        tab.classList.add("tab-active");
      });
    });
  }

  handleAddTodo() {
    const task = this.taskInput.value.trim();
    const dueDate = this.dateInput.value;
    if (task === "") {
      this.showAlertMessage("Silakan masukkan tugas!!", "warning");
    } else {
      this.todoManager.addTodo(task, dueDate);
      this.showTodosByFilter();
      this.taskInput.value = "";
      this.dateInput.value = "";
      this.showAlertMessage("Tugas berhasil ditambahkan", "success");
      this.taskInput.focus();
    }
  }

  handleClearAllTodos() {
    if (this.todoManager.todos.length > 0) {
      this.todoManager.clearAllTodos();
      this.showTodosByFilter();
      this.showAlertMessage("All todos cleared successfully", "info");
    } else {
      this.showAlertMessage("Nothing to clear!", "warning");
    }
  }

  showTodosByFilter() {
    const filteredTodos = this.todoManager.filterTodos(this.currentFilter);
    this.displayTodos(filteredTodos);
  }

  displayTodos(todos) {
    this.todosListContainer.innerHTML = "";

    if (todos.length === 0) {
      this.emptyState.classList.remove("hidden");
      this.todosListContainer.classList.add("hidden");
      return;
    }

    this.emptyState.classList.add("hidden");
    this.todosListContainer.classList.remove("hidden");

    todos.forEach((todo) => {
      const isCompleted = todo.completed;
      // Cek apakah sudah lewat tanggal dan belum selesai
      const isOverdue =
        todo.dueDate && new Date(todo.dueDate) < new Date() && !isCompleted;

      const todoCard = `
        <div class="card todo-item bg-base-100 shadow-md ${
          isCompleted ? "completed" : ""
        }" data-id="${todo.id}">
          <div class="card-body p-4 flex-row items-center gap-4">
            <button class="btn btn-circle btn-sm ${
              isCompleted ? "btn-primary" : "btn-ghost"
            }" onclick="uiManager.handleToggleStatus('${todo.id}')">
                <i class='bx ${
                  isCompleted ? "bx-check-double" : "bx-circle"
                } bx-sm'></i>
            </button>

            <div class="flex-grow">
                <p class="font-semibold todo-task">${this.todoItemFormatter.formatTask(
                  todo.task
                )}</p>
                <p class="text-xs opacity-70 ${
                  isOverdue ? "overdue-date" : ""
                }">
                    <i class='bx bx-calendar'></i> ${this.todoItemFormatter.formatDueDate(
                      todo.dueDate
                    )}
                </p>
            </div>

            <div class="card-actions justify-end">
                <button class="btn btn-square btn-sm btn-warning" onclick="uiManager.openEditModal('${
                  todo.id
                }')">
                    <i class="bx bx-edit-alt"></i>    
                </button>
                <button class="btn btn-square btn-sm btn-error" onclick="uiManager.handleDeleteTodo('${
                  todo.id
                }')">
                    <i class="bx bx-trash"></i>
                </button>
            </div>
          </div>
        </div>
      `;
      this.todosListContainer.innerHTML += todoCard;
    });
  }

  handleToggleStatus(id) {
    this.todoManager.toggleTodoStatus(id);
    this.showTodosByFilter();
  }

  handleDeleteTodo(id) {
    if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
      this.todoManager.deleteTodo(id);
      this.showAlertMessage("Tugas berhasil dihapus", "info");
      this.showTodosByFilter();
    }
  }

  openEditModal(id) {
    const todo = this.todoManager.todos.find((t) => t.id === id);
    if (todo) {
      this.editTodoIdInput.value = todo.id;
      this.editTaskInput.value = todo.task;
      this.editDateInput.value = todo.dueDate;
      this.editModal.classList.add("modal-open");
    }
  }

  closeEditModal() {
    this.editModal.classList.remove("modal-open");
  }

  handleUpdateTodo() {
    const id = this.editTodoIdInput.value;
    const updatedTask = this.editTaskInput.value.trim();
    const updatedDueDate = this.editDateInput.value;

    if (updatedTask) {
      this.todoManager.editTodo(id, updatedTask, updatedDueDate);
      this.closeEditModal();
      this.showAlertMessage("Tugas berhasil diperbarui", "success");
      this.showTodosByFilter();
    } else {
      this.showAlertMessage("Tugas tidak boleh kosong", "error");
    }
  }

  handleFilterTodos(status) {
    this.currentFilter = status;
    this.showTodosByFilter();
  }

  showAlertMessage(message, type) {
    const alertBox = `
      <div class="alert alert-${type} shadow-lg text-sm">
        <div>
          <i class='bx ${
            type === "success" ? "bxs-check-circle" : "bxs-info-circle"
          }'></i>
          <span>${message}</span>
        </div>
      </div>
    `;
    this.alertMessage.innerHTML = alertBox;
    this.alertMessage.classList.add("show");

    setTimeout(() => {
      this.alertMessage.classList.remove("show");
    }, 3000);
  }
}

class ThemeSwitcher {
  constructor(themes, html) {
    this.themes = themes;
    this.html = html;
    this.init();
  }

  init() {
    const theme = this.getThemeFromLocalStorage();
    if (theme) {
      this.setTheme(theme);
    }
    this.addThemeEventListeners();
  }

  addThemeEventListeners() {
    this.themes.forEach((theme) => {
      theme.addEventListener("click", () => {
        const themeName = theme.getAttribute("theme");
        this.setTheme(themeName);
        this.saveThemeToLocalStorage(themeName);
      });
    });
  }

  setTheme(themeName) {
    this.html.setAttribute("data-theme", themeName);
  }

  saveThemeToLocalStorage(themeName) {
    localStorage.setItem("theme", themeName);
  }

  getThemeFromLocalStorage() {
    return localStorage.getItem("theme");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const todoItemFormatter = new TodoItemFormatter();
  const todoManager = new TodoManager(todoItemFormatter);
  window.uiManager = new UIManager(todoManager, todoItemFormatter);
  const themes = document.querySelectorAll(".theme-item");
  const html = document.querySelector("html");
  const themeSwitcher = new ThemeSwitcher(themes, html);
  flatpickr.localize(flatpickr.l10ns.id);

  const flatpickrConfig = {
    altInput: true,
    altFormat: "j F Y",
    dateFormat: "Y-m-d",
    disableMobile: true,
  };
  flatpickr(".schedule-date", flatpickrConfig);
  flatpickr("#edit-date-input", flatpickrConfig);
});
