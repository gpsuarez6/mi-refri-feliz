const STORAGE_KEY="mi-refri-feliz-v1";
const categoryMeta={
  fridge:{name:"Refrigerador",emoji:"❄️"},
  pantry:{name:"Despensa",emoji:"🥫"},
  cleaning:{name:"Aseo",emoji:"🧼"}
};
const starterItems=[
  {id:"milk",name:"Leche",category:"fridge",emoji:"🥛",qty:2,unit:"litros",price:2400,inStock:true,checked:false},
  {id:"eggs",name:"Huevos",category:"fridge",emoji:"🥚",qty:12,unit:"unidades",price:3990,inStock:true,checked:false},
  {id:"cheese",name:"Queso",category:"fridge",emoji:"🧀",qty:1,unit:"paquete",price:4500,inStock:false,checked:false},
  {id:"yogurt",name:"Yogur",category:"fridge",emoji:"🥣",qty:6,unit:"unidades",price:3000,inStock:true,checked:false},
  {id:"rice",name:"Arroz",category:"pantry",emoji:"🍚",qty:2,unit:"kilos",price:3200,inStock:true,checked:false},
  {id:"noodles",name:"Fideos",category:"pantry",emoji:"🍝",qty:3,unit:"paquetes",price:2700,inStock:false,checked:false},
  {id:"oil",name:"Aceite",category:"pantry",emoji:"🫗",qty:1,unit:"botella",price:2990,inStock:true,checked:false},
  {id:"beans",name:"Legumbres",category:"pantry",emoji:"🫘",qty:2,unit:"paquetes",price:3200,inStock:true,checked:false},
  {id:"detergent",name:"Detergente ropa",category:"cleaning",emoji:"🧴",qty:1,unit:"botella",price:6490,inStock:false,checked:false},
  {id:"paper",name:"Papel higiénico",category:"cleaning",emoji:"🧻",qty:12,unit:"rollos",price:6990,inStock:true,checked:false},
  {id:"dishsoap",name:"Lavalozas",category:"cleaning",emoji:"🧽",qty:1,unit:"botella",price:1890,inStock:true,checked:false}
];
let items=loadItems();
let currentCategory="all";
let currentView="home";
let deferredInstallPrompt=null;
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const money=value=>new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(Number(value)||0);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

function loadItems(){
  try{
    const stored=JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored)&&stored.length?stored:structuredClone(starterItems);
  }catch{return structuredClone(starterItems)}
}
function saveItems(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(items));
  renderAll();
}
function missing(){return items.filter(item=>!item.inStock)}
function showToast(message){
  const toast=$("#toast");toast.textContent=message;toast.classList.add("show");
  clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2200);
}
function renderAll(){
  renderSummary();renderZones();renderInventory();renderShopping();
}
function renderSummary(){
  const absent=missing();
  const total=absent.reduce((sum,item)=>sum+(Number(item.price)||0),0);
  $("#missingCount").textContent=absent.length;
  $("#missingTotal").textContent=money(total);
  $("#navBadge").textContent=absent.length;
  $("#navBadge").style.display=absent.length?"grid":"none";
  $("#heroMessage").textContent=absent.length?absent.length===1?"Hay 1 producto esperando en tu lista.":`Hay ${absent.length} productos esperando en tu lista.`:"¡Tienes todo lo necesario en casa!";
}
function renderZones(){
  $("#zoneCards").innerHTML=Object.entries(categoryMeta).map(([key,meta])=>{
    const group=items.filter(item=>item.category===key);
    const absent=group.filter(item=>!item.inStock).length;
    return `<button class="zone-card" data-zone="${key}">
      <span class="zone-emoji">${meta.emoji}</span>
      <div><strong>${meta.name}</strong><small>${group.length} productos · ${absent?absent+" faltante"+(absent>1?"s":""):"todo disponible"}</small></div><b>›</b>
    </button>`;
  }).join("");
  $$("[data-zone]").forEach(button=>button.addEventListener("click",()=>{
    currentCategory=button.dataset.zone;syncTabs();navigate("inventory");
  }));
}
function renderInventory(){
  const term=$("#searchInput").value.trim().toLocaleLowerCase("es");
  const filtered=items.filter(item=>(currentCategory==="all"||item.category===currentCategory)&&item.name.toLocaleLowerCase("es").includes(term));
  $("#inventoryList").innerHTML=filtered.length?filtered.map(item=>`<article class="product-card ${item.inStock?"":"missing"}">
    <span class="product-emoji">${escapeHTML(item.emoji||"📦")}</span>
    <div class="product-info"><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(categoryMeta[item.category]?.name||"Otro")} · ${escapeHTML(item.qty)} ${escapeHTML(item.unit)}</small></div>
    <button class="stock-button" data-stock="${item.id}">${item.inStock?"Disponible":"Se acabó"}</button>
    <button class="edit-button" data-edit="${item.id}" aria-label="Editar ${escapeHTML(item.name)}">⋮</button>
  </article>`).join(""):`<div class="empty-state"><span>🔎</span><h3>No encontramos productos</h3><p>Cambia el filtro o agrega un producto nuevo.</p></div>`;
  $$("[data-stock]").forEach(button=>button.addEventListener("click",()=>toggleStock(button.dataset.stock)));
  $$("[data-edit]").forEach(button=>button.addEventListener("click",()=>openProductDialog(button.dataset.edit)));
}
function renderShopping(){
  const absent=missing();
  const total=absent.filter(item=>!item.checked).reduce((sum,item)=>sum+(Number(item.price)||0),0);
  $("#shoppingTotal").textContent=money(total);
  $("#shoppingSubtitle").textContent=`${absent.filter(i=>!i.checked).length} producto${absent.filter(i=>!i.checked).length===1?"":"s"} por comprar`;
  $("#shoppingList").innerHTML=absent.length?absent.map(item=>`<article class="shopping-item ${item.checked?"purchased":""}">
    <input class="shop-check" data-check="${item.id}" type="checkbox" ${item.checked?"checked":""} aria-label="Marcar ${escapeHTML(item.name)}">
    <div class="shop-main"><span class="shop-name">${escapeHTML(item.emoji||"📦")} ${escapeHTML(item.name)}</span><span class="shop-meta">${escapeHTML(item.qty)} ${escapeHTML(item.unit)} · ${escapeHTML(categoryMeta[item.category]?.name||"")}</span></div>
    <div class="shop-price"><span>${money(item.price)}</span><br><input data-price="${item.id}" type="number" min="0" step="10" value="${Number(item.price)||0}" aria-label="Precio de ${escapeHTML(item.name)}"></div>
  </article>`).join(""):`<div class="empty-state"><span>🎉</span><h3>¡Lista vacía!</h3><p>No falta nada en casa. Tu refri está feliz.</p></div>`;
  $$("[data-check]").forEach(input=>input.addEventListener("change",()=>{
    const item=items.find(i=>i.id===input.dataset.check);if(item){item.checked=input.checked;saveItems()}
  }));
  $$("[data-price]").forEach(input=>input.addEventListener("change",()=>{
    const item=items.find(i=>i.id===input.dataset.price);if(item){item.price=Math.max(0,Number(input.value)||0);saveItems()}
  }));
  $("#selectAll").checked=absent.length>0&&absent.every(item=>item.checked);
  $("#restockBtn").disabled=!absent.some(item=>item.checked);
  $("#restockBtn").style.opacity=$("#restockBtn").disabled?".5":"1";
}
function toggleStock(id){
  const item=items.find(item=>item.id===id);if(!item)return;
  item.inStock=!item.inStock;item.checked=false;saveItems();
  showToast(item.inStock?`${item.name} vuelve al inventario`:`${item.name} se agregó a compras`);
}
function navigate(view){
  currentView=view;
  $$(".view").forEach(section=>section.classList.toggle("active",section.id===view+"View"));
  $$(".nav-item").forEach(button=>button.classList.toggle("active",button.dataset.view===view));
  $(".floating-add").classList.toggle("hidden",view==="settings"||view==="shopping");
  window.scrollTo({top:0,behavior:"smooth"});
  if(view==="shopping")renderShopping();
}
function syncTabs(){
  $$(".tab").forEach(tab=>tab.classList.toggle("active",tab.dataset.category===currentCategory));
}
function openProductDialog(id=null){
  $("#productForm").reset();$("#productId").value="";$("#productEmoji").value="📦";$("#productQty").value=1;$("#productUnit").value="unidad";$("#productStock").checked=true;
  $("#deleteProductBtn").classList.add("hidden");$("#dialogTitle").textContent="Nuevo producto";
  if(id){
    const item=items.find(item=>item.id===id);if(!item)return;
    $("#dialogTitle").textContent="Editar producto";$("#productId").value=item.id;$("#productName").value=item.name;
    $("#productCategory").value=item.category;$("#productEmoji").value=item.emoji;$("#productQty").value=item.qty;
    $("#productUnit").value=item.unit;$("#productPrice").value=item.price;$("#productStock").checked=item.inStock;
    $("#deleteProductBtn").classList.remove("hidden");
  }else if(currentCategory!=="all")$("#productCategory").value=currentCategory;
  $("#productDialog").showModal();setTimeout(()=>$("#productName").focus(),100);
}
function closeProductDialog(){ $("#productDialog").close() }
function submitProduct(event){
  event.preventDefault();
  const id=$("#productId").value;
  const data={
    name:$("#productName").value.trim(),category:$("#productCategory").value,
    emoji:$("#productEmoji").value.trim()||"📦",qty:Math.max(.1,Number($("#productQty").value)||1),
    unit:$("#productUnit").value.trim()||"unidad",price:Math.max(0,Number($("#productPrice").value)||0),
    inStock:$("#productStock").checked,checked:false
  };
  if(id){const index=items.findIndex(item=>item.id===id);items[index]={...items[index],...data}}
  else items.unshift({id:uid(),...data});
  closeProductDialog();saveItems();showToast(id?"Producto actualizado":"Producto agregado");
}
function deleteProduct(){
  const id=$("#productId").value;const item=items.find(i=>i.id===id);if(!item)return;
  if(confirm(`¿Eliminar “${item.name}” definitivamente?`)){items=items.filter(i=>i.id!==id);closeProductDialog();saveItems();showToast("Producto eliminado")}
}
async function shareList(){
  const absent=missing();if(!absent.length){showToast("Tu lista está vacía");return}
  const text=["🛒 Mi Refri Feliz","",...absent.map(i=>`• ${i.name}: ${i.qty} ${i.unit} — ${money(i.price)}`),"",`Total estimado: ${money(absent.reduce((s,i)=>s+(Number(i.price)||0),0))}`].join("\n");
  try{if(navigator.share)await navigator.share({title:"Lista de compras",text});else{await navigator.clipboard.writeText(text);showToast("Lista copiada")}}catch(error){if(error.name!=="AbortError")showToast("No se pudo compartir")}
}
function exportData(){
  const blob=new Blob([JSON.stringify({app:"Mi Refri Feliz",version:1,exportedAt:new Date().toISOString(),items},null,2)],{type:"application/json"});
  const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`mi-refri-feliz-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(link.href);showToast("Respaldo creado");
}
async function importData(event){
  const file=event.target.files[0];if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());const incoming=Array.isArray(parsed)?parsed:parsed.items;
    if(!Array.isArray(incoming))throw new Error("Formato inválido");
    items=incoming.filter(i=>i&&i.id&&i.name&&categoryMeta[i.category]).map(i=>({...i,price:Number(i.price)||0,qty:Number(i.qty)||1,inStock:Boolean(i.inStock),checked:false}));
    if(!items.length)throw new Error("Sin productos");saveItems();showToast("Respaldo importado");
  }catch{showToast("El archivo no es un respaldo válido")}finally{event.target.value=""}
}
function showInstallHelp(){
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  $("#installInstructions").innerHTML=ios
    ?"En Safari, toca el botón <strong>Compartir</strong> (cuadrado con flecha) y luego <strong>Agregar a inicio</strong>."
    :"Abre el menú del navegador y selecciona <strong>Instalar aplicación</strong> o <strong>Agregar a pantalla de inicio</strong>.";
  $("#infoDialog").showModal();
}
async function requestInstall(){
  if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null}
  else showInstallHelp();
}
$$(".nav-item").forEach(button=>button.addEventListener("click",()=>navigate(button.dataset.view)));
$$("[data-go]").forEach(button=>button.addEventListener("click",()=>navigate(button.dataset.go)));
$$("[data-add]").forEach(button=>button.addEventListener("click",()=>openProductDialog()));
$$("[data-close]").forEach(button=>button.addEventListener("click",closeProductDialog));
$$("[data-info-close]").forEach(button=>button.addEventListener("click",()=>$("#infoDialog").close()));
$$(".tab").forEach(tab=>tab.addEventListener("click",()=>{currentCategory=tab.dataset.category;syncTabs();renderInventory()}));
$("#searchInput").addEventListener("input",renderInventory);
$("#productForm").addEventListener("submit",submitProduct);
$("#deleteProductBtn").addEventListener("click",deleteProduct);
$("#shareBtn").addEventListener("click",shareList);
$("#exportBtn").addEventListener("click",exportData);
$("#importInput").addEventListener("change",importData);
$("#resetBtn").addEventListener("click",()=>{if(confirm("¿Restaurar los productos de ejemplo? Se reemplazará tu inventario actual.")){items=structuredClone(starterItems);saveItems();showToast("Datos restaurados")}});
$("#selectAll").addEventListener("change",event=>{missing().forEach(item=>item.checked=event.target.checked);saveItems()});
$("#clearChecked").addEventListener("click",()=>{missing().forEach(item=>item.checked=false);saveItems()});
$("#restockBtn").addEventListener("click",()=>{
  const bought=missing().filter(item=>item.checked);if(!bought.length)return;
  bought.forEach(item=>{item.inStock=true;item.checked=false});saveItems();showToast(`${bought.length} producto${bought.length===1?" repuesto":"s repuestos"}`);
});
$("#installBtn").addEventListener("click",requestInstall);
$("#installSettingsBtn").addEventListener("click",requestInstall);
window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event});
window.addEventListener("appinstalled",()=>showToast("¡Mi Refri Feliz fue instalada!"));
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
renderAll();syncTabs();
