from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

project=Path(__file__).resolve().parent.parent
source=project.parent/'素材与下一版设计'/'星铁新增八人'
characters=json.loads((source/'素材清单.json').read_text(encoding='utf-8'))['characters']
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',24)
small=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',16)
for page in range(2):
    sheet=Image.new('RGB',(1040,1040),'#101723')
    draw=ImageDraw.Draw(sheet)
    for index,character in enumerate(characters[page*4:page*4+4]):
        x=(index%2)*520
        y=(index//2)*520
        draw.rounded_rectangle((x+10,y+10,x+510,y+510),radius=12,fill='#192234',outline='#455574',width=2)
        draw.text((x+28,y+28),character['name']+'  '+character['officialCharacterId'],font=font,fill='white')
        draw.text((x+28,y+65),character['key']+' / '+character.get('variant','官网展示版本'),font=small,fill='#a5bfdc')
        with Image.open(source/(character['key']+'-splash.png')) as image:
            image=image.convert('RGBA')
            image.thumbnail((460,390))
            sheet.paste(image,(x+30+(460-image.width)//2,y+100+(390-image.height)//2),image)
        with Image.open(source/(character['key']+'-avatar.png')) as avatar:
            avatar=avatar.convert('RGBA')
            avatar.thumbnail((70,70))
            sheet.paste(avatar,(x+415,y+25),avatar)
    sheet.save(source/('preview-'+str(page+1)+'.png'))
print('Created two 1040x1040 official character contact sheets.')
