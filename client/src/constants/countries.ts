import countries from "i18n-iso-countries";
import ruLocale from "i18n-iso-countries/langs/ru.json";

countries.registerLocale(ruLocale);

const russianCountryCollator = new Intl.Collator("ru");

export const countrySuggestions = Object.values(countries.getNames("ru")).sort(
  russianCountryCollator.compare,
);
