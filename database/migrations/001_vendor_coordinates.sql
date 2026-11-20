-- Run once on an existing database (the fresh schema.sql already includes these columns).
USE batloung_farm;

ALTER TABLE vendors
  ADD COLUMN latitude  DECIMAL(9,6) NULL AFTER location,
  ADD COLUMN longitude DECIMAL(9,6) NULL AFTER latitude,
  ADD CONSTRAINT chk_vendor_lat CHECK (latitude  IS NULL OR latitude  BETWEEN -90  AND 90),
  ADD CONSTRAINT chk_vendor_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

-- Approximate coordinates for the seeded vendors (adjust exact pins in the app).
UPDATE vendors SET latitude=-29.313000, longitude=27.480000 WHERE phone_number='+266 5801 0001';
UPDATE vendors SET latitude=-29.345000, longitude=27.495000 WHERE phone_number='+266 5801 0002';
UPDATE vendors SET latitude=-29.322000, longitude=27.512000 WHERE phone_number='+266 5801 0003';
UPDATE vendors SET latitude=-29.314500, longitude=27.484500 WHERE phone_number='+266 5801 0004';
UPDATE vendors SET latitude=-29.360000, longitude=27.556000 WHERE phone_number='+266 5801 0005';
UPDATE vendors SET latitude=-29.329000, longitude=27.518000 WHERE phone_number='+266 5801 0006';
UPDATE vendors SET latitude=-28.888000, longitude=27.899000 WHERE phone_number='+266 5801 0007';
UPDATE vendors SET latitude=-29.146000, longitude=27.745000 WHERE phone_number='+266 5801 0008';
