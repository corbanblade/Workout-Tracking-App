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
  els.activeProgramSummary.appendChild(makeElement("div", "assist-card", `${Number(state.programMeta.lengthWeeks || 12)}-week program started ${formatDate(state.programMeta.startDate || todayISO())}. Default increase: ${formatNumber(state.programMeta.weeklyIncreasePct || 2)}%.`));
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
  renderTodayPlanCard();
  if (!activeWorkout) return;

  els.activeWorkoutName.value = activeWorkout.name;
  els.activeBodyweight.value = activeWorkout.bodyweight;
  els.activeNotes.value = activeWorkout.notes;
  els.missedTargetNote.value = activeWorkout.missedTargetNote;
  updateWorkoutTimer();
  renderActiveExercises();
}

function renderTodayPlanCard() {
  clear(els.todayPlanCard);
  const scheduled = scheduledTemplateForDate(selectedDate || todayISO());
  const title = makeElement("div", "panel-heading");
  const text = makeElement("div");
  text.appendChild(makeElement("h3", "", "Today’s plan"));
  text.appendChild(makeElement("div", "meta-line", scheduled ? `${formatDate(selectedDate || todayISO())}: ${scheduled.name}` : "No template scheduled for this day."));
  title.appendChild(text);
  if (scheduled) {
    const button = makeElement("button", "small-button", "Start");
    button.type = "button";
    button.dataset.action = "start-scheduled-template";
    button.dataset.id = scheduled.id;
    title.appendChild(button);
  }
  els.todayPlanCard.appendChild(title);
}

function startWorkout(templateId = "") {
  const template = state.templates.find((item) => item.id === templateId);
  const workoutDate = selectedDate || todayISO();
  activeWorkout = {
    id: uid(),
    date: workoutDate,
    name: template ? template.name : "Workout",
    startedAt: new Date().toISOString(),
    endedAt: "",
    durationSeconds: 0,
    bodyweight: "",
    notes: "",
    missedTargetNote: "",
    exercises: template ? template.exercises.map((exercise) => exerciseFromTemplate(exercise, workoutDate)) : [],
  };
  els.startOptions.classList.add("is-hidden");
  startWorkoutTimer();
  setTab("workout");
}

function exerciseFromTemplate(item, workoutDate = todayISO()) {
  const target = suggestedTarget(item.name, workoutDate);
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
    const actions = makeElement("div", "exercise-actions");
    const status = targetStatusForExercise(exercise, activeWorkout.date);
    if (status) actions.appendChild(makeElement("span", "pill", status));
    const deleteExercise = makeElement("button", "delete-button", "Delete");
    deleteExercise.type = "button";
    deleteExercise.dataset.action = "delete-exercise";
    deleteExercise.dataset.exerciseId = exercise.id;
    actions.appendChild(deleteExercise);
    top.appendChild(actions);
    card.appendChild(top);

    const setList = makeElement("div", "set-list");
    exercise.sets.forEach((set, index) => {
      const row = makeElement("div", "set-row");
      row.classList.toggle("is-complete", set.completed);
      row.dataset.exerciseId = exercise.id;
      row.dataset.setId = set.id;
      const setNumber = makeElement("strong", "set-number", `Set ${index + 1}`);
      row.appendChild(setNumber);

      row.appendChild(setInput("Weight", "weight", set.weight, "0.5"));
      row.appendChild(setInput("Reps", "reps", set.reps, "1"));
      row.appendChild(setInput("RPE", "rpe", set.rpe, "0.5", "Optional"));

      const completeLabel = makeElement("label", "complete-toggle");
      const complete = document.createElement("input");
      complete.type = "checkbox";
      complete.checked = Boolean(set.completed);
      complete.dataset.action = "toggle-set-complete";
      complete.dataset.exerciseId = exercise.id;
      complete.dataset.setId = set.id;
      completeLabel.appendChild(complete);
      completeLabel.appendChild(document.createTextNode("Done"));
      row.appendChild(completeLabel);

      const deleteSet = makeElement("button", "delete-button", "Delete Set");
      deleteSet.type = "button";
      deleteSet.dataset.action = "delete-set";
      deleteSet.dataset.exerciseId = exercise.id;
      deleteSet.dataset.setId = set.id;
      row.appendChild(deleteSet);

      const badges = makeElement("div", "meta-line set-badges");
      if (set.rpe) badges.appendChild(makeElement("span", "pill", `RPE ${set.rpe}`));
      (set.badges || []).forEach((badge) => badges.appendChild(makeElement("span", "pr-badge", badge)));
      row.appendChild(badges);
      setList.appendChild(row);
    });
    card.appendChild(setList);
    const addSet = makeElement("button", "secondary-action compact", "Add Set");
    addSet.type = "button";
    addSet.dataset.action = "add-set";
    addSet.dataset.exerciseId = exercise.id;
    card.appendChild(addSet);
    els.activeExerciseList.appendChild(card);
  });
}

function setInput(label, field, value, step, placeholder = "") {
  const wrap = makeElement("label", "set-field");
  wrap.textContent = label;
  const input = document.createElement("input");
  input.type = "number";
  input.min = field === "rpe" ? "1" : "0";
  input.max = field === "rpe" ? "10" : "";
  input.step = step;
  input.value = value || "";
  input.placeholder = placeholder;
  input.dataset.field = field;
  wrap.appendChild(input);
  return wrap;
}

function findActiveExercise(exerciseId) {
  return activeWorkout?.exercises.find((item) => item.id === exerciseId);
}

function findActiveSet(exerciseId, setId) {
  const exercise = findActiveExercise(exerciseId);
  return { exercise, set: exercise?.sets.find((item) => item.id === setId) };
}

function updateActiveSet(input) {
  const row = input.closest(".set-row");
  if (!row) return;
  const { exercise, set } = findActiveSet(row.dataset.exerciseId, row.dataset.setId);
  if (!exercise || !set) return;
  const field = input.dataset.field;
  set[field] = field === "rpe" ? input.value : Number(input.value || 0);
  if (set.completed) set.badges = calculatePrBadges(exercise.name, set);
}

function toggleSetComplete(exerciseId, setId, completed) {
  const exercise = activeWorkout.exercises.find((item) => item.id === exerciseId);
  const set = exercise?.sets.find((item) => item.id === setId);
  if (!exercise || !set) return;
  set.completed = completed;
  set.badges = completed ? calculatePrBadges(exercise.name, set) : [];
  if (completed) startRestTimer();
  renderWorkout();
}

function addSetToExercise(exerciseId) {
  const exercise = findActiveExercise(exerciseId);
  if (!exercise) return;
  const previous = exercise.sets[exercise.sets.length - 1] || { weight: exercise.targetWeight || 0, reps: exercise.plannedReps || 1, rpe: "" };
  exercise.sets.push({
    id: uid(),
    weight: Number(previous.weight || 0),
    reps: Number(previous.reps || 1),
    rpe: previous.rpe || "",
    completed: false,
    badges: [],
  });
  exercise.plannedSets = exercise.sets.length;
  renderWorkout();
}

function deleteSetFromExercise(exerciseId, setId) {
  const exercise = findActiveExercise(exerciseId);
  if (!exercise) return;
  exercise.sets = exercise.sets.filter((set) => set.id !== setId);
  exercise.plannedSets = exercise.sets.length;
  renderWorkout();
}

function deleteExerciseFromWorkout(exerciseId) {
  if (!activeWorkout) return;
  activeWorkout.exercises = activeWorkout.exercises.filter((exercise) => exercise.id !== exerciseId);
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
