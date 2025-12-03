-- PostgreSQL Schema for Marketing CRM

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'caller');
CREATE TYPE hotel_status AS ENUM ('NEW', 'CALLING', 'NO_ANSWER', 'NOT_INTERESTED', 'INTERESTED', 'DEMO_BOOKED', 'SIGNED');

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Regions Table
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for regions updated_at
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Hotels Table
CREATE TABLE IF NOT EXISTS hotels (
    id VARCHAR(36) PRIMARY KEY,
    hotel_name VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    status hotel_status DEFAULT 'NEW',
    assignee_id VARCHAR(36),
    next_follow_up_date DATE,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Trigger for hotels last_updated_at
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for hotels
CREATE INDEX IF NOT EXISTS idx_hotels_region ON hotels(region);
CREATE INDEX IF NOT EXISTS idx_hotels_status ON hotels(status);
CREATE INDEX IF NOT EXISTS idx_hotels_assignee ON hotels(assignee_id);
CREATE INDEX IF NOT EXISTS idx_hotels_follow_up ON hotels(next_follow_up_date);

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR(36) PRIMARY KEY,
    hotel_id VARCHAR(36) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Create index for notes
CREATE INDEX IF NOT EXISTS idx_notes_hotel ON notes(hotel_id);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    hotel_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    old_status hotel_status,
    new_status hotel_status,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_hotel ON activity_logs(hotel_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

