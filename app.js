const POPPY_SRC='poppy.svg';
const HIGHLIGHT='#F7B5BE';

const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d'),dpr=Math.min(window.devicePixelRatio||1,2);
const popImg=new Image();let popOK=false;
popImg.onload=()=>{popOK=true;draw()};
popImg.onerror=()=>note('Could not find '+POPPY_SRC+' next to this page.');
popImg.src=POPPY_SRC;

let img=null,mode='empty',W=0,H=0,sc=1,crop,IM,base,N,drag=null,pop,popSelected=true;
const avail=()=>Math.min(560,$('tool').clientWidth);
const note=t=>{$('note').textContent=t||''};

function setSize(w,h){
  W=w;H=h;cv.width=w*dpr;cv.height=h*dpr;
  cv.style.width=w+'px';cv.style.height=h+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function showTool(){
  $('intro').classList.add('hide');
  $('tool').classList.remove('hide');
}

function ui(){
  const hints={
    crop:'Drag the square to move it. Drag a corner to resize.',
    edit:'Drag to move, corners to scale, the top handle to rotate. The poppy stays inside the circle.'
  };
  $('hint').textContent=hints[mode];
  const buttons={
    crop:[['Crop','applyCrop',1],['Choose another photo','choose']],
    edit:[['Save as PNG','exp',1],['Back to crop','backCrop'],['Choose another photo','choose']]
  };
  const b=buttons[mode];
  $('bar').innerHTML='';
  b.forEach(([t,f,m])=>{
    const e=document.createElement('button');
    e.textContent=t;
    if(m)e.className='main';
    e.onclick=()=>acts[f]();
    $('bar').appendChild(e);
  });
}

const acts={
  choose(){$('file').click()},
  applyCrop(){
    N=Math.max(64,Math.min(1080,Math.round(crop.s/sc)));
    base=document.createElement('canvas');
    base.width=base.height=N;
    base.getContext('2d').drawImage(
      img,
      (crop.x-IM.x)/sc,
      (crop.y-IM.y)/sc,
      crop.s/sc,
      crop.s/sc,
      0,0,N,N
    );
    pop={cx:.733,cy:.267,s:.3,r:.25};startEdit();
  },
  backCrop(){startCrop()},
  exp(){
    try{
      const o=document.createElement('canvas');
      o.width=o.height=N;
      drawScene(o.getContext('2d'),N);
      o.toBlob(bl=>{
        const u=URL.createObjectURL(bl),a=document.createElement('a');
        a.href=u;
        a.download='poppy-profile.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(()=>URL.revokeObjectURL(u),2000);
        note('');
      },'image/png');
    }catch(err){
      note('Export blocked. Serve the page over http or https instead of opening it as a local file.');
    }
  }
};

function load(f){
  if(!f||!f.type.startsWith('image/'))return;
  const i=new Image();
  i.onload=()=>{img=i;startCrop()};
  i.src=URL.createObjectURL(f);
}
$('up').onclick=()=>$('file').click();
$('file').onchange=e=>{
  load(e.target.files[0]);
  e.target.value='';
};
addEventListener('dragover',e=>e.preventDefault());
addEventListener('drop',e=>{
  e.preventDefault();
  load(e.dataTransfer.files[0]);
});

function startCrop(){
  showTool();
  const a=avail();
  sc=Math.min(a/img.width,a/img.height);
  setSize(a,a);
  const iw=img.width*sc,ih=img.height*sc;
  IM={x:(a-iw)/2,y:(a-ih)/2,w:iw,h:ih};
  const m=Math.min(iw,ih);
  crop={x:IM.x+(iw-m)/2,y:IM.y+(ih-m)/2,s:m};
  mode='crop';
  ui();
  draw();
}
function startEdit(){
  const a=avail();
  setSize(a,a);
  mode='edit';
  popSelected=true;
  ui();
  draw();
}

function drawScene(c,S){
  c.drawImage(base,0,0,S,S);
  if(!popOK)return;
  const h=pop.s*S;
  c.save();
  c.translate(pop.cx*S,pop.cy*S);
  c.rotate(pop.r);
  c.drawImage(popImg,-h/2,-h/2,h,h);
  c.restore();
}
function draw(){
  ctx.clearRect(0,0,W,H);
  if(mode==='crop'){
    ctx.drawImage(img,IM.x,IM.y,IM.w,IM.h);
    ctx.fillStyle='rgba(0,0,0,.55)';
    ctx.beginPath();
    ctx.rect(IM.x,IM.y,IM.w,IM.h);
    ctx.rect(crop.x,crop.y,crop.s,crop.s);
    ctx.fill('evenodd');
    ctx.strokeStyle=HIGHLIGHT;
    ctx.lineWidth=1.5;
    ctx.strokeRect(crop.x,crop.y,crop.s,crop.s);
    ctx.fillStyle=HIGHLIGHT;
    corners().forEach(([x,y])=>ctx.fillRect(x-5,y-5,10,10));
  }else if(mode==='edit'){
    drawScene(ctx,W);
    ctx.fillStyle='rgba(0,0,0,.6)';
    ctx.beginPath();
    ctx.rect(0,0,W,H);
    ctx.arc(W/2,H/2,W/2,0,Math.PI*2);
    ctx.fill('evenodd');
    ctx.strokeStyle='rgba(255,255,255,.7)';
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.arc(W/2,H/2,W/2-.5,0,Math.PI*2);
    ctx.stroke();
    if(popSelected){
      const h=pop.s*W;
      ctx.save();
      ctx.translate(pop.cx*W,pop.cy*H);
      ctx.rotate(pop.r);
      ctx.shadowColor='rgba(0,0,0,.6)';
      ctx.shadowBlur=3;
      ctx.strokeStyle=HIGHLIGHT;
      ctx.lineWidth=1.5;
      ctx.strokeRect(-h/2,-h/2,h,h);
      ctx.beginPath();
      ctx.moveTo(0,-h/2);
      ctx.lineTo(0,-h/2-28);
      ctx.stroke();
      ctx.fillStyle=HIGHLIGHT;
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([x,y])=>{
        ctx.fillRect(x*h/2-5,y*h/2-5,10,10);
      });
      ctx.beginPath();
      ctx.arc(0,-h/2-28,6,0,7);
      ctx.fill();
      ctx.restore();
    }
  }
}
const corners=()=>[
  [crop.x,crop.y],
  [crop.x+crop.s,crop.y],
  [crop.x+crop.s,crop.y+crop.s],
  [crop.x,crop.y+crop.s]
];
function pt(e){
  const r=cv.getBoundingClientRect();
  return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height];
}

cv.addEventListener('pointerdown',e=>{
  const[x,y]=pt(e);
  drag=null;
  if(mode==='crop'){
    const cs=corners();
    for(let i=0;i<4;i++){
      if(Math.hypot(x-cs[i][0],y-cs[i][1])<18){
        const o=cs[(i+2)%4];
        drag={t:'rs',ax:o[0],ay:o[1]};
        break;
      }
    }
    if(!drag&&x>crop.x&&x<crop.x+crop.s&&y>crop.y&&y<crop.y+crop.s){
      drag={t:'mv',dx:x-crop.x,dy:y-crop.y};
    }
  }else if(mode==='edit'){
    const px=pop.cx*W,py=pop.cy*H,h=pop.s*W/2,c=Math.cos(-pop.r),s=Math.sin(-pop.r);
    const lx=(x-px)*c-(y-py)*s,ly=(x-px)*s+(y-py)*c;
    if(Math.hypot(lx,ly+h+28)<16){
      drag={t:'rot'};
    }else if(Math.abs(Math.abs(lx)-h)<16&&Math.abs(Math.abs(ly)-h)<16){
      drag={t:'scl'};
    }else if(Math.abs(lx)<=h&&Math.abs(ly)<=h){
      drag={t:'mv',dx:x-px,dy:y-py};
    }
    popSelected=!!drag;
    draw();
  }
  if(drag){cv.setPointerCapture(e.pointerId);e.preventDefault()}
});
document.addEventListener('pointerdown',e=>{
  if(mode==='edit'&&!cv.contains(e.target)&&popSelected){popSelected=false;draw()}
});
cv.addEventListener('pointermove',e=>{
  if(!drag)return;
  const[x,y]=pt(e);
  if(mode==='crop'){
    if(drag.t==='mv'){
      crop.x=Math.max(IM.x,Math.min(IM.x+IM.w-crop.s,x-drag.dx));
      crop.y=Math.max(IM.y,Math.min(IM.y+IM.h-crop.s,y-drag.dy));
    }else{
      const sx=x>=drag.ax?1:-1,sy=y>=drag.ay?1:-1;
      let s=Math.max(Math.abs(x-drag.ax),Math.abs(y-drag.ay));
      s=Math.max(
        40,
        Math.min(
          s,
          sx>0?IM.x+IM.w-drag.ax:drag.ax-IM.x,
          sy>0?IM.y+IM.h-drag.ay:drag.ay-IM.y
        )
      );
      crop.s=s;
      crop.x=sx>0?drag.ax:drag.ax-s;
      crop.y=sy>0?drag.ay:drag.ay-s;
    }
  }else{
    const px=pop.cx*W,py=pop.cy*H;
    if(drag.t==='mv'){
      let dx=(x-drag.dx)/W-.5,dy=(y-drag.dy)/H-.5;
      const d=Math.hypot(dx,dy),m=.5-pop.s/2;
      if(d>m){
        const k=m/d;
        dx*=k;
        dy*=k;
      }
      pop.cx=.5+dx;pop.cy=.5+dy;
    }else if(drag.t==='scl'){
      const d=Math.hypot(pop.cx-.5,pop.cy-.5);
      pop.s=Math.max(.05,Math.min(Math.hypot(x-px,y-py)*Math.SQRT2/W,2*(.5-d)));
    }else pop.r=Math.atan2(y-py,x-px)+Math.PI/2;
  }
  draw();
});
['pointerup','pointercancel'].forEach(n=>{
  cv.addEventListener(n,()=>drag=null);
});
