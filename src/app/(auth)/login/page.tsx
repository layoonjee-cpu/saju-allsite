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
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirect") ?? "/mypage";
  const hasError = search.get("error") === "callback";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("로그인되었습니다");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="container py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>계정에 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasError && (
            <p className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2">
              로그인 중 오류가 발생했습니다. 다시 시도해 주세요.
            </p>
          )}

          {/* 카카오 로그인 */}
          <KakaoLoginButton redirectTo={redirectTo} />

          {/* 구분선 */}
          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">또는 이메일로</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* 이메일 / 비밀번호 */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "로그인 중..." : "이메일로 로그인"}
            </Button>
            <div className="flex justify-between text-sm">
              <Link href={`/signup?redirect=${encodeURIComponent(redirectTo)}`} className="text-muted-foreground hover:text-foreground">
                회원가입
              </Link>
              <Link href="/reset" className="text-muted-foreground hover:text-foreground">
                비밀번호 재설정
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
