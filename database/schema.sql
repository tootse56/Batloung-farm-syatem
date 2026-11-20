-- Batloung Farm Distribution System - schema
DROP DATABASE IF EXISTS batloung_farm;
CREATE DATABASE batloung_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE batloung_farm;

CREATE TABLE suppliers (
  supplier_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_name  VARCHAR(120) NOT NULL UNIQUE,
  contact_person VARCHAR(100) NOT NULL,
  phone          VARCHAR(20)  NOT NULL UNIQUE,
  province       ENUM('Gauteng','Free State','KwaZulu-Natal','Western Cape','Eastern Cape','Limpopo','Mpumalanga','North West') NOT NULL,
  address        VARCHAR(255) NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE fruits (
  fruit_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fruit_name  VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255),
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB;

CREATE TABLE vendors (
  vendor_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vendor_name       VARCHAR(120) NOT NULL,
  phone_number      VARCHAR(20)  NOT NULL UNIQUE,
  location          VARCHAR(150) NOT NULL,
  latitude          DECIMAL(9,6) NULL,
  longitude         DECIMAL(9,6) NULL,
  registration_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT chk_vendor_lat CHECK (latitude  IS NULL OR latitude  BETWEEN -90  AND 90),
  CONSTRAINT chk_vendor_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  INDEX idx_vendor_name (vendor_name)
) ENGINE=InnoDB;

CREATE TABLE purchases (
  purchase_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supplier_id   INT UNSIGNED NOT NULL,
  purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_amount  DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  CONSTRAINT fk_purchase_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE purchase_details (
  purchase_detail_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_id    INT UNSIGNED NOT NULL,
  fruit_id       INT UNSIGNED NOT NULL,
  quantity       INT UNSIGNED NOT NULL CHECK (quantity > 0),
  unit_cost      DECIMAL(10,2) NOT NULL CHECK (unit_cost > 0),
  packaging_size ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  CONSTRAINT fk_pd_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(purchase_id) ON DELETE CASCADE,
  CONSTRAINT fk_pd_fruit FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE sales (
  sale_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vendor_id      INT UNSIGNED NOT NULL,
  sale_date      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_status ENUM('PAID','PARTIALLY_PAID','UNPAID') NOT NULL DEFAULT 'UNPAID',
  total_amount   DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  amount_paid    DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  payment_method ENUM('CASH','MOBILE_MONEY','CREDIT') NOT NULL DEFAULT 'CASH',
  CONSTRAINT chk_paid_le_total CHECK (amount_paid <= total_amount),
  CONSTRAINT fk_sale_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_sale_date (sale_date)
) ENGINE=InnoDB;

CREATE TABLE sales_details (
  sales_detail_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id        INT UNSIGNED NOT NULL,
  fruit_id       INT UNSIGNED NOT NULL,
  packaging_size ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  quantity       INT UNSIGNED NOT NULL CHECK (quantity > 0),
  unit_price     DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  CONSTRAINT fk_sd_sale FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
  CONSTRAINT fk_sd_fruit FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- One row per fruit AND packaging size. selling_price lives here because
-- each packaging size of a fruit has its own price.
CREATE TABLE stock (
  stock_id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fruit_id           INT UNSIGNED NOT NULL,
  packaging_size     ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  available_quantity INT NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  selling_price      DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  CONSTRAINT uq_stock_fruit_size UNIQUE (fruit_id, packaging_size),
  CONSTRAINT fk_stock_fruit FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Supporting table: every payment received against a sale (cash / mobile money).
CREATE TABLE payments (
  payment_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id      INT UNSIGNED NOT NULL,
  amount       DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  method       ENUM('CASH','MOBILE_MONEY') NOT NULL,
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_sale FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE
) ENGINE=InnoDB;
