
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

  static async migrateReplitSecretsToSupabase() {
    console.log('🔄 Migration des secrets vers Supabase...');
    
    // Demander à l'utilisateur de saisir les clés manuellement
    const n8nApiKey = prompt('🔑 Entrez votre clé API n8n:');
    
    if (!n8nApiKey || !n8nApiKey.trim()) {
      console.error('❌ Clé API non fournie');
      return { 
        success: false, 
        error: 'Clé API n8n requise pour la migration' 
      };
    }

    const n8nBaseUrl = prompt('🌐 Entrez l\'URL de votre instance n8n:', 'https://n8n.srv860213.hstgr.cloud') || 'https://n8n.srv860213.hstgr.cloud';

    try {
      console.log('✅ Clés API fournies');
      console.log('📋 N8N_API_KEY:', n8nApiKey.substring(0, 10) + '...');
      console.log('📋 N8N_BASE_URL:', n8nBaseUrl);

      // Sauvegarder dans Supabase via la fonction edge
      const { data, error } = await supabase.functions.invoke('save-n8n-config', {
        body: {
          apiKey: n8nApiKey.trim(),
          baseUrl: n8nBaseUrl.trim()
        }
      });

      if (error) {
        console.error('❌ Erreur sauvegarde Supabase:', error);
        return { success: false, error };
      }

      console.log('✅ Secrets sauvegardés avec succès vers Supabase');
      return { success: true, data };

    } catch (error) {
      console.error('❌ Erreur migration:', error);
      return { success: false, error };
    }
  }
}

static async saveN8nConfig(apiKey: string, baseUrl: string = 'https://n8n.srv860213.hstgr.cloud') {
    console.log('💾 Sauvegarde configuration n8n...');
    
    try {
      if (!apiKey || !apiKey.trim()) {
        throw new Error('Clé API requise');
      }

      const { data, error } = await supabase.functions.invoke('save-n8n-config', {
        body: {
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim()
        }
      });

      if (error) {
        console.error('❌ Erreur sauvegarde:', error);
        return { success: false, error };
      }

      console.log('✅ Configuration sauvegardée avec succès');
      return { success: true, data };

    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      return { success: false, error };
    }
  }
}

// Ajouter à window pour tests manuels
(window as any).testN8nDiagnostic = {
  full: () => N8nDiagnosticService.fullDiagnostic(),
  secrets: () => N8nDiagnosticService.testSecrets(),
  config: () => n8nService.getN8nConfig(),
  migrate: () => N8nDiagnosticService.migrateReplitSecretsToSupabase(),
  save: (apiKey: string, baseUrl?: string) => N8nDiagnosticService.saveN8nConfig(apiKey, baseUrl)
};

export default N8nDiagnosticService;
