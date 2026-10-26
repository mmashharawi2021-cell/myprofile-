export function validateContent(value, template) {
  const fail = (message) => {
    const error = new Error(message);
    error.status = 400;
    throw error;
  };
  function walk(current, shape, path) {
    if (Array.isArray(shape)) {
      if (!Array.isArray(current) || current.length > 80)
        fail(`قائمة غير صالحة: ${path}`);
      current.forEach((entry, index) =>
        walk(entry, shape[0], `${path}.${index}`),
      );
      const ids = current
        .filter((entry) => entry && typeof entry === "object" && "id" in entry)
        .map((entry) => entry.id);
      if (new Set(ids).size !== ids.length) fail(`معرّفات مكررة: ${path}`);
    } else if (shape && typeof shape === "object") {
      if (!current || typeof current !== "object" || Array.isArray(current))
        fail(`قسم غير صالح: ${path}`);
      if (
        Object.keys(current).some((key) => !Object.hasOwn(shape, key)) ||
        Object.keys(shape).some((key) => !Object.hasOwn(current, key))
      )
        fail(`حقول ناقصة أو غير معروفة: ${path}`);
      for (const key of Object.keys(shape))
        walk(current[key], shape[key], path ? `${path}.${key}` : key);
    } else if (
      typeof current !== typeof shape ||
      (typeof current === "string" && current.length > 10000)
    )
      fail(`قيمة غير صالحة: ${path}`);
    if (typeof current === "string") {
      const key = path.split(".").at(-1);
      if (key === "id" && !/^[a-zA-Z0-9_-]{1,80}$/.test(current))
        fail(`معرّف غير صالح: ${path}`);
      if (
        ["href", "link", "primaryLink", "github", "image", "portrait"].includes(
          key,
        ) &&
        current
      ) {
        const image = ["image", "portrait"].includes(key);
        if (current.startsWith("//") || /[\\\u0000-\u0020]/.test(current))
          fail(`رابط غير صالح: ${path}`);
        if (/^[a-z][a-z0-9+.-]*:/i.test(current)) {
          let url;
          try {
            url = new URL(current);
          } catch {
            fail(`رابط غير صالح: ${path}`);
          }
          if (
            !(
              image
                ? ["https:", "http:"]
                : ["https:", "http:", "mailto:", "tel:"]
            ).includes(url.protocol) ||
            url.username ||
            url.password
          )
            fail(`نوع رابط غير مسموح: ${path}`);
        } else if (
          !/^(?:#|\/?(?:assets|media)\/|profile-photo\.svg$)/.test(current) ||
          current.split("/").includes("..")
        )
          fail(`مسار غير مسموح: ${path}`);
      }
    }
  }
  walk(value, template, "");
  if (!value.projects.length) fail("يجب الاحتفاظ بمشروع واحد على الأقل.");
  if (
    value.sections.length !== template.sections.length ||
    value.sections.some(
      (section) => !template.sections.some((item) => item.id === section.id),
    )
  )
    fail("قائمة أقسام الموقع غير صالحة.");
  if (
    value.projects.some(
      (project) =>
        !["GIS والخرائط", "أنظمة الويب", "مواقع ومنصات"].includes(
          project.category,
        ),
    )
  )
    fail("تصنيف المشروع غير صالح.");
  if (!/^[0-9]{8,15}$/.test(value.identity.whatsapp))
    fail("رقم واتساب غير صالح.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.identity.email))
    fail("البريد الإلكتروني غير صالح.");
  if (!/^#[0-9a-f]{6}$/i.test(value.theme.accent))
    fail("اللون يجب أن يكون بصيغة HEX.");
  if (
    !["light", "dark"].includes(value.theme.defaultMode) ||
    !["Tajawal", "Inter", "system-ui"].includes(value.theme.font)
  )
    fail("إعداد المظهر غير صالح.");
  if (
    !Number.isFinite(value.theme.radius) ||
    value.theme.radius < 0 ||
    value.theme.radius > 50 ||
    !Number.isFinite(value.theme.fontSize) ||
    value.theme.fontSize < 12 ||
    value.theme.fontSize > 24
  )
    fail("حجم الخط أو استدارة البطاقات خارج المدى.");
  return value;
}
