const STORAGE_KEY = "workout-planner-data-v1";
const OLD_STORAGE_KEY = "simple-workout-tracker";

const tabs = document.querySelectorAll(".tab-button");
const panels = document.querySelectorAll(".tab-panel");
const exportButton = document.querySelector("#exportButton");
const importFile = document.querySelector("#importFile");

const workoutForm = document.querySelector("#workoutForm");
const workoutDate = document.querySelector("#workoutDate");
const workoutName = document.querySelector("#workoutName");
const templateSelect = document.querySelector("#templateSelect");
const startTemplateButton = document.querySelector("#startTemplateButton");
const exerciseName = document.querySelector("#exerciseName");
const exerciseSets = document.querySelector("#exerciseSets");
const exerciseReps = document.querySelector("#exerciseReps");
const exerciseWeight = document.querySelector("#exerciseWeight");
const exerciseRpe = document.querySelector("#exerciseRpe");
const previousPerformance = document.querySelector("#previousPerformance");
const addExerciseButton = document.querySelector("#addExerciseButton");
const workoutNotes = document.querySelector("#workoutNotes");
const clearDraftButton = document.querySelector("#clearDraftButton");
const draftExercises = document.querySelector("#draftExercises");
const todayWorkouts = document.querySelector("#todayWorkouts");
const selectedDateLabel = document.querySelector("#selectedDateLabel");

const previousMonthButton = document.querySelector("#previousMonthButton");
const nextMonthButton = document.querySelector("#nextMonthButton");
const calendarTitle = document.querySelector("#calendarTitle");
const calendarGrid = document.querySelector("#calendarGrid");
const calendarSelectedDate = document.querySelector("#calendarSelectedDate");
const calendarWorkouts = document.querySelector("#calendarWorkouts");
const addForSelectedDateButton = document.querySelector("#addForSelectedDateButton");

const templateForm = document.querySelector("#templateForm");
const templateName = document.querySelector("#templateName");
const templateExerciseName = document.querySelector("#templateExerciseName");
const templateSets = document.querySelector("#templateSets");
const templateReps = document.querySelector("#templateReps");
const templateWeight = document.querySelector("#templateWeight");
const addTemplateExerciseButton = document.querySelector("#addTemplateExerciseButton");
const templateDraftExercises = document.querySelector("#templateDraftExercises");
const templateList = document.querySelector("#templateList");

const progressExerciseSelect = document.querySelector("#progressExerciseSelect");
const progressEmpty = document.querySelector("#progressEmpty");
const progressContent = document.querySelector("#progressContent");
const progressChart = document.querySelector("#progressChart");
const progressHistory = document.querySelector("#progressHistory");

const summaryFields = {
  totalWorkouts: document.querySelector("#totalWorkouts"),
  totalExercises: document.querySelector("#totalExercises"),
  totalVolume: document.querySelector("#totalVolume"),
  currentStreak: document.querySelector("#currentStreak"),
  bestWeight: document.querySelector("#bestWeight"),
  bestVolume: document.querySelector("#bestVolume"),
  recentPerformance: document.querySelector("#recentPerformance"),
  changeVsLast: document.querySelector("#changeVsLast"),
};

let appState = loadState();
let selectedDate = todayISO();
let calendarMonth = parseISO(selectedDate);
let draftWorkout = createEmptyDraft(selectedDate);
let templateDraft = [];

function defaultTemplates() {
  return [
    template("Leg Day A", [
      exercise("Back squat", 4, 6, 0),
      exercise("Romanian deadlift", 3, 8, 0),
      exercise("Walking lunge", 3, 10, 0),
    ]),
    template("Leg Day B", [
      exercise("Deadlift", 3, 5, 0),
      exercise("Front squat", 3, 8, 0),
      exercise("Leg curl", 3, 12, 0),
    ]),
    template("Upper Day A", [
      exercise("Bench press", 4, 6, 0),
      exercise("Bent-over row", 4, 8, 0),
      exercise("Overhead press", 3, 8, 0),
    ]),
    template("Upper Day B", [
      exercise("Incline dumbbell press", 3, 10, 0),
      exercise("Lat pulldown", 3, 10, 0),
      exercise("Seated cable row", 3, 12, 0),
    ]),
    template("Push Day", [
      exercise("Bench press", 4, 8, 0),
      exercise("Overhead press", 3, 8, 0),
      exercise("Triceps pressdown", 3, 12, 0),
    ]),
    template("Pull Day", [
      exercise("Pull-up", 4, 6, 0),
      exercise("Barbell row", 4, 8, 0),
      exercise("Face pull", 3, 15, 0),
    ]),
  ];
}

function template(name, exercises) {
  return {
    id: makeId(),
    name,
    exercises,
    createdAt: new Date().toISOString(),
  };
}

function exercise(name, sets, reps, weight, rpe = "", completed = false) {
  return {
    id: makeId(),
    name,
    sets: Number(sets),
    reps: Number(reps),
    weight: Number(weight),
    rpe,
    completed,
  };
}

function createEmptyDraft(date) {
  return {
    id: makeId(),
    date,
    name: "",
    notes: "",
    exercises: [],
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    const parsed = JSON.parse(saved);
    return {
      workouts: parsed.workouts || [],
      templates: parsed.templates && parsed.templates.length ? parsed.templates : defaultTemplates(),
    };
  }

  const oldWorkouts = localStorage.getItem(OLD_STORAGE_KEY);
  if (oldWorkouts) {
    const migrated = JSON.parse(oldWorkouts).map((item) => ({
      id: makeId(),
      date: todayISO(),
      name: "Imported workout",
      notes: "",
      createdAt: new Date().toISOString(),
      exercises: [
        exercise(item.exercise, item.sets, item.reps, item.weight, "", true),
      ],
    }));
    return { workouts: migrated, templates: defaultTemplates() };
  }

  return { workouts: [], templates: defaultTemplates() };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayISO() {
  return toISO(new Date());
}

function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISO(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  return parseISO(value).toLocaleDateString("en-US", options);
}

function formatNumber(number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(number || 0);
}

function volumeFor(item) {
  return Number(item.sets) * Number(item.reps) * Number(item.weight);
}

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function clearElement(element) {
  element.textContent = "";
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function setActiveTab(tabName) {
  tabs.forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tabName));
  panels.forEach((panel) => panel.classList.toggle("is-active", panel.id === `${tabName}Tab`));
}

function renderAll() {
  workoutDate.value = selectedDate;
  draftWorkout.date = selectedDate;
  selectedDateLabel.textContent = formatDate(selectedDate);
  renderSummary();
  renderTemplateOptions();
  renderDraftExercises();
  renderWorkoutsForSelectedDate();
  renderCalendar();
  renderTemplates();
  renderProgressOptions();
  renderProgress();
  saveState();
}

function renderSummary() {
  const allExercises = appState.workouts.flatMap((workout) => workout.exercises);
  const uniqueRecentDays = new Set(appState.workouts.map((workout) => workout.date));

  summaryFields.totalWorkouts.textContent = appState.workouts.length;
  summaryFields.totalExercises.textContent = allExercises.length;
  summaryFields.totalVolume.textContent = formatNumber(allExercises.reduce((total, item) => total + volumeFor(item), 0));
  summaryFields.currentStreak.textContent = uniqueRecentDays.size;
}

function renderTemplateOptions() {
  clearElement(templateSelect);

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose a template";
  templateSelect.appendChild(placeholder);

  appState.templates.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    templateSelect.appendChild(option);
  });
}

function renderDraftExercises() {
  clearElement(draftExercises);

  draftWorkout.exercises.forEach((item) => {
    const card = makeElement("article", "exercise-card");
    const body = makeElement("div");
    body.appendChild(makeElement("p", "exercise-title", item.name));
    body.appendChild(makeElement("div", "meta-line", `${item.sets} sets x ${item.reps} reps x ${formatNumber(item.weight)} lb`));

    if (item.rpe) {
      body.appendChild(makeElement("span", "pill", `RPE ${item.rpe}`));
    }

    const controls = makeElement("div", "card-actions");
    const completedLabel = makeElement("label", "completed-toggle");
    const completedInput = document.createElement("input");
    completedInput.type = "checkbox";
    completedInput.checked = item.completed;
    completedInput.dataset.id = item.id;
    completedInput.dataset.action = "toggle-draft-complete";
    completedLabel.appendChild(completedInput);
    completedLabel.append("Completed");
    controls.appendChild(completedLabel);

    const removeButton = makeElement("button", "delete-button", "Remove");
    removeButton.type = "button";
    removeButton.dataset.id = item.id;
    removeButton.dataset.action = "remove-draft-exercise";
    controls.appendChild(removeButton);

    card.appendChild(body);
    card.appendChild(controls);
    draftExercises.appendChild(card);
  });
}

function workoutCard(workout) {
  const card = makeElement("article", "workout-card");
  const titleRow = makeElement("div", "card-title-row");
  const titleBlock = makeElement("div");
  titleBlock.appendChild(makeElement("p", "exercise-title", workout.name || "Workout"));
  titleBlock.appendChild(makeElement("div", "meta-line", `${formatDate(workout.date)} · ${workout.exercises.length} exercises · ${formatNumber(workout.exercises.reduce((total, item) => total + volumeFor(item), 0))} lb volume`));

  const deleteButton = makeElement("button", "delete-button", "Delete");
  deleteButton.type = "button";
  deleteButton.dataset.id = workout.id;
  deleteButton.dataset.action = "delete-workout";

  titleRow.appendChild(titleBlock);
  titleRow.appendChild(deleteButton);
  card.appendChild(titleRow);

  workout.exercises.forEach((item) => {
    const row = makeElement("div", "exercise-card");
    const body = makeElement("div");
    const rpeText = item.rpe ? ` · RPE ${item.rpe}` : "";
    body.appendChild(makeElement("p", "exercise-title", item.name));
    body.appendChild(makeElement("div", "meta-line", `${item.sets} sets x ${item.reps} reps x ${formatNumber(item.weight)} lb · ${formatNumber(volumeFor(item))} lb volume${rpeText}`));
    row.appendChild(body);
    row.appendChild(makeElement("span", "pill", item.completed ? "Completed" : "Planned"));
    card.appendChild(row);
  });

  if (workout.notes) {
    card.appendChild(makeElement("p", "notes", workout.notes));
  }

  return card;
}

function renderWorkoutsForSelectedDate() {
  clearElement(todayWorkouts);
  clearElement(calendarWorkouts);

  const workoutsForDay = appState.workouts.filter((workout) => workout.date === selectedDate);
  workoutsForDay.forEach((workout) => {
    todayWorkouts.appendChild(workoutCard(workout));
    calendarWorkouts.appendChild(workoutCard(workout));
  });

  calendarSelectedDate.textContent = formatDate(selectedDate);
}

function renderCalendar() {
  clearElement(calendarGrid);

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());
  const workoutCounts = appState.workouts.reduce((counts, workout) => {
    counts[workout.date] = (counts[workout.date] || 0) + 1;
    return counts;
  }, {});

  calendarTitle.textContent = calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const iso = toISO(date);
    const button = makeElement("button", "calendar-day");
    button.type = "button";
    button.dataset.date = iso;
    button.dataset.action = "select-calendar-date";
    button.classList.toggle("is-muted", date.getMonth() !== month);
    button.classList.toggle("is-selected", iso === selectedDate);
    button.appendChild(makeElement("span", "calendar-day-number", date.getDate()));

    if (workoutCounts[iso]) {
      button.appendChild(makeElement("span", "calendar-dot", workoutCounts[iso]));
    }

    calendarGrid.appendChild(button);
  }
}

function renderTemplates() {
  clearElement(templateList);
  clearElement(templateDraftExercises);

  templateDraft.forEach((item) => {
    const card = makeElement("article", "exercise-card");
    const body = makeElement("div");
    body.appendChild(makeElement("p", "exercise-title", item.name));
    body.appendChild(makeElement("div", "meta-line", `${item.sets} sets x ${item.reps} reps x ${formatNumber(item.weight)} lb`));

    const removeButton = makeElement("button", "delete-button", "Remove");
    removeButton.type = "button";
    removeButton.dataset.id = item.id;
    removeButton.dataset.action = "remove-template-draft-exercise";

    card.appendChild(body);
    card.appendChild(removeButton);
    templateDraftExercises.appendChild(card);
  });

  appState.templates.forEach((item) => {
    const card = makeElement("article", "template-card");
    const titleRow = makeElement("div", "card-title-row");
    const titleBlock = makeElement("div");
    titleBlock.appendChild(makeElement("p", "exercise-title", item.name));
    titleBlock.appendChild(makeElement("div", "meta-line", `${item.exercises.length} exercises`));
    titleRow.appendChild(titleBlock);
    card.appendChild(titleRow);

    item.exercises.forEach((exerciseItem) => {
      card.appendChild(makeElement("div", "meta-line", `${exerciseItem.name}: ${exerciseItem.sets} x ${exerciseItem.reps} @ ${formatNumber(exerciseItem.weight)} lb`));
    });

    const actions = makeElement("div", "card-actions");
    const startButton = makeElement("button", "secondary-button", "Start Workout");
    startButton.type = "button";
    startButton.dataset.id = item.id;
    startButton.dataset.action = "start-template";
    const deleteButton = makeElement("button", "delete-button", "Delete");
    deleteButton.type = "button";
    deleteButton.dataset.id = item.id;
    deleteButton.dataset.action = "delete-template";
    actions.appendChild(startButton);
    actions.appendChild(deleteButton);
    card.appendChild(actions);
    templateList.appendChild(card);
  });
}

function exerciseHistory(name) {
  const target = normalizeName(name);
  return appState.workouts
    .flatMap((workout) => workout.exercises.map((item) => ({ ...item, date: workout.date, workoutName: workout.name })))
    .filter((item) => normalizeName(item.name) === target)
    .sort((a, b) => parseISO(a.date) - parseISO(b.date));
}

function allExerciseNames() {
  const names = new Set();
  appState.workouts.forEach((workout) => {
    workout.exercises.forEach((item) => names.add(item.name));
  });
  appState.templates.forEach((item) => {
    item.exercises.forEach((exerciseItem) => names.add(exerciseItem.name));
  });
  return [...names].sort((a, b) => a.localeCompare(b));
}

function renderPreviousPerformance() {
  const name = exerciseName.value.trim();
  const history = name ? exerciseHistory(name) : [];
  previousPerformance.classList.toggle("is-hidden", history.length === 0);
  clearElement(previousPerformance);

  if (!history.length) return;

  const last = history[history.length - 1];
  previousPerformance.appendChild(makeElement("strong", "", "Previous performance"));
  previousPerformance.appendChild(makeElement("div", "", `${formatDate(last.date)}: ${last.sets} x ${last.reps} @ ${formatNumber(last.weight)} lb (${formatNumber(volumeFor(last))} lb volume)`));
}

function renderProgressOptions() {
  const selected = progressExerciseSelect.value;
  clearElement(progressExerciseSelect);

  const names = allExerciseNames();
  names.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    progressExerciseSelect.appendChild(option);
  });

  if (names.includes(selected)) {
    progressExerciseSelect.value = selected;
  }
}

function renderProgress() {
  const name = progressExerciseSelect.value || allExerciseNames()[0];
  if (name) progressExerciseSelect.value = name;

  const history = name ? exerciseHistory(name) : [];
  progressEmpty.classList.toggle("is-hidden", history.length > 0);
  progressContent.classList.toggle("is-hidden", history.length === 0);
  clearElement(progressHistory);
  clearElement(progressChart);

  if (!history.length) return;

  const recent = history[history.length - 1];
  const previous = history[history.length - 2];
  const bestWeight = Math.max(...history.map((item) => Number(item.weight)));
  const bestVolume = Math.max(...history.map(volumeFor));
  const change = previous ? volumeFor(recent) - volumeFor(previous) : 0;

  summaryFields.bestWeight.textContent = `${formatNumber(bestWeight)} lb`;
  summaryFields.bestVolume.textContent = `${formatNumber(bestVolume)} lb`;
  summaryFields.recentPerformance.textContent = `${formatNumber(recent.weight)} lb x ${recent.reps}`;
  summaryFields.changeVsLast.textContent = `${change >= 0 ? "+" : ""}${formatNumber(change)} lb`;

  progressChart.appendChild(buildChart(history));

  history.slice().reverse().forEach((item) => {
    const row = makeElement("article", "history-card");
    row.appendChild(makeElement("strong", "", formatDate(item.date)));
    row.appendChild(makeElement("div", "", `${item.sets} sets x ${item.reps} reps x ${formatNumber(item.weight)} lb · ${formatNumber(volumeFor(item))} lb volume`));
    progressHistory.appendChild(row);
  });
}

function buildChart(history) {
  const width = 720;
  const height = 220;
  const padding = 34;
  const values = history.map(volumeFor);
  const max = Math.max(...values, 1);
  const step = history.length > 1 ? (width - padding * 2) / (history.length - 1) : 0;
  const points = values.map((value, index) => {
    const x = history.length === 1 ? width / 2 : padding + index * step;
    const y = height - padding - (value / max) * (height - padding * 2);
    return { x, y, value, date: history[index].date };
  });

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Exercise volume trend chart");

  const baseline = document.createElementNS("http://www.w3.org/2000/svg", "line");
  baseline.setAttribute("x1", padding);
  baseline.setAttribute("x2", width - padding);
  baseline.setAttribute("y1", height - padding);
  baseline.setAttribute("y2", height - padding);
  baseline.setAttribute("stroke", "#cfd8cc");
  svg.appendChild(baseline);

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "#1f7a5a");
  polyline.setAttribute("stroke-width", "4");
  polyline.setAttribute("stroke-linecap", "round");
  polyline.setAttribute("stroke-linejoin", "round");
  polyline.setAttribute("points", points.map((point) => `${point.x},${point.y}`).join(" "));
  svg.appendChild(polyline);

  points.forEach((point) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", "6");
    circle.setAttribute("fill", "#14583f");
    svg.appendChild(circle);
  });

  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", padding);
  label.setAttribute("y", 20);
  label.setAttribute("class", "chart-label");
  label.textContent = `Volume trend for ${progressExerciseSelect.value}`;
  svg.appendChild(label);

  return svg;
}

function addExerciseToDraft() {
  const name = exerciseName.value.trim();
  if (!name) return;

  draftWorkout.exercises.push(exercise(
    name,
    exerciseSets.value,
    exerciseReps.value,
    exerciseWeight.value,
    exerciseRpe.value,
    false,
  ));

  exerciseName.value = "";
  exerciseSets.value = 3;
  exerciseReps.value = 8;
  exerciseWeight.value = 0;
  exerciseRpe.value = "";
  renderPreviousPerformance();
  renderDraftExercises();
}

function addExerciseToTemplateDraft() {
  const name = templateExerciseName.value.trim();
  if (!name) return;

  templateDraft.push(exercise(name, templateSets.value, templateReps.value, templateWeight.value));
  templateExerciseName.value = "";
  templateSets.value = 3;
  templateReps.value = 10;
  templateWeight.value = 0;
  renderTemplates();
}

function startTemplate(templateId) {
  const selectedTemplate = appState.templates.find((item) => item.id === templateId);
  if (!selectedTemplate) return;

  draftWorkout = {
    id: makeId(),
    date: selectedDate,
    name: selectedTemplate.name,
    notes: "",
    exercises: selectedTemplate.exercises.map((item) => exercise(item.name, item.sets, item.reps, item.weight, "", false)),
  };
  workoutName.value = selectedTemplate.name;
  workoutNotes.value = "";
  setActiveTab("today");
  renderAll();
}

function saveWorkout(event) {
  event.preventDefault();

  if (!draftWorkout.exercises.length) {
    addExerciseToDraft();
  }

  if (!draftWorkout.exercises.length) return;

  draftWorkout.date = workoutDate.value || selectedDate;
  draftWorkout.name = workoutName.value.trim() || "Workout";
  draftWorkout.notes = workoutNotes.value.trim();
  draftWorkout.createdAt = new Date().toISOString();

  appState.workouts.push({ ...draftWorkout, exercises: draftWorkout.exercises.map((item) => ({ ...item })) });
  selectedDate = draftWorkout.date;
  calendarMonth = parseISO(selectedDate);
  clearWorkoutDraft();
  renderAll();
}

function clearWorkoutDraft() {
  draftWorkout = createEmptyDraft(selectedDate);
  workoutName.value = "";
  workoutNotes.value = "";
  exerciseName.value = "";
  exerciseSets.value = 3;
  exerciseReps.value = 8;
  exerciseWeight.value = 0;
  exerciseRpe.value = "";
  renderPreviousPerformance();
}

function saveTemplate(event) {
  event.preventDefault();

  if (!templateDraft.length) {
    addExerciseToTemplateDraft();
  }

  const name = templateName.value.trim();
  if (!name || !templateDraft.length) return;

  appState.templates.push(template(name, templateDraft.map((item) => ({ ...item, id: makeId() }))));
  templateName.value = "";
  templateDraft = [];
  renderAll();
}

function exportData() {
  const data = {
    exportedAt: new Date().toISOString(),
    app: "Workout Planner",
    version: 1,
    ...appState,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `workout-planner-${todayISO()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const imported = JSON.parse(reader.result);
    appState = {
      workouts: imported.workouts || [],
      templates: imported.templates && imported.templates.length ? imported.templates : defaultTemplates(),
    };
    selectedDate = todayISO();
    calendarMonth = parseISO(selectedDate);
    clearWorkoutDraft();
    renderAll();
  });
  reader.readAsText(file);
}

tabs.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

workoutDate.addEventListener("change", () => {
  selectedDate = workoutDate.value || todayISO();
  calendarMonth = parseISO(selectedDate);
  draftWorkout.date = selectedDate;
  renderAll();
});

exerciseName.addEventListener("input", renderPreviousPerformance);
addExerciseButton.addEventListener("click", addExerciseToDraft);
clearDraftButton.addEventListener("click", () => {
  clearWorkoutDraft();
  renderAll();
});
workoutForm.addEventListener("submit", saveWorkout);

startTemplateButton.addEventListener("click", () => startTemplate(templateSelect.value));

draftExercises.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (action === "remove-draft-exercise") {
    draftWorkout.exercises = draftWorkout.exercises.filter((item) => item.id !== id);
    renderDraftExercises();
  }
});

draftExercises.addEventListener("change", (event) => {
  if (event.target.dataset.action === "toggle-draft-complete") {
    const item = draftWorkout.exercises.find((exerciseItem) => exerciseItem.id === event.target.dataset.id);
    if (item) item.completed = event.target.checked;
  }
});

todayWorkouts.addEventListener("click", handleWorkoutDelete);
calendarWorkouts.addEventListener("click", handleWorkoutDelete);

function handleWorkoutDelete(event) {
  if (event.target.dataset.action !== "delete-workout") return;
  appState.workouts = appState.workouts.filter((workout) => workout.id !== event.target.dataset.id);
  renderAll();
}

previousMonthButton.addEventListener("click", () => {
  calendarMonth.setMonth(calendarMonth.getMonth() - 1);
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  calendarMonth.setMonth(calendarMonth.getMonth() + 1);
  renderCalendar();
});

calendarGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='select-calendar-date']");
  if (!button) return;
  selectedDate = button.dataset.date;
  workoutDate.value = selectedDate;
  draftWorkout.date = selectedDate;
  renderAll();
});

addForSelectedDateButton.addEventListener("click", () => {
  workoutDate.value = selectedDate;
  setActiveTab("today");
});

addTemplateExerciseButton.addEventListener("click", addExerciseToTemplateDraft);
templateForm.addEventListener("submit", saveTemplate);

templateDraftExercises.addEventListener("click", (event) => {
  if (event.target.dataset.action !== "remove-template-draft-exercise") return;
  templateDraft = templateDraft.filter((item) => item.id !== event.target.dataset.id);
  renderTemplates();
});

templateList.addEventListener("click", (event) => {
  const { action, id } = event.target.dataset;
  if (action === "start-template") {
    startTemplate(id);
  }
  if (action === "delete-template") {
    appState.templates = appState.templates.filter((item) => item.id !== id);
    renderAll();
  }
});

progressExerciseSelect.addEventListener("change", renderProgress);
exportButton.addEventListener("click", exportData);
importFile.addEventListener("change", () => {
  const [file] = importFile.files;
  if (file) importData(file);
  importFile.value = "";
});

renderAll();