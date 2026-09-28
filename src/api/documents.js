import * as FileSystem from "expo-file-system";
import { api } from "../config/api";
export async function uploadDocument(asset, kind) {
  const info = await FileSystem.getInfoAsync(asset.uri);
  if (!info.exists || !info.size || info.size > 2097152)
    throw new Error("Choose a file up to 2 MB.");
  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const ext = asset.name?.split(".").pop()?.toLowerCase();
  const mime =
    asset.mimeType ||
    {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      pdf: "application/pdf",
    }[ext];
  return api.call("/documents", {
    method: "POST",
    body: { name: asset.name, mime, kind, base64 },
  });
}
