import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let isConnected = false;

export const connectRedis = async (): Promise<RedisClientType | null> => {
  if (redisClient && isConnected) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis reconnection failed after 10 attempts');
            return new Error('Max retries reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis');
      isConnected = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.warn('Redis connection failed. Using in-memory fallback:', error);
    isConnected = false;
    return null;
  }
};

export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

export const isRedisConnected = (): boolean => {
  return isConnected;
};

// ==================== Workflow State Management ====================

interface WorkflowState {
  workflowId: string;
  applicationId: string;
  currentStage: string;
  stageHistory: Array<{
    stage: string;
    startedAt: string;
    completedAt?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    data?: any;
  }>;
  context: Record<string, any>;
  metadata: {
    workflowType: string;
    startedAt: string;
    updatedAt: string;
    completedAt?: string;
  };
}

const inMemoryWorkflows: Map<string, WorkflowState> = new Map();

export const workflowStorage = {
  async save(workflow: WorkflowState): Promise<void> {
    if (redisClient && isConnected) {
      await redisClient.set(
        `workflow:${workflow.workflowId}`,
        JSON.stringify(workflow),
        { EX: 86400 * 7 } // 7 days TTL
      );
    } else {
      inMemoryWorkflows.set(workflow.workflowId, workflow);
    }
  },

  async get(workflowId: string): Promise<WorkflowState | null> {
    if (redisClient && isConnected) {
      const data = await redisClient.get(`workflow:${workflowId}`);
      return data ? JSON.parse(data) : null;
    }
    return inMemoryWorkflows.get(workflowId) || null;
  },

  async getByApplication(applicationId: string): Promise<WorkflowState | null> {
    if (redisClient && isConnected) {
      const keys = await redisClient.keys(`workflow:*`);
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const workflow = JSON.parse(data);
          if (workflow.applicationId === applicationId) {
            return workflow;
          }
        }
      }
    }
    for (const workflow of inMemoryWorkflows.values()) {
      if (workflow.applicationId === applicationId) {
        return workflow;
      }
    }
    return null;
  },

  async list(params?: { status?: string; limit?: number; offset?: number }): Promise<WorkflowState[]> {
    const limit = params?.limit || 100;
    const offset = params?.offset || 0;
    let workflows: WorkflowState[] = [];

    if (redisClient && isConnected) {
      const keys = await redisClient.keys(`workflow:*`);
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          workflows.push(JSON.parse(data));
        }
      }
    } else {
      workflows = Array.from(inMemoryWorkflows.values());
    }

    if (params?.status) {
      workflows = workflows.filter(w => w.currentStage === params.status);
    }

    return workflows.slice(offset, offset + limit);
  },

  async delete(workflowId: string): Promise<void> {
    if (redisClient && isConnected) {
      await redisClient.del(`workflow:${workflowId}`);
    }
    inMemoryWorkflows.delete(workflowId);
  },

  async update(workflowId: string, updates: Partial<WorkflowState>): Promise<void> {
    const workflow = await this.get(workflowId);
    if (workflow) {
      const updated = { ...workflow, ...updates, metadata: { ...workflow.metadata, updatedAt: new Date().toISOString() } };
      await this.save(updated);
    }
  }
};

// ==================== Session/Queue Management ====================

export const queueManagement = {
  async enqueue(queue: string, job: any): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const jobData = { id: jobId, ...job, queuedAt: new Date().toISOString() };

    if (redisClient && isConnected) {
      await redisClient.lPush(queue, JSON.stringify(jobData));
      await redisClient.expire(queue, 86400 * 7);
    } else {
      const queueData = inMemoryQueues.get(queue) || [];
      queueData.unshift(jobData);
      inMemoryQueues.set(queue, queueData);
    }

    return jobId;
  },

  async dequeue(queue: string, timeout = 5000): Promise<any | null> {
    if (redisClient && isConnected) {
      const result = await redisClient.brPop(queue, timeout);
      if (result) {
        return JSON.parse(result.element);
      }
    } else {
      const queueData = inMemoryQueues.get(queue) || [];
      const job = queueData.pop();
      inMemoryQueues.set(queue, queueData);
      return job || null;
    }
    return null;
  },

  async getQueueLength(queue: string): Promise<number> {
    if (redisClient && isConnected) {
      return await redisClient.lLen(queue);
    }
    return (inMemoryQueues.get(queue) || []).length;
  }
};

const inMemoryQueues: Map<string, any[]> = new Map();

// ==================== Cache Management ====================

export const cacheManager = {
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    if (redisClient && isConnected) {
      await redisClient.setEx(`cache:${key}`, ttl, JSON.stringify(value));
    }
  },

  async get<T>(key: string): Promise<T | null> {
    if (redisClient && isConnected) {
      const data = await redisClient.get(`cache:${key}`);
      return data ? JSON.parse(data) : null;
    }
    return null;
  },

  async delete(key: string): Promise<void> {
    if (redisClient && isConnected) {
      await redisClient.del(`cache:${key}`);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    if (redisClient && isConnected) {
      const keys = await redisClient.keys(`cache:${pattern}`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
  }
};

export default { connectRedis, workflowStorage, queueManagement, cacheManager };