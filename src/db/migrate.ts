import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  console.log('⏳ Running database migrations...');
  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Run the migration sql script
    await pool.query(sql);
    console.log('✅ Migrations completed successfully.');
    
    // Seed initial demo data if organizations table is empty
    const checkOrgs = await pool.query('SELECT COUNT(*) FROM organizations');
    if (parseInt(checkOrgs.rows[0].count) === 0) {
      console.log('🌱 Seeding default organizations and demo accounts...');
      
      // Seed Organizations
      await pool.query(`
        INSERT INTO organizations (id, name, type) VALUES
        ('org-nexora', 'Nexora Digital Operator', 'NEXORA'),
        ('org-talatona', 'Belas Shopping Talatona', 'CLIENT'),
        ('org-unitel', 'Unitel Angola', 'ADVERTISER')
        ON CONFLICT DO NOTHING;
      `);

      // Seed Users (Matching DEMO_PROFILES in sessionService)
      await pool.query(`
        INSERT INTO users (id, email, full_name, role, organization_id) VALUES
        ('usr-admin', 'admin@nexora.ao', 'Administrador Nexora', 'NEXORA_ADMIN', 'org-nexora'),
        ('usr-client', 'gerente@belasshopping.ao', 'Gerente Belas Shopping', 'ADMIN', 'org-talatona'),
        ('usr-adv', 'marketing@unitel.co.ao', 'Marketing Unitel', 'ADMIN', 'org-unitel')
        ON CONFLICT DO NOTHING;
      `);

      // Seed SaaS Plans
      await pool.query(`
        INSERT INTO saas_plans (id, name, price_monthly_kz, features) VALUES
        ('plan-pro', 'Nexora Pro Sign', 250000.00, 'Gestão ilimitada, suporte prioritário, relatórios de veiculação'),
        ('plan-ent', 'Nexora Enterprise Sign', 500000.00, 'Hardware dedicado, integração de APIs, IA ilimitada')
        ON CONFLICT DO NOTHING;
      `);

      // Seed Displays
      await pool.query(`
        INSERT INTO displays (id, name, type, status, location, organization_id) VALUES
        ('dsp-01', 'Painel LED Principal - Talatona', 'VIDEO_WALL', 'ONLINE', 'Belas Shopping, Talatona - Hall Principal', 'org-talatona'),
        ('dsp-02', 'Totem Entrada Sul - Talatona', 'TOTEM', 'OFFLINE', 'Belas Shopping, Talatona - Entrada Sul', 'org-talatona')
        ON CONFLICT DO NOTHING;
      `);

      // Seed Financial Transactions
      await pool.query(`
        INSERT INTO financial_transactions (id, invoice_number, amount_kz, type, status, organization_id, description) VALUES
        ('tx-01', 'FT-2026/001', 750000.00, 'INVOICE', 'paid', 'org-talatona', 'Fatura mensal de aluguer de displays'),
        ('tx-02', 'FT-2026/002', 250000.00, 'SAAS', 'pending', 'org-talatona', 'Assinatura mensal do plano Nexora Pro')
        ON CONFLICT DO NOTHING;
      `);

      // Seed Maintenance Tickets
      await pool.query(`
        INSERT INTO maintenance_tickets (id, display_id, title, description, status, severity, assigned_to) VALUES
        ('ticket-01', 'dsp-02', 'Tela apagada na Entrada Sul', 'Display não está respondendo aos comandos de ping nem renderizando vídeo.', 'open', 'high', 'usr-admin')
        ON CONFLICT DO NOTHING;
      `);

      console.log('🌱 Seed completed successfully.');
    }

    // Auto-provision extra columns for partners, commission, media limits and SaaS plans
    await pool.query(`
      ALTER TABLE campaigns
        ADD COLUMN IF NOT EXISTS delivered_impressions INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS target_impressions INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_budget_kz NUMERIC DEFAULT 0;

      ALTER TABLE playlists 
        ADD COLUMN IF NOT EXISTS display_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS is_system_locked BOOLEAN DEFAULT FALSE;

      ALTER TABLE displays
        ADD COLUMN IF NOT EXISTS partner_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC DEFAULT 15.0,
        ADD COLUMN IF NOT EXISTS max_media_limit INTEGER DEFAULT 12,
        ADD COLUMN IF NOT EXISTS price_image_10s NUMERIC DEFAULT 65000,
        ADD COLUMN IF NOT EXISTS price_image_15s NUMERIC DEFAULT 85000,
        ADD COLUMN IF NOT EXISTS price_image_30s NUMERIC DEFAULT 145000,
        ADD COLUMN IF NOT EXISTS price_video_10s NUMERIC DEFAULT 80000,
        ADD COLUMN IF NOT EXISTS price_video_15s NUMERIC DEFAULT 105000,
        ADD COLUMN IF NOT EXISTS price_video_30s NUMERIC DEFAULT 185000,
        ADD COLUMN IF NOT EXISTS daily_operating_hours NUMERIC DEFAULT 13.0;

      ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS nif VARCHAR(50),
        ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
        ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS email VARCHAR(100),
        ADD COLUMN IF NOT EXISTS municipality VARCHAR(100),
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE',
        ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(50) DEFAULT 'ACTIVE',
        ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 15.0,
        ADD COLUMN IF NOT EXISTS max_media_per_display INTEGER DEFAULT 12,
        ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100) DEFAULT 'Nexora Business Pro',
        ADD COLUMN IF NOT EXISTS monthly_fee_kz NUMERIC DEFAULT 850000;

      ALTER TABLE saas_plans
        ADD COLUMN IF NOT EXISTS code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE',
        ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(20) DEFAULT 'MONTHLY',
        ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 250000,
        ADD COLUMN IF NOT EXISTS display_limit INTEGER DEFAULT 5,
        ADD COLUMN IF NOT EXISTS storage_limit_gb INTEGER DEFAULT 20,
        ADD COLUMN IF NOT EXISTS team_member_limit INTEGER DEFAULT 3,
        ADD COLUMN IF NOT EXISTS playlist_limit INTEGER DEFAULT 10,
        ADD COLUMN IF NOT EXISTS schedule_limit INTEGER DEFAULT 10,
        ADD COLUMN IF NOT EXISTS monthly_ai_credits INTEGER DEFAULT 500,
        ADD COLUMN IF NOT EXISTS badge_text VARCHAR(100),
        ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS entitlements JSONB;

      CREATE TABLE IF NOT EXISTS financial_transactions (
        id VARCHAR(100) PRIMARY KEY,
        invoice_number VARCHAR(100),
        type VARCHAR(50) DEFAULT 'INCOME',
        category VARCHAR(100) DEFAULT 'ADVERTISING_SALE',
        amount_kz NUMERIC DEFAULT 0,
        description TEXT,
        reference_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'COMPLETED',
        organization_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- RECONCILIAÇÃO DE COLUNAS — financial_transactions.
      --
      -- O erro real que isto corrige: a tabela já existia em produção criada por
      -- um esquema antigo, e o CREATE TABLE IF NOT EXISTS acima NÃO acrescenta
      -- colunas a uma tabela existente. Faltavam "category" e "reference_id", pelo
      -- que qualquer INSERT nessas colunas falhava com
      --   column "category" of relation "financial_transactions" does not exist (42703)
      -- e a fatura da campanha nunca era registada (o erro era engolido num aviso
      -- e o financeiro ficava sem o lançamento).
      -- ADD COLUMN IF NOT EXISTS é idempotente: em bases já correctas não faz nada.
      ALTER TABLE financial_transactions
        ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'ADVERTISING_SALE',
        ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'COMPLETED',
        ADD COLUMN IF NOT EXISTS organization_id VARCHAR(100);

      -- RECONCILIAÇÃO DE COLUNAS — saas_subscriptions.
      --
      -- O erro real que isto corrige: no painel do CLIENTE, ao submeter a compra
      -- de um plano, o servidor respondia
      --   column "plan_name" of relation "saas_subscriptions" does not exist (42703)
      -- e a subscrição nunca era gravada (o comprovativo era enviado e o cliente
      -- ficava sem plano). A tabela foi criada pelo esquema inicial (init.sql)
      -- apenas com id/organization_id/plan_id/status/datas — e um
      -- CREATE TABLE IF NOT EXISTS NÃO acrescenta colunas a uma tabela que já
      -- existe. ADD COLUMN IF NOT EXISTS é idempotente: em bases já correctas
      -- não faz nada.
      ALTER TABLE saas_subscriptions
        ADD COLUMN IF NOT EXISTS plan_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS amount_kz NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS proof_url TEXT,
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS start_date DATE,
        ADD COLUMN IF NOT EXISTS end_date DATE,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

      CREATE TABLE IF NOT EXISTS partner_commissions (
        id VARCHAR(100) PRIMARY KEY,
        campaign_id VARCHAR(100),
        organization_id VARCHAR(100),
        advertiser_name VARCHAR(200),
        campaign_title VARCHAR(200),
        display_code VARCHAR(100),
        display_venue VARCHAR(200),
        total_budget_kz NUMERIC DEFAULT 0,
        commission_amount_kz NUMERIC DEFAULT 0,
        commission_rate NUMERIC DEFAULT 0.15,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS partner_bank_accounts (
        id VARCHAR(100) PRIMARY KEY,
        organization_id VARCHAR(100) NOT NULL,
        bank_name VARCHAR(100) NOT NULL,
        account_holder VARCHAR(200) NOT NULL,
        iban VARCHAR(100) NOT NULL,
        account_number VARCHAR(100),
        is_default BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS partner_notifications (
        id VARCHAR(100) PRIMARY KEY,
        organization_id VARCHAR(100) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'COMMISSION_SETTLED',
        receipt_url TEXT,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE partner_commissions
        ADD COLUMN IF NOT EXISTS organization_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS display_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS display_venue VARCHAR(200),
        ADD COLUMN IF NOT EXISTS receipt_url TEXT,
        ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS bank_account_info JSONB;

      CREATE TABLE IF NOT EXISTS playback_loops (
        id SERIAL PRIMARY KEY,
        display_id VARCHAR(100) NOT NULL,
        media_url TEXT,
        content_title VARCHAR(500),
        loop_count INTEGER DEFAULT 1,
        recorded_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      INSERT INTO system_settings (key, value)
      VALUES ('partner_split_rate', '0.15')
      ON CONFLICT (key) DO NOTHING;

      ALTER TABLE contracts
        ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'SAAS_SUBSCRIPTION',
        ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS organization_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE',
        ADD COLUMN IF NOT EXISTS start_date DATE,
        ADD COLUMN IF NOT EXISTS end_date DATE,
        ADD COLUMN IF NOT EXISTS total_value_kz NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS monthly_value_kz NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS terms_text TEXT;

      ALTER TABLE schedules
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS status VARCHAR(30),
        ADD COLUMN IF NOT EXISTS priority VARCHAR(20),
        ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20),
        ADD COLUMN IF NOT EXISTS days_of_week TEXT,
        ADD COLUMN IF NOT EXISTS display_ids TEXT,
        ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS tags TEXT,
        ADD COLUMN IF NOT EXISTS code VARCHAR(30);

      -- ═══════════════════════════════════════════════════════════════════════
      -- NEXORA CREATIVE AI — ECOSSISTEMA DE CRÉDITOS E GERAÇÕES
      -- Fonte de verdade no servidor. Substitui o mock que vivia no localStorage
      -- de cada browser (que impedia qualquer visão de admin transversal).
      -- ═══════════════════════════════════════════════════════════════════════

      -- Pacotes de crédito (editáveis pelo admin)
      CREATE TABLE IF NOT EXISTS ai_credit_packages (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        credits INTEGER NOT NULL,
        price_kz NUMERIC NOT NULL DEFAULT 0,
        validity_days INTEGER DEFAULT 30,
        benefits JSONB DEFAULT '[]'::jsonb,
        popular BOOLEAN DEFAULT FALSE,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Conta de créditos por organização (saldo materializado + totais para relatórios)
      CREATE TABLE IF NOT EXISTS ai_credit_accounts (
        organization_id VARCHAR(100) PRIMARY KEY,
        balance NUMERIC NOT NULL DEFAULT 0,
        total_granted NUMERIC NOT NULL DEFAULT 0,
        total_purchased NUMERIC NOT NULL DEFAULT 0,
        total_consumed NUMERIC NOT NULL DEFAULT 0,
        total_refunded NUMERIC NOT NULL DEFAULT 0,
        low_balance_threshold INTEGER DEFAULT 100,
        blocked BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Livro-razão de créditos (imutável; o saldo é derivado daqui)
      CREATE TABLE IF NOT EXISTS ai_credit_transactions (
        id VARCHAR(120) PRIMARY KEY,
        organization_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(100),
        type VARCHAR(30) NOT NULL,
        amount NUMERIC NOT NULL,
        balance_after NUMERIC,
        reason TEXT,
        generation_id VARCHAR(120),
        campaign_id VARCHAR(120),
        performed_by VARCHAR(150),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ai_credit_tx_org ON ai_credit_transactions (organization_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_credit_tx_user ON ai_credit_transactions (user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_credit_tx_type ON ai_credit_transactions (type, created_at DESC);

      -- Pedidos de recarga com comprovativo, sujeitos a aprovação do admin
      CREATE TABLE IF NOT EXISTS ai_credit_purchase_requests (
        id VARCHAR(120) PRIMARY KEY,
        organization_id VARCHAR(100) NOT NULL,
        organization_name VARCHAR(255),
        user_id VARCHAR(100),
        user_name VARCHAR(255),
        package_id VARCHAR(100),
        package_name VARCHAR(150),
        credits INTEGER NOT NULL DEFAULT 0,
        price_kz NUMERIC NOT NULL DEFAULT 0,
        payment_method VARCHAR(60),
        receipt_url TEXT,
        receipt_file_name VARCHAR(255),
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        rejection_reason TEXT,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ai_credit_req_status ON ai_credit_purchase_requests (status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_credit_req_org ON ai_credit_purchase_requests (organization_id, created_at DESC);

      -- Histórico de gerações (base das estatísticas: top geradores, estilos mais usados)
      CREATE TABLE IF NOT EXISTS ai_generation_jobs (
        id VARCHAR(120) PRIMARY KEY,
        organization_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(100),
        type VARCHAR(30) NOT NULL DEFAULT 'IMAGE',
        style_id VARCHAR(80),
        model VARCHAR(80),
        prompt TEXT,
        aspect_ratio VARCHAR(20),
        resolution VARCHAR(40),
        status VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
        cost_in_credits NUMERIC DEFAULT 0,
        output_url TEXT,
        error TEXT,
        campaign_id VARCHAR(120),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE
      );
      CREATE INDEX IF NOT EXISTS idx_ai_jobs_org ON ai_generation_jobs (organization_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_jobs_user ON ai_generation_jobs (user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_jobs_style ON ai_generation_jobs (style_id);
      CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_generation_jobs (status, created_at DESC);

      -- Pacotes iniciais: espelham exactamente os que estavam fixos no código do cliente
      INSERT INTO ai_credit_packages (id, name, description, credits, price_kz, validity_days, benefits, popular, sort_order)
      VALUES
        ('pkg-starter',  'Starter',  'Ideal para começar a produzir criativos com IA.',        500,   25000,  30,  '["Geração de Imagens","Adaptação de Formatos"]'::jsonb, FALSE, 1),
        ('pkg-growth',   'Growth',   'Para equipas que produzem conteúdo todas as semanas.',    1500,  60000,  60,  '["Tudo do Starter","Geração de Vídeo","Prioridade na fila"]'::jsonb, TRUE, 2),
        ('pkg-pro',      'Pro',      'Produção intensiva, com resolução até 4K.',               5000,  175000, 90,  '["Tudo do Growth","Suporte dedicado","Até 4K de resolução"]'::jsonb, FALSE, 3),
        ('pkg-business', 'Business', 'Volume empresarial com SLA garantido.',                    15000, 450000, 180, '["Modelos exclusivos","Geração em lote","SLA Garantido"]'::jsonb, FALSE, 4)
      ON CONFLICT (id) DO NOTHING;

      -- Saldos iniciais das organizações de demonstração.
      -- IMPORTANTE: o saldo é semeado JUNTAMENTE com a transacção GRANT
      -- correspondente, para que a invariante "saldo == soma do livro-razão"
      -- se mantenha desde o primeiro instante. Semear só o saldo criaria
      -- créditos sem origem e o painel de admin mostraria um razão incoerente.
      INSERT INTO ai_credit_accounts (organization_id, balance, total_granted)
      VALUES
        ('org-publicidade', 5000, 5000),
        ('org-nexora',      5000, 5000),
        ('org-talatona',    2500, 2500),
        ('org-unitel',      2500, 2500)
      ON CONFLICT (organization_id) DO NOTHING;

      INSERT INTO ai_credit_transactions (id, organization_id, type, amount, balance_after, reason, performed_by)
      VALUES
        ('tx-seed-org-publicidade', 'org-publicidade', 'GRANT', 5000, 5000, 'Saldo inicial de demonstração', 'Migração'),
        ('tx-seed-org-nexora',      'org-nexora',      'GRANT', 5000, 5000, 'Saldo inicial de demonstração', 'Migração'),
        ('tx-seed-org-talatona',    'org-talatona',    'GRANT', 2500, 2500, 'Saldo inicial de demonstração', 'Migração'),
        ('tx-seed-org-unitel',      'org-unitel',      'GRANT', 2500, 2500, 'Saldo inicial de demonstração', 'Migração')
      ON CONFLICT (id) DO NOTHING;

      -- ═══════════════════════════════════════════════════════════════════════
      -- NÍVEIS DE ACESSO — substituem o conceito de "convite" por criação de conta
      -- Um nível é um nome + grupos de funcionalidades. A coluna users.role guarda
      -- o id do nível e as permissões são resolvidas no login a partir daqui.
      -- ═══════════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS access_levels (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        groups JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_system BOOLEAN DEFAULT FALSE,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- O primeiro início de sessão obriga a trocar a palavra-passe.
      -- DEFAULT TRUE garante que uma conta NOVA fica sempre marcada, mesmo que
      -- algum caminho de criação se esqueça de o definir explicitamente.
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;

      -- As contas que JÁ EXISTIAM não devem ser forçadas a trocar: já usavam o
      -- sistema e interrompê-las seria um efeito colateral indesejado desta
      -- migração. O ALTER acima retro-preenche as linhas antigas com TRUE, por
      -- isso é preciso desmarcá-las — mas só UMA VEZ, senão cada arranque do
      -- servidor apagaria a marca das contas novas legítimas.
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM system_settings WHERE key = 'must_change_password_backfill_done') THEN
          UPDATE users SET must_change_password = FALSE;
          INSERT INTO system_settings (key, value)
          VALUES ('must_change_password_backfill_done', 'true')
          ON CONFLICT (key) DO NOTHING;
          RAISE NOTICE 'Backfill de must_change_password concluído: contas antigas desmarcadas.';
        END IF;
      END $$;

      INSERT INTO access_levels (id, name, description, groups, is_system) VALUES
        ('lvl-super-admin', 'Administrador Geral',
         'Acesso total a tudo o que existe: Nexora Sign, Creative AI e administração da plataforma. É o nível de quem gere o sistema.',
         '["sign.core","sign.campaigns","sign.business","sign.organization","sign.operations","creative.admin","creative.credits","creative.packages","platform.root"]'::jsonb, TRUE),
        ('lvl-business-manager', 'Gestor de Negócios',
         'Acesso ao painel do Nexora Sign apenas na área comercial: clientes, anunciantes, parceiros, pacotes, contratos e financeiro. Sem acesso a displays, conteúdos ou programação.',
         '["sign.business","sign.organization"]'::jsonb, TRUE),
        ('lvl-creative-admin', 'Admin do Creative AI',
         'Acesso exclusivo ao painel de administração do Nexora Creative AI — créditos, aprovações, pacotes e analítica de geração. Sem acesso ao Nexora Sign.',
         '["creative.admin","creative.credits","creative.packages"]'::jsonb, TRUE),
        ('lvl-creative-viewer', 'Observador do Creative AI',
         'Vê o painel do Creative AI e a sua analítica, mas não aprova recargas nem altera pacotes.',
         '["creative.admin"]'::jsonb, TRUE),
        ('lvl-operations', 'Operador de Rede',
         'Operação diária do Nexora Sign: displays, conteúdos, playlists, programação e manutenção de rede. Sem área comercial nem financeira.',
         '["sign.core","sign.operations"]'::jsonb, TRUE)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Auto-backfill commissions for existing campaigns if partner_commissions is empty
    const commCount = await pool.query('SELECT COUNT(*) FROM partner_commissions').catch(() => ({ rows: [{ count: 0 }] }));
    if (parseInt(commCount.rows[0]?.count || '0') === 0) {
      const liveCamps = await pool.query("SELECT * FROM campaigns").catch(() => ({ rows: [] }));
      for (const camp of liveCamps.rows) {
        const budget = parseFloat(camp.budget || '450000');
        const commRate = 0.15;
        const commAmount = Math.round(budget * commRate);
        await pool.query(`
          INSERT INTO partner_commissions (id, campaign_id, organization_id, advertiser_name, campaign_title, display_code, display_venue, total_budget_kz, commission_amount_kz, commission_rate, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', NOW())
          ON CONFLICT (id) DO NOTHING
        `, [
          `com-camp-${camp.id}`,
          camp.id,
          'org-talatona',
          camp.advertiser_name || 'Anunciante Marketplace',
          camp.name || 'Campanha Publicitária Nexora',
          'DSP-01',
          'Belas Shopping Talatona - Hall Principal',
          budget,
          commAmount,
          commRate
        ]).catch(() => {});
      }
      if (liveCamps.rows.length > 0) {
        console.log(`💰 Auto-geradas ${liveCamps.rows.length} comissões para o painel do parceiro.`);
      }
    }

    const missingPlaylists = await pool.query(`
      SELECT d.id, d.name, d.organization_id 
      FROM displays d 
      LEFT JOIN playlists p ON p.id = d.current_playlist_id 
      WHERE d.current_playlist_id IS NULL OR p.id IS NULL
    `);

    for (const d of missingPlaylists.rows) {
      const plId = 'ply-' + d.id.replace('dsp-', '');
      const plName = 'Playlist ' + d.name;
      const orgId = d.organization_id || 'org-talatona';
      await pool.query(`
        INSERT INTO playlists (id, name, items_count, duration, organization_id, items, status, display_id, is_system_locked)
        VALUES ($1, $2, 0, 0, $3, '[]'::jsonb, 'ACTIVE', $4, true)
        ON CONFLICT (id) DO UPDATE SET display_id = $4, is_system_locked = true;
      `, [plId, plName, orgId, d.id]);
      await pool.query('UPDATE displays SET current_playlist_id = $1 WHERE id = $2', [plId, d.id]);
    }
    if (missingPlaylists.rows.length > 0) {
      console.log(`📺 Auto-vinculadas ${missingPlaylists.rows.length} playlists dedicadas a displays.`);
    }

    // Ensure playback_loops has all required telemetry columns
    await pool.query('ALTER TABLE playback_loops ADD COLUMN IF NOT EXISTS media_id VARCHAR(100)').catch(() => {});
    await pool.query('ALTER TABLE playback_loops ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(100)').catch(() => {});

    /**
     * ─── RECONCILIAÇÃO DE ESQUEMA (tabelas antigas) ──────────────────────────
     *
     * As tabelas `displays` e `playlists` foram criadas antes de existir sistema
     * de migrações e `CREATE TABLE IF NOT EXISTS` NÃO acrescenta colunas a uma
     * tabela já existente. Sem estas linhas, um INSERT que use uma coluna nova
     * falha com 42703 e a operação (fatura, playlist do display, etc.) perde-se
     * em silêncio. `ADD COLUMN IF NOT EXISTS` é idempotente.
     */
    await pool.query(`
      ALTER TABLE playlists
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'ACTIVE',
        ADD COLUMN IF NOT EXISTS display_id VARCHAR(120),
        ADD COLUMN IF NOT EXISTS is_system_locked BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS items_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0
    `).catch((e: any) => console.warn('⚠️ Reconciliação de playlists:', e.message));

    await pool.query(`
      ALTER TABLE displays
        ADD COLUMN IF NOT EXISTS current_playlist_id VARCHAR(120),
        ADD COLUMN IF NOT EXISTS current_media_url TEXT,
        ADD COLUMN IF NOT EXISTS current_content TEXT,
        ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS specs JSONB,
        ADD COLUMN IF NOT EXISTS max_ad_slots INTEGER DEFAULT 8,
        ADD COLUMN IF NOT EXISTS daily_rate_kz NUMERIC DEFAULT 95000
    `).catch((e: any) => console.warn('⚠️ Reconciliação de displays:', e.message));

    await pool.query(`
      ALTER TABLE content_items
        ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 15,
        ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS organization_id VARCHAR(120),
        ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'READY',
        ADD COLUMN IF NOT EXISTS type VARCHAR(40) DEFAULT 'IMAGE'
    `).catch((e: any) => console.warn('⚠️ Reconciliação de content_items:', e.message));

    /**
     * CHATS DO ESTÚDIO (imagem e vídeo) — guardados na ORGANIZAÇÃO.
     *
     * Os chats viviam apenas em `localStorage`, que é por navegador: no painel do
     * anunciante (ou noutro computador) a lista aparecia vazia e dava a impressão
     * de que "não estava a salvar". Com esta tabela, o histórico acompanha o
     * utilizador em qualquer painel onde entre.
     */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_sessions (
        id VARCHAR(140) PRIMARY KEY,
        organization_id VARCHAR(140) NOT NULL,
        user_id VARCHAR(140),
        kind VARCHAR(20) NOT NULL DEFAULT 'IMAGE',
        title VARCHAR(300),
        agent_id VARCHAR(140),
        messages JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `).catch((e: any) => console.warn('⚠️ Criação de ai_chat_sessions:', e.message));

    await pool.query(
      'CREATE INDEX IF NOT EXISTS ai_chat_sessions_org_kind_idx ON ai_chat_sessions (organization_id, kind, updated_at DESC)'
    ).catch(() => {});

    // ═══════════════════════════════════════════════════════════════════════
    // SISTEMA DE AFILIADOS E RECEITA RECORRENTE
    // Permite que afiliados indiquem estabelecimentos, anunciantes e displays,
    // ganhando comissões recorrentes com percentagens configuráveis pelo ADMIN.
    // ═══════════════════════════════════════════════════════════════════════
    await pool.query(`
      CREATE TABLE IF NOT EXISTS affiliate_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO affiliate_settings (key, value, description) VALUES
        ('client_saas_commission_pct', '10.0', 'Percentagem de comissão recorrente sobre planos mensais de estabelecimentos/clientes'),
        ('advertiser_campaign_commission_pct', '7.0', 'Percentagem de comissão recorrente sobre campanhas publicitárias de anunciantes'),
        ('display_owner_commission_pct', '8.0', 'Percentagem de comissão recorrente sobre planos de donos de display'),
        ('display_ad_revshare_commission_pct', '3.0', 'Percentagem adicional para afiliado quando anúncio veicula em display indicado'),
        ('minimum_payout_amount_kz', '25000', 'Valor mínimo em Kwanzas para solicitação de saque de comissões')
      ON CONFLICT (key) DO NOTHING;

      CREATE TABLE IF NOT EXISTS affiliates (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100),
        organization_id VARCHAR(100),
        name VARCHAR(200) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(50),
        referral_code VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        custom_client_saas_pct NUMERIC,
        custom_advertiser_campaign_pct NUMERIC,
        custom_display_owner_pct NUMERIC,
        total_earned_kz NUMERIC DEFAULT 0,
        total_paid_kz NUMERIC DEFAULT 0,
        pending_balance_kz NUMERIC DEFAULT 0,
        bank_name VARCHAR(100),
        account_holder VARCHAR(200),
        iban VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS affiliate_referrals (
        id VARCHAR(100) PRIMARY KEY,
        affiliate_id VARCHAR(100) NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
        referred_organization_id VARCHAR(100) NOT NULL,
        referred_name VARCHAR(200) NOT NULL,
        referred_type VARCHAR(50) NOT NULL,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        total_revenue_generated_kz NUMERIC DEFAULT 0,
        total_commissions_earned_kz NUMERIC DEFAULT 0,
        first_conversion_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS affiliate_commissions (
        id VARCHAR(100) PRIMARY KEY,
        affiliate_id VARCHAR(100) NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
        referral_id VARCHAR(100) REFERENCES affiliate_referrals(id) ON DELETE SET NULL,
        source_type VARCHAR(50) NOT NULL,
        source_id VARCHAR(100),
        source_description VARCHAR(255) NOT NULL,
        payment_amount_kz NUMERIC NOT NULL DEFAULT 0,
        commission_rate NUMERIC NOT NULL DEFAULT 0,
        commission_amount_kz NUMERIC NOT NULL DEFAULT 0,
        status VARCHAR(30) DEFAULT 'APPROVED',
        approved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS affiliate_payout_requests (
        id VARCHAR(100) PRIMARY KEY,
        affiliate_id VARCHAR(100) NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
        amount_kz NUMERIC NOT NULL,
        bank_name VARCHAR(100) NOT NULL,
        account_holder VARCHAR(200) NOT NULL,
        iban VARCHAR(100) NOT NULL,
        receipt_url TEXT,
        status VARCHAR(30) DEFAULT 'PENDING',
        notes TEXT,
        reviewed_by VARCHAR(100),
        paid_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS affiliate_referral_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS referred_by_affiliate_id VARCHAR(100);

      ALTER TABLE displays
        ADD COLUMN IF NOT EXISTS is_powered_on BOOLEAN DEFAULT true;
    `).catch((e: any) => console.warn('⚠️ Reconciliação de afiliados/displays:', e.message));
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
