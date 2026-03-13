

# Documents Module - Implementation Plan

## Summary

Build a full document management module with folder-tree navigation, file upload/download, in-app PDF/image preview, version history, and role-based access. The database tables (`documents`, `document_folders`, `document_versions`) and storage bucket (`documents`) already exist.

## What Gets Built

### 1. Folder Tree Sidebar
- Left panel showing a nested folder hierarchy
- Create, rename, and delete folders (admin/manager only)
- Click a folder to see its contents; root level shows unfiled documents
- Breadcrumb navigation showing current path

### 2. Document List (Main Area)
- Table/grid of documents in the selected folder
- Columns: Name, Type, Size, Version, Uploaded by, Date
- Search/filter by name
- Bulk actions: delete (admin only)

### 3. File Upload
- Upload button opens a dialog with drag-and-drop zone
- Supports PDF, images, Word, Excel, and other common formats
- Files stored in the existing `documents` storage bucket with sanitized ASCII paths
- On upload: creates record in `documents` table, links to current folder

### 4. In-App Preview
- Clicking a document opens a preview dialog
- PDFs rendered in iframe (using blob URL pattern already established for contracts)
- Images displayed directly
- Other file types show metadata + download button

### 5. Version History
- "Upload new version" button on document detail view
- New version saved to `document_versions` table with incremented version number
- Version history panel showing all versions with date, uploader, and notes
- Download or preview any previous version

### 6. Role-Based Access
- Existing RLS policies already enforce: viewers read-only, non-viewers full CRUD
- Module access gated by `has_module_access(uid, 'documents')` (already in place)
- UI hides upload/edit/delete buttons for viewers

## Technical Details

### Files to Create
- `src/components/documents/FolderTree.tsx` -- recursive folder tree component
- `src/components/documents/DocumentUploadDialog.tsx` -- upload with drag-drop
- `src/components/documents/DocumentPreviewDialog.tsx` -- in-app viewer
- `src/components/documents/DocumentVersionHistory.tsx` -- version list panel
- `src/components/documents/FolderFormDialog.tsx` -- create/rename folder

### Files to Modify
- `src/pages/DocumentsPage.tsx` -- full rewrite with folder tree + document list layout

### Database
- No schema migrations needed; existing tables cover all requirements
- Storage bucket `documents` already exists with private access

### Storage Upload Pattern
```
documents/{userId}/{folderId}/{uuid}_{sanitizedFileName}
```

