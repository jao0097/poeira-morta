// Junta os arquivos de src/ em um único poeira-morta.html jogável.
// Uso: node build.js   (ou: node build.js --watch)
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, 'src'), OUT = path.join(__dirname, 'poeira-morta.html');
const THREE_CDN = '<script src="vendor/three.min.js"></script>';
const ERR = "window.addEventListener('error',e=>{const l=document.getElementById('loading');if(l&&!l.classList.contains('hidden')){l.textContent='Erro ao iniciar: '+e.message;l.style.fontSize='22px';}});";
function build() {
  const files = fs.readdirSync(SRC).sort();
  const head = files.filter(f => f.endsWith('.html') && !f.startsWith('99'));
  const js = files.filter(f => f.endsWith('.js'));
  const tail = files.filter(f => f.startsWith('99'));
  const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
  const out = head.map(read).join('\n') + '\n' + THREE_CDN + '\n<script>\n' + ERR + '\n' + js.map(read).join('\n') + '\n' + tail.map(read).join('\n');
  fs.writeFileSync(OUT, out);
  console.log(`poeira-morta.html gerado (${(out.length / 1024).toFixed(0)} KB) a partir de ${files.length} arquivos.`);
}
build();
if (process.argv.includes('--watch')) {
  console.log('Observando src/ ... (Ctrl+C para sair)');
  let t; fs.watch(SRC, () => { clearTimeout(t); t = setTimeout(build, 150); });
}
