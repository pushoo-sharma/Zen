/**
 * Job Queue
 * Manages background job processing with retry logic
 */

export type JobName = 'score' | 'compose' | 'calendar' | 'digest' | 'classify';

export interface Job {
  id?: string;
  name: JobName;
  payload: any;
  attempt?: number;
  userId?: string;
  createdAt?: string;
}

/**
 * Enqueues a job for background processing
 */
export async function enqueue(supabase: any, job: Job): Promise<void> {
  const { error } = await supabase
    .from('job_queue')
    .insert({
      name: job.name,
      payload: job.payload,
      attempt: job.attempt ?? 0,
      user_id: job.userId,
      status: 'pending',
    });

  if (error) {
    console.error('Failed to enqueue job:', error);
    throw error;
  }
}

/**
 * Drains pending jobs from the queue
 */
export async function drain(supabase: any, batch: number = 10): Promise<Job[]> {
  const { data, error } = await supabase
    .from('job_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(batch);

  if (error) {
    console.error('Failed to drain queue:', error);
    return [];
  }

  // Mark as processing
  if (data && data.length > 0) {
    const ids = data.map((j: any) => j.id);
    await supabase
      .from('job_queue')
      .update({ status: 'processing' })
      .in('id', ids);
  }

  return data || [];
}

/**
 * Gets queue size
 */
export async function size(supabase: any): Promise<number> {
  const { count, error } = await supabase
    .from('job_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) {
    console.error('Failed to get queue size:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Marks a job as completed
 */
export async function complete(supabase: any, jobId: string): Promise<void> {
  await supabase
    .from('job_queue')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', jobId);
}

/**
 * Marks a job as failed and reschedules if attempts remain
 */
export async function fail(supabase: any, jobId: string, error: string): Promise<void> {
  const { data: job } = await supabase
    .from('job_queue')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!job) return;

  const maxAttempts = 5;
  const attempt = (job.attempt || 0) + 1;

  if (attempt < maxAttempts) {
    // Reschedule with exponential backoff
    const delay = Math.min(60000, 1000 * Math.pow(2, attempt));
    const scheduledFor = new Date(Date.now() + delay).toISOString();

    await supabase
      .from('job_queue')
      .update({
        status: 'pending',
        attempt,
        error_message: error,
        scheduled_for: scheduledFor,
      })
      .eq('id', jobId);
  } else {
    // Max attempts reached, mark as failed
    await supabase
      .from('job_queue')
      .update({
        status: 'failed',
        error_message: error,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}
