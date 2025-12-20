-- CONTINUUM DATABASE SCHEMA
-- Paste this entire file into Supabase SQL Editor
-- Last updated: December 18, 2024

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (handled by Clerk auth)
-- We'll reference Clerk user_id as strings
-- ============================================

-- ============================================
-- BRAND PROFILES TABLE
-- Root of brand isolation hierarchy
-- ============================================
CREATE TABLE brand_profiles (
    brand_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Clerk user ID
    brand_name VARCHAR(255) NOT NULL,
    brand_description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure one user can't create duplicate brand names
    CONSTRAINT unique_brand_per_user UNIQUE(user_id, brand_name)
);

-- Index for fast user lookups
CREATE INDEX idx_brands_user ON brand_profiles(user_id);

-- ============================================
-- SESSIONS TABLE
-- Tracks creative sessions (isolated by brand)
-- ============================================
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brand_profiles(brand_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    session_start TIMESTAMP DEFAULT NOW(),
    session_end TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- active, completed, abandoned
    total_credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_brand ON sessions(brand_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- ============================================
-- PROMPTS TABLE
-- Every generated prompt (isolated by brand)
-- ============================================
CREATE TABLE prompts (
    prompt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brand_profiles(brand_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    
    -- Prompt content
    prompt_text TEXT NOT NULL,
    user_input TEXT, -- Original user request
    platform VARCHAR(50), -- veo3, sora, midjourney, flux
    output_type VARCHAR(50), -- video, still
    
    -- Metadata for learning
    metadata JSONB, -- Store technical specs (fps, resolution, duration, etc)
    user_feedback VARCHAR(50), -- great, good, bad
    feedback_notes TEXT,
    
    -- Credits
    credits_used INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prompts_session ON prompts(session_id);
CREATE INDEX idx_prompts_brand ON prompts(brand_id);
CREATE INDEX idx_prompts_user ON prompts(user_id);
CREATE INDEX idx_prompts_platform ON prompts(platform);
CREATE INDEX idx_prompts_feedback ON prompts(user_feedback);

-- ============================================
-- BRAND INTELLIGENCE TABLE
-- Learned patterns per brand
-- ============================================
CREATE TABLE brand_intelligence (
    intelligence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brand_profiles(brand_id) ON DELETE CASCADE,
    
    -- What was learned
    intelligence_type VARCHAR(100), -- preferred_fps, preferred_lighting, preferred_angle, etc
    learned_value TEXT, -- The actual preference (e.g., "24fps", "natural daylight")
    confidence_score DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
    
    -- Learning metadata
    occurrences INTEGER DEFAULT 1, -- How many times this pattern appeared
    last_seen TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_intelligence_brand ON brand_intelligence(brand_id);
CREATE INDEX idx_intelligence_type ON brand_intelligence(intelligence_type);

-- ============================================
-- CREDIT BALANCES TABLE
-- Track monthly and top-up credits separately
-- ============================================
CREATE TABLE credit_balances (
    balance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,
    
    -- Monthly credits (expire at billing cycle)
    monthly_credits INTEGER DEFAULT 0,
    monthly_credits_expire_at TIMESTAMP,
    
    -- Top-up credits (expire 12 months from purchase)
    topup_credits INTEGER DEFAULT 0,
    
    -- Metadata
    total_credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_credits_user ON credit_balances(user_id);

-- ============================================
-- CREDIT TRANSACTIONS TABLE
-- Audit trail of all credit movements
-- ============================================
CREATE TABLE credit_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    
    -- Transaction details
    transaction_type VARCHAR(50), -- purchase, deduction, refund, expiration
    credit_type VARCHAR(50), -- monthly, topup
    amount INTEGER NOT NULL, -- Positive for additions, negative for deductions
    
    -- Context
    description TEXT,
    related_session_id UUID REFERENCES sessions(session_id),
    related_prompt_id UUID REFERENCES prompts(prompt_id),
    
    -- Stripe reference (for purchases)
    stripe_payment_intent_id TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_transactions_created ON credit_transactions(created_at);

-- ============================================
-- TOP-UP PURCHASES TABLE
-- Track top-up purchases with expiration dates
-- ============================================
CREATE TABLE topup_purchases (
    purchase_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    
    -- Purchase details
    credits_purchased INTEGER NOT NULL,
    credits_remaining INTEGER NOT NULL,
    amount_paid DECIMAL(10,2), -- USD amount
    
    -- Expiration (12 months from purchase)
    purchased_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    
    -- Stripe reference
    stripe_payment_intent_id TEXT,
    
    status VARCHAR(50) DEFAULT 'active' -- active, expired, fully_used
);

-- Indexes
CREATE INDEX idx_topups_user ON topup_purchases(user_id);
CREATE INDEX idx_topups_status ON topup_purchases(status);
CREATE INDEX idx_topups_expires ON topup_purchases(expires_at);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- Track Stripe subscriptions
-- ============================================
CREATE TABLE subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,
    
    -- Stripe details
    stripe_subscription_id TEXT NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    
    -- Plan details
    plan_type VARCHAR(50), -- pro, agency
    status VARCHAR(50), -- active, canceled, past_due
    
    -- Billing
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    
    -- Credits allocation per plan
    monthly_credits_allocation INTEGER, -- 500 for Pro, 2000 for Agency
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- ============================================
-- TEMPLATES TABLE
-- Pre-built prompt templates
-- ============================================
CREATE TABLE templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template details
    template_name VARCHAR(255) NOT NULL,
    template_description TEXT,
    category VARCHAR(100), -- automotive, product, interior, etc
    
    -- Template content
    prompt_structure TEXT NOT NULL, -- Template with {{variables}}
    default_platform VARCHAR(50), -- Recommended platform
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default templates
INSERT INTO templates (template_name, template_description, category, prompt_structure, default_platform) VALUES
('Automotive Hero Shot', 'Dynamic vehicle showcase with motion', 'automotive', 
'{{vehicle}} moves toward camera, {{angle}} angle, {{lighting}} lighting, {{environment}} background, {{speed}} motion, cinematic quality, broadcast grade', 
'veo3'),

('Product Detail Macro', 'Close-up product reveal with dramatic lighting', 'product', 
'Extreme close-up of {{product}}, {{detail}} in focus, {{lighting}} lighting, slow reveal motion, shallow depth of field, professional studio quality', 
'veo3'),

('Interior Showcase', 'Architectural interior walk-through', 'interior', 
'Camera glides through {{space}}, {{style}} interior design, {{lighting}} lighting, smooth motion, {{atmosphere}} mood, architectural photography style', 
'veo3'),

('Departure Shot', 'Vehicle or subject leaving frame', 'automotive', 
'{{subject}} drives away from camera, {{angle}} view, {{lighting}} lighting, {{environment}} setting, dynamic motion blur, cinematic departure', 
'veo3'),

('Charging Sequence', 'Electric vehicle charging visualization', 'automotive', 
'{{vehicle}} charging, LED indicators {{color}}, {{lighting}} ambient light, close-up of charging port, {{duration}} duration, modern electric aesthetic', 
'veo3');

-- ============================================
-- AUDIT LOG TABLE
-- Track all data access for compliance
-- ============================================
CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    brand_id UUID,
    
    -- Action details
    action VARCHAR(100), -- create, read, update, delete, generate
    resource_type VARCHAR(100), -- brand, session, prompt, credits
    resource_id UUID,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_brand ON audit_log(brand_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_action ON audit_log(action);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- Enforce brand isolation at database level
-- ============================================

-- Enable RLS on critical tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_intelligence ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own brand data
CREATE POLICY brand_isolation_sessions ON sessions
    FOR ALL
    USING (
        user_id = current_setting('app.current_user_id', true)
    );

CREATE POLICY brand_isolation_prompts ON prompts
    FOR ALL
    USING (
        user_id = current_setting('app.current_user_id', true)
    );

CREATE POLICY brand_isolation_intelligence ON brand_intelligence
    FOR ALL
    USING (
        brand_id IN (
            SELECT brand_id FROM brand_profiles 
            WHERE user_id = current_setting('app.current_user_id', true)
        )
    );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update brand updated_at timestamp
CREATE OR REPLACE FUNCTION update_brand_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for brand_profiles
CREATE TRIGGER update_brand_timestamp
    BEFORE UPDATE ON brand_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_brand_timestamp();

-- Function to deduct credits (enforces monthly → topup order)
CREATE OR REPLACE FUNCTION deduct_credits(
    p_user_id TEXT,
    p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_monthly_credits INTEGER;
    v_topup_credits INTEGER;
    v_remaining INTEGER;
BEGIN
    -- Get current balances
    SELECT monthly_credits, topup_credits 
    INTO v_monthly_credits, v_topup_credits
    FROM credit_balances
    WHERE user_id = p_user_id;
    
    -- Check if user has enough credits
    IF (v_monthly_credits + v_topup_credits) < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct from monthly first
    IF v_monthly_credits >= p_amount THEN
        UPDATE credit_balances
        SET monthly_credits = monthly_credits - p_amount,
            total_credits_used = total_credits_used + p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        -- Use all monthly, then topup
        v_remaining = p_amount - v_monthly_credits;
        UPDATE credit_balances
        SET monthly_credits = 0,
            topup_credits = topup_credits - v_remaining,
            total_credits_used = total_credits_used + p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA SETUP
-- ============================================

-- This completes the schema
-- Next: Create Supabase project and paste this SQL

COMMENT ON TABLE brand_profiles IS 'Root table for brand isolation - each brand is completely isolated';
COMMENT ON TABLE sessions IS 'Creative sessions - tracks user work sessions with brand context';
COMMENT ON TABLE prompts IS 'Generated prompts - all prompt history with feedback for learning';
COMMENT ON TABLE brand_intelligence IS 'Learned patterns - AI-detected preferences per brand';
COMMENT ON TABLE credit_balances IS 'User credit balances - monthly and top-up pools';
COMMENT ON TABLE credit_transactions IS 'Audit trail - every credit movement logged';
COMMENT ON TABLE topup_purchases IS 'Top-up purchases - tracks expiration (12 months)';
COMMENT ON TABLE subscriptions IS 'Stripe subscriptions - Pro and Agency tiers';
COMMENT ON TABLE templates IS 'Prompt templates - pre-built starting points';
COMMENT ON TABLE audit_log IS 'Security audit - all data access logged for compliance';
