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
      { name: 'Nano', start_year: 2008, end_year: 2018, fuel: ['Petrol', 'CNG'] },
      { name: 'Ace / Ace Gold (Commercial)', start_year: 2005, end_year: null, fuel: ['Diesel', 'CNG', 'EV', 'Petrol'] },
      { name: 'Intra V10 / V30 / V50 (Commercial)', start_year: 2019, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Yodha Pickup (Commercial)', start_year: 2017, end_year: null, fuel: ['Diesel'] },
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
      { name: 'Xylo', start_year: 2009, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Verito / Vibe / Logan', start_year: 2007, end_year: 2019, fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'Armada / Major / Commander', start_year: 1990, end_year: 2010, fuel: ['Diesel'] }
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
      { name: 'Accent', start_year: 1999, end_year: 2013, fuel: ['Petrol', 'Diesel', 'LPG'] }
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
      { name: 'Camry / Hybrid', start_year: 2002, end_year: null, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Land Cruiser LC200 / LC300', start_year: 2009, end_year: null, fuel: ['Diesel', 'Petrol'] },
      { name: 'Corolla Altis', start_year: 2003, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Etios / Liva / Cross', start_year: 2010, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
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
      { name: 'Brio', start_year: 2011, end_year: 2019, fuel: ['Petrol'] },
      { name: 'Accord', start_year: 2001, end_year: 2020, fuel: ['Petrol', 'Hybrid'] }
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
      { name: 'Virtus', start_year: 2022, end_year: null, fuel: ['Petrol'] },
      { name: 'Taigun', start_year: 2021, end_year: null, fuel: ['Petrol'] },
      { name: 'Polo / GT TSI', start_year: 2010, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Vento', start_year: 2010, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Ameo', start_year: 2016, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Tiguan / Allspace', start_year: 2017, end_year: null, fuel: ['Petrol', 'Diesel'] }
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
      { name: 'Rapid', start_year: 2011, end_year: 2021, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Mercedes-Benz',
    models: [
      { name: 'C-Class (C200/C220d)', start_year: 2001, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'E-Class (E200/E220d/E350d)', start_year: 1995, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'S-Class (S350d/S450)', start_year: 2000, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'GLA / GLB / GLC / GLE / GLS SUV', start_year: 2014, end_year: null, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'BMW',
    models: [
      { name: '3 Series / Gran Limousine', start_year: 2005, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '5 Series / Long Wheelbase', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '7 Series', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'X1 / X3 / X5 / X7 SUV Series', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Audi',
    models: [
      { name: 'A4 / A6 / A8 L Sedan', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q3 / Q5 / Q7 / Q8 SUV', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Jaguar',
    models: [
      { name: 'XE / XF / XJ / F-Pace', start_year: 2009, end_year: null, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Land Rover',
    models: [
      { name: 'Range Rover / Sport / Velar / Evoque', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Defender 90 / 110 / 130', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Volvo',
    models: [
      { name: 'XC40 / XC60 / XC90 SUV', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'EV', 'Hybrid'] }
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
      { name: 'Gurkha 4x4 / Traveller Van', start_year: 1987, end_year: null, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'MG (Morris Garages)',
    models: [
      { name: 'Hector / Astor / ZS EV / Gloster / Windsor', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel', 'EV'] }
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
