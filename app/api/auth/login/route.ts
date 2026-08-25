import {NextResponse} from "next/server";
import {ensureAdmin,adminLogin} from "@/lib/auth";

export async function POST(r:Request){
  const b=await r.json();
  await ensureAdmin();
  const u=await adminLogin(String(b.email||'').trim().toLowerCase(),String(b.password||''));
  if(!u)return NextResponse.json({error:'Неверный email или пароль'},{status:401});
  return NextResponse.json({user:{id:u.id,email:u.email,role:u.role}});
}
