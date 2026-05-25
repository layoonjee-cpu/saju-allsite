"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicEnv } from "@/lib/env";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirect") ?? "/mypage";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("가입 완료! 마이페이지로 이동합니다.");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="container py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>간편하게 가입하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 카카오 가입 */}
          <KakaoLoginButton redirectTo={redirectTo} label="카카오로 가입하기" />

          {/* 구분선 */}
          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">또는 이메일로</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* 이메일 가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 (8자 이상)</Label>
              <Input
                id="password"
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "가입 중..." : "이메일로 가입하기"}
            </Button>
            <p className="text-sm text-center">
              이미 계정이 있으신가요?{" "}
              <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-primary hover:underline">
                로그인
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
