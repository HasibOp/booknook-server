import { connectDB } from "../src/config/db.js";

const TEAM = { name: "BookNook Team", email: "team@booknook.app" };

const SEED_BOOKS = [
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: "Fiction",
    image: "https://i.ibb.co/QjK0G7Zx/booknook-to-kill-a-mockingbird.jpg",
    totalCopies: 4,
    description:
      "In a sleepy Alabama town, young Scout Finch watches her father defend a Black man accused of a crime he did not commit, and learns what courage really looks like.",
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    category: "Fiction",
    image: "https://i.ibb.co/fzLZgm3L/booknook-pride-and-prejudice.jpg",
    totalCopies: 3,
    description:
      "Elizabeth Bennet trades sharp words with the proud Mr. Darcy in a witty story about first impressions, family pressure and changing your mind.",
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Fiction",
    image: "https://i.ibb.co/yckR8yGq/booknook-the-great-gatsby.jpg",
    totalCopies: 2,
    description:
      "Through the eyes of Nick Carraway, meet the mysterious Jay Gatsby and his lavish parties on Long Island, all built around one impossible dream.",
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    category: "Science",
    image: "https://i.ibb.co/zWCW6pJr/booknook-a-brief-history-of-time.jpg",
    totalCopies: 3,
    description:
      "From the Big Bang to black holes, Stephen Hawking explains the biggest questions about space and time in plain language anyone can follow.",
  },
  {
    title: "The Selfish Gene",
    author: "Richard Dawkins",
    category: "Science",
    image: "https://i.ibb.co/HpYmjt3V/booknook-the-selfish-gene.jpg",
    totalCopies: 2,
    description:
      "A classic look at evolution from the gene's point of view, showing how cooperation and even kindness can grow out of natural selection.",
  },
  {
    title: "Silent Spring",
    author: "Rachel Carson",
    category: "Science",
    image: "https://i.ibb.co/DmFJcJp/booknook-silent-spring.jpg",
    totalCopies: 2,
    description:
      "The book that started the modern environmental movement, revealing how careless pesticide use was poisoning birds, rivers and people.",
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    category: "History",
    image: "https://i.ibb.co/zHRP0ySq/booknook-sapiens-a-brief-history-of-humankind.jpg",
    totalCopies: 4,
    description:
      "How did one species of ape come to rule the planet? A fast-paced journey through 70,000 years of human history, from foragers to the digital age.",
  },
  {
    title: "The Diary of a Young Girl",
    author: "Anne Frank",
    category: "History",
    image: "https://i.ibb.co/MDXCbN5T/booknook-the-diary-of-a-young-girl.jpg",
    totalCopies: 3,
    description:
      "The diary Anne Frank kept while hiding from the Nazis in Amsterdam, full of hope, humor and honesty from a girl who wanted to be a writer.",
  },
  {
    title: "The Wright Brothers",
    author: "David McCullough",
    category: "History",
    image: "https://i.ibb.co/zH88sQN0/booknook-the-wright-brothers.jpg",
    totalCopies: 2,
    description:
      "The true story of two bicycle makers from Ohio who taught themselves to fly and changed the world at Kitty Hawk in 1903.",
  },
  {
    title: "Matilda",
    author: "Roald Dahl",
    category: "Kids",
    image: "https://i.ibb.co/p66gbyD6/booknook-matilda.jpg",
    totalCopies: 5,
    description:
      "Matilda loves books, has a brilliant mind and discovers a secret power, just in time to stand up to the terrifying headmistress Miss Trunchbull.",
  },
  {
    title: "Charlotte's Web",
    author: "E. B. White",
    category: "Kids",
    image: "https://i.ibb.co/vxzQhdCF/booknook-charlotte-s-web.jpg",
    totalCopies: 4,
    description:
      "A gentle tale of friendship between Wilbur the pig and Charlotte, the clever spider who spins words into her web to save his life.",
  },
  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    category: "Kids",
    image: "https://i.ibb.co/qLMMMDtg/booknook-the-little-prince.jpg",
    totalCopies: 3,
    description:
      "A pilot stranded in the desert meets a little prince from a tiny planet, and learns what matters most is invisible to the eye.",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    category: "Others",
    image: "https://i.ibb.co/n8gZbt31/booknook-atomic-habits.jpg",
    totalCopies: 4,
    description:
      "A practical guide to building good habits and breaking bad ones through small, one percent improvements that add up over time.",
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    category: "Others",
    image: "https://i.ibb.co/VYsv6FYx/booknook-thinking-fast-and-slow.jpg",
    totalCopies: 2,
    description:
      "A Nobel Prize winner explains the two systems that drive the way we think, and why our quick judgments so often lead us astray.",
  },
  {
    title: "Quiet",
    author: "Susan Cain",
    category: "Others",
    image: "https://i.ibb.co/spBdHxyF/booknook-quiet.jpg",
    totalCopies: 2,
    description:
      "An eye-opening look at introverts and the quiet strengths they bring to work, school and relationships in a world that rewards talking.",
  },
];

async function seed() {
  const reset = process.argv.includes("--reset");
  const db = await connectDB();
  const books = db.collection("books");
  const borrows = db.collection("borrows");

  const existing = await books.find({ "addedBy.email": TEAM.email }, { projection: { _id: 1 } }).toArray();

  if (existing.length && !reset) {
    console.log(`Seed books are already in the database (${existing.length}). Run "npm run seed -- --reset" to replace them.`);
    return;
  }

  if (existing.length) {
    const ids = existing.map((book) => book._id);
    await borrows.deleteMany({ bookId: { $in: ids } });
    await books.deleteMany({ _id: { $in: ids } });
    console.log(`Removed ${ids.length} old seed books and their borrows.`);
  }

  const now = Date.now();
  const docs = SEED_BOOKS.map((book, index) => {
    const addedAt = new Date(now - (SEED_BOOKS.length - index) * 60 * 60 * 1000);
    return {
      ...book,
      availableCopies: book.totalCopies,
      addedBy: TEAM,
      createdAt: addedAt,
      updatedAt: addedAt,
    };
  });

  const { insertedCount } = await books.insertMany(docs);
  console.log(`Inserted ${insertedCount} books into "${db.databaseName}.books".`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  });
