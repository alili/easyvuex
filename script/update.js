const util = require('util');
const exec = util.promisify(require('child_process').exec);

const updateType = process.argv[2] || 'patch';

async function main() {
  try {
    let oldVersion = await _exec(
      'git describe --tags `git rev-list --tags --max-count=1`'
    ); // 获取当前最新版本
    let version = await _exec(`npm version ${updateType} --no-git-tag-version`); //

    await _exec('git add .');
    let history = await _exec(`git shortlog ${oldVersion}..  --no-merges`);
    await _exec(`git commit -m \"${version}\n\n${history}\"`);
    await _exec(`git tag ${version}`);
    await _exec('npm pub');
    await _exec('git push');
  } catch (error) {
    console.log(`error:`, error);
  }
}

main();

async function _exec(str) {
  let res = await exec(str);
  if (res.stderr) {
    throw res.stderr;
  } else {
    res = res.stdout.trim();
    return res;
  }
}
