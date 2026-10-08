const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/AARON/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const css = fs.readFileSync(path.join(__dirname,'system-architecture.html'),'utf8').match(/<style>([\s\S]*?)<\/style>/)[1] + 'table{font-size:12px}td,th{padding:6px 10px}';
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const page=(title,body,n,total,label)=>`<section class="page"><div class="eyebrow">Chain Daan • ${label}</div><h2>${title}</h2>${body}<div class="footer"><span>Implemented design • Source inspection: 7 October 2026</span><span>${n} / ${total}</span></div></section>`;
const table=(heads,rows)=>`<table><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
const text=(x,y,s,size=13)=>`<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle">${esc(s)}</text>`;
const actor=(x,y,name)=>`<g stroke="#193148" stroke-width="2" fill="none"><circle cx="${x}" cy="${y}" r="12"/><path d="M${x} ${y+12}v37m-25 -23h50m-25 23l-22 30m22 -30l22 30"/></g>${text(x,y+100,name,14)}`;
const uc=(x,y,label,rx=135)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="27" fill="#edf7f7" stroke="#39858b" stroke-width="1.5"/>${text(x,y+5,label)}`;
const line=(x,y,a,b)=>`<path d="M${x} ${y}L${a} ${b}" stroke="#76909d" fill="none"/>`;
const start=`<svg viewBox="0 0 990 460"><defs><marker id="open" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="#476a7e"/></marker></defs>`;
let overview=start+`<rect x="145" y="8" width="700" height="438" rx="8" fill="#fbfcfd" stroke="#8ca5b3"/>`+text(495,31,'Chain Daan system',15)+actor(66,164,'Buyer')+actor(923,164,'Supplier');
const shared=['Manage own profile','Exchange messages','View / track own orders','Cancel eligible order'];
shared.forEach((s,i)=>{let y=95+i*87;overview+=line(91,202,360,y)+line(898,202,630,y)+uc(495,y,s);});
overview+=text(495,427,'Authenticated business and supplier accounts',12)+'</svg>';
const use1=page('UML use case • Shared account capabilities',`<p class="lead">Primary actors are the <b>business owner (buyer)</b> and <b>supplier</b>. Both use authenticated account, communication and order features.</p>${overview}<div class="note small"><b>Notation:</b> stick figures are actors; ellipses are user goals; solid lines are actor associations; the rectangle is the system boundary. Sign-in is a precondition for these use cases. Registration, password recovery and optional social sign-in are summarized on page 3.</div>`,1,3,'UML use case');
let commerce=start+`<rect x="145" y="8" width="700" height="438" rx="8" fill="#fbfcfd" stroke="#8ca5b3"/>`+text(495,31,'Chain Daan • Marketplace and delivery',15)+actor(66,164,'Buyer')+actor(923,164,'Supplier');
['Find suppliers / products','Place order','Submit GCash proof','Resubmit rejected proof'].forEach((s,i)=>{let y=89+i*94;commerce+=line(91,202,180,y)+uc(310,y,s,130);});
['Manage products & stock','Review GCash payment','Confirm / complete order','Share delivery location'].forEach((s,i)=>{let y=89+i*94;commerce+=line(898,202,810,y)+uc(680,y,s,130);});
commerce+='</svg>';
const use2=page('UML use case • Buying, selling and delivery',`<p class="lead">Role-specific use cases complement the shared capabilities on page 1. Payment and order status follow separate review steps.</p>${commerce}<div class="note small"><b>Conditions:</b> GCash proof is required only when GCash is selected. Only suppliers can confirm or complete orders. Location sharing is available for confirmed orders. Buying and selling are represented as goals, not as a sequence diagram.</div>`,2,3,'UML use case');
const use3=page('Use case descriptions and supporting actors',table(['Use case / actor','Precondition and main behavior','Result or alternate path'],[
['Register / sign in<br><b>Visitor</b>','Create a business or supplier account; authenticate with credentials or a configured social provider.','Receive a session and access the role dashboard.'],
['Recover password<br><b>Account holder; SMTP service</b>','Request reset email and submit a valid reset token with a new password.','Password is updated; invalid or expired tokens fail.'],
['Social sign-in<br><b>Visitor; Google / Facebook</b>','Configured provider authenticates the user through OAuth.','API resolves the account and redirects to the frontend.'],
['Place order<br><b>Buyer</b>','Choose a product, valid quantity, delivery details and payment method. GCash requires a product QR and receipt details.','Pending order is saved; supplier receives an update.'],
['Review payment<br><b>Supplier</b>','Inspect the order receipt and independently verify received funds.','Approve, or reject with a reason; buyer may resubmit.'],
['Confirm / complete<br><b>Supplier</b>','GCash must be approved. Confirmation checks available stock; completion requires confirmation.','Confirmation reserves stock; completion closes the order.'],
['Track / share location<br><b>Buyer; Supplier</b>','Order participant views tracking. Supplier grants browser GPS access and keeps the page open.','Locations are stored and shared; maps use OpenStreetMap tiles.'],
['Manage images<br><b>Supplier / account holder; Cloudinary</b>','Upload product images, QR image or own profile photo through the API.','Hosted image URL is stored. Receipt images use MongoDB instead.'],
['Send feedback / delete account<br><b>Visitor / account holder</b>','Submit feedback; authenticated account deletion requires confirmation text.','Feedback is stored; deletion removes the account and related records handled by the route.']
])+`<p class="small muted" style="margin-top:14px">Scope: no administrator, courier account or automated GCash gateway is implemented. Sources: frontend/src/App.jsx, dashboard and tracking components, backend/server.js, backend/order-status.js, PAYMENTS.md and TRACKING.md. Supporting services above participate in specific use cases; they are not additional user roles.</p>`,3,3,'UML use case');
const entity=(x,y,w,title,rows)=>`<rect x="${x}" y="${y}" width="${w}" height="${42+rows.length*22}" rx="8" fill="#f0f6fa" stroke="#7395aa"/><text x="${x+14}" y="${y+26}" font-weight="700" font-size="16">${title}</text>${rows.map((r,i)=>`<text x="${x+14}" y="${y+53+i*22}" font-size="12">${esc(r)}</text>`).join('')}`;
let er=`<svg viewBox="0 0 990 410">`;
er+=line(280,95,395,95)+text(330,78,'1 : 0..*',12)+line(510,149,510,225)+text(558,192,'1 : 0..*',12)+line(160,171,160,296)+text(204,215,'1 : 0..*',12)+line(280,315,395,315)+text(336,299,'0..* : 1',12)+line(625,290,735,290)+text(680,273,'1 : 0..*',12);
er+=entity(20,20,260,'Profile',['_id : ObjectId','role : business | supplier','name, email, contact data','authentication / social IDs']);
er+=entity(395,20,230,'Product',['_id : ObjectId','supplierId → Profile','name, price, stock']);
er+=entity(20,255,260,'Sale (order)',['_id : ObjectId','buyerId, supplierId → Profile','productId → Product','status, total, payment {...}']);
er+=entity(395,225,230,'TrackingPoint',['_id : ObjectId','orderId → Sale (logical)','latitude, longitude','accuracy, recordedAt']);
// Replace ambiguous connecting lines with explicit relationship diagram below.
er=`<svg viewBox="0 0 990 400">`+entity(20,30,255,'Profile',['_id : ObjectId','role, name, email','authentication / contact data'])+entity(380,30,240,'Product',['_id : ObjectId','supplierId → Profile','name, price, stock'])+entity(720,30,250,'Sale (order)',['_id : ObjectId','buyerId, supplierId → Profile','productId → Product'])+entity(720,248,250,'TrackingPoint',['_id : ObjectId','orderId → Sale (logical)','coordinates, recordedAt'])+entity(20,248,255,'Conversation',['_id : ObjectId','participantIds → Profile[]','lastMessageAt'])+entity(380,248,240,'Message',['_id : ObjectId','conversationId → Conversation','senderId, recipientId → Profile']);
er+=line(275,85,380,85)+text(326,69,'1 → 0..*',12)+line(620,85,720,85)+text(670,69,'1 → 0..*',12)+line(845,138,845,248)+text(896,196,'1 → 0..*',12)+line(140,138,140,248)+text(202,196,'2 ↔ 0..*',12)+line(275,302,380,302)+text(327,287,'1 → 0..*',12);
er+=`<path d="M250 139V172H735V139M250 172V219H500V248" fill="none" stroke="#76909d" stroke-dasharray="5 4"/>`+text(500,165,'Profile → Sale: buyer and supplier; Profile → Message: sender and recipient',11)+'</svg>';
const db1=page('Database design • Entity relationships',`<p class="lead">MongoDB document storage through Mongoose. Lines show intended application relationships; ObjectId references are not database-enforced foreign keys.</p>${er}<div class="grid"><div class="card small"><b>Cardinality key</b><br>1 → 0..*: one parent may have many children. Each order has one buyer, one supplier and one product. Each message has one sender and one recipient. Dashed links show these additional Profile references.</div><div class="card small"><b>Conversation and independent records</b><br>The API creates conversations with two opposite-role participants; the schema stores an array. A profile may join many conversations. Feedback is an independent collection with no ObjectId relationship.</div></div>`,1,4,'Database design');
const rows=(arr)=>table(['Field(s)','Type / constraint','Purpose'],arr);
const db2=page('Data dictionary • Accounts, catalog and chat',`<p class="small muted">All models have an automatic ObjectId <code>_id</code>. All except TrackingPoint enable <code>createdAt</code> and <code>updatedAt</code>. R = required by the declared schema; U = unique index declaration.</p>`+rows([
['<b>Profile</b>: role; name; email','String R; String R; String R/U','Role enum: business, supplier. Email lowercased and trimmed.'],
['fullName; phone; town; about; category','String (optional)','Identity, location and profile information.'],
['deliveryInfo; minimumOrder; businessHours; profilePhotoUrl','String (optional)','Supplier details and hosted profile image.'],
['facebookId; googleId','String; U, sparse','Optional provider identities.'],
['passwordHash; passwordResetTokenHash; passwordResetExpiresAt','String; String; Date; excluded by default','Password verification and reset credentials.'],
['<b>Product</b>: name; supplierId','String R; ObjectId R → Profile','Product name and owning supplier.'],
['category; price; stock','String; Number ≥ 0; Number ≥ 0, default 0','Classification, price and available inventory.'],
['images; gcashQrUrl','String[] default []; String default empty','Cloudinary image URLs and optional GCash QR URL.'],
['<b>Conversation</b>: participantIds; lastMessageAt','ObjectId[] → Profile; Date','Participant references (required per element); recent activity.'],
['<b>Message</b>: conversationId; senderId; recipientId','ObjectId R → Conversation / Profile','Conversation membership and message parties.'],
['text; readAt','String R, trimmed; Date optional','Message content and recipient read timestamp.']
])+`<div class="note small"><b>Validation boundary:</b> required schema fields and indexes are distinct from route rules. For example, roles are checked by the API when creating products and conversations; a Profile reference alone does not enforce a supplier role.</div>`,2,4,'Database design');
const db3=page('Data dictionary • Orders, tracking and feedback',rows([
['<b>Sale</b>: supplierId; buyerId; productId','ObjectId R → Profile / Product','Order parties and purchased product.'],
['quantity; total','Number R ≥ 1; Number R ≥ 0','Ordered amount and order total.'],
['deliveryAddress; deliveryTown; contactPhone; notes','String, trimmed','Delivery and buyer instructions.'],
['status; soldAt','String enum; Date default now','pending / confirmed / completed / cancelled; sale timestamp.'],
['paymentMethod','String; default Cash on Delivery (COD)','New-order route accepts COD and GCash.'],
['payment.status','String enum','cod / pending / approved / rejected.'],
['payment.gcashName; gcashPhone; gcashReference; qrUrl','String','Payer details, reference and QR snapshot URL.'],
['payment.proof; proofType','Buffer, excluded by default; String','Private receipt bytes and media type.'],
['payment.submittedAt; reviewedAt; reviewNote','Date; Date; String','Submission, review time and rejection/review reason.'],
['<b>TrackingPoint</b>: orderId; latitude; longitude; accuracy; recordedAt','ObjectId R; Number; Number; Number; Date default now','Logical order link and reported GPS fix. No timestamps option.'],
['<b>Feedback</b>: developerEmail; name; email; message','String R for all fields','Independent feedback. Emails lowercase; sender fields trimmed.']
])+`<div class="note small"><b>Embedded payment:</b> the payment object belongs to Sale; there is no separate Payment collection. <b>Derived tracking number:</b> <code>CD-</code> plus uppercase order ID is added during serialization; it is not a stored schema field.</div><p class="small muted" style="margin-top:13px">Payment subfield names after the first field remain under <code>payment</code>. Tracking coordinates are validated by the location route in addition to their basic Number schema types.</p>`,3,4,'Database design');
const db4=page('Indexes, integrity and storage lifecycle',table(['Model','Declared indexes beyond the automatic _id index'],[
['Profile','role; town; email (unique); facebookId (unique, sparse); googleId (unique, sparse).'],
['Product','name; category; supplierId.'],
['Sale','supplierId; soldAt.'],
['Message','conversationId.'],
['TrackingPoint','orderId.'],
['Conversation / Feedback','No additional indexes explicitly declared in their schemas.']
])+`<div class="grid" style="margin-top:18px"><div class="card"><h3>Transactional order rules</h3><ul class="small"><li>Confirmation atomically deducts available product stock and updates order status using a MongoDB transaction.</li><li>Cancelling a confirmed order restores its stock. Pending cancellation does not change stock.</li><li>Closed orders cannot reopen; completion requires confirmation. GCash approval gates confirmation and completion.</li><li>MongoDB Atlas or another replica set is required for these transaction paths.</li></ul></div><div class="card"><h3>Media and deletion behavior</h3><ul class="small"><li>Cloudinary stores product, QR and profile images; documents retain their URLs.</li><li>Payment receipts are stored in Sale as binary buffers, excluded from ordinary projections and order JSON.</li><li>Account deletion explicitly removes related messages, conversations, sales, products and the profile.</li><li>The inspected deletion route does not remove TrackingPoint records or Cloudinary assets. MongoDB references do not cascade automatically.</li></ul></div></div><div class="note small"><b>Design scope:</b> this document describes the current schema and route behavior. Declared indexes were read from code; their presence in a live database was not inspected. Future database changes should address orphan cleanup and query-driven indexing separately.</div><p class="small muted" style="margin-top:13px">Sources: backend/server.js (schemas, order routes, receipt access and account deletion); backend/order-status.js; backend/payment.js; PAYMENTS.md; TRACKING.md. Collection names follow Mongoose model naming defaults: profiles, products, sales, conversations, messages, trackingpoints and feedbacks.</p>`,4,4,'Database design');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 for(const [name,title,pages] of [['UML-Use-Case','UML Use Case',[use1,use2,use3]],['Database-Design','Database Design',[db1,db2,db3,db4]]]){
  const base=path.join(__dirname,`Chain-Daan-${name}`);
  fs.writeFileSync(base+'.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>Chain Daan — ${title}</title><style>${css}</style>${pages.join('')}</html>`);
  const tab=await browser.newPage({viewport:{width:1123,height:794}});
  await tab.goto('file:///'+(base+'.html').replaceAll('\\','/'));
  const layout=await tab.locator('.page').evaluateAll(ps=>ps.map(p=>({overflow:p.scrollHeight>p.clientHeight,contentBottom:Math.max(...[...p.children].filter(e=>!e.classList.contains('footer')).map(e=>e.getBoundingClientRect().bottom-p.getBoundingClientRect().top)),footerTop:p.querySelector('.footer').getBoundingClientRect().top-p.getBoundingClientRect().top})));
  if(layout.some(p=>p.overflow||p.contentBottom>p.footerTop-8))throw Error('Page layout overflow: '+JSON.stringify(layout));
  await tab.pdf({path:base+'.pdf',format:'A4',landscape:true,printBackground:true,preferCSSPageSize:true});
  for(let i=0;i<pages.length;i++)await tab.locator('.page').nth(i).screenshot({path:base+`-preview-${i+1}.png`});
  const pdf=fs.readFileSync(base+'.pdf');console.log(JSON.stringify({name,pages:(pdf.toString('latin1').match(/\/Type \/Page\b/g)||[]).length,bytes:pdf.length,layout}));
  await tab.close();
 }
 await browser.close();
})();
