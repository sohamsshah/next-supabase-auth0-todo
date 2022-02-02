import styles from "../styles/Home.module.css";
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { getSupabase } from "../utils/supabase";
import Link from "next/link";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";

const Index = ({ user, ...props }) => {
  const { mutate } = useSWRConfig();

  // fetch data function from supabase
  const fetcher = async () => {
    const supabase = getSupabase(user.accessToken);
    const { data, error } = await supabase.from("todo").select("*");
    return { data, error };
  };

  // data fetching by SWR
  const { data } = useSWR("fetch-all-todos", fetcher, {
    fallbackData: props,
  });
  console.log(data);
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const supabase = getSupabase(user.accessToken);
    await supabase.from("todo").insert({ content, user_id: user.sub });
    // explicitly mutate when post request happens
    mutate("fetch-all-todos");
    setContent("");
  };

  return (
    <div className={styles.container}>
      <p>
        Welcome {user.name}!{" "}
        <Link href="/api/auth/logout">
          <a>Logout</a>
        </Link>
      </p>
      <form onSubmit={handleSubmit}>
        <input onChange={(e) => setContent(e.target.value)} value={content} />
        <button>Add</button>
      </form>
      {data.data && data.data.length > 0 ? (
        data.data.map((todo) => <p key={todo.id}>{todo.content}</p>)
      ) : (
        <p>You have completed all todos!</p>
      )}
    </div>
  );
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps({ req, res }) {
    const {
      user: { accessToken },
    } = await getSession(req, res);

    const supabase = getSupabase(accessToken);

    // data fetching on the server side and sending as a fallback to client
    const { data: todos } = await supabase.from("todo").select("*");

    return {
      props: { todos },
    };
  },
});

export default Index;
