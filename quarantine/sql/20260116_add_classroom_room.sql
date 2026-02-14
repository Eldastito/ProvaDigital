-- Migration: Add room column to classes table
-- Date: 2026-01-16
-- Description: Adds a 'room' column to store physical classroom location (Sala).

ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS room TEXT;

COMMENT ON COLUMN public.classes.room IS 'Physical location/room of the class (e.g. Sala 101)';
