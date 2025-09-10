const { execSync } = require('child_process');
const Logger = require('./utils/logger');

async function updateVulnerablePackages() {
    const updates = [
        'npm audit fix --force',
        'npm update tar-fs@latest',
        'npm update express@latest',
        'npm update cors@latest'
    ];

    for (const command of updates) {
        try {
            Logger.info(`Executing: ${command}`);
            execSync(command, { stdio: 'inherit', cwd: __dirname });
            Logger.info(`Completed: ${command}`);
        } catch (error) {
            Logger.error(`Failed: ${command}`, error.message);
        }
    }
}

if (require.main === module) {
    updateVulnerablePackages();
}

module.exports = { updateVulnerablePackages };