# Design Repository

A minimalistic web application for curating and organizing inspiring website designs. Automatically captures full-page screenshots and extracts metadata from any website you add.

## Features

- 🎨 **Beautiful Grid Layout** - Clean, minimalistic design inspired by modern portfolio sites
- 📸 **Automatic Screenshots** - Full-page screenshots captured automatically using Puppeteer
- 🗄️ **Local Database** - All data stored locally in SQLite (better-sqlite3)
- 🏷️ **Smart Categorization** - Automatically infers categories from website metadata
- 🔍 **Metadata Extraction** - Pulls title, description, and other info from websites
- ✨ **Modern UI** - Built with Next.js 15, React 19, and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click the **"Add Website"** button
2. Enter any website URL (e.g., `https://example.com`)
3. Wait a few seconds while the app:
   - Captures a full-page screenshot
   - Extracts the title, description, and metadata
   - Automatically categorizes the website
   - Saves everything to the local database
4. View your curated design collection in the grid layout

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Database**: better-sqlite3 (local SQLite)
- **Screenshots**: Puppeteer
- **Metadata**: Cheerio (HTML parsing)

## Project Structure

```
├── app/
│   ├── api/
│   │   └── websites/       # API routes for CRUD operations
│   ├── components/         # React components
│   └── page.tsx           # Main page
├── lib/
│   ├── db.ts              # Database functions
│   └── screenshot.ts      # Screenshot & metadata extraction
├── data/                  # SQLite database (auto-created)
└── public/screenshots/    # Stored screenshots (auto-created)
```

## API Endpoints

- `GET /api/websites` - Fetch all websites
- `POST /api/websites` - Add a new website (requires `url` in body)
- `DELETE /api/websites/[id]` - Delete a website by ID

## Local Storage

All data is stored locally:
- **Database**: `data/websites.db`
- **Screenshots**: `public/screenshots/`

These directories are git-ignored by default.

## Built With

This is a [Next.js](https://nextjs.org) project using the latest App Router features.
