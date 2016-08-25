const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const archiver = require('archiver');


const packageJSON = getJSON('package.json');
const manifestJSON = getJSON('manifest.json');


bumpRelease();
buildZipFile();
gitCommitAndTag();

function getJSON(fileName) {
  const data = fs.readFileSync(path.join(__dirname, fileName), 'utf8');
  return JSON.parse(data.slice().toString());
}

function bumpRelease() {
  const version = packageJSON.version.split('.');
  const releaseType = process.argv[2];

  if (!releaseType) {
   ++version[2];

  } else if (releaseType === 'minor') {
   ++version[1];
    version[2] = 0;
  } else {
   ++version[0];
    version[1] = version[2] = 0;
  }

  global.versionStr = version.join('.');

  packageJSON.version = manifestJSON.version = versionStr;
  fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(packageJSON, null, '  '));
  fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(manifestJSON, null, '  '));
}

function buildZipFile() {

  npmBuild('production');
  createDistDir();
  createZipFile();

  function npmBuild(env) {
    process.env.NODE_ENV = env;
    execSync(`NODE_ENV=${env} npm run build`);
  }

  function createDistDir() {
    var dir = path.join(__dirname, 'dist');

    try {
      fs.accessSync(dir);
    } catch (e) {
      fs.mkdirSync(dir);
    }
  }

  function createZipFile() {
    const output = fs.createWriteStream('dist/httpolice-devtool-' + versionStr + '.zip');
    const archive = archiver('zip');

    archive.pipe(output);
    archive.bulk([
      { expand: true, cwd: 'builds', src: ['**']}
    ]);
    archive.finalize();

    output.on('close', () => {
      // rebuild /builds extension with sourcemap enabled
      npmBuild('');
    });
  }

}

function gitCommitAndTag() {
  execSync('git add manifest.json package.json');
  execSync('git commit -m ' + versionStr);
  execSync('git tag ' + versionStr);
}
