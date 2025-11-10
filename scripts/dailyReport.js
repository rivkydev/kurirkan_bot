// ============================================
// FILE: scripts/dailyReport.js
// ============================================

const mongoose = require('mongoose');
const config = require('../config/config');
const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

async function generateAndSendDailyReport() {
  try {
    await mongoose.connect(config.database.url);
    logger.info('Generating daily report...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const report = await analyticsService.generateDailyReport(yesterday);
    const formattedReport = analyticsService.formatReportForWhatsApp(report);

    console.log(formattedReport);

    // TODO: Send to admin WhatsApp
    // await client.sendMessage(ADMIN_PHONE, formattedReport);

    logger.info('Daily report generated successfully');
    
    // Save report to file
    const fs = require('fs');
    const reportPath = `./reports/daily-${report.date}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    process.exit(0);
  } catch (error) {
    logger.error('Error generating daily report:', error);
    process.exit(1);
  }
}

generateAndSendDailyReport();