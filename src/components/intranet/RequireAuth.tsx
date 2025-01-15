"use client";

import { setUser } from "@/redux/slices/userSlice";
import { useAppDispatch } from "@/redux/stores";
import { getMe, isTokenExpired } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { set } from "react-hook-form";

function RequireAuth({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showPage, setShowPage] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token && !isTokenExpired(token)) {
        const user = await getMe(token);
        dispatch(setUser(user));
        setShowPage(true);
      } else {
        if (localStorage.getItem("token")) {
          localStorage.removeItem("token");
        }
        setShowPage(false);
        router.push("..");
      }
    };
    checkAuth();
  }, [dispatch, router]);

  return (
    <>
      {showPage ? (
        children
      ) : (
        <div className="h-screen w-full flex items-center justify-center">
          <span className="loading loading-ring loading-lg" />
        </div>
      )}
    </>
  );
}

export default RequireAuth;
