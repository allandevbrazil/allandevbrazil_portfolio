import pathlib,json,re,html
P=pathlib.Path
raw=P('resources/profile/README.md').read_text(encoding='utf-8-sig')
def clean(s):return html.unescape(re.sub('<[^>]+>','',s)).strip()
exp=[]
for title,body in re.findall(r'<summary>(.*?)</summary>(.*?)</details>',raw,re.S):
 if 'Engineer' in title or 'FullStack' in title:exp.append({'title':clean(title).lstrip('🏢🏛️💼💳🏦💻 '),'details':[clean(t) for t in re.findall(r'<li>(.*?)</li>',body,re.S)]})
edu=[clean(re.sub(r'[*]','',s)).lstrip('- 🧠📐👨‍🏫💻 ') for s in raw.splitlines() if s.startswith('- ') and ('Pós-graduação' in s or 'Bacharelado' in s)]
projects=[
('tierlist-maker','Tierlist Maker','Organize imagens em classificações personalizadas com arrastar e soltar.',['React','TypeScript','Zustand'],'Ferramentas',None),
('lawyer-office-system','LexModernLaw','ERP jurídico com processos, clientes, documentos e gestão financeira.',['Vue 3','FastAPI','PostgreSQL'],'Sistemas','https://lawyer-office-system.vercel.app/login'),
('favs-organizer','Favs Organizer','Organização local de favoritos do Chrome, Edge e Brave, com backup automático.',['Electron','JavaScript','Node.js'],'Ferramentas',None),
('docfree','DocPrático','Orçamentos, clientes e indicadores para profissionais autônomos.',['React','TypeScript','Prisma'],'Sistemas','https://frontend-chi-six-23.vercel.app/'),
('pethealth','PetHealth','Agenda de medicamentos e acompanhamento da saúde dos pets.',['React','TypeScript','Vite'],'Sistemas','https://allandevbrazil.github.io/pethealth/'),
('freesworder','Freesworder','Portal para freelancers: clientes, projetos, faturas e serviços.',['React','TypeScript','Vite'],'Sistemas','https://allandevbrazil.github.io/freesworder/'),
('ironman','Ironman','Uma experiência de fã dedicada ao universo do Homem de Ferro.',['React','TypeScript','Vite'],'Experiências','https://allandevbrazil.github.io/ironman/')]
data={'name':'ALLAN SELEGUIM','role':'Engenheiro de Software Sênior e Analista de Sistemas','location':'Sorocaba, São Paulo, Brasil','source':'https://github.com/allandevbrazil/allandevbrazil/blob/main/README.md','updated':'2026-09-07','experience':exp,'education':edu,'skills':{}}
for title,body in re.findall(r'\*\*([^\n]+):\*\*(.*?)(?=<br>|---)',raw,re.S):
 tags=re.findall(r'alt="([^"]+)"',body)
 if tags:data['skills'][title]=tags
# Preserve complete public production catalog as an additional list.
data['catalog']=[]
for line in raw.splitlines():
 if line.startswith('|'):
  links=re.findall(r'\[([^\]]+)\]\((https://[^)]+)\)',line)
  if len(links)==2:data['catalog'].append({'name':links[0][0].split('/')[-1],'repository':links[0][1],'url':links[1][1]})
data['projects']=[dict(id=a,name=b,description=c,stack=d,category=e,demo=f,repository='https://github.com/allandevbrazil/'+a) for a,b,c,d,e,f in projects]
P('src/javascript/portfolio').mkdir(exist_ok=True)
P('src/javascript/portfolio/data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
