const db = require('../config/db');

const vehicleDataset = [
  {
    make: 'Maruti Suzuki',
    models: [
      { name: 'Maruti 800', start_year: 1983, end_year: 2014, fuel: ['Petrol', 'LPG'] },
      { name: 'Omni', start_year: 1984, end_year: 2019, fuel: ['Petrol', 'LPG', 'CNG'] },
      { name: 'Gypsy', start_year: 1985, end_year: 2019, fuel: ['Petrol'] },
      { name: 'Zen', start_year: 1993, end_year: 2006, fuel: ['Petrol'] },
      { name: 'Zen Estilo', start_year: 2006, end_year: 2013, fuel: ['Petrol', 'LPG'] },
      { name: 'Wagon R', start_year: 1999, end_year: null, fuel: ['Petrol', 'CNG', 'LPG'] },
      { name: 'Alto 800', start_year: 2000, end_year: 2023, fuel: ['Petrol', 'CNG'] },
      { name: 'Alto K10', start_year: 2010, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Swift', start_year: 2005, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Swift Dzire / Dzire', start_year: 2008, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Ritz', start_year: 2009, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'A-Star', start_year: 2008, end_year: 2014, fuel: ['Petrol'] },
      { name: 'Celerio', start_year: 2014, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'S-Presso', start_year: 2019, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Ignis', start_year: 2017, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Baleno', start_year: 2015, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Brezza / Vitara Brezza', start_year: 2016, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Ertiga', start_year: 2012, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'XL6', start_year: 2019, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'SX4', start_year: 2007, end_year: 2014, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Ciaz', start_year: 2014, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'S-Cross', start_year: 2015, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Grand Vitara', start_year: 2007, end_year: null, fuel: ['Petrol', 'Hybrid', 'CNG'] },
      { name: 'Fronx', start_year: 2023, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Jimny', start_year: 2023, end_year: null, fuel: ['Petrol'] },
      { name: 'Invicto', start_year: 2023, end_year: null, fuel: ['Hybrid'] },
      { name: 'Kizashi', start_year: 2011, end_year: 2014, fuel: ['Petrol'] },
      { name: 'Eeco', start_year: 2010, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Super Carry (Commercial Pickup)', start_year: 2016, end_year: null, fuel: ['Petrol', 'CNG'] }
    ]
  },
  {
    make: 'Tata Motors',
    models: [
      { name: 'Indica / Indica V2 / Vista', start_year: 1998, end_year: 2018, fuel: ['Petrol', 'Diesel', 'LPG', 'CNG'] },
      { name: 'Indigo / Indigo CS / Manza', start_year: 2002, end_year: 2018, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Nano', start_year: 2008, end_year: 2018, fuel: ['Petrol', 'CNG'] },
      { name: 'Bolt', start_year: 2015, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Zest', start_year: 2014, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Tiago / Tiago EV', start_year: 2016, end_year: null, fuel: ['Petrol', 'CNG', 'EV'] },
      { name: 'Tigor / Tigor EV / XPRES-T', start_year: 2017, end_year: null, fuel: ['Petrol', 'CNG', 'EV'] },
      { name: 'Altroz', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Punch / Punch EV', start_year: 2021, end_year: null, fuel: ['Petrol', 'CNG', 'EV'] },
      { name: 'Nexon / Nexon EV', start_year: 2017, end_year: null, fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'Curvv / Curvv EV', start_year: 2024, end_year: null, fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'Harrier', start_year: 2019, end_year: null, fuel: ['Diesel'] },
      { name: 'Safari / Safari Storme', start_year: 1998, end_year: null, fuel: ['Diesel'] },
      { name: 'Sumo / Sumo Gold / Grande', start_year: 1994, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Hexa', start_year: 2017, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Aria', start_year: 2010, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Sierra', start_year: 1991, end_year: 2003, fuel: ['Diesel'] },
      { name: 'Ace / Ace Gold (Commercial Pickup)', start_year: 2005, end_year: null, fuel: ['Diesel', 'CNG', 'Petrol', 'EV'] },
      { name: 'Intra V10 / V30 / V50 Pickup', start_year: 2019, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Yodha Pickup (Commercial)', start_year: 2017, end_year: null, fuel: ['Diesel'] },
      { name: 'Xenon Pickup', start_year: 2009, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Winger Van / Ambulance', start_year: 2007, end_year: null, fuel: ['Diesel'] },
      { name: 'Magic / Magic Express Van', start_year: 2007, end_year: null, fuel: ['Diesel', 'CNG'] }
    ]
  },
  {
    make: 'Mahindra',
    models: [
      { name: 'Bolero / Bolero Neo', start_year: 2000, end_year: null, fuel: ['Diesel'] },
      { name: 'Bolero Pik-Up / Maxi Truck / City Pik-Up', start_year: 2001, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Bolero Camper 4x4 Pickup', start_year: 2004, end_year: null, fuel: ['Diesel'] },
      { name: 'Scorpio / Scorpio Classic', start_year: 2002, end_year: null, fuel: ['Diesel'] },
      { name: 'Scorpio-N', start_year: 2022, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Thar / Thar ROXX', start_year: 2010, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV300 / XUV 3XO', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV500', start_year: 2011, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV700', start_year: 2021, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV400 EV', start_year: 2023, end_year: null, fuel: ['EV'] },
      { name: 'Supro Profit Truck / Van', start_year: 2016, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Jeeto / Jeeto Plus Pickup', start_year: 2015, end_year: null, fuel: ['Diesel', 'CNG', 'Petrol'] },
      { name: 'Treo / Treo Zor EV', start_year: 2020, end_year: null, fuel: ['EV'] },
      { name: 'Marazzo', start_year: 2018, end_year: 2024, fuel: ['Diesel'] },
      { name: 'TUV300 / TUV300 Plus', start_year: 2015, end_year: 2021, fuel: ['Diesel'] },
      { name: 'KUV100 / KUV100 NXT', start_year: 2016, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Alturas G4', start_year: 2018, end_year: 2022, fuel: ['Diesel'] },
      { name: 'Xylo', start_year: 2009, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Quanto', start_year: 2012, end_year: 2016, fuel: ['Diesel'] },
      { name: 'Logan / Verito / Vibe', start_year: 2007, end_year: 2019, fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'Armada / Major / Commander', start_year: 1990, end_year: 2010, fuel: ['Diesel'] },
      { name: 'MM540 / MM550 Jeep', start_year: 1985, end_year: 2006, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Hyundai',
    models: [
      { name: 'Santro / Santro Xing', start_year: 1998, end_year: 2022, fuel: ['Petrol', 'CNG', 'LPG'] },
      { name: 'Eon', start_year: 2011, end_year: 2019, fuel: ['Petrol', 'LPG'] },
      { name: 'i10 / Grand i10 / Nios', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG', 'LPG'] },
      { name: 'i20 / Elite i20 / N Line', start_year: 2008, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Exter', start_year: 2023, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Venue / Venue N Line', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Creta', start_year: 2015, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Alcazar', start_year: 2021, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Verna', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Accent', start_year: 1999, end_year: 2013, fuel: ['Petrol', 'Diesel', 'LPG'] },
      { name: 'Xcent', start_year: 2014, end_year: 2020, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Aura', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Elantra', start_year: 2004, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Sonata / Embera / Transform', start_year: 2001, end_year: 2015, fuel: ['Petrol', 'Diesel'] },
      { name: 'Tucson', start_year: 2005, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Santa Fe', start_year: 2010, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Kona Electric', start_year: 2019, end_year: 2024, fuel: ['EV'] },
      { name: 'Ioniq 5 EV', start_year: 2023, end_year: null, fuel: ['EV'] },
      { name: 'Getz / Getz Prime', start_year: 2004, end_year: 2010, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Toyota',
    models: [
      { name: 'Qualis', start_year: 2000, end_year: 2005, fuel: ['Diesel'] },
      { name: 'Innova / Innova Crysta', start_year: 2005, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Innova Hycross', start_year: 2022, end_year: null, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Fortuner / Fortuner Legender', start_year: 2009, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Urban Cruiser / Hyryder', start_year: 2020, end_year: null, fuel: ['Petrol', 'Hybrid', 'CNG'] },
      { name: 'Glanza', start_year: 2019, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Rumion', start_year: 2023, end_year: null, fuel: ['Petrol', 'CNG'] },
      { name: 'Hilux Pickup 4x4', start_year: 2022, end_year: null, fuel: ['Diesel'] },
      { name: 'Etios / Etios Liva / Cross', start_year: 2010, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Yaris', start_year: 2018, end_year: 2021, fuel: ['Petrol'] },
      { name: 'Corolla / Corolla Altis', start_year: 2003, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Camry / Hybrid', start_year: 2002, end_year: null, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Land Cruiser LC100 / LC200 / LC300', start_year: 2003, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Vellfire Luxury MPV', start_year: 2020, end_year: null, fuel: ['Hybrid'] }
    ]
  },
  {
    make: 'Honda',
    models: [
      { name: 'City (All Gens / Hybrid)', start_year: 1998, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Amaze', start_year: 2013, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Elevate', start_year: 2023, end_year: null, fuel: ['Petrol'] },
      { name: 'WR-V', start_year: 2017, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Jazz', start_year: 2009, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Brio', start_year: 2011, end_year: 2019, fuel: ['Petrol'] },
      { name: 'Mobilio', start_year: 2014, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'BR-V', start_year: 2016, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Civic', start_year: 2006, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'CR-V', start_year: 2003, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
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
      { name: 'EV6 / EV9', start_year: 2022, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'Volkswagen',
    models: [
      { name: 'Polo / Polo GT', start_year: 2010, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Vento', start_year: 2010, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Ameo', start_year: 2016, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Virtus', start_year: 2022, end_year: null, fuel: ['Petrol'] },
      { name: 'Taigun', start_year: 2021, end_year: null, fuel: ['Petrol'] },
      { name: 'Tiguan / Allspace', start_year: 2017, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Jetta / Passat', start_year: 2007, end_year: 2020, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Skoda',
    models: [
      { name: 'Fabia', start_year: 2008, end_year: 2013, fuel: ['Petrol', 'Diesel'] },
      { name: 'Rapid', start_year: 2011, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'Slavia', start_year: 2022, end_year: null, fuel: ['Petrol'] },
      { name: 'Kushaq', start_year: 2021, end_year: null, fuel: ['Petrol'] },
      { name: 'Octavia / Laura', start_year: 2002, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Superb', start_year: 2004, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Kodiaq / Karoq / Yeti', start_year: 2010, end_year: null, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Mercedes-Benz',
    models: [
      { name: 'A-Class / Limousine', start_year: 2013, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'C-Class (W203/W204/W205/W206)', start_year: 2001, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'E-Class (W211/W212/W213/LWB)', start_year: 1995, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'S-Class (W221/W222/W223)', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'GLA / GLB / GLC / GLE / GLS SUV', start_year: 2014, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'G-Class / G 63 AMG', start_year: 2013, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'EQB / EQE / EQS (Electric)', start_year: 2022, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'BMW',
    models: [
      { name: '2 Series Gran Coupe', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '3 Series / Gran Limousine / 3GT', start_year: 2005, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '5 Series / 6 Series GT', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '7 Series', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'X1 / X3 / X4 / X5 / X6 / X7 SUV', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'i4 / iX1 / iX / i7 (Electric)', start_year: 2022, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'Audi',
    models: [
      { name: 'A3 / A4 / A6 / A8 L Sedan', start_year: 2008, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q3 / Q5 / Q7 / Q8 SUV', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'e-tron / Q8 e-tron Electric', start_year: 2021, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'Jaguar',
    models: [
      { name: 'XE / XF / XJ / F-Pace / I-Pace EV', start_year: 2009, end_year: null, fuel: ['Petrol', 'Diesel', 'EV'] }
    ]
  },
  {
    make: 'Land Rover',
    models: [
      { name: 'Range Rover / Sport / Velar / Evoque', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Defender 90 / 110 / 130', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Discovery / Discovery Sport / Freelander 2', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Volvo',
    models: [
      { name: 'XC40 / XC60 / XC90 / S60 / S90', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'EV', 'Hybrid'] }
    ]
  },
  {
    make: 'Ashok Leyland (Commercial)',
    models: [
      { name: 'Dost / Dost+ / Bada Dost Pickup', start_year: 2011, end_year: null, fuel: ['Diesel', 'CNG'] }
    ]
  },
  {
    make: 'Force Motors',
    models: [
      { name: 'Gurkha 4x4 / Traveller / Trax Cruiser / Urbania', start_year: 1987, end_year: null, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'MG (Morris Garages)',
    models: [
      { name: 'Hector / Astor / ZS EV / Gloster / Windsor / Comet', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel', 'EV'] }
    ]
  },
  {
    make: 'Ford',
    models: [
      { name: 'EcoSport / Endeavour / Figo / Aspire / Freestyle / Fiesta / Ikon', start_year: 1999, end_year: 2021, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Chevrolet',
    models: [
      { name: 'Beat / Spark / Cruze / Tavera / Sail / Enjoy / Optra', start_year: 2003, end_year: 2017, fuel: ['Petrol', 'Diesel', 'LPG'] }
    ]
  },
  {
    make: 'Fiat',
    models: [
      { name: 'Punto / Linea / Palio / Uno / Abarth', start_year: 1996, end_year: 2020, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Jeep',
    models: [
      { name: 'Compass / Meridian / Wrangler / Grand Cherokee', start_year: 2016, end_year: null, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Isuzu',
    models: [
      { name: 'D-Max V-Cross 4x4 / S-CAB Commercial Pickup / MU-X', start_year: 2014, end_year: null, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'BYD (Electric Vehicles)',
    models: [
      { name: 'Atto 3 / Seal / e6 Electric', start_year: 2021, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'Lexus (Luxury)',
    models: [
      { name: 'ES 300h / NX 350h / RX 500h / LX 500d / LM 350h', start_year: 2017, end_year: null, fuel: ['Hybrid', 'Diesel'] }
    ]
  },
  {
    make: 'Porsche (Sports & Luxury)',
    models: [
      { name: 'Cayenne / Macan / Panamera / Taycan EV / 911', start_year: 2012, end_year: null, fuel: ['Petrol', 'EV', 'Hybrid'] }
    ]
  }
];

async function runAutoSeed() {
  try {
    for (const item of vehicleDataset) {
      const makeRes = await db.query(
        `INSERT INTO makes (name) 
         VALUES ($1) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
         RETURNING id`,
        [item.make]
      );

      const makeId = makeRes.rows[0].id;

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
      }
    }
    console.log('[DB Seed] Complete Indian Vehicle Dataset auto-seeded successfully!');
  } catch (err) {
    console.error('[DB Seed] Auto-seed error:', err);
  }
}

module.exports = { runAutoSeed };
