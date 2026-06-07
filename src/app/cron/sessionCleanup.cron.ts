import cron from 'node-cron';
import config from '../../config';
import prisma from '../../shared/prisma';

const cleanupOldSessions = async () => {
  const retentionDays = config.cron.session_cleanup_retention_days;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const result = await prisma.session.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      OR: [{ isRevoked: true }, { expiresAt: { lt: new Date() } }],
    },
  });

  console.log(
    `[Session Cleanup] Deleted ${result.count} session(s) older than ${retentionDays} days`
  );
};

export const startSessionCleanupCron = () => {
  const schedule = config.cron.session_cleanup_schedule;

  if (!cron.validate(schedule)) {
    console.warn(
      `[Session Cleanup] Invalid cron schedule "${schedule}" — cleanup job not started`
    );
    return;
  }

  cron.schedule(schedule, () => {
    cleanupOldSessions().catch((error) => {
      console.error('[Session Cleanup] Failed:', error);
    });
  });

  console.log(
    `[Session Cleanup] Scheduled (${schedule}), retention: ${config.cron.session_cleanup_retention_days} days`
  );
};
