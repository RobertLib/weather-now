import { GeoLocation } from "@/types/weather";

/**
 * A curated index of large cities, matched locally as the user types.
 *
 * OpenWeather's geocoder needs an almost-complete name — "Reykjav", "New Yor"
 * and "Sprin" all return zero results — so partial input would otherwise look
 * like a dead end. These entries answer instantly and are merged with the API
 * results in the search box.
 *
 * Tuple order: name, country, latitude, longitude.
 */
type Entry = [string, string, number, number];

const CITIES: Entry[] = [
  // Europe
  ["Prague", "CZ", 50.0755, 14.4378],
  ["Brno", "CZ", 49.1951, 16.6068],
  ["Ostrava", "CZ", 49.8209, 18.2625],
  ["Bratislava", "SK", 48.1486, 17.1077],
  ["Vienna", "AT", 48.2082, 16.3738],
  ["Berlin", "DE", 52.52, 13.405],
  ["Munich", "DE", 48.1351, 11.582],
  ["Hamburg", "DE", 53.5511, 9.9937],
  ["Frankfurt", "DE", 50.1109, 8.6821],
  ["Cologne", "DE", 50.9375, 6.9603],
  ["Warsaw", "PL", 52.2297, 21.0122],
  ["Kraków", "PL", 50.0647, 19.945],
  ["Budapest", "HU", 47.4979, 19.0402],
  ["Bucharest", "RO", 44.4268, 26.1025],
  ["Sofia", "BG", 42.6977, 23.3219],
  ["Belgrade", "RS", 44.7866, 20.4489],
  ["Zagreb", "HR", 45.815, 15.9819],
  ["Ljubljana", "SI", 46.0569, 14.5058],
  ["Sarajevo", "BA", 43.8563, 18.4131],
  ["Skopje", "MK", 41.9981, 21.4254],
  ["Tirana", "AL", 41.3275, 19.8187],
  ["Athens", "GR", 37.9838, 23.7275],
  ["Thessaloniki", "GR", 40.6401, 22.9444],
  ["Istanbul", "TR", 41.0082, 28.9784],
  ["Ankara", "TR", 39.9334, 32.8597],
  ["Rome", "IT", 41.9028, 12.4964],
  ["Milan", "IT", 45.4642, 9.19],
  ["Naples", "IT", 40.8518, 14.2681],
  ["Venice", "IT", 45.4408, 12.3155],
  ["Florence", "IT", 43.7696, 11.2558],
  ["Madrid", "ES", 40.4168, -3.7038],
  ["Barcelona", "ES", 41.3874, 2.1686],
  ["Valencia", "ES", 39.4699, -0.3763],
  ["Seville", "ES", 37.3891, -5.9845],
  ["Bilbao", "ES", 43.263, -2.935],
  ["Palma", "ES", 39.5696, 2.6502],
  ["Lisbon", "PT", 38.7223, -9.1393],
  ["Porto", "PT", 41.1579, -8.6291],
  ["Paris", "FR", 48.8566, 2.3522],
  ["Lyon", "FR", 45.764, 4.8357],
  ["Marseille", "FR", 43.2965, 5.3698],
  ["Nice", "FR", 43.7102, 7.262],
  ["Toulouse", "FR", 43.6047, 1.4442],
  ["Bordeaux", "FR", 44.8378, -0.5792],
  ["Brussels", "BE", 50.8503, 4.3517],
  ["Antwerp", "BE", 51.2194, 4.4025],
  ["Amsterdam", "NL", 52.3676, 4.9041],
  ["Rotterdam", "NL", 51.9244, 4.4777],
  ["Luxembourg", "LU", 49.6116, 6.1319],
  ["Zurich", "CH", 47.3769, 8.5417],
  ["Geneva", "CH", 46.2044, 6.1432],
  ["Bern", "CH", 46.948, 7.4474],
  ["London", "GB", 51.5074, -0.1278],
  ["Manchester", "GB", 53.4808, -2.2426],
  ["Birmingham", "GB", 52.4862, -1.8904],
  ["Edinburgh", "GB", 55.9533, -3.1883],
  ["Glasgow", "GB", 55.8642, -4.2518],
  ["Liverpool", "GB", 53.4084, -2.9916],
  ["Bristol", "GB", 51.4545, -2.5879],
  ["Dublin", "IE", 53.3498, -6.2603],
  ["Copenhagen", "DK", 55.6761, 12.5683],
  ["Oslo", "NO", 59.9139, 10.7522],
  ["Bergen", "NO", 60.3913, 5.3221],
  ["Tromsø", "NO", 69.6492, 18.9553],
  ["Stockholm", "SE", 59.3293, 18.0686],
  ["Gothenburg", "SE", 57.7089, 11.9746],
  ["Helsinki", "FI", 60.1699, 24.9384],
  ["Tallinn", "EE", 59.437, 24.7536],
  ["Riga", "LV", 56.9496, 24.1052],
  ["Vilnius", "LT", 54.6872, 25.2797],
  ["Reykjavík", "IS", 64.1466, -21.9426],
  ["Kyiv", "UA", 50.4501, 30.5234],
  ["Lviv", "UA", 49.8397, 24.0297],
  ["Minsk", "BY", 53.9006, 27.559],
  ["Moscow", "RU", 55.7558, 37.6173],
  ["Saint Petersburg", "RU", 59.9311, 30.3609],
  ["Valletta", "MT", 35.8989, 14.5146],
  ["Nicosia", "CY", 35.1856, 33.3823],

  // Middle East & Africa
  ["Tel Aviv", "IL", 32.0853, 34.7818],
  ["Jerusalem", "IL", 31.7683, 35.2137],
  ["Beirut", "LB", 33.8938, 35.5018],
  ["Amman", "JO", 31.9454, 35.9284],
  ["Dubai", "AE", 25.2048, 55.2708],
  ["Abu Dhabi", "AE", 24.4539, 54.3773],
  ["Doha", "QA", 25.2854, 51.531],
  ["Riyadh", "SA", 24.7136, 46.6753],
  ["Jeddah", "SA", 21.4858, 39.1925],
  ["Kuwait City", "KW", 29.3759, 47.9774],
  ["Tehran", "IR", 35.6892, 51.389],
  ["Baghdad", "IQ", 33.3152, 44.3661],
  ["Cairo", "EG", 30.0444, 31.2357],
  ["Alexandria", "EG", 31.2001, 29.9187],
  ["Casablanca", "MA", 33.5731, -7.5898],
  ["Marrakesh", "MA", 31.6295, -7.9811],
  ["Tunis", "TN", 36.8065, 10.1815],
  ["Algiers", "DZ", 36.7538, 3.0588],
  ["Lagos", "NG", 6.5244, 3.3792],
  ["Abuja", "NG", 9.0765, 7.3986],
  ["Accra", "GH", 5.6037, -0.187],
  ["Dakar", "SN", 14.7167, -17.4677],
  ["Addis Ababa", "ET", 9.03, 38.74],
  ["Nairobi", "KE", -1.2921, 36.8219],
  ["Dar es Salaam", "TZ", -6.7924, 39.2083],
  ["Kampala", "UG", 0.3476, 32.5825],
  ["Kinshasa", "CD", -4.4419, 15.2663],
  ["Luanda", "AO", -8.839, 13.2894],
  ["Johannesburg", "ZA", -26.2041, 28.0473],
  ["Cape Town", "ZA", -33.9249, 18.4241],
  ["Durban", "ZA", -29.8587, 31.0218],
  ["Windhoek", "NA", -22.5609, 17.0658],
  ["Antananarivo", "MG", -18.8792, 47.5079],
  ["Port Louis", "MU", -20.1609, 57.5012],

  // Asia
  ["Tokyo", "JP", 35.6762, 139.6503],
  ["Osaka", "JP", 34.6937, 135.5023],
  ["Kyoto", "JP", 35.0116, 135.7681],
  ["Sapporo", "JP", 43.0618, 141.3545],
  ["Fukuoka", "JP", 33.5904, 130.4017],
  ["Seoul", "KR", 37.5665, 126.978],
  ["Busan", "KR", 35.1796, 129.0756],
  ["Beijing", "CN", 39.9042, 116.4074],
  ["Shanghai", "CN", 31.2304, 121.4737],
  ["Guangzhou", "CN", 23.1291, 113.2644],
  ["Shenzhen", "CN", 22.5431, 114.0579],
  ["Chengdu", "CN", 30.5728, 104.0668],
  ["Hong Kong", "HK", 22.3193, 114.1694],
  ["Taipei", "TW", 25.033, 121.5654],
  ["Macau", "MO", 22.1987, 113.5439],
  ["Ulaanbaatar", "MN", 47.8864, 106.9057],
  ["Singapore", "SG", 1.3521, 103.8198],
  ["Kuala Lumpur", "MY", 3.139, 101.6869],
  ["Bangkok", "TH", 13.7563, 100.5018],
  ["Chiang Mai", "TH", 18.7883, 98.9853],
  ["Phuket", "TH", 7.8804, 98.3923],
  ["Hanoi", "VN", 21.0278, 105.8342],
  ["Ho Chi Minh City", "VN", 10.8231, 106.6297],
  ["Phnom Penh", "KH", 11.5564, 104.9282],
  ["Vientiane", "LA", 17.9757, 102.6331],
  ["Yangon", "MM", 16.8661, 96.1951],
  ["Jakarta", "ID", -6.2088, 106.8456],
  ["Bali", "ID", -8.4095, 115.1889],
  ["Manila", "PH", 14.5995, 120.9842],
  ["Cebu", "PH", 10.3157, 123.8854],
  ["Mumbai", "IN", 19.076, 72.8777],
  ["Delhi", "IN", 28.7041, 77.1025],
  ["Bengaluru", "IN", 12.9716, 77.5946],
  ["Chennai", "IN", 13.0827, 80.2707],
  ["Kolkata", "IN", 22.5726, 88.3639],
  ["Hyderabad", "IN", 17.385, 78.4867],
  ["Jaipur", "IN", 26.9124, 75.7873],
  ["Goa", "IN", 15.2993, 74.124],
  ["Kathmandu", "NP", 27.7172, 85.324],
  ["Colombo", "LK", 6.9271, 79.8612],
  ["Dhaka", "BD", 23.8103, 90.4125],
  ["Karachi", "PK", 24.8607, 67.0011],
  ["Lahore", "PK", 31.5204, 74.3587],
  ["Islamabad", "PK", 33.6844, 73.0479],
  ["Kabul", "AF", 34.5553, 69.2075],
  ["Tashkent", "UZ", 41.2995, 69.2401],
  ["Almaty", "KZ", 43.222, 76.8512],
  ["Baku", "AZ", 40.4093, 49.8671],
  ["Tbilisi", "GE", 41.7151, 44.8271],
  ["Yerevan", "AM", 40.1792, 44.4991],

  // Oceania
  ["Sydney", "AU", -33.8688, 151.2093],
  ["Melbourne", "AU", -37.8136, 144.9631],
  ["Brisbane", "AU", -27.4698, 153.0251],
  ["Perth", "AU", -31.9505, 115.8605],
  ["Adelaide", "AU", -34.9285, 138.6007],
  ["Canberra", "AU", -35.2809, 149.13],
  ["Hobart", "AU", -42.8821, 147.3272],
  ["Cairns", "AU", -16.9186, 145.7781],
  ["Auckland", "NZ", -36.8485, 174.7633],
  ["Wellington", "NZ", -41.2866, 174.7756],
  ["Christchurch", "NZ", -43.5321, 172.6362],
  ["Queenstown", "NZ", -45.0312, 168.6626],
  ["Suva", "FJ", -18.1248, 178.4501],
  ["Honolulu", "US", 21.3069, -157.8583],

  // North America
  ["New York", "US", 40.7128, -74.006],
  ["Los Angeles", "US", 34.0522, -118.2437],
  ["Chicago", "US", 41.8781, -87.6298],
  ["Houston", "US", 29.7604, -95.3698],
  ["Phoenix", "US", 33.4484, -112.074],
  ["Philadelphia", "US", 39.9526, -75.1652],
  ["San Antonio", "US", 29.4241, -98.4936],
  ["San Diego", "US", 32.7157, -117.1611],
  ["Dallas", "US", 32.7767, -96.797],
  ["Austin", "US", 30.2672, -97.7431],
  ["San Francisco", "US", 37.7749, -122.4194],
  ["Seattle", "US", 47.6062, -122.3321],
  ["Denver", "US", 39.7392, -104.9903],
  ["Boston", "US", 42.3601, -71.0589],
  ["Miami", "US", 25.7617, -80.1918],
  ["Atlanta", "US", 33.749, -84.388],
  ["Las Vegas", "US", 36.1699, -115.1398],
  ["Portland", "US", 45.5152, -122.6784],
  ["Minneapolis", "US", 44.9778, -93.265],
  ["Detroit", "US", 42.3314, -83.0458],
  ["New Orleans", "US", 29.9511, -90.0715],
  ["Nashville", "US", 36.1627, -86.7816],
  ["Washington", "US", 38.9072, -77.0369],
  ["Anchorage", "US", 61.2181, -149.9003],
  ["Springfield", "US", 39.7817, -89.6501],
  ["Toronto", "CA", 43.6532, -79.3832],
  ["Montreal", "CA", 45.5019, -73.5674],
  ["Vancouver", "CA", 49.2827, -123.1207],
  ["Calgary", "CA", 51.0447, -114.0719],
  ["Ottawa", "CA", 45.4215, -75.6972],
  ["Quebec City", "CA", 46.8139, -71.208],
  ["Halifax", "CA", 44.6488, -63.5752],
  ["Mexico City", "MX", 19.4326, -99.1332],
  ["Guadalajara", "MX", 20.6597, -103.3496],
  ["Monterrey", "MX", 25.6866, -100.3161],
  ["Cancún", "MX", 21.1619, -86.8515],
  ["Havana", "CU", 23.1136, -82.3666],
  ["Panama City", "PA", 8.9824, -79.5199],
  ["San José", "CR", 9.9281, -84.0907],
  ["Guatemala City", "GT", 14.6349, -90.5069],
  ["Kingston", "JM", 17.9714, -76.7931],
  ["Santo Domingo", "DO", 18.4861, -69.9312],
  ["San Juan", "PR", 18.4655, -66.1057],

  // South America
  ["São Paulo", "BR", -23.5505, -46.6333],
  ["Rio de Janeiro", "BR", -22.9068, -43.1729],
  ["Brasília", "BR", -15.7939, -47.8828],
  ["Salvador", "BR", -12.9777, -38.5016],
  ["Buenos Aires", "AR", -34.6037, -58.3816],
  ["Córdoba", "AR", -31.4201, -64.1888],
  ["Santiago", "CL", -33.4489, -70.6693],
  ["Lima", "PE", -12.0464, -77.0428],
  ["Cusco", "PE", -13.5319, -71.9675],
  ["Bogotá", "CO", 4.711, -74.0721],
  ["Medellín", "CO", 6.2442, -75.5812],
  ["Cartagena", "CO", 10.391, -75.4794],
  ["Quito", "EC", -0.1807, -78.4678],
  ["Caracas", "VE", 10.4806, -66.9036],
  ["La Paz", "BO", -16.4897, -68.1193],
  ["Montevideo", "UY", -34.9011, -56.1645],
  ["Asunción", "PY", -25.2637, -57.5759],
];

/** Lower-cased, accent-stripped form used for matching. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const INDEX = CITIES.map(([name, country, lat, lon]) => ({
  location: { name, country, lat, lon } satisfies GeoLocation,
  search: normalize(name),
}));

/**
 * Prefix and word-boundary matches for `query`, best first.
 * Returns an empty array for queries shorter than two characters.
 */
export function matchCities(query: string, limit = 5): GeoLocation[] {
  const term = normalize(query);
  if (term.length < 2) return [];

  const scored: Array<{ location: GeoLocation; score: number }> = [];

  for (const { location, search } of INDEX) {
    let score = -1;
    if (search === term) score = 0;
    else if (search.startsWith(term)) score = 1;
    else if (search.split(" ").some((word) => word.startsWith(term))) score = 2;
    else if (search.includes(term)) score = 3;

    if (score >= 0) scored.push({ location, score });
  }

  return scored
    .sort(
      (a, b) =>
        a.score - b.score || a.location.name.length - b.location.name.length
    )
    .slice(0, limit)
    .map((entry) => entry.location);
}
