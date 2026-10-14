import type { CatalogProduct, GroceryCategory } from "@/types/groceries";

/**
 * Starter catalog of common Pakistani household groceries.
 *
 * This is a curated starting point, not an exhaustive list of every product in
 * every Pakistani market. `sampleUnitPrice` values are rough illustrative
 * figures for demonstration only — they are NOT live market prices and the UI
 * always labels them as sample estimates. Users can enter their own prices.
 */

export const GROCERY_CATEGORIES: GroceryCategory[] = [
  { id: "grains", name: "Flour & Grains", nameUr: "آٹا اور اناج" },
  { id: "pulses", name: "Pulses", nameUr: "دالیں" },
  { id: "essentials", name: "Cooking Essentials", nameUr: "کھانا پکانے کا سامان" },
  { id: "vegetables", name: "Vegetables", nameUr: "سبزیاں" },
  { id: "fruits", name: "Fruits", nameUr: "پھل" },
  { id: "dairy", name: "Dairy", nameUr: "دودھ اور ڈیری" },
  { id: "meat", name: "Meat & Protein", nameUr: "گوشت اور پروٹین" },
  { id: "bakery", name: "Bread & Bakery", nameUr: "روٹی اور بیکری" },
  { id: "beverages", name: "Tea & Beverages", nameUr: "چائے اور مشروبات" },
  { id: "household", name: "Household", nameUr: "گھریلو سامان" },
  { id: "personal", name: "Personal Care", nameUr: "ذاتی نگہداشت" },
  { id: "baby", name: "Baby & Family", nameUr: "بچوں کا سامان" },
  { id: "snacks", name: "Snacks & Pantry", nameUr: "اسنیکس اور پینٹری" },
  { id: "frozen", name: "Frozen & Convenience", nameUr: "فروزن فوڈ" },
  { id: "other", name: "Other", nameUr: "دیگر" },
];

export const GROCERY_CATALOG: CatalogProduct[] = [
  // Flour and grains
  { id: "atta", name: "Atta (wheat flour)", nameUr: "آٹا", category: "grains", unit: "kg", pack: "10 kg bag", sampleUnitPrice: 120, wiki: "Atta flour" },
  { id: "maida", name: "Maida", nameUr: "میدہ", category: "grains", unit: "kg", sampleUnitPrice: 140, wiki: "Maida flour" },
  { id: "suji", name: "Suji (semolina)", nameUr: "سوجی", category: "grains", unit: "kg", sampleUnitPrice: 180, wiki: "Semolina" },
  { id: "basmati", name: "Basmati rice", nameUr: "باسمتی چاول", category: "grains", unit: "kg", sampleUnitPrice: 380, wiki: "Basmati" },
  { id: "sela-rice", name: "Sela rice", nameUr: "سیلا چاول", category: "grains", unit: "kg", sampleUnitPrice: 340, wiki: "Parboiled rice" },
  { id: "broken-rice", name: "Broken rice (tota)", nameUr: "ٹوٹا چاول", category: "grains", unit: "kg", sampleUnitPrice: 220, wiki: "Broken rice" },
  { id: "besan", name: "Besan (gram flour)", nameUr: "بیسن", category: "grains", unit: "kg", sampleUnitPrice: 300, wiki: "Gram flour" },
  { id: "daliya", name: "Daliya (cracked wheat)", nameUr: "دلیہ", category: "grains", unit: "kg", sampleUnitPrice: 200, wiki: "Bulgur" },

  // Pulses
  { id: "masoor", name: "Masoor daal", nameUr: "مسور کی دال", category: "pulses", unit: "kg", sampleUnitPrice: 320, wiki: "Lentil" },
  { id: "moong", name: "Moong daal", nameUr: "مونگ کی دال", category: "pulses", unit: "kg", sampleUnitPrice: 360, wiki: "Mung bean" },
  { id: "mash", name: "Mash daal", nameUr: "ماش کی دال", category: "pulses", unit: "kg", sampleUnitPrice: 480, wiki: "Vigna mungo" },
  { id: "chana-daal", name: "Chana daal", nameUr: "چنے کی دال", category: "pulses", unit: "kg", sampleUnitPrice: 300, wiki: "Chana dal" },
  { id: "kabuli-chana", name: "Whole chickpeas (kabuli chana)", nameUr: "سفید چنے", category: "pulses", unit: "kg", sampleUnitPrice: 380, wiki: "Chickpea" },
  { id: "kala-chana", name: "Black chickpeas (kala chana)", nameUr: "کالے چنے", category: "pulses", unit: "kg", sampleUnitPrice: 300, wiki: "Kala chana" },
  { id: "lobia", name: "Red kidney beans (lobia)", nameUr: "لوبیا", category: "pulses", unit: "kg", sampleUnitPrice: 420, wiki: "Kidney bean" },

  // Cooking essentials
  { id: "cooking-oil", name: "Cooking oil", nameUr: "کوکنگ آئل", category: "essentials", unit: "litre", pack: "1 L pouch / 5 L tin", sampleUnitPrice: 520, wiki: "Vegetable oil" },
  { id: "ghee", name: "Banaspati / desi ghee", nameUr: "گھی", category: "essentials", unit: "kg", sampleUnitPrice: 560, wiki: "Ghee" },
  { id: "salt", name: "Salt", nameUr: "نمک", category: "essentials", unit: "packet", pack: "800 g", sampleUnitPrice: 60, wiki: "Himalayan salt" },
  { id: "sugar", name: "Sugar", nameUr: "چینی", category: "essentials", unit: "kg", sampleUnitPrice: 160, wiki: "Sugar" },
  { id: "gur", name: "Gur (jaggery)", nameUr: "گڑ", category: "essentials", unit: "kg", sampleUnitPrice: 260, wiki: "Jaggery" },
  { id: "red-chilli", name: "Red chilli powder", nameUr: "لال مرچ", category: "essentials", unit: "g", pack: "200 g", wiki: "Chili powder" },
  { id: "haldi", name: "Haldi (turmeric)", nameUr: "ہلدی", category: "essentials", unit: "g", pack: "200 g", wiki: "Turmeric" },
  { id: "dhania-powder", name: "Dhania powder (coriander)", nameUr: "دھنیا پاؤڈر", category: "essentials", unit: "g", pack: "200 g", wiki: "Coriander" },
  { id: "zeera", name: "Zeera (cumin)", nameUr: "زیرہ", category: "essentials", unit: "g", pack: "100 g", wiki: "Cumin" },
  { id: "garam-masala", name: "Garam masala", nameUr: "گرم مصالحہ", category: "essentials", unit: "packet", wiki: "Garam masala" },
  { id: "black-pepper", name: "Kali mirch (black pepper)", nameUr: "کالی مرچ", category: "essentials", unit: "g", pack: "100 g", wiki: "Black pepper" },
  { id: "elaichi", name: "Elaichi (cardamom)", nameUr: "الائچی", category: "essentials", unit: "g", pack: "50 g", wiki: "Cardamom" },
  { id: "vinegar", name: "Vinegar", nameUr: "سرکہ", category: "essentials", unit: "bottle", wiki: "Vinegar" },

  // Vegetables
  { id: "onion", name: "Onion", nameUr: "پیاز", category: "vegetables", unit: "kg", sampleUnitPrice: 120, wiki: "Onion" },
  { id: "tomato", name: "Tomato", nameUr: "ٹماٹر", category: "vegetables", unit: "kg", sampleUnitPrice: 150, wiki: "Tomato" },
  { id: "potato", name: "Potato", nameUr: "آلو", category: "vegetables", unit: "kg", sampleUnitPrice: 90, wiki: "Potato" },
  { id: "garlic", name: "Garlic", nameUr: "لہسن", category: "vegetables", unit: "pao", sampleUnitPrice: 150, wiki: "Garlic" },
  { id: "ginger", name: "Ginger", nameUr: "ادرک", category: "vegetables", unit: "pao", sampleUnitPrice: 180, wiki: "Ginger" },
  { id: "green-chilli", name: "Green chilli", nameUr: "ہری مرچ", category: "vegetables", unit: "pao", sampleUnitPrice: 60, wiki: "Chili pepper" },
  { id: "coriander", name: "Fresh coriander (dhania)", nameUr: "ہرا دھنیا", category: "vegetables", unit: "bunch", sampleUnitPrice: 30, wiki: "Coriander" },
  { id: "mint", name: "Fresh mint (podina)", nameUr: "پودینہ", category: "vegetables", unit: "bunch", sampleUnitPrice: 30, wiki: "Mentha" },
  { id: "spinach", name: "Spinach (palak)", nameUr: "پالک", category: "vegetables", unit: "bunch", sampleUnitPrice: 60, wiki: "Spinach" },
  { id: "okra", name: "Okra (bhindi)", nameUr: "بھنڈی", category: "vegetables", unit: "kg", sampleUnitPrice: 240, wiki: "Okra" },
  { id: "aubergine", name: "Aubergine (baingan)", nameUr: "بینگن", category: "vegetables", unit: "kg", sampleUnitPrice: 140, wiki: "Eggplant" },
  { id: "cauliflower", name: "Cauliflower (gobhi)", nameUr: "پھول گوبھی", category: "vegetables", unit: "piece", sampleUnitPrice: 120, wiki: "Cauliflower" },
  { id: "cabbage", name: "Cabbage (band gobhi)", nameUr: "بند گوبھی", category: "vegetables", unit: "piece", sampleUnitPrice: 100, wiki: "Cabbage" },
  { id: "carrot", name: "Carrot (gajar)", nameUr: "گاجر", category: "vegetables", unit: "kg", sampleUnitPrice: 100, wiki: "Carrot" },
  { id: "peas", name: "Peas (matar)", nameUr: "مٹر", category: "vegetables", unit: "kg", sampleUnitPrice: 250, wiki: "Pea" },
  { id: "lemon", name: "Lemon (nimbu)", nameUr: "لیموں", category: "vegetables", unit: "pao", sampleUnitPrice: 80, wiki: "Lemon" },
  { id: "bottle-gourd", name: "Bottle gourd (lauki)", nameUr: "لوکی", category: "vegetables", unit: "kg", sampleUnitPrice: 100, wiki: "Calabash" },
  { id: "bitter-gourd", name: "Bitter gourd (karela)", nameUr: "کریلا", category: "vegetables", unit: "kg", sampleUnitPrice: 160, wiki: "Momordica charantia" },
  { id: "turnip", name: "Turnip (shaljam)", nameUr: "شلجم", category: "vegetables", unit: "kg", sampleUnitPrice: 80, wiki: "Turnip" },
  { id: "cucumber", name: "Cucumber (kheera)", nameUr: "کھیرا", category: "vegetables", unit: "kg", sampleUnitPrice: 100, wiki: "Cucumber" },
  { id: "capsicum", name: "Capsicum (shimla mirch)", nameUr: "شملہ مرچ", category: "vegetables", unit: "kg", sampleUnitPrice: 260, wiki: "Bell pepper" },

  // Fruits
  { id: "banana", name: "Banana (kela)", nameUr: "کیلا", category: "fruits", unit: "dozen", sampleUnitPrice: 180, wiki: "Banana" },
  { id: "apple", name: "Apple (saib)", nameUr: "سیب", category: "fruits", unit: "kg", sampleUnitPrice: 300, wiki: "Apple" },
  { id: "kinnow", name: "Kinnow", nameUr: "کینو", category: "fruits", unit: "dozen", sampleUnitPrice: 300, wiki: "Kinnow" },
  { id: "mango", name: "Mango (aam)", nameUr: "آم", category: "fruits", unit: "kg", sampleUnitPrice: 250, wiki: "Mango" },
  { id: "guava", name: "Guava (amrood)", nameUr: "امرود", category: "fruits", unit: "kg", sampleUnitPrice: 180, wiki: "Guava" },
  { id: "pomegranate", name: "Pomegranate (anar)", nameUr: "انار", category: "fruits", unit: "kg", sampleUnitPrice: 400, wiki: "Pomegranate" },
  { id: "grapes", name: "Grapes (angoor)", nameUr: "انگور", category: "fruits", unit: "kg", sampleUnitPrice: 350, wiki: "Grape" },
  { id: "dates", name: "Dates (khajoor)", nameUr: "کھجور", category: "fruits", unit: "kg", sampleUnitPrice: 800, wiki: "Date palm" },
  { id: "melon", name: "Melon (kharbooza)", nameUr: "خربوزہ", category: "fruits", unit: "kg", sampleUnitPrice: 120, wiki: "Muskmelon" },
  { id: "watermelon", name: "Watermelon (tarbooz)", nameUr: "تربوز", category: "fruits", unit: "kg", sampleUnitPrice: 80, wiki: "Watermelon" },
  { id: "papaya", name: "Papaya (papita)", nameUr: "پپیتا", category: "fruits", unit: "kg", sampleUnitPrice: 220, wiki: "Papaya" },

  // Dairy
  { id: "milk", name: "Milk", nameUr: "دودھ", category: "dairy", unit: "litre", sampleUnitPrice: 220, wiki: "Milk" },
  { id: "yogurt", name: "Yogurt (dahi)", nameUr: "دہی", category: "dairy", unit: "kg", sampleUnitPrice: 240, wiki: "Dahi (curd)" },
  { id: "butter", name: "Butter (makhan)", nameUr: "مکھن", category: "dairy", unit: "packet", pack: "200 g", sampleUnitPrice: 400, wiki: "Butter" },
  { id: "cream", name: "Cream (malai)", nameUr: "ملائی", category: "dairy", unit: "packet", pack: "200 ml", wiki: "Cream" },
  { id: "cheese", name: "Cheese", nameUr: "پنیر", category: "dairy", unit: "packet", pack: "200 g", wiki: "Cheese" },
  { id: "lassi", name: "Lassi", nameUr: "لسی", category: "dairy", unit: "litre", wiki: "Lassi" },

  // Meat and protein
  { id: "chicken", name: "Chicken", nameUr: "مرغی", category: "meat", unit: "kg", sampleUnitPrice: 650, wiki: "Chicken as food" },
  { id: "beef", name: "Beef", nameUr: "گائے کا گوشت", category: "meat", unit: "kg", sampleUnitPrice: 1300, wiki: "Beef" },
  { id: "mutton", name: "Mutton", nameUr: "بکرے کا گوشت", category: "meat", unit: "kg", sampleUnitPrice: 2400, wiki: "Goat meat" },
  { id: "fish", name: "Fish", nameUr: "مچھلی", category: "meat", unit: "kg", sampleUnitPrice: 900, wiki: "Fish as food" },
  { id: "eggs", name: "Eggs", nameUr: "انڈے", category: "meat", unit: "dozen", sampleUnitPrice: 330, wiki: "Egg as food" },
  { id: "qeema", name: "Qeema (minced meat)", nameUr: "قیمہ", category: "meat", unit: "kg", sampleUnitPrice: 1400, wiki: "Ground meat" },

  // Bread and bakery
  { id: "roti", name: "Roti / chapati", nameUr: "روٹی", category: "bakery", unit: "piece", sampleUnitPrice: 25, wiki: "Chapati" },
  { id: "naan", name: "Naan", nameUr: "نان", category: "bakery", unit: "piece", sampleUnitPrice: 35, wiki: "Naan" },
  { id: "bread", name: "Bread (double roti)", nameUr: "ڈبل روٹی", category: "bakery", unit: "packet", sampleUnitPrice: 200, wiki: "White bread" },
  { id: "rusk", name: "Rusks", nameUr: "رس", category: "bakery", unit: "packet", wiki: "Rusk" },
  { id: "bun", name: "Buns", nameUr: "بن", category: "bakery", unit: "packet", wiki: "Bun" },
  { id: "paratha", name: "Paratha", nameUr: "پراٹھا", category: "bakery", unit: "piece", wiki: "Paratha" },

  // Tea and beverages
  { id: "tea", name: "Tea leaves (patti)", nameUr: "چائے کی پتی", category: "beverages", unit: "packet", pack: "950 g", wiki: "Black tea" },
  { id: "green-tea", name: "Green tea (sabz chai)", nameUr: "سبز چائے", category: "beverages", unit: "box", wiki: "Green tea" },
  { id: "coffee", name: "Coffee", nameUr: "کافی", category: "beverages", unit: "box", wiki: "Instant coffee" },
  { id: "water", name: "Bottled water", nameUr: "منرل واٹر", category: "beverages", unit: "bottle", pack: "1.5 L", wiki: "Bottled water" },
  { id: "juice", name: "Juice", nameUr: "جوس", category: "beverages", unit: "litre", wiki: "Juice" },
  { id: "sharbat", name: "Sharbat syrup", nameUr: "شربت", category: "beverages", unit: "bottle", wiki: "Sharbat" },
  { id: "doodh-patti-milk", name: "Tea whitener / milk powder", nameUr: "خشک دودھ", category: "beverages", unit: "packet", wiki: "Powdered milk" },

  // Household
  { id: "dishwash", name: "Dishwashing liquid / bar", nameUr: "برتن دھونے کا صابن", category: "household", unit: "bottle" },
  { id: "detergent", name: "Laundry detergent", nameUr: "سرف", category: "household", unit: "packet", pack: "1 kg" },
  { id: "soap", name: "Bath soap", nameUr: "نہانے کا صابن", category: "household", unit: "piece" },
  { id: "tissues", name: "Tissues", nameUr: "ٹشو", category: "household", unit: "box" },
  { id: "floor-cleaner", name: "Floor cleaner", nameUr: "فرش صاف کرنے والا", category: "household", unit: "bottle" },
  { id: "toilet-cleaner", name: "Toilet cleaner", nameUr: "ٹوائلٹ کلینر", category: "household", unit: "bottle" },
  { id: "garbage-bags", name: "Garbage bags", nameUr: "کچرے کے تھیلے", category: "household", unit: "packet" },
  { id: "matches", name: "Matchbox", nameUr: "ماچس", category: "household", unit: "packet" },
  { id: "aluminium-foil", name: "Aluminium foil", nameUr: "فوائل", category: "household", unit: "piece" },

  // Personal care
  { id: "toothpaste", name: "Toothpaste", nameUr: "ٹوتھ پیسٹ", category: "personal", unit: "piece" },
  { id: "toothbrush", name: "Toothbrush", nameUr: "ٹوتھ برش", category: "personal", unit: "piece" },
  { id: "shampoo", name: "Shampoo", nameUr: "شیمپو", category: "personal", unit: "bottle" },
  { id: "sanitary-pads", name: "Sanitary pads", nameUr: "سینیٹری پیڈز", category: "personal", unit: "packet" },
  { id: "razor", name: "Razors", nameUr: "ریزر", category: "personal", unit: "packet" },
  { id: "hair-oil", name: "Hair oil", nameUr: "بالوں کا تیل", category: "personal", unit: "bottle" },
  { id: "handwash", name: "Hand wash", nameUr: "ہینڈ واش", category: "personal", unit: "bottle" },

  // Baby and family
  { id: "diapers", name: "Diapers", nameUr: "ڈائپرز", category: "baby", unit: "packet" },
  { id: "baby-wipes", name: "Baby wipes", nameUr: "بے بی وائپس", category: "baby", unit: "packet" },
  { id: "formula", name: "Infant formula", nameUr: "بچوں کا دودھ", category: "baby", unit: "tin" },
  { id: "cerelac", name: "Baby cereal", nameUr: "بچوں کا سیریل", category: "baby", unit: "box" },
  { id: "baby-soap", name: "Baby soap / lotion", nameUr: "بے بی صابن", category: "baby", unit: "piece" },

  // Snacks and pantry
  { id: "biscuits", name: "Biscuits", nameUr: "بسکٹ", category: "snacks", unit: "packet" },
  { id: "nimko", name: "Nimko / namak para", nameUr: "نمکو", category: "snacks", unit: "packet", wiki: "Bombay mix" },
  { id: "chips", name: "Crisps", nameUr: "چپس", category: "snacks", unit: "packet" },
  { id: "dry-fruit", name: "Dry fruit (almonds, walnuts)", nameUr: "خشک میوہ", category: "snacks", unit: "kg", wiki: "Almond" },
  { id: "honey", name: "Honey", nameUr: "شہد", category: "snacks", unit: "bottle", wiki: "Honey" },
  { id: "jam", name: "Jam", nameUr: "جام", category: "snacks", unit: "bottle", wiki: "Fruit preserves" },
  { id: "ketchup", name: "Ketchup", nameUr: "کیچپ", category: "snacks", unit: "bottle", wiki: "Ketchup" },
  { id: "pickle", name: "Achar (pickle)", nameUr: "اچار", category: "snacks", unit: "bottle", wiki: "South Asian pickle" },
  { id: "vermicelli", name: "Vermicelli (sewaiyan)", nameUr: "سویاں", category: "snacks", unit: "packet", wiki: "Vermicelli" },
  { id: "noodles", name: "Instant noodles", nameUr: "نوڈلز", category: "snacks", unit: "packet", wiki: "Instant noodle" },

  // Frozen and convenience
  { id: "frozen-paratha", name: "Frozen parathas", nameUr: "فروزن پراٹھے", category: "frozen", unit: "packet" },
  { id: "nuggets", name: "Chicken nuggets", nameUr: "چکن نگٹس", category: "frozen", unit: "packet", wiki: "Chicken nugget" },
  { id: "samosa", name: "Frozen samosas", nameUr: "فروزن سموسے", category: "frozen", unit: "packet", wiki: "Samosa" },
  { id: "kabab", name: "Shami kabab (frozen)", nameUr: "شامی کباب", category: "frozen", unit: "packet", wiki: "Shami kebab" },
  { id: "frozen-peas", name: "Frozen peas", nameUr: "فروزن مٹر", category: "frozen", unit: "packet" },
  { id: "ice-cream", name: "Ice cream", nameUr: "آئس کریم", category: "frozen", unit: "litre", wiki: "Ice cream" },
];

export const CATALOG_BY_ID = new Map(GROCERY_CATALOG.map((p) => [p.id, p]));

export function categoryName(id: string): string {
  return GROCERY_CATEGORIES.find((c) => c.id === id)?.name ?? "Other";
}
