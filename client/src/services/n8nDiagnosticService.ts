
import { n8nService } from './n8nService';
import { supabase } from '@/integrations/supabase/client';

export class N8nDiagnosticService {
  static async fullDiagnostic() {
    console.log('🔍 DIAGNOSTIC COMPLET N8N');
    console.log('========================');

    // 1. Test authentification Supabase
    console.log('1️⃣ Test authentification Supabase...');
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('❌ Erreur auth:', error);
        return { success: false, step: 'auth', error };
      }
      console.log('✅ Utilisateur connecté:', user?.id);
    } catch (error) {
      console.error('❌ Erreur auth:', error);
      return { success: false, step: 'auth', error };
    }

    // 2. Test fonction edge get-n8n-secrets
    console.log('2️⃣ Test fonction get-n8n-secrets...');
    try {
      const { data, error } = await supabase.functions.invoke('get-n8n-secrets');
      console.log('📋 Réponse get-n8n-secrets:', { data, error });
      
      if (error) {
        console.error('❌ Erreur get-n8n-secrets:', error);
        return { success: false, step: 'get-secrets', error };
      }

      if (!data?.apiKey) {
        console.warn('⚠️ Pas de clé API dans les secrets');
        return { success: false, step: 'no-api-key', data };
      }

      console.log('✅ Clé API trouvée, longueur:', data.apiKey.length);
    } catch (error) {
      console.error('❌ Erreur get-n8n-secrets:', error);
      return { success: false, step: 'get-secrets', error };
    }

    // 3. Test configuration service
    console.log('3️⃣ Test configuration service...');
    try {
      const config = await n8nService.getN8nConfig();
      console.log('📋 Configuration service:', {
        hasConfig: !!config,
        hasApiKey: !!(config?.apiKey),
        hasBaseUrl: !!(config?.baseUrl),
        apiKeyLength: config?.apiKey?.length || 0,
        baseUrl: config?.baseUrl
      });

      if (!config) {
        console.error('❌ Configuration service retourne null');
        return { success: false, step: 'service-config', config: null };
      }

      if (!config.apiKey) {
        console.error('❌ apiKey manquante dans la configuration service');
        return { success: false, step: 'service-api-key', config };
      }

      console.log('✅ Configuration service OK');
    } catch (error) {
      console.error('❌ Erreur configuration service:', error);
      return { success: false, step: 'service-config', error };
    }

    // 4. Test connexion n8n
    console.log('4️⃣ Test connexion n8n...');
    try {
      const connectionResult = await n8nService.checkConnection();
      console.log('📋 Résultat connexion:', connectionResult);
      
      if (connectionResult.status !== 'connected') {
        console.error('❌ Connexion n8n échouée:', connectionResult.error);
        return { success: false, step: 'n8n-connection', result: connectionResult };
      }

      console.log('✅ Connexion n8n OK');
    } catch (error) {
      console.error('❌ Erreur connexion n8n:', error);
      return { success: false, step: 'n8n-connection', error };
    }

    // 5. Test endpoint workflows
    console.log('5️⃣ Test endpoint workflows...');
    try {
      const workflows = await n8nService.getWorkflows({ limit: 1 });
      console.log('📋 Test workflows:', {
        success: true,
        count: workflows.data?.length || 0
      });
      console.log('✅ Endpoint workflows OK');
    } catch (error) {
      console.error('❌ Erreur endpoint workflows:', error);
      return { success: false, step: 'workflows-endpoint', error };
    }

    console.log('🎉 DIAGNOSTIC TERMINÉ AVEC SUCCÈS');
    return { success: true };
  }

  static async testSecrets() {
    console.log('🔐 Test direct des secrets...');
    
    try {
      const { data: secrets, error } = await supabase
        .from('user_secrets')
        .select('secret_name, secret_value')
        .in('secret_name', ['n8n_api_key', 'n8n_base_url']);

      if (error) {
        console.error('❌ Erreur requête secrets:', error);
        return { error };
      }

      console.log('📋 Secrets trouvés:', secrets?.map(s => ({
        name: s.secret_name,
        hasValue: !!s.secret_value,
        valueLength: s.secret_value?.length || 0
      })));

      return { secrets };
    } catch (error) {
      console.error('❌ Erreur test secrets:', error);
      return { error };
    }
  }
}

// Ajouter à window pour tests manuels
(window as any).testN8nDiagnostic = {
  full: () => N8nDiagnosticService.fullDiagnostic(),
  secrets: () => N8nDiagnosticService.testSecrets(),
  config: () => n8nService.getN8nConfig()
};

export default N8nDiagnosticService;
