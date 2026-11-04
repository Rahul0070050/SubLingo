import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface B2Config {
  endpoint: string;
  region: string;
  keyId: string;
  applicationKey: string;
  bucketName: string;
}

let cachedClient: S3Client | null = null;
let clientInitAttempted = false;

/**
 * Resolves Backblaze B2 configuration from environment variables.
 * Supports standard B2 naming and S3 compatibility aliases.
 */
export function getB2Config(): B2Config | null {
  const keyId = process.env.B2_KEY_ID
  const applicationKey = process.env.B2_APPLICATION_KEY
  const bucketName = process.env.B2_BUCKET_NAME
  let endpoint = process.env.B2_ENDPOINT
  let region = process.env.B2_REGION

  if (!keyId || !applicationKey || !bucketName) {
    return null;
  }

  // Derive region from endpoint if endpoint is provided but region is not
  // Example endpoint: https://s3.us-east-005.backblazeb2.com -> region: us-east-005
  if (!region && endpoint) {
    const match = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
    if (match && match[1]) {
      region = match[1];
    }
  }

  if (!region) {
    region = "us-east-005"; // Backblaze B2 default region standard
  }

  // Format endpoint URL if not fully specified
  if (!endpoint) {
    endpoint = `https://s3.${region}.backblazeb2.com`;
  } else if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
    endpoint = `https://${endpoint}`;
  }

  return {
    endpoint,
    region,
    keyId,
    applicationKey,
    bucketName,
  };
}

/**
 * Checks whether Backblaze B2 storage credentials and bucket are configured.
 */
export function isB2Configured(): boolean {
  return getB2Config() !== null;
}

/**
 * Returns a configured S3Client instance for Backblaze B2, or null if unconfigured.
 */
export function getB2Client(): S3Client | null {
  const config = getB2Config();
  if (!config) {
    if (!clientInitAttempted) {
      clientInitAttempted = true;
      console.info(
        "[BACKBLAZE B2] No B2 credentials detected in environment. Using local storage fallback."
      );
    }
    return null;
  }

  if (!cachedClient) {
    cachedClient = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.applicationKey,
      },
      // Backblaze B2 supports path-style requests reliably
      forcePathStyle: true,
    });
  }

  return cachedClient;
}

export interface UploadSubtitleResult {
  success: boolean;
  key?: string;
  bucket?: string;
  error?: string;
}

/**
 * Uploads a subtitle file (.srt or .vtt) directly to Backblaze B2 Cloud Storage.
 */
export async function uploadSubtitleToB2(params: {
  key: string;
  content: string | Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<UploadSubtitleResult> {
  const client = getB2Client();
  const config = getB2Config();

  if (!client || !config) {
    return {
      success: false,
      error: "Backblaze B2 is not configured. Missing B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, or B2_BUCKET_NAME.",
    };
  }

  try {
    const bodyBuffer =
      typeof params.content === "string" ? Buffer.from(params.content, "utf-8") : params.content;

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: params.key,
      Body: bodyBuffer,
      ContentType: params.contentType,
      Metadata: params.metadata,
    });

    await client.send(command);

    console.info(`[BACKBLAZE B2] Successfully uploaded subtitle file: s3://${config.bucketName}/${params.key}`);
    return {
      success: true,
      key: params.key,
      bucket: config.bucketName,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown B2 upload error";
    console.error(`[BACKBLAZE B2] Upload error for key '${params.key}':`, err);
    return {
      success: false,
      error: message,
    };
  }
}

export interface GetSubtitleResult {
  success: boolean;
  content?: string;
  buffer?: Buffer;
  contentType?: string;
  error?: string;
}

/**
 * Retrieves a subtitle file from Backblaze B2 Cloud Storage.
 */
export async function getSubtitleFromB2(key: string): Promise<GetSubtitleResult> {
  const client = getB2Client();
  const config = getB2Config();

  if (!client || !config) {
    return {
      success: false,
      error: "Backblaze B2 is not configured.",
    };
  }

  try {
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      return { success: false, error: "Empty object body received from B2" };
    }

    // Convert stream to Buffer
    const streamToBuffer = async (stream: unknown): Promise<Buffer> => {
      const chunks: Uint8Array[] = [];
      const asyncIter = stream as AsyncIterable<Uint8Array>;
      for await (const chunk of asyncIter) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    };

    const buffer = await streamToBuffer(response.Body);
    const content = buffer.toString("utf-8");

    return {
      success: true,
      content,
      buffer,
      contentType: response.ContentType || "text/plain",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve from B2";
    console.warn(`[BACKBLAZE B2] Fetch error for key '${key}':`, message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Generates a pre-signed temporary download URL for a file in a private Backblaze B2 bucket.
 */
export async function getSubtitlePresignedUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  const client = getB2Client();
  const config = getB2Config();

  if (!client || !config) {
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: expiresInSeconds,
    });

    return signedUrl;
  } catch (err) {
    console.warn(`[BACKBLAZE B2] Failed to generate presigned URL for key '${key}':`, err);
    return null;
  }
}

/**
 * Deletes a subtitle file from Backblaze B2.
 */
export async function deleteSubtitleFromB2(key: string): Promise<boolean> {
  const client = getB2Client();
  const config = getB2Config();

  if (!client || !config) return false;

  try {
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (err) {
    console.warn(`[BACKBLAZE B2] Failed to delete key '${key}':`, err);
    return false;
  }
}

/**
 * Checks whether an object exists in Backblaze B2 bucket.
 */
export async function checkSubtitleExistsInB2(key: string): Promise<boolean> {
  const client = getB2Client();
  const config = getB2Config();

  if (!client || !config) return false;

  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch {
    return false;
  }
}
