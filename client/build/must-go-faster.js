(()=>{"use strict";const e=["white","black"],t=["a","b","c","d","e","f","g","h"],o=["1","2","3","4","5","6","7","8"],n=[...o].reverse(),r=Array.prototype.concat(...t.map((e=>o.map((t=>e+t))))),i=e=>r[8*e[0]+e[1]],s=e=>[e.charCodeAt(0)-97,e.charCodeAt(1)-49],a=r.map(s),c=()=>{let e;return{start(){e=performance.now()},cancel(){e=void 0},stop(){if(!e)return 0;const t=performance.now()-e;return e=void 0,t}}},l=e=>"white"===e?"black":"white",d=(e,t)=>{const o=e[0]-t[0],n=e[1]-t[1];return o*o+n*n},u=(e,t)=>e.role===t.role&&e.color===t.color,p=e=>(t,o)=>[(o?t[0]:7-t[0])*e.width/8,(o?7-t[1]:t[1])*e.height/8],h=(e,t)=>{e.style.transform=`translate(${t[0]}px,${t[1]}px)`},f=(e,t,o=1)=>{e.style.transform=`translate(${t[0]}px,${t[1]}px) scale(${o})`},g=(e,t)=>{e.style.visibility=t?"visible":"hidden"},v=e=>{var t;return e.clientX||0===e.clientX?[e.clientX,e.clientY]:(null===(t=e.targetTouches)||void 0===t?void 0:t[0])?[e.targetTouches[0].clientX,e.targetTouches[0].clientY]:void 0},m=e=>{var t;return!(2&~(null!==(t=e.buttons)&&void 0!==t?t:0))},b=(e,t)=>{const o=document.createElement(e);return t&&(o.className=t),o};function w(e,t,o){const n=s(e);return t||(n[0]=7-n[0],n[1]=7-n[1]),[o.left+o.width*n[0]/8+o.width/16,o.top+o.height*(7-n[1])/8+o.height/16]}const y=(e,t)=>Math.abs(e-t),k=e=>(t,o,n,r)=>y(t,n)<2&&("white"===e?r===o+1||o<=1&&r===o+2&&t===n:r===o-1||o>=6&&r===o-2&&t===n),C=(e,t,o,n)=>{const r=y(e,o),i=y(t,n);return 1===r&&2===i||2===r&&1===i},M=(e,t,o,n)=>y(e,o)===y(t,n),P=(e,t,o,n)=>e===o||t===n,x=(e,t,o,n)=>M(e,t,o,n)||P(e,t,o,n),S=(e,t,o)=>(n,r,i,s)=>y(n,i)<2&&y(r,s)<2||o&&r===s&&r===("white"===e?0:7)&&(4===n&&(2===i&&t.includes(0)||6===i&&t.includes(7))||t.includes(i));function A(e,t,o){const n=e.get(t);if(!n)return[];const r=s(t),c=n.role,l="pawn"===c?k(n.color):"knight"===c?C:"bishop"===c?M:"rook"===c?P:"queen"===c?x:S(n.color,function(e,t){const o="white"===t?"1":"8",n=[];for(const[r,i]of e)r[1]===o&&i.color===t&&"rook"===i.role&&n.push(s(r)[0]);return n}(e,n.color),o);return a.filter((e=>(r[0]!==e[0]||r[1]!==e[1])&&l(r[0],r[1],e[0],e[1]))).map(i)}function K(e,...t){e&&setTimeout((()=>e(...t)),1)}function O(e){e.premovable.current&&(e.premovable.current=void 0,K(e.premovable.events.unset))}function W(e){const t=e.predroppable;t.current&&(t.current=void 0,K(t.events.unset))}function q(e,t,o){const n=e.pieces.get(t),r=e.pieces.get(o);if(t===o||!n)return!1;const a=r&&r.color!==n.color?r:void 0;return o===e.selected&&N(e),K(e.events.move,t,o,a),function(e,t,o){if(!e.autoCastle)return!1;const n=e.pieces.get(t);if(!n||"king"!==n.role)return!1;const r=s(t),a=s(o);if(0!==r[1]&&7!==r[1]||r[1]!==a[1])return!1;4!==r[0]||e.pieces.has(o)||(6===a[0]?o=i([7,a[1]]):2===a[0]&&(o=i([0,a[1]])));const c=e.pieces.get(o);return!(!c||c.color!==n.color||"rook"!==c.role||(e.pieces.delete(t),e.pieces.delete(o),r[0]<a[0]?(e.pieces.set(i([6,a[1]]),n),e.pieces.set(i([5,a[1]]),c)):(e.pieces.set(i([2,a[1]]),n),e.pieces.set(i([3,a[1]]),c)),0))}(e,t,o)||(e.pieces.set(o,n),e.pieces.delete(t)),e.lastMove=[t,o],e.check=void 0,K(e.events.change),a||!0}function T(e,t,o,n){if(e.pieces.has(o)){if(!n)return!1;e.pieces.delete(o)}return K(e.events.dropNewPiece,t,o),e.pieces.set(o,t),e.lastMove=[o],e.check=void 0,K(e.events.change),e.movable.dests=void 0,e.turnColor=l(e.turnColor),!0}function $(e,t,o){const n=q(e,t,o);return n&&(e.movable.dests=void 0,e.turnColor=l(e.turnColor),e.animation.current=void 0),n}function D(e,t,o){if(z(e,t,o)){const n=$(e,t,o);if(n){const r=e.hold.stop();N(e);const i={premove:!1,ctrlKey:e.stats.ctrlKey,holdTime:r};return!0!==n&&(i.captured=n),K(e.movable.events.after,t,o,i),!0}}else if(function(e,t,o){var n,r;const i=null!==(r=null===(n=e.premovable.customDests)||void 0===n?void 0:n.get(t))&&void 0!==r?r:A(e.pieces,t,e.premovable.castle);return t!==o&&R(e,t)&&i.includes(o)}(e,t,o))return function(e,t,o,n){W(e),e.premovable.current=[t,o],K(e.premovable.events.set,t,o,n)}(e,t,o,{ctrlKey:e.stats.ctrlKey}),N(e),!0;return N(e),!1}function E(e,t,o,n){const r=e.pieces.get(t);r&&(function(e,t,o){const n=e.pieces.get(t);return!(!n||t!==o&&e.pieces.has(o)||"both"!==e.movable.color&&(e.movable.color!==n.color||e.turnColor!==n.color))}(e,t,o)||n)?(e.pieces.delete(t),T(e,r,o,n),K(e.movable.events.afterNewPiece,r.role,o,{premove:!1,predrop:!1})):r&&function(e,t,o){const n=e.pieces.get(t),r=e.pieces.get(o);return!!n&&(!r||r.color!==e.movable.color)&&e.predroppable.enabled&&("pawn"!==n.role||"1"!==o[1]&&"8"!==o[1])&&e.movable.color===n.color&&e.turnColor!==n.color}(e,t,o)?function(e,t,o){O(e),e.predroppable.current={role:t,key:o},K(e.predroppable.events.set,t,o)}(e,r.role,o):(O(e),W(e)),e.pieces.delete(t),N(e)}function L(e,t,o){if(K(e.events.select,t),e.selected){if(e.selected===t&&!e.draggable.enabled)return N(e),void e.hold.cancel();if((e.selectable.enabled||o)&&e.selected!==t&&D(e,e.selected,t))return void(e.stats.dragged=!1)}(e.selectable.enabled||e.draggable.enabled)&&(j(e,t)||R(e,t))&&(H(e,t),e.hold.start())}function H(e,t){e.selected=t,R(e,t)?e.premovable.customDests||(e.premovable.dests=A(e.pieces,t,e.premovable.castle)):e.premovable.dests=void 0}function N(e){e.selected=void 0,e.premovable.dests=void 0,e.hold.cancel()}function j(e,t){const o=e.pieces.get(t);return!!o&&("both"===e.movable.color||e.movable.color===o.color&&e.turnColor===o.color)}const z=(e,t,o)=>{var n,r;return t!==o&&j(e,t)&&(e.movable.free||!!(null===(r=null===(n=e.movable.dests)||void 0===n?void 0:n.get(t))||void 0===r?void 0:r.includes(o)))};function R(e,t){const o=e.pieces.get(t);return!!o&&e.premovable.enabled&&e.movable.color===o.color&&e.turnColor!==o.color}function B(e){const t=e.premovable.current;if(!t)return!1;const o=t[0],n=t[1];let r=!1;if(z(e,o,n)){const t=$(e,o,n);if(t){const i={premove:!0};!0!==t&&(i.captured=t),K(e.movable.events.after,o,n,i),r=!0}}return O(e),r}function F(e){O(e),W(e),N(e)}function I(e){e.movable.color=e.movable.dests=e.animation.current=void 0,F(e)}function V(e,t,o){let n=Math.floor(8*(e[0]-o.left)/o.width);t||(n=7-n);let r=7-Math.floor(8*(e[1]-o.top)/o.height);return t||(r=7-r),n>=0&&n<8&&r>=0&&r<8?i([n,r]):void 0}const G=e=>"white"===e.orientation,X="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",Y={p:"pawn",r:"rook",n:"knight",b:"bishop",q:"queen",k:"king"},Z={pawn:"p",rook:"r",knight:"n",bishop:"b",queen:"q",king:"k"};function Q(e){"start"===e&&(e=X);const t=new Map;let o=7,n=0;for(const r of e)switch(r){case" ":case"[":return t;case"/":if(--o,o<0)return t;n=0;break;case"~":{const e=t.get(i([n-1,o]));e&&(e.promoted=!0);break}default:{const e=r.charCodeAt(0);if(e<57)n+=e-48;else{const e=r.toLowerCase();t.set(i([n,o]),{role:Y[e],color:r===e?"black":"white"}),++n}}}return t}function U(e,t){t.animation&&(_(e.animation,t.animation),(e.animation.duration||0)<70&&(e.animation.enabled=!1))}function J(e,t){var o,n,r;if((null===(o=t.movable)||void 0===o?void 0:o.dests)&&(e.movable.dests=void 0),(null===(n=t.drawable)||void 0===n?void 0:n.autoShapes)&&(e.drawable.autoShapes=[]),_(e,t),t.fen&&(e.pieces=Q(t.fen),e.drawable.shapes=(null===(r=t.drawable)||void 0===r?void 0:r.shapes)||[]),"check"in t&&function(e,t){if(e.check=void 0,!0===t&&(t=e.turnColor),t)for(const[o,n]of e.pieces)"king"===n.role&&n.color===t&&(e.check=o)}(e,t.check||!1),"lastMove"in t&&!t.lastMove?e.lastMove=void 0:t.lastMove&&(e.lastMove=t.lastMove),e.selected&&H(e,e.selected),U(e,t),!e.movable.rookCastle&&e.movable.dests){const t="white"===e.movable.color?"1":"8",o="e"+t,n=e.movable.dests.get(o),r=e.pieces.get(o);if(!n||!r||"king"!==r.role)return;e.movable.dests.set(o,n.filter((e=>!(e==="a"+t&&n.includes("c"+t)||e==="h"+t&&n.includes("g"+t)))))}}function _(e,t){for(const o in t)Object.prototype.hasOwnProperty.call(t,o)&&(Object.prototype.hasOwnProperty.call(e,o)&&ee(e[o])&&ee(t[o])?_(e[o],t[o]):e[o]=t[o])}function ee(e){if("object"!=typeof e||null===e)return!1;const t=Object.getPrototypeOf(e);return t===Object.prototype||null===t}const te=(e,t)=>t.animation.enabled?function(e,t){const o=new Map(t.pieces),n=e(t),i=function(e,t){const o=new Map,n=[],i=new Map,s=[],a=[],c=new Map;let l,d,p;for(const[t,o]of e)c.set(t,ne(t,o));for(const e of r)l=t.pieces.get(e),d=c.get(e),l?d?u(l,d.piece)||(s.push(d),a.push(ne(e,l))):a.push(ne(e,l)):d&&s.push(d);for(const e of a)d=re(e,s.filter((t=>u(e.piece,t.piece)))),d&&(p=[d.pos[0]-e.pos[0],d.pos[1]-e.pos[1]],o.set(e.key,p.concat(p)),n.push(d.key));for(const e of s)n.includes(e.key)||i.set(e.key,e.piece);return{anims:o,fadings:i}}(o,t);if(i.anims.size||i.fadings.size){const e=t.animation.current&&t.animation.current.start;t.animation.current={start:performance.now(),frequency:1/t.animation.duration,plan:i},e||ie(t,performance.now())}else t.dom.redraw();return n}(e,t):oe(e,t);function oe(e,t){const o=e(t);return t.dom.redraw(),o}const ne=(e,t)=>({key:e,pos:s(e),piece:t}),re=(e,t)=>t.sort(((t,o)=>d(e.pos,t.pos)-d(e.pos,o.pos)))[0];function ie(e,t){const o=e.animation.current;if(void 0===o)return void(e.dom.destroyed||e.dom.redrawNow());const n=1-(t-o.start)*o.frequency;if(n<=0)e.animation.current=void 0,e.dom.redrawNow();else{const t=se(n);for(const e of o.plan.anims.values())e[2]=e[0]*t,e[3]=e[1]*t;e.dom.redrawNow(!0),requestAnimationFrame(((t=performance.now())=>ie(e,t)))}}const se=e=>e<.5?4*e*e*e:(e-1)*(2*e-2)*(2*e-2)+1,ae=["green","red","blue","yellow"];function ce(e,t){if(t.touches&&t.touches.length>1)return;t.stopPropagation(),t.preventDefault(),t.ctrlKey?N(e):F(e);const o=v(t),n=V(o,G(e),e.dom.bounds());n&&(e.drawable.current={orig:n,pos:o,brush:he(t),snapToValidMove:e.drawable.defaultSnapToValidMove},le(e))}function le(e){requestAnimationFrame((()=>{const t=e.drawable.current;if(t){const o=V(t.pos,G(e),e.dom.bounds());o||(t.snapToValidMove=!1);const n=t.snapToValidMove?function(e,t,o,n){const r=s(e),c=a.filter((e=>x(r[0],r[1],e[0],e[1])||C(r[0],r[1],e[0],e[1]))),l=c.map((e=>w(i(e),o,n))).map((e=>d(t,e))),[,u]=l.reduce(((e,t,o)=>e[0]<t?e:[t,o]),[l[0],0]);return i(c[u])}(t.orig,t.pos,G(e),e.dom.bounds()):o;n!==t.mouseSq&&(t.mouseSq=n,t.dest=n!==t.orig?n:void 0,e.dom.redrawNow()),le(e)}}))}function de(e,t){e.drawable.current&&(e.drawable.current.pos=v(t))}function ue(e){const t=e.drawable.current;t&&(t.mouseSq&&function(e,t){const o=e=>e.orig===t.orig&&e.dest===t.dest,n=e.shapes.find(o);n&&(e.shapes=e.shapes.filter((e=>!o(e)))),n&&n.brush===t.brush||e.shapes.push({orig:t.orig,dest:t.dest,brush:t.brush}),fe(e)}(e.drawable,t),pe(e))}function pe(e){e.drawable.current&&(e.drawable.current=void 0,e.dom.redraw())}function he(e){var t;const o=(e.shiftKey||e.ctrlKey)&&m(e),n=e.altKey||e.metaKey||(null===(t=e.getModifierState)||void 0===t?void 0:t.call(e,"AltGraph"));return ae[(o?1:0)+(n?2:0)]}function fe(e){e.onChange&&e.onChange(e.shapes)}function ge(e){requestAnimationFrame((()=>{var t;const o=e.draggable.current;if(!o)return;(null===(t=e.animation.current)||void 0===t?void 0:t.plan.anims.has(o.orig))&&(e.animation.current=void 0);const n=e.pieces.get(o.orig);if(n&&u(n,o.piece)){if(!o.started&&d(o.pos,o.origPos)>=Math.pow(e.draggable.distance,2)&&(o.started=!0),o.started){if("function"==typeof o.element){const e=o.element();if(!e)return;e.cgDragging=!0,e.classList.add("dragging"),o.element=e}const t=e.dom.bounds();h(o.element,[o.pos[0]-t.left-t.width/16,o.pos[1]-t.top-t.height/16]),o.keyHasChanged||(o.keyHasChanged=o.orig!==V(o.pos,G(e),t))}}else be(e);ge(e)}))}function ve(e,t){e.draggable.current&&(!t.touches||t.touches.length<2)&&(e.draggable.current.pos=v(t))}function me(e,t){const o=e.draggable.current;if(!o)return;if("touchend"===t.type&&!1!==t.cancelable&&t.preventDefault(),"touchend"===t.type&&o.originTarget!==t.target&&!o.newPiece)return void(e.draggable.current=void 0);O(e),W(e);const n=V(v(t)||o.pos,G(e),e.dom.bounds());n&&o.started&&o.orig!==n?o.newPiece?E(e,o.orig,n,o.force):(e.stats.ctrlKey=t.ctrlKey,D(e,o.orig,n)&&(e.stats.dragged=!0)):o.newPiece?e.pieces.delete(o.orig):e.draggable.deleteOnDropOff&&!n&&(e.pieces.delete(o.orig),K(e.events.change)),(o.orig!==o.previouslySelected&&!o.keyHasChanged||o.orig!==n&&n)&&e.selectable.enabled||N(e),we(e),e.draggable.current=void 0,e.dom.redraw()}function be(e){const t=e.draggable.current;t&&(t.newPiece&&e.pieces.delete(t.orig),e.draggable.current=void 0,N(e),we(e),e.dom.redraw())}function we(e){const t=e.dom.elements;t.ghost&&g(t.ghost,!1)}function ye(e,t){let o=e.dom.elements.board.firstChild;for(;o;){if(o.cgKey===t&&"PIECE"===o.tagName)return o;o=o.nextSibling}}function ke(e,t){e.exploding&&(t?e.exploding.stage=t:e.exploding=void 0,e.dom.redraw())}const Ce={hilitePrimary:{key:"hilitePrimary",color:"#3291ff",opacity:1,lineWidth:1},hiliteWhite:{key:"hiliteWhite",color:"#ffffff",opacity:1,lineWidth:1}};function Me({orig:e,dest:t,brush:o,piece:n,modifiers:r,customSvg:i,label:s},a,c,l){var d,u,p;return[l.width,l.height,c,e,t,o,a&&"-",n&&Pe(n),r&&(p=r,[p.lineWidth,p.hilite&&"*"].filter((e=>e)).join(",")),i&&`custom-${xe(i.html)},${null!==(u=null===(d=i.center)||void 0===d?void 0:d[0])&&void 0!==u?u:"o"}`,s&&`label-${xe(s.text)}`].filter((e=>e)).join(",")}function Pe(e){return[e.color,e.role,e.scale].filter((e=>e)).join(",")}function xe(e){let t=0;for(let o=0;o<e.length;o++)t=(t<<5)-t+e.charCodeAt(o)>>>0;return t.toString()}function Se(e){return["#ffffff","#fff","white"].includes(e.color)?Ce.hilitePrimary:Ce.hiliteWhite}function Ae(e){const t=Te(qe("marker"),{id:"arrowhead-"+e.key,orient:"auto",overflow:"visible",markerWidth:4,markerHeight:4,refX:e.key.startsWith("hilite")?1.86:2.05,refY:2});return t.appendChild(Te(qe("path"),{d:"M0,0 V4 L3,2 Z",fill:e.color})),t.setAttribute("cgKey",e.key),t}function Ke(e,t,o,n,r,i){var s;const a=.4*.75**e.text.length,c=Ne(o,n,r),l="tr"===i?.4:0,d=Te(qe("g"),{transform:`translate(${c[0]+l},${c[1]-l})`,cgHash:t});d.appendChild(Te(qe("circle"),{r:.2,"fill-opacity":i?1:.8,"stroke-opacity":i?1:.7,"stroke-width":.03,fill:null!==(s=e.fill)&&void 0!==s?s:"#666",stroke:"white"}));const u=Te(qe("text"),{"font-size":a,"font-family":"Noto Sans","text-anchor":"middle",fill:"white",y:.13*.75**e.text.length});return u.innerHTML=e.text,d.appendChild(u),d}function Oe(e,t){return"white"===t?e:[7-e[0],7-e[1]]}function We(e,t){return!0===(e&&t.has(e)&&t.get(e).size>1)}function qe(e){return document.createElementNS("http://www.w3.org/2000/svg",e)}function Te(e,t){for(const o in t)Object.prototype.hasOwnProperty.call(t,o)&&e.setAttribute(o,t[o]);return e}function $e(e,t){return t?{color:e.color,opacity:Math.round(10*e.opacity)/10,lineWidth:Math.round(t.lineWidth||e.lineWidth),key:[e.key,t.lineWidth].filter((e=>e)).join("")}:e}function De(e,t){return(e.lineWidth||10)*(t?.85:1)/64}function Ee(e,t){return(e.opacity||1)*(t?.9:1)}function Le(e,t){const o=Math.min(1,t.width/t.height),n=Math.min(1,t.height/t.width);return[(e[0]-3.5)*o,(3.5-e[1])*n]}function He(e,t,o=!0){const n=Math.atan2(t[1]-e[1],t[0]-e[0])+Math.PI;return o?(Math.round(8*n/Math.PI)+16)%16:n}function Ne(e,t,o){let n=function(e,t){return Math.sqrt([e[0]-t[0],e[1]-t[1]].reduce(((e,t)=>e+t*t),0))}(e,t);const r=He(e,t,!1);if(o&&(n-=33/64,o.size>1)){n-=10/64;const r=He(e,t);(o.has((r+1)%16)||o.has((r+15)%16))&&1&r&&(n-=.4)}return[e[0]-Math.cos(r)*n,e[1]-Math.sin(r)*n].map((e=>e+.5))}function je(e,t){const o=b("coords",t);let n;for(const t of e)n=b("coord"),n.textContent=t,o.appendChild(n);return o}function ze(e,t,o,n){return e.addEventListener(t,o,n),()=>e.removeEventListener(t,o,n)}const Re=e=>t=>{e.draggable.current?be(e):e.drawable.current?pe(e):t.shiftKey||m(t)?e.drawable.enabled&&ce(e,t):e.viewOnly||(e.dropmode.active?function(e,t){if(!e.dropmode.active)return;O(e),W(e);const o=e.dropmode.piece;if(o){e.pieces.set("a0",o);const n=v(t),r=n&&V(n,G(e),e.dom.bounds());r&&E(e,"a0",r)}e.dom.redraw()}(e,t):function(e,t){if(!e.trustAllEvents&&!t.isTrusted)return;if(void 0!==t.buttons&&t.buttons>1)return;if(t.touches&&t.touches.length>1)return;const o=e.dom.bounds(),n=v(t),r=V(n,G(e),o);if(!r)return;const i=e.pieces.get(r),a=e.selected;var c;if(a||!e.drawable.enabled||!e.drawable.eraseOnClick&&i&&i.color===e.turnColor||(c=e).drawable.shapes.length&&(c.drawable.shapes=[],c.dom.redraw(),fe(c.drawable)),!1!==t.cancelable&&(!t.touches||e.blockTouchScroll||i||a||function(e,t){const o=G(e),n=e.dom.bounds(),r=Math.pow(n.width/8,2);for(const i of e.pieces.keys()){const e=w(i,o,n);if(d(e,t)<=r)return!0}return!1}(e,n)))t.preventDefault();else if(t.touches)return;const l=!!e.premovable.current,u=!!e.predroppable.current;e.stats.ctrlKey=t.ctrlKey,e.selected&&z(e,e.selected,r)?te((e=>L(e,r)),e):L(e,r);const f=e.selected===r,m=ye(e,r);if(i&&m&&f&&function(e,t){const o=e.pieces.get(t);return!!o&&e.draggable.enabled&&("both"===e.movable.color||e.movable.color===o.color&&(e.turnColor===o.color||e.premovable.enabled))}(e,r)){e.draggable.current={orig:r,piece:i,origPos:n,pos:n,started:e.draggable.autoDistance&&e.stats.dragged,element:m,previouslySelected:a,originTarget:t.target,keyHasChanged:!1},m.cgDragging=!0,m.classList.add("dragging");const c=e.dom.elements.ghost;c&&(c.className=`ghost ${i.color} ${i.role}`,h(c,p(o)(s(r),G(e))),g(c,!0)),ge(e)}else l&&O(e),u&&W(e);e.dom.redraw()}(e,t))},Be=(e,t,o)=>n=>{e.drawable.current?e.drawable.enabled&&o(e,n):e.viewOnly||t(e,n)};function Fe(e){var t,o;const n=e.dom.elements.wrap.getBoundingClientRect(),r=e.dom.elements.container,i=n.height/n.width,s=8*Math.floor(n.width*window.devicePixelRatio/8)/window.devicePixelRatio,a=s*i;r.style.width=s+"px",r.style.height=a+"px",e.dom.bounds.clear(),null===(t=e.addDimensionsCssVarsTo)||void 0===t||t.style.setProperty("--cg-width",s+"px"),null===(o=e.addDimensionsCssVarsTo)||void 0===o||o.style.setProperty("--cg-height",a+"px")}const Ie=e=>"PIECE"===e.tagName,Ve=e=>"SQUARE"===e.tagName;function Ge(e,t){for(const o of t)e.dom.elements.board.removeChild(o)}function Xe(e,t){const o=e[1];return`${t?10-o:3+o}`}const Ye=e=>`${e.color} ${e.role}`;function Ze(e,t,o){const n=e.get(t);n?e.set(t,`${n} ${o}`):e.set(t,o)}function Qe(e,t,o){const n=e.get(t);n?n.push(o):e.set(t,[o])}const Ue=e=>{var t,o,n;return[e.orig,null===(t=e.piece)||void 0===t?void 0:t.role,null===(o=e.piece)||void 0===o?void 0:o.color,null===(n=e.piece)||void 0===n?void 0:n.scale].join(",")};function Je(r,i){const a={pieces:Q(X),orientation:"white",turnColor:"white",coordinates:!0,ranksPosition:"right",autoCastle:!0,viewOnly:!1,disableContextMenu:!1,addPieceZIndex:!1,blockTouchScroll:!1,pieceKey:!1,trustAllEvents:!1,highlight:{lastMove:!0,check:!0},animation:{enabled:!0,duration:200},movable:{free:!0,color:"both",showDests:!0,events:{},rookCastle:!0},premovable:{enabled:!0,showDests:!0,castle:!0,events:{}},predroppable:{enabled:!1,events:{}},draggable:{enabled:!0,distance:3,autoDistance:!0,showGhost:!0,deleteOnDropOff:!1},dropmode:{active:!1},selectable:{enabled:!0},stats:{dragged:!("ontouchstart"in window)},events:{},drawable:{enabled:!0,visible:!0,defaultSnapToValidMove:!0,eraseOnClick:!0,shapes:[],autoShapes:[],brushes:{green:{key:"g",color:"#15781B",opacity:1,lineWidth:10},red:{key:"r",color:"#882020",opacity:1,lineWidth:10},blue:{key:"b",color:"#003088",opacity:1,lineWidth:10},yellow:{key:"y",color:"#e68f00",opacity:1,lineWidth:10},paleBlue:{key:"pb",color:"#003088",opacity:.4,lineWidth:15},paleGreen:{key:"pg",color:"#15781B",opacity:.4,lineWidth:15},paleRed:{key:"pr",color:"#882020",opacity:.4,lineWidth:15},paleGrey:{key:"pgr",color:"#4a4a4a",opacity:.35,lineWidth:15},purple:{key:"purple",color:"#68217a",opacity:.65,lineWidth:10},pink:{key:"pink",color:"#ee2080",opacity:.5,lineWidth:10},white:{key:"white",color:"white",opacity:1,lineWidth:10}},prevSvgHash:""},hold:c()};function d(){const n="dom"in a?a.dom.unbind:void 0,i=function(n,r){n.innerHTML="",n.classList.add("cg-wrap");for(const t of e)n.classList.toggle("orientation-"+t,r.orientation===t);n.classList.toggle("manipulable",!r.viewOnly);const i=b("cg-container");n.appendChild(i);const s=b("cg-board");let a,c,l,d;if(i.appendChild(s),r.drawable.visible&&(a=Te(qe("svg"),{class:"cg-shapes",viewBox:"-4 -4 8 8",preserveAspectRatio:"xMidYMid slice"}),a.appendChild(function(){const e=qe("defs"),t=Te(qe("filter"),{id:"cg-filter-blur"});return t.appendChild(Te(qe("feGaussianBlur"),{stdDeviation:"0.019"})),e.appendChild(t),e}()),a.appendChild(qe("g")),c=Te(qe("svg"),{class:"cg-custom-svgs",viewBox:"-3.5 -3.5 8 8",preserveAspectRatio:"xMidYMid slice"}),c.appendChild(qe("g")),l=b("cg-auto-pieces"),i.appendChild(a),i.appendChild(c),i.appendChild(l)),r.coordinates){const e="black"===r.orientation?" black":"",n="left"===r.ranksPosition?" left":"";i.appendChild(je(o,"ranks"+e+n)),i.appendChild(je(t,"files"+e))}return r.draggable.enabled&&r.draggable.showGhost&&(d=b("piece","ghost"),g(d,!1),i.appendChild(d)),{board:s,container:i,wrap:n,ghost:d,svg:a,customSvg:c,autoPieces:l}}(r,a),c=function(e){let t;const o=()=>(void 0===t&&(t=i.board.getBoundingClientRect()),t);return o.clear=()=>{t=void 0},o}(),l=e=>{(function(e){const t=G(e),o=p(e.dom.bounds()),n=e.dom.elements.board,r=e.pieces,i=e.animation.current,a=i?i.plan.anims:new Map,c=i?i.plan.fadings:new Map,l=e.draggable.current,d=function(e){var t,o,n;const r=new Map;if(e.lastMove&&e.highlight.lastMove)for(const t of e.lastMove)Ze(r,t,"last-move");if(e.check&&e.highlight.check&&Ze(r,e.check,"check"),e.selected&&(Ze(r,e.selected,"selected"),e.movable.showDests)){const i=null===(t=e.movable.dests)||void 0===t?void 0:t.get(e.selected);if(i)for(const t of i)Ze(r,t,"move-dest"+(e.pieces.has(t)?" oc":""));const s=null!==(n=null===(o=e.premovable.customDests)||void 0===o?void 0:o.get(e.selected))&&void 0!==n?n:e.premovable.dests;if(s)for(const t of s)Ze(r,t,"premove-dest"+(e.pieces.has(t)?" oc":""))}const i=e.premovable.current;if(i)for(const e of i)Ze(r,e,"current-premove");else e.predroppable.current&&Ze(r,e.predroppable.current.key,"current-premove");const s=e.exploding;if(s)for(const e of s.keys)Ze(r,e,"exploding"+s.stage);return e.highlight.custom&&e.highlight.custom.forEach(((e,t)=>{Ze(r,t,e)})),r}(e),u=new Set,f=new Set,g=new Map,v=new Map;let m,w,y,k,C,M,P,x,S,A;for(w=n.firstChild;w;){if(m=w.cgKey,Ie(w))if(y=r.get(m),C=a.get(m),M=c.get(m),k=w.cgPiece,!w.cgDragging||l&&l.orig===m||(w.classList.remove("dragging"),h(w,o(s(m),t)),w.cgDragging=!1),!M&&w.cgFading&&(w.cgFading=!1,w.classList.remove("fading")),y){if(C&&w.cgAnimating&&k===Ye(y)){const e=s(m);e[0]+=C[2],e[1]+=C[3],w.classList.add("anim"),h(w,o(e,t))}else w.cgAnimating&&(w.cgAnimating=!1,w.classList.remove("anim"),h(w,o(s(m),t)),e.addPieceZIndex&&(w.style.zIndex=Xe(s(m),t)));k!==Ye(y)||M&&w.cgFading?M&&k===Ye(M)?(w.classList.add("fading"),w.cgFading=!0):Qe(g,k,w):u.add(m)}else Qe(g,k,w);else if(Ve(w)){const e=w.className;d.get(m)===e?f.add(m):Qe(v,e,w)}w=w.nextSibling}for(const[e,r]of d)if(!f.has(e)){S=v.get(r),A=S&&S.pop();const i=o(s(e),t);if(A)A.cgKey=e,h(A,i);else{const t=b("square",r);t.cgKey=e,h(t,i),n.insertBefore(t,n.firstChild)}}for(const[i,c]of r)if(C=a.get(i),!u.has(i))if(P=g.get(Ye(c)),x=P&&P.pop(),x){x.cgKey=i,x.cgFading&&(x.classList.remove("fading"),x.cgFading=!1);const n=s(i);e.addPieceZIndex&&(x.style.zIndex=Xe(n,t)),C&&(x.cgAnimating=!0,x.classList.add("anim"),n[0]+=C[2],n[1]+=C[3]),h(x,o(n,t))}else{const r=Ye(c),a=b("piece",r),l=s(i);a.cgPiece=r,a.cgKey=i,C&&(a.cgAnimating=!0,l[0]+=C[2],l[1]+=C[3]),h(a,o(l,t)),e.addPieceZIndex&&(a.style.zIndex=Xe(l,t)),n.appendChild(a)}for(const t of g.values())Ge(e,t);for(const t of v.values())Ge(e,t)})(u),i.autoPieces&&function(e,t){!function(t,o,n){const r=new Map,i=[];for(const e of t)r.set(e.hash,!1);let a,c=o.firstElementChild;for(;c;)a=c.getAttribute("cgHash"),r.has(a)?r.set(a,!0):i.push(c),c=c.nextElementSibling;for(const e of i)o.removeChild(e);for(const n of t)r.get(n.hash)||o.appendChild(function(e,{shape:t,hash:o},n){var r,i,a;const c=t.orig,l=null===(r=t.piece)||void 0===r?void 0:r.role,d=null===(i=t.piece)||void 0===i?void 0:i.color,u=null===(a=t.piece)||void 0===a?void 0:a.scale,h=b("piece",`${l} ${d}`);return h.setAttribute("cgHash",o),h.cgKey=c,h.cgScale=u,f(h,p(n)(s(c),G(e)),u),h}(e,n,e.dom.bounds()))}(e.drawable.autoShapes.filter((e=>e.piece)).map((e=>({shape:e,hash:Ue(e),current:!1}))),t)}(u,i.autoPieces),!e&&i.svg&&function(e,t,o){var n;const r=e.drawable,i=r.current,a=i&&i.mouseSq?i:void 0,c=new Map,l=e.dom.bounds(),d=r.autoShapes.filter((e=>!e.piece));for(const t of r.shapes.concat(d).concat(a?[a]:[])){if(!t.dest)continue;const o=null!==(n=c.get(t.dest))&&void 0!==n?n:new Set,r=Le(Oe(s(t.orig),e.orientation),l),i=Le(Oe(s(t.dest),e.orientation),l);o.add(He(r,i)),c.set(t.dest,o)}const u=r.shapes.concat(d).map((e=>({shape:e,current:!1,hash:Me(e,We(e.dest,c),!1,l)})));a&&u.push({shape:a,current:!0,hash:Me(a,We(a.dest,c),!0,l)});const p=u.map((e=>e.hash)).join(";");if(p===e.drawable.prevSvgHash)return;e.drawable.prevSvgHash=p;const h=t.querySelector("defs");!function(e,t,o){var n;const r=new Map;let i;for(const o of t.filter((e=>e.shape.dest&&e.shape.brush)))i=$e(e.brushes[o.shape.brush],o.shape.modifiers),(null===(n=o.shape.modifiers)||void 0===n?void 0:n.hilite)&&r.set(Se(i).key,Se(i)),r.set(i.key,i);const s=new Set;let a=o.firstElementChild;for(;a;)s.add(a.getAttribute("cgKey")),a=a.nextElementSibling;for(const[e,t]of r.entries())s.has(e)||o.appendChild(Ae(t))}(r,u,h),function(t,o,n,i){const a=new Map;for(const e of t)a.set(e.hash,!1);for(const e of[o,n]){const t=[];let o,n=e.firstElementChild;for(;n;)o=n.getAttribute("cgHash"),a.has(o)?a.set(o,!0):t.push(n),n=n.nextElementSibling;for(const o of t)e.removeChild(o)}for(const i of t.filter((e=>!a.get(e.hash))))for(const t of function(e,{shape:t,current:o,hash:n},r,i,a){var c,l;const d=Le(Oe(s(t.orig),e.orientation),a),u=t.dest?Le(Oe(s(t.dest),e.orientation),a):d,p=t.brush&&$e(r[t.brush],t.modifiers),h=i.get(t.dest),f=[];if(p){const e=Te(qe("g"),{cgHash:n});f.push({el:e}),d[0]!==u[0]||d[1]!==u[1]?e.appendChild(function(e,t,o,n,r,i){var s;function a(s){var a;const c=function(e){return(e?20:10)/64}(i&&!r),l=n[0]-o[0],d=n[1]-o[1],u=Math.atan2(d,l),p=Math.cos(u)*c,h=Math.sin(u)*c;return Te(qe("line"),{stroke:s?Se(t).color:t.color,"stroke-width":De(t,r)+(s?.04:0),"stroke-linecap":"round","marker-end":`url(#arrowhead-${s?Se(t).key:t.key})`,opacity:(null===(a=e.modifiers)||void 0===a?void 0:a.hilite)?1:Ee(t,r),x1:o[0],y1:o[1],x2:n[0]-p,y2:n[1]-h})}if(!(null===(s=e.modifiers)||void 0===s?void 0:s.hilite))return a(!1);const c=qe("g"),l=Te(qe("g"),{filter:"url(#cg-filter-blur)"});return l.appendChild(function(e,t){const o={from:[Math.floor(Math.min(e[0],t[0])),Math.floor(Math.min(e[1],t[1]))],to:[Math.ceil(Math.max(e[0],t[0])),Math.ceil(Math.max(e[1],t[1]))]};return Te(qe("rect"),{x:o.from[0],y:o.from[1],width:o.to[0]-o.from[0],height:o.to[1]-o.from[1],fill:"none",stroke:"none"})}(o,n)),l.appendChild(a(!0)),c.appendChild(l),c.appendChild(a(!1)),c}(t,p,d,u,o,We(t.dest,i))):e.appendChild(function(e,t,o,n){const r=[3/64,4/64],i=(n.width+n.height)/(4*Math.max(n.width,n.height));return Te(qe("circle"),{stroke:e.color,"stroke-width":r[o?0:1],fill:"none",opacity:Ee(e,o),cx:t[0],cy:t[1],r:i-r[1]/2})}(r[t.brush],d,o,a))}if(t.label){const e=t.label;null!==(c=e.fill)&&void 0!==c||(e.fill=t.brush&&r[t.brush].color);const o=t.brush?void 0:"tr";f.push({el:Ke(e,n,d,u,h,o),isCustom:!0})}if(t.customSvg){const e=null!==(l=t.customSvg.center)&&void 0!==l?l:"orig",[o,r]="label"===e?Ne(d,u,h).map((e=>e-.5)):"dest"===e?u:d,i=Te(qe("g"),{transform:`translate(${o},${r})`,cgHash:n});i.innerHTML=`<svg width="1" height="1" viewBox="0 0 100 100">${t.customSvg.html}</svg>`,f.push({el:i,isCustom:!0})}return f}(e,i,r.brushes,c,l))t.isCustom?n.appendChild(t.el):o.appendChild(t.el)}(u,t.querySelector("g"),o.querySelector("g"))}(u,i.svg,i.customSvg)},d=()=>{Fe(u),function(e){const t=G(e),o=p(e.dom.bounds());let n=e.dom.elements.board.firstChild;for(;n;)(Ie(n)&&!n.cgAnimating||Ve(n))&&h(n,o(s(n.cgKey),t)),n=n.nextSibling}(u),i.autoPieces&&function(e){var t;const o=G(e),n=p(e.dom.bounds());let r=null===(t=e.dom.elements.autoPieces)||void 0===t?void 0:t.firstChild;for(;r;)f(r,n(s(r.cgKey),o),r.cgScale),r=r.nextSibling}(u)},u=a;return u.dom={elements:i,bounds:c,redraw:_e(l),redrawNow:l,unbind:n},u.drawable.prevSvgHash="",Fe(u),l(!1),function(e,t){const o=e.dom.elements.board;if("ResizeObserver"in window&&new ResizeObserver(t).observe(e.dom.elements.wrap),(e.disableContextMenu||e.drawable.enabled)&&o.addEventListener("contextmenu",(e=>e.preventDefault())),e.viewOnly)return;const n=Re(e);o.addEventListener("touchstart",n,{passive:!1}),o.addEventListener("mousedown",n,{passive:!1})}(u,d),n||(u.dom.unbind=function(e,t){const o=[];if("ResizeObserver"in window||o.push(ze(document.body,"chessground.resize",t)),!e.viewOnly){const t=Be(e,ve,de),n=Be(e,me,ue);for(const e of["touchmove","mousemove"])o.push(ze(document,e,t));for(const e of["touchend","mouseup"])o.push(ze(document,e,n));const r=()=>e.dom.bounds.clear();o.push(ze(document,"scroll",r,{capture:!0,passive:!0})),o.push(ze(window,"resize",r,{passive:!0}))}return()=>o.forEach((e=>e()))}(u,d)),u.events.insert&&u.events.insert(i),u}return J(a,i||{}),function(e,o){function r(){!function(e){e.orientation=l(e.orientation),e.animation.current=e.draggable.current=e.selected=void 0}(e),o()}return{set(t){t.orientation&&t.orientation!==e.orientation&&r(),U(e,t),(t.fen?te:oe)((e=>J(e,t)),e)},state:e,getFen:()=>{return o=e.pieces,n.map((e=>t.map((t=>{const n=o.get(t+e);if(n){let e=Z[n.role];return"white"===n.color&&(e=e.toUpperCase()),n.promoted&&(e+="~"),e}return"1"})).join(""))).join("/").replace(/1{2,}/g,(e=>e.length.toString()));var o},toggleOrientation:r,setPieces(t){te((e=>function(e,t){for(const[o,n]of t)n?e.pieces.set(o,n):e.pieces.delete(o)}(e,t)),e)},selectSquare(t,o){t?te((e=>L(e,t,o)),e):e.selected&&(N(e),e.dom.redraw())},move(t,o){te((e=>q(e,t,o)),e)},newPiece(t,o){te((e=>T(e,t,o)),e)},playPremove(){if(e.premovable.current){if(te(B,e))return!0;e.dom.redraw()}return!1},playPredrop(t){if(e.predroppable.current){const o=function(e,t){const o=e.predroppable.current;let n=!1;return!!o&&(t(o)&&T(e,{role:o.role,color:e.movable.color},o.key)&&(K(e.movable.events.afterNewPiece,o.role,o.key,{premove:!1,predrop:!0}),n=!0),W(e),n)}(e,t);return e.dom.redraw(),o}return!1},cancelPremove(){oe(O,e)},cancelPredrop(){oe(W,e)},cancelMove(){oe((e=>{F(e),be(e)}),e)},stop(){oe((e=>{I(e),be(e)}),e)},explode(t){!function(e,t){e.exploding={stage:1,keys:t},e.dom.redraw(),setTimeout((()=>{ke(e,2),setTimeout((()=>ke(e,void 0)),120)}),120)}(e,t)},setAutoShapes(t){oe((e=>e.drawable.autoShapes=t),e)},setShapes(t){oe((e=>e.drawable.shapes=t),e)},getKeyAtDomPos:t=>V(t,G(e),e.dom.bounds()),redrawAll:o,dragNewPiece(t,o,n){!function(e,t,o,n){const r="a0";e.pieces.set(r,t),e.dom.redraw();const i=v(o);e.draggable.current={orig:r,piece:t,origPos:i,pos:i,started:!0,element:()=>ye(e,r),originTarget:o.target,newPiece:!0,force:!!n,keyHasChanged:!1},ge(e)}(e,t,o,n)},destroy(){I(e),e.dom.unbind&&e.dom.unbind(),e.dom.destroyed=!0}}}(d(),d)}function _e(e){let t=!1;return()=>{t||(t=!0,requestAnimationFrame((()=>{e(),t=!1})))}}window.onload=function(){Je(document.querySelector("#board"),{})}})();