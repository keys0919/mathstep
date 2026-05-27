const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.resolve(ROOT, 'dist');
const GIT_DIR = path.join(DIST, '.git');
const GIT_BACKUP = path.join(os.tmpdir(), 'mathstep_git_backup');
const version = Date.now().toString();

console.log(`\n빌드 시작 (버전: ${version})\n`);

// 1. .git 임시 보존 (expo export가 dist/ 초기화하므로)
if (fs.existsSync(GIT_DIR)) {
  fs.renameSync(GIT_DIR, GIT_BACKUP);
}

try {
  // 2. 빌드
  execSync('npx expo export -p web', { stdio: 'inherit', cwd: ROOT });
} finally {
  // 3. .git 복원 (빌드 성공/실패 무관)
  if (fs.existsSync(GIT_BACKUP)) {
    fs.renameSync(GIT_BACKUP, GIT_DIR);
  }
}

// 4. 최초 실행 시 git 초기화
if (!fs.existsSync(GIT_DIR)) {
  execSync('git init', { cwd: DIST });
  execSync('git remote add origin git@github.com:keys0919/mathstep.git', { cwd: DIST });
  execSync('git branch -M main', { cwd: DIST });
}

// 5. sw.js 버전 주입
const swPath = path.join(DIST, 'sw.js');
const sw = fs.readFileSync(swPath, 'utf8').replace('__BUILD_VERSION__', version);
fs.writeFileSync(swPath, sw);

// 6. .nojekyll (GitHub Pages Jekyll 차단 방지)
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

// 7. 아이콘 복사
const iconSrc = path.resolve(ROOT, 'public/icons');
const iconDest = path.join(DIST, 'icons');
if (fs.existsSync(iconSrc)) {
  fs.mkdirSync(iconDest, { recursive: true });
  for (const file of fs.readdirSync(iconSrc)) {
    fs.copyFileSync(path.join(iconSrc, file), path.join(iconDest, file));
  }
}

// 8. git push
console.log('\nGitHub에 배포 중...\n');
execSync('git add -A', { cwd: DIST, stdio: 'inherit' });

try {
  execSync(`git commit -m "deploy: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}"`, { cwd: DIST, stdio: 'inherit' });
} catch {
  console.log('변경사항 없음, 스킵');
  process.exit(0);
}

execSync('git push origin main --force', { cwd: DIST, stdio: 'inherit' });

console.log('\n배포 완료. 앱 껐다 키면 자동 업데이트됩니다.\n');
