import { NextResponse } from 'next/server'
import { ClientService } from '@/lib/clients/client-service'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clientService = new ClientService()
    const clients = await clientService.getClients(user.id)

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clientData = await request.json()
    const clientService = new ClientService()
    const client = await clientService.createClient(user.id, clientData)

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}