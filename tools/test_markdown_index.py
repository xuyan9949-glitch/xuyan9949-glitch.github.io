"""Regression: archive reset comments and JSON consumers must survive first import."""
import importlib.util,json,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('importer',Path(__file__).with_name('import_markdown.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class IndexTests(unittest.TestCase):
 def test_comment_header_and_idempotent_updates_preserve_other_articles(self):
  with tempfile.TemporaryDirectory() as d:
   m.ARTICLES_JS=Path(d)/'articles.js';m.CONTENT_REGISTRY=Path(d)/'articles.json'
   m.ARTICLES_JS.write_text('// reset archive\nconst articles = [];\n')
   first={'id':'existing','title':'Existing','date':'2026-10-02'};second={'id':'increment','title':'New','date':'2026-10-28'}
   for a in [first,second,second]:m.update_content_registry(a);m.update_articles_js(a)
   data=json.loads(m.ARTICLES_JS.read_text().removeprefix('const articles = ').removesuffix(';\n'))
   self.assertEqual([a['id'] for a in data],['increment','existing']);self.assertEqual(data[1]['date'],'2026-10-02');self.assertEqual(data,json.loads(m.CONTENT_REGISTRY.read_text())['articles'])
if __name__=='__main__':unittest.main()
