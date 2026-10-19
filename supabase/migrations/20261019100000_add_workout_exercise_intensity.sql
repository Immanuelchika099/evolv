alter table public.workout_exercises
  add column if not exists intensity text not null default 'Moderate'
  check (intensity in ('Light', 'Moderate', 'Heavy'));

create or replace function public.save_workout_log(
  p_workout_id uuid,
  p_name text,
  p_workout_date date,
  p_notes text,
  p_exercises jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_workout_id uuid;
  v_exercise jsonb;
  v_set jsonb;
  v_exercise_id uuid;
  v_exercise_name text;
  v_intensity text;
  v_set_number integer;
  v_reps integer;
  v_weight numeric;
  v_weight_unit text;
  v_completed boolean;
  v_exercise_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Sign in to save a workout.';
  end if;

  if length(trim(coalesce(p_name, ''))) = 0 or length(trim(p_name)) > 120 then
    raise exception 'Enter a workout name between 1 and 120 characters.';
  end if;

  if p_exercises is null or jsonb_typeof(p_exercises) <> 'array'
     or jsonb_array_length(p_exercises) < 1 or jsonb_array_length(p_exercises) > 30 then
    raise exception 'Add between 1 and 30 exercises.';
  end if;

  if p_workout_id is null then
    insert into public.workout_logs (user_id, name, workout_date, notes)
    values (v_user_id, trim(p_name), coalesce(p_workout_date, current_date), nullif(trim(coalesce(p_notes, '')), ''))
    returning id into v_workout_id;
  else
    update public.workout_logs
       set name = trim(p_name),
           workout_date = coalesce(p_workout_date, current_date),
           notes = nullif(trim(coalesce(p_notes, '')), ''),
           updated_at = now()
     where id = p_workout_id and user_id = v_user_id
     returning id into v_workout_id;

    if v_workout_id is null then
      raise exception 'That workout could not be found.';
    end if;

    delete from public.workout_exercises
     where workout_id = v_workout_id and user_id = v_user_id;
  end if;

  for v_exercise in select value from jsonb_array_elements(p_exercises) as item(value)
  loop
    v_exercise_name := trim(coalesce(v_exercise->>'name', ''));
    v_intensity := coalesce(nullif(v_exercise->>'intensity', ''), 'Moderate');
    if v_intensity not in ('Light', 'Moderate', 'Heavy') then
      raise exception 'Intensity must be Light, Moderate, or Heavy.';
    end if;

    if length(v_exercise_name) = 0 or length(v_exercise_name) > 120 then
      raise exception 'Every exercise needs a name of 1 to 120 characters.';
    end if;

    if jsonb_typeof(v_exercise->'sets') <> 'array'
       or jsonb_array_length(v_exercise->'sets') < 1
       or jsonb_array_length(v_exercise->'sets') > 30 then
      raise exception 'Each exercise needs between 1 and 30 sets.';
    end if;

    insert into public.workout_exercises (workout_id, user_id, name, sort_order, intensity)
    values (v_workout_id, v_user_id, v_exercise_name, v_exercise_count, v_intensity)
    returning id into v_exercise_id;

    v_set_number := 0;
    for v_set in select value from jsonb_array_elements(v_exercise->'sets') as item(value)
    loop
      v_set_number := v_set_number + 1;
      v_reps := nullif(v_set->>'reps', '')::integer;
      v_weight := nullif(v_set->>'weight', '')::numeric;
      v_weight_unit := lower(coalesce(nullif(v_set->>'weight_unit', ''), 'kg'));
      v_completed := coalesce((v_set->>'completed')::boolean, false);

      if v_reps is null or v_reps < 1 then
        raise exception 'Every set needs at least one rep.';
      end if;
      if v_weight is not null and v_weight < 0 then
        raise exception 'Weight cannot be negative.';
      end if;
      if v_weight_unit not in ('kg', 'lb') then
        raise exception 'Weight unit must be kg or lb.';
      end if;

      insert into public.workout_sets (
        workout_id, exercise_id, user_id, set_number, reps, weight, weight_unit, completed
      ) values (
        v_workout_id, v_exercise_id, v_user_id, v_set_number, v_reps, v_weight, v_weight_unit, v_completed
      );
    end loop;

    v_exercise_count := v_exercise_count + 1;
  end loop;

  return jsonb_build_object('id', v_workout_id, 'name', trim(p_name), 'workout_date', coalesce(p_workout_date, current_date));
end;
$$;

revoke all on function public.save_workout_log(uuid, text, date, text, jsonb) from public, anon;
grant execute on function public.save_workout_log(uuid, text, date, text, jsonb) to authenticated;