const STORAGE_KEY = "workout-planner-data-v2";
const LEGACY_KEY = "workout-planner-data-v1";

const state = loadState();
let activeTab = "dashboard";
let selectedDate = todayISO();
let calendarMonth = parseISO(selectedDate);
let activeWorkout = null;
let workoutTimerId = null;
let restTimerId = null;
let restEndsAt = null;
let templateDraft = [];

const els = {
  todayChip: qs("#todayChip"),
  navButtons: qsa(".nav-button"),
  panels: qsa(".tab-panel"),
  weekWorkouts: qs("#weekWorkouts"),
  monthWorkouts: qs("#monthWorkouts"),
  liftingStreak: qs("#liftingStreak"),
  weekVolume: qs("#weekVolume"),
  recentWorkout: qs("#recentWorkout"),
  recentPrs: qs("#recentPrs"),
  activeProgramSummary: qs("#activeProgramSummary"),
  calendarTitle: qs("#calendarTitle"),
  previousMonthButton: qs("#previousMonthButton"),
  todayMonthButton: qs("#todayMonthButton"),
  nextMonthButton: qs("#nextMonthButton"),
  calendarGrid: qs("#calendarGrid"),
  calendarSelectedDate: qs("#calendarSelectedDate"),
  calendarDayWorkouts: qs("#calendarDayWorkouts"),
  startForSelectedDateButton: qs("#startForSelectedDateButton"),
  workoutHome: qs("#workoutHome"),
  activeWorkoutScreen: qs("#activeWorkoutScreen"),
  startWorkoutButton: qs("#startWorkoutButton"),
  savedTemplatesButton: qs("#savedTemplatesButton"),
  startOptions: qs("#startOptions"),
  startNewWorkoutButton: qs("#startNewWorkoutButton"),
  workoutTemplateSelect: qs("#workoutTemplateSelect"),
  startTemplateWorkoutButton: qs("#startTemplateWorkoutButton"),
  workoutTimer: qs("#workoutTimer"),
  finishWorkoutButton: qs("#finishWorkoutButton"),
  activeWorkoutName: qs("#activeWorkoutName"),
  activeBodyweight: qs("#activeBodyweight"),
  activeNotes: qs("#activeNotes"),
  missedTargetNote: qs("#missedTargetNote"),
  restSeconds: qs("#restSeconds"),
  restTimer: qs("#restTimer"),
  startRestButton: qs("#startRestButton"),
  exerciseNameInput: qs("#exerciseNameInput"),
  exerciseSuggestions: qs("#exerciseSuggestions"),
  exerciseAssist: qs("#exerciseAssist"),
  setWeightInput: qs("#setWeightInput"),
  setRepsInput: qs("#setRepsInput"),
  setRpeInput: qs("#setRpeInput"),
  setCountInput: qs("#setCountInput"),
  addExerciseToWorkoutButton: qs("#addExerciseToWorkoutButton"),
  activeExerciseList: qs("#activeExerciseList"),
  editingTemplateId: qs("#editingTemplateId"),
  templateName: qs("#templateName"),
  templateExerciseName: qs("#templateExerciseName"),
  templateSets: qs("#templateSets"),
  templateReps: qs("#templateReps"),
  templateWeight: qs("#templateWeight"),
  templateExerciseNotes: qs("#templateExerciseNotes"),
  addTemplateExerciseButton: qs("#addTemplateExerciseButton"),
  templateDraftExercises: qs("#templateDraftExercises"),
  saveTemplateButton: qs("#saveTemplateButton"),
  cancelTemplateEditButton: qs("#cancelTemplateEditButton"),
  templateList: qs("#templateList"),
  progressExerciseSelect: qs("#progressExerciseSelect"),
  programStartWeight: qs("#programStartWeight"),
  programIncrease: qs("#programIncrease"),
  programReps: qs("#programReps"),
  saveProgramButton: qs("#saveProgramButton"),
  bestWeight: qs("#bestWeight"),
  bestE1rm: qs("#bestE1rm"),
  bestVolume: qs("#bestVolume"),
  targetStatus: qs("#targetStatus"),
  chartMetricSelect: qs("#chartMetricSelect"),
  progressChart: qs("#progressChart"),
  progressHistory: qs("#progressHistory"),
};

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function defaultTemplates() {
  return [
    makeTemplate("Leg Day A", [
      plannedExercise("Back Squat", 4, 6, 0, "Add weight after clean reps."),
      plannedExercise("Romanian Deadlift", 3, 8, 0, ""),
      plannedExercise("Walking Lunge", 3, 10, 0, ""),
    ]),
    makeTemplate("Leg Day B", [
      plannedExercise("Deadlift", 3, 5, 0, ""),
      plannedExercise("Front Squat", 3, 8, 0, ""),
      plannedExercise("Leg Curl", 3, 12, 0, ""),
    ]),
    makeTemplate("Upper Day A", [
      plannedExercise("Bench Press", 4, 6, 0, ""),
      plannedExercise("Bent-over Row", 4, 8, 0, ""),
      plannedExercise("Overhead Press", 3, 8, 0, ""),
    ]),
    makeTemplate("Upper Day B", [
      plannedExercise("Incline Dumbbell Press", 3, 10, 0, ""),
      plannedExercise("Lat Pulldown", 3, 10, 0, ""),
      plannedExercise("Seated Cable Row", 3, 12, 0, ""),
    ]),
    makeTemplate("Push Day", [
      plannedExercise("Bench Press", 4, 8, 0, ""),
      plannedExercise("Overhead Press", 3, 8, 0, ""),
      plannedExercise("Triceps Pressdown", 3, 12, 0, ""),
    ]),
    makeTemplate("Pull Day", [
      plannedExercise("Pull-up", 4, 6, 0, ""),
      plannedExercise("Barbell Row", 4, 8, 0, ""),
      plannedExercise("Face Pull", 3, 15, 0, ""),
    ]),
  ];
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return normalizeState(JSON.parse(saved));

  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) return migrateV1(JSON.parse(legacy));

  return normalizeState({
    workouts: [],
    templates: defaultTemplates(),
    programs: {},
  });
}

function migrateV1(data) {
  const workouts = (data.workouts || []).map((workout) => ({
    id: workout.id || uid(),
    date: workout.date || todayISO(),
    name: workout.name || "Workout",
    startedAt: workout.createdAt || new Date().toISOString(),
    endedAt: workout.createdAt || new Date().toISOString(),
    durationSeconds: workout.durationSeconds || 0,
    bodyweight: workout.bodyweight || "",
    notes: workout.notes || "",
    missedTargetNote: workout.missedTargetNote || "",
    exercises: (workout.exercises || []).map((item) => ({
      id: item.id || uid(),
      name: item.name,
      notes: item.notes || "",
      plannedSets: item.plannedSets || item.sets || 1,
      plannedReps: item.plannedReps || item.reps || 1,
      targetWeight: item.targetWeight || item.weight || 0,
      sets: [
        {
          id: uid(),
          weight: Number(item.weight || 0),
          reps: Number(item.reps || 1),
          rpe: item.rpe || "",
          completed: item.completed !== false,
          badges: [],
        },
      ],
    })),
  }));

  return normalizeState({
    workouts,
    templates: data.templates && data.templates.length ? data.templates.map(normalizeTemplate) : defaultTemplates(),
    programs: data.programs || {},
  });
}

function normalizeState(data) {
  return {
    workouts: data.workouts || [],
    templates: data.templates && data.templates.length ? data.templates.map(normalizeTemplate) : defaultTemplates(),
    programs: data.programs || {},
  };
}

function normalizeTemplate(template) {
  return {
    id: template.id || uid(),
    name: template.name || "Template",
    exercises: (template.exercises || []).map((item) => plannedExercise(
      item.name,
      item.plannedSets || item.sets || 3,
      item.plannedReps || item.reps || 8,
      item.startingWeight || item.targetWeight || item.weight || 0,
      item.notes || "",
    )),
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeTemplate(name, exercises) {
  return { id: uid(), name, exercises };
}

function plannedExercise(name, plannedSets, plannedReps, startingWeight, notes) {
  return {
    id: uid(),
    name,
    plannedSets: Number(plannedSets || 1),
    plannedReps: Number(plannedReps || 1),
    startingWeight: Number(startingWeight || 0),
    notes: notes || "",
  };
}

function todayISO() {
  return toISO(new Date());
}

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseISO(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value, options = { month: "short", day: "numeric" }) {
  return parseISO(value).toLocaleDateString("en-US", options);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(Number(value || 0));
}

function secondsToClock(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function startOfWeek(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function volumeForSet(set) {
  return Number(set.weight || 0) * Number(set.reps || 0);
}

function e1rm(set) {
  return Number(set.weight || 0) * (1 + Number(set.reps || 0) / 30);
}

function workoutVolume(workout) {
  return workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((sum, set) => sum + volumeForSet(set), 0);
  }, 0);
}

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function roundToFive(value) {
  return Math.round(Number(value || 0) / 5) * 5;
}

function allLoggedSets(exerciseName) {
  const target = normalizeName(exerciseName);
  return state.workouts
    .flatMap((workout) => workout.exercises.map((exercise) => ({ workout, exercise })))
    .filter(({ exercise }) => normalizeName(exercise.name) === target)
    .flatMap(({ workout, exercise }) => exercise.sets.map((set) => ({ ...set, date: workout.date, workoutName: workout.name, exerciseName: exercise.name })))
    .sort((a, b) => parseISO(a.date) - parseISO(b.date));
}

function allExerciseNames() {
  const names = new Set();
  state.workouts.forEach((workout) => workout.exercises.forEach((exercise) => names.add(exercise.name)));
  state.templates.forEach((template) => template.exercises.forEach((exercise) => names.add(exercise.name)));
  Object.keys(state.programs).forEach((name) => names.add(name));
  return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function programFor(name) {
  return state.programs[normalizeName(name)];
}

function programWeek(program, dateISO = todayISO()) {
  if (!program) return 1;
  const elapsed = parseISO(dateISO) - parseISO(program.startDate);
  return Math.min(12, Math.max(1, Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000)) + 1));
}

function suggestedTarget(name, dateISO = todayISO()) {
  const program = programFor(name);
  if (!program) return null;
  const week = programWeek(program, dateISO);
  const raw = Number(program.startWeight) * Math.pow(1 + Number(program.weeklyIncreasePct) / 100, week - 1);
  return {
    week,
    weight: roundToFive(raw),
    reps: Number(program.targetReps || 1),
    program,
  };
}

function targetStatusForExercise(exercise, workoutDate) {
  const target = suggestedTarget(exercise.name, workoutDate);
  if (!target) return "";
  const bestSet = exercise.sets.reduce((best, set) => Number(set.weight) > Number(best.weight || 0) ? set : best, {});
  if (!bestSet.weight) return "Target not attempted";
  if (Number(bestSet.weight) > target.weight) return "Exceeded target";
  if (Number(bestSet.weight) === target.weight && Number(bestSet.reps) >= target.reps) return "Hit target";
  return "Missed target";
}

function makeElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function clear(node) {
  node.textContent = "";
}

function setTab(tab) {
  activeTab = tab;
  els.navButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tab));
  els.panels.forEach((panel) => panel.classList.toggle("is-active", panel.id === `${tab}Tab`));
  renderAll();
}

function renderAll() {
  els.todayChip.textContent = formatDate(todayISO(), { weekday: "short", month: "short", day: "numeric" });
  renderExerciseSuggestions();
  renderTemplateSelect();
  renderDashboard();
  renderCalendar();
  renderWorkout();
  renderTemplates();
  renderProgressOptions();
  renderProgress();
  saveState();
}

function renderDashboard() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const month = now.getMonth();
  const year = now.getFullYear();
  const thisWeek = state.workouts.filter((workout) => parseISO(workout.date) >= weekStart);
  const thisMonth = state.workouts.filter((workout) => {
    const date = parseISO(workout.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });

  els.weekWorkouts.textContent = thisWeek.length;
  els.monthWorkouts.textContent = thisMonth.length;
  els.liftingStreak.textContent = calculateStreak();
  els.weekVolume.textContent = formatNumber(thisWeek.reduce((total, workout) => total + workoutVolume(workout), 0));

  const recent = [...state.workouts].sort((a, b) => parseISO(b.date) - parseISO(a.date))[0];
  clear(els.recentWorkout);
  if (recent) {
    els.recentWorkout.appendChild(workoutSummaryCard(recent, true));
  } else {
    els.recentWorkout.textContent = "No workouts logged yet. Start one from the Workout tab.";
  }

  renderRecentPrs();
  renderActiveProgramSummary();
}

function calculateStreak() {
  const days = new Set(state.workouts.map((workout) => workout.date));
  let count = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.has(toISO(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function renderRecentPrs() {
  clear(els.recentPrs);
  const prs = state.workouts
    .flatMap((workout) => workout.exercises.flatMap((exercise) => exercise.sets.flatMap((set) => {
      return (set.badges || []).map((badge) => ({ badge, exercise: exercise.name, date: workout.date, weight: set.weight, reps: set.reps }));
    })))
    .sort((a, b) => parseISO(b.date) - parseISO(a.date))
    .slice(0, 5);

  if (!prs.length) {
    els.recentPrs.appendChild(makeElement("div", "soft-empty", "PR badges will show here when you beat your best weight, volume, or estimated 1RM."));
    return;
  }

  prs.forEach((pr) => {
    const row = makeElement("div", "assist-card");
    row.textContent = `${pr.badge}: ${pr.exercise} ${formatNumber(pr.weight)} lb x ${pr.reps} on ${formatDate(pr.date)}`;
    els.recentPrs.appendChild(row);
  });
}

function renderActiveProgramSummary() {
  clear(els.activeProgramSummary);
  const programs = Object.values(state.programs);
  if (!programs.length) {
    els.activeProgramSummary.textContent = "Set a 12-week target from the Progress tab.";
    return;
  }
  programs.slice(0, 3).forEach((program) => {
    const target = suggestedTarget(program.exercise);
    const row = makeElement("div", "assist-card");
    row.textContent = `${program.exercise}: Week ${target.week} target ${formatNumber(target.weight)} lb x ${target.reps}`;
    els.activeProgramSummary.appendChild(row);
  });
}

function workoutSummaryCard(workout, compact = false) {
  const card = makeElement("article", compact ? "" : "workout-card");
  const title = makeElement("p", "exercise-title", workout.name || "Workout");
  const meta = makeElement("div", "meta-line", `${formatDate(workout.date)} · ${workout.exercises.length} exercises · ${formatNumber(workoutVolume(workout))} lb`);
  card.appendChild(title);
  card.appendChild(meta);
  if (workout.missedTargetNote) card.appendChild(makeElement("p", "meta-line", `Note: ${workout.missedTargetNote}`));
  return card;
}

function renderCalendar() {
  clear(els.calendarGrid);
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const workoutCounts = state.workouts.reduce((counts, workout) => {
    counts[workout.date] = (counts[workout.date] || 0) + 1;
    return counts;
  }, {});

  els.calendarTitle.textContent = calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = toISO(date);
    const button = makeElement("button", "calendar-day");
    button.type = "button";
    button.dataset.date = iso;
    button.classList.toggle("is-muted", date.getMonth() !== month);
    button.classList.toggle("is-selected", iso === selectedDate);
    button.classList.toggle("has-workout", Boolean(workoutCounts[iso]));
    button.appendChild(makeElement("span", "", date.getDate()));
    if (workoutCounts[iso]) button.appendChild(makeElement("span", "calendar-dot"));
    els.calendarGrid.appendChild(button);
  }

  els.calendarSelectedDate.textContent = formatDate(selectedDate, { weekday: "long", month: "short", day: "numeric" });
  clear(els.calendarDayWorkouts);
  const workouts = state.workouts.filter((workout) => workout.date === selectedDate);
  if (!workouts.length) {
    els.calendarDayWorkouts.appendChild(makeElement("div", "soft-empty", "No workouts logged for this day."));
    return;
  }
  workouts.forEach((workout) => els.calendarDayWorkouts.appendChild(workoutSummaryCard(workout)));
}

function renderWorkout() {
  els.workoutHome.classList.toggle("is-hidden", Boolean(activeWorkout));
  els.activeWorkoutScreen.classList.toggle("is-hidden", !activeWorkout);
  if (!activeWorkout) return;

  els.activeWorkoutName.value = activeWorkout.name;
  els.activeBodyweight.value = activeWorkout.bodyweight;
  els.activeNotes.value = activeWorkout.notes;
  els.missedTargetNote.value = activeWorkout.missedTargetNote;
  updateWorkoutTimer();
  renderActiveExercises();
}

function startWorkout(templateId = "") {
  const template = state.templates.find((item) => item.id === templateId);
  activeWorkout = {
    id: uid(),
    date: selectedDate || todayISO(),
    name: template ? template.name : "Workout",
    startedAt: new Date().toISOString(),
    endedAt: "",
    durationSeconds: 0,
    bodyweight: "",
    notes: "",
    missedTargetNote: "",
    exercises: template ? template.exercises.map(exerciseFromTemplate) : [],
  };
  els.startOptions.classList.add("is-hidden");
  startWorkoutTimer();
  setTab("workout");
}

function exerciseFromTemplate(item) {
  const target = suggestedTarget(item.name);
  const weight = target ? target.weight : Number(item.startingWeight || 0);
  return {
    id: uid(),
    name: item.name,
    notes: item.notes || "",
    plannedSets: item.plannedSets,
    plannedReps: item.plannedReps,
    targetWeight: weight,
    sets: Array.from({ length: Number(item.plannedSets || 1) }, () => ({
      id: uid(),
      weight,
      reps: Number(item.plannedReps || 1),
      rpe: "",
      completed: false,
      badges: [],
    })),
  };
}

function startWorkoutTimer() {
  clearInterval(workoutTimerId);
  workoutTimerId = setInterval(updateWorkoutTimer, 1000);
  updateWorkoutTimer();
}

function updateWorkoutTimer() {
  if (!activeWorkout) return;
  const elapsed = Math.floor((Date.now() - new Date(activeWorkout.startedAt).getTime()) / 1000);
  els.workoutTimer.textContent = secondsToClock(elapsed);
}

function syncActiveWorkoutFields() {
  if (!activeWorkout) return;
  activeWorkout.name = els.activeWorkoutName.value.trim() || "Workout";
  activeWorkout.bodyweight = els.activeBodyweight.value;
  activeWorkout.notes = els.activeNotes.value.trim();
  activeWorkout.missedTargetNote = els.missedTargetNote.value.trim();
}

function addExerciseToActiveWorkout() {
  if (!activeWorkout) startWorkout();
  const name = els.exerciseNameInput.value.trim();
  if (!name) return;
  const count = Math.max(1, Number(els.setCountInput.value || 1));
  const target = suggestedTarget(name);
  const weight = Number(els.setWeightInput.value || target?.weight || 0);
  const reps = Number(els.setRepsInput.value || target?.reps || 1);
  const rpe = els.setRpeInput.value;
  const exercise = {
    id: uid(),
    name,
    notes: "",
    plannedSets: count,
    plannedReps: reps,
    targetWeight: target ? target.weight : weight,
    sets: Array.from({ length: count }, () => ({
      id: uid(),
      weight,
      reps,
      rpe,
      completed: false,
      badges: [],
    })),
  };
  activeWorkout.exercises.push(exercise);
  els.exerciseNameInput.value = "";
  els.setCountInput.value = 1;
  renderExerciseAssist();
  renderWorkout();
}

function renderActiveExercises() {
  clear(els.activeExerciseList);
  if (!activeWorkout.exercises.length) {
    els.activeExerciseList.appendChild(makeElement("div", "soft-empty", "Add your first exercise. When you complete sets, PR badges and rest timing will update here."));
    return;
  }
  activeWorkout.exercises.forEach((exercise) => {
    const card = makeElement("article", "exercise-card");
    const top = makeElement("div", "card-top");
    const titleWrap = makeElement("div");
    titleWrap.appendChild(makeElement("p", "exercise-title", exercise.name));
    const target = suggestedTarget(exercise.name, activeWorkout.date);
    titleWrap.appendChild(makeElement("div", "meta-line", target ? `Week ${target.week} target: ${formatNumber(target.weight)} lb x ${target.reps}` : "No target set"));
    top.appendChild(titleWrap);
    const status = targetStatusForExercise(exercise, activeWorkout.date);
    if (status) top.appendChild(makeElement("span", "pill", status));
    card.appendChild(top);

    const setList = makeElement("div", "set-list");
    exercise.sets.forEach((set, index) => {
      const row = makeElement("div", "set-row");
      row.classList.toggle("is-complete", set.completed);
      const info = makeElement("div");
      info.appendChild(makeElement("strong", "", `Set ${index + 1}: ${formatNumber(set.weight)} x ${set.reps}`));
      const badges = makeElement("div", "meta-line");
      if (set.rpe) badges.appendChild(makeElement("span", "pill", `RPE ${set.rpe}`));
      (set.badges || []).forEach((badge) => badges.appendChild(makeElement("span", "pr-badge", badge)));
      info.appendChild(badges);
      const button = makeElement("button", "", set.completed ? "Done" : "Complete");
      button.type = "button";
      button.dataset.action = "complete-set";
      button.dataset.exerciseId = exercise.id;
      button.dataset.setId = set.id;
      row.appendChild(info);
      row.appendChild(button);
      setList.appendChild(row);
    });
    card.appendChild(setList);
    els.activeExerciseList.appendChild(card);
  });
}

function completeSet(exerciseId, setId) {
  const exercise = activeWorkout.exercises.find((item) => item.id === exerciseId);
  const set = exercise?.sets.find((item) => item.id === setId);
  if (!exercise || !set) return;
  set.completed = true;
  set.badges = calculatePrBadges(exercise.name, set);
  startRestTimer();
  renderWorkout();
}

function calculatePrBadges(name, set) {
  const previous = allLoggedSets(name);
  const badges = [];
  if (!previous.length) return ["First log"];
  if (Number(set.weight) > Math.max(...previous.map((item) => Number(item.weight || 0)))) badges.push("Weight PR");
  if (volumeForSet(set) > Math.max(...previous.map(volumeForSet))) badges.push("Volume PR");
  if (e1rm(set) > Math.max(...previous.map(e1rm))) badges.push("1RM PR");
  return badges;
}

function startRestTimer() {
  const seconds = Math.max(15, Number(els.restSeconds.value || 90));
  restEndsAt = Date.now() + seconds * 1000;
  clearInterval(restTimerId);
  restTimerId = setInterval(updateRestTimer, 250);
  updateRestTimer();
}

function updateRestTimer() {
  if (!restEndsAt) {
    els.restTimer.textContent = "Ready";
    return;
  }
  const remaining = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
  els.restTimer.textContent = remaining ? secondsToClock(remaining) : "Ready";
  if (!remaining) {
    clearInterval(restTimerId);
    restEndsAt = null;
  }
}

function finishWorkout() {
  if (!activeWorkout) return;
  syncActiveWorkoutFields();
  activeWorkout.endedAt = new Date().toISOString();
  activeWorkout.durationSeconds = Math.floor((new Date(activeWorkout.endedAt) - new Date(activeWorkout.startedAt)) / 1000);
  activeWorkout.exercises = activeWorkout.exercises
    .map((exercise) => ({ ...exercise, sets: exercise.sets.filter((set) => set.completed || Number(set.weight) || Number(set.reps)) }))
    .filter((exercise) => exercise.sets.length);
  if (activeWorkout.exercises.length) {
    state.workouts.push(activeWorkout);
    selectedDate = activeWorkout.date;
    calendarMonth = parseISO(selectedDate);
  }
  activeWorkout = null;
  clearInterval(workoutTimerId);
  clearInterval(restTimerId);
  restEndsAt = null;
  setTab("dashboard");
}

function renderExerciseAssist() {
  const name = els.exerciseNameInput.value.trim();
  clear(els.exerciseAssist);
  if (!name) {
    els.exerciseAssist.textContent = "Choose an exercise to see last time and targets.";
    return;
  }
  const history = allLoggedSets(name);
  const target = suggestedTarget(name);
  const parts = [];
  if (history.length) {
    const last = history[history.length - 1];
    parts.push(`Last time: ${formatNumber(last.weight)} lb x ${last.reps} on ${formatDate(last.date)}.`);
  } else {
    parts.push("No history yet.");
  }
  if (target) parts.push(`This week: ${formatNumber(target.weight)} lb x ${target.reps} target.`);
  els.exerciseAssist.textContent = parts.join(" ");
}

function duplicateWorkout(workout) {
  activeWorkout = {
    id: uid(),
    date: todayISO(),
    name: `${workout.name || "Workout"} Copy`,
    startedAt: new Date().toISOString(),
    endedAt: "",
    durationSeconds: 0,
    bodyweight: "",
    notes: "",
    missedTargetNote: "",
    exercises: workout.exercises.map((exercise) => ({
      id: uid(),
      name: exercise.name,
      notes: exercise.notes || "",
      plannedSets: exercise.sets.length,
      plannedReps: exercise.sets[0]?.reps || 1,
      targetWeight: exercise.sets[0]?.weight || 0,
      sets: exercise.sets.map((set) => ({
        id: uid(),
        weight: set.weight,
        reps: set.reps,
        rpe: "",
        completed: false,
        badges: [],
      })),
    })),
  };
  startWorkoutTimer();
  setTab("workout");
}

function renderTemplateSelect() {
  clear(els.workoutTemplateSelect);
  state.templates.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    els.workoutTemplateSelect.appendChild(option);
  });
}

function renderTemplates() {
  renderTemplateDraft();
  clear(els.templateList);
  if (!state.templates.length) {
    els.templateList.appendChild(makeElement("div", "soft-empty", "Create your first template, then start it from the Workout tab."));
    return;
  }
  state.templates.forEach((template) => {
    const card = makeElement("article", "template-card");
    const top = makeElement("div", "card-top");
    const title = makeElement("div");
    title.appendChild(makeElement("p", "exercise-title", template.name));
    title.appendChild(makeElement("div", "meta-line", `${template.exercises.length} exercises`));
    top.appendChild(title);
    const startButton = makeElement("button", "small-button", "Start");
    startButton.type = "button";
    startButton.dataset.action = "start-template";
    startButton.dataset.id = template.id;
    top.appendChild(startButton);
    card.appendChild(top);
    template.exercises.forEach((exercise) => {
      card.appendChild(makeElement("div", "meta-line", `${exercise.name}: ${exercise.plannedSets} x ${exercise.plannedReps} @ ${formatNumber(exercise.startingWeight)} lb${exercise.notes ? ` - ${exercise.notes}` : ""}`));
    });
    const actions = makeElement("div", "meta-line");
    const edit = makeElement("button", "text-button", "Edit");
    edit.type = "button";
    edit.dataset.action = "edit-template";
    edit.dataset.id = template.id;
    const del = makeElement("button", "delete-button", "Delete");
    del.type = "button";
    del.dataset.action = "delete-template";
    del.dataset.id = template.id;
    actions.appendChild(edit);
    actions.appendChild(del);
    card.appendChild(actions);
    els.templateList.appendChild(card);
  });
}

function renderTemplateDraft() {
  clear(els.templateDraftExercises);
  templateDraft.forEach((exercise) => {
    const row = makeElement("div", "assist-card");
    row.textContent = `${exercise.name}: ${exercise.plannedSets} x ${exercise.plannedReps} @ ${formatNumber(exercise.startingWeight)} lb`;
    els.templateDraftExercises.appendChild(row);
  });
}

function addTemplateExercise() {
  const name = els.templateExerciseName.value.trim();
  if (!name) return;
  templateDraft.push(plannedExercise(
    name,
    els.templateSets.value,
    els.templateReps.value,
    els.templateWeight.value,
    els.templateExerciseNotes.value.trim(),
  ));
  els.templateExerciseName.value = "";
  els.templateSets.value = 3;
  els.templateReps.value = 8;
  els.templateWeight.value = 0;
  els.templateExerciseNotes.value = "";
  renderTemplateDraft();
}

function saveTemplate() {
  if (!templateDraft.length) addTemplateExercise();
  const name = els.templateName.value.trim();
  if (!name || !templateDraft.length) return;
  const editingId = els.editingTemplateId.value;
  if (editingId) {
    const existing = state.templates.find((template) => template.id === editingId);
    if (existing) {
      existing.name = name;
      existing.exercises = templateDraft;
    }
  } else {
    state.templates.push(makeTemplate(name, templateDraft));
  }
  resetTemplateForm();
  renderAll();
}

function editTemplate(id) {
  const template = state.templates.find((item) => item.id === id);
  if (!template) return;
  els.editingTemplateId.value = template.id;
  els.templateName.value = template.name;
  templateDraft = template.exercises.map((exercise) => ({ ...exercise, id: uid() }));
  els.cancelTemplateEditButton.classList.remove("is-hidden");
  renderTemplateDraft();
}

function resetTemplateForm() {
  els.editingTemplateId.value = "";
  els.templateName.value = "";
  els.templateExerciseName.value = "";
  els.templateExerciseNotes.value = "";
  els.cancelTemplateEditButton.classList.add("is-hidden");
  templateDraft = [];
}

function renderExerciseSuggestions() {
  clear(els.exerciseSuggestions);
  allExerciseNames().forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    els.exerciseSuggestions.appendChild(option);
  });
}

function renderProgressOptions() {
  const current = els.progressExerciseSelect.value;
  clear(els.progressExerciseSelect);
  const names = allExerciseNames();
  if (!names.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No exercises yet";
    els.progressExerciseSelect.appendChild(option);
    return;
  }
  names.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    els.progressExerciseSelect.appendChild(option);
  });
  if (names.includes(current)) els.progressExerciseSelect.value = current;
}

function renderProgress() {
  const name = els.progressExerciseSelect.value || allExerciseNames()[0] || "";
  if (name) els.progressExerciseSelect.value = name;
  const program = programFor(name);
  if (program) {
    els.programStartWeight.value = program.startWeight;
    els.programIncrease.value = program.weeklyIncreasePct;
    els.programReps.value = program.targetReps;
  }

  const history = allLoggedSets(name);
  const completed = history.filter((set) => set.completed !== false);
  const bestWeight = completed.length ? Math.max(...completed.map((set) => Number(set.weight || 0))) : 0;
  const bestE1rm = completed.length ? Math.max(...completed.map(e1rm)) : 0;
  const bestVolume = completed.length ? Math.max(...completed.map(volumeForSet)) : 0;
  els.bestWeight.textContent = `${formatNumber(bestWeight)} lb`;
  els.bestE1rm.textContent = `${formatNumber(bestE1rm)} lb`;
  els.bestVolume.textContent = `${formatNumber(bestVolume)} lb`;
  const target = suggestedTarget(name);
  els.targetStatus.textContent = target ? `${formatNumber(target.weight)} lb` : "--";
  renderProgressChart(completed, els.chartMetricSelect.value);
  renderProgressHistory(completed);
}

function renderProgressChart(history, metric) {
  clear(els.progressChart);
  if (!history.length) {
    els.progressChart.appendChild(makeElement("div", "soft-empty", "Log this exercise to see the chart update."));
    return;
  }
  const values = history.map((set) => {
    if (metric === "e1rm") return e1rm(set);
    if (metric === "volume") return volumeForSet(set);
    if (metric === "reps") return Number(set.reps || 0);
    return Number(set.weight || 0);
  });
  const max = Math.max(...values, 1);
  const width = 360;
  const height = 210;
  const pad = 28;
  const step = history.length > 1 ? (width - pad * 2) / (history.length - 1) : 0;
  const points = values.map((value, index) => {
    const x = history.length === 1 ? width / 2 : pad + index * step;
    const y = height - pad - (value / max) * (height - pad * 2);
    return `${x},${y}`;
  });
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = `
    <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#cfd8cc" />
    <polyline points="${points.join(" ")}" fill="none" stroke="#177a55" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    ${points.map((point) => {
      const [x, y] = point.split(",");
      return `<circle cx="${x}" cy="${y}" r="5" fill="#105b3f" />`;
    }).join("")}
    <text x="${pad}" y="20">${metricLabel(metric)}</text>
  `;
  els.progressChart.appendChild(svg);
}

function metricLabel(metric) {
  if (metric === "e1rm") return "Estimated 1RM";
  if (metric === "volume") return "Volume";
  if (metric === "reps") return "Reps";
  return "Weight";
}

function renderProgressHistory(history) {
  clear(els.progressHistory);
  if (!history.length) return;
  history.slice().reverse().slice(0, 8).forEach((set) => {
    const row = makeElement("div", "assist-card");
    row.textContent = `${formatDate(set.date)}: ${formatNumber(set.weight)} lb x ${set.reps} (${formatNumber(volumeForSet(set))} lb volume)`;
    els.progressHistory.appendChild(row);
  });
}

function saveProgram() {
  const exercise = els.progressExerciseSelect.value;
  if (!exercise) return;
  state.programs[normalizeName(exercise)] = {
    exercise,
    startWeight: Number(els.programStartWeight.value || 0),
    weeklyIncreasePct: Number(els.programIncrease.value || 2),
    targetReps: Number(els.programReps.value || 1),
    startDate: todayISO(),
  };
  renderAll();
}

function bindEvents() {
  els.navButtons.forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tab)));
  els.previousMonthButton.addEventListener("click", () => {
    calendarMonth.setMonth(calendarMonth.getMonth() - 1);
    renderCalendar();
  });
  els.nextMonthButton.addEventListener("click", () => {
    calendarMonth.setMonth(calendarMonth.getMonth() + 1);
    renderCalendar();
  });
  els.todayMonthButton.addEventListener("click", () => {
    selectedDate = todayISO();
    calendarMonth = parseISO(selectedDate);
    renderCalendar();
  });
  els.calendarGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".calendar-day");
    if (!button) return;
    selectedDate = button.dataset.date;
    renderCalendar();
  });
  els.startForSelectedDateButton.addEventListener("click", () => {
    startWorkout();
    activeWorkout.date = selectedDate;
  });
  els.startWorkoutButton.addEventListener("click", () => els.startOptions.classList.toggle("is-hidden"));
  els.savedTemplatesButton.addEventListener("click", () => setTab("templates"));
  els.startNewWorkoutButton.addEventListener("click", () => startWorkout());
  els.startTemplateWorkoutButton.addEventListener("click", () => startWorkout(els.workoutTemplateSelect.value));
  els.addExerciseToWorkoutButton.addEventListener("click", addExerciseToActiveWorkout);
  els.exerciseNameInput.addEventListener("input", renderExerciseAssist);
  [els.activeWorkoutName, els.activeBodyweight, els.activeNotes, els.missedTargetNote].forEach((input) => {
    input.addEventListener("input", syncActiveWorkoutFields);
  });
  els.activeExerciseList.addEventListener("click", (event) => {
    if (event.target.dataset.action === "complete-set") completeSet(event.target.dataset.exerciseId, event.target.dataset.setId);
  });
  els.startRestButton.addEventListener("click", startRestTimer);
  els.finishWorkoutButton.addEventListener("click", finishWorkout);
  document.addEventListener("click", (event) => {
    if (event.target.dataset.action === "duplicate-last-workout") {
      const recent = [...state.workouts].sort((a, b) => parseISO(b.date) - parseISO(a.date))[0];
      if (recent) duplicateWorkout(recent);
    }
  });
  els.addTemplateExerciseButton.addEventListener("click", addTemplateExercise);
  els.saveTemplateButton.addEventListener("click", saveTemplate);
  els.cancelTemplateEditButton.addEventListener("click", () => {
    resetTemplateForm();
    renderTemplates();
  });
  els.templateList.addEventListener("click", (event) => {
    const { action, id } = event.target.dataset;
    if (action === "start-template") startWorkout(id);
    if (action === "edit-template") editTemplate(id);
    if (action === "delete-template") {
      state.templates = state.templates.filter((template) => template.id !== id);
      renderAll();
    }
  });
  els.progressExerciseSelect.addEventListener("change", renderProgress);
  els.chartMetricSelect.addEventListener("change", renderProgress);
  els.saveProgramButton.addEventListener("click", saveProgram);
}

bindEvents();
renderAll();
