-- =====================================================================
-- Complete Indian Vehicle Dataset (Individual Clean Entries 2000-2026)
-- Covers Mass Market, Commercial Trucks/Pickups, Luxury & EVs
-- =====================================================================

BEGIN;

-- 1. MARUTI SUZUKI
INSERT INTO makes (name) VALUES ('Maruti Suzuki') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Maruti 800', 1983, 2014, ARRAY['Petrol', 'LPG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Omni', 1984, 2019, ARRAY['Petrol', 'LPG', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Gypsy', 1985, 2019, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Zen', 1993, 2006, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Zen Estilo', 2006, 2013, ARRAY['Petrol', 'LPG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Wagon R (1st/2nd Gen)', 1999, 2019, ARRAY['Petrol', 'CNG', 'LPG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Wagon R (New Gen)', 2019, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Alto 800', 2000, 2023, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Alto K10 (1st Gen)', 2010, 2019, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Alto K10 (New Gen)', 2022, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Swift (1st Gen)', 2005, 2011, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Swift (2nd Gen)', 2011, 2018, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Swift (3rd Gen)', 2018, 2024, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Swift (4th Gen)', 2024, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Swift Dzire (1st Gen)', 2008, 2012, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Swift Dzire (2nd Gen)', 2012, 2017, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Dzire (3rd Gen)', 2017, 2024, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Dzire (New Gen)', 2024, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Ritz', 2009, 2017, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'A-Star', 2008, 2014, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Celerio (1st Gen)', 2014, 2021, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Celerio (New Gen)', 2021, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'S-Presso', 2019, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Ignis', 2017, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Baleno (1st Gen Hatch)', 2015, 2022, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Baleno (New Gen)', 2022, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Baleno RS Turbo', 2017, 2020, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Vitara Brezza (Diesel)', 2016, 2020, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Vitara Brezza (Petrol)', 2020, 2022, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Brezza (New Gen)', 2022, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Ertiga (1st Gen)', 2012, 2018, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Ertiga (2nd Gen)', 2018, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'XL6', 2019, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'SX4', 2007, 2014, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Ciaz', 2014, NULL, ARRAY['Petrol', 'Diesel', 'Hybrid']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'S-Cross', 2015, 2022, ARRAY['Diesel', 'Petrol']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Grand Vitara (Old)', 2007, 2015, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Grand Vitara (Hybrid/CNG)', 2022, NULL, ARRAY['Petrol', 'Hybrid', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Fronx', 2023, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Jimny 5-Door', 2023, NULL, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Invicto Hybrid', 2023, NULL, ARRAY['Hybrid']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Kizashi', 2011, 2014, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Eeco', 2010, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Maruti Suzuki'), 'Super Carry (Commercial Pickup)', 2016, NULL, ARRAY['Petrol', 'CNG'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 2. TATA MOTORS
INSERT INTO makes (name) VALUES ('Tata Motors') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Tata Motors'), 'Indica / Indica V2 / eV2', 1998, 2018, ARRAY['Petrol', 'Diesel', 'LPG', 'CNG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Indica Vista', 2008, 2015, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Indigo / Indigo CS', 2002, 2016, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Indigo Manza', 2009, 2015, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Nano', 2008, 2018, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Bolt', 2015, 2019, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Zest', 2014, 2019, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Tiago', 2016, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Tiago EV', 2022, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Tigor', 2017, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Tigor EV / XPRES-T', 2019, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Altroz', 2020, NULL, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Punch', 2021, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Punch EV', 2024, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Nexon (1st Gen)', 2017, 2023, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Nexon (New Gen)', 2023, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Nexon EV', 2020, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Curvv / Curvv EV', 2024, NULL, ARRAY['Petrol', 'Diesel', 'EV']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Harrier', 2019, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Safari Storme (Old)', 1998, 2019, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Safari (New 7-Seater)', 2021, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Sumo / Sumo Gold', 1994, 2019, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Sumo Grande / Movus', 2008, 2016, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Hexa', 2017, 2020, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Aria', 2010, 2017, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Ace / Ace Gold (Commercial)', 2005, NULL, ARRAY['Diesel', 'CNG', 'EV', 'Petrol']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Intra V10 / V30 / V50 Pickup', 2019, NULL, ARRAY['Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Yodha Pickup (Commercial)', 2017, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Xenon / Xenon XT Pickup', 2009, 2019, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Winger Van / Ambulance', 2007, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Tata Motors'), 'Magic / Magic Express Van', 2007, NULL, ARRAY['Diesel', 'CNG'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 3. MAHINDRA
INSERT INTO makes (name) VALUES ('Mahindra') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Mahindra'), 'Bolero', 2000, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Bolero Neo / Neo+', 2021, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Bolero Pik-Up (1.3T / 1.5T / 1.7T)', 2001, NULL, ARRAY['Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Bolero Maxi Truck Plus', 2012, NULL, ARRAY['Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Bolero City Pik-Up', 2019, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Bolero Camper 4x4 Pickup', 2004, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Scorpio Classic (EX/LX/SLE/VLX/S11)', 2002, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Scorpio-N', 2022, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Thar (1st Gen CRDe/DI)', 2010, 2020, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Thar 3-Door (New Gen)', 2020, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Thar ROXX 5-Door', 2024, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'XUV300', 2019, 2024, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'XUV 3XO', 2024, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'XUV500', 2011, 2021, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'XUV700', 2021, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'XUV400 EV', 2023, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Supro Profit Truck / Van', 2016, NULL, ARRAY['Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Jeeto / Jeeto Plus Pickup', 2015, NULL, ARRAY['Diesel', 'CNG', 'Petrol']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Treo / Treo Zor EV', 2020, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Marazzo', 2018, 2024, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'TUV300 / TUV300 Plus', 2015, 2021, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'KUV100 / KUV100 NXT', 2016, 2023, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Alturas G4', 2018, 2022, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Xylo', 2009, 2019, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Quanto', 2012, 2016, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Logan / Verito / Vibe', 2007, 2019, ARRAY['Petrol', 'Diesel', 'EV']),
((SELECT id FROM makes WHERE name='Mahindra'), 'Armada / Major / Commander', 1990, 2010, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Mahindra'), 'MM540 / MM550 Jeep', 1985, 2006, ARRAY['Diesel'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 4. HYUNDAI
INSERT INTO makes (name) VALUES ('Hyundai') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Hyundai'), 'Santro (1st Gen)', 1998, 2003, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Santro Xing', 2003, 2014, ARRAY['Petrol', 'CNG', 'LPG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Santro (New Gen)', 2018, 2022, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Eon', 2011, 2019, ARRAY['Petrol', 'LPG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'i10 (1st Gen)', 2007, 2017, ARRAY['Petrol', 'LPG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Grand i10', 2013, 2020, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Grand i10 Nios', 2019, NULL, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'i20 (1st Gen)', 2008, 2014, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Elite i20 (2nd Gen)', 2014, 2020, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'i20 (3rd Gen)', 2020, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'i20 N Line', 2021, NULL, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Exter', 2023, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Venue', 2019, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Venue N Line', 2022, NULL, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Creta (1st Gen)', 2015, 2020, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Creta (2nd Gen)', 2020, 2024, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Creta (Facelift)', 2024, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Alcazar', 2021, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Verna (Fluidic / 1st-4th Gen)', 2006, 2023, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Verna (New Turbo)', 2023, NULL, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Accent', 1999, 2013, ARRAY['Petrol', 'Diesel', 'LPG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Xcent', 2014, 2020, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Aura', 2020, NULL, ARRAY['Petrol', 'Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Elantra', 2004, 2022, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Sonata / Embera / Transform', 2001, 2015, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Tucson', 2005, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Santa Fe', 2010, 2017, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Kona Electric', 2019, 2024, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Ioniq 5 EV', 2023, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Hyundai'), 'Getz / Getz Prime', 2004, 2010, ARRAY['Petrol', 'Diesel'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 5. TOYOTA
INSERT INTO makes (name) VALUES ('Toyota') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Toyota'), 'Qualis', 2000, 2005, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Innova (1st Gen)', 2005, 2016, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Innova Crysta', 2016, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Innova Hycross', 2022, NULL, ARRAY['Petrol', 'Hybrid']),
((SELECT id FROM makes WHERE name='Toyota'), 'Fortuner (1st Gen)', 2009, 2016, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Fortuner (2nd Gen)', 2016, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Fortuner Legender', 2021, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Urban Cruiser', 2020, 2022, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Toyota'), 'Urban Cruiser Hyryder', 2022, NULL, ARRAY['Petrol', 'Hybrid', 'CNG']),
((SELECT id FROM makes WHERE name='Toyota'), 'Glanza (1st Gen)', 2019, 2022, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Toyota'), 'Glanza (New Gen)', 2022, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Toyota'), 'Rumion', 2023, NULL, ARRAY['Petrol', 'CNG']),
((SELECT id FROM makes WHERE name='Toyota'), 'Hilux Pickup 4x4', 2022, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Etios Sedan', 2010, 2020, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Etios Liva Hatchback', 2011, 2020, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Etios Cross', 2014, 2020, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Yaris', 2018, 2021, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Toyota'), 'Corolla / Corolla Altis', 2003, 2020, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Toyota'), 'Camry / Hybrid', 2002, NULL, ARRAY['Petrol', 'Hybrid']),
((SELECT id FROM makes WHERE name='Toyota'), 'Land Cruiser LC100 / LC200 / LC300', 2003, NULL, ARRAY['Diesel', 'Petrol']),
((SELECT id FROM makes WHERE name='Toyota'), 'Vellfire Luxury MPV', 2020, NULL, ARRAY['Hybrid'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 6. HONDA
INSERT INTO makes (name) VALUES ('Honda') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Honda'), 'City (1st Gen)', 1998, 2003, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Honda'), 'City ZX (2nd Gen)', 2003, 2008, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Honda'), 'City (3rd Gen)', 2008, 2014, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Honda'), 'City (4th Gen)', 2014, 2023, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'City (5th Gen)', 2020, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'City e:HEV Hybrid', 2022, NULL, ARRAY['Hybrid']),
((SELECT id FROM makes WHERE name='Honda'), 'Amaze (1st Gen)', 2013, 2018, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'Amaze (2nd Gen)', 2018, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'Elevate', 2023, NULL, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Honda'), 'WR-V', 2017, 2023, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'Jazz', 2009, 2023, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'Brio', 2011, 2019, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Honda'), 'Mobilio', 2014, 2017, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'BR-V', 2016, 2020, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'Civic (8th / 10th Gen)', 2006, 2021, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'CR-V', 2003, 2021, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Honda'), 'Accord / Hybrid', 2001, 2020, ARRAY['Petrol', 'Hybrid'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 7. KIA
INSERT INTO makes (name) VALUES ('Kia') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Kia'), 'Seltos (1st Gen)', 2019, 2023, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Kia'), 'Seltos (Facelift)', 2023, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Kia'), 'Sonet (1st Gen)', 2020, 2024, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Kia'), 'Sonet (Facelift)', 2024, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Kia'), 'Carens', 2022, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Kia'), 'Carnival (1st Gen)', 2020, 2023, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Kia'), 'Carnival (New Gen)', 2024, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='Kia'), 'EV6', 2022, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Kia'), 'EV9', 2024, NULL, ARRAY['EV'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 8. VOLKSWAGEN & SKODA
INSERT INTO makes (name) VALUES ('Volkswagen'), ('Skoda') ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Volkswagen'), 'Polo / Polo GT (1.2/1.6/MPI/TSI)', 2010, 2022, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Volkswagen'), 'Vento', 2010, 2022, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Volkswagen'), 'Ameo', 2016, 2020, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Volkswagen'), 'Virtus', 2022, NULL, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Volkswagen'), 'Taigun', 2021, NULL, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Volkswagen'), 'Tiguan / Allspace', 2017, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Volkswagen'), 'Jetta / Passat', 2007, 2020, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Skoda'), 'Fabia', 2008, 2013, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Skoda'), 'Rapid', 2011, 2021, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Skoda'), 'Slavia', 2022, NULL, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Skoda'), 'Kushaq', 2021, NULL, ARRAY['Petrol']),
((SELECT id FROM makes WHERE name='Skoda'), 'Octavia / Laura (1st - 4th Gen)', 2002, 2023, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Skoda'), 'Superb (1st - 4th Gen)', 2004, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Skoda'), 'Kodiaq / Karoq / Yeti', 2010, NULL, ARRAY['Petrol', 'Diesel'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;


-- 9. LUXURY & COMMERCIAL BRANDS
INSERT INTO makes (name) VALUES 
('Mercedes-Benz'), ('BMW'), ('Audi'), ('Jaguar'), ('Land Rover'), ('Volvo'), ('MG (Morris Garages)'), ('Force Motors'), ('Ashok Leyland (Commercial)'), ('Ford'), ('Chevrolet'), ('Fiat'), ('BYD (Electric Vehicles)'), ('Lexus (Luxury)'), ('Porsche (Sports & Luxury)'), ('Isuzu'), ('Jeep')
ON CONFLICT (name) DO NOTHING;

INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types) VALUES
((SELECT id FROM makes WHERE name='Mercedes-Benz'), 'A-Class / Limousine', 2013, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mercedes-Benz'), 'C-Class (W203/W204/W205/W206)', 2001, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mercedes-Benz'), 'E-Class (W211/W212/W213/LWB)', 1995, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mercedes-Benz'), 'S-Class (W221/W222/W223)', 2006, NULL, ARRAY['Petrol', 'Diesel', 'Hybrid']),
((SELECT id FROM makes WHERE name='Mercedes-Benz'), 'GLA / GLB / GLC / GLE / GLS SUV', 2014, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mercedes-Benz'), 'G-Class / G 63 AMG', 2013, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Mercedes-Benz'), 'EQB / EQE / EQS (Electric)', 2022, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='BMW'), '2 Series Gran Coupe', 2020, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='BMW'), '3 Series / Gran Limousine / 3GT', 2005, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='BMW'), '5 Series / 6 Series GT', 2007, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='BMW'), '7 Series', 2006, NULL, ARRAY['Petrol', 'Diesel', 'Hybrid']),
((SELECT id FROM makes WHERE name='BMW'), 'X1 / X3 / X4 / X5 / X6 / X7 SUV', 2007, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='BMW'), 'i4 / iX1 / iX / i7 (Electric)', 2022, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Audi'), 'A3 / A4 / A6 / A8 L Sedan', 2008, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Audi'), 'Q3 / Q5 / Q7 / Q8 SUV', 2006, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Audi'), 'e-tron / Q8 e-tron Electric', 2021, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Jaguar'), 'XE / XF / XJ / F-Pace / I-Pace EV', 2009, NULL, ARRAY['Petrol', 'Diesel', 'EV']),
((SELECT id FROM makes WHERE name='Land Rover'), 'Range Rover / Sport / Velar / Evoque', 2006, NULL, ARRAY['Petrol', 'Diesel', 'Hybrid']),
((SELECT id FROM makes WHERE name='Land Rover'), 'Defender 90 / 110 / 130', 2020, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Land Rover'), 'Discovery / Discovery Sport / Freelander 2', 2007, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Volvo'), 'XC40 / XC60 / XC90 / S60 / S90', 2006, NULL, ARRAY['Petrol', 'Diesel', 'EV', 'Hybrid']),
((SELECT id FROM makes WHERE name='Ashok Leyland (Commercial)'), 'Dost / Dost+ / Bada Dost Pickup', 2011, NULL, ARRAY['Diesel', 'CNG']),
((SELECT id FROM makes WHERE name='Force Motors'), 'Gurkha 4x4 / Traveller / Trax Cruiser / Urbania', 1987, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='MG (Morris Garages)'), 'Hector / Astor / ZS EV / Gloster / Windsor / Comet', 2019, NULL, ARRAY['Petrol', 'Diesel', 'EV']),
((SELECT id FROM makes WHERE name='Ford'), 'EcoSport / Endeavour / Figo / Aspire / Freestyle / Fiesta / Ikon', 1999, 2021, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Chevrolet'), 'Beat / Spark / Cruze / Tavera / Sail / Enjoy / Optra', 2003, 2017, ARRAY['Petrol', 'Diesel', 'LPG']),
((SELECT id FROM makes WHERE name='Fiat'), 'Punto / Linea / Palio / Uno / Abarth', 1996, 2020, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Jeep'), 'Compass / Meridian / Wrangler / Grand Cherokee', 2016, NULL, ARRAY['Petrol', 'Diesel']),
((SELECT id FROM makes WHERE name='Isuzu'), 'D-Max V-Cross 4x4 / S-CAB Commercial Pickup / MU-X', 2014, NULL, ARRAY['Diesel']),
((SELECT id FROM makes WHERE name='BYD (Electric Vehicles)'), 'Atto 3 / Seal / e6 Electric', 2021, NULL, ARRAY['EV']),
((SELECT id FROM makes WHERE name='Lexus (Luxury)'), 'ES 300h / NX 350h / RX 500h / LX 500d / LM 350h', 2017, NULL, ARRAY['Hybrid', 'Diesel']),
((SELECT id FROM makes WHERE name='Porsche (Sports & Luxury)'), 'Cayenne / Macan / Panamera / Taycan EV / 911', 2012, NULL, ARRAY['Petrol', 'EV', 'Hybrid'])
ON CONFLICT (make_id, name) DO UPDATE SET start_year = EXCLUDED.start_year, end_year = EXCLUDED.end_year, available_fuel_types = EXCLUDED.available_fuel_types;

COMMIT;
