export interface Job {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  videoUrl?: string
  error?: string
  createdAt: number
  completedAt?: number
}

// Déclarer un type global pour stocker le JobManager à travers les rechargements HMR
declare global {
  var __jobManagerInstance: JobManager | undefined
  var __jobManagerCleanupInterval: NodeJS.Timeout | undefined
}

class JobManager {
  private jobs: Map<string, Job> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // En développement, réutiliser les jobs existants pour survivre au HMR
    if (process.env.NODE_ENV === 'development' && global.__jobManagerInstance) {
      console.log('🔄 HMR: Réutilisation du JobManager existant avec', global.__jobManagerInstance.getAllJobs().length, 'jobs')
      this.jobs = global.__jobManagerInstance.jobs
      this.cleanupInterval = global.__jobManagerCleanupInterval!
      return
    }

    // Nettoyage automatique des jobs terminés après 30 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      const MAX_AGE = 30 * 60 * 1000 // 30 minutes

      for (const [jobId, job] of this.jobs.entries()) {
        if (job.completedAt && (now - job.completedAt > MAX_AGE)) {
          this.jobs.delete(jobId)
          console.log(`🧹 Cleaned up old job: ${jobId}`)
        }
      }
    }, 10 * 60 * 1000) // Vérifier toutes les 10 minutes

    // Stocker l'interval globalement pour le HMR
    global.__jobManagerCleanupInterval = this.cleanupInterval
  }

  createJob(id: string): Job {
    const job: Job = {
      id,
      status: 'pending',
      progress: 0,
      message: 'En attente...',
      createdAt: Date.now()
    }

    this.jobs.set(id, job)
    return job
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id)
  }

  updateJob(id: string, updates: Partial<Job>): void {
    const job = this.jobs.get(id)
    if (job) {
      Object.assign(job, updates)

      if (updates.status === 'completed' || updates.status === 'failed') {
        job.completedAt = Date.now()
      }
    }
  }

  deleteJob(id: string): void {
    this.jobs.delete(id)
  }

  getAllJobs(): Job[] {
    return Array.from(this.jobs.values())
  }
}

// Instance singleton avec protection HMR
let jobManagerInstance: JobManager

if (process.env.NODE_ENV === 'development') {
  // En développement, stocker dans globalThis pour survivre au HMR
  if (!global.__jobManagerInstance) {
    console.log('✨ Création du JobManager initial')
    global.__jobManagerInstance = new JobManager()
  }
  jobManagerInstance = global.__jobManagerInstance
} else {
  // En production, instance normale
  jobManagerInstance = new JobManager()
}

export const jobManager = jobManagerInstance
