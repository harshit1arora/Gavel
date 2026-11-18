import json
from pathlib import Path
import tempfile
import unittest
from deploy import transition, validate

class PromotionTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.state = Path(tmp.name)
        self.actions = []
    def apply(self, rev):
        self.actions.append(rev)
        if rev == 'bad':
            raise RuntimeError('synthetic decision mismatch')
    def deploy(self, rev):
        transition(self.state, rev, self.apply, lambda failed: self.actions.append('stop ' + failed))
    def test_verified_rollback(self):
        self.deploy('v1')
        self.deploy('v2')
        with self.assertRaises(RuntimeError):
            self.deploy('bad')
        self.assertEqual(self.actions, ['v1','v2','bad','v2'])
        self.assertEqual(json.loads((self.state/'current.json').read_text()), {'revision':'v2','previous':'v1'})
        self.assertIn('verification_failed',(self.state/'history.jsonl').read_text())
    def test_interrupted_and_initial_deployment(self):
        with self.assertRaises(RuntimeError):
            self.deploy('bad')
        self.assertEqual(self.actions,['bad','stop bad'])
        self.deploy('v1')
        (self.state/'pending.json').write_text('{"revision":"interrupted"}')
        self.deploy('v2')
        self.assertEqual(self.actions[-2:],['v1','v2'])
    def test_mutable_tag_is_rejected(self):
        with self.assertRaises(ValueError):
            validate({'revision':'f'*40,'images':{'backend':'repo:latest'}})
if __name__=='__main__':
    unittest.main()
