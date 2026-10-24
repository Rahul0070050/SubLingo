import { MongoClient, Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
let clientPromise: Promise<MongoClient> | null = null;
let indexesInitialized = false;

if (uri) {
  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

/**
 * Returns the connected MongoClient instance, or null if MONGODB_URI is not configured.
 */
export async function getMongoClient(): Promise<MongoClient | null> {
  if (!clientPromise) return null;
  try {
    return await clientPromise;
  } catch (err) {
    console.warn("[MONGODB] Failed to connect to MongoDB cluster:", err);
    return null;
  }
}

/**
 * Returns the SubLingo MongoDB database instance.
 */
export async function getDb(): Promise<Db | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const db = client.db(process.env.MONGODB_DB_NAME || "sublingo");

  // Automatically initialize TTL and unique indexes on first connection
  if (!indexesInitialized) {
    indexesInitialized = true;
    initIndexes(db).catch((err) => {
      console.warn("[MONGODB] Index creation warning:", err);
    });
  }

  return db;
}

/**
 * Creates MongoDB TTL and unique indexes for automatic expiration and fast lookups
 */
async function initIndexes(db: Db) {
  try {
    // 1. OTP Collection: TTL index on expiresAt so expired OTPs are automatically deleted
    await db.collection("otps").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection("otps").createIndex({ email: 1 });

    // 2. Passkey Collection: TTL index on expiresAt (auto-purges after 24h) and unique index on passkey
    await db.collection("passkeys").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection("passkeys").createIndex({ passkey: 1 }, { unique: true });
    await db.collection("passkeys").createIndex({ email: 1 });

    console.log("[MONGODB] 🚀 TTL and unique indexes verified on 'otps' and 'passkeys' collections.");
  } catch (err) {
    console.warn("[MONGODB] Could not ensure indexes:", err);
  }
}
