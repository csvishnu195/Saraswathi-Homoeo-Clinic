// Resizes + compresses an image file in the browser and returns a base64
// data URL small enough to store directly on a Firestore document (1 MiB
// doc limit). This avoids needing Firebase Storage (which requires the
// paid Blaze plan) just to let the clinic swap the doctor's photo.
//
// Firestore's limit is on the whole document, and base64 inflates the raw
// bytes by ~33%, so we target well under that: shrink the longest edge to
// maxDimension and step the JPEG quality down until the encoded data URL
// is under maxBytes (default 700KB), or give up after a few tries.
export async function compressImageToDataUrl(file, { maxDimension = 900, maxBytes = 700_000 } = {}) {
  const bitmap = await loadImage(file);

  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);

  let quality = 0.85;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  let attempts = 0;
  while (dataUrl.length > maxBytes && attempts < 6) {
    quality -= 0.12;
    dataUrl = canvas.toDataURL("image/jpeg", Math.max(quality, 0.25));
    attempts += 1;
  }

  if (dataUrl.length > maxBytes) {
    throw new Error("This photo is too large even after compression — try a smaller/simpler image.");
  }

  return dataUrl;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image file."));
    };
    img.src = url;
  });
}
