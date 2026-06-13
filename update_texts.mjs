import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/var\(--gold\)/g, 'var(--accent)');
    content = content.replace(/C\&B/g, 'Biteck Ethan');
    fs.writeFileSync(filePath, content);
  }
});
