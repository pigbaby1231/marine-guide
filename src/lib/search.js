import Fuse from "fuse.js";
import { species } from "./data.js";

const fuse = new Fuse(species, {
  keys: [
    { name: "commonName", weight: 2 },
    { name: "scientificName", weight: 1.5 },
    { name: "taxonomy.family", weight: 0.5 },
    { name: "taxonomy.genus", weight: 0.8 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
});

export function searchSpecies(query, limit = 60) {
  return fuse.search(query, { limit }).map((r) => r.item);
}
