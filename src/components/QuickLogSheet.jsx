import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Clock3, Dumbbell, Plus, Sparkles, Trash2, Utensils, X, Droplets, Moon, Pencil, Save, MoreHorizontal, WalletCards, HeartPulse, Apple, BriefcaseBusiness, Brain, Sprout } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './QuickLogSheet.css'

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
  return { id: makeId(), name: '', sort_order: order, sets: [blankSet(1, unit)] }
}

const loggingOptions = [
  { id: 'workout', title: 'Workout', icon: Dumbbell },
  { id: 'meal', title: 'Meal', icon: Utensils },
  { id: 'sleep', title: 'Sleep', icon: Moon },
  { id: 'water', title: 'Water', icon: Droplets },
  { id: 'money', title: 'Money', icon: WalletCards },
  { id: 'more', title: 'More', icon: MoreHorizontal },
  { id: 'ai', title: 'Ask AI', icon: Sparkles },
]

export default function QuickLogSheet({ onClose, onLogWithAI, onLogManual, onSaved, initialScreen = 'menu' }) {
  const [screen, setScreen] = useState(initialScreen)
  const [workouts, setWorkouts] = useState([])
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [workoutName, setWorkoutName] = useState('')
  const [workoutDate, setWorkoutDate] = useState(localDateKey())
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [weightUnit, setWeightUnit] = useState('kg')
  const [exercises, setExercises] = useState([])
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)

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
      .select('id,name,workout_date,notes,created_at,workout_exercises(id,name,sort_order,workout_sets(id,set_number,reps,weight,weight_unit,completed))')
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
    setWorkoutName('')
    setWorkoutDate(localDateKey())
    setWorkoutNotes('')
    setWeightUnit('kg')
    setExercises([blankExercise(0, 'kg')])
    setError('')
    setNotice('')
    setScreen('editor')
  }

  function editWorkout(workout) {
    setSelectedWorkoutId(workout.id)
    setWorkoutName(workout.name || '')
    setWorkoutDate(workout.workout_date || localDateKey())
    setWorkoutNotes(workout.notes || '')
    const firstSet = workout.workout_exercises?.[0]?.workout_sets?.[0]
    const unit = firstSet?.weight_unit === 'lb' ? 'lb' : 'kg'
    setWeightUnit(unit)
    setExercises((workout.workout_exercises || []).map((exercise, index) => ({
      id: makeId(),
      name: exercise.name || '',
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
    if (!workoutDate) {
      setError('Choose the date of this workout.')
      return
    }

    const normalizedExercises = exercises
      .filter(exercise => exercise.name.trim())
      .map(exercise => {
        const enteredSets = exercise.sets.filter(set => String(set.reps).trim() !== '' || String(set.weight).trim() !== '' || set.completed)
        return {
          name: exercise.name.trim(),
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
      p_workout_date: workoutDate,
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
    if (option.id === 'more') {
      setShowMoreOptions(true)
      return
    }
    if (['meal', 'sleep', 'water', 'money'].includes(option.id)) {
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
    const exercisesCount = exercises.filter(exercise => exercise.name.trim()).length
    const setsCount = exercises.filter(exercise => exercise.name.trim()).reduce((sum, exercise) => sum + exercise.sets.length, 0)
    return { exercisesCount, setsCount }
  }, [exercises])

  return (
    <div className={"quick-log-overlay" + (screen !== 'menu' ? ' quick-log-overlay-page' : '')} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className="quick-log-sheet" role="dialog" aria-modal="true" aria-labelledby="quick-log-title">
        <div className="quick-log-handle" />
        <header className="quick-log-header">
          <div className="quick-log-header-copy">
            {screen !== 'menu' && <button type="button" className="quick-log-back" onClick={() => screen === 'editor' ? closeEditor() : screen === 'detail' ? setScreen('workouts') : setScreen('menu')} aria-label="Go back"><ArrowLeft size={18} /></button>}
            <div>
              
              <h2 id="quick-log-title">{screen === 'menu' ? 'Log something' : screen === 'workouts' ? 'Workouts' : screen === 'editor' ? (selectedWorkoutId ? 'Edit workout' : 'New workout') : 'Workout details'}</h2>
            </div>
          </div>
          <button type="button" className="quick-log-close" onClick={onClose} aria-label="Close log sheet"><X size={19} /></button>
        </header>

        {screen === 'menu' && (
          <div className="quick-log-content quick-log-menu">
                        <div className="quick-log-options">
              {loggingOptions.map(option => {
                if (option.id === 'more') {
                  if (showMoreOptions) {
                    return [
                      { id: 'health', title: 'Health', icon: HeartPulse, color: '#ff8f9d' },
                      { id: 'nutrition', title: 'Nutrition', icon: Apple, color: '#ffb84d' },
                      { id: 'career', title: 'Career', icon: BriefcaseBusiness, color: '#63c8ff' },
                      { id: 'mind', title: 'Mind', icon: Brain, color: '#b6a2ff' },
                      { id: 'life', title: 'Life', icon: Sprout, color: '#9dd6b0' },
                    ].map(extra => {
                      const Icon = extra.icon
                      return <button type="button" className={"quick-log-option quick-log-option-" + extra.id} key={extra.id} onClick={() => onLogManual?.(extra.id)}>
                        <span className="quick-log-option-icon" style={{ color: extra.color, backgroundColor: extra.color + '24' }}><Icon size={20} stroke={extra.color} color={extra.color} strokeWidth={1.8} /></span>
                        <span className="quick-log-option-copy"><strong>{extra.title}</strong></span>
                        <ChevronRight size={18} className="quick-log-chevron" />
                      </button>
                    })
                  }
                  const Icon = option.icon
                  return <button type="button" className="quick-log-option quick-log-option-more" key={option.id} onClick={() => openCategory(option)}>
                    <span className="quick-log-option-icon"><Icon size={20} strokeWidth={1.8} /></span>
                    <span className="quick-log-option-copy"><strong>More</strong></span>
                    <ChevronRight size={18} className="quick-log-chevron" />
                  </button>
                }
                const Icon = option.icon
                return <button type="button" className={"quick-log-option quick-log-option-" + option.id} key={option.id} onClick={() => openCategory(option)}>
                  <span className="quick-log-option-icon"><Icon size={20} strokeWidth={1.8} /></span>
                  <span className="quick-log-option-copy"><strong>{option.title}</strong></span>
                  <ChevronRight size={18} className="quick-log-chevron" />
                </button>
              })}
            </div>
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
            <div className="quick-log-workout-fields">
              <label className="quick-log-field quick-log-workout-name"><span>Workout name</span><input autoComplete="off" maxLength={120} value={workoutName} onChange={event => setWorkoutName(event.target.value)} placeholder="e.g. Chest day" required /></label>
              <div className="quick-log-field-row">
                <label className="quick-log-field"><span>Date</span><input type="date" value={workoutDate} onChange={event => setWorkoutDate(event.target.value)} required /></label>
                <label className="quick-log-field quick-log-unit-field"><span>Weight unit</span><select value={weightUnit} onChange={event => changeWeightUnit(event.target.value)}><option value="kg">Kilograms (kg)</option><option value="lb">Pounds (lb)</option></select></label>
              </div>
            </div>

            <div className="quick-log-exercises-heading"><h3>Exercises</h3></div>
            <div className="quick-log-exercises">
              {exercises.map((exercise, exerciseIndex) => (
                <section className="quick-log-exercise" key={exercise.id}>
                  <div className="quick-log-exercise-heading">
                    <span className="quick-log-exercise-number">{String(exerciseIndex + 1).padStart(2, '0')}</span>
                    <label className="quick-log-exercise-name"><span className="sr-only">Exercise name</span><input autoComplete="off" maxLength={120} value={exercise.name} onChange={event => updateExercise(exercise.id, { name: event.target.value })} placeholder="Exercise name · e.g. Bench Press" /></label>
                    <button type="button" className="quick-log-icon-button" onClick={() => removeExercise(exercise.id)} disabled={exercises.length === 1} aria-label="Remove exercise"><Trash2 size={16} /></button>
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
                <div><span>EXERCISE {String(index + 1).padStart(2, '0')}</span><h3>{exercise.name}</h3></div>
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
