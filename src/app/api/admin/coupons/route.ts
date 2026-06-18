import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const createSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  product_id: z.string().uuid().nullable().optional(),
  uses_left: z.number().int().min(-1).default(1),
  expires_at: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

function getSvc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수 누락");
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key);
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = getSvc();
  const { data, error } = await svc
    .from("coupons")
    .select("id, code, uses_left, expires_at, note, product_id, created_at, products(name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: data });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값 오류", detail: parsed.error.flatten() }, { status: 400 });
  }

  const svc = getSvc();
  const { data, error } = await svc
    .from("coupons")
    .insert({
      code: parsed.data.code,
      product_id: parsed.data.product_id ?? null,
      uses_left: parsed.data.uses_left,
      expires_at: parsed.data.expires_at ?? null,
      note: parsed.data.note ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 존재하는 쿠폰 코드입니다." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ coupon: data });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  const svc = getSvc();
  const { error } = await svc.from("coupons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
