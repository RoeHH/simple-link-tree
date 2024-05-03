import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { User } from "https://raw.githubusercontent.com/RoeHH/fresh_oauth2/21c31455a31691a837ebe09fb91ac5f96d2de38d/oauth2Plugin.d.ts";

interface Props {
  name: string;
  links: { href: string; name: string }[];
}

interface State {
  user: User | undefined;
}

export const handler: Handlers<Props, State> = {
  async GET(req, ctx) {
    if (!ctx.state.user) {
      return new Response(undefined, {
        status: 302,
        headers: {
          'location': new URL(req.url).href + "/oauth2/login",
        },
      }); 
    }
    const kv = await Deno.openKv();

    const listName = (await kv.get([ctx.state.user.id, "listName"])).value || "List Name";

    const list = [];
    const elements = await kv.list({ prefix: [ctx.state.user.id, listName]});
    for await (const element of elements) {
      list.push(element.value);
    }

    return ctx.render({links: list, name: listName});
  },
};

export default function Home({data}: PageProps<Props>) {
  return (
    <>
    <Head>
      <title>{data.name}</title>
    </Head>
    <h1><a href="/add" class="header">{data.name}</a></h1>
    <ul>
      {data.links.map((link) => (
        <li>
          <a href={link.href}>{link.name}</a>
        </li>
      ))}
    </ul>
    </>
  );
}
