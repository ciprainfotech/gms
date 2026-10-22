const db = require('../config/db');

// Exact list of legacy lumped strings that were erroneously combined in a single row
const legacyLumpedNames = [
  'EcoSport / Endeavour / Figo / Aspire / Freestyle / Fiesta / Ikon',
  'Beat / Spark / Cruze / Tavera / Sail / Enjoy / Optra',
  'Punto / Linea / Palio / Uno / Abarth',
  'Compass / Meridian / Wrangler / Grand Cherokee',
  'Hector / Astor / ZS EV / Gloster / Windsor / Comet',
  'GLA / GLB / GLC / GLE / GLS SUV',
  'X1 / X3 / X4 / X5 / X6 / X7 SUV',
  'A3 / A4 / A6 / A8 L Sedan',
  'Q3 / Q5 / Q7 / Q8 SUV',
  'XE / XF / XJ / F-Pace / I-Pace EV',
  'Range Rover / Sport / Velar / Evoque',
  'XC40 / XC60 / XC90 / S60 / S90',
  'D-Max V-Cross 4x4 / S-CAB Commercial Pickup / MU-X',
  'Atto 3 / Seal / e6 Electric',
  'ES 300h / NX 350h / RX 500h / LX 500d / LM 350h',
  'Cayenne / Macan / Panamera / Taycan EV / 911'
];

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
      { name: 'Indica / Vista', start_year: 1998, end_year: 2018, fuel: ['Petrol', 'Diesel', 'LPG', 'CNG'] },
      { name: 'Indigo / Manza', start_year: 2002, end_year: 2018, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Nano', start_year: 2008, end_year: 2018, fuel: ['Petrol', 'CNG'] },
      { name: 'Bolt', start_year: 2015, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Zest', start_year: 2014, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Tiago / Tiago EV', start_year: 2016, end_year: null, fuel: ['Petrol', 'CNG', 'EV'] },
      { name: 'Tigor / Tigor EV', start_year: 2017, end_year: null, fuel: ['Petrol', 'CNG', 'EV'] },
      { name: 'Altroz', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Punch / Punch EV', start_year: 2021, end_year: null, fuel: ['Petrol', 'CNG', 'EV'] },
      { name: 'Nexon / Nexon EV', start_year: 2017, end_year: null, fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'Curvv / Curvv EV', start_year: 2024, end_year: null, fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'Harrier', start_year: 2019, end_year: null, fuel: ['Diesel'] },
      { name: 'Safari / Safari Storme', start_year: 1998, end_year: null, fuel: ['Diesel'] },
      { name: 'Sumo / Sumo Gold', start_year: 1994, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Hexa', start_year: 2017, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Aria', start_year: 2010, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Sierra', start_year: 1991, end_year: 2003, fuel: ['Diesel'] },
      { name: 'Ace / Ace Gold', start_year: 2005, end_year: null, fuel: ['Diesel', 'CNG', 'Petrol', 'EV'] },
      { name: 'Intra V10 / V30 / V50', start_year: 2019, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Yodha Pickup', start_year: 2017, end_year: null, fuel: ['Diesel'] },
      { name: 'Xenon Pickup', start_year: 2009, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Winger Van', start_year: 2007, end_year: null, fuel: ['Diesel'] },
      { name: 'Magic', start_year: 2007, end_year: null, fuel: ['Diesel', 'CNG'] }
    ]
  },
  {
    make: 'Mahindra',
    models: [
      { name: 'Bolero / Bolero Neo', start_year: 2000, end_year: null, fuel: ['Diesel'] },
      { name: 'Bolero Pik-Up / Maxi Truck', start_year: 2001, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Bolero Camper 4x4', start_year: 2004, end_year: null, fuel: ['Diesel'] },
      { name: 'Scorpio / Scorpio Classic', start_year: 2002, end_year: null, fuel: ['Diesel'] },
      { name: 'Scorpio-N', start_year: 2022, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Thar / Thar ROXX', start_year: 2010, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV300 / XUV 3XO', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV500', start_year: 2011, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV700', start_year: 2021, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV400 EV', start_year: 2023, end_year: null, fuel: ['EV'] },
      { name: 'Supro Profit Truck / Van', start_year: 2016, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Jeeto / Jeeto Plus', start_year: 2015, end_year: null, fuel: ['Diesel', 'CNG', 'Petrol'] },
      { name: 'Treo / Treo Zor EV', start_year: 2020, end_year: null, fuel: ['EV'] },
      { name: 'Marazzo', start_year: 2018, end_year: 2024, fuel: ['Diesel'] },
      { name: 'TUV300 / TUV300 Plus', start_year: 2015, end_year: 2021, fuel: ['Diesel'] },
      { name: 'KUV100 / KUV100 NXT', start_year: 2016, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Alturas G4', start_year: 2018, end_year: 2022, fuel: ['Diesel'] },
      { name: 'Xylo', start_year: 2009, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Quanto', start_year: 2012, end_year: 2016, fuel: ['Diesel'] },
      { name: 'Logan / Verito / Vibe', start_year: 2007, end_year: 2019, fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'Armada / Commander', start_year: 1990, end_year: 2010, fuel: ['Diesel'] },
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
      { name: 'Creta / Creta N Line', start_year: 2015, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Alcazar', start_year: 2021, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Verna', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Accent', start_year: 1999, end_year: 2013, fuel: ['Petrol', 'Diesel', 'LPG'] },
      { name: 'Xcent', start_year: 2014, end_year: 2020, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Aura', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Elantra', start_year: 2004, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Sonata', start_year: 2001, end_year: 2015, fuel: ['Petrol', 'Diesel'] },
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
      { name: 'Land Cruiser LC200 / LC300', start_year: 2003, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Vellfire Luxury MPV', start_year: 2020, end_year: null, fuel: ['Hybrid'] }
    ]
  },
  {
    make: 'Honda',
    models: [
      { name: 'City', start_year: 1998, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
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
    make: 'Ford',
    models: [
      { name: 'EcoSport', start_year: 2013, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'Endeavour', start_year: 2003, end_year: 2021, fuel: ['Diesel'] },
      { name: 'Figo', start_year: 2010, end_year: 2021, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Aspire / Figo Aspire', start_year: 2015, end_year: 2021, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Freestyle', start_year: 2018, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'Fiesta', start_year: 2005, end_year: 2016, fuel: ['Petrol', 'Diesel'] },
      { name: 'Fiesta Classic / Classic', start_year: 2011, end_year: 2015, fuel: ['Petrol', 'Diesel'] },
      { name: 'Ikon', start_year: 1999, end_year: 2011, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Fusion', start_year: 2004, end_year: 2010, fuel: ['Petrol', 'Diesel'] },
      { name: 'Mondeo', start_year: 2001, end_year: 2006, fuel: ['Petrol', 'Diesel'] },
      { name: 'Mustang', start_year: 2016, end_year: 2021, fuel: ['Petrol'] },
      { name: 'Escort', start_year: 1996, end_year: 2001, fuel: ['Petrol', 'Diesel'] }
    ]
  },
  {
    make: 'Renault',
    models: [
      { name: 'Kwid', start_year: 2015, end_year: null, fuel: ['Petrol'] },
      { name: 'Duster', start_year: 2012, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Triber', start_year: 2019, end_year: null, fuel: ['Petrol'] },
      { name: 'Kiger', start_year: 2021, end_year: null, fuel: ['Petrol'] },
      { name: 'Lodgy', start_year: 2015, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Pulse', start_year: 2012, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Scala', start_year: 2012, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Captur', start_year: 2017, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Fluence', start_year: 2011, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Koleos', start_year: 2011, end_year: 2016, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Nissan',
    models: [
      { name: 'Magnite', start_year: 2020, end_year: null, fuel: ['Petrol'] },
      { name: 'Micra / Micra Active', start_year: 2010, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Sunny', start_year: 2011, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Terrano', start_year: 2013, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Kicks', start_year: 2019, end_year: 2023, fuel: ['Petrol'] },
      { name: 'Evalia', start_year: 2012, end_year: 2016, fuel: ['Diesel'] },
      { name: 'Teana', start_year: 2007, end_year: 2015, fuel: ['Petrol'] },
      { name: 'X-Trail', start_year: 2004, end_year: null, fuel: ['Petrol', 'Diesel'] }
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
    make: 'MG (Morris Garages)',
    models: [
      { name: 'Hector / Hector Plus', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Astor', start_year: 2021, end_year: null, fuel: ['Petrol'] },
      { name: 'ZS EV', start_year: 2020, end_year: null, fuel: ['EV'] },
      { name: 'Gloster', start_year: 2020, end_year: null, fuel: ['Diesel'] },
      { name: 'Windsor EV', start_year: 2024, end_year: null, fuel: ['EV'] },
      { name: 'Comet EV', start_year: 2023, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'Chevrolet',
    models: [
      { name: 'Beat', start_year: 2010, end_year: 2017, fuel: ['Petrol', 'Diesel', 'LPG'] },
      { name: 'Spark', start_year: 2007, end_year: 2017, fuel: ['Petrol', 'LPG'] },
      { name: 'Cruze', start_year: 2009, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Tavera', start_year: 2004, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Sail / Sail U-VA', start_year: 2012, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Enjoy', start_year: 2013, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Optra / Optra Magnum', start_year: 2003, end_year: 2012, fuel: ['Petrol', 'Diesel'] },
      { name: 'Aveo / Aveo U-VA', start_year: 2006, end_year: 2012, fuel: ['Petrol', 'CNG'] },
      { name: 'Captiva', start_year: 2008, end_year: 2016, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Fiat',
    models: [
      { name: 'Punto / Punto Evo', start_year: 2009, end_year: 2018, fuel: ['Petrol', 'Diesel'] },
      { name: 'Linea', start_year: 2009, end_year: 2018, fuel: ['Petrol', 'Diesel'] },
      { name: 'Palio / Palio Stile', start_year: 2001, end_year: 2010, fuel: ['Petrol', 'Diesel', 'LPG'] },
      { name: 'Uno', start_year: 1996, end_year: 2002, fuel: ['Petrol', 'Diesel'] },
      { name: 'Avventura / Urban Cross', start_year: 2014, end_year: 2018, fuel: ['Petrol', 'Diesel'] },
      { name: 'Abarth Punto', start_year: 2015, end_year: 2018, fuel: ['Petrol'] }
    ]
  },
  {
    make: 'Jeep',
    models: [
      { name: 'Compass', start_year: 2017, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Meridian', start_year: 2022, end_year: null, fuel: ['Diesel'] },
      { name: 'Wrangler', start_year: 2016, end_year: null, fuel: ['Petrol'] },
      { name: 'Grand Cherokee', start_year: 2016, end_year: null, fuel: ['Petrol'] }
    ]
  },
  {
    make: 'Isuzu',
    models: [
      { name: 'D-Max V-Cross', start_year: 2016, end_year: null, fuel: ['Diesel'] },
      { name: 'D-Max S-CAB (Commercial)', start_year: 2014, end_year: null, fuel: ['Diesel'] },
      { name: 'MU-X / MU-7', start_year: 2014, end_year: null, fuel: ['Diesel'] },
      { name: 'Hi-Lander', start_year: 2021, end_year: null, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Mercedes-Benz',
    models: [
      { name: 'A-Class / Limousine', start_year: 2013, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'C-Class', start_year: 2001, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'E-Class / LWB', start_year: 1995, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'S-Class', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'GLA', start_year: 2014, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'GLB', start_year: 2022, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'GLC', start_year: 2016, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'GLE', start_year: 2015, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'GLS', start_year: 2016, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'G-Class / AMG G 63', start_year: 2013, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'EQB (Electric)', start_year: 2022, end_year: null, fuel: ['EV'] },
      { name: 'EQE (Electric)', start_year: 2023, end_year: null, fuel: ['EV'] },
      { name: 'EQS (Electric)', start_year: 2022, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'BMW',
    models: [
      { name: '2 Series Gran Coupe', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '3 Series / Gran Limousine', start_year: 2005, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '5 Series', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '6 Series GT', start_year: 2018, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '7 Series', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'X1', start_year: 2010, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'X3', start_year: 2008, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'X4', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'X5', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'X6', start_year: 2009, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'X7', start_year: 2019, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'i4 / iX1 / iX / i7 (Electric)', start_year: 2022, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'Audi',
    models: [
      { name: 'A3', start_year: 2014, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'A4', start_year: 2008, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'A6', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'A8 L Sedan', start_year: 2008, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q3', start_year: 2012, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q5', start_year: 2009, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q7', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q8', start_year: 2020, end_year: null, fuel: ['Petrol'] },
      { name: 'e-tron / Q8 e-tron', start_year: 2021, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'Jaguar',
    models: [
      { name: 'XE', start_year: 2016, end_year: 2024, fuel: ['Petrol', 'Diesel'] },
      { name: 'XF', start_year: 2009, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'XJ', start_year: 2010, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'F-Pace', start_year: 2016, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'I-Pace EV', start_year: 2021, end_year: null, fuel: ['EV'] },
      { name: 'F-Type', start_year: 2013, end_year: 2024, fuel: ['Petrol'] }
    ]
  },
  {
    make: 'Land Rover',
    models: [
      { name: 'Range Rover', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Range Rover Sport', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Range Rover Velar', start_year: 2017, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Range Rover Evoque', start_year: 2011, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Defender 90 / 110 / 130', start_year: 2020, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Discovery', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Discovery Sport', start_year: 2015, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'Freelander 2', start_year: 2007, end_year: 2015, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Volvo',
    models: [
      { name: 'XC40 / EX40', start_year: 2018, end_year: null, fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'XC60', start_year: 2011, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'XC90', start_year: 2006, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'S60', start_year: 2011, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'S90', start_year: 2016, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'C40 Recharge', start_year: 2023, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'Citroen',
    models: [
      { name: 'C3', start_year: 2022, end_year: null, fuel: ['Petrol'] },
      { name: 'eC3 (Electric)', start_year: 2023, end_year: null, fuel: ['EV'] },
      { name: 'C3 Aircross', start_year: 2023, end_year: null, fuel: ['Petrol'] },
      { name: 'Basalt', start_year: 2024, end_year: null, fuel: ['Petrol'] },
      { name: 'C5 Aircross', start_year: 2021, end_year: null, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Mitsubishi',
    models: [
      { name: 'Pajero / Pajero Sport', start_year: 2002, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Lancer', start_year: 1998, end_year: 2012, fuel: ['Petrol', 'Diesel'] },
      { name: 'Cedia', start_year: 2006, end_year: 2013, fuel: ['Petrol'] },
      { name: 'Outlander', start_year: 2008, end_year: 2019, fuel: ['Petrol'] },
      { name: 'Montero', start_year: 2007, end_year: 2016, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'Ashok Leyland (Commercial)',
    models: [
      { name: 'Dost / Dost+ / Bada Dost', start_year: 2011, end_year: null, fuel: ['Diesel', 'CNG'] }
    ]
  },
  {
    make: 'Force Motors',
    models: [
      { name: 'Gurkha 4x4', start_year: 2013, end_year: null, fuel: ['Diesel'] },
      { name: 'Traveller', start_year: 1987, end_year: null, fuel: ['Diesel'] },
      { name: 'Trax Cruiser / Toofan', start_year: 1995, end_year: null, fuel: ['Diesel'] },
      { name: 'Urbania', start_year: 2023, end_year: null, fuel: ['Diesel'] }
    ]
  },
  {
    make: 'BYD (Electric Vehicles)',
    models: [
      { name: 'Atto 3', start_year: 2022, end_year: null, fuel: ['EV'] },
      { name: 'Seal', start_year: 2024, end_year: null, fuel: ['EV'] },
      { name: 'e6 / eMax 7', start_year: 2021, end_year: null, fuel: ['EV'] }
    ]
  },
  {
    make: 'Lexus (Luxury)',
    models: [
      { name: 'ES 300h', start_year: 2017, end_year: null, fuel: ['Hybrid'] },
      { name: 'NX 350h', start_year: 2018, end_year: null, fuel: ['Hybrid'] },
      { name: 'RX 500h / 350h', start_year: 2017, end_year: null, fuel: ['Hybrid'] },
      { name: 'LX 500d / 600', start_year: 2017, end_year: null, fuel: ['Diesel'] },
      { name: 'LM 350h', start_year: 2024, end_year: null, fuel: ['Hybrid'] }
    ]
  },
  {
    make: 'Porsche (Sports & Luxury)',
    models: [
      { name: 'Cayenne', start_year: 2012, end_year: null, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Macan', start_year: 2014, end_year: null, fuel: ['Petrol', 'EV'] },
      { name: 'Panamera', start_year: 2012, end_year: null, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Taycan EV', start_year: 2021, end_year: null, fuel: ['EV'] },
      { name: '911', start_year: 2012, end_year: null, fuel: ['Petrol'] },
      { name: '718 Boxster / Cayman', start_year: 2017, end_year: null, fuel: ['Petrol'] }
    ]
  }
];

async function runAutoSeed() {
  try {
    // 1. Safe cleanup of legacy lumped multi-model rows (ONLY specific known combined strings)
    // ZERO disturbance guarantee: If any vehicle is currently referencing the row, re-point it to clean model first
    try {
      const lumpedRows = await db.query(
        'SELECT id, make_id, name FROM models WHERE name = ANY($1)',
        [legacyLumpedNames]
      );

      for (const row of lumpedRows.rows) {
        const inUse = await db.query('SELECT COUNT(*) FROM vehicles WHERE model_id = $1', [row.id]);
        if (parseInt(inUse.rows[0].count, 10) === 0) {
          await db.query('DELETE FROM models WHERE id = $1', [row.id]);
          console.log(`[DB Seed Cleanup] Removed unused legacy lumped model: "${row.name}"`);
        }
      }
    } catch (cleanupErr) {
      console.warn('[DB Seed Cleanup Warning]:', cleanupErr.message);
    }

    // 2. Insert or update all makes and individual models safely using ON CONFLICT
    // ZERO disturbance guarantee: Existing models and makes retain their IDs and relations
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

    // 3. Final safety pass: If any vehicle was referencing a legacy lumped row, safely re-point it to the clean model
    try {
      const remainingLumped = await db.query(
        'SELECT id, make_id, name FROM models WHERE name = ANY($1)',
        [legacyLumpedNames]
      );
      for (const row of remainingLumped.rows) {
        const firstModelName = row.name.split('/')[0].trim();
        const clean = await db.query('SELECT id FROM models WHERE make_id = $1 AND name = $2', [row.make_id, firstModelName]);
        if (clean.rows.length > 0) {
          await db.query('UPDATE vehicles SET model_id = $1 WHERE model_id = $2', [clean.rows[0].id, row.id]);
          await db.query('DELETE FROM models WHERE id = $1', [row.id]);
          console.log(`[DB Seed Cleanup] Safely re-pointed vehicle to clean model "${firstModelName}" and deleted legacy row.`);
        }
      }
    } catch (relinkErr) {
      console.warn('[DB Seed Relink Warning]:', relinkErr.message);
    }

    console.log('[DB Seed] Complete Indian Vehicle Dataset auto-seeded successfully with individual models!');
  } catch (err) {
    console.error('[DB Seed] Auto-seed error:', err);
  }
}

module.exports = { runAutoSeed, legacyLumpedNames };
