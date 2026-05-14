import { handlers } from "@/lib/auth";
import { type NextRequest } from "next/server";

const originalGet = handlers.GET;
const originalPost = handlers.POST;

async function wrappedGet(req: NextRequest) {
  try {
    const res = await originalGet(req);
    return res;
  } catch (err) {
    console.error("[AUTH_ROUTE_GET_ERROR]", err);
    throw err;
  }
}

async function wrappedPost(req: NextRequest) {
  try {
    const res = await originalPost(req);
    return res;
  } catch (err) {
    console.error("[AUTH_ROUTE_POST_ERROR]", err);
    throw err;
  }
}

export const GET = wrappedGet;
export const POST = wrappedPost;
