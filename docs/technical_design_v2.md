# Technical Design Document: System Evolution V2 🚀
## Overview
This document outlines the architecture for the next major version of the Prova Digital platform, focusing on Data Integrity (Versioning), Accessibility (Variants & Overrides), and Advanced AI Workflows (Syllabus & Text Analysis).

## 1. Architecture Decisions 🏗️

### A. Item Versioning Strategy
**Decision:** "Head-based" Versioning.
- The `items` table remains the "Source of Truth" for the *latest* editable state (HEAD). This ensures backward compatibility with existing queries.
- A new `item_versions` table stores immutable snapshots of item states.
- **Write Flow:** When an item is updated, a new row is inserted into `item_versions`, and the `items` table is updated with the new content and a reference to the new `version_id`.
- **Read Flow (Editor):** Reads from `items` (HEAD).
- **Read Flow (Exam):** Reads from `item_versions` (Specific Snapshot). This guarantees that once an exam is published, its content never changes, even if the original item is edited.

### B. Accessibility & Variants (The "Override" Pattern)
**Decision:** Delta-based Overrides.
- We do NOT duplicate items for PCD/Neuro versions.
- We create `exam_variants` (e.g., "Prova A - Versão Dislexia").
- We store `exam_variant_overrides` which contain *only* the changes (JSON merge patch) applied to specific `item_versions`.
- **Runtime:** The Exam Runner fetches the base `item_version`, then applies the `override` payload on top.
- **Benefits:** Massive storage sorting, clean lineage, and rigorous auditability.

### C. AI Content Pipeline
**Decision:** Structured Output with Fallback.
- AI Agents (Gemini) will be tasked to output strict JSON conforming to `ItemBlueprint` schemas.
- **Syllabus:** Input (Text/PDF) -> Extraction (JSON Topics) -> Human Review -> Generation (Items).
- **Text-Base:** Input (Text) -> Metadata Tagging (Asset) -> Generation (Items referencing Asset).

---

## 2. Data Model (SQL Schema) 💾

### New Tables

```sql
-- 1. ITEM VERSIONS (History/Immutable)
CREATE TABLE public.item_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id TEXT NOT NULL REFERENCES public.items(id), -- Link to master
    version_number INTEGER NOT NULL,
    
    -- Snapshot Data (Replicating core item columns for immutability)
    statement TEXT,
    alternatives JSONB,
    correct_justification TEXT,
    metadata JSONB, -- Tags, BNCC, Difficulty, etc.
    
    change_reason TEXT, -- "Fixed typo", "Updated BNCC"
    changed_by TEXT REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(item_id, version_number)
);

-- 2. EXAM VARIANTS (Accessibility Wrappers)
CREATE TABLE public.exam_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id TEXT NOT NULL REFERENCES public.exams(id),
    name TEXT NOT NULL, -- "Versão Ampliada", "Leitor de Tela"
    slug TEXT, -- "pcd-visual", "neuro-dyslexia"
    description TEXT,
    
    -- Accessibility Configs (Template)
    accessibility_config JSONB DEFAULT '{}'::jsonb, 
    -- { "fontSize": "large", "contrast": "high", "ttsEnabled": true, "timeMultiplier": 1.5 }
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. EXAM VARIANT OVERRIDES (The "Patch")
CREATE TABLE public.exam_variant_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.exam_variants(id),
    item_version_id UUID NOT NULL REFERENCES public.item_versions(id), -- Target specific version
    
    -- payload overrides fields in the base item. 
    -- Ex: { "statement": "Texto simplificado...", "multimedia": [...] }
    override_payload JSONB NOT NULL,
    
    rationale TEXT, -- Why was this override made?
    status TEXT DEFAULT 'DRAFT', -- DRAFT, APPROVED
    
    created_by TEXT REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 4. TEXT ASSETS (Conteúdo Base / Suporte)
CREATE TABLE public.text_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT, -- Stores the full text or excerpt
    source_url TEXT,
    source_reference TEXT, -- "Book X, Page Y"
    
    -- Authorship & Rights
    author TEXT,
    publication_year INTEGER,
    rights_status TEXT CHECK (rights_status IN ('PUBLIC_DOMAIN', 'LICENSED', 'USER_OWNED', 'FAIR_USE', 'UNKNOWN')),
    
    owner_id TEXT REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CONTENT BLUEPRINTS (For Syllabus Generation)
CREATE TABLE public.content_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_content TEXT, -- Raw text of syllabus/BNCC
    extracted_topics JSONB, -- AI extracted taxonomy
    generation_status TEXT,
    created_by TEXT REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Updates to Existing Tables (`items`, `exams`)

- **`items`**: Add `current_version_id` (UUID references item_versions).
- **`exams`**:
    - `items_config` (JSONB) needs to store `item_version_id` for each question, not just `item_id`.
    - `parent_exam_id` (optional, if we want exams to be forks, but Variants table handles this better).

---

## 3. RLS Policies (Security) 🔒

- **`item_versions`**:
    - **Read**: Authenticated (Shared knowledge base).
    - **Write**: System/Triggers primarily. Users via "Edit Item" action (same permission as `items`).
- **`exam_variants`**:
    - **Read**: Schools/Students assigned to the parent exam.
    - **Write**: Exam Creators (Professors/Admins).
- **`exam_variant_overrides`**:
    - **Read**: Same as variants.
    - **Write**: Specialized "Accessibility Editor" role or Exam Creator.

---

## 4. API & Service Contracts 🔌

### A. `ItemService.updateItem(id, data, reason)`
1.  Begin Transaction.
2.  Select current `items` row.
3.  Insert into `item_versions` (Snapshot of current).
4.  Update `items` with `data`.
5.  Update `items.current_version_id` = `item_versions.id`.
6.  Commit.

### B. `ExamRunner.loadExam(examId, variantId?)`
1.  Fetch `exam`.
2.  Fetch `exam.items_config` -> Get list of `item_version_id`.
3.  Fetch `item_versions` matching those IDs.
4.  **IF `variantId` provided**:
    - Fetch `exam_variant_overrides` WHERE `variant_id` = variantId AND `item_version_id` IN (ids).
    - Merge `override_payload` into `item_version` data.
5.  Return final composed exam for player.

### C. `GenAIService.analyzeSyllabus(text)`
- **Input**: Raw text (syllabus).
- **Prompt**: "Extract topics, difficulty, and BNCC codes..."
- **Output**: JSON `{ topics: [{ name: "Algebra", subtopics: [...], weight: 0.3 }] }`.

---

## 5. UI/UX Flows 🎨

1.  **Item Editor V2**:
    - Banner: "Editing Version 3".
    - History Tab: List of past versions with diff view.
    - Save Dialog: "Reason for change" input.

2.  **Exam Management -> Variants Tab**:
    - "Create Variant" button -> Select Type (PCD/Libras/Neuro).
    - **Variant Editor**:
        - Split screen: Original Item (Left) | Variant Override (Right).
        - Fields: Statement, alternatives, instructions.
        - "Propagate Changes": Alert if base item updated.

3.  **Wizard "Create from Text"**:
    - Step 1: Upload PDF/Paste Text.
    - Step 2: Rights declaration (Checkbox: "I have rights...").
    - Step 3: AI Analysis (Loading spinner).
    - Step 4: Review candidates (Approve/Reject).

## 6. Rollout Plan (Backwards Compatibility) 🔄

1.  **Migration 1**: Create tables.
2.  **Migration 2 (Backfill)**:
    - Loop through all existing `items`.
    - Create `item_versions` (v1) for each.
    - Update `items.current_version_id`.
3.  **Code Deploy**: Update `ItemEditor` to read/write versions.
4.  **Data Fix**: Update existing `exams.items_config` to resolve `item_id` to the newly created `version_id`.
