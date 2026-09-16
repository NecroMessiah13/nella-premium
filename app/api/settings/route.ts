import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { heroFromRows } from "@/lib/hero";

export async function GET() {
  const rows = await prisma.siteSetting.findMany();
  return NextResponse.json(heroFromRows(rows));
}