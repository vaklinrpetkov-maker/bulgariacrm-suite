

# Google Drive Backup — Export as Google Sheets

## Summary

Change the CRM data export format from CSV files to native Google Sheets spreadsheets. This allows admins to open and edit the exported data directly in Google Drive without needing to import or convert anything.

## What Changes

### Edge Function: `sync-google-drive`

Instead of generating CSV files and uploading them as static files, the function will:

1. **Create a Google Sheet** for each CRM table using the Drive API (`POST /drive/v3/files` with mimeType `application/vnd.google-apps.spreadsheet`)
2. **Write data** to the sheet using the Sheets API (`PUT /v2/spreadsheets/{id}/values/{range}` via the gateway at `https://connector-gateway.lovable.dev/google_drive/`)
3. **Overwrite existing sheets** on subsequent syncs rather than creating duplicates — the function will search for an existing sheet by name in the CRM Exports folder and clear + rewrite it, or create a new one if not found

Each CRM table (contacts, leads, deals, contracts, meetings, tasks) becomes a named Google Sheet like `Contacts_2026-03-24` in the "CRM Exports" folder.

### Scope Check

The Google Sheets API endpoints are accessed through the same Drive gateway. The current `drive.file` scope allows full access to files the app creates, which includes editing spreadsheet content. If the Sheets API calls fail due to missing scopes, a reconnect with `spreadsheets` scope will be triggered.

### Documents Folder — No Change

Uploaded documents (PDFs, images, etc.) continue to be synced as regular files. Only the CRM table exports change format.

## Technical Details

### Files to Modify
- `supabase/functions/sync-google-drive/index.ts`
  - Remove `convertToCsv` helper
  - Add `createOrUpdateSheet` function that:
    - Searches for existing sheet by name in folder
    - If found: clears it via `POST .../values/{range}:clear`, then writes new data
    - If not found: creates new spreadsheet file with `mimeType: application/vnd.google-apps.spreadsheet` and parents set to CRM Exports folder
    - Writes header row + data rows via `PUT .../values/Sheet1!A1` with `valueInputOption=RAW`
  - Gateway paths used:
    - `GET /drive/v3/files?q=...` (find existing sheet)
    - `POST /drive/v3/files` (create spreadsheet)
    - `PUT /v2/spreadsheets/{id}/values/Sheet1!A1?valueInputOption=RAW` (write data)
    - `POST /v2/spreadsheets/{id}/values/Sheet1:clear` (clear before rewrite)

### No UI Changes
The Settings tab remains identical — the sync button works the same way, only the output format changes.

### No Database Changes

