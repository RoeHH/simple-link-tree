import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { User } from "https://raw.githubusercontent.com/RoeHH/fresh_oauth2/21c31455a31691a837ebe09fb91ac5f96d2de38d/oauth2Plugin.d.ts";

interface Props {
  name: string;
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
          'location': new URL(req.url).origin + "/oauth2/login",
        },
      }); 
    }
    const kv = await Deno.openKv();

    let listName = (await kv.get([ctx.state.user.id, "listName"])).value || "List Name";

    const { searchParams } = new URL(req.url);
    const newListName = searchParams.get("listName");
    const name = searchParams.getAll("name");
    const url = searchParams.getAll("url");

    if (newListName?.length !== 0 && newListName) {
      kv.set([ctx.state.user.id, "listName"], newListName);
      const elements = await kv.list({ prefix: [ctx.state.user.id, listName]});
      for await (const element of elements) {        
        kv.delete([ctx.state.user.id, listName, element.value.name]);
        kv.set([ctx.state.user.id, newListName, element.value.name], element.value);
      }
      listName = newListName;
    }    
    
    if (!(!(url.length === 0 && name.length === 0) &&
        (url.length === 0 && name.length === 0) && 
        (url.length !== name.length))
    ){
      for(let i = 0; i < name.length; i++) {
        if(name[i] !== "" || url[i] !== "") {                  
          kv.set([ctx.state.user.id, listName, name[i]], {name: name[i], href: url[i]});
        }
      }
    } 

    return ctx.render({name: listName});
  },
};

export default function Add({data}: PageProps<Props>) { 
  return (
    <>
    <Head>
      <title>Add {data.name}</title>
    </Head>
    <h1><a href="/" class="header">Add link to {"<"}{data.name}{">"}</a></h1>
    <form action="/add" method="get">
      <label for="listName">List Name:</label>
      <input type="text" name="listName" value={data.name}/>
      <label for="name">Name</label>
      <input type="text" name="name" placeholder="Name" required={true}/>
      <label for="url">URL</label>
      <input type="text" name="url" placeholder="URL" required={true}/>
      <input type="submit" value="Add" />
    </form>
    </>
  );
}
