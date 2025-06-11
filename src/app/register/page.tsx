"use client";
import { ChangeEvent, FormEvent, useState } from "react";

import axios from "axios";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const RegisterPage = () => {
  const [form, setForm] = useState({email: "", password: "", subscriptionLevel: "free"});
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await axios.post("/api/register", form);
      const response = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password
      })

      if (response?.ok) {
        router.push("/");
      } else {
        setError("Login failed after registration.");
      }
      setError("");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error;
      if (errorMessage === "User already exists") {
        setError("User already exists.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

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

      <div className="w-[100%] flex flex-col">
        <label className="text-white font-bold">Subscription tier</label>
        <select name="subscriptionLevel" className="bg-white p-2 font-bold" onChange={handleChange}>
          <option value="free" className="font-bold">Free</option>
          <option value="basic" className="font-bold">Basic</option>
          <option value="pro" className="font-bold">Pro</option>
          <option value="premium" className="font-bold">Premium</option>
        </select>
      </div>
      {error && <p className="text-white italic">{error}</p>}

      <Link href="/login" className="text-white font-bold">Have an account already?</Link>
      <button className="border border-white w-[80%] rounded-xl text-black bg-white font-bold text-xl p-1">Get started!</button>
    </form>
  </div>
  </>
};

export default RegisterPage;
