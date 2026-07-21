// Encrypted attachment storage for Gestione Personale (medical fitness
// certificates, vaccination records, etc.). Files are AES-256-GCM encrypted
// server-side *before* upload — only ciphertext ever reaches Vercel Blob, and
// the encryption key never leaves this app. Optional/no-op like Resend/Twilio:
// the app works without BLOB_READ_WRITE_TOKEN/ATTACHMENT_ENCRYPTION_KEY set,
// it just can't accept uploads yet.
import { put, del } from "@vercel/blob";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function isAttachmentStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.ATTACHMENT_ENCRYPTION_KEY);
}

function getKey(): Buffer {
  const key = process.env.ATTACHMENT_ENCRYPTION_KEY;
  if (!key) throw new Error("ATTACHMENT_ENCRYPTION_KEY non configurata.");
  // sha256 the configured secret so any passphrase length yields a valid 32-byte AES-256 key.
  return crypto.createHash("sha256").update(key).digest();
}

export async function uploadEncryptedAttachment(params: { studioId: string; userId: string; file: File }) {
  if (!isAttachmentStorageConfigured()) {
    throw new Error("Gli allegati cifrati non sono ancora configurati su questa istanza.");
  }

  const buffer = Buffer.from(await params.file.arrayBuffer());
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([authTag, encrypted]); // 16-byte auth tag prefix

  const blobKey = `personale/${params.studioId}/${crypto.randomUUID()}.enc`;
  const blob = await put(blobKey, payload, {
    access: "public",
    contentType: "application/octet-stream",
    addRandomSuffix: false,
  });

  return prisma.allegatoPersonale.create({
    data: {
      studioId: params.studioId,
      nomeFile: params.file.name || "allegato",
      mimeType: params.file.type || "application/octet-stream",
      dimensioneByte: buffer.byteLength,
      storageUrl: blob.url,
      iv: iv.toString("base64"),
      caricatoDaUserId: params.userId,
    },
  });
}

export async function downloadDecryptedAttachment(
  id: string,
  studioId: string
): Promise<{ buffer: Buffer; mimeType: string; nomeFile: string } | null> {
  const record = await prisma.allegatoPersonale.findFirst({ where: { id, studioId } });
  if (!record) return null;

  const res = await fetch(record.storageUrl);
  if (!res.ok) throw new Error("Impossibile scaricare l'allegato dallo storage.");
  const payload = Buffer.from(await res.arrayBuffer());
  const authTag = payload.subarray(0, 16);
  const ciphertext = payload.subarray(16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(record.iv, "base64"));
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return { buffer: decrypted, mimeType: record.mimeType, nomeFile: record.nomeFile };
}

export async function deleteAttachment(id: string, studioId: string) {
  const record = await prisma.allegatoPersonale.findFirst({ where: { id, studioId } });
  if (!record) return;
  try {
    await del(record.storageUrl);
  } catch (err) {
    console.error("Blob delete failed (continuing to remove DB record):", err);
  }
  await prisma.allegatoPersonale.delete({ where: { id } });
}
