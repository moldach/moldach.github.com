"""Regression checks for recovering legacy URLs and metadata."""

import hashlib
import unittest

from inventory_legacy import BASE, ROOT, PublishedHTML, destination_for, git, inventory, resolve_local, route_for


class LegacyURLTests(unittest.TestCase):
    def test_directory_and_literal_html_routes(self):
        self.assertEqual(route_for("index.html"), "/")
        self.assertEqual(route_for("post/supervised-umap/index.html"), "/post/supervised-umap/")
        self.assertEqual(route_for("slides/drake/presentation.html"), "/slides/drake/presentation.html")

    def test_encoded_paths_queries_fragments_and_relative_assets(self):
        files = {"category/教程/index.html", "uploads/resume.pdf", "post/a/photo.png"}
        self.assertEqual(resolve_local("/category/%E6%95%99%E7%A8%8B/?q=x#top", "/", files), "category/教程/index.html")
        self.assertEqual(resolve_local("../../uploads/resume.pdf#page=2", "/post/a/", files), "uploads/resume.pdf")
        self.assertEqual(resolve_local("photo.png?width=300", "/post/a/", files), "post/a/photo.png")
        self.assertIsNone(resolve_local("https://example.com/uploads/resume.pdf", "/", files))
        self.assertIsNone(resolve_local("#contact", "/", files))
        self.assertEqual(resolve_local("/absent.pdf", "/", files), "MISSING:/absent.pdf")

    def test_templates_archive_but_real_writing_migrates(self):
        self.assertEqual(destination_for("/post/supervised-umap/"), ("/writing/supervised-umap/", "migrate-writing"))
        self.assertEqual(destination_for("/post/getting-started/"), ("/archive/post/getting-started/", "retain-archive"))
        self.assertEqual(destination_for("/slides/drake/presentation.html"), ("/slides/drake/presentation.html", "retain-download-or-slides"))

    def test_metadata_entities_and_responsive_media_are_recovered(self):
        p = PublishedHTML()
        p.feed('''<title>A &amp; B</title><meta property="article:published_time" content="2023-12-06T00:00:00+00:00"/>
          <link rel="canonical" href="https://example.com/post/a/"><h1>Real <em>work</em></h1>
          <img src="small.png" srcset="medium.png 640w, large.png 1200w"><video poster="poster.jpg"><source src="demo.webm"></video>''')
        self.assertEqual("".join(p.title), "A & B")
        self.assertEqual("".join(p.heading), "Real work")
        self.assertEqual(p.meta["article:published_time"], "2023-12-06T00:00:00+00:00")
        self.assertTrue({"small.png", "medium.png", "large.png", "poster.jpg", "demo.webm"} <= p.refs)


class PublishedSnapshotTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = inventory()

    def test_every_preserved_file_has_one_inventory_record(self):
        expected = {p for p in git("ls-tree", "-rz", "--name-only", BASE).split("\0") if p}
        records = self.data["pages"] + self.data["assets"]
        self.assertEqual(len(expected), len(records))
        self.assertEqual(expected, {r["sourcePath"] for r in records})
        self.assertEqual(len(self.data["pages"]), 148)
        self.assertEqual(self.data["source"]["posts"], 8)
        self.assertEqual(self.data["source"]["projects"], 16)

    def test_newer_article_date_and_download_are_preserved(self):
        article = next(p for p in self.data["pages"] if p["oldRoute"] == "/post/supervised-umap/")
        self.assertEqual(article["publishedAt"], "2023-12-06T00:00:00+00:00")
        asset = next(p for p in self.data["assets"] if p["sourcePath"] == "uploads/resume.pdf")
        self.assertTrue(asset["isDownload"])
        self.assertEqual(asset["destination"], "/uploads/resume.pdf")
        self.assertEqual(asset["sha256"], hashlib.sha256((ROOT / "uploads/resume.pdf").read_bytes()).hexdigest())

    def test_published_files_have_not_been_modified(self):
        self.assertEqual(git("diff", BASE, "--name-only", "--diff-filter=MDT"), "")


if __name__ == "__main__":
    unittest.main()
