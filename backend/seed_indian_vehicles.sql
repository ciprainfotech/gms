-- =====================================================================
-- Complete Indian Vehicle Dataset (Mass Market, Commercial, Luxury & EVs)
-- Run this script in your Supabase SQL Editor or Postgres Console.
-- =====================================================================

BEGIN;

-- 1. MARUTI SUZUKI
INSERT INTO makes (name) VALUES ('Maruti Suzuki') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Alto 800', 2000, 2023, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Alto K10', 2010, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Swift', 2005, NULL, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Dzire / Swift Dzire', 2008, NULL, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Baleno', 2015, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Wagon R', 1999, NULL, ARRAY['Petrol', 'CNG', 'LPG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Brezza / Vitara Brezza', 2016, NULL, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Ertiga', 2012, NULL, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'XL6', 2019, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Grand Vitara', 2022, NULL, ARRAY['Petrol', 'Hybrid', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Fronx', 2023, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Jimny', 2023, NULL, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Invicto', 2023, NULL, ARRAY['Hybrid']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Ignis', 2017, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Ciaz', 2014, NULL, ARRAY['Petrol', 'Diesel', 'Hybrid']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Celerio', 2014, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'S-Presso', 2019, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Eeco', 2010, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Omni', 1984, 2019, ARRAY['Petrol', 'LPG', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Gypsy', 1985, 2019, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Ritz', 2009, 2017, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'SX4', 2007, 2014, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Zen / Zen Estilo', 1993, 2013, ARRAY['Petrol', 'LPG', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Maruti 800', 1983, 2014, ARRAY['Petrol', 'LPG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Super Carry (Commercial)', 2016, NULL, ARRAY['Petrol', 'CNG'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 2. TATA MOTORS
INSERT INTO makes (name) VALUES ('Tata Motors') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Tata Motors'), 'Nexon', 2017, NULL, ARRAY['Petrol', 'Diesel', 'EV']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Nexon EV', 2020, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Punch', 2021, NULL, ARRAY['Petrol', 'CNG', 'EV']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Tiago', 2016, NULL, ARRAY['Petrol', 'CNG', 'EV']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Tigor', 2017, NULL, ARRAY['Petrol', 'CNG', 'EV']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Harrier', 2019, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Safari', 2021, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Safari Storme / Old Safari', 1998, 2019, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Curvv', 2024, NULL, ARRAY['Petrol', 'Diesel', 'EV']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Altroz', 2020, NULL, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Hexa', 2017, 2020, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Sumo / Sumo Gold', 1994, 2019, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Indica / Indica Vista', 1998, 2018, ARRAY['Petrol', 'Diesel', 'LPG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Indigo / Indigo CS / Manza', 2002, 2018, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Nano', 2008, 2018, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Ace / Ace Gold (Commercial)', 2005, NULL, ARRAY['Diesel', 'CNG', 'EV', 'Petrol']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Intra V10 / V30 / V50 (Commercial)', 2019, NULL, ARRAY['Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Yodha Pickup (Commercial)', 2017, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Winger Van (Commercial)', 2007, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Magic Express (Commercial)', 2007, NULL, ARRAY['Diesel', 'CNG'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 3. MAHINDRA
INSERT INTO makes (name) VALUES ('Mahindra') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Mahindra'), 'Thar / Thar ROXX', 2010, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Scorpio / Scorpio Classic', 2002, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Scorpio-N', 2022, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'XUV700', 2021, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'XUV300 / XUV 3XO', 2019, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'XUV500', 2011, 2021, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'XUV400 EV', 2023, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Bolero / Bolero Neo', 2000, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Bolero Pik-Up / Maxi Truck (Commercial)', 2001, NULL, ARRAY['Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Bolero Camper Pickup', 2004, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Supro Profit Truck / Van (Commercial)', 2016, NULL, ARRAY['Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Jeeto / Jeeto Plus (Commercial)', 2015, NULL, ARRAY['Diesel', 'CNG', 'Petrol']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Marazzo', 2018, 2024, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'TUV300 / TUV300 Plus', 2015, 2021, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'KUV100 / KUV100 NXT', 2016, 2023, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Xylo', 2009, 2019, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Verito / Vibe / Logan', 2007, 2019, ARRAY['Petrol', 'Diesel', 'EV']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Armada / Major / Commander', 1990, 2010, ARRAY['Diesel'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 4. HYUNDAI
INSERT INTO makes (name) VALUES ('Hyundai') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Hyundai'), 'Creta', 2015, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Venue', 2019, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'i20 / Elite i20 / N Line', 2008, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Grand i10 / Nios', 2013, NULL, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Exter', 2023, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Verna', 2006, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Alcazar', 2021, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Tucson', 2005, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Santro / Santro Xing', 1998, 2022, ARRAY['Petrol', 'CNG', 'LPG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Eon', 2011, 2019, ARRAY['Petrol', 'LPG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Elantra', 2004, 2022, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Kona Electric', 2019, 2024, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Ioniq 5', 2023, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Aura', 2020, NULL, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Xcent', 2014, 2020, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Accent', 1999, 2013, ARRAY['Petrol', 'Diesel', 'LPG'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 5. TOYOTA
INSERT INTO makes (name) VALUES ('Toyota') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Toyota'), 'Fortuner / Legender', 2009, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Innova Crysta / Innova', 2005, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Innova Hycross', 2022, NULL, ARRAY['Petrol', 'Hybrid']),
((SELECT id FROM makes WHERE name='Toyota'), 'Urban Cruiser Hyryder', 2022, NULL, ARRAY['Petrol', 'Hybrid', 'CNG']),
((SELECT id FROM makes WHERE name='Toyota'), 'Glanza', 2019, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Toyota'), 'Rumion', 2023, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Toyota'), 'Hilux Pickup', 2022, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Camry / Hybrid', 2002, NULL, ARRAY['Petrol', 'Hybrid']),
((SELECT id FROM makes WHERE name='Toyota'), 'Land Cruiser LC200 / LC300', 2009, NULL, ARRAY['Diesel', 'Petrol']),
((SELECT id FROM makes WHERE name='Toyota'), 'Corolla Altis', 2003, 2020, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Etios / Liva / Cross', 2010, 2020, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Qualis', 2000, 2005, ARRAY['Diesel'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 6. HONDA
INSERT INTO makes (name) VALUES ('Honda') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Honda'), 'City (1st - 5th Gen)', 1998, NULL, ARRAY['Petrol', 'Diesel', 'Hybrid']),
((SELECT id FROM makes WHERE name='Honda'), 'Amaze', 2013, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'Elevate', 2023, NULL, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Honda'), 'WR-V', 2017, 2023, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'Jazz', 2009, 2023, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'Civic', 2006, 2021, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'CR-V', 2003, 2021, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'Brio', 2011, 2019, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Honda'), 'Accord', 2001, 2020, ARRAY['Petrol', 'Hybrid'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 7. KIA
INSERT INTO makes (name) VALUES ('Kia') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Kia'), 'Seltos', 2019, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Kia'), 'Sonet', 2020, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Kia'), 'Carens', 2022, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Kia'), 'Carnival', 2020, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Kia'), 'EV6 / EV9', 2022, NULL, ARRAY['EV'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 8. LUXURY BRANDS (Mercedes-Benz, BMW, Audi, Jaguar, Land Rover, Volvo, Porsche, Lexus)
INSERT INTO makes (name) VALUES 
('Mercedes-Benz'), ('BMW'), ('Audi'), ('Jaguar'), ('Land Rover'), ('Volvo'), ('MG (Morris Garages)'), ('Volkswagen'), ('Skoda'), ('Force Motors'), ('Ashok Leyland (Commercial)'), ('Ford'), ('Chevrolet'), ('Fiat'), ('BYD (Electric Vehicles)'), ('Lexus (Luxury)'), ('Porsche (Sports & Luxury)')
ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Mercedes-Benz'), 'C-Class (C200/C220d)', 2001, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mercedes-Benz'), 'E-Class (E200/E220d/E350d)', 1995, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mercedes-Benz'), 'S-Class (S350d/S450)', 2000, NULL, ARRAY['Petrol', 'Diesel', 'Hybrid']),
((SELECT id FROM makes WHERE name='Mercedes-Benz'), 'GLA / GLB / GLC / GLE / GLS SUV', 2014, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='BMW'), '3 Series / Gran Limousine', 2005, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='BMW'), '5 Series / Long Wheelbase', 2007, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='BMW'), '7 Series', 2006, NULL, ARRAY['Petrol', 'Diesel', 'Hybrid']),
((SELECT id FROM makes WHERE name='BMW'), 'X1 / X3 / X5 / X7 SUV Series', 2007, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Audi'), 'A4 / A6 / A8 L Sedan', 2007, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Audi'), 'Q3 / Q5 / Q7 / Q8 SUV', 2006, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Jaguar'), 'XE / XF / XJ / F-Pace', 2009, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Land Rover'), 'Range Rover / Sport / Velar / Evoque', 2006, NULL, ARRAY['Petrol', 'Diesel', 'Hybrid']),
((SELECT id FROM makes WHERE name='Land Rover'), 'Defender 90 / 110 / 130', 2020, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Volvo'), 'XC40 / XC60 / XC90 SUV', 2006, NULL, ARRAY['Petrol', 'Diesel', 'EV', 'Hybrid']),
((SELECT id FROM makes WHERE name='Ashok Leyland (Commercial)'), 'Dost / Dost+ / Bada Dost Pickup', 2011, NULL, ARRAY['Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Force Motors'), 'Gurkha 4x4 / Traveller Van', 1987, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='MG (Morris Garages)'), 'Hector / Astor / ZS EV / Gloster / Windsor', 2019, NULL, ARRAY['Petrol', 'Diesel', 'EV'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;

COMMIT;
