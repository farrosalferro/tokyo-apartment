// UI strings. Keys are used via data-i18n="key" in index.html and t("key") in app.js.
window.I18N = {
  en: {
    title: "Meguro Apartment Map",
    subtitle: "Rooms within a 20-minute walk or bike ride of both Meguro Central Square and Masjid Indonesia Tokyo",
    snapshot: "Snapshot from {date}. These rooms will be rented out long before April 2027. They show what is typical in each area; a fresh list follows in Feb–Mar 2027.",
    tab_list: "Rooms",
    tab_areas: "Areas",
    tab_guide: "How to read",
    view_map: "Map",
    view_list: "List",
    filters: "Filters",
    reset: "Reset",
    f_group: "Type of housing",
    g_standard: "Standard lease",
    g_foreigner: "Foreigner-friendly agency",
    g_furnished: "Furnished / low upfront",
    g_serviced: "Serviced apartment",
    f_layout: "Layout",
    f_max_monthly: "Max monthly (rent + fee)",
    any: "Any",
    f_min_size: "Min. size",
    f_bath: "Separate bath & toilet",
    f_foreigner: "Foreigners welcome",
    f_noguar: "No guarantor needed",
    f_walk: "Walkable to both (≤20 min)",
    sort: "Sort",
    s_commute: "Closest to both",
    s_monthly: "Monthly cost",
    s_upfront: "Move-in cost",
    s_size: "Largest",
    s_newest: "Newest building",
    results: "{n} rooms",
    results_of: "{n} of {total} rooms",
    none: "No rooms match these filters. Try removing one.",
    per_month: "/ month",
    incl_fee: "incl. ¥{fee} fee",
    no_fee: "no extra fee",
    walk: "walk",
    bike: "bike",
    min: "min",
    office: "Office",
    mosque: "Mosque",
    built: "Built {y}",
    floor: "{f}F",
    floor_of: "{f}F of {n}",
    approx: "Approximate location (area only)",
    approx_short: "≈ location",
    bath_sep: "Bath & toilet separate",
    unit_bath: "Unit bath",
    autolock: "Auto-lock",
    furnished: "Furnished",
    fr_agency: "English-speaking agency",
    fr_yes: "Foreigners OK",
    no_guar: "No guarantor",
    tier_walk: "Walk tier",
    tier_bike: "Bike tier",
    movein: "Move-in cost ≈",
    movein_items: "Breakdown",
    estimated: "estimate",
    i_deposit: "Deposit (shikikin)",
    i_key_money: "Key money (reikin)",
    i_agency_fee: "Agency fee (incl. tax)",
    i_guarantor: "Guarantor company",
    i_first_month: "First month rent + fee",
    i_fire_insurance: "Fire insurance",
    i_lock_change: "Lock change",
    nearby: "Nearby",
    supermarket: "Supermarket",
    konbini: "Konbini",
    halal: "Halal",
    view_listing: "View listing",
    gmaps: "Google Maps",
    route_office: "Walk route to office",
    route_mosque: "Walk route to mosque",
    source: "Source",
    fetched: "seen {d}",
    show_on_map: "Show on map",
    layers: "Map layers",
    l_zone_walk: "Walk zone (both ≤20 min)",
    l_zone_bike: "Bike zone (both ≤20 min)",
    l_listings: "Rooms",
    c_halal_food: "Halal food",
    c_halal_grocery: "Halal groceries",
    c_mosque: "Mosques & prayer rooms",
    c_community: "Indonesian community",
    c_supermarket: "Supermarkets",
    c_convenience: "Convenience stores",
    c_service: "Ward offices & services",
    c_clinic: "Clinics & hospitals",
    c_daily: "Post, bank, gym, laundry, drugstore",
    c_park: "Parks",
    area_rooms: "{n} rooms in this snapshot",
    area_median: "Median monthly",
    area_range: "Range",
    pros: "Good",
    cons: "Watch out",
    no_area_rooms: "No rooms from this area in the snapshot.",
    lang: "Bahasa Indonesia",
    base_street: "Street map",
    base_light: "Clean map",
    open: "Open",
    hours: "Hours",
    guide_html: `
      <h3>What this map shows</h3>
      <p>Two fixed places: the office at <b>Meguro Central Square</b> (next to JR Meguro Station) and <b>Masjid Indonesia Tokyo</b>. They are about 1.1 km apart. The shaded areas are where both places are within 20 minutes:</p>
      <ul>
        <li><b>Walk zone</b> (dark outline): both within about a 20-minute walk.</li>
        <li><b>Bike zone</b> (light fill): both within about a 20-minute bicycle ride.</li>
      </ul>
      <p>Walking times use the Japanese real-estate rule of <b>80 m per minute</b> on a straight line stretched by 30% for streets, so they are estimates. Each room has "Walk route" links that open the real route in Google Maps.</p>
      <h3>Price tags on the map</h3>
      <p>Each tag is one room and shows the monthly total (rent + management fee) in thousands of yen, so <b>¥98k</b> = ¥98,000 per month. The colour shows the type of housing. A dashed tag means the listing only gives the neighbourhood, not the exact building.</p>
      <h3>Moving-in costs in Japan</h3>
      <p>Renting in Tokyo usually needs 4–6 months of rent in cash at signing. The "Move-in cost" on each room adds these up; items marked <i>estimate</i> were not stated by the listing and use typical values.</p>
      <dl class="gloss">
        <dt>敷金 shikikin</dt><dd>Deposit, mostly returned when you move out (minus cleaning and repairs).</dd>
        <dt>礼金 reikin</dt><dd>Key money: a non-refundable "thank you" payment to the landlord, often 0–2 months.</dd>
        <dt>仲介手数料</dt><dd>Agency fee, up to 1 month of rent + tax.</dd>
        <dt>保証会社</dt><dd>Guarantor company. Most landlords require one; it costs about 50% of one month in the first year. Foreigners without a Japanese guarantor almost always use one.</dd>
        <dt>管理費 / 共益費</dt><dd>Monthly management fee, paid with the rent.</dd>
        <dt>1R / 1K / 1DK</dt><dd>1R: one room with the kitchen inside it. 1K: room + separate small kitchen. 1DK: room + dining-kitchen. Typical sizes 15–30 m².</dd>
        <dt>バス・トイレ別</dt><dd>Bath and toilet in separate rooms (more comfortable than a "unit bath").</dd>
      </dl>
      <h3>Types of housing</h3>
      <ul>
        <li><b>Standard lease</b>: Japanese portals (SUUMO, HOME'S). Cheapest rent, but Japanese paperwork and the highest move-in cost.</li>
        <li><b>Foreigner-friendly agency</b>: English-speaking agencies listing standard apartments whose landlords accept foreigners.</li>
        <li><b>Furnished / low upfront</b>: Oakhouse, Sakura House, UR, Village House, monthly apartments. Little or no key money, often no guarantor. Easier for the first months in Japan.</li>
        <li><b>Serviced apartment</b>: hotel-like furnished apartments; the most expensive, everything included.</li>
      </ul>
      <h3>Where the data comes from</h3>
      <p>Listings were collected from the public websites named on each room. Shops, parks and services come from OpenStreetMap, plus a hand-checked list of halal places. Map data © OpenStreetMap contributors.</p>`,
  },
  id: {
    title: "Peta Apartemen Meguro",
    subtitle: "Kamar dalam jarak 20 menit jalan kaki atau sepeda dari Meguro Central Square dan Masjid Indonesia Tokyo",
    snapshot: "Data per {date}. Kamar-kamar ini akan sudah tersewa jauh sebelum April 2027. Gunanya untuk melihat harga dan kondisi umum tiap area; daftar baru menyusul Feb–Mar 2027.",
    tab_list: "Kamar",
    tab_areas: "Area",
    tab_guide: "Cara membaca",
    view_map: "Peta",
    view_list: "Daftar",
    filters: "Filter",
    reset: "Atur ulang",
    f_group: "Jenis hunian",
    g_standard: "Sewa biasa",
    g_foreigner: "Agen ramah orang asing",
    g_furnished: "Berperabot / biaya awal rendah",
    g_serviced: "Serviced apartment",
    f_layout: "Tipe kamar",
    f_max_monthly: "Maks. per bulan (sewa + biaya)",
    any: "Semua",
    f_min_size: "Luas min.",
    f_bath: "Kamar mandi & toilet terpisah",
    f_foreigner: "Menerima orang asing",
    f_noguar: "Tanpa penjamin",
    f_walk: "Bisa jalan kaki ke keduanya (≤20 mnt)",
    sort: "Urutkan",
    s_commute: "Terdekat ke keduanya",
    s_monthly: "Biaya bulanan",
    s_upfront: "Biaya masuk",
    s_size: "Terluas",
    s_newest: "Bangunan terbaru",
    results: "{n} kamar",
    results_of: "{n} dari {total} kamar",
    none: "Tidak ada kamar yang cocok. Coba hapus salah satu filter.",
    per_month: "/ bulan",
    incl_fee: "termasuk biaya ¥{fee}",
    no_fee: "tanpa biaya tambahan",
    walk: "jalan",
    bike: "sepeda",
    min: "mnt",
    office: "Kantor",
    mosque: "Masjid",
    built: "Dibangun {y}",
    floor: "Lt. {f}",
    floor_of: "Lt. {f} dari {n}",
    approx: "Lokasi perkiraan (hanya area)",
    approx_short: "≈ lokasi",
    bath_sep: "KM & toilet terpisah",
    unit_bath: "Unit bath (KM+toilet jadi satu)",
    autolock: "Pintu auto-lock",
    furnished: "Berperabot",
    fr_agency: "Agen berbahasa Inggris",
    fr_yes: "Orang asing OK",
    no_guar: "Tanpa penjamin",
    tier_walk: "Zona jalan kaki",
    tier_bike: "Zona sepeda",
    movein: "Biaya masuk ≈",
    movein_items: "Rincian",
    estimated: "perkiraan",
    i_deposit: "Deposit (shikikin)",
    i_key_money: "Uang kunci (reikin)",
    i_agency_fee: "Biaya agen (termasuk pajak)",
    i_guarantor: "Perusahaan penjamin",
    i_first_month: "Sewa + biaya bulan pertama",
    i_fire_insurance: "Asuransi kebakaran",
    i_lock_change: "Ganti kunci",
    nearby: "Terdekat",
    supermarket: "Supermarket",
    konbini: "Minimarket",
    halal: "Halal",
    view_listing: "Lihat iklan",
    gmaps: "Google Maps",
    route_office: "Rute jalan ke kantor",
    route_mosque: "Rute jalan ke masjid",
    source: "Sumber",
    fetched: "dilihat {d}",
    show_on_map: "Lihat di peta",
    layers: "Lapisan peta",
    l_zone_walk: "Zona jalan kaki (keduanya ≤20 mnt)",
    l_zone_bike: "Zona sepeda (keduanya ≤20 mnt)",
    l_listings: "Kamar",
    c_halal_food: "Makanan halal",
    c_halal_grocery: "Toko bahan halal",
    c_mosque: "Masjid & musala",
    c_community: "Komunitas Indonesia",
    c_supermarket: "Supermarket",
    c_convenience: "Minimarket (konbini)",
    c_service: "Kantor kelurahan & layanan",
    c_clinic: "Klinik & rumah sakit",
    c_daily: "Pos, bank, gym, laundry, apotek",
    c_park: "Taman",
    area_rooms: "{n} kamar di data ini",
    area_median: "Median per bulan",
    area_range: "Rentang",
    pros: "Kelebihan",
    cons: "Perlu diperhatikan",
    no_area_rooms: "Belum ada kamar dari area ini di data.",
    lang: "English",
    base_street: "Peta jalan",
    base_light: "Peta polos",
    open: "Buka",
    hours: "Jam buka",
    guide_html: `
      <h3>Apa isi peta ini</h3>
      <p>Dua tempat tetap: kantor di <b>Meguro Central Square</b> (di sebelah Stasiun JR Meguro) dan <b>Masjid Indonesia Tokyo</b>. Jaraknya sekitar 1,1 km. Area berwarna adalah tempat yang jaraknya ke kedua lokasi itu paling lama 20 menit:</p>
      <ul>
        <li><b>Zona jalan kaki</b> (garis tebal): keduanya sekitar ≤20 menit jalan kaki.</li>
        <li><b>Zona sepeda</b> (warna muda): keduanya sekitar ≤20 menit naik sepeda.</li>
      </ul>
      <p>Waktu jalan kaki memakai aturan properti Jepang <b>80 m per menit</b>, dari jarak garis lurus ditambah 30% untuk belokan jalan, jadi ini perkiraan. Setiap kamar punya tautan "Rute jalan" yang membuka rute sebenarnya di Google Maps.</p>
      <h3>Label harga di peta</h3>
      <p>Setiap label adalah satu kamar dan menunjukkan total per bulan (sewa + biaya pengelolaan) dalam ribuan yen. Jadi <b>¥98k</b> = ¥98.000 per bulan. Warna menunjukkan jenis hunian. Label bergaris putus-putus berarti iklan hanya menyebut nama lingkungan, bukan gedung yang persis.</p>
      <h3>Biaya masuk di Jepang</h3>
      <p>Menyewa di Tokyo biasanya perlu uang tunai 4–6 bulan sewa saat tanda tangan kontrak. "Biaya masuk" di tiap kamar menjumlahkannya; item bertanda <i>perkiraan</i> tidak disebut di iklan dan memakai angka umum.</p>
      <dl class="gloss">
        <dt>敷金 shikikin</dt><dd>Deposit, sebagian besar dikembalikan saat pindah (dikurangi biaya bersih-bersih dan perbaikan).</dd>
        <dt>礼金 reikin</dt><dd>Uang kunci: pembayaran "terima kasih" ke pemilik yang tidak kembali, biasanya 0–2 bulan.</dd>
        <dt>仲介手数料</dt><dd>Biaya agen, maksimal 1 bulan sewa + pajak.</dd>
        <dt>保証会社</dt><dd>Perusahaan penjamin. Hampir semua pemilik mewajibkannya; biayanya sekitar 50% sewa sebulan di tahun pertama. Orang asing tanpa penjamin di Jepang hampir selalu memakainya.</dd>
        <dt>管理費 / 共益費</dt><dd>Biaya pengelolaan bulanan, dibayar bersama sewa.</dd>
        <dt>1R / 1K / 1DK</dt><dd>1R: satu ruangan dengan dapur di dalamnya. 1K: kamar + dapur kecil terpisah. 1DK: kamar + ruang makan-dapur. Luas umumnya 15–30 m².</dd>
        <dt>バス・トイレ別</dt><dd>Kamar mandi dan toilet di ruangan terpisah (lebih nyaman daripada "unit bath").</dd>
      </dl>
      <h3>Jenis hunian</h3>
      <ul>
        <li><b>Sewa biasa</b>: portal Jepang (SUUMO, HOME'S). Sewa termurah, tapi dokumen berbahasa Jepang dan biaya masuk paling tinggi.</li>
        <li><b>Agen ramah orang asing</b>: agen berbahasa Inggris dengan apartemen biasa yang pemiliknya menerima orang asing.</li>
        <li><b>Berperabot / biaya awal rendah</b>: Oakhouse, Sakura House, UR, Village House, apartemen bulanan. Sedikit atau tanpa uang kunci, sering tanpa penjamin. Lebih mudah untuk bulan-bulan pertama di Jepang.</li>
        <li><b>Serviced apartment</b>: apartemen berperabot seperti hotel; paling mahal, semua sudah termasuk.</li>
      </ul>
      <h3>Sumber data</h3>
      <p>Iklan dikumpulkan dari situs publik yang disebut di tiap kamar. Toko, taman, dan layanan dari OpenStreetMap, ditambah daftar tempat halal yang diperiksa manual. Data peta © kontributor OpenStreetMap.</p>`,
  },
};
