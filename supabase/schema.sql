-- FitRecord Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Muscle groups enum type
CREATE TYPE muscle_group AS ENUM (
    'chest',
    'shoulders',
    'triceps',
    'back',
    'biceps',
    'legs',
    'core',
    'cardio',
    'full_body'
);

-- Exercises table
CREATE TABLE exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    muscle_group muscle_group NOT NULL,
    is_bodyweight BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout sessions table
CREATE TABLE workout_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for workout sessions and clients (many-to-many)
CREATE TABLE workout_session_clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workout_session_id, client_id)
);

-- Workout exercises (exercises performed in a session by a client)
CREATE TABLE workout_exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise sets (individual sets within a workout exercise)
CREATE TABLE exercise_sets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight_kg DECIMAL(6,2),
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_workout_session_clients_session ON workout_session_clients(workout_session_id);
CREATE INDEX idx_workout_session_clients_client ON workout_session_clients(client_id);
CREATE INDEX idx_workout_exercises_session ON workout_exercises(workout_session_id);
CREATE INDEX idx_workout_exercises_client ON workout_exercises(client_id);
CREATE INDEX idx_workout_exercises_exercise ON workout_exercises(exercise_id);
CREATE INDEX idx_exercise_sets_workout_exercise ON exercise_sets(workout_exercise_id);
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON workout_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_exercises_updated_at BEFORE UPDATE ON workout_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_sets_updated_at BEFORE UPDATE ON exercise_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default exercises
INSERT INTO exercises (name, muscle_group, is_bodyweight, description) VALUES
-- Chest
('Bench Press', 'chest', false, 'Flat barbell bench press'),
('Incline Bench Press', 'chest', false, 'Incline barbell bench press'),
('Dumbbell Flyes', 'chest', false, 'Flat bench dumbbell flyes'),
('Push-ups', 'chest', true, 'Standard push-ups'),
('Cable Crossover', 'chest', false, 'Cable crossover for chest'),
('Dumbbell Press', 'chest', false, 'Flat bench dumbbell press'),

-- Shoulders
('Overhead Press', 'shoulders', false, 'Standing barbell overhead press'),
('Lateral Raises', 'shoulders', false, 'Dumbbell lateral raises'),
('Front Raises', 'shoulders', false, 'Dumbbell front raises'),
('Rear Delt Flyes', 'shoulders', false, 'Rear deltoid flyes'),
('Arnold Press', 'shoulders', false, 'Arnold dumbbell press'),
('Face Pulls', 'shoulders', false, 'Cable face pulls'),

-- Triceps
('Tricep Pushdown', 'triceps', false, 'Cable tricep pushdown'),
('Skull Crushers', 'triceps', false, 'Lying tricep extensions'),
('Overhead Tricep Extension', 'triceps', false, 'Overhead dumbbell tricep extension'),
('Dips', 'triceps', true, 'Parallel bar dips'),
('Close Grip Bench Press', 'triceps', false, 'Close grip barbell bench press'),

-- Back
('Deadlift', 'back', false, 'Conventional deadlift'),
('Barbell Rows', 'back', false, 'Bent over barbell rows'),
('Lat Pulldown', 'back', false, 'Wide grip lat pulldown'),
('Pull-ups', 'back', true, 'Standard pull-ups'),
('Seated Cable Row', 'back', false, 'Seated cable row'),
('Dumbbell Rows', 'back', false, 'Single arm dumbbell rows'),
('T-Bar Row', 'back', false, 'T-bar row'),

-- Biceps
('Barbell Curls', 'biceps', false, 'Standing barbell curls'),
('Dumbbell Curls', 'biceps', false, 'Standing dumbbell curls'),
('Hammer Curls', 'biceps', false, 'Dumbbell hammer curls'),
('Preacher Curls', 'biceps', false, 'Preacher bench curls'),
('Concentration Curls', 'biceps', false, 'Seated concentration curls'),
('Cable Curls', 'biceps', false, 'Cable bicep curls'),

-- Legs
('Squats', 'legs', false, 'Barbell back squats'),
('Leg Press', 'legs', false, 'Machine leg press'),
('Lunges', 'legs', false, 'Walking lunges'),
('Leg Curls', 'legs', false, 'Lying leg curls'),
('Leg Extensions', 'legs', false, 'Machine leg extensions'),
('Calf Raises', 'legs', false, 'Standing calf raises'),
('Romanian Deadlift', 'legs', false, 'Romanian deadlift for hamstrings'),
('Hip Thrusts', 'legs', false, 'Barbell hip thrusts'),
('Bulgarian Split Squats', 'legs', false, 'Bulgarian split squats'),

-- Core
('Planks', 'core', true, 'Standard plank hold'),
('Crunches', 'core', true, 'Standard crunches'),
('Russian Twists', 'core', false, 'Russian twists with weight'),
('Leg Raises', 'core', true, 'Hanging leg raises'),
('Ab Wheel Rollout', 'core', true, 'Ab wheel rollout'),
('Cable Woodchops', 'core', false, 'Cable woodchops'),

-- Cardio
('Treadmill', 'cardio', true, 'Treadmill running/walking'),
('Cycling', 'cardio', true, 'Stationary bike'),
('Rowing Machine', 'cardio', true, 'Rowing machine cardio'),
('Jump Rope', 'cardio', true, 'Jump rope cardio');

-- View to get last workout for a client
CREATE OR REPLACE VIEW client_last_workout AS
SELECT DISTINCT ON (wsc.client_id)
    wsc.client_id,
    ws.id as workout_session_id,
    ws.started_at,
    ws.ended_at
FROM workout_session_clients wsc
JOIN workout_sessions ws ON wsc.workout_session_id = ws.id
WHERE ws.ended_at IS NOT NULL
ORDER BY wsc.client_id, ws.ended_at DESC;

-- View to get max weight per exercise per client
CREATE OR REPLACE VIEW client_exercise_max_weight AS
SELECT 
    we.client_id,
    we.exercise_id,
    MAX(es.weight_kg) as max_weight_kg,
    MAX(ws.ended_at) as last_performed_at
FROM workout_exercises we
JOIN exercise_sets es ON we.id = es.workout_exercise_id
JOIN workout_sessions ws ON we.workout_session_id = ws.id
WHERE ws.ended_at IS NOT NULL AND es.is_completed = true
GROUP BY we.client_id, we.exercise_id;

-- Enable Row Level Security (RLS) - since no auth, we allow all operations
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since no auth)
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on workout_sessions" ON workout_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on workout_session_clients" ON workout_session_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on workout_exercises" ON workout_exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on exercise_sets" ON exercise_sets FOR ALL USING (true) WITH CHECK (true);
