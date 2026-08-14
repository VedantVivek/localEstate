const mongoose = require("mongoose");
const crypto = require("crypto");

const hash = (pw, salt = crypto.randomBytes(8).toString("hex")) => {
  const h = crypto.scryptSync(String(pw), salt, 32).toString("hex");
  return `${salt}:${h}`;
};
const verify = (pw, stored) => {
  const [salt, h] = String(stored).split(":");
  return crypto.scryptSync(String(pw), salt, 32).toString("hex") === h;
};

const imgs = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&h=750&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&h=750&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&h=750&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&h=750&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&h=750&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1000&h=750&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&h=750&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&h=750&q=80",
  "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1000&h=750&q=80",
  "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1000&h=750&q=80",
];
const img = (i) => imgs[i % imgs.length];

const seedProps = [
  { id: 1, title: "Bandra Sea Breeze", price: 185000, location: "Bandra West, Mumbai, India", state: "Maharashtra", city: "Mumbai", country: "India", beds: 3, baths: 3, area: 145, year: 2021, score: 95, image: img(0), tag: "Coastal", amenities: ["Sea view", "Gym"], description: "Bandra flat near cafés and the promenade." },
  { id: 2, title: "Powai Lake Residences", price: 98000, location: "Powai, Mumbai, India", state: "Maharashtra", city: "Mumbai", country: "India", beds: 2, baths: 2, area: 110, year: 2020, score: 89, image: img(1), tag: "Popular", amenities: ["Lake view", "Clubhouse"], description: "Quiet Powai home with lake walks." },
  { id: 3, title: "Juhu Palm Villa", price: 260000, location: "Juhu, Mumbai, India", state: "Maharashtra", city: "Mumbai", country: "India", beds: 4, baths: 4, area: 260, year: 2019, score: 97, image: img(2), tag: "Premium", amenities: ["Garden", "Near beach"], description: "Villa near Juhu beach with a family garden." },
  { id: 4, title: "Worli Sky Deck", price: 310000, location: "Worli, Mumbai, India", state: "Maharashtra", city: "Mumbai", country: "India", beds: 3, baths: 3, area: 180, year: 2023, score: 98, image: img(3), tag: "Featured", amenities: ["Sky deck", "Bay views"], description: "High-floor Worli home with bay sunsets." },
  { id: 5, title: "Saket Garden Flat", price: 120000, location: "Saket, New Delhi, India", state: "Delhi", city: "New Delhi", country: "India", beds: 3, baths: 2, area: 140, year: 2018, score: 90, image: img(4), tag: "Family", amenities: ["Park facing", "Metro"], description: "South Delhi home near malls and metro." },
  { id: 6, title: "Dwarka Metro Nest", price: 78000, location: "Dwarka, New Delhi, India", state: "Delhi", city: "New Delhi", country: "India", beds: 2, baths: 2, area: 105, year: 2021, score: 86, image: img(5), tag: "New", amenities: ["Metro", "Balcony"], description: "Bright Dwarka flat with easy airport access." },
  { id: 7, title: "Gurgaon Cyber Heights", price: 155000, location: "Sector 54, Gurgaon, India", state: "Haryana", city: "Gurgaon", country: "India", beds: 3, baths: 3, area: 165, year: 2022, score: 93, image: img(6), tag: "Popular", amenities: ["Clubhouse", "Pool"], description: "Golf-course side living near cyber hub." },
  { id: 8, title: "Noida Express Home", price: 88000, location: "Sector 137, Noida, India", state: "Uttar Pradesh", city: "Noida", country: "India", beds: 3, baths: 2, area: 130, year: 2020, score: 87, image: img(7), tag: "Local pick", amenities: ["Expressway", "Park"], description: "Noida home with parks and office connectivity." },
  { id: 9, title: "Indiranagar Tree House", price: 142000, location: "Indiranagar, Bengaluru, India", state: "Karnataka", city: "Bengaluru", country: "India", beds: 3, baths: 3, area: 150, year: 2019, score: 94, image: img(0), tag: "Featured", amenities: ["Cafe street", "Garden"], description: "Leafy Indiranagar home on a quiet cross street." },
  { id: 10, title: "Whitefield Tech Loft", price: 95000, location: "Whitefield, Bengaluru, India", state: "Karnataka", city: "Bengaluru", country: "India", beds: 2, baths: 2, area: 115, year: 2022, score: 88, image: img(1), tag: "New", amenities: ["WFH nook", "Gym"], description: "Loft living near tech parks and brunch spots." },
  { id: 11, title: "Koramangala Studio Lane", price: 69000, location: "Koramangala, Bengaluru, India", state: "Karnataka", city: "Bengaluru", country: "India", beds: 1, baths: 1, area: 65, year: 2021, score: 85, image: img(2), tag: "Popular", amenities: ["Rooftop", "Startups nearby"], description: "Compact Koramangala studio with rooftop evenings." },
  { id: 12, title: "Gachibowli Lakeview", price: 110000, location: "Gachibowli, Hyderabad, India", state: "Telangana", city: "Hyderabad", country: "India", beds: 3, baths: 3, area: 155, year: 2021, score: 92, image: img(3), tag: "Premium", amenities: ["Lake view", "Club"], description: "Gachibowli residence with lake walks and offices nearby." },
  { id: 13, title: "Jubilee Hills Courtyard", price: 240000, location: "Jubilee Hills, Hyderabad, India", state: "Telangana", city: "Hyderabad", country: "India", beds: 4, baths: 4, area: 280, year: 2018, score: 96, image: img(4), tag: "Premium", amenities: ["Courtyard", "Private driveway"], description: "Spacious Jubilee Hills home with a calm courtyard." },
  { id: 14, title: "Besant Nagar Breeze", price: 125000, location: "Besant Nagar, Chennai, India", state: "Tamil Nadu", city: "Chennai", country: "India", beds: 3, baths: 2, area: 140, year: 2020, score: 91, image: img(5), tag: "Coastal", amenities: ["Beach road", "Balcony"], description: "Chennai coastal home near Elliot's Beach." },
  { id: 15, title: "OMR Sunrise Flat", price: 76000, location: "Sholinganallur, Chennai, India", state: "Tamil Nadu", city: "Chennai", country: "India", beds: 2, baths: 2, area: 108, year: 2023, score: 87, image: img(6), tag: "New", amenities: ["OMR access", "Gym"], description: "Modern OMR flat for IT corridor weekdays." },
  { id: 16, title: "Koregaon Park Loft", price: 115000, location: "Koregaon Park, Pune, India", state: "Maharashtra", city: "Pune", country: "India", beds: 2, baths: 2, area: 120, year: 2019, score: 90, image: img(7), tag: "Featured", amenities: ["Cafés", "Tree cover"], description: "KP loft with leafy streets and evening cafés." },
  { id: 17, title: "Hinjewadi Work Nest", price: 68000, location: "Hinjewadi, Pune, India", state: "Maharashtra", city: "Pune", country: "India", beds: 2, baths: 2, area: 100, year: 2022, score: 84, image: img(0), tag: "Local pick", amenities: ["IT park", "Clubhouse"], description: "Practical Hinjewadi home near major campuses." },
  { id: 18, title: "Salt Lake Serenity", price: 82000, location: "Salt Lake, Kolkata, India", state: "West Bengal", city: "Kolkata", country: "India", beds: 3, baths: 2, area: 135, year: 2017, score: 88, image: img(1), tag: "Family", amenities: ["Park", "Market"], description: "Salt Lake family home with calm park mornings." },
  { id: 19, title: "Park Street Heritage Flat", price: 99000, location: "Park Street, Kolkata, India", state: "West Bengal", city: "Kolkata", country: "India", beds: 2, baths: 2, area: 118, year: 2015, score: 89, image: img(2), tag: "Popular", amenities: ["Heritage lane", "Dining"], description: "Classic Kolkata flat steps from Park Street energy." },
  { id: 20, title: "SG Highway Vista", price: 74000, location: "SG Highway, Ahmedabad, India", state: "Gujarat", city: "Ahmedabad", country: "India", beds: 3, baths: 2, area: 128, year: 2021, score: 86, image: img(3), tag: "New", amenities: ["Highway access", "Mall nearby"], description: "Ahmedabad home with open light and highway access." },
  { id: 21, title: "Pink City Courtyard", price: 65000, location: "C-Scheme, Jaipur, India", state: "Rajasthan", city: "Jaipur", country: "India", beds: 3, baths: 2, area: 140, year: 2018, score: 90, image: img(4), tag: "Featured", amenities: ["Courtyard", "Near bazaar"], description: "Jaipur courtyard home with soft evening stone light." },
  { id: 22, title: "Sector 17 Plaza Home", price: 88000, location: "Sector 17, Chandigarh, India", state: "Chandigarh", city: "Chandigarh", country: "India", beds: 3, baths: 2, area: 145, year: 2016, score: 91, image: img(5), tag: "Family", amenities: ["Plaza walks", "Gardens"], description: "Chandigarh sector living with planned green belts." },
  { id: 23, title: "Fort Kochi Veranda", price: 72000, location: "Fort Kochi, Kochi, India", state: "Kerala", city: "Kochi", country: "India", beds: 2, baths: 2, area: 110, year: 2014, score: 93, image: img(6), tag: "Coastal", amenities: ["Veranda", "Harbour"], description: "Harbour breeze home in historic Fort Kochi." },
  { id: 24, title: "Candolim Garden Villa", price: 175000, location: "Candolim, Goa, India", state: "Goa", city: "Goa", country: "India", beds: 4, baths: 3, area: 220, year: 2019, score: 96, image: img(7), tag: "Premium", amenities: ["Garden", "Near beach"], description: "Goa villa with garden shade and beach weekends." },
  { id: 25, title: "Gomti Nagar Calm", price: 58000, location: "Gomti Nagar, Lucknow, India", state: "Uttar Pradesh", city: "Lucknow", country: "India", beds: 3, baths: 2, area: 125, year: 2020, score: 85, image: img(0), tag: "Quiet", amenities: ["Park", "Markets"], description: "Lucknow family home on a calm Gomti Nagar lane." },
  { id: 26, title: "Banjara Palm Estate", price: 132000, location: "Banjara Hills, Hyderabad, India", state: "Telangana", city: "Hyderabad", country: "India", beds: 3, baths: 3, area: 170, year: 2020, score: 92, image: img(1), tag: "Premium", amenities: ["Palm court", "Security"], description: "Polished Banjara Hills residence with palm court quiet." },
  { id: 27, title: "Andheri Green Loft", price: 72000, location: "Andheri East, Mumbai, India", state: "Maharashtra", city: "Mumbai", country: "India", beds: 2, baths: 2, area: 95, year: 2022, score: 86, image: img(2), tag: "New", amenities: ["Metro", "Balcony"], description: "Andheri loft near metro and airport hops." },
  { id: 28, title: "Thane Courtyard Nest", price: 54000, location: "Thane, Mumbai, India", state: "Maharashtra", city: "Mumbai", country: "India", beds: 3, baths: 2, area: 125, year: 2018, score: 84, image: img(3), tag: "Family", amenities: ["Courtyard", "Schools"], description: "Family-friendly Thane home with an inner courtyard." },
  { id: 29, title: "Marine Drive Classic", price: 420000, location: "Marine Drive, Mumbai, India", state: "Maharashtra", city: "Mumbai", country: "India", beds: 3, baths: 3, area: 190, year: 2012, score: 99, image: img(4), tag: "Featured", amenities: ["Sea face", "Heritage"], description: "Iconic Marine Drive apartment with endless horizon light." },
  { id: 30, title: "Vasant Kunj Greens", price: 135000, location: "Vasant Kunj, New Delhi, India", state: "Delhi", city: "New Delhi", country: "India", beds: 3, baths: 3, area: 160, year: 2019, score: 90, image: img(5), tag: "Quiet", amenities: ["Greens", "Mall access"], description: "Leafy Vasant Kunj home with soft park edges." },
];

const propertySchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    title: String,
    price: Number,
    location: String,
    state: String,
    city: String,
    country: String,
    beds: Number,
    baths: Number,
    area: Number,
    year: Number,
    score: Number,
    image: String,
    tag: String,
    amenities: [String],
    description: String,
  },
  { versionKey: false }
);

const userSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: String,
    email: { type: String, required: true, unique: true, index: true },
    password: String,
    favorites: { type: [Number], default: [] },
    created_at: String,
  },
  { versionKey: false }
);

const sessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: Number, required: true },
  },
  { versionKey: false }
);

const contactSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: String,
    email: String,
    phone: String,
    message: String,
    channel: String,
    created_at: String,
  },
  { versionKey: false }
);

const subscriberSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    created_at: String,
  },
  { versionKey: false }
);

const tourSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    userId: Number,
    propertyId: Number,
    date: String,
    time: String,
    note: String,
    status: String,
    created_at: String,
  },
  { versionKey: false }
);

const reviewSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    propertyId: Number,
    userId: Number,
    name: String,
    rating: Number,
    text: String,
    created_at: String,
  },
  { versionKey: false }
);

const Property = mongoose.models.Property || mongoose.model("Property", propertySchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);
const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);
const Subscriber = mongoose.models.Subscriber || mongoose.model("Subscriber", subscriberSchema);
const Tour = mongoose.models.Tour || mongoose.model("Tour", tourSchema);
const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

let cached = global.__localeestate_mongoose;
if (!cached) {
  cached = global.__localeestate_mongoose = { conn: null, promise: null, seeded: false };
}

function requireUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Copy .env.example to .env and set your MongoDB Atlas connection string.");
  }
  return uri;
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = requireUri();
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false })
      .then((m) => m.connection);
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

async function seedIfEmpty() {
  if (cached.seeded) return;
  await connectDB();
  const count = await Property.countDocuments();
  if (count === 0) {
    await Property.insertMany(seedProps);
  } else {
    for (const p of seedProps) {
      await Property.updateOne({ id: p.id }, { $set: { image: p.image } });
    }
  }
  const users = await User.countDocuments();
  if (users === 0) {
    await User.create({
      id: 1,
      name: "Demo Buyer",
      email: "demo@localeestate.com",
      password: hash("demo1234"),
      favorites: [1, 9, 24],
      created_at: new Date().toISOString(),
    });
  }
  const reviews = await Review.countDocuments();
  if (reviews === 0) {
    await Review.insertMany([
      { id: 1, propertyId: 1, userId: 1, name: "Demo Buyer", rating: 5, text: "Bandra mornings are perfect.", created_at: new Date().toISOString() },
      { id: 2, propertyId: 9, userId: 1, name: "Demo Buyer", rating: 5, text: "Indiranagar feels like home.", created_at: new Date().toISOString() },
    ]);
  }
  cached.seeded = true;
}

function lean(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  delete o._id;
  return o;
}

/** Load full app store shape (compatible with previous JSON API). */
async function load() {
  await seedIfEmpty();
  const [properties, users, sessions, contacts, subscribers, tours, reviews] = await Promise.all([
    Property.find().lean(),
    User.find().lean(),
    Session.find().lean(),
    Contact.find().lean(),
    Subscriber.find().lean(),
    Tour.find().lean(),
    Review.find().lean(),
  ]);

  const sessionMap = {};
  for (const s of sessions) sessionMap[s.token] = s.userId;

  const catalog = properties.filter((p) => p.id <= 1000).length
    ? properties.map(lean)
    : [...seedProps];

  return {
    properties: catalog,
    users: users.map(lean),
    sessions: sessionMap,
    contacts: contacts.map(lean),
    subscribers: subscribers.map(lean),
    tours: tours.map(lean),
    reviews: reviews.map(lean),
  };
}

async function save(data) {
  await connectDB();

  const syncCollection = async (Model, items, key = "id") => {
    const list = items || [];
    const ids = list.map((x) => x[key]);
    if (ids.length) {
      await Model.deleteMany({ [key]: { $nin: ids } });
    } else {
      await Model.deleteMany({});
    }
    for (const item of list) {
      const { _id, ...rest } = item;
      await Model.updateOne({ [key]: rest[key] }, { $set: rest }, { upsert: true });
    }
  };

  await syncCollection(Property, data.properties, "id");
  await syncCollection(User, data.users, "id");
  await syncCollection(Contact, data.contacts, "id");
  await syncCollection(Subscriber, data.subscribers, "id");
  await syncCollection(Tour, data.tours, "id");
  await syncCollection(Review, data.reviews, "id");

  const tokens = Object.keys(data.sessions || {});
  if (tokens.length) {
    await Session.deleteMany({ token: { $nin: tokens } });
  } else {
    await Session.deleteMany({});
  }
  for (const [token, userId] of Object.entries(data.sessions || {})) {
    await Session.updateOne({ token }, { $set: { token, userId } }, { upsert: true });
  }
}

async function findUserByEmail(email) {
  await connectDB();
  const u = await User.findOne({ email: String(email).trim().toLowerCase() }).lean();
  return lean(u);
}

async function findUserById(id) {
  await connectDB();
  const u = await User.findOne({ id: Number(id) }).lean();
  return lean(u);
}

async function createUser({ name, email, password }) {
  await connectDB();
  const em = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: em }).lean();
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }
  const user = {
    id: Date.now(),
    name: String(name).slice(0, 60),
    email: em,
    password: hash(password),
    favorites: [],
    created_at: new Date().toISOString(),
  };
  await User.create(user);
  return user;
}

async function createSession(userId) {
  await connectDB();
  const token = require("crypto").randomBytes(24).toString("hex");
  await Session.create({ token, userId: Number(userId) });
  return token;
}

async function findSessionUser(token) {
  await connectDB();
  if (!token) return null;
  const session = await Session.findOne({ token: String(token) }).lean();
  if (!session) return null;
  return findUserById(session.userId);
}

async function deleteSession(token) {
  await connectDB();
  await Session.deleteOne({ token: String(token) });
}

async function updateUserFavorites(userId, favorites) {
  await connectDB();
  await User.updateOne({ id: Number(userId) }, { $set: { favorites } });
}

async function createTour(tour) {
  await connectDB();
  await Tour.create(tour);
  return lean(tour);
}

async function listToursForUser(userId) {
  await connectDB();
  const tours = await Tour.find({ userId: Number(userId) }).lean();
  const props = await Property.find().lean();
  return tours.map((t) => {
    const clean = lean(t);
    return { ...clean, property: lean(props.find((p) => p.id === clean.propertyId)) };
  });
}

async function createReview(review) {
  await connectDB();
  await Review.create(review);
  return lean(review);
}

async function createContact(entry) {
  await connectDB();
  await Contact.create(entry);
  return lean(entry);
}

async function createSubscriber(email) {
  await connectDB();
  const em = String(email).trim().toLowerCase();
  const existing = await Subscriber.findOne({ email: em }).lean();
  if (existing) return { already: true, entry: lean(existing) };
  const entry = { id: Date.now(), email: em, created_at: new Date().toISOString() };
  await Subscriber.create(entry);
  return { already: false, entry };
}

async function findPropertyById(id) {
  await connectDB();
  const p = await Property.findOne({ id: Number(id) }).lean();
  return lean(p);
}

module.exports = {
  connectDB,
  seedIfEmpty,
  load,
  save,
  hash,
  verify,
  seedProps,
  findUserByEmail,
  findUserById,
  createUser,
  createSession,
  findSessionUser,
  deleteSession,
  updateUserFavorites,
  createTour,
  listToursForUser,
  createReview,
  createContact,
  createSubscriber,
  findPropertyById,
};
