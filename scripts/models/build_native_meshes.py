"""Simplify the bundled upstream glTFs for the native Skia renderer.
Run with Blender: blender -b --python scripts/models/build_native_meshes.py
Betaflight source models GPL-3.0-or-later; airplane additionally CC-BY-4.0.
The glTF files remain the preferred source. Generated geometry is centered,
normalized and changed from glTF (-Z forward) to fiercon (+X forward).
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[2]/'src/ui/orientation3d/models'
for source in sorted(root.glob('*.gltf')):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 source_data=json.loads(source.read_text())
 source_colors={m.get('name'):m.get('pbrMetallicRoughness',{}).get('baseColorFactor',[.6,.6,.6,1])[:3] for m in source_data.get('materials',[])}
 bpy.ops.import_scene.gltf(filepath=str(source))
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
 total=sum(len(o.data.polygons) for o in objects)
 ratio=min(1,1100/max(total,1))
 verts=[];faces=[];colors=[]
 for obj in objects:
  bpy.context.view_layer.objects.active=obj
  if ratio<1:
   mod=obj.modifiers.new('fiercon mobile mesh','DECIMATE');mod.ratio=ratio;mod.use_collapse_triangulate=True
  mesh=obj.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh();mesh.calc_loop_triangles()
  offset=len(verts)
  for v in mesh.vertices:
   p=obj.matrix_world@v.co
   # Blender's glTF importer converts Y-up glTF to Z-up Blender.
   # glTF (x,y,z) = Blender (x,z,-y), body = (-gltf.z,gltf.y,gltf.x).
   verts.append([p.y,p.z,p.x])
  materials=[]
  for material in mesh.materials:
   c=source_colors.get(material.name,list(material.diffuse_color[:3])) if material else [.35,.4,.5]
   if c[1]>c[0]*1.35 and c[1]>c[2]*1.2:color='#F4B917'
   elif c[0]>c[1]*1.7 and c[0]>c[2]*1.3:color='#E75965'
   else:
    srgb=[12.92*v if v<=.0031308 else 1.055*v**(1/2.4)-.055 for v in c]
    color='#'+''.join(f'{max(0,min(255,round(v*255))):02X}' for v in srgb)
   if color not in colors:colors.append(color)
   materials.append(colors.index(color))
  for face in mesh.loop_triangles:
   faces.append([*(v+offset for v in face.vertices),materials[face.material_index] if materials else 0])
  obj.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh_clear()
 if not colors:colors=['#AAB7C9']
 center=[(min(v[i] for v in verts)+max(v[i] for v in verts))/2 for i in range(3)]
 radius=max(math.sqrt(sum((v[i]-center[i])**2 for i in range(3))) for v in verts)
 vertices=[[round((v[i]-center[i])/radius,5) for i in range(3)] for v in verts]
 out={'source':source.name,'vertices':vertices,'triangles':faces,'colors':colors}
 target=source.with_suffix('.mesh.json');target.write_text(json.dumps(out,separators=(',',':'))+'\n')
 print(source.stem,len(vertices),len(faces))
