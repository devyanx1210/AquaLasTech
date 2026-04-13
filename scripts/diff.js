const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const target = process.argv[2]
if (!target || (target !== 'client' && target !== 'server')) {
    process.exit(1)
}

const outputFile = target === 'client' ? 'left.txt' : 'right.txt'
const outputDir = path.join(__dirname, '..', 'output')
fs.mkdirSync(outputDir, { recursive: true })
const outputPath = path.join(outputDir, outputFile)

try {
    const result = execSync(`git diff ${target}`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
    })
    if (!result || result.trim() === '') {
        fs.writeFileSync(outputPath, `No changes detected in /${target} since last commit.`, 'utf8')
    } else {
        fs.writeFileSync(outputPath, result, 'utf8')
    }
} catch (err) {
    fs.writeFileSync(outputPath, err.stdout || err.message || 'git diff failed', 'utf8')
}
