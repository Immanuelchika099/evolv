import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Clock3, Dumbbell, Plus, Sparkles, Trash2, Utensils, X, Droplets, Moon, Pencil, Save, WalletCards, HeartPulse, Apple, BriefcaseBusiness, Brain, Sprout } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './QuickLogSheet.css'
import OptionWheel from './OptionWheel'

function localDateKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function makeId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'draft-' + Date.now() + '-' + Math.random().toString(36).slice(2)
}

function blankSet(number = 1, unit = 'kg') {
  return { id: makeId(), reps: '', weight: '', weight_unit: unit, completed: false, set_number: number }
}

function blankExercise(order = 0, unit = 'kg') {
  return { id: makeId(), name: '', intensity: 'Moderate', sort_order: order, sets: [blankSet(1, unit)] }
}

const workoutTypeOptions = [
  { id: 'chest', label: 'Chest Day' },
  { id: 'back', label: 'Back Day' },
  { id: 'legs', label: 'Leg Day' },
  { id: 'shoulders', label: 'Shoulder Day' },
  { id: 'arms', label: 'Arm Day' },
  { id: 'core', label: 'Core Day' },
  { id: 'full', label: 'Full Body' },
  { id: 'custom', label: 'Custom Workout' },
]

const exercisesByWorkoutType = {
  chest: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Dumbbell Press', 'Chest Fly', 'Cable Crossover', 'Push-ups', 'Dips'],
  back: ['Lat Pulldown', 'Pull-ups', 'Barbell Row', 'Seated Cable Row', 'Single-arm Dumbbell Row', 'Face Pulls', 'Deadlift'],
  legs: ['Back Squat', 'Front Squat', 'Romanian Deadlift', 'Leg Press', 'Walking Lunges', 'Bulgarian Split Squat', 'Leg Extension', 'Leg Curl', 'Calf Raises'],
  shoulders: ['Shoulder Press', 'Dumbbell Shoulder Press', 'Arnold Press', 'Lateral Raises', 'Front Raises', 'Rear Delt Fly', 'Upright Row'],
  arms: ['Barbell Curl', 'Dumbbell Curls', 'Hammer Curls', 'Tricep Pushdown', 'Skull Crushers', 'Overhead Tricep Extension', 'Dips'],
  core: ['Plank', 'Hanging Knee Raises', 'Leg Raises', 'Cable Crunches', 'Russian Twists', 'Bicycle Crunches', 'Ab Wheel Rollout'],
  full: ['Squats', 'Deadlift', 'Bench Press', 'Pull-ups', 'Overhead Press', 'Dumbbell Row', 'Walking Lunges'],
  custom: [],
}

const workoutTypeFromName = (name = '') => {
  const normalized = name.trim().toLowerCase()
  const match = workoutTypeOptions.find(option => option.id !== 'custom' && option.label.toLowerCase() === normalized)
  if (match) return match.id
  const aliases = { chest: 'chest', 'chest workout': 'chest', back: 'back', 'back workout': 'back', legs: 'legs', 'leg day': 'legs', shoulders: 'shoulders', arms: 'arms', 'full body': 'full' }
  return aliases[normalized] || 'custom'
}

const loggingOptions = [
  { id: 'workout', title: 'Workouts', icon: Dumbbell },
  { id: 'meal', title: 'Meals', icon: Utensils },
  { id: 'sleep', title: 'Sleep', icon: Moon },
  { id: 'water', title: 'Water', icon: Droplets },
  { id: 'money', title: 'Money', icon: WalletCards },
  { id: 'ai', title: 'Ask AI', icon: Sparkles },
  { id: 'health', title: 'Health', icon: HeartPulse, color: '#ff8f9d' },
  { id: 'nutrition', title: 'Nutrition', icon: Apple, color: '#ffb84d' },
  { id: 'career', title: 'Career', icon: BriefcaseBusiness, color: 'var(--color-accent-blue)' },
  { id: 'mind', title: 'Mind', icon: Brain, color: 'var(--color-accent-blue)' },
  { id: 'life', title: 'Life', icon: Sprout, color: '#9dd6b0' },
]
const loggingOptionTitles = loggingOptions.map((option) => option.title)

export default function QuickLogSheet({ onClose, onLogWithAI, onLogManual, onSaved, initialScreen = 'menu' }) {
  const [screen, setScreen] = useState(initialScreen)
  const [workouts, setWorkouts] = useState([])
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [workoutName, setWorkoutName] = useState('')
  const [workoutType, setWorkoutType] = useState('chest')
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [weightUnit, setWeightUnit] = useState('kg')
  const [exercises, setExercises] = useState([])
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    // Lock the page behind the sheet, including iOS Safari/PWA where
    // body overflow:hidden alone can still allow the background to move.
    const body = document.body
    const scrollY = window.scrollY
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    }

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    loadWorkouts()
    return () => {
      body.style.overflow = previous.overflow
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.left = previous.left
      body.style.right = previous.right
      body.style.width = previous.width
      window.scrollTo(0, scrollY)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  async function loadWorkouts() {
    setLoading(true)
    setError('')
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const user = authData?.user
    if (authError || !user) {
      setError('Sign in again to view and save workouts.')
      setLoading(false)
      return
    }
    const { data, error: queryError } = await supabase
      .from('workout_logs')
      .select('id,name,workout_date,notes,created_at,workout_exercises(id,name,sort_order,intensity,workout_sets(id,set_number,reps,weight,weight_unit,completed))')
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30)
    if (queryError) {
      setError(queryError.message || 'Could not load your workout history.')
      setWorkouts([])
    } else {
      const ordered = (data || []).map(workout => ({
        ...workout,
        workout_exercises: [...(workout.workout_exercises || [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(exercise => ({
            ...exercise,
            workout_sets: [...(exercise.workout_sets || [])].sort((a, b) => a.set_number - b.set_number),
          })),
      }))
      setWorkouts(ordered)
    }
    setLoading(false)
  }

  function startNewWorkout() {
    setSelectedWorkoutId(null)
    setWorkoutType('chest')
    setWorkoutName('Chest Day')
    setWorkoutNotes('')
    setWeightUnit('kg')
    setExercises([blankExercise(0, 'kg')])
    setError('')
    setNotice('')
    setScreen('editor')
  }

  function editWorkout(workout) {
    setSelectedWorkoutId(workout.id)
    setWorkoutType(workoutTypeFromName(workout.name || ''))
    setWorkoutName(workout.name || '')
    setWorkoutNotes(workout.notes || '')
    const firstSet = workout.workout_exercises?.[0]?.workout_sets?.[0]
    const unit = firstSet?.weight_unit === 'lb' ? 'lb' : 'kg'
    setWeightUnit(unit)
    setExercises((workout.workout_exercises || []).map((exercise, index) => ({
      id: makeId(),
      name: exercise.name || '',
      intensity: ['Light', 'Moderate', 'Heavy'].includes(exercise.intensity) ? exercise.intensity : 'Moderate',
      sort_order: index,
      sets: (exercise.workout_sets || []).map((set, setIndex) => ({
        id: makeId(),
        reps: String(set.reps ?? ''),
        weight: set.weight == null ? '' : String(set.weight),
        weight_unit: set.weight_unit || unit,
        completed: Boolean(set.completed),
        set_number: setIndex + 1,
      })).length ? (exercise.workout_sets || []).map((set, setIndex) => ({
        id: makeId(),
        reps: String(set.reps ?? ''),
        weight: set.weight == null ? '' : String(set.weight),
        weight_unit: set.weight_unit || unit,
        completed: Boolean(set.completed),
        set_number: setIndex + 1,
      })) : [blankSet(1, unit)],
    })))
    setError('')
    setNotice('')
    setScreen('editor')
  }

  function updateExercise(exerciseId, changes) {
    setExercises(current => current.map(exercise => exercise.id === exerciseId ? { ...exercise, ...changes } : exercise))
  }

  function updateSet(exerciseId, setId, changes) {
    setExercises(current => current.map(exercise => exercise.id !== exerciseId ? exercise : ({
      ...exercise,
      sets: exercise.sets.map(set => set.id === setId ? { ...set, ...changes } : set),
    })))
  }

  function changeWeightUnit(nextUnit) {
    if (nextUnit === weightUnit) return
    const factor = nextUnit === 'lb' ? 2.20462262 : 1 / 2.20462262
    setExercises(current => current.map(exercise => ({
      ...exercise,
      sets: exercise.sets.map(set => ({
        ...set,
        weight: set.weight === '' ? '' : String(Math.round(Number(set.weight) * factor * 10) / 10),
        weight_unit: nextUnit,
      })),
    })))
    setWeightUnit(nextUnit)
  }

  function addExercise() {
    setExercises(current => [...current, blankExercise(current.length, weightUnit)])
  }

  function removeExercise(exerciseId) {
    setExercises(current => current.filter(exercise => exercise.id !== exerciseId).map((exercise, index) => ({ ...exercise, sort_order: index })))
  }

  function addSet(exerciseId) {
    setExercises(current => current.map(exercise => exercise.id !== exerciseId ? exercise : ({
      ...exercise,
      sets: [...exercise.sets, blankSet(exercise.sets.length + 1, weightUnit)],
    })))
  }

  function removeSet(exerciseId, setId) {
    setExercises(current => current.map(exercise => exercise.id !== exerciseId ? exercise : ({
      ...exercise,
      sets: exercise.sets.filter(set => set.id !== setId).map((set, index) => ({ ...set, set_number: index + 1 })),
    })))
  }

  async function saveWorkout(event) {
    event?.preventDefault()
    if (saving) return
    const name = workoutName.trim()
    if (!name) {
      setError('Give this workout a name first.')
      return
    }
    const normalizedExercises = exercises
      .filter(exercise => exercise.name.trim())
      .map(exercise => {
        const enteredSets = exercise.sets.filter(set => String(set.reps).trim() !== '' || String(set.weight).trim() !== '' || set.completed)
        return {
          name: exercise.name.trim(),
          intensity: exercise.intensity || 'Moderate',
          sets: enteredSets.map(set => ({
            reps: Number(set.reps),
            weight: String(set.weight).trim() === '' ? null : Number(set.weight),
            weight_unit: set.weight_unit || weightUnit,
            completed: Boolean(set.completed),
          })),
        }
      })

    if (!normalizedExercises.length) {
      setError('Add at least one named exercise, such as Bench Press.')
      return
    }
    if (normalizedExercises.some(exercise => !exercise.sets.length)) {
      setError('Add reps for at least one set under every exercise.')
      return
    }
    if (normalizedExercises.some(exercise => exercise.sets.some(set =>
      !Number.isInteger(set.reps) || set.reps < 1 ||
      (set.weight !== null && (!Number.isFinite(set.weight) || set.weight < 0))
    ))) {
      setError('Each set needs a positive rep count. Weight is optional and cannot be negative.')
      return
    }
    if (normalizedExercises.length > 30 || normalizedExercises.some(exercise => exercise.sets.length > 30)) {
      setError('Keep each workout to 30 exercises and 30 sets per exercise.')
      return
    }

    setSaving(true)
    setError('')
    const { data, error: saveError } = await supabase.rpc('save_workout_log', {
      p_workout_id: selectedWorkoutId,
      p_name: name,
      p_workout_date: selectedWorkoutId ? (selectedWorkout?.workout_date || localDateKey()) : localDateKey(),
      p_notes: workoutNotes.trim() || null,
      p_exercises: normalizedExercises,
    })
    setSaving(false)

    if (saveError) {
      setError(saveError.message || 'Could not save this workout. Please try again.')
      return
    }

    setNotice(selectedWorkoutId ? 'Workout updated.' : 'Workout saved.')
    setScreen('workouts')
    await loadWorkouts()
    onSaved?.(data)
    window.dispatchEvent(new Event('evolv-tracking-updated'))
  }

  function openCategory(option) {
    setError('')
    setNotice('')
    if (option.id === 'workout') {
      setScreen('workouts')
      return
    }
    if (option.id === 'ai') {
      onLogWithAI('Help me log something in Evolv. Ask what I want to record, one question at a time, and save it only when you have enough information. Keep the conversation simple and do not show me a generic form.')
      return
    }
    if (['meal', 'sleep', 'water', 'money', 'health', 'nutrition', 'career', 'mind', 'life'].includes(option.id)) {
      onLogManual?.(option.id)
    }
  }

  async function deleteWorkout(workout) {
    if (!workout?.id || deleteBusy) return
    if (!window.confirm('Delete this workout and all of its exercises and sets?')) return
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) {
      setError('Sign in again to delete this workout.')
      return
    }
    setDeleteBusy(true)
    const { error: deleteError } = await supabase.from('workout_logs').delete().eq('id', workout.id).eq('user_id', userId)
    setDeleteBusy(false)
    if (deleteError) {
      setError(deleteError.message || 'Could not delete that workout.')
      return
    }
    setSelectedWorkoutId(null)
    setScreen('workouts')
    setNotice('Workout deleted.')
    await loadWorkouts()
    window.dispatchEvent(new Event('evolv-tracking-updated'))
  }

  function closeEditor() {
    if (screen === 'editor' && (workoutName.trim() || exercises.some(exercise => exercise.name.trim()))) {
      if (!window.confirm('Discard these workout changes?')) return
    }
    setError('')
    setScreen('workouts')
  }

  const selectedWorkout = workouts.find(workout => workout.id === selectedWorkoutId)
  const totals = useMemo(() => {
    const activeExercises = exercises.filter(exercise => exercise.name.trim())
    const populatedSets = activeExercises.flatMap(exercise => exercise.sets.filter(set =>
      String(set.reps).trim() !== '' || String(set.weight).trim() !== '' || set.completed
    ))
    const repsDone = populatedSets.reduce((sum, set) => sum + (Number(set.reps) || 0), 0)
    const volume = populatedSets.reduce((sum, set) => sum + ((Number(set.weight) || 0) * (Number(set.reps) || 0)), 0)
    return { exercisesCount: activeExercises.length, setsCount: populatedSets.length, repsDone, volume }
  }, [exercises])
  const suggestedExercises = exercisesByWorkoutType[workoutType] || []

  return (
    <div className={"quick-log-overlay" + (screen === 'menu' ? ' quick-log-wheel-mode' : ' quick-log-overlay-page')} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      {screen === 'menu' && <button type="button" className="quick-log-wheel-close" onClick={onClose} aria-label="Close log menu"><X size={19} strokeWidth={2} /></button>}
      <section className="quick-log-sheet" role="dialog" aria-modal="true" aria-labelledby="quick-log-title">
        <div className="quick-log-handle" />
        <header className="quick-log-header">
          <div className="quick-log-header-copy">
            {screen !== 'menu' && <button type="button" className="quick-log-back" onClick={() => screen === 'editor' ? closeEditor() : screen === 'detail' ? setScreen('workouts') : setScreen('menu')} aria-label="Go back"><ArrowLeft size={18} /></button>}
            <div>
              
              <h2 id="quick-log-title">{screen === 'menu' ? 'Log something' : screen === 'workouts' ? 'Workouts' : screen === 'editor' ? 'Workout Overview' : 'Workout details'}</h2>
            </div>
          </div>
          <button type="button" className="quick-log-close" onClick={onClose} aria-label="Close log sheet"><X size={19} /></button>
        </header>

        {screen === 'menu' && (
          <div className="quick-log-content quick-log-menu">
            <OptionWheel
              items={loggingOptionTitles}
              defaultSelected={2}
              textColor="#a6a6a6"
              activeColor="#ffffff"
              side="right"
              fontSize={4}
              spacing={1.22}
              curve={1.8}
              tilt={7.2}
              blur={1.4}
              fade={0.2}
              smoothing={165}
              inset={18}
              loop={false}
              draggable
              soundUrl=""
              soundVolume={0.05}
              onChange={(index) => openCategory(loggingOptions[index])}
            />
          </div>
        )}

        {screen === 'workouts' && (
          <div className="quick-log-content">
            {notice && <p className="quick-log-notice" role="status"><CheckCircle2 size={15} />{notice}</p>}
            {error && <p className="quick-log-error" role="alert">{error}</p>}
            {loading ? <div className="quick-log-loading"><span className="quick-log-spinner" /> Loading your workouts…</div> :
              workouts.length ? <div className="quick-log-history">
                {workouts.map(workout => {
                  const exerciseCount = workout.workout_exercises?.length || 0
                  const setCount = (workout.workout_exercises || []).reduce((sum, exercise) => sum + (exercise.workout_sets?.length || 0), 0)
                  return <button type="button" className="quick-log-history-row" key={workout.id} onClick={() => { setSelectedWorkoutId(workout.id); setScreen('detail'); setError('') }}>
                    <span className="quick-log-history-icon"><Dumbbell size={18} /></span>
                    <span className="quick-log-history-copy"><strong>{workout.name}</strong><small>{new Date(workout.workout_date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'} · {setCount} {setCount === 1 ? 'set' : 'sets'}</small></span>
                    <ChevronRight size={18} />
                  </button>
                })}
              </div> : <div className="quick-log-empty"><Dumbbell size={25} /><strong>No workouts yet</strong><button type="button" className="quick-log-primary" onClick={startNewWorkout}><Plus size={17} /> New workout</button></div>}
            <div className="quick-log-workout-bottom-action">
              <button type="button" className="quick-log-primary" onClick={startNewWorkout}><Plus size={17} /> Add workout</button>
            </div>
          </div>
        )}

        {screen === 'editor' && (
          <form className="quick-log-content quick-log-editor" onSubmit={saveWorkout}>
            <section className="quick-log-workout-totals" aria-label="Workout totals">
              <div className="quick-log-workout-totals-heading"><span>YOUR TOTALS</span><small>{totals.exercisesCount} {totals.exercisesCount === 1 ? 'exercise' : 'exercises'}</small></div>
              <div className="quick-log-workout-totals-card">
                <div><Dumbbell size={19} aria-hidden="true" /><span>VOLUME</span><strong>{Math.round(totals.volume * 10) / 10} {weightUnit === 'lb' ? 'lb' : 'Kg'}</strong></div>
                <div><Sparkles size={19} aria-hidden="true" /><span>REPS DONE</span><strong>{totals.repsDone}</strong></div>
                <div><CheckCircle2 size={19} aria-hidden="true" /><span>SETS</span><strong>{totals.setsCount}</strong></div>
              </div>
            </section>
            <div className="quick-log-workout-fields">
              <label className="quick-log-field quick-log-workout-type"><span>Workout type</span><select value={workoutType} onChange={event => {
                const nextType = event.target.value
                setWorkoutType(nextType)
                if (nextType !== 'custom') setWorkoutName(workoutTypeOptions.find(option => option.id === nextType)?.label || 'Workout')
                else setWorkoutName('')
              }}>{workoutTypeOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
              {workoutType === 'custom' && <label className="quick-log-field quick-log-workout-name"><span>Workout name</span><input autoComplete="off" maxLength={120} value={workoutName} onChange={event => setWorkoutName(event.target.value)} placeholder="e.g. Upper body session" required /></label>}
              <div className="quick-log-field-row">
                <label className="quick-log-field quick-log-unit-field"><span>Weight unit</span><select value={weightUnit} onChange={event => changeWeightUnit(event.target.value)}><option value="kg">Kilograms (kg)</option><option value="lb">Pounds (lb)</option></select></label>
              </div>
            </div>

            <div className="quick-log-exercises-heading"><h3>Recorded Exercises</h3></div>
            <div className="quick-log-exercises">
              {exercises.map((exercise, exerciseIndex) => (
                <section className="quick-log-exercise" key={exercise.id}>
                  <div className="quick-log-exercise-heading">
                    <span className="quick-log-exercise-number">{String(exerciseIndex + 1).padStart(2, '0')}</span>
                    <label className="quick-log-exercise-name"><span className="sr-only">Exercise name</span><input autoComplete="off" list={`quick-log-exercise-options-${workoutType}`} maxLength={120} value={exercise.name} onChange={event => updateExercise(exercise.id, { name: event.target.value })} placeholder={workoutType === 'custom' ? 'Enter exercise name' : 'Choose or type an exercise'} /><datalist id={`quick-log-exercise-options-${workoutType}`}>{suggestedExercises.map(name => <option key={name} value={name} />)}</datalist></label>
                    <button type="button" className="quick-log-icon-button" onClick={() => removeExercise(exercise.id)} disabled={exercises.length === 1} aria-label="Remove exercise"><Trash2 size={16} /></button>
                  </div>
                  <div className="quick-log-intensity-row">
                    <span>Intensity</span>
                    <label className="quick-log-intensity-control">
                      <span className="sr-only">Exercise intensity</span>
                      <select value={exercise.intensity || 'Moderate'} onChange={event => updateExercise(exercise.id, { intensity: event.target.value })} aria-label={`Intensity for ${exercise.name || 'exercise ' + (exerciseIndex + 1)}`}>
                        <option value="Light">Light</option><option value="Moderate">Moderate</option><option value="Heavy">Heavy</option>
                      </select>
                      <ChevronRight size={13} aria-hidden="true" />
                    </label>
                  </div>
                  <div className="quick-log-set-head"><span>Set</span><span>Weight ({weightUnit})</span><span>Reps</span><span>Done</span></div>
                  <div className="quick-log-set-list">
                    {exercise.sets.map((set, setIndex) => (
                      <div className={'quick-log-set-row' + (set.completed ? ' is-complete' : '')} key={set.id}>
                        <span className="quick-log-set-number">{setIndex + 1}</span>
                        <label className="quick-log-number-field"><span className="sr-only">Weight in {weightUnit}</span><input type="number" min="0" step="0.5" inputMode="decimal" value={set.weight} onChange={event => updateSet(exercise.id, set.id, { weight: event.target.value })} placeholder="—" /></label>
                        <label className="quick-log-number-field"><span className="sr-only">Reps</span><input type="number" min="1" step="1" inputMode="numeric" value={set.reps} onChange={event => updateSet(exercise.id, set.id, { reps: event.target.value })} placeholder="10" /></label>
                        <button type="button" className={'quick-log-set-done' + (set.completed ? ' is-complete' : '')} onClick={() => updateSet(exercise.id, set.id, { completed: !set.completed })} aria-label={set.completed ? 'Mark set incomplete' : 'Mark set complete'} aria-pressed={set.completed}>{set.completed ? <Check size={16} /> : <span />}</button>
                        {exercise.sets.length > 1 && <button type="button" className="quick-log-remove-set" onClick={() => removeSet(exercise.id, set.id)} aria-label={'Remove set ' + (setIndex + 1)}><X size={14} /></button>}
                      </div>
                    ))}
                  </div>
                  <button type="button" className="quick-log-add-set" onClick={() => addSet(exercise.id)}><Plus size={15} /> Add set</button>
                </section>
              ))}
            </div>

            <button type="button" className="quick-log-add-exercise" onClick={addExercise}><Plus size={17} /> Add exercise</button>

            {error && <p className="quick-log-error" role="alert">{error}</p>}
            <footer className="quick-log-editor-footer">
              <div><strong>{totals.setsCount}</strong><span>sets</span></div>
              <button type="submit" className="quick-log-primary" disabled={saving}>{saving ? <span className="quick-log-spinner" /> : <Save size={17} />}{saving ? 'Saving…' : 'Finish'}</button>
            </footer>
          </form>
        )}

        {screen === 'detail' && selectedWorkout && (
          <div className="quick-log-content quick-log-detail">
            <div className="quick-log-detail-date"><Clock3 size={15} />{new Date(selectedWorkout.workout_date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
            {selectedWorkout.notes && <p className="quick-log-detail-notes">{selectedWorkout.notes}</p>}
            {(selectedWorkout.workout_exercises || []).map((exercise, index) => (
              <section className="quick-log-detail-exercise" key={exercise.id}>
                <div><span>EXERCISE {String(index + 1).padStart(2, '0')}</span><h3>{exercise.name}</h3><small className={'quick-log-detail-intensity intensity-' + (exercise.intensity || 'Moderate').toLowerCase()}>{exercise.intensity || 'Moderate'} intensity</small></div>
                <div className="quick-log-detail-sets">
                  {(exercise.workout_sets || []).map(set => <div key={set.id} className={'quick-log-detail-set' + (set.completed ? ' is-complete' : '')}><span>{set.completed ? <Check size={14} /> : set.set_number}</span><strong>{set.weight == null ? 'Bodyweight' : set.weight + ' ' + set.weight_unit}</strong><small>{set.reps} reps</small></div>)}
                </div>
              </section>
            ))}
            <div className="quick-log-detail-actions">
              <button type="button" className="quick-log-secondary-danger" onClick={() => deleteWorkout(selectedWorkout)} disabled={deleteBusy}><Trash2 size={16} />{deleteBusy ? 'Deleting…' : 'Delete'}</button>
              <button type="button" className="quick-log-primary" onClick={() => editWorkout(selectedWorkout)}><Pencil size={16} /> Edit workout</button>
            </div>
          </div>
        )}

      </section>
    </div>
  )
}
