-- Saarthi AI Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT,
    demographics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Intents Table
CREATE TABLE IF NOT EXISTS intents (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    trigger_keywords TEXT[]
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    fee DECIMAL,
    sla_days INTEGER,
    description TEXT
);

-- Service Dependencies
CREATE TABLE IF NOT EXISTS service_dependencies (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    requires_service_id INTEGER REFERENCES services(id)
);

-- User Journeys
CREATE TABLE IF NOT EXISTS user_journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    intent_id INTEGER REFERENCES intents(id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journey Steps
CREATE TABLE IF NOT EXISTS journey_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID REFERENCES user_journeys(id),
    service_id INTEGER REFERENCES services(id),
    status TEXT DEFAULT 'pending', -- pending, completed, locked
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Documents
CREATE TABLE IF NOT EXISTS user_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    doc_type TEXT NOT NULL,
    s3_url TEXT,
    extracted_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Schemes
CREATE TABLE IF NOT EXISTS schemes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    eligibility_rules JSONB,
    description TEXT
);

-- Intent to Services Mapping (The Workflow)
CREATE TABLE IF NOT EXISTS intent_services (
    id SERIAL PRIMARY KEY,
    intent_id INTEGER REFERENCES intents(id),
    service_id INTEGER REFERENCES services(id),
    step_order INTEGER NOT NULL -- To define the sequence in the roadmap
);

-- Insert Initial Sample Data
INSERT INTO intents (name, description, trigger_keywords) VALUES 
('Tea Shop', 'Opening a new tea shop or small restaurant', ARRAY['tea shop', 'cafe', 'restaurant', 'canteen']),
('Birth Certificate', 'Applying for a new birth certificate', ARRAY['birth certificate', 'baby', 'newborn']),
('Farm Subsidy', 'Applying for government agricultural subsidies', ARRAY['farm', 'subsidy', 'agriculture', 'farmer']);

INSERT INTO services (name, department, fee, sla_days, description) VALUES 
('Trade License', 'GHMC', 500.00, 15, 'License to trade within municipal limits'),
('FSSAI Registration', 'Health Dept', 100.00, 7, 'Food safety registration'),
('Shop & Establishment', 'Labour Dept', 200.00, 10, 'Registration under Shop & Establishment Act'),
('Birth Registration', 'Municipality', 0.00, 21, 'Registration of birth');

-- Mapping for Tea Shop
INSERT INTO intent_services (intent_id, service_id, step_order) VALUES 
(1, 3, 1), -- Shop & Establishment first
(1, 1, 2), -- Trade License second
(1, 2, 3); -- FSSAI third

-- Mapping for Birth Certificate
INSERT INTO intent_services (intent_id, service_id, step_order) VALUES 
(2, 4, 1);

-- Dependencies for Tea Shop
-- Trade License requires Shop & Establishment
INSERT INTO service_dependencies (service_id, requires_service_id) VALUES 
(1, 3);
