"""Deploy an immutable Compose release. The state directory lives on the deployment host."""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

SERVICES = ('backend', 'worker', 'decision-service', 'frontend', 'redis')

def atomic_json(path, data):
    with tempfile.NamedTemporaryFile('w', dir=path.parent, delete=False) as out:
        json.dump(data, out)
        out.flush()
        os.fsync(out.fileno())
    os.replace(out.name, path)

def validate(manifest):
    if not re.fullmatch(r'[0-9a-f]{40}', manifest['revision']):
        raise ValueError('Expected full Git revision')
    for name in ('backend', 'decision-service', 'frontend', 'redis'):
        if not re.fullmatch(r'[a-z0-9./_-]+@sha256:[0-9a-f]{64}', manifest['images'][name]):
            raise ValueError('Expected an image digest for ' + name)

def transition(state, revision, apply, stop_first):
    current_file = state / 'current.json'
    pending_file = state / 'pending.json'
    previous = json.loads(current_file.read_text())['revision'] if current_file.exists() else None
    def record(status, rev):
        with (state / 'history.jsonl').open('a') as out:
            out.write(json.dumps(dict(status=status, revision=rev, time=datetime.now(timezone.utc).isoformat())) + '\n')
    def restore(first):
        if previous:
            apply(previous)
        else:
            stop_first(first)
        record('restored', previous)
        pending_file.unlink(missing_ok=True)
    if pending_file.exists():
        restore(json.loads(pending_file.read_text())['revision'])
    atomic_json(pending_file, {'revision':revision})
    try:
        apply(revision)
    except Exception:
        record('verification_failed', revision)
        restore(revision)
        raise
    atomic_json(current_file, {'revision':revision, 'previous':previous if revision != previous else json.loads(current_file.read_text()).get('previous')})
    record('verified', revision)
    pending_file.unlink()

def main():
    import fcntl  # Deployment hosts run Linux.
    parser = argparse.ArgumentParser()
    parser.add_argument('manifest', nargs='?')
    parser.add_argument('--rollback', action='store_true')
    args = parser.parse_args()
    state = Path(os.environ['GAVEL_RELEASE_STATE']).resolve()
    state.mkdir(parents=True, exist_ok=True)
    root = Path(__file__).resolve().parents[1]
    envfile = Path(os.environ['GAVEL_ENV_FILE']).resolve(strict=True)
    project = os.environ.get('GAVEL_COMPOSE_PROJECT','gavel')
    def run(*args, output=False):
        return subprocess.run(args, check=True, text=True, stdout=subprocess.PIPE if output else None).stdout
    def compose(rev):
        dest = state / rev
        return ['docker','compose','--project-name',project,'--env-file',str(envfile),'-f',str(dest/'compose.yml'),'-f',str(dest/'no-build.yml'),'-f',str(dest/'images.json')]
    def apply(rev):
        cmd = compose(rev)
        run(*cmd,'pull')
        run(*cmd,'up','--no-build','--detach','--wait','--wait-timeout','240')
        images = json.loads((state/rev/'images.json').read_text())['services']
        for name in SERVICES:
            cid = run(*cmd,'ps','-q',name,output=True).strip()
            if not cid or run('docker','inspect','--format','{{.Config.Image}}',cid,output=True).strip() != images[name]['image']:
                raise RuntimeError('Unexpected running image for '+name)
        run(*cmd,'exec','-T','decision-service','python','-c',
            "import urllib.request,json; assert json.load(urllib.request.urlopen('http://127.0.0.1:8090/readyz',timeout=10))['ready']")
        run(*cmd,'exec','-T','worker','node','-e',
            "if(Date.now()-require('fs').statSync('/tmp/gavel-worker-ready').mtimeMs>90000)process.exit(1)")
        fixture = json.loads((state/rev/'engine-py/tests/fixtures/parity.json').read_text())['cases'][0]
        probe = (state/rev/'release/engine_smoke.py').read_text()
        subprocess.run([*cmd,'exec','-T','decision-service','python','-c',probe],input=json.dumps(fixture),text=True,check=True)
        subprocess.run(['node', str(state/rev/'release/smoke.cjs')], check=True,
                       env={**os.environ, 'NODE_PATH':str(root/'node_modules'), 'GAVEL_EXPECTED_REVISION':rev})
    with (state/'deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if args.rollback:
            revision = json.loads((state/'current.json').read_text())['previous']
            if not revision: raise ValueError('No previous verified release')
        else:
            manifest = json.loads(Path(args.manifest).read_text())
            validate(manifest)
            revision = manifest['revision']
            dest = state / revision
            image_map = {'services': {s:{'image':manifest['images']['backend' if s=='worker' else s]} for s in SERVICES}}
            image_map['services']['worker']['healthcheck'] = {
                'disable': False, 'test':['CMD','node','-e',"if(Date.now()-require('fs').statSync('/tmp/gavel-worker-ready').mtimeMs>90000)process.exit(1)"],
                'interval':'10s','timeout':'3s','retries':8,'start_period':'20s'}
            if dest.exists():
                if json.loads((dest/'images.json').read_text()) != image_map:
                    raise ValueError('Revision already recorded with different digests')
            else:
                with tempfile.TemporaryDirectory(dir=state) as tmp:
                    bundle = Path(tmp)/'bundle'
                    bundle.mkdir()
                    shutil.copyfile(root/'docker-compose.yml',bundle/'compose.yml')
                    (bundle/'no-build.yml').write_text('services:\n' + ''.join(
                        '  ' + name + ':\n    build: !reset null\n' for name in SERVICES if name != 'redis'))
                    for file in ('release/smoke.cjs','release/engine_smoke.py','engine-py/tests/fixtures/parity.json','e2e/fixtures/statement-valid.pdf'):
                        (bundle/file).parent.mkdir(parents=True, exist_ok=True)
                        shutil.copyfile(root/file,bundle/file)
                    atomic_json(bundle/'images.json', image_map)
                    bundle.rename(dest)
        if not (state/'current.json').exists() and not (state/'pending.json').exists():
            if run('docker','ps','-aq','--filter','label=com.docker.compose.project='+project,output=True).strip():
                raise RuntimeError('Unmanaged Compose project already exists; use a separate project/host for cutover')
        transition(state, revision, apply, lambda rev: run(*compose(rev),'down'))
if __name__ == '__main__':
    main()
