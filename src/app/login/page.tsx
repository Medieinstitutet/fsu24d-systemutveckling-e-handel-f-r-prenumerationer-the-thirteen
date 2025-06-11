'use client';
import { signIn } from "next-auth/react";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

const LoginPage = () => {

  const [form, setForm] = useState({email: "", password: ""});
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({...form, [e.target.name]: e.target.value});
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      ...form,
      redirect: false
    });

    if (res?.ok) {
      router.push("/");
    } else {
      alert("Failed")
    }
  }

  return <>
  <div className="w-[30rem] m-auto bg-black rounded-xl shadow-xl p-15 mt-20">
    <form className="w-[100%] m-auto flex flex-col gap-10 items-center" onSubmit={handleSubmit}>
      <div className="w-[100%] flex flex-col">
        <label className="text-white font-bold">Email</label>
        <br />
        <input type="email" name="email" required className="h-[4dvh] text-black bg-white p-2" onChange={handleChange}/>
      </div>

      <div className="w-[100%] flex flex-col">
        <label className="text-white font-bold">Password</label>
        <br />
        <input type="password" name="password" required className="h-[4dvh] text-black bg-white p-2" onChange={handleChange}/>
      </div>

      <Link href="/register" className="text-white font-bold">Don't have an account?</Link>
      <button className="border border-white w-[80%] rounded-xl text-black bg-white font-bold p-1 text-xl">Log in</button>
    </form>
  </div>
  </>
}

export default LoginPage;