/**
 * Seed exercises from Exercises.xlsx into Turso database
 * 
 * Usage: node scripts/seed-exercises.js
 * 
 * Required: npm install xlsx dotenv
 */

const XLSX = require('xlsx');
const { createClient } = require('@libsql/client');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Load environment variables from .env
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const db = createClient({
  url: envVars.TURSO_DATABASE_URL,
  authToken: envVars.TURSO_AUTH_TOKEN,
});

// Map Excel column names to our muscle groups
const COLUMN_TO_MUSCLE_GROUP = {
  'Chest': 'chest',
  'Back': 'back',
  'Shoulders': 'shoulders',
  'Soulders': 'shoulders', // Handle typo in xlsx
  'Arms': 'arms',
  'Legs': 'legs',
};

async function seedExercises() {
  console.log('Reading Exercises.xlsx...');
  
  const workbook = XLSX.readFile(path.join(__dirname, '../Exercises.xlsx'));
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON - each column is a muscle group
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // First row is headers
  const headers = data[0];
  console.log('Found columns:', headers);
  
  const exercises = [];
  
  // Process each column (muscle group)
  headers.forEach((header, colIndex) => {
    const muscleGroup = COLUMN_TO_MUSCLE_GROUP[header];
    if (!muscleGroup) {
      console.log(`Skipping unknown column: ${header}`);
      return;
    }
    
    // Get all exercises in this column (skip header row)
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
      const exerciseName = data[rowIndex]?.[colIndex];
      if (exerciseName && typeof exerciseName === 'string' && exerciseName.trim()) {
        exercises.push({
          id: crypto.randomUUID(),
          name: exerciseName.trim(),
          muscle_group: muscleGroup,
          is_bodyweight: isBodyweightExercise(exerciseName),
        });
      }
    }
  });
  
  console.log(`\nFound ${exercises.length} exercises to seed:`);
  
  // Group by muscle group for display
  const grouped = {};
  exercises.forEach(ex => {
    if (!grouped[ex.muscle_group]) grouped[ex.muscle_group] = [];
    grouped[ex.muscle_group].push(ex.name);
  });
  
  Object.entries(grouped).forEach(([group, names]) => {
    console.log(`\n${group.toUpperCase()} (${names.length}):`);
    names.forEach(name => console.log(`  - ${name}`));
  });
  
  // Confirm before seeding
  console.log('\n---');
  console.log('Seeding to database...');
  
  // Insert exercises
  let inserted = 0;
  let skipped = 0;
  
  for (const exercise of exercises) {
    try {
      // Check if exercise already exists (by name)
      const existing = await db.execute({
        sql: 'SELECT id FROM exercises WHERE LOWER(name) = LOWER(?)',
        args: [exercise.name],
      });
      
      if (existing.rows.length > 0) {
        console.log(`  Skipped (exists): ${exercise.name}`);
        skipped++;
        continue;
      }
      
      await db.execute({
        sql: `INSERT INTO exercises (id, name, muscle_group, is_bodyweight, created_at, updated_at)
              VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
        args: [exercise.id, exercise.name, exercise.muscle_group, exercise.is_bodyweight ? 1 : 0],
      });
      
      console.log(`  ✓ Added: ${exercise.name} (${exercise.muscle_group})`);
      inserted++;
    } catch (error) {
      console.error(`  ✗ Failed: ${exercise.name} - ${error.message}`);
    }
  }
  
  console.log(`\n---`);
  console.log(`Done! Inserted: ${inserted}, Skipped: ${skipped}`);
}

// Helper to detect bodyweight exercises
function isBodyweightExercise(name) {
  const bodyweightKeywords = [
    'push-up', 'pushup', 'push up',
    'pull-up', 'pullup', 'pull up',
    'chin-up', 'chinup', 'chin up',
    'dip', 'dips',
    'plank',
    'crunch', 'crunches',
    'sit-up', 'situp', 'sit up',
    'leg raise',
    'mountain climber',
    'burpee',
    'lunge', // bodyweight lunges
    'squat', // bodyweight squats (but weighted squats too...)
  ];
  
  const lowerName = name.toLowerCase();
  
  // If it mentions weight/dumbbell/barbell/cable/machine, it's NOT bodyweight
  const weightedKeywords = ['dumbbell', 'barbell', 'cable', 'machine', 'smith', 'ez bar', 'ez-bar', 'weight', 'plate'];
  if (weightedKeywords.some(kw => lowerName.includes(kw))) {
    return false;
  }
  
  return bodyweightKeywords.some(kw => lowerName.includes(kw));
}

// Run the script
seedExercises().catch(console.error);
