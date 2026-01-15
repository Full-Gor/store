-- NexusStore Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'developer', 'admin')),
  avatar VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- APPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(255),
  icon VARCHAR(255),
  screenshots TEXT[],
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  type VARCHAR(10) NOT NULL CHECK (type IN ('apk', 'aab', 'pwa')),
  version VARCHAR(20) NOT NULL,
  version_code INTEGER,
  package_name VARCHAR(255),
  min_sdk INTEGER,
  size BIGINT,
  file_path VARCHAR(255),
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  featured BOOLEAN DEFAULT FALSE,
  is_hot BOOLEAN DEFAULT FALSE,
  developer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PURCHASES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  app_id UUID REFERENCES apps(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL,
  stripe_payment_id VARCHAR(255),
  stripe_session_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, app_id)
);

-- =============================================
-- DOWNLOADS TABLE (Analytics)
-- =============================================
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_apps_developer ON apps(developer_id);
CREATE INDEX IF NOT EXISTS idx_apps_status ON apps(status);
CREATE INDEX IF NOT EXISTS idx_apps_category ON apps(category);
CREATE INDEX IF NOT EXISTS idx_apps_type ON apps(type);
CREATE INDEX IF NOT EXISTS idx_apps_featured ON apps(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_apps_slug ON apps(slug);
CREATE INDEX IF NOT EXISTS idx_apps_name ON apps(name);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_app ON purchases(app_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_downloads_app ON downloads(app_id);
CREATE INDEX IF NOT EXISTS idx_downloads_created ON downloads(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_app ON reviews(app_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for apps table
DROP TRIGGER IF EXISTS update_apps_updated_at ON apps;
CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON apps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- SAMPLE DATA (for development)
-- =============================================

-- Insert admin user (password: admin123)
INSERT INTO users (email, password, name, role)
VALUES (
  'admin@nexusstore.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X0y0MXQ0rYq7bKWmi',
  'Admin',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert demo developer (password: developer123)
INSERT INTO users (email, password, name, role)
VALUES (
  'dev@nexusstore.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X0y0MXQ0rYq7bKWmi',
  'Demo Developer',
  'developer'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample apps (if developer exists)
DO $$
DECLARE
  dev_id UUID;
BEGIN
  SELECT id INTO dev_id FROM users WHERE email = 'dev@nexusstore.com';

  IF dev_id IS NOT NULL THEN
    INSERT INTO apps (name, slug, description, short_description, category, price, type, version, downloads, rating, status, is_hot, developer_id)
    VALUES
      ('NexusChat', 'nexuschat', 'Application de messagerie instantanée sécurisée avec chiffrement de bout en bout.', 'Messagerie sécurisée', 'Communication', 0, 'apk', '2.4.1', 125400, 4.8, 'approved', true, dev_id),
      ('PhotoMaster Pro', 'photomaster-pro', 'Éditeur photo professionnel avec filtres avancés et outils de retouche.', 'Éditeur photo pro', 'Photo & Vidéo', 4.99, 'apk', '3.1.0', 89000, 4.6, 'approved', false, dev_id),
      ('FitTrack', 'fittrack', 'Suivez vos activités sportives, votre alimentation et votre sommeil.', 'Suivi fitness', 'Santé & Fitness', 2.99, 'pwa', '1.8.5', 234000, 4.9, 'approved', true, dev_id),
      ('CodePad', 'codepad', 'Éditeur de code léger avec coloration syntaxique et support multi-langage.', 'Éditeur de code', 'Productivité', 0, 'pwa', '2.0.0', 67000, 4.7, 'approved', false, dev_id),
      ('BudgetWise', 'budgetwise', 'Gérez vos finances personnelles et suivez vos dépenses facilement.', 'Gestion finances', 'Finance', 1.99, 'apk', '4.2.0', 156000, 4.5, 'approved', true, dev_id),
      ('MusicFlow', 'musicflow', 'Lecteur de musique élégant avec égaliseur et support des playlists.', 'Lecteur musique', 'Musique', 0, 'apk', '5.0.2', 98000, 4.4, 'approved', false, dev_id)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- =============================================
-- VIEWS (Optional, for analytics)
-- =============================================

-- View for app stats
CREATE OR REPLACE VIEW app_stats AS
SELECT
  a.id,
  a.name,
  a.downloads,
  a.rating,
  a.rating_count,
  COUNT(DISTINCT p.id) as total_purchases,
  COALESCE(SUM(p.amount - p.commission), 0) as developer_revenue
FROM apps a
LEFT JOIN purchases p ON a.id = p.app_id AND p.status = 'completed'
GROUP BY a.id;

-- View for developer stats
CREATE OR REPLACE VIEW developer_stats AS
SELECT
  u.id as developer_id,
  u.name as developer_name,
  COUNT(DISTINCT a.id) as total_apps,
  COALESCE(SUM(a.downloads), 0) as total_downloads,
  COALESCE(AVG(a.rating), 0) as avg_rating,
  COALESCE(SUM(p.amount - p.commission), 0) as total_revenue
FROM users u
LEFT JOIN apps a ON u.id = a.developer_id
LEFT JOIN purchases p ON a.id = p.app_id AND p.status = 'completed'
WHERE u.role IN ('developer', 'admin')
GROUP BY u.id;
