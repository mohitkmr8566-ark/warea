// lib/admin.js
export const getAdminEmails = () => {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
};

export const isAdmin = (userOrEmail) => {
  if (!userOrEmail) return false;
  // allow passing either user object or plain email string
  const email = typeof userOrEmail === "string" ? userOrEmail : userOrEmail?.email;
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
};
