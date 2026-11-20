USE batloung_farm;

INSERT INTO suppliers (business_name, contact_person, phone, province, address) VALUES
('Highveld Fresh Produce','Thabo Molefe','+27 11 555 0101','Gauteng','12 Market Rd, Johannesburg'),
('Free State Orchards','Anika van Wyk','+27 51 555 0102','Free State','4 Farm Lane, Bloemfontein'),
('Durban Tropical Growers','Sipho Dlamini','+27 31 555 0103','KwaZulu-Natal','88 Bay Ave, Durban'),
('Cape Apple Co-op','Liezel Botha','+27 21 555 0104','Western Cape','Elgin Valley Rd, Grabouw'),
('Karoo Citrus Estate','Zola Mbeki','+27 41 555 0105','Eastern Cape','Citrus Way, Gqeberha'),
('Limpopo Mango Farms','Tshepo Maake','+27 15 555 0106','Limpopo','Tzaneen Rd 22, Tzaneen'),
('Lowveld Banana Traders','Nomsa Khoza','+27 13 555 0107','Mpumalanga','Nelspruit Rd 7, Mbombela'),
('Orange River Grapes','Pieter Naude','+27 18 555 0108','North West','Vineyard St 3, Mahikeng');

INSERT INTO fruits (fruit_name, description, status) VALUES
('Apples','Crisp Granny Smith and Royal Gala apples','ACTIVE'),
('Bananas','Sweet Lowveld bananas, graded by size','ACTIVE'),
('Oranges','Juicy Valencia navel oranges','ACTIVE'),
('Mangoes','Ripe Tommy Atkins and Kent mangoes','ACTIVE'),
('Grapes','Seedless table grapes','ACTIVE');

-- Coordinates are approximate area centres. Pin each vendor's exact spot from Vendors > Edit.
INSERT INTO vendors (vendor_name, phone_number, location, latitude, longitude, registration_date) VALUES
('Mamello Fruit Stand','+266 5801 0001','Maseru Central',-29.313000,27.480000,'2026-01-12'),
('Lerato Street Fruits','+266 5801 0002','Thetsane, Maseru',-29.345000,27.495000,'2026-01-20'),
('Tumelo Fresh Corner','+266 5801 0003','Ha Thamae, Maseru',-29.322000,27.512000,'2026-02-03'),
('Palesa Market Stall','+266 5801 0004','Maseru Bus Rank',-29.314500,27.484500,'2026-02-14'),
('Retselisitsoe Traders','+266 5801 0005','Mazenod',-29.360000,27.556000,'2026-03-01'),
('Nthabiseng Fruits','+266 5801 0006','Lower Thamae',-29.329000,27.518000,'2026-03-18'),
('Khotso Mini Market','+266 5801 0007','Maputsoe',-28.888000,27.899000,'2026-04-05'),
('Matseliso Fresh','+266 5801 0008','Teyateyaneng',-29.146000,27.745000,'2026-05-09');

-- Stock (fruit x size) with selling prices in Maloti (M) per box. Some rows deliberately low.
INSERT INTO stock (fruit_id, packaging_size, available_quantity, selling_price) VALUES
(1,'SMALL',60,120.00),(1,'MEDIUM',45,180.00),(1,'LARGE',8,250.00),
(2,'SMALL',70,90.00), (2,'MEDIUM',50,140.00),(2,'LARGE',35,200.00),
(3,'SMALL',55,100.00),(3,'MEDIUM',12,150.00),(3,'LARGE',40,210.00),
(4,'SMALL',30,160.00),(4,'MEDIUM',25,230.00),(4,'LARGE',6,320.00),
(5,'SMALL',40,170.00),(5,'MEDIUM',28,250.00),(5,'LARGE',22,340.00);

INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES
(4,'2026-10-01 08:30:00',0),(7,'2026-10-03 09:15:00',0),(5,'2026-10-06 10:00:00',0),(6,'2026-10-08 07:45:00',0),(8,'2026-10-10 11:20:00',0);

INSERT INTO purchase_details (purchase_id, fruit_id, quantity, unit_cost, packaging_size) VALUES
(1,1,60,80.00,'SMALL'),(1,1,45,125.00,'MEDIUM'),(1,1,30,175.00,'LARGE'),
(2,2,70,55.00,'SMALL'),(2,2,50,95.00,'MEDIUM'),(2,2,40,140.00,'LARGE'),
(3,3,55,65.00,'SMALL'),(3,3,40,105.00,'MEDIUM'),(3,3,40,150.00,'LARGE'),
(4,4,40,110.00,'SMALL'),(4,4,30,160.00,'MEDIUM'),(4,4,20,230.00,'LARGE'),
(5,5,40,120.00,'SMALL'),(5,5,28,175.00,'MEDIUM'),(5,5,22,240.00,'LARGE');

UPDATE purchases p SET total_amount = (SELECT SUM(quantity*unit_cost) FROM purchase_details d WHERE d.purchase_id = p.purchase_id);

INSERT INTO sales (vendor_id, sale_date, payment_method) VALUES
(1,'2026-10-12 09:00:00','CASH'),(2,'2026-10-13 10:30:00','MOBILE_MONEY'),(3,'2026-10-14 08:10:00','CREDIT'),
(1,'2026-10-18 14:00:00','CASH'),(4,'2026-10-20 09:40:00','CASH'),(5,'2026-10-25 11:00:00','CREDIT'),
(2,'2026-11-02 08:20:00','MOBILE_MONEY'),(6,'2026-11-05 13:15:00','CASH');

INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES
(1,1,'LARGE',10,250.00),(1,2,'SMALL',8,90.00),
(2,3,'MEDIUM',15,150.00),(2,5,'SMALL',5,170.00),
(3,4,'LARGE',6,320.00),(3,1,'MEDIUM',10,180.00),
(4,2,'LARGE',12,200.00),(4,1,'LARGE',12,250.00),
(5,5,'MEDIUM',9,250.00),(5,3,'SMALL',10,100.00),
(6,2,'MEDIUM',14,140.00),(6,4,'SMALL',10,160.00),
(7,1,'SMALL',12,120.00),(7,3,'LARGE',8,210.00),
(8,5,'LARGE',6,340.00),(8,2,'SMALL',9,90.00);

UPDATE sales s SET total_amount = (SELECT SUM(quantity*unit_price) FROM sales_details d WHERE d.sale_id = s.sale_id);

INSERT INTO payments (sale_id, amount, method, payment_date) VALUES
(1, 3220.00,'CASH','2026-10-12 09:05:00'),
(2, 1500.00,'MOBILE_MONEY','2026-10-13 10:35:00'),
(4, 2000.00,'CASH','2026-10-18 14:05:00'),
(5, 3250.00,'CASH','2026-10-20 09:45:00'),
(6,  500.00,'MOBILE_MONEY','2026-10-26 12:00:00'),
(7, 3120.00,'MOBILE_MONEY','2026-11-02 08:25:00'),
(8, 1000.00,'CASH','2026-11-05 13:20:00');

UPDATE sales s SET amount_paid = COALESCE((SELECT SUM(amount) FROM payments p WHERE p.sale_id = s.sale_id),0);
UPDATE sales SET payment_status = CASE WHEN amount_paid >= total_amount THEN 'PAID' WHEN amount_paid > 0 THEN 'PARTIALLY_PAID' ELSE 'UNPAID' END;
