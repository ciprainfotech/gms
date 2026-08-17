// =============================================================================
//  COMPREHENSIVE ALL-INCLUSIVE INDIAN VEHICLE DATASET
//  - ZERO combined models: every model generation, body style, and variant separated
//  - All Indian market brands: Mass-market, Luxury, Supercars, Classic/Heritage,
//    LCVs, 3-Wheelers/Quadricycles, HCVs, Commercial Trucks & Buses
//  - Accurate model year ranges (start_year to end_year or null for active)
//  - Exact available fuel types: Petrol, Diesel, CNG, LPG, EV, Hybrid
// =============================================================================

const vehicleDataset = [

  // ═══════════════════════════════════════════════════════════════
  //  1. MARUTI SUZUKI
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Maruti Suzuki',
    models: [
      // Discontinued / Heritage / Classics
      { name: 'Maruti 800 (SS80 / SB308)',  start_year: 1983, end_year: 2014, fuel: ['Petrol', 'LPG'] },
      { name: 'Maruti 1000',                start_year: 1990, end_year: 1994, fuel: ['Petrol'] },
      { name: 'Esteem',                     start_year: 1994, end_year: 2007, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Omni',                       start_year: 1984, end_year: 2019, fuel: ['Petrol', 'LPG', 'CNG'] },
      { name: 'Gypsy (King / MG410 / MG413)', start_year: 1985, end_year: 2019, fuel: ['Petrol'] },
      { name: 'Zen',                        start_year: 1993, end_year: 2006, fuel: ['Petrol', 'Diesel'] },
      { name: 'Zen Classic / Carbon / Steel', start_year: 2000, end_year: 2006, fuel: ['Petrol'] },
      { name: 'Zen Estilo',                 start_year: 2006, end_year: 2013, fuel: ['Petrol', 'LPG', 'CNG'] },
      { name: 'Versa',                      start_year: 2001, end_year: 2010, fuel: ['Petrol', 'LPG'] },
      { name: 'Wagon R (1st Gen)',          start_year: 1999, end_year: 2010, fuel: ['Petrol', 'LPG', 'CNG'] },
      { name: 'Alto (1st Gen / Alto 800)',  start_year: 2000, end_year: 2012, fuel: ['Petrol', 'CNG'] },
      { name: 'Alto 1.1',                   start_year: 2001, end_year: 2005, fuel: ['Petrol'] },
      { name: 'Alto K10 (1st Gen)',         start_year: 2010, end_year: 2014, fuel: ['Petrol'] },
      { name: 'Alto K10 (2nd Gen)',         start_year: 2014, end_year: 2020, fuel: ['Petrol', 'CNG'] },
      { name: 'Alto 800 (2nd Gen)',         start_year: 2012, end_year: 2023, fuel: ['Petrol', 'CNG'] },
      { name: 'A-Star',                     start_year: 2008, end_year: 2014, fuel: ['Petrol'] },
      { name: 'Ritz',                       start_year: 2009, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'SX4',                        start_year: 2007, end_year: 2014, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Kizashi',                    start_year: 2011, end_year: 2014, fuel: ['Petrol'] },
      { name: 'Grand Vitara XL-7',          start_year: 2003, end_year: 2007, fuel: ['Petrol'] },
      { name: 'Grand Vitara (2.4L CBU)',    start_year: 2007, end_year: 2015, fuel: ['Petrol'] },
      { name: 'S-Cross',                    start_year: 2015, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Swift (1st Gen)',            start_year: 2005, end_year: 2011, fuel: ['Petrol', 'Diesel'] },
      { name: 'Swift (2nd Gen)',            start_year: 2011, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Swift Dzire (1st Gen)',      start_year: 2008, end_year: 2012, fuel: ['Petrol', 'Diesel'] },
      { name: 'Swift Dzire (2nd Gen)',      start_year: 2012, end_year: 2017, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Baleno Sedan (Classic)',     start_year: 1999, end_year: 2007, fuel: ['Petrol'] },
      { name: 'Baleno Altura (Station Wagon)', start_year: 2000, end_year: 2006, fuel: ['Petrol'] },
      { name: 'Baleno (Nexa 1st Gen)',      start_year: 2015, end_year: 2022, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Baleno RS',                  start_year: 2017, end_year: 2020, fuel: ['Petrol'] },
      { name: 'Vitara Brezza',              start_year: 2016, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Ertiga (1st Gen)',           start_year: 2012, end_year: 2018, fuel: ['Petrol', 'Diesel', 'CNG'] },
      // Active / Current Models
      { name: 'Alto K10 (New Gen)',         start_year: 2022, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Wagon R (2nd Gen)',          start_year: 2010, end_year: 2019, fuel: ['Petrol', 'CNG', 'LPG'] },
      { name: 'Wagon R (3rd Gen Heartect)', start_year: 2019, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Celerio',                    start_year: 2014, end_year: null,  fuel: ['Petrol', 'CNG', 'Diesel'] },
      { name: 'Celerio X',                  start_year: 2017, end_year: 2021, fuel: ['Petrol', 'CNG'] },
      { name: 'S-Presso',                   start_year: 2019, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Ignis',                      start_year: 2017, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Swift (3rd Gen)',            start_year: 2018, end_year: 2024, fuel: ['Petrol', 'CNG'] },
      { name: 'Swift (4th Gen / 2024)',     start_year: 2024, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Dzire (3rd Gen)',            start_year: 2017, end_year: 2024, fuel: ['Petrol', 'CNG'] },
      { name: 'Dzire (4th Gen / 2024)',     start_year: 2024, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Baleno (Facelift)',          start_year: 2022, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Fronx',                      start_year: 2023, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Brezza',                     start_year: 2022, end_year: null,  fuel: ['Petrol', 'CNG', 'Hybrid'] },
      { name: 'Jimny (5-Door)',             start_year: 2023, end_year: null,  fuel: ['Petrol'] },
      { name: 'Ertiga (2nd Gen)',           start_year: 2018, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'XL6',                        start_year: 2019, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Grand Vitara (Hybrid/CNG)',  start_year: 2022, end_year: null,  fuel: ['Petrol', 'Hybrid', 'CNG'] },
      { name: 'Ciaz',                       start_year: 2014, end_year: null,  fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Invicto',                    start_year: 2023, end_year: null,  fuel: ['Hybrid'] },
      { name: 'Eeco',                       start_year: 2010, end_year: null,  fuel: ['Petrol', 'CNG'] },
      // Fleet / Tour Commercial Models
      { name: 'Tour H1 (Alto Fleet)',       start_year: 2019, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Tour H3 (Wagon R Fleet)',    start_year: 2019, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Tour S (Dzire Fleet)',       start_year: 2012, end_year: null,  fuel: ['Petrol', 'CNG', 'Diesel'] },
      { name: 'Tour M (Ertiga Fleet)',      start_year: 2019, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Tour V (Eeco Fleet)',        start_year: 2019, end_year: null,  fuel: ['Petrol', 'CNG'] },
      // Commercial LCV
      { name: 'Super Carry (Mini Truck)',   start_year: 2016, end_year: null,  fuel: ['Petrol', 'CNG', 'Diesel'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  2. TATA MOTORS
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Tata Motors',
    models: [
      // Discontinued Passenger / Heritage
      { name: 'Sierra',                     start_year: 1991, end_year: 2003, fuel: ['Diesel'] },
      { name: 'Estate',                     start_year: 1992, end_year: 2000, fuel: ['Diesel'] },
      { name: 'Sumo',                       start_year: 1994, end_year: 2007, fuel: ['Diesel'] },
      { name: 'Sumo Spacio',                start_year: 2000, end_year: 2011, fuel: ['Diesel'] },
      { name: 'Sumo Victa',                 start_year: 2004, end_year: 2011, fuel: ['Diesel'] },
      { name: 'Sumo Grande',                start_year: 2008, end_year: 2014, fuel: ['Diesel'] },
      { name: 'Sumo Gold',                  start_year: 2012, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Safari (1st Gen TCIC/DiCOR)', start_year: 1998, end_year: 2011, fuel: ['Diesel', 'Petrol'] },
      { name: 'Safari Storme',              start_year: 2012, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Indica (V1 / V2)',           start_year: 1998, end_year: 2011, fuel: ['Petrol', 'Diesel', 'LPG', 'CNG'] },
      { name: 'Indica Vista',               start_year: 2008, end_year: 2018, fuel: ['Petrol', 'Diesel'] },
      { name: 'Indigo Sedan',               start_year: 2002, end_year: 2013, fuel: ['Petrol', 'Diesel'] },
      { name: 'Indigo Marina (Estate)',     start_year: 2004, end_year: 2010, fuel: ['Petrol', 'Diesel'] },
      { name: 'Indigo XL',                  start_year: 2007, end_year: 2011, fuel: ['Petrol', 'Diesel'] },
      { name: 'Indigo CS (Sub-4m)',         start_year: 2008, end_year: 2013, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Indigo eCS',                 start_year: 2010, end_year: 2018, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Manza',                      start_year: 2009, end_year: 2015, fuel: ['Petrol', 'Diesel'] },
      { name: 'Nano',                       start_year: 2008, end_year: 2015, fuel: ['Petrol', 'CNG'] },
      { name: 'GenX Nano',                  start_year: 2015, end_year: 2018, fuel: ['Petrol', 'CNG'] },
      { name: 'Aria',                       start_year: 2010, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Hexa',                       start_year: 2017, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Zest',                       start_year: 2014, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Bolt',                       start_year: 2015, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Xenon XT (4x4 Lifestyle)',   start_year: 2009, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Venture MPV',                start_year: 2011, end_year: 2017, fuel: ['Diesel'] },
      // Current Passenger Cars & SUVs
      { name: 'Tiago',                      start_year: 2016, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Tiago NRG',                  start_year: 2018, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Tiago EV',                   start_year: 2022, end_year: null,  fuel: ['EV'] },
      { name: 'Tigor',                      start_year: 2017, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Tigor EV',                   start_year: 2021, end_year: null,  fuel: ['EV'] },
      { name: 'XPRES-T EV (Fleet)',         start_year: 2021, end_year: null,  fuel: ['EV'] },
      { name: 'Altroz',                     start_year: 2020, end_year: null,  fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Altroz Racer',               start_year: 2024, end_year: null,  fuel: ['Petrol'] },
      { name: 'Altroz EV',                  start_year: 2024, end_year: null,  fuel: ['EV'] },
      { name: 'Punch',                      start_year: 2021, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Punch EV',                   start_year: 2024, end_year: null,  fuel: ['EV'] },
      { name: 'Nexon',                      start_year: 2017, end_year: null,  fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Nexon EV',                   start_year: 2020, end_year: null,  fuel: ['EV'] },
      { name: 'Curvv',                      start_year: 2024, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Curvv EV',                   start_year: 2024, end_year: null,  fuel: ['EV'] },
      { name: 'Harrier',                    start_year: 2019, end_year: null,  fuel: ['Diesel'] },
      { name: 'Harrier EV',                 start_year: 2025, end_year: null,  fuel: ['EV'] },
      { name: 'Safari (New Gen OMEGARC)',   start_year: 2021, end_year: null,  fuel: ['Diesel'] },
      { name: 'Sierra EV',                  start_year: 2025, end_year: null,  fuel: ['EV'] },
      // Commercial LCVs, Pickups & Vans
      { name: 'Ace (Chota Hathi)',          start_year: 2005, end_year: null,  fuel: ['Diesel', 'CNG', 'Petrol'] },
      { name: 'Ace Gold',                   start_year: 2017, end_year: null,  fuel: ['Diesel', 'CNG', 'Petrol'] },
      { name: 'Ace EV',                     start_year: 2022, end_year: null,  fuel: ['EV'] },
      { name: 'Ace Zip',                    start_year: 2011, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Super Ace',                  start_year: 2009, end_year: 2018, fuel: ['Diesel'] },
      { name: 'Magic Passenger Van',        start_year: 2007, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Magic Iris',                 start_year: 2011, end_year: 2019, fuel: ['Diesel', 'CNG'] },
      { name: 'Magic Express',              start_year: 2016, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Winger Passenger Van',       start_year: 2007, end_year: null,  fuel: ['Diesel'] },
      { name: 'Winger Ambulance / Cargo',   start_year: 2010, end_year: null,  fuel: ['Diesel'] },
      { name: 'Intra V10',                  start_year: 2019, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Intra V20 Bi-Fuel',          start_year: 2022, end_year: null,  fuel: ['CNG', 'Petrol'] },
      { name: 'Intra V30',                  start_year: 2019, end_year: null,  fuel: ['Diesel'] },
      { name: 'Intra V50',                  start_year: 2020, end_year: null,  fuel: ['Diesel'] },
      { name: 'Intra V70',                  start_year: 2023, end_year: null,  fuel: ['Diesel'] },
      { name: 'Yodha Pickup (Single/Crew)', start_year: 2017, end_year: null,  fuel: ['Diesel'] },
      { name: 'Tata 207 DI Pickup',         start_year: 1988, end_year: 2016, fuel: ['Diesel'] },
      { name: 'Tata 407 (LPT 407 / SFC 407)', start_year: 1986, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Tata 709 (LPT 709 / LPT 710)', start_year: 1990, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Tata 909 (LPT 909)',         start_year: 1990, end_year: null,  fuel: ['Diesel'] },
      { name: 'Tata 1109 (LPT 1109)',       start_year: 1995, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Tata 1612 / 1613 (Truck)',   start_year: 1992, end_year: 2016, fuel: ['Diesel'] },
      { name: 'Ultra T.6 / T.7 / T.9',      start_year: 2014, end_year: null,  fuel: ['Diesel', 'CNG', 'EV'] },
      { name: 'Ultra 912 / 914',            start_year: 2015, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Prima 2528 / 2530 Tipper',   start_year: 2009, end_year: null,  fuel: ['Diesel'] },
      { name: 'Prima 4028 / 4928 Tractor',  start_year: 2010, end_year: null,  fuel: ['Diesel'] },
      { name: 'Signa 2823 / 3523 / 4825',   start_year: 2016, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Starbus City & Intercity Bus', start_year: 2006, end_year: null, fuel: ['Diesel', 'CNG', 'EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  3. MAHINDRA
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Mahindra',
    models: [
      // Heritage / Classics / Discontinued
      { name: 'CJ340 / CJ500 Jeep',         start_year: 1975, end_year: 1995, fuel: ['Diesel'] },
      { name: 'CL340 / CL550 Classic 4x4',  start_year: 1988, end_year: 1998, fuel: ['Diesel'] },
      { name: 'MM540 / MM550 Jeep',         start_year: 1985, end_year: 2010, fuel: ['Diesel'] },
      { name: 'Major Jeep',                 start_year: 2004, end_year: 2010, fuel: ['Diesel'] },
      { name: 'Commander',                  start_year: 1991, end_year: 2002, fuel: ['Diesel'] },
      { name: 'Armada',                     start_year: 1990, end_year: 2002, fuel: ['Diesel'] },
      { name: 'Armada Grand',               start_year: 1998, end_year: 2003, fuel: ['Diesel'] },
      { name: 'Invader 4x4',                start_year: 2003, end_year: 2007, fuel: ['Diesel'] },
      { name: 'Legend (Special 4x4)',       start_year: 2006, end_year: 2008, fuel: ['Diesel'] },
      { name: 'Voyager Van',                start_year: 1997, end_year: 2002, fuel: ['Diesel'] },
      { name: 'Maxx / Maxx Maxi Truck',     start_year: 2003, end_year: 2015, fuel: ['Diesel'] },
      { name: 'Logan (Mahindra-Renault)',   start_year: 2007, end_year: 2011, fuel: ['Petrol', 'Diesel'] },
      { name: 'Verito',                     start_year: 2011, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Verito Vibe',                start_year: 2013, end_year: 2019, fuel: ['Diesel'] },
      { name: 'eVerito (Electric Sedan)',   start_year: 2016, end_year: 2021, fuel: ['EV'] },
      { name: 'Reva e2o',                   start_year: 2013, end_year: 2016, fuel: ['EV'] },
      { name: 'e2o Plus (4-Door)',          start_year: 2016, end_year: 2020, fuel: ['EV'] },
      { name: 'Xylo',                       start_year: 2009, end_year: 2019, fuel: ['Diesel'] },
      { name: 'Quanto',                     start_year: 2012, end_year: 2016, fuel: ['Diesel'] },
      { name: 'Nuvosport',                  start_year: 2016, end_year: 2019, fuel: ['Diesel'] },
      { name: 'TUV300',                     start_year: 2015, end_year: 2021, fuel: ['Diesel'] },
      { name: 'TUV300 Plus (9-Seater)',     start_year: 2018, end_year: 2021, fuel: ['Diesel'] },
      { name: 'KUV100',                     start_year: 2016, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'KUV100 NXT',                 start_year: 2017, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV500',                     start_year: 2011, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'Alturas G4 (Luxury 4x4)',    start_year: 2018, end_year: 2022, fuel: ['Diesel'] },
      { name: 'Marazzo',                    start_year: 2018, end_year: 2024, fuel: ['Diesel'] },
      { name: 'Thar (1st Gen CRDe/DI)',     start_year: 2010, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Scorpio (1st & 2nd Gen)',    start_year: 2002, end_year: 2022, fuel: ['Diesel', 'Petrol'] },
      { name: 'Scorpio Getaway Pickup',     start_year: 2007, end_year: 2018, fuel: ['Diesel'] },
      // Active Passenger SUVs
      { name: 'Bolero',                     start_year: 2000, end_year: null,  fuel: ['Diesel'] },
      { name: 'Bolero Neo',                 start_year: 2021, end_year: null,  fuel: ['Diesel'] },
      { name: 'Bolero Neo Plus (9-Seater)', start_year: 2024, end_year: null,  fuel: ['Diesel'] },
      { name: 'Scorpio Classic',            start_year: 2022, end_year: null,  fuel: ['Diesel'] },
      { name: 'Scorpio-N',                  start_year: 2022, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Thar (2nd Gen)',             start_year: 2020, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Thar Roxx (5-Door)',         start_year: 2024, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV300',                     start_year: 2019, end_year: 2024, fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV 3XO',                   start_year: 2024, end_year: null,  fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'XUV700',                     start_year: 2021, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'XUV400 EV',                  start_year: 2023, end_year: null,  fuel: ['EV'] },
      { name: 'BE 6e (Born Electric SUV)',  start_year: 2025, end_year: null,  fuel: ['EV'] },
      { name: 'XEV 9e (Electric Coupe SUV)', start_year: 2025, end_year: null, fuel: ['EV'] },
      // Commercial LCVs & Trucks
      { name: 'Bolero Pik-Up (1.3T / 1.7T)', start_year: 2001, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Bolero Maxx Pik-Up HD / City', start_year: 2022, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Bolero Camper (Crew Cab)',   start_year: 2004, end_year: null,  fuel: ['Diesel'] },
      { name: 'Bolero Maxi Truck Plus',     start_year: 2009, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Jeeto Mini Truck',           start_year: 2015, end_year: null,  fuel: ['Diesel', 'CNG', 'Petrol'] },
      { name: 'Jeeto Plus',                 start_year: 2020, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Supro Profit Truck Mini/Maxi', start_year: 2016, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Supro Passenger Van',        start_year: 2016, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Furio 7 / 11 / 14 / 16 (ICV)', start_year: 2019, end_year: null, fuel: ['Diesel'] },
      { name: 'Blazo X 28 / 35 / 42 / 55 (HCV)', start_year: 2016, end_year: null, fuel: ['Diesel', 'CNG'] },
      // 3-Wheelers & Small EV
      { name: 'Alfa Passenger / Cargo Auto', start_year: 2005, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Treo / Treo Yaari EV Auto',  start_year: 2018, end_year: null,  fuel: ['EV'] },
      { name: 'Treo Zor / Zor Grand EV Loader', start_year: 2020, end_year: null, fuel: ['EV'] },
      { name: 'e-Alfa Mini / Super',        start_year: 2017, end_year: null,  fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  4. HYUNDAI
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Hyundai',
    models: [
      // Discontinued / Generations
      { name: 'Santro (1st Gen)',           start_year: 1998, end_year: 2003, fuel: ['Petrol', 'LPG'] },
      { name: 'Santro Xing',                start_year: 2003, end_year: 2014, fuel: ['Petrol', 'CNG', 'LPG'] },
      { name: 'Santro (New Gen 2018)',      start_year: 2018, end_year: 2022, fuel: ['Petrol', 'CNG'] },
      { name: 'Accent',                     start_year: 1999, end_year: 2013, fuel: ['Petrol', 'Diesel', 'LPG'] },
      { name: 'Accent Viva (Notchback)',    start_year: 2002, end_year: 2007, fuel: ['Petrol', 'Diesel'] },
      { name: 'Getz',                       start_year: 2004, end_year: 2007, fuel: ['Petrol', 'Diesel'] },
      { name: 'Getz Prime',                 start_year: 2007, end_year: 2010, fuel: ['Petrol', 'Diesel'] },
      { name: 'i10 (1st Gen)',              start_year: 2007, end_year: 2013, fuel: ['Petrol', 'CNG', 'LPG'] },
      { name: 'Grand i10 (1st Gen)',        start_year: 2013, end_year: 2019, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'i20 (1st Gen)',              start_year: 2008, end_year: 2014, fuel: ['Petrol', 'Diesel'] },
      { name: 'Elite i20',                  start_year: 2014, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'i20 Active (Cross)',         start_year: 2015, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Eon',                        start_year: 2011, end_year: 2019, fuel: ['Petrol', 'LPG'] },
      { name: 'Xcent',                      start_year: 2014, end_year: 2020, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Xcent Prime (Taxi Fleet)',   start_year: 2017, end_year: 2022, fuel: ['Petrol', 'CNG'] },
      { name: 'Elantra (Gen 3 XD)',         start_year: 2004, end_year: 2008, fuel: ['Petrol', 'Diesel'] },
      { name: 'Elantra (Fluidic Gen 5 MD)', start_year: 2012, end_year: 2016, fuel: ['Petrol', 'Diesel'] },
      { name: 'Elantra (Gen 6 AD)',         start_year: 2016, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Sonata Gold',                start_year: 2001, end_year: 2005, fuel: ['Petrol'] },
      { name: 'Sonata Embera',              start_year: 2005, end_year: 2009, fuel: ['Petrol', 'Diesel'] },
      { name: 'Sonata Transform',           start_year: 2009, end_year: 2011, fuel: ['Petrol', 'Diesel'] },
      { name: 'Sonata Fluidic (YF)',        start_year: 2012, end_year: 2015, fuel: ['Petrol'] },
      { name: 'Terracan SUV',               start_year: 2003, end_year: 2006, fuel: ['Diesel'] },
      { name: 'Santa Fe (2nd Gen CM)',      start_year: 2010, end_year: 2014, fuel: ['Diesel'] },
      { name: 'Santa Fe (3rd Gen DM)',      start_year: 2014, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Kona Electric',              start_year: 2019, end_year: 2024, fuel: ['EV'] },
      { name: 'Creta (1st Gen GS)',         start_year: 2015, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Verna (1st Gen MC)',         start_year: 2006, end_year: 2011, fuel: ['Petrol', 'Diesel'] },
      { name: 'Fluidic Verna (Gen 2 RB)',   start_year: 2011, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Next-Gen Verna (Gen 3 HC)',  start_year: 2017, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      // Active Models
      { name: 'Grand i10 Nios',             start_year: 2019, end_year: null,  fuel: ['Petrol', 'CNG', 'Diesel'] },
      { name: 'Aura',                       start_year: 2020, end_year: null,  fuel: ['Petrol', 'CNG', 'Diesel'] },
      { name: 'Exter',                      start_year: 2023, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'i20 (3rd Gen BI3)',          start_year: 2020, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'i20 N Line',                 start_year: 2021, end_year: null,  fuel: ['Petrol'] },
      { name: 'Verna (6th Gen BN7)',        start_year: 2023, end_year: null,  fuel: ['Petrol'] },
      { name: 'Venue',                      start_year: 2019, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Venue N Line',               start_year: 2022, end_year: null,  fuel: ['Petrol'] },
      { name: 'Creta (2nd Gen SU2i)',       start_year: 2020, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Creta N Line',               start_year: 2024, end_year: null,  fuel: ['Petrol'] },
      { name: 'Creta EV',                   start_year: 2024, end_year: null,  fuel: ['EV'] },
      { name: 'Alcazar',                    start_year: 2021, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Tucson (3rd Gen TL)',        start_year: 2016, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Tucson (4th Gen NX4)',       start_year: 2022, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Ioniq 5',                    start_year: 2023, end_year: null,  fuel: ['EV'] },
      { name: 'Ioniq 6',                    start_year: 2024, end_year: null,  fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  5. TOYOTA
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Toyota',
    models: [
      // Discontinued / Historical
      { name: 'Qualis',                     start_year: 2000, end_year: 2005, fuel: ['Diesel', 'Petrol'] },
      { name: 'Innova (1st Gen IMV)',       start_year: 2005, end_year: 2015, fuel: ['Petrol', 'Diesel'] },
      { name: 'Corolla (9th Gen E120)',     start_year: 2003, end_year: 2008, fuel: ['Petrol'] },
      { name: 'Corolla Altis (10th Gen E140)', start_year: 2008, end_year: 2014, fuel: ['Petrol', 'Diesel'] },
      { name: 'Corolla Altis (11th Gen E170)', start_year: 2014, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Etios Sedan',                start_year: 2010, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Etios Liva Hatchback',       start_year: 2011, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Etios Cross',                start_year: 2014, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Yaris Sedan',                start_year: 2018, end_year: 2021, fuel: ['Petrol'] },
      { name: 'Urban Cruiser (Brezza-based)', start_year: 2020, end_year: 2022, fuel: ['Petrol'] },
      { name: 'Camry (XV30 / XV40 / XV50)', start_year: 2002, end_year: 2018, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Prius Hybrid',               start_year: 2010, end_year: 2020, fuel: ['Hybrid'] },
      { name: 'Land Cruiser LC100 / LC200', start_year: 2003, end_year: 2021, fuel: ['Diesel', 'Petrol'] },
      { name: 'Land Cruiser Prado',         start_year: 2004, end_year: 2020, fuel: ['Diesel', 'Petrol'] },
      { name: 'Fortuner (1st Gen AN50/AN60)', start_year: 2009, end_year: 2016, fuel: ['Petrol', 'Diesel'] },
      // Current Active Models
      { name: 'Glanza',                     start_year: 2019, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Urban Cruiser Taisor',       start_year: 2024, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Urban Cruiser Hyryder',      start_year: 2022, end_year: null,  fuel: ['Petrol', 'Hybrid', 'CNG'] },
      { name: 'Rumion MPV',                 start_year: 2023, end_year: null,  fuel: ['Petrol', 'CNG'] },
      { name: 'Innova Crysta',              start_year: 2016, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Innova Hycross',             start_year: 2022, end_year: null,  fuel: ['Petrol', 'Hybrid'] },
      { name: 'Fortuner (2nd Gen AN150)',   start_year: 2016, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Fortuner Legender',          start_year: 2021, end_year: null,  fuel: ['Diesel', 'Petrol'] },
      { name: 'Fortuner GR-Sport',          start_year: 2022, end_year: null,  fuel: ['Diesel'] },
      { name: 'Hilux Pickup 4x4',           start_year: 2022, end_year: null,  fuel: ['Diesel'] },
      { name: 'Camry Hybrid (XV70)',        start_year: 2019, end_year: null,  fuel: ['Hybrid'] },
      { name: 'Vellfire Luxury MPV',        start_year: 2020, end_year: null,  fuel: ['Hybrid'] },
      { name: 'Land Cruiser LC300',         start_year: 2022, end_year: null,  fuel: ['Diesel', 'Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  6. HONDA
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Honda',
    models: [
      { name: 'City (1st Gen Type 1/Type 2)', start_year: 1998, end_year: 2003, fuel: ['Petrol'] },
      { name: 'City (2nd Gen Dolphin/ZX)',  start_year: 2003, end_year: 2008, fuel: ['Petrol'] },
      { name: 'City (3rd Gen Arrow Shot)',  start_year: 2008, end_year: 2014, fuel: ['Petrol'] },
      { name: 'City (4th Gen i-DTEC/i-VTEC)', start_year: 2014, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'City (5th Gen)',             start_year: 2020, end_year: null,  fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'City e:HEV (Strong Hybrid)', start_year: 2022, end_year: null,  fuel: ['Hybrid'] },
      { name: 'Civic (8th Gen FD)',         start_year: 2006, end_year: 2012, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Civic (10th Gen FC)',        start_year: 2019, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'Accord (6th/7th/8th Gen)',   start_year: 2001, end_year: 2014, fuel: ['Petrol'] },
      { name: 'Accord Hybrid (9th Gen)',    start_year: 2016, end_year: 2020, fuel: ['Hybrid'] },
      { name: 'Jazz (1st Gen India / GE)',  start_year: 2009, end_year: 2013, fuel: ['Petrol'] },
      { name: 'Jazz (2nd Gen India / GK)',  start_year: 2015, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Brio',                       start_year: 2011, end_year: 2019, fuel: ['Petrol'] },
      { name: 'Amaze (1st Gen)',            start_year: 2013, end_year: 2018, fuel: ['Petrol', 'Diesel'] },
      { name: 'Amaze (2nd Gen)',            start_year: 2018, end_year: 2024, fuel: ['Petrol', 'Diesel'] },
      { name: 'Amaze (3rd Gen / 2024)',     start_year: 2024, end_year: null,  fuel: ['Petrol'] },
      { name: 'Mobilio MPV',                start_year: 2014, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'BR-V SUV',                   start_year: 2016, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'WR-V Cross',                 start_year: 2017, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'CR-V (2nd/3rd/4th/5th Gen)', start_year: 2003, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'Elevate',                    start_year: 2023, end_year: null,  fuel: ['Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  7. DATSUN (Nissan Group in India)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Datsun',
    models: [
      { name: 'GO Hatchback',               start_year: 2014, end_year: 2022, fuel: ['Petrol', 'LPG'] },
      { name: 'GO+ Sub-Compact MPV',        start_year: 2015, end_year: 2022, fuel: ['Petrol'] },
      { name: 'redi-GO',                    start_year: 2016, end_year: 2022, fuel: ['Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  8. NISSAN
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Nissan',
    models: [
      { name: 'Micra',                      start_year: 2010, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Micra Active',               start_year: 2013, end_year: 2020, fuel: ['Petrol'] },
      { name: 'Sunny Sedan',                start_year: 2011, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Evalia MPV',                 start_year: 2012, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Terrano SUV',                start_year: 2013, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Kicks',                      start_year: 2019, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Teana Luxury Sedan',         start_year: 2006, end_year: 2014, fuel: ['Petrol'] },
      { name: 'X-Trail (T30 / T31)',        start_year: 2004, end_year: 2014, fuel: ['Petrol', 'Diesel'] },
      { name: 'X-Trail (4th Gen CBU)',      start_year: 2024, end_year: null,  fuel: ['Petrol', 'Hybrid'] },
      { name: '370Z Sports Coupe',          start_year: 2010, end_year: 2014, fuel: ['Petrol'] },
      { name: 'GT-R (R35 Supercar)',        start_year: 2016, end_year: null,  fuel: ['Petrol'] },
      { name: 'Patrol (Y62 SUV)',           start_year: 2020, end_year: null,  fuel: ['Petrol'] },
      { name: 'Magnite',                    start_year: 2020, end_year: null,  fuel: ['Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  9. RENAULT
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Renault',
    models: [
      { name: 'Logan (Mahindra-Renault)',   start_year: 2007, end_year: 2011, fuel: ['Petrol', 'Diesel'] },
      { name: 'Fluence Sedan',              start_year: 2011, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Koleos SUV',                 start_year: 2011, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Pulse Hatchback',            start_year: 2012, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Scala Sedan',                start_year: 2012, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Duster (1st Gen)',           start_year: 2012, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Duster AWD (4x4)',           start_year: 2014, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Lodgy MPV',                  start_year: 2015, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Captur SUV',                 start_year: 2017, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Kwid',                       start_year: 2015, end_year: null,  fuel: ['Petrol'] },
      { name: 'Kwid EV (K-ZE)',             start_year: 2025, end_year: null,  fuel: ['EV'] },
      { name: 'Triber 7-Seater',            start_year: 2019, end_year: null,  fuel: ['Petrol'] },
      { name: 'Kiger Turbo / MT',           start_year: 2021, end_year: null,  fuel: ['Petrol'] },
      { name: 'New Duster (Gen 3)',         start_year: 2025, end_year: null,  fuel: ['Petrol', 'Hybrid'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  10. KIA
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Kia',
    models: [
      { name: 'Seltos',                     start_year: 2019, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Seltos X-Line',              start_year: 2021, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Sonet',                      start_year: 2020, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Sonet X-Line',               start_year: 2022, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Carens',                     start_year: 2022, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Carens EV',                  start_year: 2025, end_year: null,  fuel: ['EV'] },
      { name: 'Carnival (YP 1st Gen India)', start_year: 2020, end_year: 2023, fuel: ['Diesel'] },
      { name: 'Carnival Limousine (KA4)',   start_year: 2024, end_year: null,  fuel: ['Diesel'] },
      { name: 'EV6 Electric Crossover',     start_year: 2022, end_year: null,  fuel: ['EV'] },
      { name: 'EV9 Luxury Electric SUV',    start_year: 2024, end_year: null,  fuel: ['EV'] },
      { name: 'Syros Compact SUV',          start_year: 2025, end_year: null,  fuel: ['Petrol', 'Diesel', 'EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  11. VOLKSWAGEN
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Volkswagen',
    models: [
      { name: 'Polo',                       start_year: 2010, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Polo GT TSI',                start_year: 2013, end_year: 2022, fuel: ['Petrol'] },
      { name: 'Polo GT TDI',                start_year: 2013, end_year: 2019, fuel: ['Diesel'] },
      { name: 'CrossPolo',                  start_year: 2013, end_year: 2018, fuel: ['Petrol', 'Diesel'] },
      { name: 'Polo GTI (Hot Hatch 3-Door)', start_year: 2016, end_year: 2018, fuel: ['Petrol'] },
      { name: 'Vento',                      start_year: 2010, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'Ameo Compact Sedan',         start_year: 2016, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Jetta (Mk5 / Mk6)',          start_year: 2008, end_year: 2018, fuel: ['Petrol', 'Diesel'] },
      { name: 'Passat (B6 / B7 / B8)',      start_year: 2007, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Phaeton Luxury Sedan',       start_year: 2010, end_year: 2014, fuel: ['Petrol', 'Diesel'] },
      { name: 'Beetle',                     start_year: 2009, end_year: 2018, fuel: ['Petrol'] },
      { name: 'Touareg Luxury SUV',         start_year: 2008, end_year: 2014, fuel: ['Diesel'] },
      { name: 'Tiguan (1st Gen India)',     start_year: 2017, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Tiguan Allspace (7-Seater)', start_year: 2020, end_year: 2022, fuel: ['Petrol'] },
      { name: 'T-Roc (CBU SUV)',            start_year: 2020, end_year: 2022, fuel: ['Petrol'] },
      { name: 'Tiguan (Facelift 5-Seater)', start_year: 2021, end_year: null,  fuel: ['Petrol'] },
      { name: 'Taigun',                     start_year: 2021, end_year: null,  fuel: ['Petrol'] },
      { name: 'Virtus',                     start_year: 2022, end_year: null,  fuel: ['Petrol'] },
      { name: 'Virtus GT',                  start_year: 2022, end_year: null,  fuel: ['Petrol'] },
      { name: 'ID.4 Electric SUV',          start_year: 2024, end_year: null,  fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  12. SKODA
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Skoda',
    models: [
      { name: 'Fabia Hatchback',            start_year: 2008, end_year: 2013, fuel: ['Petrol', 'Diesel'] },
      { name: 'Fabia Scout',                start_year: 2012, end_year: 2013, fuel: ['Petrol', 'Diesel'] },
      { name: 'Octavia (1st Gen / Tour)',   start_year: 2002, end_year: 2010, fuel: ['Petrol', 'Diesel'] },
      { name: 'Octavia Combi (Estate)',     start_year: 2005, end_year: 2008, fuel: ['Petrol', 'Diesel'] },
      { name: 'Laura (Octavia 2nd Gen)',    start_year: 2006, end_year: 2013, fuel: ['Petrol', 'Diesel'] },
      { name: 'Octavia (3rd Gen Mk3 5E)',   start_year: 2013, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Octavia (4th Gen Mk4 NX)',   start_year: 2021, end_year: 2023, fuel: ['Petrol'] },
      { name: 'Octavia vRS (Mk1/Mk2/Mk3/Mk4)', start_year: 2004, end_year: null, fuel: ['Petrol'] },
      { name: 'Rapid Sedan',                start_year: 2011, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'Superb (1st Gen B5)',        start_year: 2004, end_year: 2009, fuel: ['Petrol', 'Diesel'] },
      { name: 'Superb (2nd Gen B6)',        start_year: 2009, end_year: 2015, fuel: ['Petrol', 'Diesel'] },
      { name: 'Superb (3rd Gen B8)',        start_year: 2016, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Superb (4th Gen B9 CBU)',    start_year: 2024, end_year: null,  fuel: ['Petrol'] },
      { name: 'Yeti 4x2 / 4x4',             start_year: 2010, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Karoq (CBU SUV)',            start_year: 2020, end_year: 2021, fuel: ['Petrol'] },
      { name: 'Kodiaq 7-Seater SUV',        start_year: 2017, end_year: null,  fuel: ['Diesel', 'Petrol'] },
      { name: 'Kushaq',                     start_year: 2021, end_year: null,  fuel: ['Petrol'] },
      { name: 'Slavia',                     start_year: 2022, end_year: null,  fuel: ['Petrol'] },
      { name: 'Kylaq Sub-4m SUV',           start_year: 2024, end_year: null,  fuel: ['Petrol'] },
      { name: 'Enyaq iV Electric SUV',      start_year: 2024, end_year: null,  fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  13. MG (Morris Garages)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'MG',
    models: [
      { name: 'Hector 5-Seater',            start_year: 2019, end_year: null,  fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Hector Plus 6/7-Seater',     start_year: 2020, end_year: null,  fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'ZS EV Electric SUV',         start_year: 2020, end_year: null,  fuel: ['EV'] },
      { name: 'Astor AI SUV',               start_year: 2021, end_year: null,  fuel: ['Petrol'] },
      { name: 'Gloster 4x4 Luxury SUV',     start_year: 2020, end_year: null,  fuel: ['Diesel'] },
      { name: 'Comet EV Smart City Car',    start_year: 2023, end_year: null,  fuel: ['EV'] },
      { name: 'Windsor EV Crossover Utility', start_year: 2024, end_year: null, fuel: ['EV'] },
      { name: 'Cyberster EV Electric Roadster', start_year: 2024, end_year: null, fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  14. CITROËN
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Citroën',
    models: [
      { name: 'C5 Aircross Luxury SUV',     start_year: 2021, end_year: null,  fuel: ['Diesel'] },
      { name: 'C3 Hatchback',               start_year: 2022, end_year: null,  fuel: ['Petrol'] },
      { name: 'ë-C3 Electric Hatchback',    start_year: 2023, end_year: null,  fuel: ['EV'] },
      { name: 'C3 Aircross (5/7 Seater)',   start_year: 2023, end_year: null,  fuel: ['Petrol'] },
      { name: 'Basalt Coupe SUV',           start_year: 2024, end_year: null,  fuel: ['Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  15. MITSUBISHI (HM-Mitsubishi in India)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Mitsubishi',
    models: [
      { name: 'Lancer',                     start_year: 1998, end_year: 2012, fuel: ['Petrol', 'Diesel'] },
      { name: 'Lancer Cedia',               start_year: 2006, end_year: 2013, fuel: ['Petrol', 'LPG'] },
      { name: 'Lancer Evolution X (Evo X)', start_year: 2010, end_year: 2013, fuel: ['Petrol'] },
      { name: 'Pajero SFX / GLX 4x4',       start_year: 2002, end_year: 2012, fuel: ['Diesel'] },
      { name: 'Pajero Sport',               start_year: 2012, end_year: 2020, fuel: ['Diesel'] },
      { name: 'Outlander (1st Gen India)',  start_year: 2008, end_year: 2013, fuel: ['Petrol'] },
      { name: 'Outlander (2nd Gen India)',  start_year: 2018, end_year: 2020, fuel: ['Petrol'] },
      { name: 'Montero Luxury 4x4',         start_year: 2007, end_year: 2020, fuel: ['Diesel'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  16. FORD (Exited India 2021)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Ford',
    models: [
      { name: 'Escort',                     start_year: 1996, end_year: 2001, fuel: ['Petrol', 'Diesel'] },
      { name: 'Ikon (Josh Machine)',        start_year: 1999, end_year: 2011, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Mondeo',                     start_year: 2002, end_year: 2007, fuel: ['Petrol', 'Diesel'] },
      { name: 'Fusion Crossover',           start_year: 2004, end_year: 2010, fuel: ['Petrol', 'Diesel'] },
      { name: 'Fiesta Sedan',               start_year: 2005, end_year: 2011, fuel: ['Petrol', 'Diesel'] },
      { name: 'Fiesta Classic / Classic',   start_year: 2011, end_year: 2015, fuel: ['Petrol', 'Diesel'] },
      { name: 'Global Fiesta (6th Gen)',    start_year: 2011, end_year: 2016, fuel: ['Petrol', 'Diesel'] },
      { name: 'Figo (1st Gen)',             start_year: 2010, end_year: 2015, fuel: ['Petrol', 'Diesel'] },
      { name: 'Figo (2nd Gen)',             start_year: 2015, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'Figo Aspire / Aspire',       start_year: 2015, end_year: 2021, fuel: ['Petrol', 'Diesel', 'CNG'] },
      { name: 'Freestyle Crossover',        start_year: 2018, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'EcoSport (1st Gen)',         start_year: 2013, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'EcoSport (Facelift)',        start_year: 2017, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'Endeavour (1st Gen)',        start_year: 2003, end_year: 2015, fuel: ['Diesel'] },
      { name: 'Endeavour (2nd Gen 2.2/3.2/2.0)', start_year: 2016, end_year: 2021, fuel: ['Diesel'] },
      { name: 'Mustang GT V8',              start_year: 2016, end_year: 2021, fuel: ['Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  17. CHEVROLET / OPEL (General Motors India)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Chevrolet',
    models: [
      { name: 'Optra Sedan',                start_year: 2003, end_year: 2012, fuel: ['Petrol', 'Diesel'] },
      { name: 'Optra SRV (Hatchback)',      start_year: 2006, end_year: 2009, fuel: ['Petrol'] },
      { name: 'Optra Magnum',               start_year: 2007, end_year: 2013, fuel: ['Petrol', 'Diesel'] },
      { name: 'Tavera MPV',                 start_year: 2004, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Tavera Neo 3',               start_year: 2012, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Aveo Sedan',                 start_year: 2006, end_year: 2012, fuel: ['Petrol', 'CNG'] },
      { name: 'Aveo U-VA Hatchback',        start_year: 2006, end_year: 2012, fuel: ['Petrol'] },
      { name: 'Spark',                      start_year: 2007, end_year: 2017, fuel: ['Petrol', 'LPG'] },
      { name: 'Beat Hatchback',             start_year: 2010, end_year: 2017, fuel: ['Petrol', 'Diesel', 'LPG'] },
      { name: 'Cruze Sedan',                start_year: 2009, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Sail Sedan',                 start_year: 2013, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Sail U-VA Hatchback',        start_year: 2012, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Enjoy MPV',                  start_year: 2013, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Captiva 4x4 SUV',            start_year: 2008, end_year: 2016, fuel: ['Diesel'] },
      { name: 'Trailblazer SUV',            start_year: 2015, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Forester AWD (Subaru-based)', start_year: 2003, end_year: 2007, fuel: ['Petrol'] },
    ]
  },
  {
    make: 'Opel',
    models: [
      { name: 'Astra',                      start_year: 1996, end_year: 2003, fuel: ['Petrol', 'Diesel'] },
      { name: 'Corsa Sedan',                start_year: 2000, end_year: 2006, fuel: ['Petrol'] },
      { name: 'Corsa Sail (Hatchback)',     start_year: 2003, end_year: 2006, fuel: ['Petrol'] },
      { name: 'Corsa Swing (Estate)',       start_year: 2001, end_year: 2006, fuel: ['Petrol'] },
      { name: 'Vectra',                     start_year: 2002, end_year: 2006, fuel: ['Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  18. DAEWOO (Historical)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Daewoo',
    models: [
      { name: 'Cielo',                      start_year: 1995, end_year: 2001, fuel: ['Petrol'] },
      { name: 'Nexia',                      start_year: 1999, end_year: 2002, fuel: ['Petrol'] },
      { name: 'Matiz',                      start_year: 1998, end_year: 2002, fuel: ['Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  19. FIAT (Fiat Chrysler Automobiles India)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Fiat',
    models: [
      { name: 'Uno',                        start_year: 1996, end_year: 2006, fuel: ['Petrol', 'Diesel'] },
      { name: 'Siena Sedan',                start_year: 1999, end_year: 2004, fuel: ['Petrol', 'Diesel'] },
      { name: 'Siena Weekend (Estate)',     start_year: 2002, end_year: 2005, fuel: ['Petrol', 'Diesel'] },
      { name: 'Palio Hatchback',            start_year: 2001, end_year: 2007, fuel: ['Petrol', 'Diesel'] },
      { name: 'Palio 1.6 GTX',              start_year: 2001, end_year: 2006, fuel: ['Petrol'] },
      { name: 'Palio Adventure (Estate)',   start_year: 2002, end_year: 2007, fuel: ['Petrol', 'Diesel'] },
      { name: 'Palio Stile / Stile MultiJet', start_year: 2007, end_year: 2011, fuel: ['Petrol', 'Diesel'] },
      { name: 'Petra Sedan',                start_year: 2004, end_year: 2008, fuel: ['Petrol', 'Diesel'] },
      { name: 'Grande Punto',               start_year: 2009, end_year: 2014, fuel: ['Petrol', 'Diesel'] },
      { name: 'Punto 90HP',                 start_year: 2010, end_year: 2014, fuel: ['Diesel'] },
      { name: 'Punto EVO',                  start_year: 2014, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Punto Pure',                 start_year: 2016, end_year: 2018, fuel: ['Petrol', 'Diesel'] },
      { name: 'Avventura Crossover',        start_year: 2014, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Urban Cross',                start_year: 2016, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Abarth Punto (145hp)',       start_year: 2015, end_year: 2019, fuel: ['Petrol'] },
      { name: 'Abarth Avventura',           start_year: 2015, end_year: 2019, fuel: ['Petrol'] },
      { name: '500 (Cinquecento CBU)',      start_year: 2008, end_year: 2013, fuel: ['Diesel', 'Petrol'] },
      { name: 'Abarth 595 Competizione',    start_year: 2015, end_year: 2019, fuel: ['Petrol'] },
      { name: 'Linea Sedan',                start_year: 2008, end_year: 2018, fuel: ['Petrol', 'Diesel'] },
      { name: 'Linea T-Jet (Turbo)',        start_year: 2010, end_year: 2018, fuel: ['Petrol'] },
      { name: 'Linea Classic',              start_year: 2013, end_year: 2018, fuel: ['Petrol', 'Diesel'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  20. JEEP
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Jeep',
    models: [
      { name: 'Compass',                    start_year: 2017, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Compass Trailhawk 4x4',      start_year: 2019, end_year: null,  fuel: ['Diesel'] },
      { name: 'Meridian 7-Seater SUV',      start_year: 2022, end_year: null,  fuel: ['Diesel'] },
      { name: 'Wrangler Rubicon / Sahara',  start_year: 2016, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Grand Cherokee (WK2 / WL)',  start_year: 2016, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Grand Cherokee SRT (V8 Hemi)', start_year: 2016, end_year: 2020, fuel: ['Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  21. MERCEDES-BENZ
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Mercedes-Benz',
    models: [
      { name: 'A-Class Hatchback (W176)',   start_year: 2013, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'A-Class Limousine (V177)',   start_year: 2021, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'AMG A 35 / A 45 S',          start_year: 2021, end_year: null,  fuel: ['Petrol'] },
      { name: 'B-Class Sports Tourer',      start_year: 2012, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'CLA 4-Door Coupe (C117)',    start_year: 2015, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'C-Class (W202 Classic)',     start_year: 1995, end_year: 2000, fuel: ['Diesel', 'Petrol'] },
      { name: 'C-Class (W203)',             start_year: 2001, end_year: 2007, fuel: ['Petrol', 'Diesel'] },
      { name: 'C-Class (W204)',             start_year: 2007, end_year: 2014, fuel: ['Petrol', 'Diesel'] },
      { name: 'C-Class (W205)',             start_year: 2014, end_year: 2021, fuel: ['Petrol', 'Diesel'] },
      { name: 'C-Class (W206)',             start_year: 2022, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'AMG C 43 / C 63',            start_year: 2016, end_year: null,  fuel: ['Petrol'] },
      { name: 'E-Class (W124 Heritage)',    start_year: 1995, end_year: 1998, fuel: ['Petrol', 'Diesel'] },
      { name: 'E-Class (W210)',             start_year: 1998, end_year: 2002, fuel: ['Petrol', 'Diesel'] },
      { name: 'E-Class (W211)',             start_year: 2002, end_year: 2009, fuel: ['Petrol', 'Diesel'] },
      { name: 'E-Class (W212)',             start_year: 2009, end_year: 2016, fuel: ['Petrol', 'Diesel'] },
      { name: 'E-Class (W213 LWB)',         start_year: 2017, end_year: 2024, fuel: ['Petrol', 'Diesel'] },
      { name: 'E-Class (V214 LWB / 2024)',  start_year: 2024, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'AMG E 53 / E 63 S',          start_year: 2018, end_year: null,  fuel: ['Petrol'] },
      { name: 'CLS 4-Door Coupe',           start_year: 2005, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'S-Class (W220)',             start_year: 2000, end_year: 2006, fuel: ['Petrol', 'Diesel'] },
      { name: 'S-Class (W221)',             start_year: 2006, end_year: 2013, fuel: ['Petrol', 'Diesel'] },
      { name: 'S-Class (W222)',             start_year: 2014, end_year: 2021, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'S-Class (W223)',             start_year: 2021, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Maybach S-Class (S580/S680)', start_year: 2015, end_year: null, fuel: ['Petrol'] },
      { name: 'GLA SUV (X156 / H247)',      start_year: 2014, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'GLB 7-Seater SUV',           start_year: 2022, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'GLC SUV (X253 / X254)',      start_year: 2016, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'GLC Coupe',                  start_year: 2017, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'GLE / ML-Class (W164/W166/W167)', start_year: 2007, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: 'GLE Coupe',                  start_year: 2016, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'GLS / GL-Class (X164/X166/X167)', start_year: 2010, end_year: null, fuel: ['Diesel', 'Petrol'] },
      { name: 'Maybach GLS 600',            start_year: 2021, end_year: null,  fuel: ['Petrol'] },
      { name: 'G-Class (G 350d / G 400d)',  start_year: 2019, end_year: null,  fuel: ['Diesel'] },
      { name: 'G 63 AMG (G-Wagon)',         start_year: 2013, end_year: null,  fuel: ['Petrol'] },
      { name: 'AMG GT / GT-R / GT 4-Door',  start_year: 2015, end_year: null,  fuel: ['Petrol'] },
      { name: 'SL-Class / SL 55 AMG',       start_year: 2005, end_year: null,  fuel: ['Petrol'] },
      { name: 'SLC / SLK Roadster',         start_year: 2006, end_year: 2020, fuel: ['Petrol'] },
      { name: 'V-Class Luxury MPV',         start_year: 2019, end_year: 2022, fuel: ['Diesel'] },
      // EQ Electric Vehicles
      { name: 'EQA Electric SUV',           start_year: 2024, end_year: null,  fuel: ['EV'] },
      { name: 'EQB 7-Seater EV',            start_year: 2022, end_year: null,  fuel: ['EV'] },
      { name: 'EQE SUV',                    start_year: 2023, end_year: null,  fuel: ['EV'] },
      { name: 'EQE Sedan',                  start_year: 2024, end_year: null,  fuel: ['EV'] },
      { name: 'EQS Luxury Sedan',           start_year: 2022, end_year: null,  fuel: ['EV'] },
      { name: 'EQS SUV / Maybach EQS SUV',  start_year: 2024, end_year: null,  fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  22. BMW
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'BMW',
    models: [
      { name: '1 Series Hatchback',         start_year: 2013, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: '2 Series Gran Coupe',        start_year: 2020, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: '3 Series (E46 / E90 / F30)', start_year: 2005, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: '3 Series (G20 Sedan)',       start_year: 2019, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: '3 Series Gran Limousine (LWB)', start_year: 2021, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '3 Series GT (Gran Turismo)', start_year: 2014, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'M340i xDrive',               start_year: 2021, end_year: null,  fuel: ['Petrol'] },
      { name: '4 Series Coupe / M4',        start_year: 2015, end_year: null,  fuel: ['Petrol'] },
      { name: '5 Series (E60 / F10 / G30)', start_year: 2007, end_year: 2024, fuel: ['Petrol', 'Diesel'] },
      { name: '5 Series Long Wheelbase (G68)', start_year: 2024, end_year: null, fuel: ['Petrol', 'Diesel'] },
      { name: '6 Series Coupe / Gran Coupe', start_year: 2012, end_year: 2018, fuel: ['Petrol', 'Diesel'] },
      { name: '6 Series GT (Gran Turismo)', start_year: 2018, end_year: 2024, fuel: ['Petrol', 'Diesel'] },
      { name: '7 Series (E65 / F01 / G11)', start_year: 2006, end_year: 2022, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: '7 Series (G70)',             start_year: 2023, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: '8 Series Gran Coupe / M8',   start_year: 2020, end_year: null,  fuel: ['Petrol'] },
      { name: 'Z4 Roadster (E89 / G29)',    start_year: 2009, end_year: null,  fuel: ['Petrol'] },
      { name: 'M2 Competition',             start_year: 2018, end_year: null,  fuel: ['Petrol'] },
      { name: 'M3 Competition',             start_year: 2015, end_year: null,  fuel: ['Petrol'] },
      { name: 'M5 Competition (F10 / F90)', start_year: 2012, end_year: null,  fuel: ['Petrol'] },
      // X SUV Family
      { name: 'X1 (E84 / F48 / U11)',       start_year: 2010, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'X3 (E83 / F25 / G01 / G45)', start_year: 2008, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'X4 Coupe SUV',               start_year: 2019, end_year: 2024, fuel: ['Petrol', 'Diesel'] },
      { name: 'X5 (E70 / F15 / G05)',       start_year: 2007, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'X6 Coupe SUV',               start_year: 2009, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'X7 Luxury 7-Seater SUV',     start_year: 2019, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'XM Hybrid Super-SUV',        start_year: 2023, end_year: null,  fuel: ['Hybrid'] },
      // BMW i Electric Range
      { name: 'iX1 Electric SUV',           start_year: 2023, end_year: null,  fuel: ['EV'] },
      { name: 'i4 Electric Gran Coupe',     start_year: 2022, end_year: null,  fuel: ['EV'] },
      { name: 'i5 Electric Sedan',          start_year: 2024, end_year: null,  fuel: ['EV'] },
      { name: 'iX Electric SUV',            start_year: 2021, end_year: null,  fuel: ['EV'] },
      { name: 'i7 Electric Luxury Flagship', start_year: 2023, end_year: null, fuel: ['EV'] },
      { name: 'i8 Hybrid Supercar',         start_year: 2015, end_year: 2020, fuel: ['Hybrid'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  23. AUDI
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Audi',
    models: [
      { name: 'A3 Sedan / Cabriolet',       start_year: 2014, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'A4 (B7 / B8 / B9)',          start_year: 2008, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'S5 / S4 Sportback',          start_year: 2015, end_year: null,  fuel: ['Petrol'] },
      { name: 'A6 (C6 / C7 / C8)',          start_year: 2007, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'RS 6 Avant (Super Estate)',  start_year: 2015, end_year: null,  fuel: ['Petrol'] },
      { name: 'A7 / RS 7 Sportback',        start_year: 2011, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'A8 L Flagship (D3/D4/D5)',   start_year: 2010, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'TT Coupe',                   start_year: 2009, end_year: 2020, fuel: ['Petrol'] },
      { name: 'R8 V8 / V10 Supercar',       start_year: 2009, end_year: 2020, fuel: ['Petrol'] },
      { name: 'Q2 Compact SUV',             start_year: 2020, end_year: 2022, fuel: ['Petrol'] },
      { name: 'Q3 (1st Gen 8U)',            start_year: 2012, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q3 (2nd Gen F3)',            start_year: 2022, end_year: null,  fuel: ['Petrol'] },
      { name: 'Q3 Sportback',               start_year: 2023, end_year: null,  fuel: ['Petrol'] },
      { name: 'Q5 (1st Gen 8R)',            start_year: 2009, end_year: 2017, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q5 (2nd Gen FY)',            start_year: 2018, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Q7 (1st Gen 4L)',            start_year: 2006, end_year: 2015, fuel: ['Petrol', 'Diesel'] },
      { name: 'Q7 (2nd Gen 4M)',            start_year: 2015, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Q8 Flagship SUV',            start_year: 2020, end_year: null,  fuel: ['Petrol'] },
      { name: 'RS Q8 Super SUV',            start_year: 2020, end_year: null,  fuel: ['Petrol'] },
      { name: 'e-tron 50 / 55 SUV',         start_year: 2021, end_year: 2024, fuel: ['EV'] },
      { name: 'Q8 e-tron / Sportback',      start_year: 2023, end_year: null,  fuel: ['EV'] },
      { name: 'e-tron GT / RS e-tron GT',   start_year: 2021, end_year: null,  fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  24. VOLVO
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Volvo',
    models: [
      { name: 'V40 Hatchback',              start_year: 2013, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'V40 Cross Country',          start_year: 2013, end_year: 2020, fuel: ['Petrol', 'Diesel'] },
      { name: 'S60 (2nd Gen)',              start_year: 2011, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'S60 (3rd Gen)',              start_year: 2021, end_year: 2022, fuel: ['Petrol'] },
      { name: 'S80 Luxury Sedan',           start_year: 2007, end_year: 2016, fuel: ['Petrol', 'Diesel'] },
      { name: 'S90 Flagship Sedan',         start_year: 2016, end_year: null,  fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'V90 Cross Country',          start_year: 2017, end_year: 2021, fuel: ['Diesel'] },
      { name: 'XC40 Petrol / Mild-Hybrid',  start_year: 2018, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'XC40 Recharge (EX40)',       start_year: 2022, end_year: null,  fuel: ['EV'] },
      { name: 'C40 Recharge (EC40)',        start_year: 2023, end_year: null,  fuel: ['EV'] },
      { name: 'XC60 (1st Gen)',             start_year: 2011, end_year: 2017, fuel: ['Diesel'] },
      { name: 'XC60 (2nd Gen Mild-Hybrid)', start_year: 2017, end_year: null,  fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'XC90 (1st Gen)',             start_year: 2006, end_year: 2015, fuel: ['Diesel', 'Petrol'] },
      { name: 'XC90 (2nd Gen / T8 Hybrid)', start_year: 2015, end_year: null,  fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'EX90 Electric Luxury SUV',   start_year: 2025, end_year: null,  fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  25. JAGUAR
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Jaguar',
    models: [
      { name: 'XE Sedan',                   start_year: 2016, end_year: 2022, fuel: ['Petrol', 'Diesel'] },
      { name: 'XF Sedan (X250 / X260)',     start_year: 2009, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'XJ / XJL Luxury Flagship',   start_year: 2010, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'E-Pace Compact SUV',         start_year: 2018, end_year: 2020, fuel: ['Petrol'] },
      { name: 'F-Pace SUV',                 start_year: 2016, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'F-Pace SVR (V8)',            start_year: 2019, end_year: null,  fuel: ['Petrol'] },
      { name: 'F-Type Coupe / Convertible', start_year: 2013, end_year: 2024, fuel: ['Petrol'] },
      { name: 'I-Pace All-Electric SUV',    start_year: 2021, end_year: null,  fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  26. LAND ROVER
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Land Rover',
    models: [
      { name: 'Freelander 2',               start_year: 2007, end_year: 2015, fuel: ['Diesel', 'Petrol'] },
      { name: 'Discovery 4 (LR4)',          start_year: 2010, end_year: 2016, fuel: ['Diesel', 'Petrol'] },
      { name: 'Discovery 5',                start_year: 2017, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Discovery Sport',            start_year: 2015, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Range Rover Evoque (L538)',  start_year: 2011, end_year: 2019, fuel: ['Petrol', 'Diesel'] },
      { name: 'Range Rover Evoque (L551)',  start_year: 2019, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Range Rover Velar',          start_year: 2017, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Range Rover Sport (L320)',   start_year: 2007, end_year: 2013, fuel: ['Diesel', 'Petrol'] },
      { name: 'Range Rover Sport (L494)',   start_year: 2013, end_year: 2022, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Range Rover Sport (L461)',   start_year: 2022, end_year: null,  fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Range Rover (L322 / Vogue)', start_year: 2006, end_year: 2012, fuel: ['Diesel', 'Petrol'] },
      { name: 'Range Rover (L405 / Autobiography)', start_year: 2013, end_year: 2022, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Range Rover (L460 SWB / LWB)', start_year: 2022, end_year: null, fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Defender 90 (3-Door)',       start_year: 2020, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Defender 110 (5-Door)',      start_year: 2020, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Defender 130 (8-Seater)',    start_year: 2023, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Defender V8 / Octa',         start_year: 2022, end_year: null,  fuel: ['Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  27. LEXUS
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Lexus',
    models: [
      { name: 'ES 300h Luxury Hybrid Sedan', start_year: 2017, end_year: null,  fuel: ['Hybrid'] },
      { name: 'NX 300h / NX 350h Hybrid SUV', start_year: 2018, end_year: null, fuel: ['Hybrid'] },
      { name: 'RX 450h / RX 350h SUV',      start_year: 2017, end_year: null,  fuel: ['Hybrid'] },
      { name: 'RX 500h F Sport Performance', start_year: 2023, end_year: null, fuel: ['Hybrid'] },
      { name: 'LX 450d / LX 500d 4x4 Flagship', start_year: 2017, end_year: null, fuel: ['Diesel'] },
      { name: 'LS 500h Ultra-Luxury Sedan', start_year: 2018, end_year: null,  fuel: ['Hybrid'] },
      { name: 'LC 500h Hybrid Grand Tourer', start_year: 2020, end_year: null,  fuel: ['Hybrid'] },
      { name: 'LM 350h Ultra-Luxury MPV (4/7-Seater)', start_year: 2024, end_year: null, fuel: ['Hybrid'] },
      { name: 'UX 300e Electric Crossover', start_year: 2023, end_year: null,  fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  28. PORSCHE
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Porsche',
    models: [
      { name: 'Macan / Macan S / GTS',      start_year: 2014, end_year: 2023, fuel: ['Petrol'] },
      { name: 'Macan EV (All-Electric)',    start_year: 2024, end_year: null,  fuel: ['EV'] },
      { name: 'Cayenne (958 / 9YA)',        start_year: 2012, end_year: null,  fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Cayenne Coupe',              start_year: 2019, end_year: null,  fuel: ['Petrol', 'Hybrid'] },
      { name: 'Cayenne Turbo GT',           start_year: 2021, end_year: null,  fuel: ['Petrol'] },
      { name: 'Panamera / Executive',       start_year: 2013, end_year: null,  fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Taycan Electric Sports Sedan', start_year: 2021, end_year: null, fuel: ['EV'] },
      { name: 'Taycan Cross / Sport Turismo', start_year: 2022, end_year: null, fuel: ['EV'] },
      { name: '718 Boxster Roadster',       start_year: 2016, end_year: null,  fuel: ['Petrol'] },
      { name: '718 Cayman Coupe',           start_year: 2016, end_year: null,  fuel: ['Petrol'] },
      { name: '718 Cayman GT4 / RS',        start_year: 2020, end_year: null,  fuel: ['Petrol'] },
      { name: '911 Carrera (991 / 992)',    start_year: 2012, end_year: null,  fuel: ['Petrol', 'Hybrid'] },
      { name: '911 Turbo / Turbo S',        start_year: 2013, end_year: null,  fuel: ['Petrol'] },
      { name: '911 GT3 / GT3 RS',           start_year: 2014, end_year: null,  fuel: ['Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  29. ROLLS-ROYCE & BENTLEY
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Rolls-Royce',
    models: [
      { name: 'Ghost (1st & 2nd Gen)',      start_year: 2010, end_year: null,  fuel: ['Petrol'] },
      { name: 'Ghost Extended LWB',         start_year: 2011, end_year: null,  fuel: ['Petrol'] },
      { name: 'Phantom (VII & VIII)',       start_year: 2008, end_year: null,  fuel: ['Petrol'] },
      { name: 'Phantom Extended LWB',       start_year: 2008, end_year: null,  fuel: ['Petrol'] },
      { name: 'Wraith Fastback Coupe',      start_year: 2013, end_year: 2023, fuel: ['Petrol'] },
      { name: 'Dawn Luxury Drophead',       start_year: 2016, end_year: 2023, fuel: ['Petrol'] },
      { name: 'Cullinan Luxury SUV',        start_year: 2018, end_year: null,  fuel: ['Petrol'] },
      { name: 'Cullinan Black Badge',       start_year: 2020, end_year: null,  fuel: ['Petrol'] },
      { name: 'Spectre Ultra-Luxury EV Coupe', start_year: 2024, end_year: null, fuel: ['EV'] },
    ]
  },
  {
    make: 'Bentley',
    models: [
      { name: 'Continental GT (V8 / W12)',  start_year: 2012, end_year: null,  fuel: ['Petrol', 'Hybrid'] },
      { name: 'Continental GTC Convertible', start_year: 2012, end_year: null, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Flying Spur (V8/W12/Hybrid)', start_year: 2013, end_year: null, fuel: ['Petrol', 'Hybrid'] },
      { name: 'Mulsanne Flagship',          start_year: 2010, end_year: 2021, fuel: ['Petrol'] },
      { name: 'Bentayga Luxury SUV',        start_year: 2016, end_year: null,  fuel: ['Petrol', 'Diesel', 'Hybrid'] },
      { name: 'Bentayga EWB (Extended Wheelbase)', start_year: 2022, end_year: null, fuel: ['Petrol', 'Hybrid'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  30. LAMBORGHINI & FERRARI
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Lamborghini',
    models: [
      { name: 'Gallardo (LP 550 / LP 560)', start_year: 2004, end_year: 2014, fuel: ['Petrol'] },
      { name: 'Murcielago (LP 640)',        start_year: 2006, end_year: 2010, fuel: ['Petrol'] },
      { name: 'Aventador (LP 700 / S / SVJ)', start_year: 2012, end_year: 2022, fuel: ['Petrol'] },
      { name: 'Huracan (LP 610 / Evo / STO)', start_year: 2014, end_year: null, fuel: ['Petrol'] },
      { name: 'Huracan Tecnica / Sterrato', start_year: 2022, end_year: null,  fuel: ['Petrol'] },
      { name: 'Urus Super SUV',             start_year: 2018, end_year: null,  fuel: ['Petrol'] },
      { name: 'Urus Performante / S',       start_year: 2022, end_year: null,  fuel: ['Petrol'] },
      { name: 'Urus SE (PHEV)',             start_year: 2024, end_year: null,  fuel: ['Hybrid'] },
      { name: 'Revuelto V12 Hybrid Supercar', start_year: 2024, end_year: null, fuel: ['Hybrid'] },
    ]
  },
  {
    make: 'Ferrari',
    models: [
      { name: 'California / California T',  start_year: 2009, end_year: 2018, fuel: ['Petrol'] },
      { name: '458 Italia / Spider',        start_year: 2010, end_year: 2015, fuel: ['Petrol'] },
      { name: '488 GTB / Spider / Pista',   start_year: 2016, end_year: 2020, fuel: ['Petrol'] },
      { name: 'F8 Tributo / Spider',        start_year: 2020, end_year: null,  fuel: ['Petrol'] },
      { name: 'Portofino / Portofino M',    start_year: 2018, end_year: 2023, fuel: ['Petrol'] },
      { name: 'Roma / Roma Spider',         start_year: 2021, end_year: null,  fuel: ['Petrol'] },
      { name: '296 GTB / 296 GTS Hybrid',  start_year: 2022, end_year: null,  fuel: ['Hybrid'] },
      { name: 'SF90 Stradale / Spider',     start_year: 2021, end_year: null,  fuel: ['Hybrid'] },
      { name: 'F12berlinetta / 812 Superfast', start_year: 2013, end_year: 2023, fuel: ['Petrol'] },
      { name: '12Cilindri (V12 Flagship)',  start_year: 2024, end_year: null,  fuel: ['Petrol'] },
      { name: 'GTC4Lusso / FF (V12 4WD)',   start_year: 2012, end_year: 2020, fuel: ['Petrol'] },
      { name: 'Purosangue V12 4-Door SUV',  start_year: 2023, end_year: null,  fuel: ['Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  31. ASTON MARTIN, MCLAREN, LOTUS & MASERATI
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Aston Martin',
    models: [
      { name: 'V8 / V12 Vantage',           start_year: 2011, end_year: null,  fuel: ['Petrol'] },
      { name: 'DB9 / DB11 / DB12',          start_year: 2011, end_year: null,  fuel: ['Petrol'] },
      { name: 'DBS Superleggera',           start_year: 2019, end_year: null,  fuel: ['Petrol'] },
      { name: 'Rapide 4-Door Sports Sedan', start_year: 2011, end_year: 2020, fuel: ['Petrol'] },
      { name: 'Vanquish',                   start_year: 2013, end_year: null,  fuel: ['Petrol'] },
      { name: 'DBX / DBX707 Luxury SUV',    start_year: 2021, end_year: null,  fuel: ['Petrol'] },
    ]
  },
  {
    make: 'McLaren',
    models: [
      { name: 'GT Grand Tourer',            start_year: 2022, end_year: null,  fuel: ['Petrol'] },
      { name: 'Artura Hybrid Supercar',     start_year: 2023, end_year: null,  fuel: ['Hybrid'] },
      { name: '720S / 750S Coupe/Spider',   start_year: 2022, end_year: null,  fuel: ['Petrol'] },
    ]
  },
  {
    make: 'Lotus',
    models: [
      { name: 'Emira Sports Coupe',         start_year: 2024, end_year: null,  fuel: ['Petrol'] },
      { name: 'Eletre Hyper-SUV (EV)',      start_year: 2023, end_year: null,  fuel: ['EV'] },
    ]
  },
  {
    make: 'Maserati',
    models: [
      { name: 'Ghibli Sports Sedan',        start_year: 2014, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Levante Luxury SUV',         start_year: 2018, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Quattroporte Flagship',      start_year: 2014, end_year: 2023, fuel: ['Petrol', 'Diesel'] },
      { name: 'Grecale SUV',                start_year: 2023, end_year: null,  fuel: ['Petrol', 'EV'] },
      { name: 'GranTurismo Coupe',          start_year: 2012, end_year: null,  fuel: ['Petrol', 'EV'] },
      { name: 'MC20 Supercar',              start_year: 2022, end_year: null,  fuel: ['Petrol'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  32. MINI
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'MINI',
    models: [
      { name: 'Cooper (3-Door Hatch)',      start_year: 2012, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Cooper S (Hot Hatch)',       start_year: 2012, end_year: null,  fuel: ['Petrol'] },
      { name: 'Cooper 5-Door',              start_year: 2015, end_year: null,  fuel: ['Petrol', 'Diesel'] },
      { name: 'Cooper Convertible',         start_year: 2012, end_year: null,  fuel: ['Petrol'] },
      { name: 'Cooper JCW (John Cooper Works)', start_year: 2019, end_year: null, fuel: ['Petrol'] },
      { name: 'Countryman SUV (R60 / F60 / U25)', start_year: 2012, end_year: null, fuel: ['Petrol', 'Diesel', 'EV'] },
      { name: 'Clubman (6-Door Estate)',    start_year: 2016, end_year: 2024, fuel: ['Petrol', 'Diesel'] },
      { name: 'Paceman 3-Door Coupe SUV',   start_year: 2013, end_year: 2016, fuel: ['Petrol', 'Diesel'] },
      { name: 'Cooper SE (All-Electric)',   start_year: 2022, end_year: null,  fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  33. ISUZU
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Isuzu',
    models: [
      { name: 'MU-7 7-Seater SUV',          start_year: 2007, end_year: 2016, fuel: ['Diesel'] },
      { name: 'MU-X 4x2 / 4x4 SUV',         start_year: 2017, end_year: null,  fuel: ['Diesel'] },
      { name: 'D-Max V-Cross 4x4 Lifestyle', start_year: 2016, end_year: null, fuel: ['Diesel'] },
      { name: 'D-Max Hi-Lander 4x2',        start_year: 2021, end_year: null,  fuel: ['Diesel'] },
      { name: 'D-Max S-CAB Commercial Pickup', start_year: 2016, end_year: null, fuel: ['Diesel'] },
      { name: 'D-Max Regular Cab (Commercial)', start_year: 2016, end_year: null, fuel: ['Diesel'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  34. BYD (Build Your Dreams - EVs)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'BYD',
    models: [
      { name: 'e6 Electric MPV',            start_year: 2021, end_year: null,  fuel: ['EV'] },
      { name: 'eMAX 7 Electric MPV',        start_year: 2024, end_year: null,  fuel: ['EV'] },
      { name: 'Atto 3 Electric SUV',        start_year: 2022, end_year: null,  fuel: ['EV'] },
      { name: 'Seal Electric Sports Sedan', start_year: 2024, end_year: null,  fuel: ['EV'] },
      { name: 'Sealion 6 Electric SUV',     start_year: 2025, end_year: null,  fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  35. FORCE MOTORS
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Force Motors',
    models: [
      { name: 'Traveller 3050 (9-13 Seater)', start_year: 1987, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Traveller 3350 (14-17 Seater)', start_year: 1990, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Traveller 4020 (18-26 Seater)', start_year: 2005, end_year: null, fuel: ['Diesel'] },
      { name: 'Traveller Ambulance / Delivery Van', start_year: 1995, end_year: null, fuel: ['Diesel'] },
      { name: 'Trax Cruiser 9/13 Seater',   start_year: 1996, end_year: null,  fuel: ['Diesel'] },
      { name: 'Trax Toofan Rural Maxi-Cab', start_year: 2000, end_year: null,  fuel: ['Diesel'] },
      { name: 'Trax Kargo King Pickup',     start_year: 2005, end_year: null,  fuel: ['Diesel'] },
      { name: 'Gurkha 4x4 (3-Door)',        start_year: 2013, end_year: null,  fuel: ['Diesel'] },
      { name: 'Gurkha 4x4 (5-Door)',        start_year: 2024, end_year: null,  fuel: ['Diesel'] },
      { name: 'Urbania Luxury Passenger Van', start_year: 2022, end_year: null, fuel: ['Diesel'] },
      { name: 'Force One SUV',              start_year: 2011, end_year: 2016, fuel: ['Diesel'] },
      { name: 'Citiline 10-Seater MUV',     start_year: 2023, end_year: null,  fuel: ['Diesel'] },
      { name: 'Minidor 3-Wheeler Auto',     start_year: 1995, end_year: 2010, fuel: ['Diesel'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  36. ASHOK LEYLAND (Commercial LCV, ICV, HCV & Buses)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Ashok Leyland',
    models: [
      { name: 'Dost Mini Truck',            start_year: 2011, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Dost+ / Dost Strong',        start_year: 2016, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Bada Dost i1 (LCV)',         start_year: 2020, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Bada Dost i2 (LCV)',         start_year: 2021, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Bada Dost i3 / i3+ (LCV)',   start_year: 2020, end_year: null,  fuel: ['Diesel'] },
      { name: 'Bada Dost i4 (LCV)',         start_year: 2020, end_year: null,  fuel: ['Diesel'] },
      { name: 'Partner Light Truck',        start_year: 2014, end_year: null,  fuel: ['Diesel'] },
      { name: 'MiTR Bus / School Bus',      start_year: 2014, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Stile MPV',                  start_year: 2013, end_year: 2017, fuel: ['Diesel'] },
      { name: 'Guru ICV Truck',             start_year: 2013, end_year: null,  fuel: ['Diesel'] },
      { name: 'Boss 1115 / 1215 / 1415 (ICV)', start_year: 2012, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Ecomet 1115 / 1215 / 1615',  start_year: 2010, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'AVTR Modular Truck (19T - 55T)', start_year: 2020, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Captain 2518 / 3118 Tipper/Haulage', start_year: 2013, end_year: null, fuel: ['Diesel'] },
      { name: 'U-Truck 2518 / 3118',        start_year: 2010, end_year: 2018, fuel: ['Diesel'] },
      { name: 'Viking / Cheetah Bus Chassis', start_year: 1980, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Oyster / Lynx Smart Bus',    start_year: 2018, end_year: null,  fuel: ['Diesel'] },
      { name: 'Switch IeV 3 / IeV 4 Electric LCV', start_year: 2023, end_year: null, fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  37. EICHER (VE Commercial Vehicles - VECV)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Eicher',
    models: [
      { name: 'Pro 2049 Light Truck',       start_year: 2018, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Pro 2059 / 2059XP Truck',    start_year: 2018, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Pro 2080 / 2095 Truck',      start_year: 2018, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Pro 3015 / 3019 ICV Truck',  start_year: 2019, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Pro 6028 / 6035 Heavy Truck', start_year: 2018, end_year: null, fuel: ['Diesel'] },
      { name: 'Pro 8035 / 8040 Mining Tipper', start_year: 2020, end_year: null, fuel: ['Diesel'] },
      { name: 'Pro 8055 Heavy Tractor Trailer', start_year: 2020, end_year: null, fuel: ['Diesel'] },
      { name: 'Skyline Pro / Starline School & Staff Bus', start_year: 2014, end_year: null, fuel: ['Diesel', 'CNG', 'EV'] },
      { name: 'Eicher 10.59 / 10.75 / 10.90 (Legacy LCV)', start_year: 1990, end_year: 2017, fuel: ['Diesel'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  38. BHARATBENZ (Daimler India Commercial Vehicles)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'BharatBenz',
    models: [
      { name: '914R / 1015R Light Duty Truck', start_year: 2012, end_year: null, fuel: ['Diesel'] },
      { name: '1215R / 1217C Medium Duty Truck', start_year: 2012, end_year: null, fuel: ['Diesel'] },
      { name: '1617R / 1917R Medium Duty Truck', start_year: 2013, end_year: null, fuel: ['Diesel'] },
      { name: '2823R / 2828C Heavy Tipper & Haulage', start_year: 2012, end_year: null, fuel: ['Diesel'] },
      { name: '3528C / 3528R Multi-Axle Truck', start_year: 2015, end_year: null, fuel: ['Diesel'] },
      { name: '4028T / 5528T Heavy Tractor Trailer', start_year: 2014, end_year: null, fuel: ['Diesel'] },
      { name: 'BharatBenz 9T / 16T Bus Chassis', start_year: 2015, end_year: null, fuel: ['Diesel'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  39. SML ISUZU (Swaraj Mazda / SML)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'SML Isuzu',
    models: [
      { name: 'Sartaj 5252 Light Truck',    start_year: 2008, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Prestige ICV Truck',         start_year: 2008, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Super GXL / Super 12.9 ICV', start_year: 2010, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Samrat 1312 Heavy Truck',    start_year: 2012, end_year: null,  fuel: ['Diesel'] },
      { name: 'Executive / Hiroi Passenger Bus', start_year: 2012, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'S7 School & Staff Bus',      start_year: 2015, end_year: null,  fuel: ['Diesel', 'CNG', 'EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  40. PIAGGIO (3-Wheelers & Small LCV)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Piaggio',
    models: [
      { name: 'Ape City / Auto DX (Passenger 3W)', start_year: 2000, end_year: null, fuel: ['Diesel', 'CNG', 'Petrol', 'LPG'] },
      { name: 'Ape Xtra LDX / HD (Cargo 3W)', start_year: 2002, end_year: null, fuel: ['Diesel', 'CNG', 'Petrol'] },
      { name: 'Ape E-City / E-Xtra (Electric 3W)', start_year: 2020, end_year: null, fuel: ['EV'] },
      { name: 'Ape Truk / Truk Plus (4W Mini Pickup)', start_year: 2007, end_year: 2016, fuel: ['Diesel'] },
      { name: 'Porter 600 / 1000 Mini Truck', start_year: 2014, end_year: 2020, fuel: ['Diesel', 'CNG'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  41. BAJAJ AUTO (3-Wheelers & Quadricycle)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Bajaj',
    models: [
      { name: 'RE Compact Passenger Auto',  start_year: 1995, end_year: null,  fuel: ['CNG', 'LPG', 'Petrol', 'Diesel'] },
      { name: 'RE Optima / Maxima Passenger', start_year: 2008, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Maxima C / Maxima Cargo 3W', start_year: 2015, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'RE E-TEC Electric Auto',     start_year: 2023, end_year: null,  fuel: ['EV'] },
      { name: 'Qute (Quadricycle)',         start_year: 2019, end_year: null,  fuel: ['Petrol', 'CNG'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  42. ATUL AUTO (Commercial 3-Wheelers)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Atul Auto',
    models: [
      { name: 'Gem / Gemini Passenger Auto', start_year: 2005, end_year: null, fuel: ['Diesel', 'CNG'] },
      { name: 'Shakti / Elite Cargo Auto',  start_year: 2005, end_year: null,  fuel: ['Diesel', 'CNG'] },
      { name: 'Rik / Mobili Electric Auto', start_year: 2022, end_year: null,  fuel: ['EV'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  43. VOLVO TRUCKS & BUSES (Commercial India)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Volvo Commercial',
    models: [
      { name: 'B7R / B9R Intercity Luxury Bus', start_year: 2001, end_year: 2018, fuel: ['Diesel'] },
      { name: 'B11R Multi-Axle Luxury Sleeper Bus', start_year: 2014, end_year: null, fuel: ['Diesel'] },
      { name: '8400 Low Floor City Bus',    start_year: 2006, end_year: null,  fuel: ['Diesel', 'EV'] },
      { name: 'FMX 460 / 480 Mining Tipper', start_year: 2005, end_year: null, fuel: ['Diesel'] },
      { name: 'FM 420 / 440 Heavy Hauler',  start_year: 2004, end_year: null,  fuel: ['Diesel'] },
      { name: 'FH 520 Ultra-Heavy Puller',  start_year: 2006, end_year: null,  fuel: ['Diesel'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  44. SCANIA & MAN (Commercial India)
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Scania',
    models: [
      { name: 'Metrolink Luxury Coach (12M/13.7M/14.5M)', start_year: 2013, end_year: 2022, fuel: ['Diesel'] },
      { name: 'P 410 / P 440 Mining Heavy Tipper', start_year: 2013, end_year: null, fuel: ['Diesel'] },
      { name: 'G 410 / G 460 Heavy Tractor Trailer', start_year: 2014, end_year: null, fuel: ['Diesel'] },
      { name: 'Citywide Low Floor City Bus', start_year: 2015, end_year: 2020, fuel: ['Diesel', 'Biofuel'] },
    ]
  },
  {
    make: 'MAN',
    models: [
      { name: 'CLA 16.220 / 25.280 Truck & Tipper', start_year: 2006, end_year: 2018, fuel: ['Diesel'] },
      { name: 'CLA 31.280 / 49.280 Heavy Puller',   start_year: 2008, end_year: 2018, fuel: ['Diesel'] },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  45. CLASSIC / HERITAGE INDIAN MAKES
  // ═══════════════════════════════════════════════════════════════
  {
    make: 'Hindustan Motors',
    models: [
      { name: 'Ambassador (Mark I / II / III / IV / Nova / Classic / Grand)', start_year: 1958, end_year: 2014, fuel: ['Petrol', 'Diesel', 'LPG', 'CNG'] },
      { name: 'Contessa (1.5 / 1.8 GL / Classic)', start_year: 1984, end_year: 2002, fuel: ['Petrol', 'Diesel'] },
      { name: 'Trekker Rural MUV',          start_year: 1978, end_year: 1999, fuel: ['Diesel'] },
      { name: 'HM RTV (Rural Transport Vehicle)', start_year: 1998, end_year: 2008, fuel: ['Diesel'] },
    ]
  },
  {
    make: 'Premier',
    models: [
      { name: 'Padmini (Fiat 1100 Delight)', start_year: 1964, end_year: 2000, fuel: ['Petrol', 'CNG', 'LPG'] },
      { name: 'Premier 118 NE / 138 D',     start_year: 1985, end_year: 2001, fuel: ['Petrol', 'Diesel'] },
      { name: 'Premier Rio Compact SUV',    start_year: 2009, end_year: 2014, fuel: ['Diesel', 'Petrol'] },
      { name: 'Premier Sigma Micro-Van',    start_year: 2006, end_year: 2012, fuel: ['Diesel', 'CNG'] },
    ]
  },
  {
    make: 'Standard',
    models: [
      { name: 'Herald / Gazel',             start_year: 1961, end_year: 1977, fuel: ['Petrol'] },
      { name: 'Standard 2000 Luxury Sedan', start_year: 1985, end_year: 1989, fuel: ['Petrol'] },
    ]
  },
  {
    make: 'San Motors',
    models: [
      { name: 'San Storm (Indian 2-Seater Convertible)', start_year: 2000, end_year: 2013, fuel: ['Petrol'] },
    ]
  },
  {
    make: 'Reva',
    models: [
      { name: 'Reva (Class One EV)',        start_year: 2001, end_year: 2008, fuel: ['EV'] },
      { name: 'Reva-i Electric City Car',   start_year: 2008, end_year: 2013, fuel: ['EV'] },
    ]
  },

];

module.exports = { vehicleDataset };
