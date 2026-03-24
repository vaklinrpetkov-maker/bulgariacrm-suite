

# Google Drive Backup — Implementation Plan

## Summary

Build a "Backup to Google Drive" feature that lets admins sync all documents and export CRM data (contacts, leads, deals, contracts, meetings, tasks) as Excel files to a dedicated Google Drive folder. The Google Drive connector is already linked with `drive.file` and `drive.readonly` scopes.

## What Gets Built

### 1. Edge Function: `sync-google-drive`
A backend function that:
- Creates a root folder "VM Invest CRM Backup" on Google Drive (or reuses existing)
- Creates subfolders: `Documents`, `CRM Exports`
- Downloads all files from the `documents` storage bucket and uploads them to the Documents folder
- Queries each CRM table (contacts, leads, deals, contracts, meetings, tasks) and generates CSV exports, uploading each to the CRM Exports folder
- Uses the connector gateway (`https://connector-gateway.lovable.dev/google_drive/...`) for all Drive API calls
- Returns a summary of files synced

### 2. Settings Page: "Google Drive" Tab
- New tab in Settings showing sync status
- "Sync Now" button to trigger the backup
- Progress indicator during sync
- Last sync timestamp display

### 3. Scope Limitation
The `drive.file` scope only allows the app to access files it created — perfect for a backup folder. The app will create and manage its own folder structure without accessing the user's other Drive files.

## Technical Details

### Edge Function (`supabase/functions/sync-google-drive/index.ts`)
- Uses `LOVABLE_API_KEY` and `GOOGLE_DRIVE_API_KEY` via connector gateway
- Gateway URL: `https://connector-gateway.lovable.dev/google_drive/`
- Drive API endpoints used:
  - `POST /drive/v3/files` (create folder, upload file with metadata)
  - `POST /upload/drive/v3/files?uploadType=multipart` (upload file content)
  - `GET /drive/v3/files?q=...` (find existing backup folder)
- Fetches documents from Supabase storage using service role key
- Generates CSV data in-memory for CRM tables
- Auth: validates JWT in code, admin-only

### Settings Page Changes (`src/pages/SettingsPage.tsx`)
- Add "Google Drive" tab with sync button and status card
- Calls the edge function via `supabase.functions.invoke('sync-google-drive')`

### Files to Create
- `supabase/functions/sync-google-drive/index.ts`

### Files to Modify
- `src/pages/SettingsPage.tsx` — add Google Drive tab

### No Database Changes Required

