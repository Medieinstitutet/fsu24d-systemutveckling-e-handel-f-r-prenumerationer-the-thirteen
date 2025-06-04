'use client';
import { ChangeEvent, FormEvent, useState } from 'react';

import axios from "axios";

const RegisterPage = () => {

  const [form, setForm] = useState({email: "", password: "", subscriptionLevel: "free"});

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({...form, [e.target.name]: e.target.value});
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      axios.post("/api/register", form);
    } catch (error) {
      console.log(error);
    }
  }

  return <>
  <div className='max-w-md mx-auto mt-10 p-6 border rounded-xl shadow'>
    <h3 className='font-bold mb-4 text-2xl'>Register</h3>
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label>Email</label>
      <br/>
      <input type="email" name="email" required onChange={handleChange}/>
      <br/>
      <label>Password</label>
      <br/>
      <input type="password" name="password" required onChange={handleChange} />
      <br/>
      <label>Subscription Level</label>
      <br/>
      <select name="subscriptionLevel" value={form.subscriptionLevel} onChange={handleChange}>
        <option value="free">free</option>
        <option value="basic">basic</option>
        <option value="pro">pro</option>
        <option value="premium">premium</option>
      </select>
      <br/>
      <button type="submit" className='w-40 bg-blue-600 text-white rounded'>Register</button>
    </form>
  </div>
  </>
}

export default RegisterPage;