"""Check archive identity, distinct assets, document integrity and reading routes."""
from pathlib import Path
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[1]


def check():
    companies = json.loads((ROOT / 'content/archives.json').read_text())['companies']
    documents = json.loads((ROOT / 'content/research-documents.json').read_text())['documents']
    errors, missing, rows = [], [], []
    seen_ids, seen_heroes, seen_document_ids = set(), {}, set()
    for company in companies:
        ticker = company['id']
        if ticker in seen_ids:
            errors.append(f'{ticker}: duplicate company')
        seen_ids.add(ticker)
        profile = company.get('profile')
        if not profile:
            continue
        for field in ('summary', 'thesis', 'sourceDate', 'financialPeriod', 'logo', 'hero'):
            if not profile.get(field):
                errors.append(f'{ticker}: missing {field}')
        for field in ('logo', 'hero'):
            name = profile.get(field, '')
            asset = ROOT / 'images/research' / name
            if not name or not asset.is_file():
                errors.append(f'{ticker}: missing {field} asset')
            elif field == 'hero':
                fingerprint = hashlib.sha256(asset.read_bytes()).hexdigest()
                if fingerprint in seen_heroes:
                    errors.append(f'{ticker}: theme image shared with {seen_heroes[fingerprint]}')
                seen_heroes[fingerprint] = ticker
                if name == 'technology-hero.webp':
                    errors.append(f'{ticker}: generic homepage image used as company image')
        docs = [d for d in documents if d['ticker'] == ticker]
        kinds = {d['kind'] for d in docs}
        if 'dossier' not in kinds:
            missing.append(f'{ticker}: investment dossier unavailable')
        if 'story' not in kinds:
            missing.append(f'{ticker}: company story unavailable')
        route = ROOT / 'research' / ticker.lower() / 'index.html'
        if not route.is_file():
            errors.append(f'{ticker}: missing company route')
        rows.append({'ticker': ticker, 'dossier': 'dossier' in kinds, 'story': 'story' in kinds,
                     'logo': profile.get('logo'), 'hero': profile.get('hero'),
                     'sourceDate': profile.get('sourceDate'), 'financialPeriod': profile.get('financialPeriod')})
    for doc in documents:
        if doc['id'] in seen_document_ids:
            errors.append(f"{doc['id']}: duplicate document ID")
        seen_document_ids.add(doc['id'])
        if doc['ticker'] not in seen_ids:
            errors.append(f"{doc['id']}: unknown company")
        download = ROOT / doc['download'].lstrip('/')
        if not download.is_file() or hashlib.sha256(download.read_bytes()).hexdigest() != doc['sha256']:
            errors.append(f"{doc['id']}: download fingerprint mismatch")
        if not doc.get('text', '').strip() or not doc.get('html', '').strip():
            errors.append(f"{doc['id']}: empty manuscript")
        if not (ROOT / doc['file'].lstrip('/') / 'index.html').is_file():
            errors.append(f"{doc['id']}: missing reading route")
    print(json.dumps({'companies': len(rows), 'documents': len(documents), 'rows': rows,
                      'errors': errors, 'missingMaterials': missing,
                      'visualAcceptance': 'Requires browser inspection or user preview acceptance; not checked by this script'},
                     ensure_ascii=False, indent=2))
    return bool(errors)


if __name__ == '__main__':
    sys.exit(check())
