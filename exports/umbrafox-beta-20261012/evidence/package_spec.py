import io
import tarfile
import tempfile
import unittest
from pathlib import Path

from package_beta import archive_files


class ArchiveTests(unittest.TestCase):
    def inspect(self, entries):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as temporary:
            path = Path(temporary) / 'test.tar.xz'
            with tarfile.open(path, 'w:xz') as archive:
                for name, kind in entries:
                    member = tarfile.TarInfo(name)
                    member.type = kind
                    member.mode = 0o755 if kind == tarfile.DIRTYPE else 0o644
                    member.size = 0 if kind != tarfile.REGTYPE else 4
                    archive.addfile(member, io.BytesIO(b'test'))
            return archive_files(path)

    def test_regular_package(self):
        result = self.inspect([('umbrafox', tarfile.DIRTYPE), ('umbrafox/file', tarfile.REGTYPE)])
        self.assertEqual(result['file']['size'], 4)

    def test_unsafe_names(self):
        for name in ['/umbrafox/a', 'umbrafox/../a', 'umbrafox//a', './umbrafox/a', 'other/a']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                self.inspect([(name, tarfile.REGTYPE)])

    def test_duplicates(self):
        with self.assertRaises(ValueError):
            self.inspect([('umbrafox/a', tarfile.REGTYPE)] * 2)

    def test_links_and_special_files(self):
        for kind in [tarfile.SYMTYPE, tarfile.LNKTYPE, tarfile.FIFOTYPE, tarfile.CHRTYPE]:
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                self.inspect([('umbrafox/a', kind)])

    def test_empty_archive(self):
        with self.assertRaises(ValueError):
            self.inspect([])


if __name__ == '__main__':
    unittest.main()
