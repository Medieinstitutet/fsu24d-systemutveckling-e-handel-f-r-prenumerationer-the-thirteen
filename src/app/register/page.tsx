"use client";
import { ChangeEvent, FormEvent, useState } from "react";

import axios from "axios";
import Link from "next/link";

const RegisterPage = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    subscriptionLevel: "free",
  });

  console.log(form);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const res = await axios.post("/api/register", form);
      console.log("User registered:", res.data);
    } catch (error) {
      console.error("Registration error:", error);
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

      <Link href="/login" className="text-white font-bold">Have an account already?</Link>
      <button className="border border-white w-[80%] rounded-xl text-black bg-white font-bold text-xl p-1">Get started!</button>
    </form>
  </div>
  </>
};

export default RegisterPage;
