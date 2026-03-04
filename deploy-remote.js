const { Client } = require('ssh2');

const HOST = '45.132.19.173';
const USER = 'root';
const PASS = 'TYu7HjWq96';

function runSSH(commands) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const results = [];

        conn.on('ready', () => {
            console.log('✅ SSH подключён к', HOST);
            runNext(0);
        });

        function runNext(i) {
            if (i >= commands.length) {
                conn.end();
                resolve(results);
                return;
            }

            const { label, cmd } = commands[i];
            console.log(`\n⏳ [${label}]`);
            console.log('$', cmd);

            conn.exec(cmd, (err, stream) => {
                if (err) { reject(err); return; }
                let out = '';
                let errOut = '';
                stream.on('data', d => { out += d; process.stdout.write(d); });
                stream.stderr.on('data', d => { errOut += d; process.stderr.write(d); });
                stream.on('close', (code) => {
                    results.push({ label, code, out, errOut });
                    console.log(`\n→ exit code: ${code}`);
                    runNext(i + 1);
                });
            });
        }

        conn.on('error', reject);
        conn.connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 15000 });
    });
}

async function deploy() {
    // Шаг 1: найти проект
    const findResult = await runSSH([
        { label: 'Find project', cmd: 'find /var/www /root /home -name "package.json" -maxdepth 5 2>/dev/null | grep -v node_modules | head -20' },
        { label: 'Check git dirs', cmd: 'find /var/www /root /home -name ".git" -maxdepth 5 -type d 2>/dev/null | head -10' },
        { label: 'PM2 list', cmd: 'pm2 list --no-color 2>/dev/null || echo "PM2 not found"' },
    ]);

    const gitDirs = findResult[1].out.trim();
    const packageFiles = findResult[0].out.trim();

    console.log('\n\n📂 Найденные git-репозитории:');
    console.log(gitDirs || 'Не найдено');
    console.log('\n📦 Найденные package.json:');
    console.log(packageFiles || 'Не найдено');

    // Определяем путь к проекту по git dirs или package.json
    let projectPath = null;
    const lines = gitDirs.split('\n').filter(Boolean);
    for (const line of lines) {
        if (line.includes('drum') || line.includes('barrel') || line.includes('roulette') || line.includes('барабан') || line.includes('БАРАБАН')) {
            projectPath = line.replace('/.git', '');
            break;
        }
    }
    if (!projectPath && lines.length > 0) {
        projectPath = lines[0].replace('/.git', '');
    }

    if (!projectPath) {
        console.log('\n❌ Не удалось автоматически найти путь к проекту. Укажи его вручную.');
        return;
    }

    console.log(`\n🎯 Путь к проекту: ${projectPath}`);
    console.log('\n🚀 Начинаю деплой...\n');

    await runSSH([
        { label: 'Git status', cmd: `cd ${projectPath} && git status` },
        { label: 'Git stash', cmd: `cd ${projectPath} && git stash || echo "nothing to stash"` },
        { label: 'Git pull', cmd: `cd ${projectPath} && git pull origin main` },
        { label: 'Backend npm install', cmd: `cd ${projectPath}/backend && npm install --prefer-offline 2>&1 | tail -5` },
        { label: 'Prisma db push', cmd: `cd ${projectPath}/backend && npx prisma db push --accept-data-loss 2>&1 | tail -10` },
        // Build BEFORE restart — PM2 picks up fresh dist/
        { label: 'Backend build', cmd: `cd ${projectPath}/backend && npm run build 2>&1 | tail -10` },
        { label: 'PM2 restart backend', cmd: `pm2 restart drum-backend --update-env --no-color 2>&1 || pm2 start ${projectPath}/backend/dist/server.js --name drum-backend --no-color 2>&1` },
        { label: 'Frontend npm install', cmd: `cd ${projectPath}/frontend && npm install --prefer-offline 2>&1 | tail -5` },
        { label: 'Frontend build', cmd: `cd ${projectPath}/frontend && npm run build 2>&1 | tail -15` },
        { label: 'PM2 save', cmd: `pm2 save --no-color 2>&1` },
        { label: 'Final PM2 status', cmd: 'pm2 list --no-color' },
    ]);

    console.log('\n✅ Деплой завершён!');
}

deploy().catch(err => {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
});
