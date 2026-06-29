# Workout Planner

A mobile-first workout tracker and progressive overload planner built with plain HTML, CSS, and JavaScript.

## What it does

- Feels like a simple iPhone gym app with bottom navigation
- Tracks dashboard stats for the week, month, streaks, and recent PRs
- Logs active workouts with a timer, rest timer, notes, bodyweight, sets, reps, weight, and optional RPE
- Starts workouts from templates, then lets you edit weight, reps, RPE, sets, and exercises during the workout
- Saves workout history by date in a monthly calendar
- Creates, edits, deletes, reviews, and starts saved workout templates
- Includes default templates like Leg Day A/B, Upper Day A/B, Push Day, and Pull Day
- Saves a repeating weekly plan, such as an upper/lower four-day split
- Tracks exercise history over time
- Shows last-time performance and suggested targets while adding exercises
- Supports 12-week progression targets with an editable weekly increase
- Keeps the same target after a miss and increases next week after a hit
- Rounds suggested weights to the nearest 5 lb
- Adds PR badges for best weight, best volume, and estimated 1-rep max
- Draws lightweight SVG progress charts without external libraries

## How to open it

Open `index.html` in a web browser, or deploy the static files to a host like Vercel.

No installation is required. Data is saved in local storage on the device/browser you use.

## Data note

This version intentionally keeps everything local. There is no login, backend, database, or paid API.
