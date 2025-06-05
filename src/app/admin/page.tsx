'use client';
import { useSession } from "next-auth/react";

export const AdminPage = () => {

  const { data: session, status } = useSession();
  console.log(session?.user);

  return <>
  <p>Hello</p>
  </>
}

export default AdminPage;