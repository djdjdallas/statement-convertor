-- Migration to add AI enhancement columns to transactions table
-- Run this after the initial schema setup

-- Add AI enhancement columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS confidence INTEGER DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS normalized_merchant TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS anomaly_data JSONB;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS original_category TEXT;

-- Add AI insights table for storing AI-generated spending insights
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    insights_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    insight_type TEXT DEFAULT 'spending_analysis'
);

-- Add AI processing metadata to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_enhanced BOOLEAN DEFAULT FALSE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS extraction_method TEXT DEFAULT 'traditional';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_confidence ON transactions(confidence);
CREATE INDEX IF NOT EXISTS idx_transactions_subcategory ON transactions(subcategory);
CREATE INDEX IF NOT EXISTS idx_transactions_normalized_merchant ON transactions(normalized_merchant);
CREATE INDEX IF NOT EXISTS idx_ai_insights_file_id ON ai_insights(file_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_files_ai_enhanced ON files(ai_enhanced);