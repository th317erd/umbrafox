import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
import tarfile

spec = importlib.util.spec_from_file_location('hybrid_verify', Path(__file__).with_name('verify_package.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class VerificationTests(unittest.TestCase):
    def test_share_root_alias_preserves_strict_payload_checks(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            payload = root/'payload'
            payload.mkdir()
            (payload/'regular').write_bytes(b'payload')
            alias = root/'share'
            alias.symlink_to(payload, target_is_directory=True)
            self.assertEqual(module.snapshot_payload(alias), module.common.tree_snapshot(payload))
            (payload/'link').symlink_to(payload/'regular')
            with self.assertRaises(ValueError):
                module.snapshot_payload(alias)

    def test_unmodified_archive_source_drift(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root/'source'
            source.mkdir()
            (source/'plain').write_bytes(b'original')
            (source/'owned').write_bytes(b'changed')
            archive_path = root/'base.tar'
            with tarfile.open(archive_path, 'w') as archive:
                for name in ['plain', 'owned']:
                    entry = tarfile.TarInfo(name)
                    entry.size = 8
                    entry.mode = 0o664
                    archive.addfile(entry, io.BytesIO(b'original'))
            self.assertEqual(module.check_archive_sources(source, archive_path, {'owned'}), 1)
            (source/'plain').write_bytes(b'tampered')
            with self.assertRaises(ValueError):
                module.check_archive_sources(source, archive_path, {'owned'})
            (source/'plain').unlink()
            (source/'plain').symlink_to(source/'owned')
            with self.assertRaises(ValueError):
                module.check_archive_sources(source, archive_path, {'owned'})

    def test_step_receipt_requires_exact_freeze_and_clean_exit(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            with self.assertRaises(ValueError):
                module.check_step_receipt(root, 'package', 'a'*64, 'b'*64)
            good = dict(kind='hybrid-build-step', version=1, step='package',
                        sourceFreezeSHA256='a'*64, mozconfigSHA256='b'*64,
                        returncode=0, error=None, residualProcessGroup=False)
            path = root/'package-1-exit.json'
            path.write_text(json.dumps(good))
            self.assertEqual(module.check_step_receipt(root, 'package', 'a'*64, 'b'*64), path)
            for key, value in [('sourceFreezeSHA256','c'*64), ('mozconfigSHA256','c'*64),
                               ('returncode',1), ('returncode',None), ('error','timeout'),
                               ('residualProcessGroup',True), ('step','build')]:
                with self.subTest(key=key):
                    path.write_text(json.dumps(dict(good, **{key:value})))
                    with self.assertRaises(ValueError):
                        module.check_step_receipt(root, 'package', 'a'*64, 'b'*64)

    def test_exact_build_id(self):
        self.assertEqual(module.check_build_id('20261019063025', '20261019063025'), '20261019063025')
        for a, b in [('20261014135715', '20261014135715'), ('20261019063025', '20261019063026'), ('x', 'x')]:
            with self.assertRaises(ValueError):
                module.check_build_id(a, b)

    def test_candidate_configuration(self):
        config = dict(TARGET_CPU='aarch64', MOZ_APP_UA_NAME='Firefox', MOZ_OPTIMIZE='1', MOZ_BUILD_APP='browser', MOZ_WAYLAND='1', MOZ_ENABLE_V4L2='1')
        module.check_configuration(config)
        for key, value in [('TARGET_CPU', 'x86_64'), ('MOZ_APP_UA_NAME', 'Umbrafox'), ('MOZ_DEBUG', '1'), ('MOZ_UMBRA_PERF_PROBES', '1'), ('MOZ_WAYLAND', None)]:
            with self.assertRaises(ValueError):
                module.check_configuration(dict(config, **{key:value}))

    def test_bad_archives(self):
        for name, kind, duplicate in [('umbrafox/../escape', tarfile.REGTYPE, False), ('other/libxul.so', tarfile.REGTYPE, False), ('umbrafox/a', tarfile.SYMTYPE, False), ('umbrafox/a', tarfile.REGTYPE, True)]:
            with self.subTest(name=name, kind=kind, duplicate=duplicate), tempfile.TemporaryDirectory() as temp:
                path = Path(temp)/'test.tar.xz'
                with tarfile.open(path, 'w:xz') as archive:
                    for _ in range(2 if duplicate else 1):
                        member = tarfile.TarInfo(name)
                        member.type = kind
                        if kind == tarfile.SYMTYPE:
                            member.linkname = '/outside'
                        else:
                            member.size = 4
                        archive.addfile(member, io.BytesIO(b'test') if kind == tarfile.REGTYPE else None)
                with self.assertRaises(ValueError):
                    module.helper.archive_files(path)

    def test_source_pin_loss_and_drift(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            path = root/'input'
            path.write_bytes(b'old')
            pins = {'input':{'size':3, 'sha256':module.common.file_digest(path), 'mode':0o644}}
            module.check_owned(root, pins)
            path.write_bytes(b'new')
            with self.assertRaises(ValueError):
                module.check_owned(root, pins)
            path.unlink()
            with self.assertRaises(ValueError):
                module.check_owned(root, pins)


if __name__ == '__main__':
    unittest.main()
