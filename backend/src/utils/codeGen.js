function slugify(name) {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "CLINIC";
  if (words.length === 1) return words[0].slice(0, 6).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 6)
    .toUpperCase();
}

export async function generateUniqueCode(name, Model) {
  const base = slugify(name);
  let code = base;
  let suffix = 1;
  while (await Model.exists({ code })) {
    code = `${base}${suffix}`;
    suffix += 1;
  }
  return code;
}
