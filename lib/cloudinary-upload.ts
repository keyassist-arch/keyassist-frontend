import type { CloudinaryUploadSignature } from "@/types/api";

/**
 * Uploads a file straight to Cloudinary using a backend-issued signature — the file bytes
 * never pass through our own API server. Throws with Cloudinary's error message on failure.
 */
export async function uploadImageToCloudinary(
  file: File,
  sig: CloudinaryUploadSignature,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? "Image upload failed");
  }
  return data.secure_url as string;
}
