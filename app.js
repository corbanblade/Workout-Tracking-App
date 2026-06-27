const form = document.querySelector("#workoutForm");
const tableBody = document.querySelector("#workoutTable");
const emptyState = document.querySelector("#emptyState");
const clearButton = document.querySelector("#clearButton");
const exerciseCount = document.querySelector("#exerciseCount");
const setCount = document.querySelector("#setCount");
const volumeCount = document.querySelector("#volumeCount");

const STORAGE_KEY = "simple-workout-tracker";

let workouts = loadWorkouts();

function loadWorkouts() {
  const savedWorkouts = localStorage.getItem(STORAGE_KEY);
  return savedWorkouts ? JSON.parse(savedWorkouts) : [];
}

function saveWorkouts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

function formatNumber(number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(number);
}

function renderWorkouts() {
  tableBody.innerHTML = "";

  workouts.forEach((workout) => {
    const row = document.createElement("tr");
    const volume = workout.sets * workout.reps * workout.weight;
    const cells = [
      workout.exercise,
      workout.sets,
      workout.reps,
      `${formatNumber(workout.weight)} lb`,
      `${formatNumber(volume)} lb`,
    ];

    cells.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.id = workout.id;
    deleteButton.textContent = "Delete";
    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  });

  updateSummary();
  emptyState.classList.toggle("is-hidden", workouts.length > 0);
}

function updateSummary() {
  const uniqueExercises = new Set(workouts.map((workout) => workout.exercise.toLowerCase()));
  const totalSets = workouts.reduce((total, workout) => total + workout.sets, 0);
  const totalVolume = workouts.reduce((total, workout) => {
    return total + workout.sets * workout.reps * workout.weight;
  }, 0);

  exerciseCount.textContent = uniqueExercises.size;
  setCount.textContent = totalSets;
  volumeCount.textContent = formatNumber(totalVolume);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const workout = {
    id: `${Date.now()}-${Math.random()}`,
    exercise: formData.get("exercise").trim(),
    sets: Number(formData.get("sets")),
    reps: Number(formData.get("reps")),
    weight: Number(formData.get("weight")),
  };

  if (!workout.exercise) {
    return;
  }

  workouts.push(workout);
  saveWorkouts();
  renderWorkouts();
  form.reset();
  document.querySelector("#sets").value = 3;
  document.querySelector("#reps").value = 10;
  document.querySelector("#weight").value = 0;
  document.querySelector("#exercise").focus();
});

tableBody.addEventListener("click", (event) => {
  if (!event.target.matches(".delete-button")) {
    return;
  }

  const idToDelete = event.target.dataset.id;
  workouts = workouts.filter((workout) => workout.id !== idToDelete);
  saveWorkouts();
  renderWorkouts();
});

clearButton.addEventListener("click", () => {
  workouts = [];
  saveWorkouts();
  renderWorkouts();
});

renderWorkouts();