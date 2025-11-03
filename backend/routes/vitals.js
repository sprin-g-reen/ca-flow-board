import express from 'express';
import si from 'systeminformation';
import os from 'os';
import { promisify } from 'util';
import { exec as _exec } from 'child_process';

const exec = promisify(_exec);

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [cpu, mem, time, proc] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.time(),
      si.processes().catch(() => null),
    ]);

    // Derive thread and process counts when available
    let processes = undefined;
    let threadCount = undefined;
    if (proc) {
      processes = proc.all ?? (Array.isArray(proc.list) ? proc.list.length : undefined);
      if (Array.isArray(proc.list)) {
        try {
          threadCount = proc.list.reduce((sum, p) => sum + (p.threads || 0), 0);
        } catch (_) {
          threadCount = undefined;
        }
      }
    }

    // macOS fallback: systeminformation may report 0 threads on darwin
    if ((threadCount === undefined || threadCount === 0 || Number.isNaN(threadCount)) && process.platform === 'darwin') {
      try {
        const { stdout: thrOut } = await exec('sysctl -n kern.num_threads');
        const { stdout: taskOut } = await exec('sysctl -n kern.num_tasks');
        const thr = parseInt((thrOut || '').toString().trim(), 10);
        const tasks = parseInt((taskOut || '').toString().trim(), 10);
        if (Number.isFinite(thr) && thr > 0) threadCount = thr;
        if ((processes === undefined || processes === 0) && Number.isFinite(tasks) && tasks > 0) processes = tasks;
      } catch (e) {
        // ignore fallback errors
      }
    }

    res.json({
      cpu: {
        load: `${Number(cpu.currentLoad || 0).toFixed(2)}%`,
        system: cpu.currentLoadSystem !== undefined ? `${Number(cpu.currentLoadSystem).toFixed(2)}%` : undefined,
        user: cpu.currentLoadUser !== undefined ? `${Number(cpu.currentLoadUser).toFixed(2)}%` : undefined,
        idle: cpu.currentLoadIdle !== undefined ? `${Number(cpu.currentLoadIdle).toFixed(2)}%` : undefined,
      },
      memory: {
        used: (mem.used / 1024 / 1024 / 1024).toFixed(2),
        total: (mem.total / 1024 / 1024 / 1024).toFixed(2),
        usage: `${((mem.used / mem.total) * 100).toFixed(2)}%`,
      },
      uptime: time.uptime,
      loadAverages: (() => {
        const [one, five, fifteen] = os.loadavg();
        return {
          oneMin: Number.isFinite(one) ? Number(one).toFixed(2) : undefined,
          fiveMin: Number.isFinite(five) ? Number(five).toFixed(2) : undefined,
          fifteenMin: Number.isFinite(fifteen) ? Number(fifteen).toFixed(2) : undefined,
        };
      })(),
      // normalized names used by frontend
      processes,
      processCount: processes,
      threads: threadCount,
      threadCount,
    });
  } catch (error) {
    console.error('Error fetching system vitals:', error);
    res.status(500).json({ message: 'Failed to fetch system vitals' });
  }
});

export default router;
