import { createClient } from '@/lib/supabase/client'

export class ClientService {
  constructor() {
    this.supabase = createClient()
  }

  async createClient(userId, clientData) {
    const { data, error } = await this.supabase
      .from('clients')
      .insert({
        user_id: userId,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        business_type: clientData.businessType,
        industry: clientData.industry,
        notes: clientData.notes
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getClients(userId, activeOnly = true) {
    let query = this.supabase
      .from('clients')
      .select(`
        *,
        client_xero_connections (
          id,
          tenant_id,
          tenant_name,
          default_bank_account_id,
          auto_import_enabled,
          last_import_at
        )
      `)
      .eq('user_id', userId)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.order('name')
    if (error) throw error
    return data || []
  }

  async updateClient(clientId, userId, updates) {
    const { data, error } = await this.supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async linkClientToXero(clientId, userId, xeroConnectionId, tenantId, tenantName, settings = {}) {
    const { data, error } = await this.supabase
      .from('client_xero_connections')
      .insert({
        client_id: clientId,
        user_id: userId,
        connection_id: xeroConnectionId,
        tenant_id: tenantId,
        tenant_name: tenantName,
        default_bank_account_id: settings.defaultBankAccountId,
        auto_import_enabled: settings.autoImportEnabled || false,
        import_schedule: settings.importSchedule || 'manual'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getClientFiles(clientId, userId) {
    const { data, error } = await this.supabase
      .from('files')
      .select(`
        *,
        xero_imports (
          id,
          status,
          total_transactions,
          successful_imports,
          created_at
        )
      `)
      .eq('client_id', clientId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async assignFileToClient(fileId, clientId, userId) {
    const { data, error } = await this.supabase
      .from('files')
      .update({ client_id: clientId })
      .eq('id', fileId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}