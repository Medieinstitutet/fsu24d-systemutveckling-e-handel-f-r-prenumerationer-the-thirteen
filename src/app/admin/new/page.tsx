'use client';
import axios from "axios";
import { ChangeEvent, FormEvent, useState } from "react"

export default function AdminNew () {

  const [form, setForm] = useState({title: "", body: "", imageUrl: "", accessLevel: "free" });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({...form, [e.target.name]: e.target.value})
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await axios.post("/api/articles", form)
    } catch (error) {
      console.log(error);
    }
  }

  return <>
    <div className="w-[50rem] m-auto bg-black rounded-xl shadow-xl p-15 mt-20">
    <form className="w-[100%] m-auto flex flex-col gap-10 items-center" onSubmit={handleSubmit}>
      <div className="w-[100%] flex flex-col">
        <label className="text-white font-bold">Title</label>
        <br />
        <input type="text" name="title" required className="h-[4dvh] text-black bg-white p-2" onChange={handleChange}/>
      </div>

      <div className="w-[100%] flex flex-col">
        <label className="text-white font-bold">Body</label>
        <br />
        <textarea name="body" className="h-[25dvh] text-black bg-white p-2" onChange={handleChange}></textarea>
      </div>

      <div className="w-[100%] flex flex-col">
        <label className="text-white font-bold">Image url</label>
        <br />
        <input type="text" name="imageUrl" required className="h-[4dvh] text-black bg-white p-2" onChange={handleChange}/>
      </div>

      <div className="w-[100%] flex flex-col">
        <label className="text-white font-bold">Subscription tier</label>
        <select name="accessLevel" className="bg-white p-2 font-bold" onChange={handleChange}>
          <option value="free" className="font-bold">Free</option>
          <option value="basic" className="font-bold">Basic</option>
          <option value="pro" className="font-bold">Pro</option>
          <option value="premium" className="font-bold">Premium</option>
        </select>
      </div>
      <button className="border border-white w-[80%] rounded-xl text-black bg-white font-bold text-xl p-1">Upload</button>
    </form>
  </div>
  </>
}