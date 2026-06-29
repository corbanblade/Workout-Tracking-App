function renderWeeklyPlan() {
  clear(els.weeklyPlanRows);
  if (!els.programStartDate.value) els.programStartDate.value = state.programMeta.startDate || todayISO();
  els.programDefaultIncrease.value = state.programMeta.weeklyIncreasePct ?? 2;
  els.programLengthWeeks.value = state.programMeta.lengthWeeks || 12;
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  days.forEach((day, index) => {
    const row = makeElement("label", "weekly-plan-row");
    row.textContent = day;
    const select = document.createElement("select");
    select.dataset.weekday = String(index);
    const rest = document.createElement("option");
    rest.value = "";
    rest.textContent = "Rest day";
    select.appendChild(rest);
    state.templates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name;
      select.appendChild(option);
    });
    select.value = state.weeklyPlan[String(index)] || "";
    row.appendChild(select);
    els.weeklyPlanRows.appendChild(row);
  });
}

function saveWeeklyPlan() {
  qsa("[data-weekday]").forEach((select) => {
    state.weeklyPlan[select.dataset.weekday] = select.value;
  });
  state.programMeta = {
    startDate: els.programStartDate.value || todayISO(),
    weeklyIncreasePct: Number(els.programDefaultIncrease.value || 2),
    lengthWeeks: Number(els.programLengthWeeks.value || 12),
  };
  Object.values(state.programs).forEach((program) => {
    program.startDate = state.programMeta.startDate;
    program.lengthWeeks = state.programMeta.lengthWeeks;
    if (program.weeklyIncreasePct === undefined || program.weeklyIncreasePct === "") {
      program.weeklyIncreasePct = state.programMeta.weeklyIncreasePct;
    }
  });
  renderAll();
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
  } else {
    els.programStartWeight.value = "";
    els.programIncrease.value = state.programMeta.weeklyIncreasePct || 2;
    els.programReps.value = 5;
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
  els.targetStatus.textContent = target ? progressTargetText(name, target) : "--";
  renderProgressChart(completed, els.chartMetricSelect.value);
  renderProgressHistory(completed);
}

function progressTargetText(name, target) {
  const latestWorkout = [...state.workouts]
    .sort((a, b) => parseISO(b.date) - parseISO(a.date))
    .find((workout) => workout.exercises.some((exercise) => normalizeName(exercise.name) === normalizeName(name)));
  if (!latestWorkout) return `W${target.week}: ${formatNumber(target.weight)} lb`;
  const exercise = latestWorkout.exercises.find((item) => normalizeName(item.name) === normalizeName(name));
  const status = targetStatusForExercise(exercise, latestWorkout.date);
  return `W${target.week}: ${formatNumber(target.weight)} lb · ${status}`;
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
    weeklyIncreasePct: Number(els.programIncrease.value || state.programMeta.weeklyIncreasePct || 2),
    targetReps: Number(els.programReps.value || 1),
    startDate: state.programMeta.startDate || todayISO(),
    lengthWeeks: Number(state.programMeta.lengthWeeks || 12),
  };
  renderAll();
}
