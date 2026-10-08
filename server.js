require('dotenv').config();
const express=require('express');
const path=require('path');
const crypto=require('crypto');
const app=express();
app.use(express.json());
const products={
 chamas:{title:'Entre Chamas e Escamas',subtitle:'História completa',price:5.00},
 noite:{title:'O Segredo da Noite',subtitle:'História completa',price:7.00},
 amanha:{title:'Depois do Amanhã',subtitle:'História completa',price:5.00}
};
app.post('/api/create-checkout',async(req,res)=>{
 try{
  if(!process.env.MP_ACCESS_TOKEN) return res.status(500).json({error:'Mercado Pago ainda não configurado.'});
  const {productId,email}=req.body||{};
  const p=products[productId];
  if(!p||!email) return res.status(400).json({error:'Produto ou e-mail inválido.'});
  const body={type:'online',processing_mode:'manual',capture_mode:'automatic',total_amount:p.price.toFixed(2),external_reference:`site_${productId}_${crypto.randomUUID()}`,description:p.title,payer:{email},items:[{title:p.title,unit_price:p.price.toFixed(2),quantity:1,unit_measure:'unit',total_amount:p.price.toFixed(2)}]};
  const r=await fetch('https://api.mercadopago.com/v1/orders',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.MP_ACCESS_TOKEN}`,'X-Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(body)});
  const data=await r.json();
  if(!r.ok) return res.status(502).json({error:'Mercado Pago recusou a criação do checkout.',details:data});
  const checkoutUrl=data?.checkout_url||data?.config?.checkout_url;
  if(!checkoutUrl) return res.status(502).json({error:'Mercado Pago não retornou o link de checkout.',details:data});
  res.json({checkout_url:checkoutUrl,order_id:data.id});
 }catch(e){res.status(500).json({error:'Erro no servidor.'});}
});
app.get('/sucesso',(req,res)=>res.sendFile(path.join(__dirname,'resultado.html')));
app.get('/cancelado',(req,res)=>res.sendFile(path.join(__dirname,'resultado.html')));
app.get('/pendente',(req,res)=>res.sendFile(path.join(__dirname,'resultado.html')));
app.use(express.static(__dirname));
app.listen(process.env.PORT||3000,()=>console.log('Site online'));
