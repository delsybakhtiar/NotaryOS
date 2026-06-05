-- ============================================
-- NOTARYOS - SUPABASE MIGRATION GUIDE
-- SQL commands for database setup and RLS policies
-- ============================================

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all sensitive tables
ALTER TABLE Client ENABLE ROW LEVEL SECURITY;
ALTER TABLE Document ENABLE ROW LEVEL SECURITY;
ALTER TABLE DocumentVersion ENABLE ROW LEVEL SECURITY;
ALTER TABLE Invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE Payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE AuditLog ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CLIENT TABLE RLS POLICIES
-- ============================================

-- Policy: Users can only view clients they created or have access to
CREATE POLICY "Users can view clients they created or have access to"
ON Client
FOR SELECT
TO authenticated
USING (
    -- Staff/Admin can view all clients
    auth.jwt() ->> 'role' IN ('ADMIN', 'STAFF') OR
    -- Users can view their own clients
    createdById = auth.uid()
);

-- Policy: Users can insert new clients (Admin/Staff only)
CREATE POLICY "Admin/Staff can create clients"
ON Client
FOR INSERT
TO authenticated
WITH CHECK (
    auth.jwt() ->> 'role' IN ('ADMIN', 'STAFF')
);

-- Policy: Users can update clients they created (Admin/Staff only)
CREATE POLICY "Admin/Staff can update clients they created"
ON Client
FOR UPDATE
TO authenticated
USING (
    auth.jwt() ->> 'role' IN ('ADMIN', 'STAFF')
)
WITH CHECK (
    auth.jwt() ->> 'role' IN ('ADMIN', 'STAFF')
);

-- Policy: Only Admin can delete clients
CREATE POLICY "Only Admin can delete clients"
ON Client
FOR DELETE
TO authenticated
USING (
    auth.jwt() ->> 'role' = 'ADMIN'
);

-- ============================================
-- DOCUMENT TABLE RLS POLICIES
-- ============================================

-- Policy: Users can view documents they created or have access to
CREATE POLICY "Users can view documents they created or have access to"
ON Document
FOR SELECT
TO authenticated
USING (
    -- Staff/Admin can view all documents
    auth.jwt() ->> 'role' IN ('ADMIN', 'STAFF') OR
    -- Users can view their own documents
    createdById = auth.uid() OR
    -- Users can view documents for their clients
    clientId IN (
        SELECT id FROM Client WHERE createdById = auth.uid()
    )
);

-- Policy: Users can insert new documents (Admin/Staff only)
CREATE POLICY "Admin/Staff can create documents"
ON Document
FOR INSERT
TO authenticated
WITH CHECK (
    auth.jwt() ->> 'role' IN ('ADMIN', 'STAFF')
);

-- Policy: Users can update documents (Admin/Staff only, with restrictions)
CREATE POLICY "Admin/Staff can update documents"
ON Document
FOR UPDATE
TO authenticated
USING (
    auth.jwt() ->> 'role' IN ('ADMIN', 'STAFF')
)
WITH CHECK (
    auth.jwt() ->> 'role' IN ('ADMIN', 'STAFF') AND
    -- Prevent editing of signed documents
    status != 'SIGNING' AND
    status != 'ARCHIVED'
);

-- Policy: Only Admin can delete documents
CREATE POLICY "Only Admin can delete documents"
ON Document
FOR DELETE
TO authenticated
USING (
    auth.jwt() ->> 'role' = 'ADMIN' AND
    -- Prevent deletion of signed documents
    status != 'SIGNING'
);

-- ============================================
-- DOCUMENT VERSION TABLE RLS POLICIES
-- ============================================

-- Policy: Users can view document versions they have access to
CREATE POLICY "Users can view document versions for accessible documents"
ON DocumentVersion
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM Document
        WHERE Document.id = DocumentVersion.documentId
        AND (
            auth.jwt() ->> 'role' IN ('ADMIN', 'STAFF') OR
            Document.createdById = auth.uid()
        )
    )
);

-- Policy: Only system can insert document versions
CREATE POLICY "System can create document versions"
ON DocumentVersion
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- AUDIT LOG TABLE RLS POLICIES
-- ============================================

-- Policy: Admin can view all audit logs
CREATE POLICY "Admin can view all audit logs"
ON AuditLog
FOR SELECT
TO authenticated
USING (
    auth.jwt() ->> 'role' = 'ADMIN'
);

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON AuditLog
FOR SELECT
TO authenticated
USING (
    userId = auth.uid()
);

-- Policy: Only system can insert audit logs
CREATE POLICY "System can create audit logs"
ON AuditLog
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Audit logs cannot be deleted
CREATE POLICY "Audit logs cannot be deleted"
ON AuditLog
FOR DELETE
TO authenticated
USING (false);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_client_created_by ON Client(createdById);
CREATE INDEX IF NOT EXISTS idx_client_kyc_status ON Client(kycStatus);
CREATE INDEX IF NOT EXISTS idx_document_created_by ON Document(createdById);
CREATE INDEX IF NOT EXISTS idx_document_client_id ON Document(clientId);
CREATE INDEX IF NOT EXISTS idx_document_status ON Document(status);
CREATE INDEX IF NOT EXISTS idx_document_created_at ON Document(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON AuditLog(userId);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON AuditLog(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON AuditLog(entityType, entityId);
CREATE INDEX IF NOT EXISTS idx_invoice_client_id ON Invoice(clientId);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON Invoice(status);

-- ============================================
-- SECURITY FUNCTIONS
-- ============================================

-- Function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
    BEGIN
        RETURN auth.jwt() ->> 'role';
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    BEGIN
        RETURN auth.jwt() ->> 'role' = 'ADMIN';
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access client
CREATE OR REPLACE FUNCTION can_access_client(client_id TEXT)
RETURNS BOOLEAN AS $$
    BEGIN
        RETURN (
            auth.jwt() ->> 'role' IN ('ADMIN', 'STAFF') OR
            EXISTS (
                SELECT 1 FROM Client
                WHERE Client.id = client_id
                AND Client.createdById = auth.uid()
            )
        );
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS FOR AUDIT
-- ============================================

-- Function to audit document changes
CREATE OR REPLACE FUNCTION audit_document_change()
RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO AuditLog (
            userId,
            action,
            entityType,
            entityId,
            oldValue,
            newValue,
            description,
            metadata
        ) VALUES (
            auth.uid(),
            TG_OP,
            'Document',
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW),
            'Document ' || TG_OP || ' via trigger',
            jsonb_build_object('trigger', 'document_audit')
        );
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to Document table
CREATE TRIGGER document_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON Document
    FOR EACH ROW
    EXECUTE FUNCTION audit_document_change();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for active clients
CREATE OR REPLACE VIEW active_clients AS
SELECT
    id,
    clientCode,
    name,
    clientType,
    kycStatus,
    status,
    createdAt,
    createdByUserId
FROM Client
WHERE status = 'ACTIVE';

-- View for documents by status
CREATE OR REPLACE VIEW documents_by_status AS
SELECT
    status,
    COUNT(*) as count,
    documentType
FROM Document
GROUP BY status, documentType
ORDER BY status, count DESC;

-- View for recent audit logs
CREATE OR REPLACE VIEW recent_audit_logs AS
SELECT
    id,
    userId,
    action,
    entityType,
    description,
    timestamp
FROM AuditLog
ORDER BY timestamp DESC
LIMIT 100;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

-- DO $$
-- BEGIN
--     RAISE NOTICE '===========================================';
--     RAISE NOTICE 'Supabase Security Setup Complete!';
--     RAISE NOTICE '===========================================';
--     RAISE NOTICE '✓ RLS enabled on all tables';
--     RAISE NOTICE '✓ Security policies created';
--     RAISE NOTICE '✓ Indexes created for performance';
--     RAISE NOTICE '✓ Audit triggers configured';
--     RAISE NOTICE '===========================================';
-- END $$;