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
  els.todayPlanCard.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='start-scheduled-template']");
    if (button) startWorkout(button.dataset.id);
  });
  els.addExerciseToWorkoutButton.addEventListener("click", addExerciseToActiveWorkout);
  els.exerciseNameInput.addEventListener("input", renderExerciseAssist);
  [els.activeWorkoutName, els.activeBodyweight, els.activeNotes, els.missedTargetNote].forEach((input) => {
    input.addEventListener("input", syncActiveWorkoutFields);
  });
  els.activeExerciseList.addEventListener("click", (event) => {
    const { action, exerciseId, setId } = event.target.dataset;
    if (action === "add-set") addSetToExercise(exerciseId);
    if (action === "delete-set") deleteSetFromExercise(exerciseId, setId);
    if (action === "delete-exercise") deleteExerciseFromWorkout(exerciseId);
  });
  els.activeExerciseList.addEventListener("input", (event) => {
    if (event.target.dataset.field) updateActiveSet(event.target);
  });
  els.activeExerciseList.addEventListener("change", (event) => {
    if (event.target.dataset.action === "toggle-set-complete") {
      toggleSetComplete(event.target.dataset.exerciseId, event.target.dataset.setId, event.target.checked);
    }
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
  els.saveWeeklyPlanButton.addEventListener("click", saveWeeklyPlan);
  els.saveProgramButton.addEventListener("click", saveProgram);
}

bindEvents();
renderAll();
