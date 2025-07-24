-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium');
CREATE TYPE file_format AS ENUM ('xlsx', 'csv');

-- Files table for tracking uploaded files
CREATE TABLE files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT,
    processing_status processing_status DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Transactions table for extracted transaction data
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    date DATE,
    description TEXT,
    amount DECIMAL(12, 2),
    balance DECIMAL(12, 2),
    transaction_type TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table for extended user information
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    subscription_tier subscription_tier DEFAULT 'free',
    stripe_customer_id TEXT UNIQUE,
    subscription_id TEXT,
    subscription_status TEXT,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE usage_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'file_upload', 'pdf_process', 'export'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File exports table
CREATE TABLE file_exports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    format file_format NOT NULL,
    export_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 day')
);

-- Create indexes for better performance
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_processing_status ON files(processing_status);
CREATE INDEX idx_files_created_at ON files(created_at DESC);
CREATE INDEX idx_transactions_file_id ON transactions(file_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_created_at ON usage_tracking(created_at DESC);
CREATE INDEX idx_file_exports_user_id ON file_exports(user_id);

-- Enable Row Level Security
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_exports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Files policies
CREATE POLICY "Users can only access their own files" ON files
    FOR ALL USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can only access transactions from their files" ON transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM files 
            WHERE files.id = transactions.file_id 
            AND files.user_id = auth.uid()
        )
    );

-- User profiles policies
CREATE POLICY "Users can only access their own profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- Usage tracking policies
CREATE POLICY "Users can only access their own usage data" ON usage_tracking
    FOR ALL USING (auth.uid() = user_id);

-- File exports policies
CREATE POLICY "Users can only access their own exports" ON file_exports
    FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create function to cleanup expired files
CREATE OR REPLACE FUNCTION public.cleanup_expired_files()
RETURNS void AS $$
BEGIN
    -- Delete expired file exports
    DELETE FROM file_exports WHERE expires_at < NOW();
    
    -- Delete expired files and their associated data
    DELETE FROM files WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;