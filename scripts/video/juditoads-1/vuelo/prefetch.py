import math, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
D=os.path.dirname(os.path.abspath(__file__))+"/tiles"
lat, lon = 25.7739775, -80.1951206
def xy(lon, lat, z):
    n=2**z; x=(lon+180)/360*n; y=(1-math.log(math.tan(math.radians(lat))+1/math.cos(math.radians(lat)))/math.pi)/2*n; return x,y
trabajos=[]
def rango(capa, url, z, dx, dy, lon0=lon, lat0=lat):
    cx,cy=xy(lon0,lat0,z); n=2**z
    for x in range(int(cx)-dx, int(cx)+dx+1):
        for y in range(int(cy)-dy, int(cy)+dy+1):
            if 0<=x<n and 0<=y<n: trabajos.append((capa,z,x,y,url.format(z=z,x=x,y=y)))
GIBS="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg"
EOX="https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg"
USGS="https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}"
for z in range(0,5): rango("gibs",GIBS,z,2**z,2**z)
for z in range(5,9): rango("gibs",GIBS,z,6,7,-76,23)
for z in range(6,15): rango("eox",EOX,z,6,8)
for z in range(13,17): rango("usgs",USGS,z,6,8)
def bajar(t):
    capa,z,x,y,url=t
    f=f"{D}/{capa}/{z}/{y}/{x}.jpg"
    if os.path.exists(f) and os.path.getsize(f)>200: return "ya"
    os.makedirs(os.path.dirname(f),exist_ok=True)
    r=subprocess.run(["curl","-s","-m","40","-o",f,"-w","%{http_code}",url],capture_output=True,text=True).stdout
    if r!="200":
        try: os.remove(f)
        except FileNotFoundError: pass
    return r
with ThreadPoolExecutor(12) as ex: res=list(ex.map(bajar, trabajos))
from collections import Counter
print(len(trabajos), Counter(res))
