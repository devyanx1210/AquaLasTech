const { execSync } = require('child_process')
const run = (cmd) => execSync(cmd, { stdio: 'ignore' })
try { run('git add .') } catch (_) {}
try { run('git commit -m "Changes"') } catch (_) {}
try { run('git checkout finel') } catch (_) {}
