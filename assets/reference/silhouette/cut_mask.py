import cv2,numpy as np,sys
src,out=sys.argv[1],sys.argv[2]
im=cv2.imread(src); h,w=im.shape[:2]
mask=np.full((h,w),cv2.GC_PR_BGD,np.uint8)
# probable foreground: a figure shape - head/hijab ellipse + shoulders trapezoid
fg=np.zeros((h,w),np.uint8)
cv2.ellipse(fg,(400,420),(150,240),0,0,360,255,-1)          # head + hijab
poly=np.array([[230,560],[620,590],[768,1000],[768,1046],[40,1046],[60,980]],np.int32)
cv2.fillPoly(fg,[poly],255)
mask[fg>0]=cv2.GC_PR_FGD
# sure foreground core
core=np.zeros((h,w),np.uint8)
cv2.ellipse(core,(400,430),(90,170),0,0,360,255,-1)
cv2.fillPoly(core,[np.array([[300,700],[560,700],[620,1046],[200,1046]],np.int32)],255)
mask[core>0]=cv2.GC_FGD
# sure background: left/right edges and top
mask[:, :60]=cv2.GC_BGD; mask[:, 740:]=cv2.GC_BGD; mask[:150,:]=cv2.GC_BGD
mask[:700,:120]=cv2.GC_BGD; mask[:560,620:]=cv2.GC_BGD
bg=np.zeros((1,65),np.float64); fgm=np.zeros((1,65),np.float64)
cv2.grabCut(im,mask,None,bg,fgm,8,cv2.GC_INIT_WITH_MASK)
m=np.where((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD),255,0).astype(np.uint8)
# keep biggest component, fill holes, smooth
n,lab,st,_=cv2.connectedComponentsWithStats(m)
if n>1:
    k=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); m=np.where(lab==k,255,0).astype(np.uint8)
m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15)))
m=cv2.GaussianBlur(m,(0,0),2.2)
cv2.imwrite(out,m)
prev=im.copy(); prev[m<128]=(prev[m<128]*0.15).astype(np.uint8)
cv2.imwrite(out.replace('.png','_prev.jpg'),cv2.resize(prev,None,fx=.6,fy=.6))
print(m.shape,(m>128).mean())
