export const environment = {
  production: false,
  // Supabase > Project Settings > API
  supabaseUrl: 'https://kewfaaysfoirvsbumkce.supabase.co',
  supabaseAnonKey: 'sb_publishable_1TjeTYd7axgFYy0ouHMQnA_VkK35VJs',
  // URL pública de la Edge Function share-guide (para "Compartir como link")
  shareBaseUrl: 'https://kewfaaysfoirvsbumkce.supabase.co/functions/v1/share-guide',
  // Edge Function generate-guide (Gemini). API key va en Supabase secrets, NO aquí.
  generateGuideUrl: 'https://kewfaaysfoirvsbumkce.supabase.co/functions/v1/generate-guide',
};
