import type { User } from "@supabase/supabase-js"

export function accountFromUser(user: User | null) {
  if (!user) {
    return {
      name: "Sem sessão",
      email: "Entre para carregar os dados",
      initials: "?",
    }
  }

  const metadataName = user.user_metadata?.full_name
  const name =
    typeof metadataName === "string" && metadataName.trim()
      ? metadataName.trim()
      : "Usuário"
  const parts = name.split(/\s+/).filter(Boolean)
  const initials = `${parts[0]?.[0] ?? "?"}${parts[1]?.[0] ?? ""}`.toUpperCase()

  return {
    name,
    email: user.email ?? "",
    initials,
  }
}
