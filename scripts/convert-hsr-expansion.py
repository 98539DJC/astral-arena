"""Convert already-downloaded official PNGs without cropping or repainting."""
import hashlib
import json
from pathlib import Path
from PIL import Image

project = Path(__file__).resolve().parent.parent
source = project.parent / '素材与下一版设计' / '星铁新增八人'
destination = project / 'src' / 'art'
manifest = json.loads((source / '素材清单.json').read_text(encoding='utf-8'))
assets = []
for character in manifest['characters']:
    for record in character['assets']:
        file = record['key'] + '-' + record['variant'] + '.webp'
        with Image.open(source / record['file']) as image:
            rgba = image.convert('RGBA')
            rgba.save(destination / file, 'WEBP', quality=94 if record['variant'] == 'avatar' else 87, method=6, exact=True)
            original_alpha = rgba.getchannel('A')
            with Image.open(destination / file) as converted:
                converted.load()
                assert converted.size == image.size
                assert converted.convert('RGBA').getchannel('A').tobytes() == original_alpha.tobytes()
        data = (destination / file).read_bytes()
        assets.append(dict(key=record['key'], name=record['name'], variant=record['variant'], file=file,
                           sourceUrl=record['url'], width=record['width'], height=record['height'],
                           bytes=len(data), sha256=hashlib.sha256(data).hexdigest()))
        print(f'{file}: {record["width"]}x{record["height"]} {len(data)} bytes', flush=True)

output = dict(copyright='miHoYo / HoYoverse', sourcePage=manifest['sourcePage'], api=manifest['api'],
              conversion='Official PNG to WebP, original dimensions and alpha retained; no cropping, repainting, watermark removal or license change.',
              originals='素材与下一版设计/星铁新增八人',
              characters=[{k: v for k, v in c.items() if k != 'assets'} for c in manifest['characters']], assets=assets)
(destination / 'hsr-expansion-assets.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(dict(files=len(assets), totalBytes=sum(a['bytes'] for a in assets), alphaPreserved=True, dimensionsPreserved=True)))
