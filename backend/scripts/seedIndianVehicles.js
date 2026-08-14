require('dotenv').config();
const db = require('../config/db');

const vehicleDataset = [
  {
    make: 'Maruti Suzuki',
    models: [
      { name: 'Alto 800', start_year: 2000, end_year: 2023, fuel: ['Petrol', 'CNG'] },
      { name: 'Alto K10', start_year: 2010, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Swift', start_year: 2005, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Dzire / Swift Dzire', start_year: 2008, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Baleno', start_year: 2015, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Wagon R', start_year: 1999, end_year: null, fuel: ['Petrol', 'CNG', 'LPG'] },
      { name: 'Brezza / Vitara Brezza', start_year: 2016, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Ertiga', start_year: 2012, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'XL6', start_year: 2019, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Grand Vitara', start_year: 2022, end_year: null, fuel: ['Petrol', 'Hybrid', 'CNG'] },
      { name: 'Fronx', start_year: 2023, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Jimny', start_year: 2023, end_year: null, fuel: ['Petrol'] },
      { name: 'Invicto', start_year: 2023, end_year: null, fuel: ['Hybrid'] },
      { name: 'Ignis', start_year: 2017, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Ciaz', start_year: 2014, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Celerio', start_year: 2014, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'S-Presso', start_year: 2019, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Eeco', start_year: 2010, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Omni', start_year: 1984, end_year: 2019, fuel: ['Petrol', 'LPG', 'CNG'] },
      { name: 'Gypsy', start_year: 1985, end_year: 2019, fuel: ['Petrol'] },
      { name: 'Ritz', start_year: 2009, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'SX4', start_year: 2007, end_year: 2014, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Zen / Zen Estilo', start_year: 1993, end_year: 2013, fuel: ['Petrol', 'LPG', 'CNG'] },
      { name: 'Maruti 800', start_year: 1983, end_year: 2014, fuel: ['Petrol', 'LPG'] },
      { name: 'A-Star', start_year: 2008, end_year: 2014, fuel: ['Petrol'] },
      { name: 'Kizashi', start_year: 2011, end_year: 2014, fuel: ['Petrol'] },
      { name: 'Super Carry (Commercial)', start_year: 2016, end_year: null, fuel: ['Petrol', 'CNG'] }
    ]
  },
  {
    make: 'Tata Motors',
    models: [
      { name: 'Nexon', start_year: 2017, end_year: null, fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'Nexon EV', start_year: 2020, end_year: null, fuel: ['EV'] },
      { name: 'Punch', start_year: 2021, end_year: null, fuel: ['Petrol', 'CNG', 'EV'] },
      { name: 'Tiago', start_year: 2016, end_year: null, fuel: ['Petrol', 'CNG', 'EV'] },
      { name: 'Tigor', start_year: 2017, end_year: null, fuel: ['Petrol', 'CNG', 'EV'] },
      { name: 'Harrier', start_year: 2019, end_year: null, fuel: ['Diesel'] },
      { name: 'Safari', start_year: 2021, end_year: null, fuel: ['Diesel'] },
      { name: 'Safari Storme / Old Safari', start_year: 1998, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Curvv', start_year: 2024, end_year: null, fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'Altroz', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Hexa', start_year: 2017, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Sumo / Sumo Gold', start_year: 1994, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Indica / Indica Vista', start_year: 1998, end_year: 2018, fuel: ['Petrol', 'Diesel', 'LPG'] },
      { name: 'Indigo / Indigo CS / Manza', start_year: 2002, end_year: 2018, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Zest', start_year: 2014, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Bolt', start_year: 2015, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Nano', start_year: 2008, end_year: 2018, fuel: ['Petrol', 'CNG'] },
      { name: 'Aria', start_year: 2010, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Ace / Ace Gold (Commercial)', start_year: 2005, end_year: null, fuel: ['Diesel', 'CNG', 'EV', 'Petrol'] },
      { name: 'Intra V10 / V30 / V50 (Commercial)', start_year: 2019, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Yodha Pickup (Commercial)', start_year: 2017, end_year: null, fuel: ['Diesel'] },
      { name: 'Xenon Pickup', start_year: 2009, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Winger Van (Commercial)', start_year: 2007, end_year: null, fuel: ['Diesel'] },
      { name: 'Magic Express (Commercial)', start_year: 2007, end_year: null, fuel: ['Diesel', 'CNG'] }
    ]
  },
  {
    make: 'Mahindra',
    models: [
      { name: 'Thar / Thar ROXX', start_year: 2010, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Scorpio / Scorpio Classic', start_year: 2002, end_year: null, fuel: ['Diesel'] },
      { name: 'Scorpio-N', start_year: 2022, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV700', start_year: 2021, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV300 / XUV 3XO', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV500', start_year: 2011, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV400 EV', start_year: 2023, end_year: null, fuel: ['EV'] },
      { name: 'Bolero / Bolero Neo', start_year: 2000, end_year: null, fuel: ['Diesel'] },
      { name: 'Bolero Pik-Up / Maxi Truck (Commercial)', start_year: 2001, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Bolero Camper Pickup', start_year: 2004, end_year: null, fuel: ['Diesel'] },
      { name: 'Supro Profit Truck / Van (Commercial)', start_year: 2016, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Jeeto / Jeeto Plus (Commercial)', start_year: 2015, end_year: null, fuel: ['Diesel', 'CNG', 'Petrol'] },
      { name: 'Marazzo', start_year: 2018, end_year: 2024, fuel: ['Diesel'] },
      { name: 'TUV300 / TUV300 Plus', start_year: 2015, end_year: 2021, fuel: ['Diesel'] },
      { name: 'KUV100 / KUV100 NXT', start_year: 2016, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Alturas G4', start_year: 2018, end_year: 2022, fuel: ['Diesel'] },
      { name: 'Xylo', start_year: 2009, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Quanto', start_year: 2012, end_year: 2016, fuel: ['Diesel'] },
      { name: 'Verito / Vibe / Logan', start_year: 2007, end_year: 2019, fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'Armada / Commander / Major', start_year: 1990, end_year: 2010, fuel: ['Diesel'] },
      { name: 'MM540 / MM550 Jeep', start_year: 1985, end_year: 2010, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Hyundai',
    models: [
      { name: 'Creta', start_year: 2015, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Venue', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'i20 / Elite i20 / N Line', start_year: 2008, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Grand i10 / Nios', start_year: 2013, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Exter', start_year: 2023, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Verna', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Alcazar', start_year: 2021, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Tucson', start_year: 2005, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Santro / Santro Xing', start_year: 1998, end_year: 2022, fuel: ['Petrol', 'CNG', 'LPG'] },
      { name: 'Eon', start_year: 2011, end_year: 2019, fuel: ['Petrol', 'LPG'] },
      { name: 'Elantra', start_year: 2004, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Kona Electric', start_year: 2019, end_year: 2024, fuel: ['EV'] },
      { name: 'Ioniq 5', start_year: 2023, end_year: null, fuel: ['EV'] },
      { name: 'Aura', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Xcent', start_year: 2014, end_year: 2020, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Santa Fe', start_year: 2010, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Sonata / Embera / Transform', start_year: 2001, end_year: 2015, fuel: ['Petrol', 'Diesel'] },
      { name: 'Accent', start_year: 1999, end_year: 2013, fuel: ['Petrol', 'Diesel', 'LPG'] },
      { name: 'Getz / Getz Prime', start_year: 2004, end_year: 2010, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Toyota',
    models: [
      { name: 'Fortuner / Legender', start_year: 2009, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Innova Crysta / Innova', start_year: 2005, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Innova Hycross', start_year: 2022, end_year: null, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Urban Cruiser Hyryder', start_year: 2022, end_year: null, fuel: ['Petrol', 'Hybrid', 'CNG'] },
      { name: 'Glanza', start_year: 2019, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Rumion', start_year: 2023, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Hilux Pickup', start_year: 2022, end_year: null, fuel: ['Diesel'] },
      { name: 'Camry / Camry Hybrid', start_year: 2002, end_year: null, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Land Cruiser LC200 / LC300', start_year: 2009, end_year: null, fuel: ['Diesel', 'Petrol'] },
      { name: 'Vellfire Luxury MPV', start_year: 2020, end_year: null, fuel: ['Hybrid'] },
      { name: 'Corolla Altis / Corolla', start_year: 2003, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Etios / Etios Liva / Cross', start_year: 2010, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Yaris', start_year: 2018, end_year: 2021, fuel: ['Petrol'] },
      { name: 'Urban Cruiser SUV', start_year: 2020, end_year: 2022, fuel: ['Petrol'] },
      { name: 'Qualis', start_year: 2000, end_year: 2005, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Honda',
    models: [
      { name: 'City (1st - 5th Gen)', start_year: 1998, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Amaze', start_year: 2013, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Elevate', start_year: 2023, end_year: null, fuel: ['Petrol'] },
      { name: 'WR-V', start_year: 2017, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Jazz', start_year: 2009, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Civic', start_year: 2006, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'CR-V', start_year: 2003, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'BR-V', start_year: 2016, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Mobilio', start_year: 2014, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Brio', start_year: 2011, end_year: 2019, fuel: ['Petrol'] },
      { name: 'Accord / Hybrid', start_year: 2001, end_year: 2020, fuel: ['Petrol', 'Hybrid'] }
    ]
  },
  {
    make: 'Kia',
    models: [
      { name: 'Seltos', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Sonet', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Carens', start_year: 2022, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Carnival', start_year: 2020, end_year: null, fuel: ['Diesel'] },
      { name: 'EV6', start_year: 2022, end_year: null, fuel: ['EV'] },
      { name: 'EV9', start_year: 2024, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'Volkswagen',
    models: [
      { name: 'Virtus', start_year: 2022, end_year: null, fuel: ['Petrol'] },
      { name: 'Taigun', start_year: 2021, end_year: null, fuel: ['Petrol'] },
      { name: 'Polo / GT TSI', start_year: 2010, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Vento', start_year: 2010, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Ameo', start_year: 2016, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Tiguan / Allspace', start_year: 2017, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Jetta', start_year: 2008, end_year: 2018, fuel: ['Petrol', 'Diesel'] },
      { name: 'Passat', start_year: 2007, end_year: 2020, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Skoda',
    models: [
      { name: 'Slavia', start_year: 2022, end_year: null, fuel: ['Petrol'] },
      { name: 'Kushaq', start_year: 2021, end_year: null, fuel: ['Petrol'] },
      { name: 'Kodiaq', start_year: 2018, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Octavia / Laura', start_year: 2002, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Superb', start_year: 2004, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Rapid', start_year: 2011, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'Fabia', start_year: 2008, end_year: 2013, fuel: ['Petrol', 'Diesel'] },
      { name: 'Yeti', start_year: 2010, end_year: 2017, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Mercedes-Benz',
    models: [
      { name: 'C-Class (C200 / C220d)', start_year: 2001, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'E-Class (E200 / E220d / E350d)', start_year: 1995, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'S-Class (S350d / S450)', start_year: 2000, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'GLA SUV', start_year: 2014, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'GLB SUV', start_year: 2022, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'GLC SUV', start_year: 2016, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'GLE / ML-Class SUV', start_year: 2009, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'GLS / GL-Class SUV', start_year: 2010, end_year: null, fuel: ['Diesel', 'Petrol'] },
      { name: 'G-Class / G 63 AMG', start_year: 2013, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'EQB / EQE / EQS (Electric)', start_year: 2022, end_year: null, fuel: ['EV'] },
      { name: 'A-Class / Limousine', start_year: 2013, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'CLA Coupe', start_year: 2015, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'V-Class Luxury Van', start_year: 2019, end_year: 2022, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'BMW',
    models: [
      { name: '2 Series Gran Coupe', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '3 Series / Gran Limousine', start_year: 2005, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '5 Series / Long Wheelbase', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '7 Series', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'X1 SUV', start_year: 2010, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'X3 SUV', start_year: 2008, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'X4 SUV Coupe', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'X5 SUV', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'X7 Luxury SUV', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Z4 Roadster', start_year: 2009, end_year: null, fuel: ['Petrol'] },
      { name: 'i4 / iX / i7 (Electric)', start_year: 2022, end_year: null, fuel: ['EV'] },
      { name: '6 Series GT', start_year: 2017, end_year: 2024, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Audi',
    models: [
      { name: 'A4', start_year: 2008, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'A6', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'A8 L', start_year: 2010, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q3 SUV', start_year: 2012, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q5 SUV', start_year: 2009, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q7 SUV', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q8 / RS Q8', start_year: 2020, end_year: null, fuel: ['Petrol'] },
      { name: 'e-tron / Q8 e-tron', start_year: 2021, end_year: null, fuel: ['EV'] },
      { name: 'A3', start_year: 2014, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'TT / R8 Sports', start_year: 2009, end_year: 2020, fuel: ['Petrol'] }
    ]
  },
  {
    make: 'Jaguar',
    models: [
      { name: 'XE', start_year: 2016, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'XF', start_year: 2009, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'XJ / XJL', start_year: 2010, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'F-Pace SUV', start_year: 2016, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'I-Pace Electric SUV', start_year: 2021, end_year: null, fuel: ['EV'] },
      { name: 'F-Type Sports', start_year: 2013, end_year: 2024, fuel: ['Petrol'] }
    ]
  },
  {
    make: 'Land Rover',
    models: [
      { name: 'Range Rover / LWB', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Range Rover Sport', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Range Rover Velar', start_year: 2017, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Range Rover Evoque', start_year: 2011, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Defender 90 / 110 / 130', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Discovery / Discovery Sport', start_year: 2015, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Freelander 2', start_year: 2007, end_year: 2015, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Ashok Leyland (Commercial)',
    models: [
      { name: 'Dost / Dost+ / Strong Pickup', start_year: 2011, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Bada Dost i1 / i2 / i3 / i4 Pickup', start_year: 2020, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Partner Truck', start_year: 2014, end_year: null, fuel: ['Diesel'] },
      { name: 'MiTR Bus / School Bus', start_year: 2014, end_year: null, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Eicher (Commercial)',
    models: [
      { name: 'Pro 2049 / Pro 2059 Light Truck', start_year: 2018, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Pro 2080 / Pro 2095 Truck', start_year: 2018, end_year: null, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Force Motors',
    models: [
      { name: 'Gurkha 4x4 / 5-Door', start_year: 2013, end_year: null, fuel: ['Diesel'] },
      { name: 'Traveller (3050 / 3350 / 4020)', start_year: 1987, end_year: null, fuel: ['Diesel'] },
      { name: 'Trax Cruiser / Toofan / Kargo King', start_year: 1996, end_year: null, fuel: ['Diesel'] },
      { name: 'Urbania Luxury Van', start_year: 2022, end_year: null, fuel: ['Diesel'] },
      { name: 'Force One SUV', start_year: 2011, end_year: 2016, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'MG (Morris Garages)',
    models: [
      { name: 'Hector / Hector Plus', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Astor', start_year: 2021, end_year: null, fuel: ['Petrol'] },
      { name: 'ZS EV', start_year: 2020, end_year: null, fuel: ['EV'] },
      { name: 'Gloster', start_year: 2020, end_year: null, fuel: ['Diesel'] },
      { name: 'Comet EV', start_year: 2023, end_year: null, fuel: ['EV'] },
      { name: 'Windsor EV', start_year: 2024, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'Renault',
    models: [
      { name: 'Kwid', start_year: 2015, end_year: null, fuel: ['Petrol'] },
      { name: 'Triber', start_year: 2019, end_year: null, fuel: ['Petrol'] },
      { name: 'Kiger', start_year: 2021, end_year: null, fuel: ['Petrol'] },
      { name: 'Duster', start_year: 2012, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Lodgy MPV', start_year: 2015, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Pulse', start_year: 2012, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Scala', start_year: 2012, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Fluence / Koleos', start_year: 2011, end_year: 2017, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Nissan',
    models: [
      { name: 'Magnite', start_year: 2020, end_year: null, fuel: ['Petrol'] },
      { name: 'Kicks', start_year: 2019, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Terrano', start_year: 2013, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Sunny', start_year: 2011, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Micra / Micra Active', start_year: 2010, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'X-Trail', start_year: 2004, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Evalia MPV', start_year: 2012, end_year: 2017, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Volvo',
    models: [
      { name: 'XC40 / XC40 Recharge EV', start_year: 2018, end_year: null, fuel: ['Petrol', 'EV'] },
      { name: 'XC60 SUV', start_year: 2011, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'XC90 SUV', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'S60 Sedan', start_year: 2011, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'S90 Sedan', start_year: 2016, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'V40 / Cross Country', start_year: 2013, end_year: 2020, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Jeep',
    models: [
      { name: 'Compass', start_year: 2017, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Meridian 7-Seater', start_year: 2022, end_year: null, fuel: ['Diesel'] },
      { name: 'Wrangler 4x4', start_year: 2016, end_year: null, fuel: ['Petrol'] },
      { name: 'Grand Cherokee', start_year: 2016, end_year: null, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Isuzu',
    models: [
      { name: 'D-Max V-Cross Pickup', start_year: 2016, end_year: null, fuel: ['Diesel'] },
      { name: 'D-Max S-CAB Commercial Pickup', start_year: 2016, end_year: null, fuel: ['Diesel'] },
      { name: 'MU-X / MU-7 SUV', start_year: 2014, end_year: null, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Ford',
    models: [
      { name: 'EcoSport', start_year: 2013, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'Endeavour', start_year: 2003, end_year: 2021, fuel: ['Diesel'] },
      { name: 'Figo / Aspire / Freestyle', start_year: 2010, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'Fiesta / Fiesta Classic', start_year: 2005, end_year: 2015, fuel: ['Petrol', 'Diesel'] },
      { name: 'Ikon', start_year: 1999, end_year: 2011, fuel: ['Petrol', 'Diesel'] },
      { name: 'Endeavour 3.2 4x4', start_year: 2016, end_year: 2021, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Chevrolet',
    models: [
      { name: 'Beat', start_year: 2010, end_year: 2017, fuel: ['Petrol', 'Diesel', 'LPG'] },
      { name: 'Spark', start_year: 2007, end_year: 2017, fuel: ['Petrol', 'LPG'] },
      { name: 'Cruze', start_year: 2009, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Tavera MPV', start_year: 2004, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Sail / Sail Hatchback', start_year: 2012, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Enjoy MPV', start_year: 2013, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Optra / Optra Magnum', start_year: 2003, end_year: 2013, fuel: ['Petrol', 'Diesel'] },
      { name: 'Captiva SUV', start_year: 2008, end_year: 2016, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Fiat',
    models: [
      { name: 'Punto / Punto EVO / Avventura', start_year: 2009, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Linea / Linea Classic', start_year: 2008, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Palio / Palio Stile / Siena', start_year: 1999, end_year: 2010, fuel: ['Petrol', 'Diesel'] },
      { name: 'Uno', start_year: 1996, end_year: 2006, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'BYD (Electric Vehicles)',
    models: [
      { name: 'Atto 3 Electric SUV', start_year: 2022, end_year: null, fuel: ['EV'] },
      { name: 'Seal Electric Sedan', start_year: 2024, end_year: null, fuel: ['EV'] },
      { name: 'e6 Electric MPV', start_year: 2021, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'Lexus (Luxury)',
    models: [
      { name: 'ES 300h Sedan', start_year: 2017, end_year: null, fuel: ['Hybrid'] },
      { name: 'NX 350h SUV', start_year: 2018, end_year: null, fuel: ['Hybrid'] },
      { name: 'RX 350h / 500h SUV', start_year: 2017, end_year: null, fuel: ['Hybrid'] },
      { name: 'LX 500d Luxury SUV', start_year: 2018, end_year: null, fuel: ['Diesel'] },
      { name: 'LM 350h Ultra Luxury MPV', start_year: 2024, end_year: null, fuel: ['Hybrid'] }
    ]
  },
  {
    make: 'Porsche (Sports & Luxury)',
    models: [
      { name: 'Cayenne / Coupe', start_year: 2012, end_year: null, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Macan SUV', start_year: 2014, end_year: null, fuel: ['Petrol', 'EV'] },
      { name: 'Panamera Luxury Sedan', start_year: 2013, end_year: null, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Taycan Electric', start_year: 2021, end_year: null, fuel: ['EV'] },
      { name: '911 Carrera / GT3', start_year: 2012, end_year: null, fuel: ['Petrol'] }
    ]
  }
];

async function seedDatabase() {
  console.log('🚗 Starting Indian Vehicle Dataset Seeding...');

  try {
    let totalMakesAdded = 0;
    let totalModelsAdded = 0;

    for (const item of vehicleDataset) {
      // 1. Insert or get Make ID
      const makeRes = await db.query(
        `INSERT INTO makes (name) 
         VALUES ($1) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
         RETURNING id`,
        [item.make]
      );

      const makeId = makeRes.rows[0].id;
      totalMakesAdded++;

      // 2. Insert Models for this Make
      for (const m of item.models) {
        await db.query(
          `INSERT INTO models (make_id, name, start_year, end_year, available_fuel_types)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (make_id, name) DO UPDATE SET 
             start_year = EXCLUDED.start_year,
             end_year = EXCLUDED.end_year,
             available_fuel_types = EXCLUDED.available_fuel_types`,
          [makeId, m.name, m.start_year, m.end_year, m.fuel]
        );
        totalModelsAdded++;
      }
    }

    console.log(`✅ SUCCESS! Inserted/Verified ${totalMakesAdded} Makes and ${totalModelsAdded} Models into Database!`);
  } catch (error) {
    console.error('❌ Error seeding vehicles:', error);
  } finally {
    process.exit();
  }
}

seedDatabase();
