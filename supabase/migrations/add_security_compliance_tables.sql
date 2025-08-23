-- Security and Compliance Tables for Google Workspace Marketplace

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    success BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    resource_type TEXT,
    resource_id TEXT,
    workspace_id TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- User API quotas table
CREATE TABLE IF NOT EXISTS user_api_quotas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    operation TEXT NOT NULL,
    minute_hits TIMESTAMPTZ[] DEFAULT '{}',
    day_hits TIMESTAMPTZ[] DEFAULT '{}',
    last_reset TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service, operation)
);

-- Indexes for API quotas
CREATE INDEX idx_user_api_quotas_user_id ON user_api_quotas(user_id);
CREATE INDEX idx_user_api_quotas_service_operation ON user_api_quotas(service, operation);
CREATE INDEX idx_user_api_quotas_last_reset ON user_api_quotas(last_reset);

-- Data processing records for compliance
CREATE TABLE IF NOT EXISTS data_processing_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    processing_type TEXT NOT NULL,
    purpose TEXT NOT NULL,
    legal_basis TEXT NOT NULL,
    data_categories JSONB DEFAULT '[]',
    retention_period INTEGER, -- days
    processing_location TEXT,
    third_party_sharing JSONB DEFAULT '[]',
    user_consent BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMPTZ,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for data processing records
CREATE INDEX idx_data_processing_records_user_id ON data_processing_records(user_id);
CREATE INDEX idx_data_processing_records_file_id ON data_processing_records(file_id);
CREATE INDEX idx_data_processing_records_processed_at ON data_processing_records(processed_at);

-- Security incidents table
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    incident_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for security incidents
CREATE INDEX idx_security_incidents_user_id ON security_incidents(user_id);
CREATE INDEX idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);
CREATE INDEX idx_security_incidents_reported_at ON security_incidents(reported_at);

-- Compliance consent records
CREATE TABLE IF NOT EXISTS compliance_consents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    consent_version TEXT NOT NULL,
    consent_given BOOLEAN NOT NULL,
    consent_timestamp TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    withdrawal_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, consent_type, consent_version)
);

-- Indexes for compliance consents
CREATE INDEX idx_compliance_consents_user_id ON compliance_consents(user_id);
CREATE INDEX idx_compliance_consents_type ON compliance_consents(consent_type);
CREATE INDEX idx_compliance_consents_timestamp ON compliance_consents(consent_timestamp);

-- Data retention policy table
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    data_type TEXT NOT NULL UNIQUE,
    retention_days INTEGER NOT NULL,
    deletion_strategy TEXT NOT NULL CHECK (deletion_strategy IN ('hard_delete', 'soft_delete', 'anonymize')),
    legal_requirement BOOLEAN DEFAULT false,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default retention policies
INSERT INTO data_retention_policies (data_type, retention_days, deletion_strategy, legal_requirement, description) VALUES
    ('files', 90, 'soft_delete', false, 'User uploaded files and processed data'),
    ('audit_logs', 365, 'hard_delete', true, 'Security audit logs for compliance'),
    ('session_data', 7, 'hard_delete', false, 'User session data'),
    ('temp_files', 1, 'hard_delete', false, 'Temporary processing files'),
    ('deleted_user_data', 30, 'hard_delete', true, 'Data from deleted user accounts');

-- Function to clean up expired data based on retention policies
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
    total_deleted INTEGER := 0;
    policy RECORD;
    deleted_count INTEGER;
BEGIN
    FOR policy IN SELECT * FROM data_retention_policies WHERE active = true LOOP
        CASE policy.data_type
            WHEN 'files' THEN
                IF policy.deletion_strategy = 'soft_delete' THEN
                    UPDATE files 
                    SET deleted_at = NOW() 
                    WHERE created_at < NOW() - INTERVAL '1 day' * policy.retention_days
                    AND deleted_at IS NULL;
                    GET DIAGNOSTICS deleted_count = ROW_COUNT;
                ELSIF policy.deletion_strategy = 'hard_delete' THEN
                    DELETE FROM files 
                    WHERE created_at < NOW() - INTERVAL '1 day' * policy.retention_days;
                    GET DIAGNOSTICS deleted_count = ROW_COUNT;
                END IF;
                
            WHEN 'audit_logs' THEN
                DELETE FROM audit_logs 
                WHERE timestamp < NOW() - INTERVAL '1 day' * policy.retention_days;
                GET DIAGNOSTICS deleted_count = ROW_COUNT;
                
            WHEN 'temp_files' THEN
                DELETE FROM files 
                WHERE created_at < NOW() - INTERVAL '1 day' * policy.retention_days
                AND file_path LIKE '%/temp/%';
                GET DIAGNOSTICS deleted_count = ROW_COUNT;
        END CASE;
        
        total_deleted := total_deleted + COALESCE(deleted_count, 0);
    END LOOP;
    
    RETURN total_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to anonymize user data for GDPR compliance
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Anonymize user profile
    UPDATE auth.users 
    SET 
        email = CONCAT('deleted_', p_user_id, '@anonymized.com'),
        raw_user_meta_data = jsonb_build_object(
            'anonymized', true,
            'anonymized_at', NOW()
        )
    WHERE id = p_user_id;
    
    -- Anonymize files
    UPDATE files 
    SET 
        file_name = CONCAT('anonymized_', id, '.pdf'),
        original_name = 'anonymized.pdf'
    WHERE user_id = p_user_id;
    
    -- Clear transaction details
    UPDATE transactions 
    SET 
        description = 'ANONYMIZED',
        normalized_merchant = 'ANONYMIZED',
        ai_reasoning = NULL,
        anomaly_data = NULL
    WHERE file_id IN (SELECT id FROM files WHERE user_id = p_user_id);
    
    -- Log anonymization
    INSERT INTO audit_logs (
        event_type,
        user_id,
        severity,
        metadata,
        timestamp
    ) VALUES (
        'data.anonymized',
        p_user_id,
        'info',
        jsonb_build_object('reason', 'user_request'),
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_consents ENABLE ROW LEVEL SECURITY;

-- Audit logs policies (read-only for users)
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all audit logs" ON audit_logs
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- API quota policies
CREATE POLICY "Users can view their own quotas" ON user_api_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all quotas" ON user_api_quotas
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Data processing records policies
CREATE POLICY "Users can view their own processing records" ON data_processing_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all processing records" ON data_processing_records
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Security incidents policies
CREATE POLICY "Users can view their own incidents" ON security_incidents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all incidents" ON security_incidents
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Compliance consents policies
CREATE POLICY "Users can view their own consents" ON compliance_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents" ON compliance_consents
    FOR INSERT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all consents" ON compliance_consents
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system activities';
COMMENT ON TABLE user_api_quotas IS 'Track API usage quotas per user for rate limiting';
COMMENT ON TABLE data_processing_records IS 'GDPR-compliant records of data processing activities';
COMMENT ON TABLE security_incidents IS 'Track and manage security incidents';
COMMENT ON TABLE compliance_consents IS 'User consent records for GDPR compliance';
COMMENT ON TABLE data_retention_policies IS 'Configurable data retention policies';

-- Scheduled cleanup (to be run via cron)
-- SELECT cleanup_expired_data();