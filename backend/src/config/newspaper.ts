import type {
  NewspaperConfig,
} from "../types/newspaper.js";

export const NEWSPAPER: NewspaperConfig = {

  name: "NewsGarden Daily",

  tagline: "Grown fresh every morning.",

  sections: [
    "technology",
    "science",
    "culture",
    "history",
    "nature",
  ],

  articlesPerEdition: 15,
};
