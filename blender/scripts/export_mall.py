import sys, os
_D = os.path.dirname(os.path.abspath(__file__))
if _D not in sys.path:
    sys.path.insert(0, _D)
import mall_lib as L
import bpy


def export_mall(out_path):
    # Dev cameras must not ship in the binary.
    for obj in list(bpy.data.objects):
        if obj.type == "CAMERA":
            bpy.data.objects.remove(obj, do_unlink=True)

    # Lights are not exported; the web scene provides its own.
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_extras=True,
        export_yup=True,
        export_apply=True,
    )
    return out_path


if __name__ == "__main__":
    out = os.environ.get("MALL_GLB_OUT") or os.path.join(
        os.path.dirname(os.path.dirname(_D)), "public", "assets", "models", "acropolis-mall.glb"
    )
    os.makedirs(os.path.dirname(out), exist_ok=True)
    export_mall(out)
    print("GLB_EXPORTED", out, os.path.getsize(out))