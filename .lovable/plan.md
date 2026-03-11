

## Plan: Integrate Contract Parser into Contracts Page

Transfer the AI-powered contract extraction flow from [Doc to Sheet Automator](/projects/c1eb9ae2-470f-4c45-8e0a-e9764eb33199) into the Contracts tab of this CRM.

### How It Works

1. User opens Contracts page and clicks an "AI Извличане" (AI Extract) button
2. A dialog opens with a drag-and-drop file upload area (PDF/DOCX)
3. Files are uploaded to storage, sent to an edge function that uses Lovable AI (Gemini 2.5 Flash) to extract 19 fields from Bulgarian real estate contracts
4. Extracted data is shown in a results table within the dialog
5. User can save extracted contracts directly to the `contracts` table, auto-populating title, contract number, total value, etc.

### Files to Create

1. **`supabase/functions/extract-contract/index.ts`** -- Edge function (direct port from the other project). Uses Lovable AI with tool calling to extract structured data from Bulgarian contracts. Saves extraction history to a new `contract_extractions` table.

2. **`src/components/contracts/ContractExtractDialog.tsx`** -- Main dialog component containing:
   - File upload zone (drag-and-drop, PDF/DOCX, multi-file)
   - Processing indicator with progress
   - Results table showing all 19 extracted fields per property
   - "Запази в договори" (Save to Contracts) button that creates contract records from extracted data

### Files to Edit

3. **`src/pages/crm/ContractsPage.tsx`** -- Add "AI Извличане" button in the header actions, wire up the dialog, and display actual contracts in a data table (replace the empty state placeholder)

4. **`supabase/config.toml`** -- Add the `extract-contract` function with `verify_jwt = false`

### Database Changes

5. **Migration** -- Create `contract_extractions` table to store extraction history:
   - `id`, `file_name`, `file_path`, `extracted_data` (JSONB), `status`, `user_id`, `created_at`
   - RLS: authenticated users can insert/select their own extractions, admins see all

6. **Migration** -- Create `contracts` storage bucket if not already present (the current project has a `documents` bucket but no `contracts` bucket)

### Edge Function Logic (from other project)

- Reads file content (PDF as base64 multimodal, DOCX as text)
- Sends to `https://ai.gateway.lovable.dev/v1/chat/completions` with `LOVABLE_API_KEY`
- Uses tool calling with `extract_contract_data` function schema for structured output of 19 Bulgarian real estate fields
- Handles 429/402 rate limit errors
- Returns extracted properties array

### Contract Save Flow

When user clicks "Save", the extracted data maps to the `contracts` table:
- `title` = "Договор - " + Купувач + " - " + Имот №
- `contract_number` = auto-generated or from extraction
- `total_value` = Продажна цена (parsed numeric)
- `status` = "draft"
- `notes` = JSON summary of all 19 fields
- Also optionally creates/links a contact from Купувач + ЕГН + email + phone

### Existing Infrastructure

- `LOVABLE_API_KEY` is already configured as a secret
- The `contracts` table already exists with appropriate columns and RLS policies
- Storage bucket `documents` exists; will create a `contracts` bucket for uploaded contract files

