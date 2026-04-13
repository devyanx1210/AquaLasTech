// scripts/diff.js
// Usage: node scripts/diff.js client   → saves git diff of /client to output/left.txt
//        node scripts/diff.js server   → saves git diff of /server to output/right.txt

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Read which folder to diff from the command-line argument
// process.argv[0] = node, process.argv[1] = this file, process.argv[2] = "client" or "server"
const target = process.argv[2]

if (!target || (target !== 'client' && target !== 'server')) {
    console.error('Usage: node scripts/diff.js client   OR   node scripts/diff.js server')
    process.exit(1)
}

// Map target to output file name
const outputFile = target === 'client' ? 'left.txt' : 'right.txt'

// Make sure the output folder exists (creates it if it does not)
const outputDir = path.join(__dirname, '..', 'output')
fs.mkdirSync(outputDir, { recursive: true })

const outputPath = path.join(outputDir, outputFile)

try {
    // Run git diff for the target folder
    // execSync runs a shell command and returns its output as a Buffer
    const result = execSync(`git diff ${target}`, {
        cwd: path.join(__dirname, '..'),   // run from the project root
        encoding: 'utf8',
        // Do not throw on non-zero exit — git diff exits 1 when there are differences
        stdio: ['pipe', 'pipe', 'pipe']
    })

    if (!result || result.trim() === '') {
        fs.writeFileSync(outputPath, `No changes detected in /${target} since last commit.`, 'utf8')
    } else {
        fs.writeFileSync(outputPath, result, 'utf8')
    }

} catch (err) {
    // execSync throws if the command itself fails (not just returns non-zero)
    const msg = err.stdout || err.message || 'git diff failed'
    fs.writeFileSync(outputPath, msg, 'utf8')
}
