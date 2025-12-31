import { createGatewayOnEdgeRuntime } from "@lobehub/chat-plugins-gateway";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS(req: NextRequest) {
  return createGatewayOnEdgeRuntime()(req);
}

export async function POST(req: Request) {
  return createGatewayOnEdgeRuntime()(req);
}
