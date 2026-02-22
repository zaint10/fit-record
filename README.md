# FitRecord 💪

A Progressive Web App (PWA) for personal trainers to track their clients' workouts. Built with Next.js, TypeScript, and Supabase.

## Features

- **Client Management**: Add, edit, and delete clients
- **Exercise Library**: Pre-loaded exercises grouped by muscle group (chest, shoulders, triceps, back, biceps, legs, core, cardio)
- **Workout Sessions**: 
  - Start workouts with one or multiple clients
  - Add exercises with multiple sets
  - Track reps and weight (kg)
  - See max weight (PR) for each exercise per client
  - View last workout to continue from where you left off
- **PWA Support**: Install on mobile devices for app-like experience
- **Offline Support**: Basic offline caching for navigation

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fit-record.git
   cd fit-record
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the schema from `supabase/schema.sql`
   - This will create all tables and seed default exercises

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

5. **Generate PWA icons** (optional)
   
   Use the SVG in `public/icons/icon.svg` to generate PNG icons at various sizes:
   - 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open the app**
   
   Visit [http://localhost:3000](http://localhost:3000)

### Installing as PWA

1. Open the app in Chrome (mobile or desktop)
2. Click the "Install" or "Add to Home Screen" option
3. The app will be available as a standalone application

## Project Structure

```
fit-record/
├── public/
│   ├── icons/          # PWA icons
│   ├── manifest.json   # PWA manifest
│   └── sw.js          # Service worker
├── src/
│   ├── app/           # Next.js app router pages
│   │   ├── admin/     # Admin hub
│   │   ├── clients/   # Client management
│   │   ├── exercises/ # Exercise library
│   │   └── workout/   # Workout sessions
│   ├── components/    # Reusable components
│   ├── lib/           # API and Supabase client
│   └── types/         # TypeScript types
└── supabase/
    └── schema.sql     # Database schema
```

## Database Schema

- **clients**: Client information
- **exercises**: Exercise library with muscle groups
- **workout_sessions**: Workout session metadata
- **workout_session_clients**: Junction table for multi-client sessions
- **workout_exercises**: Exercises performed in a session
- **exercise_sets**: Individual sets with reps and weight

## Usage

### Managing Clients

1. Go to **Clients** from the bottom nav
2. Tap **Add** to create a new client
3. Tap on a client to view details, edit, or delete

### Managing Exercises

1. Go to **Exercises** from the bottom nav
2. Browse exercises by muscle group
3. Tap **Add** to create custom exercises
4. Mark exercises as "Bodyweight" if no weight tracking needed

### Starting a Workout

1. Tap **Workout** from the bottom nav
2. Tap **Start New Workout**
3. Select one or more clients
4. Tap **Start Workout**

### During a Workout

1. Tap **Add Exercise** to add exercises
2. Each exercise starts with 3 sets
3. Enter weight (kg) and reps for each set
4. Tap the checkmark to complete a set
5. View the max weight (PR) for reference
6. Tap **End** when finished

### Viewing History

- See recent workouts on the Workout page
- Tap **View All** for complete history
- Click any workout to see details

## License

MIT

## Contributing

Feel free to open issues or submit pull requests!
