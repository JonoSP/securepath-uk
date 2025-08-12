// scripts/validate-secrets.js
// Validates that no secrets are exposed in code

const fs = require('fs');
const path = require('path');

const secretPatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /private[_-]?key/i,
    /aws[_-]?access/i,
    /stripe/i
];

const excludePaths = [
    'node_modules',
    '.git',
    '.env.example',
    'validate-secrets.js'
];

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    lines.forEach((line, index) => {
        secretPatterns.forEach(pattern => {
            if (pattern.test(line) && line.includes('=') && !line.includes('process.env')) {
                // Check if it looks like a hardcoded secret
                const match = line.match(/['"\]([^'"\]{20,})['"\]/);
                if (match) {
                    issues.push({
                        file: filePath,
                        line: index + 1,
                        content: line.trim()
                    });
                }
            }
        });
    });
    
    return issues;
}

console.log('🔍 Scanning for exposed secrets...\n');

// Scan all JS files
const allIssues = [];
// Simplified for now - would be recursive in production
const files = fs.readdirSync('src').filter(f => f.endsWith('.js'));

files.forEach(file => {
    const issues = scanFile(path.join('src', file));
    allIssues.push(...issues);
});

if (allIssues.length > 0) {
    console.error('❌ Potential secrets found in code:');
    allIssues.forEach(issue => {
        console.error(\  \:\ - \\);
    });
    process.exit(1);
} else {
    console.log('✅ No exposed secrets found!');
}
