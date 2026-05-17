import { NextRequest, NextResponse } from "next/server"

const PASSWORD = process.env.BASIC_AUTH_PASSWORD;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

async function lookupIP(ip: string) {
  const res = await fetch(`https://ipapi.co/${ip}/json/`);
  const data = await res.json();

  return data;
}

export default async function middleware(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for');
  let region: any;

  if(ipAddress != null)
  {
    region = (<any>await lookupIP(ipAddress));
  }

  // only require authentication if the password is set in the environment variables
  if (!PASSWORD) {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get("authorization");

  if (basicAuth && region.get("region_code") != "TX") {
    const authValue = basicAuth.split(" ")[1];
    const [user, pwd] = atob(authValue).split(":");

    if (user === "" && pwd === PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="Protected", charset="UTF-8"`,
    },
  });
}

