-- SQL Schema for Nexora-OS PostgreSQL Database

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'CLIENT', 'ADVERTISER', 'NEXORA'
    timezone VARCHAR(100) DEFAULT 'Africa/Luanda',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'NEXORA_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER', 'TECHNICIAN'
    organization_id VARCHAR(100) REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    items_count INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0, -- Total duration in seconds
    organization_id VARCHAR(100) REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Content Items (Media Files)
CREATE TABLE IF NOT EXISTS content_items (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'video', 'image', 'html', 'widget'
    url TEXT NOT NULL,
    duration INTEGER DEFAULT 15,
    file_size INTEGER DEFAULT 0,
    organization_id VARCHAR(100) REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Displays (Signage Screens)
CREATE TABLE IF NOT EXISTS displays (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'Totem Vertical 55"', 'Painel LED Outdoor', etc.
    status VARCHAR(50) DEFAULT 'offline', -- 'online', 'offline', 'maintenance'
    location VARCHAR(255) NOT NULL,
    current_playlist_id VARCHAR(100) REFERENCES playlists(id) ON DELETE SET NULL,
    organization_id VARCHAR(100) REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Schedules (Grades de veiculação)
CREATE TABLE IF NOT EXISTS schedules (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    playlist_id VARCHAR(100) REFERENCES playlists(id) ON DELETE CASCADE,
    organization_id VARCHAR(100) REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Campaigns (Campanhas de Anunciantes)
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending', 'active', 'completed'
    advertiser_id VARCHAR(100) REFERENCES organizations(id) ON DELETE CASCADE,
    budget NUMERIC(12, 2) DEFAULT 0.00,
    spent NUMERIC(12, 2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. SaaS Plans
CREATE TABLE IF NOT EXISTS saas_plans (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price_monthly_kz NUMERIC(12, 2) NOT NULL,
    features TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. SaaS Subscriptions
CREATE TABLE IF NOT EXISTS saas_subscriptions (
    id VARCHAR(100) PRIMARY KEY,
    organization_id VARCHAR(100) REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id VARCHAR(100) REFERENCES saas_plans(id),
    plan_name VARCHAR(255),
    amount_kz NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'trialing', 'PENDING_APPROVAL', 'past_due', 'suspended', 'cancelled'
    proof_url TEXT,
    notes TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Contracts
CREATE TABLE IF NOT EXISTS contracts (
    id VARCHAR(100) PRIMARY KEY,
    contract_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'signed', 'expired', 'terminated'
    organization_id VARCHAR(100) REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Financial Transactions
CREATE TABLE IF NOT EXISTS financial_transactions (
    id VARCHAR(100) PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    amount_kz NUMERIC(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'INVOICE', 'REPAYMENT', 'SAAS'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    organization_id VARCHAR(100) REFERENCES organizations(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Maintenance Tickets (Tíquetes de suporte técnico)
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id VARCHAR(100) PRIMARY KEY,
    display_id VARCHAR(100) REFERENCES displays(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    severity VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    assigned_to VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Telemetry Playback Loops Table
CREATE TABLE IF NOT EXISTS playback_loops (
    id SERIAL PRIMARY KEY,
    display_id VARCHAR(100) NOT NULL,
    media_url TEXT,
    content_title VARCHAR(500),
    media_id VARCHAR(100),
    campaign_id VARCHAR(100),
    loop_count INTEGER DEFAULT 1,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE playback_loops ADD COLUMN IF NOT EXISTS media_id VARCHAR(100);
ALTER TABLE playback_loops ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(100);
