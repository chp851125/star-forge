// 星煉工坊 音效合成參考(僅供參考,不是可直接匯入的模組)
// 已定案的聲音設計:請在 TypeScript 中忠實移植,不要自行「改良」音色。
// 依賴的全域物件:
//   C  = AudioContext
//   M  = master GainNode(已接到 DynamicsCompressor → destination)
//   NB = 2 秒的白噪音 AudioBuffer(單聲道,Math.random()*2-1)
const now = () => C.currentTime;

function env(g,t,v,d){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(0.0001,t+d)}
function tone(f,ty,t,d,v,f2){const o=C.createOscillator(),g=C.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);env(g,t,v,d);o.connect(g);g.connect(M);o.start(t);o.stop(t+d+.05)}
function nz(t,d,v,ty,f,f2,q){const s=C.createBufferSource();s.buffer=NB;const fl=C.createBiquadFilter();fl.type=ty;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+d);fl.Q.value=q||1;const g=C.createGain();env(g,t,v,d);s.connect(fl);fl.connect(g);g.connect(M);s.start(t,Math.random());s.stop(t+d+.05)}
function bell(f,t,d,v){[1,2.76,5.4,8.93].forEach((m,i)=>tone(f*m,'sine',t,d/(1+i*.8),v/(1+i*1.2)))}
const S={
hammer(){const t=now();nz(t,.07,.9,'highpass',1800);bell(380,t,.45,.5);tone(110,'sine',t,.25,.9,45)},
success(){const t=now();[660,880,1320].forEach((f,i)=>bell(f,t+i*.07,.5,.35));nz(t+.15,.25,.25,'highpass',6000)},
evolve(){const t=now();nz(t,.7,.5,'bandpass',300,4000,2);tone(220,'sawtooth',t,.7,.25,880);const e=t+.7;tone(60,'sine',e,.6,1,30);nz(e,.25,.6,'highpass',2500);[523,659,784,1047].forEach(f=>bell(f,e,.9,.3))},
keep(){const t=now();bell(200,t,.2,.35);tone(90,'sine',t,.15,.5,60)},
drop(){const t=now();tone(440,'sawtooth',t,.4,.3,90);nz(t,.35,.35,'bandpass',2500,300,3);tone(80,'sine',t+.1,.3,.7,40)},
reset(){const t=now();nz(t,.7,.9,'lowpass',6000,300);for(let i=0;i<14;i++)bell(2000+Math.random()*4000,t+Math.random()*.4,.2,.18);tone(70,'sine',t,.9,1,28);[0,.28].forEach(d=>tone(880,'square',t+.5+d,.18,.15))},
pity(){const t=now();bell(880,t,.8,.4);bell(1320,t+.1,.8,.3);nz(t,.5,.2,'highpass',7000)},
roll(){const t=now();nz(t,.28,.3,'bandpass',900,3200,4);[0,.07,.14].forEach(d=>tone(900+Math.random()*900,'sine',t+d,.08,.2))},
blue(){bell(660,now(),.35,.35)},
purple(){const t=now();bell(784,t,.4,.35);bell(988,t+.09,.5,.35)},
gold(){const t=now();[784,988,1175,1568].forEach((f,i)=>bell(f,t+i*.08,.6,.33));nz(t+.3,.3,.2,'highpass',6000)},
red(){const t=now();tone(55,'sine',t,1.2,1,30);[523,659,784,1047,1568].forEach((f,i)=>bell(f,t+i*.09,1.2,.35));nz(t,1,.3,'highpass',3000,9000)},
lock(){const t=now();nz(t,.03,.8,'highpass',2500);tone(1200,'square',t,.05,.15);tone(700,'square',t+.04,.07,.15)},
unlock(){const t=now();nz(t,.03,.6,'highpass',2000);tone(600,'square',t,.05,.12);tone(1000,'square',t+.04,.07,.12)},
click(){tone(1400,'sine',now(),.04,.25)},
confirm(){const t=now();tone(660,'sine',t,.08,.3);tone(990,'sine',t+.07,.12,.3)},
error(){tone(140,'sawtooth',now(),.15,.25)},
stamp(){const t=now();tone(120,'sine',t,.4,1,45);nz(t,.1,.7,'lowpass',3000,400);bell(1047,t+.12,.8,.4);[1047,1319,1568,2093].forEach((f,i)=>bell(f,t+.3+i*.08,.9,.3))}
};
