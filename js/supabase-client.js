const SUPABASE_URL = 'https://ihtyzbjsekdgvpcwcavs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlodHl6YmpzZWtkZ3ZwY3djYXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTczNjIsImV4cCI6MjA5NzA5MzM2Mn0.tNjBQ8Ptb02KRLgmE6lktuNnulMtdnkYJsEigIzy3C0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SupabaseClient = {
  async savePlan(id, projectName, content, status = 'draft') {
    try {
      if (!id) {
        // Insert new plan
        const { data, error } = await supabase
          .from('business_plans')
          .insert([{ project_name: projectName, content: content, status: status }])
          .select()
          .single();
        if (error) throw error;
        return data.id;
      } else {
        // Update existing plan
        const { error } = await supabase
          .from('business_plans')
          .update({ content: content, status: status, updated_at: new Date() })
          .eq('id', id);
        if (error) throw error;
        return id;
      }
    } catch (e) {
      console.error('Supabase Save Error:', e);
      return id; // Return existing ID even on error
    }
  },
  
  async loadPlan(id) {
    const { data, error } = await supabase
      .from('business_plans')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  
  async listPlans() {
    const { data, error } = await supabase
      .from('business_plans')
      .select('id, project_name, status, updated_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};
