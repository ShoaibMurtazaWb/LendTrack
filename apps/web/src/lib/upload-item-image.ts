import { getAuthUser, supabase } from "@/lib/supabase";

const BUCKET = "item-photos";
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadItemPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPEG, PNG, WebP).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be smaller than 5 MB.");
  }

  const user = await getAuthUser();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    if (error.message.includes("Bucket not found")) {
      throw new Error("Photo storage is not set up yet. Run db:push to create the item-photos bucket.");
    }
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
