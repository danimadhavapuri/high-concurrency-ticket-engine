import cluster from 'node:cluster';
import os from 'node:os';
import path from 'node:path';

/**
 * High-Concurrency Cluster Manager:
 * Utilizes 100% of available CPU cores by spawning dedicated Node.js worker processes.
 * Distributes incoming 10k+ traffic via OS-level round-robin scheduling.
 * Includes automated self-healing to reboot any worker that encounters fatal exceptions.
 */
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`\n======================================================`);
  console.log(`⚡ HIGH-CONCURRENCY MULTI-CORE CLUSTER MANAGER`);
  console.log(`💻 Detected ${numCPUs} available CPU Cores`);
  console.log(`🚀 Spawning ${numCPUs} independent worker engines...`);
  console.log(`======================================================\n`);

  // Fork a worker process for every CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Self-Healing Watchdog: Automatically revive any worker that dies under extreme traffic
  cluster.on('exit', (worker, code, signal) => {
    console.warn(`⚠️ Worker [PID ${worker.process.pid}] exited (code: ${code}, signal: ${signal}). Reviving worker...`);
    const newWorker = cluster.fork();
    console.log(`✔ Replacement Worker [PID ${newWorker.process.pid}] online.`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Gracefully terminating all cluster workers...');
    for (const id in cluster.workers) {
      cluster.workers[id]?.kill();
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} else {
  // Worker process: Boot the server engine on this specific CPU core
  import('./server');
}
