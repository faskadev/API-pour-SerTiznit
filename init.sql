-- Create artisans table for SerTiznit project
CREATE TABLE IF NOT EXISTS artisans (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  profession VARCHAR(50) NOT NULL,
  telephone VARCHAR(20),
  adresse TEXT,
  note NUMERIC(2,1) DEFAULT 0.0
);

