import { NextResponse } from 'next/server'
import { BulkImportService } from '@/lib/xero/bulk-import-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobData = await request.json()
    const bulkImportService = new BulkImportService()
    const bulkJob = await bulkImportService.createBulkJob(user.id, jobData)

    return NextResponse.json(bulkJob)
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json({ error: 'Failed to create bulk import job' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const clientId = url.searchParams.get('clientId')
    const jobId = url.searchParams.get('jobId')
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bulkImportService = new BulkImportService()
    
    // If jobId is provided, get specific job status
    if (jobId) {
      const jobStatus = await bulkImportService.getBulkJobStatus(jobId, user.id)
      return NextResponse.json({ job: jobStatus })
    }
    
    // Otherwise, get all jobs
    const bulkJobs = await bulkImportService.getBulkJobs(user.id, clientId)

    return NextResponse.json({ bulkJobs })
  } catch (error) {
    console.error('Get bulk jobs error:', error)
    return NextResponse.json({ error: 'Failed to fetch bulk jobs' }, { status: 500 })
  }
}