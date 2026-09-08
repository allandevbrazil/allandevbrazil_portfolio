"""Gera chassis.glb do 'Gol Highline 2002' a partir do hatchback CC0 (Kenney Car Kit).

Divide o corpo pela colormap embutida (UV) em grupos de cor e nomeia nós no padrão do template:
  - pintura       -> shadeNeonPink_gol  (matcap rosa-neon próprio)
  - vidros/grade  -> shadeBlack_gol
  - faróis/setas  -> pureYellow_gol
  - lanternas     -> shadeRed_gol
  - rodas         -> shadeBlack_gol
Remapeia eixos Kenney (Y-up, frente +Z) -> template (Z-up, frente +X).
Uso: python scripts/build-gol.py <src.glb> <out.glb>
"""
import sys, array, io
from pygltflib import GLTF2, Accessor, BufferView, Buffer, Mesh, Node, Scene, Primitive, Attributes
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
g = GLTF2().load_binary(src)
blob = g.binary_blob()
TARGET_LEN = 2.4

img = g.images[0]
ibv = g.bufferViews[img.bufferView]
tex = Image.open(io.BytesIO(blob[ibv.byteOffset:ibv.byteOffset+ibv.byteLength])).convert('RGB')
TW, TH = tex.size
pixels = tex.load()

PALETTE = {}  # classificação por matiz, não por paleta fixa

def classify(rgb):
    r, g, b = rgb
    mx, mn = max(rgb), min(rgb)
    # verde da pintura
    if g > r + 15 and g > b + 15:
        return 'body'
    # azul dos vidros
    if b > r + 25 and b > g + 15:
        return 'glass'
    # vermelho das lanternas
    if r > 140 and g < 100 and b < 100:
        return 'tail'
    # laranja de setas/faróis
    if r > 200 and 90 < g < 175 and b < 130:
        return 'lights'
    # creme/branco dos faróis
    if r > 200 and g > 175 and b > 140:
        return 'lights'
    # demais tons (grafites, interior, fundo) -> preto
    return 'glass'

GROUP = {'body': 'body', 'glass': 'glass', 'lights': 'lights', 'tail': 'tail'}

def read(acc_idx, comp_map={5126: 'f', 5123: 'h', 5125: 'I'}, n_map={'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}):
    acc = g.accessors[acc_idx]
    bv = g.bufferViews[acc.bufferView]
    off = (bv.byteOffset or 0) + (acc.byteOffset or 0)
    a = array.array(comp_map[acc.componentType])
    n = n_map[acc.type]
    a.frombytes(blob[off: off + acc.count * n * a.itemsize])
    return a, n, acc.count

def node_parts(node_idx):
    node = g.nodes[node_idx]
    prim = g.meshes[node.mesh].primitives[0]
    pos, _, cnt = read(prim.attributes.POSITION)
    nrm, _, _ = read(prim.attributes.NORMAL)
    idx, _, _ = read(prim.indices)
    t = node.translation or [0, 0, 0]
    s = node.scale or [1, 1, 1]
    kx = [(pos[i]*s[0])+t[0] for i in range(0, len(pos), 3)]
    ky = [(pos[i]*s[1])+t[1] for i in range(1, len(pos), 3)]
    kz = [(pos[i]*s[2])+t[2] for i in range(2, len(pos), 3)]
    xs, ys, zs = kz, kx, ky
    nrm_t = []
    for i in range(cnt):
        nx, ny, nz = nrm[i*3], nrm[i*3+1], nrm[i*3+2]
        nrm_t.extend((nz, nx, ny))
    groups = None
    if node.mesh == 4 and prim.attributes.TEXCOORD_0 is not None:
        uvs, _, _ = read(prim.attributes.TEXCOORD_0)
        vcls = []
        for i in range(cnt):
            u, v = uvs[i*2], uvs[i*2+1]
            px = min(TW-1, max(0, int(u*TW)))
            py = min(TH-1, max(0, int(v*TH)))
            vcls.append(classify(pixels[px, py]))
        groups = []
        prio = {'body': 0, 'glass': 1, 'lights': 2, 'tail': 3}
        for j in range(0, len(idx), 3):
            trio = sorted((vcls[idx[j]], vcls[idx[j+1]], vcls[idx[j+2]]), key=lambda c: prio[c])
            groups.append(trio[0])
    return xs, ys, zs, nrm_t, [int(i) for i in idx], cnt, groups

# junta tudo por grupo de material
mat_for_group = {'body': 'shadeNeonPink_gol', 'glass': 'shadeBlack_gol', 'lights': 'pureYellow_gol', 'tail': 'shadeRed_gol'}
out_groups = {k: [] for k in mat_for_group}
wheel_group = []
gx = []; gy = []; gz = []
raw = []
for ni in range(len(g.nodes)):
    xs, ys, zs, nrm, idx, cnt, groups = node_parts(ni)
    raw.append((g.nodes[ni].name, xs, ys, zs, nrm, idx, cnt, groups))
    gx += xs; gy += ys; gz += zs

minx, maxx, miny, maxy, minz, maxz = min(gx), max(gx), min(gy), max(gy), min(gz), max(gz)
cx, cy = (minx+maxx)/2, (miny+maxy)/2
S = TARGET_LEN / (maxx - minx)
print(f'template Z-up: comprimento={maxx-minx:.2f} largura={maxy-miny:.2f} altura={maxz-minz:.2f} escala={S:.2f}')

for name, xs, ys, zs, nrm, idx, cnt, groups in raw:
    tx = [(x-cx)*S for x in xs]; ty = [(y-cy)*S for y in ys]; tz = [(z-minz)*S + 0.05 for z in zs]
    if name.startswith('wheel'):
        flat = array.array('f')
        for i in range(cnt):
            flat.extend((tx[i], ty[i], tz[i]))
        wheel_group.append((list(flat), nrm, idx))
        continue
    if groups is None:
        out_groups['glass'].append((tx, ty, tz, nrm, idx))
        continue
    per_group = {k: ([], [], [], []) for k in out_groups}  # pos, nrm, idx, remap
    for j in range(0, len(idx), 3):
        gname = groups[j//3]
        gdata = per_group[gname]
        remap = {}
        for k in range(3):
            vi = idx[j+k]
            if vi not in remap:
                remap[vi] = len(gdata[0]) // 3
                gdata[0].extend((tx[vi], ty[vi], tz[vi]))
                gdata[1].extend(nrm[vi*3:vi*3+3])
            gdata[2].append(remap[vi])
    for gname, (p, n, i, _) in per_group.items():
        if i:
            out_groups[gname].append((p, n, i))

bin_sections = []
bufferViews = []
accessors = []
meshes = []
nodes = []

def add_view(data_bytes, target):
    off = sum(len(b) + ((-len(b)) % 4) for b in bin_sections)
    bin_sections.append(data_bytes)
    bufferViews.append(BufferView(buffer=0, byteOffset=off, byteLength=len(data_bytes), target=target))
    return len(bufferViews) - 1

def emit(matname, chunks):
    pos_a = array.array('f'); nrm_a = array.array('f'); idx_a = array.array('H')
    base = 0
    for p, n, i in chunks:
        pos_a.extend(p); nrm_a.extend(n)
        idx_a.extend(x + base for x in i)
        base += len(p) // 3
    if not idx_a:
        return
    pv = add_view(pos_a.tobytes(), 34962)
    nv = add_view(nrm_a.tobytes(), 34962)
    iv = add_view(idx_a.tobytes(), 34963)
    pa = len(accessors); accessors.append(Accessor(bufferView=pv, componentType=5126, count=base, type='VEC3',
        min=[min(pos_a[0::3]), min(pos_a[1::3]), min(pos_a[2::3])], max=[max(pos_a[0::3]), max(pos_a[1::3]), max(pos_a[2::3])]))
    na = len(accessors); accessors.append(Accessor(bufferView=nv, componentType=5126, count=base, type='VEC3'))
    ia = len(accessors); accessors.append(Accessor(bufferView=iv, componentType=5123, count=len(idx_a), type='SCALAR'))
    meshes.append(Mesh(name=matname, primitives=[Primitive(attributes=Attributes(POSITION=pa, NORMAL=na), indices=ia, mode=4)]))
    nodes.append(Node(mesh=len(nodes), name=matname))
    print(f'  {matname}: {base} verts, {len(idx_a)} idx')

for gname, chunks in out_groups.items():
    emit(mat_for_group[gname], chunks)
emit('shadeBlack_gol', wheel_group)

pad = lambda b: b + b'\x00' * ((-len(b)) % 4)
bin_data = b''.join(pad(b) for b in bin_sections)

out = GLTF2()
out.scene = 0
out.scenes = [Scene(nodes=list(range(len(nodes))), name='gol2002')]
out.nodes = nodes
out.meshes = meshes
out.bufferViews = bufferViews
out.accessors = accessors
out.buffers = [Buffer(byteLength=len(bin_data))]
out.set_binary_blob(bin_data)
out.save_binary(dst)
print('exportado:', dst, '| meshes:', len(meshes))
