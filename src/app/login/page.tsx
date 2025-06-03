'use client';
import { signIn, signOut } from "next-auth/react";
import "../globals.css";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useState } from "react";

const LoginPage = () => {

  const [form, setForm] = useState({email: "", password: ""});

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
      alert("Yippie");
    } else {
      alert("Failed")
    }
  }

  return <>
  <div>
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded"
      />
      <button
        type="submit"
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Login
      </button>
    </form>
  </div>
  </>
}

export default LoginPage;