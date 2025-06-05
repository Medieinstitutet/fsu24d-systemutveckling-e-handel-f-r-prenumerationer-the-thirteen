'use client';
import axios from "axios";
import { useSession } from "next-auth/react";
import { ChangeEvent, FormEvent, useState } from "react";

export const AdminPage = () => {

  const { data: session, status } = useSession();
  const [form, setForm] = useState({title: "", body: "", accessLevel: "free"});
  console.log(form);

  const handleChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({...form, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await axios.post("/api/articles", form);
    } catch (error) {
      console.log(error);
    };
  };

  return <>
  <div className="m-auto w-[80%]">
    <form className="m-auto w-[40%] flex flex-col gap-3" onSubmit={handleSubmit}>
      <label>Title</label>
      <input type="text" className="border w-[80%]" name="title" onChange={handleChange}/>
      <label>Body</label>
      <textarea className="border w-full h-40 resize-none" name="body" onChange={handleChange}></textarea>
      <label>Subscription tier</label>
      <select className="border w-[20%] p-1" name="accessLevel" onChange={handleChange}>
        <option value={"free"}>Free</option>
        <option value={"basic"}>Basic</option>
        <option value={"pro"}>Pro</option>
        <option value={"premium"}>Premium</option>
      </select>
      <button type="submit" className="border w-[30%] m-auto mt-10">Post</button>
    </form>
  </div>
  </>
}

export default AdminPage;