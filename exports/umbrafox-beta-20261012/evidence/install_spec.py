import os
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace
from pathlib import Path

from install_beta import inactive, directory_stamp, verify_tree
from package_beta import common


class InstallTests(unittest.TestCase):
    def test_active_and_deleted_executable_reject(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as name:
            root = Path(name)
            proc = root / 'proc'
            (proc / '123').mkdir(parents=True)
            target = root / 'install'
            for suffix in ('/umbrafox', '/umbrafox (deleted)'):
                link = proc / '123/exe'
                link.symlink_to(str(target) + suffix)
                with self.assertRaises(ValueError):
                    inactive(target, proc)
                link.unlink()
            (proc / '123/exe').symlink_to(str(target) + '-other/umbrafox')
            self.assertEqual(inactive(target, proc), [])

    def test_identity_and_aliases(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as name:
            root = Path(name)
            first = directory_stamp(root)
            root.chmod(0o755)
            with self.assertRaises(ValueError):
                directory_stamp(root)
            root.chmod(0o700)
            self.assertEqual(directory_stamp(root), first)
            alias = root / 'alias'
            alias.symlink_to(root)
            with self.assertRaises(ValueError):
                directory_stamp(alias)

    def test_permission_fallback_must_identify_executable(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as name:
            root = Path(name)
            (root / '123').mkdir()
            with patch('install_beta.os.readlink', side_effect=PermissionError):
                with patch('install_beta.subprocess.run', return_value=SimpleNamespace(stdout='/usr/lib/systemd/systemd\n')):
                    self.assertEqual(inactive(root / 'install', root), [])
                with patch('install_beta.subprocess.run', side_effect=RuntimeError('unreadable')):
                    with self.assertRaises(RuntimeError):
                        inactive(root / 'install', root)

    def test_payload_mutation_and_extra_file_reject(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as name:
            root = Path(name)
            (root / 'binary').write_bytes(b'original')
            files = common.tree_snapshot(root)
            verify_tree(root, files)
            (root / 'binary').write_bytes(b'mutated')
            with self.assertRaises(ValueError):
                verify_tree(root, files)
            (root / 'binary').write_bytes(b'original')
            (root / 'extra').touch()
            with self.assertRaises(ValueError):
                verify_tree(root, files)


if __name__ == '__main__':
    unittest.main()
