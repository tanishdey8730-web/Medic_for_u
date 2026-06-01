/**
 * Real medicine product photos from Wikimedia Commons (free license).
 * Uses Special:FilePath for stable CDN-style URLs.
 */
function wikiPhoto(filename, width = 420) {
  const file = encodeURIComponent(filename.replace(/ /g, "_"));
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=${width}`;
}

const REAL_MED_IMAGES = {
  paracetamol: wikiPhoto("Paracetamol500mgTablets.jpg"),
  ibuprofen: wikiPhoto("Ibuprofen_200_mg_tablets.jpg"),
  aspirin: wikiPhoto("Aspirin_tablets.jpg"),
  naproxen: wikiPhoto("Naproxen.jpg"),
  diclofenac: wikiPhoto("Diclofenac_pills.jpg"),
  amoxicillin: wikiPhoto("Amoxicillin.jpg"),
  azithromycin: wikiPhoto("Azithromycin(brand_name_Zithromax).jpg"),
  cetirizine: wikiPhoto("Cetirizine_10_mg_tablets.jpg"),
  loratadine: wikiPhoto("Claritin_tablets.jpg"),
  omeprazole: wikiPhoto("Omeprazole_10mg_capsules.jpg"),
  ors: wikiPhoto("Oral_rehydration_solution.jpg"),
  salbutamol: wikiPhoto("Salbutamol_inhaler.jpg"),
  metformin: wikiPhoto("Metformin_500mg_Tablets.jpg"),
  diphenhydramine: wikiPhoto("Diphenhydramine_tablets.jpg"),
  dextromethorphan: wikiPhoto("Dextromethorphan_Cough_Syrup.jpg"),
  ascorbic_acid: wikiPhoto("Vitamin_C_tablets.jpg"),
  default: wikiPhoto("Tablets.jpg"),
};

/** SVG fallback served locally if photo fails */
function medicineImagePath(id) {
  const safe = String(id || "default").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return `/assets/medicines/${safe || "default"}.svg`;
}

function getMedicineImage(id) {
  return REAL_MED_IMAGES[id] || REAL_MED_IMAGES.default;
}

module.exports = {
  wikiPhoto,
  REAL_MED_IMAGES,
  medicineImagePath,
  getMedicineImage,
};
