import io
import json
import tarfile
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import package_prototype as package


class SourceInputsTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        root = Path(self.temporary.name)
        self.source = root / 'source'
        self.main = root / 'main'
        for directory in [self.source, self.main]:
            directory.mkdir()
            (directory / 'existing.cpp').write_text('existing source\n')
            (directory / 'new.cpp').write_text('new source\n')
        self.outputs = [package.BASE.encode(), b'existing.cpp\0', b'new.cpp\0', b'patch']
        for name, value in [('SOURCE', self.source), ('REPO', self.main),
                            ('NEW_FILES', {'new.cpp'}),
                            ('TRACKED_FILES', {'existing.cpp'})]:
            replacement = patch.object(package, name, value, create=True)
            replacement.start()
            self.addCleanup(replacement.stop)

    def test_exact_tracked_and_new_inputs(self):
        with patch.object(package, 'git', side_effect=self.outputs):
            result = package.source_inputs()
        self.assertEqual(set(result['fileSHA256']), {'existing.cpp', 'new.cpp'})
        self.assertEqual(result['patch'], b'patch')

    def test_wrong_base(self):
        with patch.object(package, 'git', return_value=b'wrong'), self.assertRaises(ValueError):
            package.source_inputs()

    def test_missing_or_extra_supplement(self):
        for files in [b'', b'new.cpp\0extra.cpp\0']:
            with self.subTest(files=files), patch.object(
                package, 'git', side_effect=[package.BASE.encode(), b'existing.cpp\0', files]
            ), self.assertRaises(ValueError):
                package.source_inputs()

    def test_main_mismatch(self):
        (self.main / 'new.cpp').write_text('different\n')
        with patch.object(package, 'git', side_effect=self.outputs), self.assertRaises(ValueError):
            package.source_inputs()

    def test_missing_required_tracked_change(self):
        with patch.object(package, 'git', side_effect=[
            package.BASE.encode(), b'', b'new.cpp\0', b'patch'
        ]), self.assertRaises(ValueError):
            package.source_inputs()

    def test_symlink_input(self):
        (self.source / 'new.cpp').unlink()
        (self.source / 'new.cpp').symlink_to(self.main / 'new.cpp')
        with patch.object(package, 'git', side_effect=self.outputs), self.assertRaises(ValueError):
            package.source_inputs()

    def test_supplement_bytes_must_match_frozen_source_hashes(self):
        with patch.object(package, 'git', side_effect=self.outputs):
            inputs = package.source_inputs()
        obj = self.root_fixture('obj')
        (obj / '.mozconfig').write_text('fixture config\n')
        (obj / 'config.status.json').write_text(json.dumps({'substs': {
            'MOZ_APP_UA_NAME': 'Firefox', 'MOZ_OPTIMIZE': '1', 'TARGET_CPU': 'x86_64',
        }}))
        overlay = self.main / 'tools/umbrafox/beta/umbrafox-beta.js'
        overlay.parent.mkdir(parents=True)
        overlay.write_text('fixture overlay\n')
        archive = self.source.parent / 'fixture.tar.xz'
        with tarfile.open(archive, 'x:xz') as output:
            for name, section in [('application.ini', 'App'), ('platform.ini', 'Build')]:
                data = f'[{section}]\nBuildID={package.BUILD_ID}\n'.encode()
                member = tarfile.TarInfo(f'umbrafox/{name}')
                member.size = len(data)
                member.mode = 0o644
                output.addfile(member, io.BytesIO(data))
        original_add = tarfile.TarFile.add

        def changing_add(archive, name, *args, **kwargs):
            if kwargs.get('arcname') == 'new.cpp':
                Path(name).write_text('changed after final source check\n')
            return original_add(archive, name, *args, **kwargs)

        with patch.object(package, 'OBJ', obj), patch.object(
            package, 'source_inputs', return_value=inputs
        ), patch.object(package.previous, 'inspect_toolkit_id'), patch.object(
            tarfile.TarFile, 'add', changing_add
        ), self.assertRaises(ValueError):
            package.package(archive, self.source.parent / 'result')

    def root_fixture(self, name):
        directory = self.source.parent / name
        directory.mkdir()
        return directory


if __name__ == '__main__':
    unittest.main()
