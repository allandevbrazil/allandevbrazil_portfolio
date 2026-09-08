"""Converte um modelo do Sketchfab (VW Gol) para o chassis.glb do template.

- Aceita .glb/.gltf ou .zip (extrai o maior modelo).
- Detecta eixo "up" e remapeia para o frame do template (Z-up, frente +X).
- Escala para comprimento 2.4 e apoia no chão.
- Decima para <= target faces (default 15000) mantendo a silhueta.
- Agrupa por material (heurística de nome) e nomeia nós no padrão do template:
    pintura -> shadeNeonPink_gol | vidros/pneus -> shadeBlack_gol
    farois  -> pureYellow_gol    | lanternas  -> shadeRed_gol
Uso: python scripts/adapt-gol.py <entrada> <saida.glb> [--faces 15000] [--front +X]
"""
import sys, os, glob, zipfile, tempfile
import numpy as np
import trimesh

args = [a for a in sys.argv[1:]]
flags = {a for a in args if a.startswith('--')}
pos = [a for a in args if not a.startswith('--')]
src, dst = pos[0], pos[1]
target_faces = 15000
for a in pos[2:]:
    if a.isdigit():
        target_faces = int(a)
if '--faces' in ' '.join(args):
    i = args.index('--faces')
    target_faces = int(args[i+1])

def resolve_input(path):
    if path.lower().endswith('.zip'):
        tmp = tempfile.mkdtemp(prefix='golzip_')
        with zipfile.ZipFile(path) as z:
            z.extractall(tmp)
        cands = []
        for ext in ('glb', 'gltf'):
            for f in glob.glob(os.path.join(tmp, '**', '*.' + ext), recursive=True):
                try:
                    cands.append((os.path.getsize(f), f))
                except OSError:
                    pass
        if not cands:
            raise SystemExit('nenhum .glb/.gltf dentro do zip')
        return max(cands)[1]
    return path

src = resolve_input(src)
print('modelo:', src)
scene = trimesh.load(src, force='scene')

# junta por material (heurística de nome)
def mat_group(name):
    n = (name or '').lower()
    if any(k in n for k in ('glass', 'window', 'vidro', 'windshield')):
        return 'shadeBlack_gol'
    if any(k in n for k in ('tire', 'wheel', 'rubber', 'pneu', 'rim')):
        return 'shadeBlack_gol'
    if any(k in n for k in ('light', 'head', 'lamp', 'farol', 'signal', 'turn')):
        return 'pureYellow_gol'
    if any(k in n for k in ('tail', 'brake', 'lanterna', 'red')):
        return 'shadeRed_gol'
    return 'shadeNeonPink_gol'

groups = {}
for geom_name, geom in scene.geometry.items():
    matname = 'shadeNeonPink_gol'
    try:
        visuals = geom.visual
        if hasattr(visuals, 'material') and visuals.material is not None:
            matname = mat_group(getattr(visuals.material, 'name', None) or geom_name)
        elif hasattr(visuals, 'material') and isinstance(visuals.material, list):
            matname = mat_group(geom_name)
    except Exception:
        pass
    g = geom.copy()
    groups.setdefault(matname, []).append(g)

# se só um grupo e ele é o corpo, tudo bem
allm = [m for ms in groups.values() for m in ms]
combined = trimesh.util.concatenate(allm)
print(f'verts={len(combined.vertices)} faces={len(combined.faces)} grupos={list(groups.keys())}')

# bounding box para detectar up-axis: o eixo de MAIOR extensão horizontal é o comprimento;
# modelos de carro: comprimento >> largura > altura. Up = eixo com menor extensão.
ext = combined.bounds[1] - combined.bounds[0]
order = np.argsort(ext)  # ascending
up_axis = int(order[0])          # menor extensão = altura
long_axis = int(order[2])        # maior = comprimento
print(f'extensões xyz={ext.round(2)} -> up={up_axis} comprimento={long_axis}')

# remapeia para template: X=comprimento, Y=largura, Z=altura (Z-up, frente +X)
width_axis = ({0, 1, 2} - {up_axis, long_axis}).pop()
def remap(mesh):
    v = mesh.vertices
    out = np.column_stack((v[:, long_axis], v[:, width_axis], v[:, up_axis]))
    return trimesh.Trimesh(vertices=out, faces=mesh.faces, process=False)

# monta grupos remapeados
remapped = {}
for gname, meshes in groups.items():
    parts = [remap(m) for m in meshes]
    remapped[gname] = trimesh.util.concatenate(parts)

# escala global pelo comprimento do corpo somado
full = trimesh.util.concatenate(list(remapped.values()))
ext2 = full.bounds[1] - full.bounds[0]
S = 2.4 / ext2[0]
center = (full.bounds[0] + full.bounds[1]) / 2
minz = full.bounds[0][2]

final = {}
for gname, m in remapped.items():
    v = (m.vertices - np.array([center[0], center[1], minz])) * S
    v[:, 2] += 0.05
    final[gname] = trimesh.Trimesh(vertices=v, faces=m.faces, process=False)

# decima se necessário
try:
    import fast_simplification
    tot = sum(len(m.faces) for m in final.values())
    if tot > target_faces:
        ratio = target_faces / tot
        for gname, m in final.items():
            if len(m.faces) > 200:
                vv, ff = fast_simplification.simplify(m.vertices, m.faces, target_count=int(len(m.faces) * ratio))
                final[gname] = trimesh.Trimesh(vertices=vv, faces=ff, process=False)
        print('decimado para ~', sum(len(m.faces) for m in final.values()), 'faces')
except Exception as e:
    print('decimacao pulada:', e)

# exporta glb com nós nomeados
nodes = []
meshes = []
accessors = []
bufferViews = []
bin_sections = []

def add_view(data, target):
    off = sum(len(b) + ((-len(b)) % 4) for b in bin_sections)
    bin_sections.append(data)
    bufferViews.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data), 'target': target})
    return len(bufferViews) - 1

for gname, m in final.items():
    if len(m.faces) == 0:
        continue
    pos = np.asarray(m.vertices, dtype=np.float32)
    try:
        nrm = np.asarray(m.vertex_normals, dtype=np.float32)
    except Exception:
        nrm = np.zeros_like(pos)
    idx = np.asarray(m.faces, dtype=np.uint32)
    if len(pos) < 65536:
        idx = idx.astype(np.uint16)
        comp = 5123
    else:
        comp = 5125
    pv = add_view(pos.tobytes(), 34962)
    nv = add_view(nrm.tobytes(), 34962)
    iv = add_view(idx.tobytes(), 34963)
    pa = len(accessors); accessors.append({'bufferView': pv, 'componentType': 5126, 'count': len(pos), 'type': 'VEC3',
        'min': pos.min(0).tolist(), 'max': pos.max(0).tolist()})
    na = len(accessors); accessors.append({'bufferView': nv, 'componentType': 5126, 'count': len(pos), 'type': 'VEC3'})
    ia = len(accessors); accessors.append({'bufferView': iv, 'componentType': comp, 'count': len(idx), 'type': 'SCALAR'})
    meshes.append({'name': gname, 'primitives': [{'attributes': {'POSITION': pa, 'NORMAL': na}, 'indices': ia, 'mode': 4}]})
    nodes.append({'mesh': len(meshes) - 1, 'name': gname})
    print(f'  {gname}: {len(pos)} verts, {len(idx)//3} faces')

pad = lambda b: b + b'\x00' * ((-len(b)) % 4)
bin_data = b''.join(pad(b) for b in bin_sections)
json_chunk = {
    'asset': {'version': '2.0', 'generator': 'adapt-gol'},
    'scene': 0, 'scenes': [{'nodes': list(range(len(nodes))), 'name': 'gol2002'}],
    'nodes': nodes, 'meshes': meshes, 'accessors': accessors, 'bufferViews': bufferViews,
    'buffers': [{'byteLength': len(bin_data)}],
}
import json, struct
jb = json.dumps(json_chunk).encode('utf-8')
jb = jb + b' ' * ((-len(jb)) % 4)
bb = pad(bin_data)
out = b'glTF' + struct.pack('<II', 2, 12 + 8 + len(jb) + 8 + len(bb)) + struct.pack('<II', len(jb), 0x4E4F534A) + jb + struct.pack('<II', len(bb), 0x004E4942) + bb
with open(dst, 'wb') as f:
    f.write(out)
print('exportado:', dst, os.path.getsize(dst), 'bytes')
