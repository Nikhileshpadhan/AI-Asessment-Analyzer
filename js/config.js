/* ============================================
   Supabase Configuration
   ============================================ */

const SUPABASE_URL = 'https://rdpjvwojkasjnxxztvtb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcGp2d29qa2Fzam54eHp0dnRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2Nzc4MTcsImV4cCI6MjA4NzI1MzgxN30.F2FoOIjzqGwpwFsI1heFFSJn10yvWKXFuXHeRWqt7sc';

// CDN puts createClient on window.supabase — init our client as "sb"
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE = 'http://localhost:5000';
