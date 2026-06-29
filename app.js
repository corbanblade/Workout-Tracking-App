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
  todayPlanCard: qs("#todayPlanCard"),
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
  weeklyPlanRows: qs("#weeklyPlanRows"),
  saveWeeklyPlanButton: qs("#saveWeeklyPlanButton"),
  programStartDate: qs("#programStartDate"),
  programDefaultIncrease: qs("#programDefaultIncrease"),
  programLengthWeeks: qs("#programLengthWeeks"),
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
    weeklyPlan: defaultWeeklyPlan(),
    programMeta: defaultProgramMeta(),
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
    weeklyPlan: data.weeklyPlan || defaultWeeklyPlan(),
    programMeta: data.programMeta || defaultProgramMeta(),
  });
}

function normalizeState(data) {
  return {
    workouts: data.workouts || [],
    templates: data.templates && data.templates.length ? data.templates.map(normalizeTemplate) : defaultTemplates(),
    programs: data.programs || {},
    weeklyPlan: { ...defaultWeeklyPlan(), ...(data.weeklyPlan || {}) },
    programMeta: { ...defaultProgramMeta(), ...(data.programMeta || {}) },
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

function defaultWeeklyPlan() {
  return {
    0: "",
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
    6: "",
  };
}

function defaultProgramMeta() {
  return {
    startDate: todayISO(),
    weeklyIncreasePct: 2,
    lengthWeeks: 12,
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
  const startDate = program.startDate || state.programMeta.startDate || todayISO();
  const length = Number(program.lengthWeeks || state.programMeta.lengthWeeks || 12);
  const elapsed = parseISO(dateISO) - parseISO(startDate);
  return Math.min(length, Math.max(1, Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000)) + 1));
}

function suggestedTarget(name, dateISO = todayISO()) {
  const program = programFor(name);
  if (!program) return null;
  const week = programWeek(program, dateISO);
  const weeklyIncreasePct = Number(program.weeklyIncreasePct ?? state.programMeta.weeklyIncreasePct ?? 2);
  const raw = targetWeightForWeek(name, program, week);
  return {
    week,
    weight: roundToFive(raw),
    reps: Number(program.targetReps || 1),
    program: { ...program, weeklyIncreasePct },
  };
}

function targetWeightForWeek(name, program, week) {
  let target = roundToFive(program.startWeight || 0);
  const increase = Number(program.weeklyIncreasePct ?? state.programMeta.weeklyIncreasePct ?? 2);
  for (let currentWeek = 1; currentWeek < week; currentWeek += 1) {
    if (exerciseHitTargetInWeek(name, program, currentWeek, target)) {
      target = roundToFive(target * (1 + increase / 100));
    }
  }
  return target;
}

function exerciseHitTargetInWeek(name, program, week, targetWeight) {
  const targetReps = Number(program.targetReps || 1);
  return allLoggedSets(name).some((set) => {
    if (programWeek(program, set.date) !== week) return false;
    return set.completed !== false && Number(set.weight || 0) >= targetWeight && Number(set.reps || 0) >= targetReps;
  });
}

function scheduledTemplateForDate(dateISO = todayISO()) {
  const day = parseISO(dateISO).getDay();
  const templateId = state.weeklyPlan[String(day)] || "";
  return state.templates.find((template) => template.id === templateId) || null;
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
  renderWeeklyPlan();
  renderProgressOptions();
  renderProgress();
  saveState();
}
