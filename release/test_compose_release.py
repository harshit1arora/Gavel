"""Exercise the CLI state machine and actual Compose merge without a Docker daemon."""
import contextlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import deploy

@unittest.skipUnless(shutil.which('docker'), 'requires the Compose CLI')
class ComposeRelease(unittest.TestCase):
    def test_promotion_and_failed_rollout_keep_previous_digest_set(self):
        real_run = subprocess.run
        with tempfile.TemporaryDirectory() as tmp, contextlib.ExitStack() as stack:
            root = Path(tmp)
            env = root/'settings.env'
            env.write_text('NODE_ENV=production\n')
            manifest = root/'release.json'
            state = root/'state'
            running = {}
            def command(args, **kwargs):
                args = list(map(str,args))
                if args[:2] == ['docker','compose']:
                    op = args.index('images.json') if 'images.json' in args else next(i for i,a in enumerate(args) if a.endswith('images.json'))
                    action = args[op+1]
                    if action == 'up':
                        # Compose resolves the real environment, reset tags, digest and health overrides.
                        result = real_run(args[:op+1]+['config','--format','json'],capture_output=True,text=True,check=True)
                        services = json.loads(result.stdout)['services']
                        self.assertEqual(set(services),set(deploy.SERVICES))
                        self.assertFalse(any('build' in service for service in services.values()))
                        self.assertFalse(services['worker']['healthcheck'].get('disable',False))
                        running.update({s:services[s]['image'] for s in services})
                    out = args[-1] if action=='ps' else ''
                elif args[:2] == ['docker','inspect']:
                    out = running[args[-1]]
                elif args[0]=='node':
                    if kwargs['env']['GAVEL_EXPECTED_REVISION']=='b'*40:
                        raise subprocess.CalledProcessError(1,args)
                    out = ''
                else:
                    out = ''
                return subprocess.CompletedProcess(args,0,stdout=out)
            stack.enter_context(patch.dict(os.environ,{'GAVEL_ENV_FILE':str(env),'GAVEL_RELEASE_STATE':str(state)}))
            stack.enter_context(patch.object(sys,'argv',['deploy.py',str(manifest)]))
            if os.name=='nt':
                from types import SimpleNamespace
                stack.enter_context(patch.dict(sys.modules,{'fcntl':SimpleNamespace(flock=lambda *_:None,LOCK_EX=1)}))
            stack.enter_context(patch.object(deploy.subprocess,'run',side_effect=command))
            def release(letter):
                images = {s:'example/'+s+'@sha256:'+letter*64 for s in deploy.SERVICES if s!='worker'}
                manifest.write_text(json.dumps({'revision':letter*40,'images':images}))
                deploy.main()
            release('a')
            saved = dict(running)
            with self.assertRaises(subprocess.CalledProcessError):
                release('b')
            self.assertEqual(running,saved)
            self.assertEqual(json.loads((state/'current.json').read_text())['revision'],'a'*40)
            self.assertFalse((state/'pending.json').exists())
if __name__=='__main__':
    unittest.main()
