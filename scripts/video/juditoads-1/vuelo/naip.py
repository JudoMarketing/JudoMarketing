import math, os, subprocess
from concurrent.futures import ThreadPoolExecutor
D=os.path.dirname(os.path.abspath(__file__))
lat, lon = 25.7739775, -80.1951206
R=6378137.0; ORI=math.pi*R
def xy(z):
    n=2**z; x=(lon+180)/360*n; y=(1-math.log(math.tan(math.radians(lat))+1/math.cos(math.radians(lat)))/math.pi)/2*n; return int(x),int(y)
def pedir(z, dx=6, dy=7):
    cx,cy=xy(z); size=2*ORI/2**z
    x0,x1=cx-dx,cx+dx+1; y0,y1=cy-dy,cy+dy+1
    w=-ORI+x0*size; e=-ORI+x1*size; n=ORI-y0*size; s=ORI-y1*size
    px=(x1-x0)*256; py=(y1-y0)*256
    f=f"{D}/naip-z{z}.jpg"
    url=f"https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer/exportImage?bbox={w},{s},{e},{n}&bboxSR=3857&imageSR=3857&size={px},{py}&format=jpg&f=image"
    r=subprocess.run(["curl","-s","-m","400","-o",f,"-w","%{http_code} %{size_download} %{time_total}",url],capture_output=True,text=True).stdout
    return z,(x0,y0,x1,y1),px,py,r
with ThreadPoolExecutor(3) as ex:
    for res in ex.map(pedir,[17,18,19]): print(res)
