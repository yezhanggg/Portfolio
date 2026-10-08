#!/usr/bin/env python3
"""Print a census of the extracted page data: fonts, media ids, videos, iframes, inputs."""
import json, glob, re, collections, os
fonts=collections.Counter(); media=collections.Counter(); vids=[]; ifr=[]; inputs=[]; types=collections.Counter(); fixed=[]
def visit(nodes, page, view):
    for n in nodes:
        types[n['type']]+=1
        st=n.get('style') or {}
        if st.get('font-family'): fonts[(st['font-family'], st.get('font-weight'), st.get('font-style'))]+=1
        for m in re.finditer(r'font-family:([^;"]+)', n.get('html','')): fonts[(m.group(1).strip(),'html','')]+=1
        for s in [n.get('src')]+[i['src'] for i in n.get('items',[])]+[n.get('poster')]:
            m=re.search(r'/media/([^/?]+)', s or '')
            if m: media[m.group(1)]+=1
        if n['type']=='video': vids.append((page,view,n.get('id'),n['box'],n.get('autoplay'),n.get('loop'),n.get('muted'),n.get('controls'),bool(n.get('fixed')),(n.get('src') or '')[:70]))
        if n['type']=='iframe': ifr.append((page,view,n['box'],(n.get('src') or '')[:160]))
        if n['type']=='input': inputs.append((page,view,n['tag'],n.get('inputType'),n.get('label'),n.get('placeholder'),n.get('value'),n['box']))
        if n.get('fixed'): fixed.append((page,view,n['type'],n['box'],n.get('vw'),n.get('vh')))
        for sl in n.get('slides',[]): visit(sl,page,view)
for f in sorted(glob.glob('src/data/pages/*.json')):
    d=json.load(open(f))
    for v in ('desktop','mobile'): visit(d['views'][v]['nodes'], os.path.basename(f)[:-5], v)
print(len(glob.glob('src/data/pages/*.json')),'pages', dict(types))
print('\nFONTS'); [print(v,k) for k,v in fonts.most_common()]
ids=set(media); mine=[i for i in ids if i.startswith('f8d0cd_')]
print('\nMEDIA', len(ids), 'unique;', len(mine), 'from the account; others:', sorted(i for i in ids if not i.startswith('f8d0cd_')))
print('\nVIDEOS'); [print(v) for v in vids]
print('\nIFRAMES'); [print(v) for v in ifr]
print('\nINPUTS'); [print(v) for v in inputs]
print('\nFIXED'); [print(v) for v in fixed]
