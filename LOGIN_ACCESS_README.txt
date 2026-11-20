BATLOUNG FARM LOGIN AND VENDOR ORDER ACCESS

Admin login
  Username: admin
  Password: 5658

Sales login
  Username: sales
  Password: 0766

Vendor login
  Select Vendor, then enter the vendor ID and the phone number already registered
  for that vendor in the vendors table. A vendor can only retrieve orders whose
  sales.vendor_id matches that vendor's own vendor_id.

The admin and sales accounts are configured in backend/.env:
  ADMIN_USERNAME / ADMIN_PASSWORD
  SALES_USERNAME / SALES_PASSWORD
  JWT_SECRET

Change the two staff passwords and JWT_SECRET before putting the application
on a public server. The values in this package are for the local project setup.

IMPORTANT VENDOR LOGIN NOTE
The current database schema does not have a vendor password field. To avoid
changing the database schema, vendor login uses the vendor's ID plus registered
phone number. For stronger production security, add individual vendor passwords
and store only password hashes.

No existing tables or business records are dropped or recreated by these changes.
