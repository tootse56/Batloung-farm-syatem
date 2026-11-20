USE batloung_farm;

-- 1. Five most frequently sold fruits (by boxes)
SELECT f.fruit_name, SUM(sd.quantity) AS boxes_sold
FROM sales_details sd JOIN fruits f ON f.fruit_id = sd.fruit_id
GROUP BY f.fruit_id, f.fruit_name ORDER BY boxes_sold DESC LIMIT 5;

-- 2. Total sales revenue in a date range (change the dates)
SELECT COALESCE(SUM(total_amount),0) AS revenue, COUNT(*) AS sales_count
FROM sales WHERE sale_date >= '2026-10-01' AND sale_date < DATE_ADD('2026-11-30', INTERVAL 1 DAY);

-- 3. Vendor who purchased the highest number of boxes
SELECT v.vendor_name, SUM(sd.quantity) AS total_boxes
FROM vendors v JOIN sales s ON s.vendor_id = v.vendor_id JOIN sales_details sd ON sd.sale_id = s.sale_id
GROUP BY v.vendor_id, v.vendor_name ORDER BY total_boxes DESC LIMIT 1;

-- 4. Current stock levels per fruit and packaging size
SELECT f.fruit_name, st.packaging_size, st.available_quantity, st.selling_price
FROM stock st JOIN fruits f ON f.fruit_id = st.fruit_id
ORDER BY f.fruit_name, FIELD(st.packaging_size,'SMALL','MEDIUM','LARGE');

-- Bonus: outstanding balance per vendor
SELECT v.vendor_name, SUM(s.total_amount - s.amount_paid) AS outstanding
FROM vendors v JOIN sales s ON s.vendor_id = v.vendor_id GROUP BY v.vendor_id ORDER BY outstanding DESC;
