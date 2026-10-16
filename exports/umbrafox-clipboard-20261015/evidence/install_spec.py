import contextlib
import io
import json
import tarfile
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import install_prototype as installer


class InstallPrototypeTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.programs = self.root / 'Programs'
        self.programs.mkdir()
        self.target = self.programs / 'umbrafox-nightly'
        self.target.mkdir(mode=0o700)
        (self.target / 'old').write_bytes(b'old package')
        (self.programs / 'umbrafox').write_bytes(b'unchanged launcher')
        self.export = self.root / 'export'
        self.export.mkdir()
        payload = self.root / 'umbrafox'
        payload.mkdir()
        (payload / 'umbrafox').write_bytes(b'new package fixture, not executable')
        archive = self.export / 'package.tar.xz'
        with tarfile.open(archive, 'x:xz') as output:
            output.add(payload, arcname='umbrafox')
        self.manifest = {
            'archive': {'name': archive.name, 'sha256': installer.common.file_digest(archive)},
            'files': installer.common.tree_snapshot(payload), 'buildID': '20261015235226',
        }
        self.save_manifest()
        self.receipt = self.root / 'receipt.json'

    def save_manifest(self):
        (self.export / 'package-input.json').write_text(json.dumps(self.manifest))

    def install(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return installer.install(self.export, self.programs, self.receipt)

    def test_verified_package_replaces_inactive_tree_and_preserves_launcher(self):
        with patch.object(installer.previous_install, 'inactive') as inactive:
            receipt = self.install()
        self.assertEqual(inactive.call_count, 2)
        self.assertEqual((self.target / 'umbrafox').read_bytes(), b'new package fixture, not executable')
        self.assertEqual((Path(receipt['backup']) / 'old').read_bytes(), b'old package')
        self.assertEqual((self.programs / 'umbrafox').read_bytes(), b'unchanged launcher')
        self.assertTrue((self.target / '.purgecaches').exists())
        self.assertTrue(receipt['activationPending'])

    def test_active_before_staging_or_before_swap_rejects(self):
        for outcomes in [[ValueError('active')], [None, ValueError('active')]]:
            with self.subTest(outcomes=outcomes), patch.object(
                installer.previous_install, 'inactive', side_effect=outcomes
            ), self.assertRaises(ValueError):
                self.install()
            self.assertEqual((self.target / 'old').read_bytes(), b'old package')
            self.assertFalse(self.receipt.exists())

    def test_bad_hash_and_archive_escape_reject_before_inspection(self):
        for archive in [
            {'name': 'package.tar.xz', 'sha256': 'wrong'},
            {'name': '../package.tar.xz', 'sha256': 'wrong'},
        ]:
            self.manifest['archive'] = archive
            self.save_manifest()
            with patch.object(installer.previous_install, 'inactive') as inactive, self.assertRaises(ValueError):
                self.install()
            inactive.assert_not_called()

    def test_payload_swap_failure_restores_original_directory(self):
        original_rename = Path.rename

        def rename(path, destination):
            if path.name == 'umbrafox' and path.parent.name.startswith('.umbrafox-clipboard-stage-'):
                raise OSError('injected swap failure')
            return original_rename(path, destination)

        with patch.object(installer.previous_install, 'inactive'), patch.object(
            Path, 'rename', rename
        ), self.assertRaises(OSError):
            self.install()
        self.assertEqual((self.target / 'old').read_bytes(), b'old package')
        self.assertFalse(self.receipt.exists())

    def test_existing_backup_rejects(self):
        (self.programs / 'umbrafox-nightly.before-clipboard-20261015').mkdir()
        with self.assertRaises(ValueError):
            self.install()


if __name__ == '__main__':
    unittest.main()
