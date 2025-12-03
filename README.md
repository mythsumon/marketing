# Hotel Outreach CRM Dashboard

A modern B2B SaaS-style CRM dashboard for managing hotel outreach and sales activities. Built with Next.js, TypeScript, TailwindCSS, and TanStack Query.

## Features

- **Dashboard**: High-level overview with KPIs, status distribution charts, and upcoming follow-ups
- **Hotel List**: Comprehensive table view with filtering, sorting, and bulk actions
- **Hotel Detail Drawer**: Side panel for viewing and editing hotel information, notes, and activity logs
- **Import Wizard**: 3-step process for importing hotels from Excel files
- **Responsive Design**: Mobile-friendly layout with collapsible sidebar

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS** for styling
- **TanStack Query** (React Query) for data fetching
- **date-fns** for date formatting

## Getting Started

### Installation

```bash
npm install
```

### Database Setup

1. **Create PostgreSQL database:**
   ```bash
   psql -U postgres -c "CREATE DATABASE marketing_db;"
   psql -U postgres -d marketing_db -f database/schema.sql
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your PostgreSQL credentials:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/marketing_db
   ```

3. **Test database connection:**
   Visit `http://localhost:3000/api/health/db` after starting the server

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── dashboard/          # Dashboard page
│   ├── hotels/             # Hotel list page
│   ├── import/             # Import wizard page
│   ├── settings/           # Settings page (placeholder)
│   ├── layout.tsx          # Root layout with sidebar
│   ├── page.tsx            # Home page (redirects to dashboard)
│   └── providers.tsx       # TanStack Query provider
├── components/
│   ├── charts/             # Chart components
│   ├── hotels/             # Hotel-specific components
│   ├── layout/             # Layout components (Sidebar, Header)
│   └── ui/                 # Reusable UI components
├── hooks/
│   └── useMockQueries.ts   # Mock query hooks
├── lib/
│   ├── mockData.ts         # Mock data storage
│   └── types.ts            # TypeScript type definitions
└── public/                 # Static assets
```

## Mock Data

The application currently uses in-memory mock data. All data is stored in `lib/mockData.ts` and can be modified during runtime. When you're ready to connect to a backend, simply replace the mock hooks in `hooks/useMockQueries.ts` with real API calls.

## Key Components

### Status Types
- `NEW`: Hotel not yet contacted
- `CALLING`: Currently being called
- `NO_ANSWER`: No answer on call
- `NOT_INTERESTED`: Hotel declined
- `INTERESTED`: Hotel showed interest
- `DEMO_BOOKED`: Demo scheduled
- `SIGNED`: Contract signed

### Regions
The app includes Myanmar regions: Yangon, Mandalay, Bagan, Inle, Naypyidaw, Mawlamyine

## Business Flow

1. **Admin imports Excel** → Hotels created with status `NEW`
2. **Admin assigns hotels** → Bulk assign to callers
3. **Caller views assigned hotels** → Filters by "My Hotels"
4. **Caller makes calls** → Updates status, adds notes, sets follow-ups
5. **Dashboard tracks progress** → Real-time summary of all activities

## Next Steps

To connect to a backend:

1. Replace mock hooks in `hooks/useMockQueries.ts` with real API calls
2. Update `lib/mockData.ts` to use API endpoints instead of in-memory storage
3. Add authentication layer
4. Implement real file parsing for Excel imports

## License

MIT


