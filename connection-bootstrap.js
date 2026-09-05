(function(){
  const PUBLISHABLE_KEY='sb_publishable_1fT3l7ugvk0dyJ_wybtseA_JMHBSDYX';
  if(!localStorage.getItem('porter-supabase-key')){
    localStorage.setItem('porter-supabase-key',PUBLISHABLE_KEY);
  }
})();
